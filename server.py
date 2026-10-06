#!/usr/bin/env python3
"""Mindly - local server (standard library only, localhost only)."""
import json, os, re, shutil, sys, threading, uuid, webbrowser
sys.dont_write_bytecode = True
from datetime import datetime, timezone
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, unquote

BASE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.join(BASE, 'website')
PROJ = os.path.join(BASE, 'projects')
HOST, PORT = '127.0.0.1', 8765
MAXB = 25 * 1024 * 1024
BAD = r'[<>:"/\\|?*\x00-\x1f]'
RESERVED = re.compile(r'^(con|prn|aux|nul|com[0-9]|lpt[0-9])$', re.I)


class Err(Exception):
    def __init__(self, code, msg):
        self.code, self.msg = code, msg


def now():
    return datetime.now(timezone.utc).isoformat(timespec='seconds')


def clean(name):
    if not isinstance(name, str):
        raise Err(400, 'invalid_name')
    n = re.sub(BAD, '', name).strip()[:60].rstrip('. ')
    if not n or RESERVED.match(n.split('.')[0].strip()):
        raise Err(400, 'invalid_name')
    return n


def unique(base):
    n, i = base, 2
    while os.path.exists(os.path.join(PROJ, n)):
        n = '%s_%d' % (base, i)
        i += 1
    return n


def pdir(pid):
    if not isinstance(pid, str) or not pid or pid in ('.', '..') or re.search(BAD, pid):
        raise Err(400, 'invalid_name')
    p = os.path.realpath(os.path.join(PROJ, pid))
    if os.path.normcase(os.path.dirname(p)) != os.path.normcase(os.path.realpath(PROJ)) or not os.path.isdir(p):
        raise Err(404, 'not_found')
    return p


def jread(p, f):
    with open(os.path.join(p, f), encoding='utf-8') as fh:
        return json.load(fh)


def jwrite(p, f, o):
    tmp = os.path.join(p, f + '.tmp')
    with open(tmp, 'w', encoding='utf-8') as fh:
        json.dump(o, fh, ensure_ascii=False, indent=1)
    os.replace(tmp, os.path.join(p, f))


def check(p):
    if not isinstance(p, dict) or not isinstance(p.get('nodes'), list) or not isinstance(p.get('links'), list):
        raise Err(400, 'invalid_project')
    if len(p['nodes']) > 20000 or len(p['links']) > 50000 or not all(isinstance(x, dict) for x in p['nodes'] + p['links']):
        raise Err(400, 'invalid_project')
    out = {'version': 1, 'nodes': p['nodes'], 'links': p['links'],
           'settings': p['settings'] if isinstance(p.get('settings'), dict) else {}}
    if isinstance(p.get('view'), dict):
        out['view'] = p['view']
    return out


def listing():
    out = []
    for d in os.listdir(PROJ):
        p = os.path.join(PROJ, d)
        try:
            if os.path.isdir(p):
                m = jread(p, 'metadata.json')
                out.append({'id': d, 'name': m.get('name', d), 'created': m.get('created', ''), 'modified': m.get('modified', '')})
        except Exception:
            pass
    return out


def create(name, proj):
    name = re.sub(r'[\x00-\x1f]', '', str(name or '')).strip()[:60]
    folder = unique(clean(name))
    p = os.path.join(PROJ, folder)
    os.makedirs(p)
    t = now()
    meta = {'id': uuid.uuid4().hex, 'name': name, 'created': t, 'modified': t, 'version': 1, 'app': 'Mindly'}
    jwrite(p, 'project.json', proj)
    jwrite(p, 'metadata.json', meta)
    return {'id': folder, 'metadata': meta, 'project': proj}


def route(m, parts, body):
    if not parts:
        if m == 'GET':
            return 200, {'projects': listing()}
        if m == 'POST':
            proj = check(body['project']) if 'project' in body else {'version': 1, 'nodes': [], 'links': [], 'settings': {}}
            return 201, create(body.get('name'), proj)
    elif len(parts) == 1:
        p = pdir(parts[0])
        if m == 'GET':
            return 200, {'id': parts[0], 'metadata': jread(p, 'metadata.json'), 'project': jread(p, 'project.json')}
        if m == 'PUT':
            proj = check(body.get('project'))
            jwrite(p, 'project.json', proj)
            meta = jread(p, 'metadata.json')
            meta['modified'] = now()
            jwrite(p, 'metadata.json', meta)
            return 200, {'modified': meta['modified']}
        if m == 'DELETE':
            shutil.rmtree(p)
            return 200, {'ok': True}
    elif len(parts) == 2 and m == 'POST' and parts[1] in ('rename', 'duplicate'):
        p = pdir(parts[0])
        name = re.sub(r'[\x00-\x1f]', '', str(body.get('name') or '')).strip()[:60]
        folder = clean(name)
        meta = jread(p, 'metadata.json')
        if parts[1] == 'rename':
            new = parts[0]
            if os.path.normcase(folder) != os.path.normcase(parts[0]):
                new = unique(folder)
                os.rename(p, os.path.join(PROJ, new))
            p = os.path.join(PROJ, new)
            meta['name'] = name
            meta['modified'] = now()
            jwrite(p, 'metadata.json', meta)
            return 200, {'id': new, 'metadata': meta}
        new = unique(folder)
        np_ = os.path.join(PROJ, new)
        shutil.copytree(p, np_)
        t = now()
        meta.update({'id': uuid.uuid4().hex, 'name': name, 'created': t, 'modified': t})
        jwrite(np_, 'metadata.json', meta)
        return 201, {'id': new, 'metadata': meta}
    raise Err(404, 'not_found')


class H(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html'}

    def __init__(self, *a, **k):
        super().__init__(*a, directory=SITE, **k)

    def log_message(self, *a):
        pass

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def send_json(self, code, obj):
        b = json.dumps(obj, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(b)))
        self.end_headers()
        self.wfile.write(b)

    def api(self, method):
        try:
            if self.headers.get('Host', '').split(':')[0] not in ('127.0.0.1', 'localhost'):
                raise Err(403, 'forbidden')
            parts = [unquote(x) for x in urlparse(self.path).path.split('/') if x]
            if len(parts) < 2 or parts[1] != 'projects':
                raise Err(404, 'not_found')
            body = {}
            if method in ('POST', 'PUT'):
                n = int(self.headers.get('Content-Length') or 0)
                if n > MAXB:
                    raise Err(413, 'too_large')
                try:
                    body = json.loads(self.rfile.read(n) or b'{}')
                except ValueError:
                    raise Err(400, 'bad_json')
                if not isinstance(body, dict):
                    raise Err(400, 'bad_json')
            code, obj = route(method, parts[2:], body)
        except Err as e:
            code, obj = e.code, {'error': e.msg}
        except Exception:
            code, obj = 500, {'error': 'error'}
        self.send_json(code, obj)

    def do_GET(self):
        if self.path.startswith('/api/'):
            self.api('GET')
        else:
            super().do_GET()

    def do_POST(self):
        self.api('POST') if self.path.startswith('/api/') else self.send_error(404)

    def do_PUT(self):
        self.api('PUT') if self.path.startswith('/api/') else self.send_error(404)

    def do_DELETE(self):
        self.api('DELETE') if self.path.startswith('/api/') else self.send_error(404)


if __name__ == '__main__':
    os.makedirs(PROJ, exist_ok=True)
    url = 'http://%s:%d/' % (HOST, PORT)
    try:
        srv = ThreadingHTTPServer((HOST, PORT), H)
    except OSError:
        print('Port %d is busy: another copy of Mindly is already running.' % PORT)
        print('Close its window (or the old python.exe) and start this one again.')
        print('This copy lives in: ' + BASE)
        if '--open' in sys.argv:
            webbrowser.open(url)
        sys.exit(1)
    if '--open' in sys.argv:
        threading.Timer(0.8, webbrowser.open, [url]).start()
    print('Mindly -> ' + url)
    print('Folder: ' + BASE)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass
