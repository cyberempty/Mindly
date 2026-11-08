'use strict';
/* Mindly - desktop launcher (Electron). Replaces server.py: same API, same files on disk.
   Portable: projects/ lives next to this file. Nothing is written anywhere else
   (the browser engine's cache goes to the system temp folder). */
const { app, BrowserWindow, Menu, shell, session, dialog, screen } = require('electron');
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const BASE = __dirname;
const SITE = path.join(BASE, 'static');
const PROJ = process.env.MINDLY_PROJECTS ? path.resolve(process.env.MINDLY_PROJECTS) : path.join(BASE, 'projects');
const PREFS = path.join(PROJ, 'preferences.json');
const MAXPREFS = 8 * 1024 * 1024;
const MAXB = 25 * 1024 * 1024;
const MAXPAGES = 100;
const BAD = /[<>:"/\\|?*\x00-\x1f]/;
const BAD_G = /[<>:"/\\|?*\x00-\x1f]/g;
const RESERVED = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i;
const SUFFIX = '_Mindly';
const WIN = process.platform === 'win32';
const normcase = (s) => (WIN ? s.toLowerCase() : s);

/* ---- keep the browser engine's own files out of the portable folder ---- */
/* The program is always called "Mindly" (capital M), in the title bar, taskbar, Dock and window list. */
app.setName('Mindly');
process.title = 'Mindly';
const profile = path.join(os.tmpdir(), 'Mindly-' + crypto.createHash('md5').update(BASE).digest('hex').slice(0, 8));
app.setPath('userData', profile);
app.setPath('sessionData', profile);
if (process.platform === 'linux') {
  app.commandLine.appendSwitch('no-sandbox');
  app.commandLine.appendSwitch('class', 'Mindly'); /* X11 window class */
  app.setDesktopName('Mindly.desktop'); /* Wayland app id: matches the Mindly.desktop entry made by start-linux.sh */
}
app.commandLine.appendSwitch('disable-features', 'Translate,AutofillServerCommunication');

/* ====================================================================
 * Helpers ported 1:1 from server.py
 * ==================================================================== */
class Err extends Error {
  constructor(code, msg) {
    super(msg);
    this.code = code;
    this.msg = msg;
  }
}
const isObj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const now = () => new Date().toISOString().replace(/\.\d+Z$/, '+00:00');
const trimEnd = (s) => s.replace(/[. ]+$/, '');

function clean(name) {
  if (typeof name !== 'string') throw new Err(400, 'invalid_name');
  const n = trimEnd(name.replace(BAD_G, '').trim().slice(0, 60));
  if (!n || RESERVED.test(n.split('.')[0].trim())) throw new Err(400, 'invalid_name');
  return n;
}
function folderName(name) {
  const base = clean(String(name || '').trim().replace(/(_mindly)+$/i, ''));
  return trimEnd(base.slice(0, 60 - SUFFIX.length)) + SUFFIX;
}
function unique(base) {
  let n = base;
  let i = 2;
  const stem = base.endsWith(SUFFIX) ? base.slice(0, -SUFFIX.length) : base;
  while (fs.existsSync(path.join(PROJ, n))) n = `${stem}_${i++}${SUFFIX}`;
  return n;
}
function pdir(pid) {
  if (typeof pid !== 'string' || !pid || pid === '.' || pid === '..' || BAD.test(pid)) throw new Err(400, 'invalid_name');
  let p;
  try {
    p = fs.realpathSync(path.join(PROJ, pid));
    if (normcase(path.dirname(p)) !== normcase(fs.realpathSync(PROJ)) || !fs.statSync(p).isDirectory()) throw 0;
  } catch (e) {
    throw new Err(404, 'not_found');
  }
  return p;
}
const jread = (p, f) => JSON.parse(fs.readFileSync(path.join(p, f), 'utf-8'));
function jwrite(p, f, o) {
  const tmp = path.join(p, f + '.tmp');
  fs.writeFileSync(tmp, JSON.stringify(o, null, 1), 'utf-8');
  fs.renameSync(tmp, path.join(p, f));
}
function check(p) {
  if (!isObj(p) || !Array.isArray(p.nodes) || !Array.isArray(p.links)) throw new Err(400, 'invalid_project');
  if (p.nodes.length > 20000 || p.links.length > 50000 || ![...p.nodes, ...p.links].every(isObj)) throw new Err(400, 'invalid_project');
  const out = { version: 1, nodes: p.nodes, links: p.links, settings: isObj(p.settings) ? p.settings : {} };
  if (isObj(p.view)) out.view = p.view;
  if ('pages' in p) {
    const pages = p.pages;
    if (!Array.isArray(pages) || pages.length < 1 || pages.length > MAXPAGES || !pages.every(isObj)) throw new Err(400, 'invalid_project');
    let nn = p.nodes.length;
    let nl = p.links.length;
    for (const x of pages) {
      for (const k of ['nodes', 'links']) if (k in x && (!Array.isArray(x[k]) || !x[k].every(isObj))) throw new Err(400, 'invalid_project');
      nn += (x.nodes || []).length;
      nl += (x.links || []).length;
    }
    if (nn > 20000 * 5 || nl > 50000 * 5) throw new Err(400, 'invalid_project');
    out.pages = pages.map((x) => {
      const e = { id: String(x.id ?? '').slice(0, 64), name: String(x.name ?? '').slice(0, 60) };
      for (const k of ['nodes', 'links']) if (k in x) e[k] = x[k];
      if (isObj(x.view)) e.view = x.view;
      return e;
    });
    out.activePage = String(p.activePage ?? '').slice(0, 64);
  }
  return out;
}
function listing() {
  const out = [];
  for (const d of fs.readdirSync(PROJ)) {
    const p = path.join(PROJ, d);
    try {
      if (fs.statSync(p).isDirectory()) {
        const m = jread(p, 'metadata.json');
        out.push({ id: d, name: m.name ?? d, created: m.created ?? '', modified: m.modified ?? '' });
      }
    } catch (e) {}
  }
  return out;
}
function create(name, proj) {
  name = String(name || '').replace(/[\x00-\x1f]/g, '').trim().slice(0, 60);
  const folder = unique(folderName(name));
  const p = path.join(PROJ, folder);
  fs.mkdirSync(p, { recursive: true });
  const t = now();
  const meta = { id: crypto.randomBytes(16).toString('hex'), name, created: t, modified: t, version: 1, app: 'Mindly' };
  jwrite(p, 'project.json', proj);
  jwrite(p, 'metadata.json', meta);
  return { id: folder, metadata: meta, project: proj };
}
/* Recycle Bin / Trash of the system; if that is not available, projects/.trash (never a permanent delete). */
async function toTrash(p) {
  try {
    await shell.trashItem(p);
  } catch (e) {
    try {
      const dir = path.join(PROJ, '.trash');
      fs.mkdirSync(dir, { recursive: true });
      let n = path.basename(p);
      let i = 2;
      while (fs.existsSync(path.join(dir, n))) n = `${path.basename(p)} ${i++}`;
      fs.renameSync(p, path.join(dir, n));
    } catch (e2) {
      throw new Err(500, 'trash_failed');
    }
  }
  if (fs.existsSync(p)) throw new Err(500, 'trash_failed');
}

function readPrefs() {
  try {
    const d = JSON.parse(fs.readFileSync(PREFS, 'utf-8'));
    return isObj(d) ? d : {};
  } catch (e) {
    return {};
  }
}
function writePrefs(d) {
  fs.mkdirSync(PROJ, { recursive: true });
  const tmp = PREFS + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(d, null, 1), 'utf-8');
  fs.renameSync(tmp, PREFS);
}
const allStr = (o) => Object.values(o).every((v) => typeof v === 'string');
function prefsRoute(m, body) {
  if (m === 'GET') return [200, readPrefs()];
  if (m === 'POST') {
    const st = body.set === undefined ? {} : body.set;
    const rm = body.remove === undefined ? [] : body.remove;
    if (!isObj(st) || !Array.isArray(rm) || !allStr(st) || !rm.every((k) => typeof k === 'string')) throw new Err(400, 'invalid_prefs');
    const d = readPrefs();
    Object.assign(d, st);
    for (const k of rm) delete d[k];
    if (JSON.stringify(d).length > MAXPREFS) throw new Err(400, 'invalid_prefs');
    writePrefs(d);
    return [200, { ok: true }];
  }
  if (m === 'PUT') {
    if (!allStr(body) || JSON.stringify(body).length > MAXPREFS) throw new Err(400, 'invalid_prefs');
    writePrefs(body);
    return [200, { ok: true }];
  }
  throw new Err(404, 'not_found');
}

async function route(m, parts, body) {
  if (!parts.length) {
    if (m === 'GET') return [200, { projects: listing() }];
    if (m === 'POST') {
      const proj = 'project' in body ? check(body.project) : { version: 1, nodes: [], links: [], settings: {} };
      return [201, create(body.name, proj)];
    }
  } else if (parts.length === 1) {
    const p = pdir(parts[0]);
    if (m === 'GET') return [200, { id: parts[0], metadata: jread(p, 'metadata.json'), project: jread(p, 'project.json') }];
    if (m === 'PUT') {
      const proj = check(body.project);
      jwrite(p, 'project.json', proj);
      const meta = jread(p, 'metadata.json');
      meta.modified = now();
      jwrite(p, 'metadata.json', meta);
      return [200, { modified: meta.modified }];
    }
    if (m === 'DELETE') {
      await toTrash(p);
      return [200, { ok: true }];
    }
  } else if (parts.length === 2 && m === 'GET' && parts[1] === 'path') {
    return [200, { path: pdir(parts[0]) }];
  } else if (parts.length === 2 && m === 'POST' && (parts[1] === 'rename' || parts[1] === 'duplicate')) {
    let p = pdir(parts[0]);
    const name = String(body.name || '').replace(/[\x00-\x1f]/g, '').trim().slice(0, 60);
    const folder = folderName(name);
    const meta = jread(p, 'metadata.json');
    if (parts[1] === 'rename') {
      let nw = parts[0];
      if (normcase(folder) !== normcase(parts[0])) {
        nw = unique(folder);
        fs.renameSync(p, path.join(PROJ, nw));
      }
      p = path.join(PROJ, nw);
      meta.name = name;
      meta.modified = now();
      jwrite(p, 'metadata.json', meta);
      return [200, { id: nw, metadata: meta }];
    }
    const nw = unique(folder);
    const np = path.join(PROJ, nw);
    fs.cpSync(p, np, { recursive: true });
    const t = now();
    Object.assign(meta, { id: crypto.randomBytes(16).toString('hex'), name, created: t, modified: t });
    jwrite(np, 'metadata.json', meta);
    return [201, { id: nw, metadata: meta }];
  }
  throw new Err(404, 'not_found');
}

/* ====================================================================
 * Local HTTP server (127.0.0.1, random free port, only for this app)
 * ==================================================================== */
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};
function send(res, code, obj) {
  const b = Buffer.from(JSON.stringify(obj), 'utf-8');
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': b.length, 'Cache-Control': 'no-store' });
  res.end(b);
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let n = 0;
    req.on('data', (c) => {
      n += c.length;
      if (n > MAXB) {
        reject(new Err(413, 'too_large'));
        req.destroy();
      } else chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', () => reject(new Err(400, 'bad_json')));
  });
}
async function api(req, res, port) {
  try {
    const host = String(req.headers.host || '').split(':')[0];
    if (host !== '127.0.0.1' && host !== 'localhost') throw new Err(403, 'forbidden');
    const origin = req.headers.origin;
    if (origin && origin !== `http://127.0.0.1:${port}` && origin !== `http://localhost:${port}`) throw new Err(403, 'forbidden');
    const u = new URL(req.url, 'http://127.0.0.1');
    const parts = u.pathname.split('/').filter(Boolean).map(decodeURIComponent);
    if (parts.length < 2 || !['projects', 'prefs'].includes(parts[1])) throw new Err(404, 'not_found');
    let body = {};
    if (req.method === 'POST' || req.method === 'PUT') {
      if (!String(req.headers['content-type'] || '').includes('application/json')) throw new Err(415, 'bad_json');
      const raw = await readBody(req);
      try {
        body = JSON.parse(raw.length ? raw.toString('utf-8') : '{}');
      } catch (e) {
        throw new Err(400, 'bad_json');
      }
      if (!isObj(body)) throw new Err(400, 'bad_json');
    }
    const [code, obj] = parts[1] === 'prefs' ? prefsRoute(req.method, body) : await route(req.method, parts.slice(2), body);
    send(res, code, obj);
  } catch (e) {
    if (e instanceof Err) send(res, e.code, { error: e.msg });
    else send(res, 500, { error: 'error' });
  }
}
function serveStatic(req, res) {
  let rel;
  try {
    rel = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
  } catch (e) {
    res.writeHead(400);
    return res.end();
  }
  if (rel === '/') rel = '/index.html';
  const file = path.normalize(path.join(SITE, rel));
  if (file !== SITE && !file.startsWith(SITE + path.sep)) {
    res.writeHead(403);
    return res.end();
  }
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Cache-Control': 'no-store' });
      return res.end('Not found');
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Content-Length': data.length,
      'Cache-Control': 'no-store',
    });
    res.end(req.method === 'HEAD' ? undefined : data);
  });
}
function startServer() {
  return new Promise((resolve, reject) => {
    const srv = http.createServer((req, res) => {
      if (req.url.startsWith('/api/')) api(req, res, srv.address().port);
      else if (req.method === 'GET' || req.method === 'HEAD') serveStatic(req, res);
      else {
        res.writeHead(404);
        res.end();
      }
    });
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => resolve(srv.address().port));
  });
}

/* ====================================================================
 * Window state: size, position, maximized and full screen are remembered inside projects/preferences.json (key mWindow)
 * ==================================================================== */
const WKEY = 'mWindow'; /* the window state lives inside projects/preferences.json, as a JSON string */
const OLD_WSTATE = path.join(PROJ, 'window.json'); /* older versions: read once, then removed */
let wstate = {};
function parseWin(d) {
  const b = d && d.bounds;
  const num = (v) => typeof v === 'number' && isFinite(v);
  return {
    maximized: !!(d && d.maximized),
    fullscreen: !!(d && d.fullscreen),
    bounds: b && num(b.width) && num(b.height) && b.width >= 400 && b.height >= 300 ? { x: b.x, y: b.y, width: Math.round(b.width), height: Math.round(b.height) } : null,
  };
}
function loadWinState() {
  wstate = {};
  try {
    const p = readPrefs();
    if (typeof p[WKEY] === 'string') wstate = parseWin(JSON.parse(p[WKEY]));
    else if (fs.existsSync(OLD_WSTATE)) {
      wstate = parseWin(JSON.parse(fs.readFileSync(OLD_WSTATE, 'utf-8')));
      saveWinState();
    }
  } catch (e) {
    wstate = {};
  }
  try {
    fs.rmSync(OLD_WSTATE, { force: true }); /* window.json must not exist: preferences.json is the only file */
  } catch (e) {}
}
function visibleOnSomeScreen(b) {
  if (typeof b.x !== 'number' || typeof b.y !== 'number') return false;
  return screen.getAllDisplays().some((d) => {
    const a = d.workArea;
    return b.x + 100 < a.x + a.width && b.x + b.width - 100 > a.x && b.y + 40 < a.y + a.height && b.y + 40 > a.y - 10;
  });
}
function saveWinState() {
  try {
    const d = readPrefs();
    d[WKEY] = JSON.stringify(wstate);
    writePrefs(d);
  } catch (e) {}
}
function trackState(win) {
  let timer = null;
  const snap = () => {
    if (win.isDestroyed()) return;
    const fsc = win.isFullScreen(),
      mx = win.isMaximized();
    if (!fsc && !mx && !win.isMinimized()) {
      const b = win.getBounds();
      wstate.bounds = { x: b.x, y: b.y, width: b.width, height: b.height };
    }
    wstate.maximized = mx;
    wstate.fullscreen = fsc;
    saveWinState();
  };
  const later = () => {
    clearTimeout(timer);
    timer = setTimeout(snap, 400); /* let the window settle first */
  };
  ['resize', 'move', 'maximize', 'unmaximize', 'enter-full-screen', 'leave-full-screen', 'enter-html-full-screen', 'leave-html-full-screen'].forEach((ev) => win.on(ev, later));
  win.on('close', () => {
    clearTimeout(timer);
    if (!closing.has(win)) snap(); /* first close event: the flags are still the real ones */
  });
}

/* ====================================================================
 * Windows
 * ==================================================================== */
let URL_BASE = '';
const closing = new WeakSet();

function attachClose(win) {
  /* Same safety net as the browser version: flush unsaved changes before the window goes away. */
  win.on('close', (e) => {
    if (closing.has(win) || win.isDestroyed()) return;
    e.preventDefault();
    closing.add(win);
    const done = () => {
      if (!win.isDestroyed()) win.destroy();
    };
    const timer = setTimeout(done, 4000);
    win.webContents
      .executeJavaScript('typeof save === "function" ? save(true) : true')
      .catch(() => {})
      .finally(() => {
        clearTimeout(timer);
        done();
      });
  });
  /* Allow the window to close even if the page asked for a confirmation (autosave already ran above). */
  win.webContents.on('will-prevent-unload', (e) => e.preventDefault());
}

let mainWin = null;
function openWindow(url) {
  const icon = path.join(SITE, WIN ? 'icon.ico' : 'icon.png');
  const first = !mainWin || mainWin.isDestroyed(); /* only the first window restores (and keeps) the saved state */
  const saved = first && wstate.bounds ? wstate.bounds : null;
  const win = new BrowserWindow({
    width: saved ? saved.width : 1400,
    height: saved ? saved.height : 900,
    ...(saved && visibleOnSomeScreen(saved) ? { x: saved.x, y: saved.y } : {}),
    minWidth: 760,
    minHeight: 480,
    show: false,
    title: 'Mindly',
    autoHideMenuBar: true,
    backgroundColor: '#1a1b1e',
    icon: fs.existsSync(icon) ? icon : undefined,
    webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false, spellcheck: false },
  });
  /* the title is always just "Mindly" (the page title would add "v5") */
  win.on('page-title-updated', (e) => {
    e.preventDefault();
    win.setTitle('Mindly');
  });
  win.once('ready-to-show', () => {
    if (first && wstate.maximized) win.maximize();
    win.show();
  });
  if (first) {
    mainWin = win;
    trackState(win);
    if (wstate.fullscreen) {
      /* the editor uses the page's own full screen mode (F11), so ask the page for it: F11 then leaves it normally */
      win.webContents.once('did-finish-load', () => {
        win.webContents.executeJavaScript('document.documentElement.requestFullscreen().catch(function(){})', true).catch(() => {});
      });
    }
  }
  win.webContents.setVisualZoomLevelLimits(1, 1);
  attachClose(win);
  win.loadURL(url).catch(() => {});
  return win;
}

app.on('web-contents-created', (_e, wc) => {
  /* "New browser tab" and ↗ in the app open another Mindly window; external links go to the system browser. */
  wc.setWindowOpenHandler(({ url }) => {
    if (url.startsWith(URL_BASE)) {
      setImmediate(() => openWindow(url));
    } else if (/^https?:\/\//i.test(url)) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });
  wc.on('will-navigate', (e, url) => {
    if (!url.startsWith(URL_BASE)) {
      e.preventDefault();
      if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    }
  });
});

function buildMenu() {
  if (process.platform === 'darwin') {
    Menu.setApplicationMenu(
      Menu.buildFromTemplate([
        { label: 'Mindly', submenu: [{ role: 'about' }, { type: 'separator' }, { role: 'hide' }, { role: 'hideOthers' }, { role: 'unhide' }, { type: 'separator' }, { role: 'quit' }] },
        { label: 'Edit', submenu: [{ role: 'undo' }, { role: 'redo' }, { type: 'separator' }, { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }] },
        { label: 'Window', submenu: [{ role: 'minimize' }, { role: 'zoom' }, { role: 'togglefullscreen' }] },
      ]),
    );
  } else {
    Menu.setApplicationMenu(null);
  }
}

const lock = app.requestSingleInstanceLock();
if (!lock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const w = BrowserWindow.getAllWindows()[0];
    if (w) {
      if (w.isMinimized()) w.restore();
      w.focus();
    } else if (URL_BASE) openWindow(URL_BASE + '/');
  });
  app.whenReady().then(async () => {
    try {
      fs.mkdirSync(PROJ, { recursive: true });
      /* the copy/paste clipboard (mClip) is temporary: start with an empty one */
      const d = readPrefs();
      if ('mClip' in d) {
        delete d.mClip;
        writePrefs(d);
      }
    } catch (e) {
      dialog.showErrorBox('Mindly', 'Cannot write to the projects folder:\n' + PROJ + '\n\nIf Mindly runs from a read-only drive, copy the folder to a writable location.');
    }
    loadWinState();
    const port = await startServer();
    URL_BASE = `http://127.0.0.1:${port}`;
    const ok = new Set(['fullscreen', 'clipboard-read', 'clipboard-sanitized-write']);
    session.defaultSession.setPermissionRequestHandler((_wc, perm, cb) => cb(ok.has(perm)));
    session.defaultSession.setPermissionCheckHandler((_wc, perm) => ok.has(perm));
    buildMenu();
    if (WIN) app.setAppUserModelId('Mindly');
    try {
      const ic = path.join(SITE, 'icon.png');
      if (process.platform === 'darwin' && app.dock && fs.existsSync(ic)) app.dock.setIcon(ic);
    } catch (e) {}
    openWindow(URL_BASE + '/');
    app.on('activate', () => {
      if (!BrowserWindow.getAllWindows().length) openWindow(URL_BASE + '/');
    });
  });
  app.on('window-all-closed', () => app.quit());
}
