#!/usr/bin/env python3
"""Mindly - local server (standard library only, localhost only)."""
import json, os, re, shutil, sys, threading, uuid, webbrowser
sys.dont_write_bytecode = True
from datetime import datetime, timezone
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, unquote, quote

BASE = os.path.dirname(sys.executable) if getattr(sys, 'frozen', False) else os.path.dirname(os.path.abspath(__file__))
SITE = os.path.join(getattr(sys, '_MEIPASS', BASE), 'static')
PROJ = os.path.join(BASE, 'projects')
# Preferences live in projects/preferences.json (next to the maps, so they travel with them).
PREFS = os.path.join(PROJ, 'preferences.json')
MAXPREFS = 8 * 1024 * 1024  # includes the shared copy/paste clipboard (key mClip)
PREFS_LOCK = threading.Lock()  # several browser tabs may save preferences at the same time
HOST, PORT = '127.0.0.1', 8765
MAXB = 25 * 1024 * 1024
MAXPAGES = 100
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


SUFFIX = '_Mindly'


def folder_name(name):
    """Project folder name: NAME_Mindly (suffix always last, capital M)."""
    base = clean(re.sub(r'(_mindly)+$', '', str(name or '').strip(), flags=re.I))
    return base[:60 - len(SUFFIX)].rstrip('. ') + SUFFIX


def unique(base):
    n, i = base, 2
    stem = base[:-len(SUFFIX)] if base.endswith(SUFFIX) else base
    while os.path.exists(os.path.join(PROJ, n)):
        n = '%s_%d%s' % (stem, i, SUFFIX)  # suffix stays last: NAME_2_Mindly
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
    # Pages: the top-level nodes/links/view are the ACTIVE page; the other pages are listed here.
    # The active page's entry carries only id + name (its data is the top-level one).
    if 'pages' in p:
        pages = p['pages']
        if not isinstance(pages, list) or not 1 <= len(pages) <= MAXPAGES or not all(isinstance(x, dict) for x in pages):
            raise Err(400, 'invalid_project')
        nn, nl = len(p['nodes']), len(p['links'])
        for x in pages:
            for k in ('nodes', 'links'):
                if k in x and (not isinstance(x[k], list) or not all(isinstance(i, dict) for i in x[k])):
                    raise Err(400, 'invalid_project')
            nn += len(x.get('nodes', []))
            nl += len(x.get('links', []))
        if nn > 20000 * 5 or nl > 50000 * 5:
            raise Err(400, 'invalid_project')
        clean_pages = []
        for x in pages:
            e = {'id': str(x.get('id', ''))[:64], 'name': str(x.get('name', ''))[:60]}
            for k in ('nodes', 'links'):
                if k in x:
                    e[k] = x[k]
            if isinstance(x.get('view'), dict):
                e['view'] = x['view']
            clean_pages.append(e)
        out['pages'] = clean_pages
        out['activePage'] = str(p.get('activePage', ''))[:64]
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
    folder = unique(folder_name(name))
    p = os.path.join(PROJ, folder)
    os.makedirs(p)
    t = now()
    meta = {'id': uuid.uuid4().hex, 'name': name, 'created': t, 'modified': t, 'version': 1, 'app': 'Mindly'}
    jwrite(p, 'project.json', proj)
    jwrite(p, 'metadata.json', meta)
    return {'id': folder, 'metadata': meta, 'project': proj}


def _trash_windows(path):
    """Windows: send to the Recycle Bin (SHFileOperationW + FOF_ALLOWUNDO)."""
    import ctypes

    class SHFILEOPSTRUCTW(ctypes.Structure):
        _pack_ = 1 if ctypes.sizeof(ctypes.c_void_p) == 4 else 8
        _fields_ = [('hwnd', ctypes.c_void_p), ('wFunc', ctypes.c_uint),
                    ('pFrom', ctypes.c_void_p), ('pTo', ctypes.c_void_p),
                    ('fFlags', ctypes.c_ushort), ('fAnyOperationsAborted', ctypes.c_int),
                    ('hNameMappings', ctypes.c_void_p), ('lpszProgressTitle', ctypes.c_void_p)]

    src = ctypes.create_unicode_buffer(os.path.abspath(path) + '\0')  # double-null terminated
    op = SHFILEOPSTRUCTW()
    op.wFunc = 3  # FO_DELETE
    op.pFrom = ctypes.addressof(src)
    op.fFlags = 0x40 | 0x10 | 0x4 | 0x400  # ALLOWUNDO | NOCONFIRMATION | SILENT | NOERRORUI
    if ctypes.windll.shell32.SHFileOperationW(ctypes.byref(op)) != 0 or op.fAnyOperationsAborted:
        raise OSError('recycle bin failed')


def _unique_in(folder, name):
    base, ext = os.path.splitext(name)
    n, i = name, 2
    while os.path.lexists(os.path.join(folder, n)):
        n = '%s %d%s' % (base, i, ext)
        i += 1
    return n


def _trash_mac(path):
    folder = os.path.expanduser('~/.Trash')
    shutil.move(path, os.path.join(folder, _unique_in(folder, os.path.basename(path))))


def _trash_linux(path):
    """Linux: freedesktop.org Trash specification (~/.local/share/Trash)."""
    root = os.path.join(os.environ.get('XDG_DATA_HOME') or os.path.expanduser('~/.local/share'), 'Trash')
    files, info = os.path.join(root, 'files'), os.path.join(root, 'info')
    os.makedirs(files, exist_ok=True)
    os.makedirs(info, exist_ok=True)
    name = _unique_in(files, os.path.basename(path))
    with open(os.path.join(info, name + '.trashinfo'), 'w', encoding='utf-8') as fh:
        fh.write('[Trash Info]\nPath=%s\nDeletionDate=%s\n' % (
            quote(os.path.abspath(path)), datetime.now().strftime('%Y-%m-%dT%H:%M:%S')))
    shutil.move(path, os.path.join(files, name))


def to_trash(path):
    """Move a project folder to the computer's Recycle Bin / Trash (never a permanent delete)."""
    try:
        if sys.platform.startswith('win'):
            _trash_windows(path)
        elif sys.platform == 'darwin':
            _trash_mac(path)
        else:
            _trash_linux(path)
    except Exception:
        raise Err(500, 'trash_failed')
    if os.path.exists(path):
        raise Err(500, 'trash_failed')


def prefs_route(m, body):
    if m == 'GET':
        try:
            with open(PREFS, encoding='utf-8') as fh:
                d = json.load(fh)
            return 200, d if isinstance(d, dict) else {}
        except (OSError, ValueError):
            return 200, {}
    if m == 'POST':
        # Merge: {"set": {key: value}, "remove": [key]}. Each tab sends only the keys it changed,
        # so several tabs never overwrite each other's preferences.
        st, rm = body.get('set', {}), body.get('remove', [])
        if (not isinstance(st, dict) or not isinstance(rm, list)
                or not all(isinstance(k, str) and isinstance(x, str) for k, x in st.items())
                or not all(isinstance(k, str) for k in rm)):
            raise Err(400, 'invalid_prefs')
        os.makedirs(PROJ, exist_ok=True)
        with PREFS_LOCK:
            try:
                with open(PREFS, encoding='utf-8') as fh:
                    d = json.load(fh)
                if not isinstance(d, dict):
                    d = {}
            except (OSError, ValueError):
                d = {}
            d.update(st)
            for k in rm:
                d.pop(k, None)
            if len(json.dumps(d)) > MAXPREFS:
                raise Err(400, 'invalid_prefs')
            tmp = PREFS + '.tmp'
            with open(tmp, 'w', encoding='utf-8') as fh:
                json.dump(d, fh, ensure_ascii=False, indent=1)
            os.replace(tmp, PREFS)
        return 200, {'ok': True}
    if m == 'PUT':
        os.makedirs(PROJ, exist_ok=True)
        if not all(isinstance(k, str) and isinstance(v, str) for k, v in body.items()) or len(json.dumps(body)) > MAXPREFS:
            raise Err(400, 'invalid_prefs')
        with PREFS_LOCK:
            tmp = PREFS + '.tmp'
            with open(tmp, 'w', encoding='utf-8') as fh:
                json.dump(body, fh, ensure_ascii=False, indent=1)
            os.replace(tmp, PREFS)
        return 200, {'ok': True}
    raise Err(404, 'not_found')


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
            to_trash(p)  # Recycle Bin, not a permanent delete
            return 200, {'ok': True}
    elif len(parts) == 2 and m == 'GET' and parts[1] == 'path':
        return 200, {'path': pdir(parts[0])}  # full path of the project folder
    elif len(parts) == 2 and m == 'POST' and parts[1] in ('rename', 'duplicate'):
        p = pdir(parts[0])
        name = re.sub(r'[\x00-\x1f]', '', str(body.get('name') or '')).strip()[:60]
        folder = folder_name(name)
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
            if len(parts) < 2 or parts[1] not in ('projects', 'prefs'):
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
            if parts[1] == 'prefs':
                code, obj = prefs_route(method, body)
            else:
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


def open_browser(url):
    """Open the browser only once the server is actually accepting connections."""
    import socket, time
    deadline = time.time() + 10
    while time.time() < deadline:
        try:
            with socket.create_connection((HOST, PORT), timeout=0.5):
                webbrowser.open(url)
                return
        except OSError:
            time.sleep(0.15)


if __name__ == '__main__':
    os.makedirs(PROJ, exist_ok=True)
    try:  # the copy/paste clipboard is temporary: start with an empty one
        with open(PREFS, encoding='utf-8') as fh:
            _d = json.load(fh)
        if isinstance(_d, dict) and _d.pop('mClip', None) is not None:
            prefs_route('PUT', _d)
    except (OSError, ValueError):
        pass
    url = 'http://%s:%d/' % (HOST, PORT)
    try:
        srv = ThreadingHTTPServer((HOST, PORT), H)
    except OSError:
        print('Port %d is busy: another copy of Mindly is already running.' % PORT)
        print('Close its window (or the old python.exe) and start this one again.')
        print('This copy lives in: ' + BASE)
        webbrowser.open(url)
        sys.exit(1)
    # Open the website automatically as soon as the server is ready.
    threading.Thread(target=open_browser, args=(url,), daemon=True).start()
    print('Mindly -> ' + url)
    print('Folder: ' + BASE)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass