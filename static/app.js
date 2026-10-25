/*
 * Mindly - front-end (single file, no dependencies)
 *
 * Sections, in order:
 *    1. i18n
 *    2. state
 *    3. shortcuts
 *    4. geometry & rendering
 *    5. minimap
 *    6. UI build
 *    7. popup / modal
 *    8. history & saving
 *    9. projects
 *   10. editing operations
 *   11. panel
 *   12. floating quick bar
 *   13. view
 *   14. import / export
 *   15. actions
 *   16. canvas interaction
 *   17. init
 *
 * Companion files: index.html (markup), style.css (styles), ../server.py (local API).
 */
/* ==========================================================
 * PREFERENCES: stored in projects/preferences.json (via the local server),
 * not in the browser, so they follow the folder (USB stick, other PC).
 * Several tabs can be open at once: each tab only sends the keys it changed (the server merges
 * them) and tabs tell each other about changes (BroadcastChannel).
 * PS works like localStorage (but nothing is stored in the browser): PS.key = 'value', PS.key, PS.removeItem('key').
 * ========================================================== */
const PS = (() => {
  /* Keys that belong to ONE tab only: never saved to disk, never shared between tabs. */
  const LOCAL = new Set(['mMinimap', 'mLast']);
  let data = {};
  const pending = { set: {}, remove: new Set() }; /* changes not yet written to disk */
  let t = null;
  let chan = null;
  try {
    chan = new BroadcastChannel('mindly-prefs');
  } catch (e) {}
  try {
    const x = new XMLHttpRequest(); /* synchronous: preferences are needed before the UI is built */
    x.open('GET', '/api/prefs', false);
    x.send();
    if (x.status === 200) data = JSON.parse(x.responseText) || {};
  } catch (e) {}
  /* Nothing is kept in the browser: remove anything older versions may have left there. */
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch (e) {}
  /* Only the keys changed by THIS tab are sent: the server merges them into the file, so two
     tabs can never overwrite each other's preferences. */
  const flush = () => {
    clearTimeout(t);
    t = null;
    const body = { set: pending.set, remove: [...pending.remove] };
    if (!Object.keys(body.set).length && !body.remove.length) return;
    pending.set = {};
    pending.remove = new Set();
    try {
      fetch('/api/prefs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        keepalive: true,
      });
    } catch (e) {}
    try {
      chan && chan.postMessage(body);
    } catch (e) {}
  };
  const later = () => {
    clearTimeout(t);
    t = setTimeout(flush, 300);
  };
  const apply = (body) => {
    let changed = false;
    for (const [k, v] of Object.entries(body.set || {}))
      if (!LOCAL.has(k) && !(k in pending.set) && data[k] !== v) (data[k] = v), (changed = true);
    for (const k of body.remove || [])
      if (!LOCAL.has(k) && !pending.remove.has(k) && k in data) delete data[k], (changed = true);
    if (changed && typeof onPrefs === 'function') onPrefs();
  };
  if (chan) chan.onmessage = (e) => e.data && apply(e.data);
  /* safety net (e.g. BroadcastChannel unavailable): re-read the file when the tab regains focus */
  const pull = async () => {
    try {
      const r = await fetch('/api/prefs', { cache: 'no-store' });
      if (!r.ok) return;
      const d = await r.json();
      apply({ set: d, remove: Object.keys(data).filter((k) => !LOCAL.has(k) && !(k in d)) });
    } catch (e) {}
  };
  addEventListener('focus', pull);
  addEventListener('pagehide', () => t && flush());
  return new Proxy(data, {
    get: (o, k) =>
      k === 'flushNow'
        ? flush
        : k === 'removeItem'
        ? (key) => (delete o[key], !LOCAL.has(key) && (delete pending.set[key], pending.remove.add(key), later()))
        : o[k],
    set: (o, k, v) => (
      (o[k] = String(v)),
      !LOCAL.has(k) && ((pending.set[k] = o[k]), pending.remove.delete(k), later()),
      true
    ),
  });
})();
/* called when ANOTHER tab changed a preference (assigned further below) */
let onPrefs = null;

'use strict';
const $ = (s) => document.querySelector(s),
  uid = () => Math.random().toString(36).slice(2, 10),
  esc = (s) =>
    String(s).replace(
      /[&<>"]/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c],
    );
/* ==========================================================
 * I18N
 * ========================================================== */
const D = {};
`a_new|New project
a_open|Open project…
a_newTab|New browser tab
a_save|Save
a_saveas|Save as / duplicate…
a_close|Close project
a_rename|Rename project…
a_export|Export
a_import|Import…
a_importProj|Import a map (JSON, XMind, FreeMind, OPML, Markdown)
a_exportJson|Export JSON
a_exportSvg|Export SVG
a_exportPng|Export PNG
a_exportPdf|Export PDF
a_exportXmind|Export XMind (.xmind)
a_exportFreemind|Export FreeMind (.mm)
a_exportOpml|Export OPML (.opml)
a_exportMd|Export Markdown (.md)
a_undo|Undo
a_redo|Redo
a_redo2|Redo (alternative)
a_copy|Copy
a_cut|Cut
a_paste|Paste
a_dup|Duplicate
a_del|Delete
a_selAll|Select all
a_desel|Deselect / cancel operation
a_sibling|Add sibling node
a_child|Add child node
a_edit|Edit text
a_node|New node
a_root|Title block (main node)
a_link|Connect mode
a_select|Select
a_zoomIn|Zoom in
a_zoomOut|Zoom out
a_zoomReset|Reset zoom (100%)
a_fit|Fit map to screen
a_fitView|Fit/reset view
a_grid|Grid
a_snap|Snap to grid
a_full|Full screen
a_theme|Light/dark theme
a_bold|Bold
a_italic|Italic
a_center|Center text
a_shortcuts|Keyboard shortcuts
a_shortcuts2|Quick commands list
a_about|Program info
a_projects|Projects
a_connect|Connect
a_props|Properties
a_pan|Pan the map (drag the background or Space + drag)
a_zoomWheel|Zoom with mouse wheel
a_pinch|Zoom with a trackpad pinch
a_swipe|Scroll the map with a two-finger swipe
a_trackpad|Trackpad mode (drag = select area)
a_band2|Area selection (Trackpad mode)
a_scrollWheel|Scroll the map
a_band|Area selection
a_moveAlone|Move only this block (without its branch)
a_layout|Tidy mode (invisible grid)
a_minimap|Minimap
a_childLeft|Add child node on the left
a_childDown|Add child node below
t_layoutTidy|Tidy mode on: blocks arrange themselves
t_layoutFree|Free mode: blocks stay where you put them
a_resizeProp|Resize keeping proportions
a_autofit|Fit to text
a_reparent|Drag a block onto another to attach it
title|Title
a_titleRC|Double right-click on the background: create the title block
a_preview|Preview…
a_msShift|Add/remove from selection
a_msCtrl|Multiple selection
m_file|File
m_edit|Edit
m_insert|Insert
m_view|View
m_help|Help
g_file|File and project
g_edit|Edit
g_create|Node creation
g_nav|Canvas navigation
g_sel|Selection
g_fmt|Formatting
g_view|View
g_help|Help
p_node|Node
p_multi|{0} nodes selected
p_link|Link
p_linkText|Testo collegamento
p_text|Text
p_fill|Background color
p_tcolor|Text color
p_shape|Shape
p_w|Width
p_h|Height
p_font|Font
p_size|Font size
p_style|Style
p_align|Alignment
p_stroke|Border
p_sw|Border width
p_radius|Border radius
p_op|Opacity
p_color|Color
p_width|Thickness
p_type|Type
p_dashed|Dashed
p_start|Start cap
p_end|End cap
p_stats|{0} nodes · {1} links
s_rect|Rectangle
s_rounded|Rounded rectangle
s_circle|Circle
s_ellipse|Ellipse
s_pill|Pill
o_straight|Simple line
o_curve|Curve
o_ortho|Orthogonal
c_none|None
c_arrow|Arrow
c_dot|Dot
st_saved|Saved
st_saving|Saving…
st_unsaved|Unsaved changes
st_error|Save error
st_none|No project
t_created|Project created
t_saved|Project saved
t_deleted|Project moved to the Recycle Bin
t_deletedExp|JSON downloaded, project moved to the Recycle Bin
t_exportErr|Could not export the project, nothing was deleted
t_delErr|Could not delete the project
t_renamed|Project renamed
t_dupd|Project duplicated
t_exported|Export completed
t_imported|Import completed
t_saveErr|Save error
t_loadErr|Load error
t_importErr|Invalid file
t_importedN|{0} projects imported
t_importPartial|{0} of {1} files could not be imported
d_impTitle|Import {0} files
d_impMsg|You selected {0} files. Import them as separate projects (none is opened automatically), or put them all in one project with one page per file?
b_impSep|Separate projects
b_impOne|One project, one page per file
imp_merged|Imported maps
t_empty|The map is empty
t_nosel|Select a node first
t_noproj|Open or create a project
t_openElsewhere|This project is already open in another tab
t_clipLocal|Copied (too large to share with other tabs)
e_invalid_name|Invalid name
e_not_found|Project not found
e_invalid_project|Invalid project data
e_bad_json|Invalid request
e_too_large|Data too large
e_trash_failed|Could not move it to the Recycle Bin
e_error|Unexpected error
d_name|Project name
d_new|New project
d_rename|Rename project
d_dup|Duplicate project
d_delTitle|Delete project
d_delMsg|Do you want to delete "{0}"?
d_delYes|Yes, delete
d_del2Title|Delete or export first?
d_del2Msg|"{0}" will be moved to the Recycle Bin. You can also download a copy as a JSON file before deleting it.
b_delOnly|Delete
b_delExport|Export JSON and delete
b_ok|OK
b_cancel|Cancel
b_delete|Delete
b_open|Open
b_close|Close
b_dup|Duplicate
b_ren|Rename
b_tab|Open in new tab
copyOf|Copy of {0}
untitled|Untitled map
central|Central idea
newNode|New node
pm_search|Search projects…
pm_mod|Last modified
pm_cre|Creation date
pm_name|Name
pm_mod1|Last
pm_mod2|Modified
pm_cre1|Creation
pm_cre2|date
a_new1|New
a_new2|project
a_imp1|Import
a_imp2|project
a_newPage|New page
a_pagePrev|Previous page
a_pageNext|Next page
pg_default|Page {0}
pg_newTitle|New page
pg_renTitle|Rename page
pg_delTitle|Delete page
pg_delMsg|Delete the page "{0}" and all its blocks? This cannot be undone.
pg_last|A project needs at least one page.
pg_ren|Rename
pg_dup|Duplicate
pg_drag|Drag to reorder
pg_del|Delete
pg_copy|{0} (copy)
pg_name|Page name
pg_all|Pages
pg_max|A project can have at most 100 pages.
a_find|Find in map…
a_path|Project path…
a_collapse|Collapse branch
a_expand|Expand branch
d_path|Project path
d_pathLbl|Full path of the project folder
b_copy|Copy path
t_pathCopied|Path copied
s_ph|Search nodes…
s_prev|Previous match (Shift+Enter)
s_next|Next match (Enter)
s_clear|Clear search (Esc)
s_none|No matches
s_count|{0} of {1}
pm_recent|Recent
pm_none|No projects found.
pm_created|Created
pm_modified|Modified
hm_create|Create a new mind map
hm_new|Create new mind map
hm_import|Import map
hm_yours|Your mind maps
hm_all|All
hm_recent|Recent
hm_fav|Favorites
hm_search|Search
hm_help|Help
hm_info|Program info
hm_license|License
hm_shortcuts|Keyboard shortcuts
pi_name|Name
pi_version|Version
pi_what|What it is
pi_where|Where data lives
pi_req|Requirements
pi_export|Export
pi_whatV|A local editor for mind maps and diagrams.
pi_whereV|Your mind maps are saved as folders inside the "projects" folder next to the program. Nothing leaves your computer.
pi_reqV|Python 3 only, no other dependencies.
pi_exportV|SVG, PNG, PDF, JSON backup, XMind, FreeMind, OPML and Markdown (File > Export). XMind, FreeMind, OPML and Markdown can also be imported (File > Import). SVG, PNG and PDF create one file per page, named after the page's first block. JSON files are named NAME_Mindly.json.
lic_more|Read more about the MIT license:
a_msRight|Select multiple nodes (rectangle)
a_license|License
hm_view|Switch grid / list view
hm_star|Add to favorites
hm_nofav|No favorite mind maps yet.
hm_nores|No results
hm_nores2|Nothing matches your search.
hm_welcome|Welcome to Mindly
hm_welcome2|You have no mind maps yet. Click “Create new mind map” above to create your first one.
hm_nothing|Nothing here
hm_nothing2|No mind maps in this section.
hm_foot|Mindly runs locally: your mind maps are saved in the "projects" folder on this computer.
h_select|Click: select · double-click: edit · drag the background: pan · Ctrl+wheel: zoom · drag the ● to connect
h_selectTp|Click: select · double-click: edit · drag the background: select area · two fingers: scroll · pinch: zoom · Space + drag: pan
t_tpOn|Trackpad mode on: drag the background to select, two-finger swipe to scroll, pinch to zoom
t_tpOff|Trackpad mode off: drag the background to pan
h_link1|Connect: click the source node (Esc to cancel)
h_link2|Now click the target node (Esc to cancel)
ab_text|Mindly is a local mind map editor. All your data stays on your computer, in the "projects" folder.`
  .split('\n')
  .forEach((l) => {
    const [a, b] = l.split('|');
    D[a] = b;
  });
let theme = PS.mTheme || 'light';
const t = (k, ...a) => {
  let s = D[k] || k;
  a.forEach((v, i) => (s = s.replace('{' + i + '}', () => v)));
  return s;
};
let tpOn = PS.mTrackpad !== '0'; /* Trackpad mode: ON by default; only an explicit OFF is remembered */
const tpMode = () => tpOn;
/* ==========================================================
 * STATE
 * ========================================================== */
const svg = $('#svg');
const FONTS = [
  ['Segoe UI, Arial, sans-serif', 'Sans'],
  ['Georgia, serif', 'Serif'],
  ['Consolas, monospace', 'Mono'],
  ['Comic Sans MS, cursive', 'Script'],
];
const SH = ['rect', 'rounded', 'circle', 'ellipse', 'pill'];
const blank = () => ({
  nodes: [],
  links: [],
  settings: { grid: true, snap: false, layout: 'tidy' },
  view: { x: 400, y: 300, z: 1 },
});
const mk = (o) => ({
  id: uid(),
  x: 0,
  y: 0,
  w: 140,
  h: 56,
  text: '',
  fill: '#ffffff',
  color: '#1f2937',
  font: FONTS[0][0],
  size: 16,
  bold: false,
  italic: false,
  align: 'center',
  stroke: '#a1a1a1',
  sw: 1,
  radius: 6,
  opacity: 1,
  shape: 'rounded',
  ...o,
});
const mkl = (o) => ({
  id: uid(),
  from: '',
  to: '',
  color: '#a1a1a1',
  width: 2,
  type: 'curve',
  dashed: false,
  start: 'none',
  end: 'none',
  text: '',
  bold: false,
  italic: false,
  ...o,
});
const norm = (p) => {
  const b = blank();
  return {
    nodes: (p.nodes || []).map(mk),
    links: (p.links || []).map(mkl),
    settings: { ...b.settings, ...p.settings },
    view: { ...b.view, ...p.view },
  };
};
const rootNode = () =>
  mk({
    isTitle: true,
    x: -85,
    y: -35,
    w: 170,
    h: 70,
    text: t('central'),
    size: 20,
    bold: false,
    fill: '#1f2937',
    color: '#ffffff',
    stroke: '#a1a1a1',
  });
let renaming = false,
  nameT = null,
  cur = null,
  M = blank(),
  sel = { n: new Set(), l: null },
  undoS = [],
  redoS = [],
  lk = '',
  lt = 0,
  dirty = false,
  saving = false,
  st = 'none',
  saveT,
  tool = 'select',
  linkFrom = null,
  clip = null,
  pc = 0,
  space = false,
  editing = null,
  editingLink = null,
  drag = null,
  band = null,
  conn = null,
  dropT = null,
  lastClk = { id: '', t: 0 },
  mouse = { x: 0, y: 0 },
  onMC = null;
const byId = (id) => M.nodes.find((n) => n.id === id);
/* ----- collapsed branches -----
 * Every node can hide the children that sit on its RIGHT (colR) and/or on its LEFT (colL):
 * the two sides are independent. HID = ids of nodes currently hidden, CNT = hidden count per side. */
let HID = new Set();
const CNT = new Map();
const colKey = (s) => (s === 'l' ? 'colL' : s === 'b' ? 'colB' : 'colR');
const childSide = (p, c) =>
  c.down ? 'b' : M.settings.layout === 'tidy' ? sideOf(c) : c.x + c.w / 2 < p.x + p.w / 2 ? 'l' : 'r';
function kidsOn(n, s) {
  const seen = new Set(),
    out = [];
  for (const l of M.links)
    if (l.from === n.id && !seen.has(l.to)) {
      seen.add(l.to);
      const c = byId(l.to);
      if (c && c !== n && childSide(n, c) === s) out.push(c);
    }
  return out;
}
function calcHidden() {
  const h = new Set();
  CNT.clear();
  HID = h;
  if (!M.nodes.some((n) => n.colL || n.colR || n.colB)) return h;
  const by = new Map(M.nodes.map((n) => [n.id, n])),
    ch = new Map();
  for (const l of M.links) {
    if (!by.has(l.from) || !by.has(l.to)) continue;
    if (!ch.has(l.from)) ch.set(l.from, []);
    ch.get(l.from).push(l.to);
  }
  const walk = (id) => {
    const out = new Set([id]),
      st = [id];
    while (st.length) {
      const i = st.pop();
      for (const k of ch.get(i) || []) if (!out.has(k)) (out.add(k), st.push(k));
    }
    return out;
  };
  for (const n of M.nodes)
    for (const s of ['r', 'l', 'b']) {
      if (!n[colKey(s)]) continue;
      const u = new Set();
      for (const c of kidsOn(n, s)) {
        const sub = walk(c.id);
        if (!sub.has(n.id)) sub.forEach((i) => u.add(i));
      }
      u.forEach((i) => h.add(i));
      CNT.set(n.id + ':' + s, u.size);
    }
  return h;
}
function toggleCollapse(id, s) {
  const n = byId(id);
  if (!cur || !n) return;
  const k = colKey(s);
  snapshot();
  if (n[k]) delete n[k];
  else n[k] = true;
  markDirty();
  render();
  buildPanel();
}
/* open every collapsed branch that hides node `id` (used by the search) */
function revealNode(id) {
  const seen = new Set();
  let changed = false;
  const up = (cid, d) => {
    if (seen.has(cid) || d > 200) return;
    seen.add(cid);
    const c = byId(cid);
    for (const l of M.links)
      if (l.to === cid) {
        const p = byId(l.from);
        if (!p || !c) continue;
        const k = colKey(childSide(p, c));
        if (p[k]) {
          delete p[k];
          changed = true;
        }
        up(p.id, d + 1);
      }
  };
  up(id, 0);
  if (changed) {
    markDirty();
    calcHidden();
  }
}
const sn = (v) => (M.settings.snap ? Math.round(v / 20) * 20 : v);
const SR = () => svg.getBoundingClientRect();
const toW = (cx, cy) => {
  const r = SR();
  return [(cx - r.left - M.view.x) / M.view.z, (cy - r.top - M.view.y) / M.view.z];
};
const need = () => {
  if (cur) return true;
  toast(t('t_noproj'), 'err');
  if ($('#modal').hidden) newProject();
  return false;
};
/* ----- search in nodes ----- */
const S = { q: '', hits: [], i: -1, set: new Set(), cur: null };
const fold = (s) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
function searchScan() {
  const q = fold(S.q.trim());
  S.hits = q
    ? M.nodes
        .filter((n) => fold(n.text).includes(q))
        .sort((a, b) => a.y - b.y || a.x - b.x)
        .map((n) => n.id)
    : [];
  S.set = new Set(S.hits);
}
function searchStat() {
  const e = $('#nscount');
  if (!e) return;
  e.textContent = !S.q.trim()
    ? ''
    : S.hits.length
      ? t('s_count', S.i + 1, S.hits.length)
      : t('s_none');
  e.classList.toggle('none', !!S.q.trim() && !S.hits.length);
}
/* the map changed: recompute the matches but keep the current one and do not move the view */
function searchRefresh() {
  if (!S.q.trim()) return;
  const prev = S.cur;
  searchScan();
  S.i = prev ? S.hits.indexOf(prev) : -1;
  if (S.i < 0 && S.hits.length) S.i = 0;
  S.cur = S.i >= 0 ? S.hits[S.i] : null;
  searchStat();
}
function searchShow(i) {
  if (!S.hits.length) return;
  S.i = (i + S.hits.length) % S.hits.length;
  S.cur = S.hits[S.i];
  revealNode(S.cur);
  const n = byId(S.cur),
    r = SR();
  if (n) {
    M.view.x = r.width / 2 - (n.x + n.w / 2) * M.view.z;
    M.view.y = r.height / 2 - (n.y + n.h / 2) * M.view.z;
    viewDirty();
  }
  searchStat();
  render();
}
function searchInput(q) {
  S.q = q;
  S.i = -1;
  S.cur = null;
  searchScan();
  searchStat();
  if (S.hits.length) searchShow(0);
  else render();
}
/* popup (top-right of the work area): opened with Ctrl+F, closed with Esc / ✕ */
let nsOpen = false;
function searchOpen(on) {
  nsOpen = !!on && !!cur;
  $('#nsearch').hidden = !nsOpen;
  $('#stage').classList.toggle('ns-open', nsOpen);
  if (nsOpen) {
    const i = $('#nsq');
    i.focus();
    i.select();
  } else if (S.q) {
    searchClear();
    render();
  }
}
function searchClear() {
  S.q = '';
  S.hits = [];
  S.set = new Set();
  S.i = -1;
  S.cur = null;
  const i = $('#nsq');
  if (i) i.value = '';
  searchStat();
}
/* ==========================================================
 * SHORTCUTS
 * ========================================================== */
const SC = [
  ['g_file', 'Ctrl+N', 'new'],
  ['g_file', 'Ctrl+O', 'open'],
  ['g_file', 'Ctrl+S', 'save'],
  ['g_file', 'Ctrl+Shift+S', 'saveas'],
  ['g_file', 'Ctrl+W', 'close'],
  ['g_edit', 'Ctrl+Z', 'undo'],
  ['g_edit', 'Ctrl+Y', 'redo'],
  ['g_edit', 'Ctrl+Shift+Z', 'redo', 'a_redo2'],
  ['g_edit', 'Ctrl+C', 'copy'],
  ['g_edit', 'Ctrl+X', 'cut'],
  ['g_edit', 'Ctrl+V', 'paste'],
  ['g_edit', 'Ctrl+D', 'dup'],
  ['g_edit', 'Delete', 'del'],
  ['g_edit', 'Backspace', 'del'],
  ['g_edit', 'Ctrl+A', 'selAll'],
  ['g_edit', 'Esc', 'desel'],
  ['g_edit', 'Ctrl+F', 'find'],
  ['g_create', 'Tab', 'child'],
  ['g_create', 'Shift+Tab', 'childLeft'],
  ['g_create', 'Alt+Enter', 'childDown'],
  ['g_create', 'Enter', 'sibling'],
  ['g_create', 'F2', 'edit'],
  ['g_create', 'T', 'root'],
  ['g_create', 'Double right-click', '', 'a_titleRC'],
  ['g_create', 'N', 'node'],
  ['g_create', 'T', 'root'],
  ['g_create', 'L', 'link'],
  ['g_nav', '+', 'zoomIn'],
  ['g_nav', '-', 'zoomOut'],
  ['g_nav', '0', 'zoomReset'],
  ['g_nav', '1', 'fit'],
  ['g_nav', 'Space + drag', '', 'a_pan'],
  ['g_nav', 'Pinch', '', 'a_pinch'],
  ['g_nav', 'Two-finger swipe', '', 'a_swipe'],
  ['g_nav', 'Ctrl + wheel', '', 'a_zoomWheel'],
  ['g_nav', 'Wheel', '', 'a_scrollWheel'],
  ['g_sel', 'Shift + drag', '', 'a_band'],
  ['g_sel', 'Drag (Trackpad mode)', '', 'a_band2'],
  ['g_sel', 'Drag onto block', '', 'a_reparent'],
  ['g_sel', 'Shift + resize', '', 'a_resizeProp'],
  ['g_sel', 'Alt + drag', '', 'a_moveAlone'],
  ['g_sel', 'Right-click + drag', '', 'a_msRight'],
  ['g_sel', 'Shift + click', '', 'a_msShift'],
  ['g_sel', 'Ctrl + click', '', 'a_msCtrl'],
  ['g_fmt', 'Ctrl+B', 'bold'],
  ['g_fmt', 'Ctrl+I', 'italic'],
  ['g_fmt', 'Ctrl+Shift+E', 'center'],
  ['g_view', 'Ctrl++', 'zoomIn'],
  ['g_view', 'Ctrl+-', 'zoomOut'],
  ['g_view', 'Ctrl+0', 'fitView'],
  ['g_view', 'Shift+PageUp', 'pagePrev'],
  ['g_view', 'Shift+PageDown', 'pageNext'],
  ['g_view', 'F11', 'full'],
  ['g_help', 'F1', 'shortcuts'],
  ['g_help', '?', 'shortcuts2'],
];
const shortcutOf = (a) => (SC.find((s) => s[2] === a) || [])[1];
const combo = (e) => {
  let k = e.key;
  if (k === '=') k = '+';
  if (k === 'Escape') k = 'Esc';
  if (k === ' ') k = 'Space';
  if (k.length === 1) k = k.toUpperCase();
  const m = [];
  if (e.ctrlKey || e.metaKey) m.push('Ctrl');
  if (e.altKey) m.push('Alt');
  if (e.shiftKey && k !== '+' && k !== '?') m.push('Shift');
  m.push(k);
  return m.join('+');
};
/* ==========================================================
 * GEOMETRY & RENDERING
 * ========================================================== */
const cv = document.createElement('canvas').getContext('2d');
const nodeFont = (n) => `${n.italic ? 'italic ' : ''}${n.bold ? 'bold ' : ''}${n.size}px ${n.font}`;
function wrapText(text, maxW, font) {
  cv.font = font;
  const out = [];
  for (const para of String(text).split('\n')) {
    let line = '';
    for (const word of para.split(' ')) {
      const tr = line ? line + ' ' + word : word;
      if (cv.measureText(tr).width <= maxW) {
        line = tr;
        continue;
      }
      if (line) {
        out.push(line);
        line = '';
      }
      if (cv.measureText(word).width <= maxW) {
        line = word;
        continue;
      }
      let part = '';
      for (const ch of word) {
        if (part && cv.measureText(part + ch).width > maxW) {
          out.push(part);
          part = ch;
        } else part += ch;
      }
      line = part;
    }
    out.push(line);
  }
  return out;
}
function lines(n) {
  const maxW = Math.max(
    10,
    n.w - 24 - (n.shape === 'rect' || n.shape === 'rounded' ? 0 : n.w * 0.12),
  );
  return wrapText(n.text, maxW, nodeFont(n));
}
/* link label: wraps and the box grows with the text */
const LBL_SIZE = 14,
  LBL_PAD = 6,
  LBL_MAX = 220,
  LBL_LH = 1.25,
  LBL_FONT = FONTS[0][0]; /* Sans */
const lblFont = (l) => `${l.italic ? 'italic ' : ''}${l.bold ? 'bold ' : ''}${LBL_SIZE}px ${LBL_FONT}`;
function linkBox(l, text) {
  const font = lblFont(l),
    ls = wrapText(text == null ? l.text : text, LBL_MAX - LBL_PAD * 2, font);
  cv.font = font;
  const tw = Math.max(0, ...ls.map((s) => cv.measureText(s).width));
  return {
    ls,
    w: Math.ceil(tw) + LBL_PAD * 2,
    h: Math.round(ls.length * LBL_SIZE * LBL_LH) + LBL_PAD * 2,
  };
}
function fitNode(n) {
  cv.font = `${n.italic ? 'italic ' : ''}${n.bold ? 'bold ' : ''}${n.size}px ${n.font}`;
  let tw = 0;
  for (const l of String(n.text).split('\n')) tw = Math.max(tw, cv.measureText(l).width);
  const sh = n.shape,
    sq = sh === 'rect' || sh === 'rounded',
    rd = sh === 'ellipse' || sh === 'circle';
  n.w = Math.round(Math.min(340, Math.max(90, ((tw + 24) / (sq ? 1 : 0.88) + 4) * (rd ? 1.3 : 1))));
  let h = lines(n).length * n.size * 1.25 + 20;
  if (rd) h *= 1.3;
  n.h = Math.round(Math.max(40, h));
  if (sh === 'circle') n.w = n.h = Math.max(n.w, n.h);
}
function grow(n) {
  if (!n.manual) return fitNode(n);
  const need = lines(n).length * n.size * 1.25 + 16;
  if (need > n.h) n.h = Math.ceil(need);
}
function nodeSVG(n, hide) {
  const cx = n.x + n.w / 2,
    cy = n.y + n.h / 2,
    a = `fill="${esc(n.fill)}" stroke="${esc(n.stroke)}" stroke-width="${n.sw}"`;
  let s;
  if (n.shape === 'circle') {
    const r = Math.min(n.w, n.h) / 2;
    s = `<ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r}" ${a}/>`;
  } else if (n.shape === 'ellipse')
    s = `<ellipse cx="${cx}" cy="${cy}" rx="${n.w / 2}" ry="${n.h / 2}" ${a}/>`;
  else {
    const r = n.shape === 'rect' ? 0 : n.shape === 'pill' ? n.h / 2 : n.radius;
    s = `<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="${r}" ${a}/>`;
  }
  if (!hide) {
    const ls = lines(n),
      lh = n.size * 1.25,
      y0 = cy - (ls.length * lh) / 2 + lh / 2,
      x = n.align === 'left' ? n.x + 12 : n.align === 'right' ? n.x + n.w - 12 : cx,
      an = n.align === 'left' ? 'start' : n.align === 'right' ? 'end' : 'middle';
    s += ls
      .map(
        (l, i) =>
          `<text x="${x}" y="${y0 + i * lh}" text-anchor="${an}" dominant-baseline="central" font-family="${esc(n.font)}" font-size="${n.size}" font-weight="${n.bold ? 700 : 400}" font-style="${n.italic ? 'italic' : 'normal'}" fill="${esc(n.color)}" style="pointer-events:none;white-space:pre">${esc(l)}</text>`,
      )
      .join('');
  }
  return `<g opacity="${n.opacity}">${s}</g>`;
}
const hw = (n) => (n.shape === 'circle' ? Math.min(n.w, n.h) / 2 : n.w / 2),
  hh = (n) => (n.shape === 'circle' ? Math.min(n.w, n.h) / 2 : n.h / 2),
  ang = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]);
function edge(n, tx, ty) {
  const cx = n.x + n.w / 2,
    cy = n.y + n.h / 2,
    dx = tx - cx,
    dy = ty - cy;
  if (!dx && !dy) return [cx, cy];
  const a = hw(n),
    b = hh(n),
    k =
      n.shape === 'ellipse' || n.shape === 'circle'
        ? 1 / Math.hypot(dx / a, dy / b)
        : 1 / Math.max(Math.abs(dx) / a, Math.abs(dy) / b);
  return [cx + dx * k, cy + dy * k];
}
function geo(l) {
  const a = byId(l.from),
    b = byId(l.to);
  if (!a || !b || HID.has(a.id) || HID.has(b.id)) return null;
  const ac = [a.x + a.w / 2, a.y + a.h / 2],
    bc = [b.x + b.w / 2, b.y + b.h / 2],
    h = b.down ? false : M.settings.layout === 'tidy' || Math.abs(bc[0] - ac[0]) >= Math.abs(bc[1] - ac[1]),
    s = (h ? bc[0] >= ac[0] : bc[1] >= ac[1]) ? 1 : -1;
  let p, q, d, a1, a2;
  if (h) {
    p = [ac[0] + s * hw(a), ac[1]];
    q = [bc[0] - s * hw(b), bc[1]];
  } else {
    p = [ac[0], ac[1] + s * hh(a)];
    q = [bc[0], bc[1] - s * hh(b)];
  }
  if (l.type === 'ortho') {
    if (h) {
      const m = (p[0] + q[0]) / 2;
      d = `M${p}L${m},${p[1]}L${m},${q[1]}L${q}`;
      a1 = s > 0 ? Math.PI : 0;
      a2 = s > 0 ? 0 : Math.PI;
    } else {
      const m = (p[1] + q[1]) / 2;
      d = `M${p}L${p[0]},${m}L${q[0]},${m}L${q}`;
      a1 = s > 0 ? -Math.PI / 2 : Math.PI / 2;
      a2 = s > 0 ? Math.PI / 2 : -Math.PI / 2;
    }
  } else if (l.type === 'curve') {
    const c1 = h ? [p[0] + (q[0] - p[0]) / 2, p[1]] : [p[0], p[1] + (q[1] - p[1]) / 2],
      c2 = h ? [q[0] - (q[0] - p[0]) / 2, q[1]] : [q[0], q[1] - (q[1] - p[1]) / 2];
    d = `M${p}C${c1} ${c2} ${q}`;
    a1 = ang(c1, p);
    a2 = ang(c2, q);
  } else {
    d = `M${p}L${q}`;
    a1 = ang(q, p);
    a2 = ang(p, q);
  }
  return { d, p, q, a1, a2 };
}
function cap(c, pt, a, col, w) {
  const s = 9 + w * 2;
  if (c === 'arrow') {
    const ca = Math.cos(a),
      sa = Math.sin(a),
      bx = pt[0] - ca * s,
      by = pt[1] - sa * s;
    return `<path d="M${pt}L${bx - sa * s * 0.45},${by + ca * s * 0.45}L${bx + sa * s * 0.45},${by - ca * s * 0.45}Z" fill="${col}"/>`;
  }
  if (c === 'dot') return `<circle cx="${pt[0]}" cy="${pt[1]}" r="${3 + w}" fill="${col}"/>`;
  return '';
}
function linkLabelSVG(l, g) {
  if (!l.text || editingLink === l.id) return '';
  const mx = (g.p[0] + g.q[0]) / 2,
    my = (g.p[1] + g.q[1]) / 2,
    b = linkBox(l),
    lh = LBL_SIZE * LBL_LH,
    y0 = my - (b.ls.length * lh) / 2 + lh / 2;
  return (
    `<rect x="${mx - b.w / 2}" y="${my - b.h / 2}" width="${b.w}" height="${b.h}" fill="#ffffff" stroke="none" rx="3"/>` +
    b.ls
      .map(
        (s, k) =>
          `<text x="${mx}" y="${y0 + k * lh}" text-anchor="middle" dominant-baseline="central" font-family="${esc(LBL_FONT)}" font-size="${LBL_SIZE}" font-weight="${l.bold ? 700 : 400}" font-style="${l.italic ? 'italic' : 'normal'}" fill="#1f2937" style="pointer-events:none;white-space:pre">${esc(s)}</text>`,
      )
      .join('')
  );
}
function linkSVG(l, g, s, ex) {
  const c = esc(l.color),
    w = l.width;
  let h = '';
  if (!ex)
    h += `<path d="${g.d}" fill="none" stroke="transparent" stroke-width="${Math.max(14, w + 8)}" style="pointer-events:stroke"/>`;
  if (s)
    h += `<path d="${g.d}" fill="none" stroke="var(--accent)" stroke-opacity=".35" stroke-width="${w + 8}"/>`;
  h +=
    `<path d="${g.d}" fill="none" stroke="${c}" stroke-width="${w}"${l.dashed ? ` stroke-dasharray="${w * 3} ${w * 2}"` : ''} stroke-linejoin="round"/>` +
    cap(l.start, g.p, g.a1, c, w) +
    cap(l.end, g.q, g.a2, c, w);
  return ex ? h : `<g data-l="${l.id}" class="lnk">${h}</g>`;
}
function overlay() {
  let h = '';
  const z = M.view.z;
  if (!editingLink) {
    for (const id of sel.n) {
      const n = byId(id);
      if (n)
        h += `<rect class="sel" x="${n.x - 5}" y="${n.y - 5}" width="${n.w + 10}" height="${n.h + 10}" rx="6" fill="none" stroke-width="${1.5 / z}" stroke-dasharray="${5 / z}"/>`;
    }
    if (sel.n.size === 1 && !editing) {
      const n = byId([...sel.n][0]);
      if (n)
        for (const [k, x, y] of [
          ['nw', n.x, n.y],
          ['ne', n.x + n.w, n.y],
          ['sw', n.x, n.y + n.h],
          ['se', n.x + n.w, n.y + n.h],
        ]) {
          const s = 11 / z;
          h += `<rect class="hdl" data-h="${k}" x="${x - s / 2}" y="${y - s / 2}" width="${s}" height="${s}" stroke-width="${1 / z}"/>`;
        }
    }
    /* side buttons, top to bottom: add -> link arrow -> collapse/expand (right and left are independent) */
    let stackId = null;
    if (sel.n.size === 1 && !editing && !conn) {
      const n = byId([...sel.n][0]);
      if (n) {
        stackId = n.id;
        const cy = n.y + n.h / 2;
        for (const s of ['r', 'l', 'b']) {
          const bx = n.x + n.w / 2,
            sx = s === 'r' ? n.x + n.w + 22 / z : n.x - 22 / z,
            at = (dv) => (s === 'b' ? [bx + dv / z, n.y + n.h + 22 / z] : [sx, cy + dv / z]),
            btn = (dy, g, d, extra = '', fs = 14) =>
              `<circle class="cn" data-c="${d}"${extra} cx="${at(dy)[0]}" cy="${at(dy)[1]}" r="${11 / z}" stroke="#fff" stroke-width="${1.5 / z}"/><text x="${at(dy)[0]}" y="${at(dy)[1]}" font-size="${fs / z}" fill="#fff" text-anchor="middle" dominant-baseline="central" style="pointer-events:none">${g}</text>`;
          const k = colKey(s),
            hasCol = !!(n[k] || kidsOn(n, s).length),
            o = hasCol ? [-30, 0, 30] : [-15, 15]; /* the group of buttons is always centered on the side */
          h += btn(o[0], '+', 'add', ` data-cs="${s}"`) + btn(o[1], s === 'r' ? '→' : s === 'l' ? '←' : '↓', 'link');
          if (hasCol) {
            const cnt = CNT.get(n.id + ':' + s) || 0;
            h += btn(
              o[2],
              n[k] ? cnt : '−',
              'collapse',
              ` data-cn="${n.id}" data-cs="${s}"`,
              n[k] ? 11 : 16,
            );
          }
        }
      }
    }
    /* collapsed sides stay visible as a small badge with the number of hidden nodes */
    for (const n of M.nodes) {
      if (HID.has(n.id)) continue;
      for (const s of ['r', 'l', 'b']) {
        if (!n[colKey(s)] || stackId === n.id) continue;
        const sx = s === 'r' ? n.x + n.w + 14 / z : s === 'b' ? n.x + n.w / 2 : n.x - 14 / z,
          sy = s === 'b' ? n.y + n.h + 14 / z : n.y + n.h / 2;
        h += `<circle class="cn" data-c="collapse" data-cn="${n.id}" data-cs="${s}" cx="${sx}" cy="${sy}" r="${10 / z}" stroke="#fff" stroke-width="${1.5 / z}"/><text x="${sx}" y="${sy}" font-size="${11 / z}" fill="#fff" text-anchor="middle" dominant-baseline="central" style="pointer-events:none">${CNT.get(n.id + ':' + s) || 0}</text>`;
      }
    }
  }
  if (S.q.trim())
    for (const id of S.set) {
      const n = byId(id);
      if (!n || HID.has(id)) continue;
      const c = id === S.cur;
      h += `<rect class="hit${c ? ' cur' : ''}" x="${n.x - 6}" y="${n.y - 6}" width="${n.w + 12}" height="${n.h + 12}" rx="9" stroke-width="${(c ? 3.5 : 2) / z}"/>`;
    }
  if (conn) {
    const n = byId(conn.id);
    if (n) {
      const p = edge(n, conn.x, conn.y),
        e = [conn.x, conn.y];
      h +=
        `<path class="cnl" d="M${p}L${e}" stroke-width="${2 / z}" stroke-dasharray="${6 / z}"/>` +
        cap('arrow', e, ang(p, e), '#a1a1a1', 2 / z);
      const o = conn.hover && byId(conn.hover);
      if (o)
        h += `<rect class="src" x="${o.x - 6}" y="${o.y - 6}" width="${o.w + 12}" height="${o.h + 12}" rx="8" stroke-width="${2 / z}"/>`;
    }
  }
  const dtn = dropT && byId(dropT);
  if (dtn)
    h += `<rect class="src" x="${dtn.x - 6}" y="${dtn.y - 6}" width="${dtn.w + 12}" height="${dtn.h + 12}" rx="8" stroke-width="${2.5 / z}"/>`;
  const f = linkFrom && byId(linkFrom);
  if (f)
    h += `<rect class="src" x="${f.x - 6}" y="${f.y - 6}" width="${f.w + 12}" height="${f.h + 12}" rx="8" stroke-width="${2 / z}"/>`;
  if (band)
    h += `<rect class="band" x="${Math.min(band.x0, band.x1)}" y="${Math.min(band.y0, band.y1)}" width="${Math.abs(band.x1 - band.x0)}" height="${Math.abs(band.y1 - band.y0)}" stroke-width="${1 / z}"/>`;
  return h;
}
function render() {
  const v = M.view,
    w = $('#world');
  let h = '';
  calcHidden();
  for (const id of [...sel.n]) if (HID.has(id)) sel.n.delete(id);
  const dim = S.q.trim() && S.hits.length;
  for (const l of M.links) {
    const g = geo(l);
    if (g) h += linkSVG(l, g, sel.l === l.id);
  }
  for (const n of M.nodes)
    if (!HID.has(n.id))
      h += `<g data-n="${n.id}" class="node${dim && !S.set.has(n.id) ? ' dim' : ''}">${nodeSVG(n, editing === n.id)}</g>`;
  for (const l of M.links) {
    const g = geo(l),
      lb = g && linkLabelSVG(l, g);
    if (lb) h += `<g data-l="${l.id}" class="lnk">${lb}</g>`;
  }
  w.innerHTML = h + overlay();
  const tr = `translate(${v.x} ${v.y}) scale(${v.z})`;
  w.setAttribute('transform', tr);
  $('#grid').setAttribute('patternTransform', tr);
  $('#gridrect').style.display = M.settings.grid ? '' : 'none';
  const z = Math.round(v.z * 100) + '%',
    zl = $('#zl');
  if (zl) zl.textContent = z;
  $('#zf').textContent = z;
  $('#stats').textContent = t('p_stats', M.nodes.length, M.links.length);
  $('#home').hidden = !!cur;
  $('#pagebar').hidden = !cur;
  if (!cur && nsOpen) searchOpen(false);
  svg.classList.toggle('tl', tool === 'link');
  svg.classList.toggle('pan', space);
  refreshTB();
  posFbar();
  if (editingLink) $('#editor').hidden = false;
  else if (!editing) $('#editor').hidden = true;
  renderMinimap();
}
/* ==========================================================
 * MINIMAP
 * ========================================================== */
const mm = $('#minimap'),
  mmsvg = $('#mmsvg');
const MM_PAD = 6;
PS.mMinimap = '0'; /* the minimap is always OFF at startup */
let mmZoom = 1,
  mmFitScale = 1,
  mmOx = 0,
  mmOy = 0,
  mmBBox = null,
  mmWinDrag = null,
  mmResDrag = null,
  mmPanDrag = null,
  mmPinned = true;
function mmVisible() {
  return PS.mMinimap === '1';
}
function setMmVis(v) {
  PS.mMinimap = v ? '1' : '0';
  mm.hidden = !v || !cur;
  if (v && cur) renderMinimap();
  refreshTB();
}
/* Redraws are grouped into ONE per animation frame, and when only the view moved (pan) the map
   itself is reused: just the small rectangle slides, so dragging stays fluid even on big maps. */
let mmRaf = 0,
  mmSig = '',
  mmVp = null;
function renderMinimap() {
  if (mmRaf) return;
  mmRaf = requestAnimationFrame(() => {
    mmRaf = 0;
    renderMinimapNow();
  });
}
function renderMinimapNow() {
  if (!mmVisible() || !cur || !M.nodes.length) {
    mm.hidden = true;
    return;
  }
  mm.hidden = false;
  const b0 = bbox();
  if (!b0) {
    mm.hidden = true;
    return;
  }
  /* the navigation rectangle is the visible area: leave room around the content so it stays small */
  const vr = SR(),
    mx = (vr.width / M.view.z) * 1.5,
    my = (vr.height / M.view.z) * 1.5,
    b = { x: b0.x - mx, y: b0.y - my, w: b0.w + 2 * mx, h: b0.h + 2 * my };
  mmBBox = b;
  const W = mmsvg.clientWidth || 220,
    H = mmsvg.clientHeight || 140;
  mmsvg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const aw = W - MM_PAD * 2,
    ah = H - MM_PAD * 2;
  mmFitScale = Math.min(aw / b.w, ah / b.h);
  const s = mmFitScale * mmZoom;
  mmOx = (W - b.w * s) / 2;
  mmOy = (H - b.h * s) / 2;
  const toMM = (x, y) => [(x - b.x) * s + mmOx, (y - b.y) * s + mmOy];
  const r = SR(),
    vpx = (-M.view.x / M.view.z - b.x) * s + mmOx,
    vpy = (-M.view.y / M.view.z - b.y) * s + mmOy,
    vpw = (r.width / M.view.z) * s,
    vph = (r.height / M.view.z) * s;
  const sig = [
    W, H, s, mmOx, mmOy, b.x, b.y,
    M.links.map((l) => l.from + '>' + l.to).join(','),
    M.nodes.map((n) => [n.id, n.x, n.y, n.w, n.h, n.fill, n.color, n.text, HID.has(n.id) ? 1 : 0].join(':')).join('|'),
  ].join(';');
  const place = () => {
    mmVp.setAttribute('width', vpw);
    mmVp.setAttribute('height', vph);
    mmVp.style.transform = `translate(${vpx}px,${vpy}px)`;
  };
  if (sig === mmSig && mmVp && mmVp.isConnected) {
    place(); /* only the view moved */
    return;
  }
  mmSig = sig;
  let h = '';
  for (const l of M.links) {
    const a = byId(l.from),
      c = byId(l.to);
    if (a && c && !HID.has(a.id) && !HID.has(c.id)) {
      const p = toMM(a.x + a.w / 2, a.y + a.h / 2),
        q = toMM(c.x + c.w / 2, c.y + c.h / 2);
      h += `<line class="mm-link" x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}"/>`;
    }
  }
  for (const n of M.nodes) {
    if (HID.has(n.id)) continue;
    const [x, y] = toMM(n.x, n.y),
      w = n.w * s,
      hgt = n.h * s;
    h += `<rect class="mm-node" x="${x}" y="${y}" width="${w}" height="${hgt}" rx="${Math.max(1, 2 * s)}" fill="${esc(n.fill)}"/>`;
    const fs = Math.max(5, Math.min(16, hgt * 0.5));
    if (n.text && hgt >= 6)
      h += `<text class="mm-text" x="${x + w / 2}" y="${y + hgt / 2}" font-size="${fs}" fill="${esc(n.color)}">${esc(n.text)}</text>`;
  }
  h += `<rect class="mm-vp" x="0" y="0" width="${vpw}" height="${vph}" rx="2" style="transform:translate(${vpx}px,${vpy}px)"/>`;
  mmsvg.innerHTML = h;
  mmVp = mmsvg.querySelector('.mm-vp');
  const ze = $('#mmzoom');
  if (ze) ze.textContent = Math.round(mmZoom * 100) + '%';
}
function mmToWorld(cx, cy) {
  if (!mmBBox) return null;
  const r = mmsvg.getBoundingClientRect();
  const vbx = ((cx - r.left) / r.width) * mmsvg.clientWidth;
  const vby = ((cy - r.top) / r.height) * mmsvg.clientHeight;
  const s = mmFitScale * mmZoom;
  return [(vbx - mmOx) / s + mmBBox.x, (vby - mmOy) / s + mmBBox.y];
}
/* Visible area of the map, in world coordinates. */
function mmViewRect() {
  const r = SR();
  return { x: -M.view.x / M.view.z, y: -M.view.y / M.view.z, w: r.width / M.view.z, h: r.height / M.view.z };
}
function mmSetCenter(wx, wy) {
  const r = SR();
  M.view.x = r.width / 2 - wx * M.view.z;
  M.view.y = r.height / 2 - wy * M.view.z;
}
function mmCenterOn(wx, wy) {
  mmSetCenter(wx, wy);
  render();
  viewDirty();
}
/* While dragging, the map follows the pointer at most once per frame (fluid, no extra work). */
let mmMoveRaf = 0,
  mmMoveTo = null,
  mmGlideRaf = 0;
function mmFollow(wx, wy) {
  mmMoveTo = [wx, wy];
  if (mmMoveRaf) return;
  mmMoveRaf = requestAnimationFrame(() => {
    mmMoveRaf = 0;
    if (!mmMoveTo) return;
    mmSetCenter(mmMoveTo[0], mmMoveTo[1]);
    mmMoveTo = null;
    render();
  });
}
/* Click outside the rectangle: the view glides to that point instead of jumping. */
function mmGlide(wx, wy) {
  cancelAnimationFrame(mmGlideRaf);
  const v = mmViewRect(),
    x0 = v.x + v.w / 2,
    y0 = v.y + v.h / 2,
    t0 = performance.now();
  const step = (now) => {
    const k = Math.min(1, (now - t0) / 180),
      e = 1 - Math.pow(1 - k, 3);
    mmSetCenter(x0 + (wx - x0) * e, y0 + (wy - y0) * e);
    render();
    mmGlideRaf = k < 1 ? requestAnimationFrame(step) : 0;
  };
  mmGlideRaf = requestAnimationFrame(step);
}
const mmInsideVp = (pt) => {
  const v = mmViewRect();
  return pt[0] >= v.x && pt[0] <= v.x + v.w && pt[1] >= v.y && pt[1] <= v.y + v.h;
};
function mmZoomBy(f) {
  mmZoom = Math.min(8, Math.max(0.1, mmZoom * f));
  renderMinimap();
}
/* Grab the small rectangle and drag it anywhere: it keeps the spot you grabbed (no jump).
   A click outside the rectangle glides the view there, and you can keep dragging from it. */
mmsvg.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return;
  e.preventDefault();
  const pt = mmToWorld(e.clientX, e.clientY);
  if (!pt) return;
  cancelAnimationFrame(mmGlideRaf);
  mmGlideRaf = 0;
  const v = mmViewRect(),
    inside = mmInsideVp(pt);
  mmPanDrag = inside ? { dx: pt[0] - (v.x + v.w / 2), dy: pt[1] - (v.y + v.h / 2) } : { dx: 0, dy: 0 };
  if (!inside) mmGlide(pt[0], pt[1]);
  mmsvg.setPointerCapture(e.pointerId);
});
mmsvg.addEventListener('mousedown', (e) => {
  if (e.target.dataset && e.target.dataset.c) e.preventDefault(); /* keep focus in the new block's editor */
});
mmsvg.addEventListener('pointermove', (e) => {
  const pt = mmToWorld(e.clientX, e.clientY);
  if (!pt) return;
  if (!mmPanDrag) {
    mmsvg.style.cursor = mmInsideVp(pt) ? 'grab' : 'pointer'; /* hand over the rectangle */
    return;
  }
  if (mmGlideRaf) {
    /* the user started dragging during the glide: follow the pointer from here */
    cancelAnimationFrame(mmGlideRaf);
    mmGlideRaf = 0;
    const v = mmViewRect();
    mmPanDrag = { dx: pt[0] - (v.x + v.w / 2), dy: pt[1] - (v.y + v.h / 2) };
  }
  mmFollow(pt[0] - mmPanDrag.dx, pt[1] - mmPanDrag.dy);
});
const endMmPan = () => {
  if (!mmPanDrag) return;
  mmPanDrag = null;
  viewDirty();
};
mmsvg.addEventListener('pointerup', endMmPan);
mmsvg.addEventListener('pointercancel', endMmPan);
mmsvg.addEventListener(
  'wheel',
  (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.ctrlKey || e.metaKey) {
      mmZoomBy(Math.exp(-e.deltaY * 0.0015));
    }
  },
  { passive: false },
);
mm.addEventListener('click', (e) => {
  const b = e.target.closest('[data-mm]');
  if (!b) return;
  const a = b.dataset.mm;
  if (a === 'zoomin') mmZoomBy(1.25);
  else if (a === 'zoomout') mmZoomBy(1 / 1.25);
  else if (a === 'close') setMmVis(false);
  else if (a === 'pin') {
    mmPinned = !mmPinned;
    mm.classList.toggle('unpinned', !mmPinned);
    if (mmPinned) {
      mm.style.left = '';
      mm.style.top = '';
      mm.style.right = '10px';
    }
    renderMinimap();
  }
});
const stg = $('#stage'),
  MM_M = 20,
  mmzoomEl = $('#mmzoom');
function mmApply(L, T, W, H) {
  mm.style.width = W + 'px';
  mm.style.height = H + 'px';
  mm.style.top = T + 'px';
  if (mmPinned) {
    mm.style.left = '';
    mm.style.right = stg.clientWidth - L - W + 'px';
  } else {
    mm.style.right = 'auto';
    mm.style.left = L + 'px';
  }
  renderMinimap();
}
function mmClamp() {
  if (mmPinned) return;
  const sr = stg.getBoundingClientRect(),
    r = mm.getBoundingClientRect();
  mm.style.left = Math.max(MM_M, Math.min(r.left - sr.left, sr.width - MM_M - r.width)) + 'px';
  mm.style.top = Math.max(MM_M, Math.min(r.top - sr.top, sr.height - MM_M - r.height)) + 'px';
  mm.style.right = 'auto';
}
function mmResetAll() {
  mmZoom = 1;
  mm.style.width = '';
  mm.style.height = '';
  if (mmPinned) {
    mm.style.left = mm.style.top = mm.style.right = '';
  } else mmClamp();
  renderMinimap();
}
if (mmzoomEl)
  mmzoomEl.addEventListener('click', (e) => {
    e.stopPropagation();
    mmResetAll();
  });
const mmControls = mm.querySelector('.mm-controls');
mmControls.addEventListener('pointerdown', (e) => {
  if (mmPinned || e.target.closest('button')) return;
  e.preventDefault();
  const sr = stg.getBoundingClientRect(),
    r = mm.getBoundingClientRect();
  mmWinDrag = { x: e.clientX, y: e.clientY, left: r.left - sr.left, top: r.top - sr.top };
  mmControls.setPointerCapture(e.pointerId);
});
mmControls.addEventListener('pointermove', (e) => {
  if (!mmWinDrag) return;
  const sr = stg.getBoundingClientRect();
  mm.style.left =
    Math.max(
      MM_M,
      Math.min(mmWinDrag.left + e.clientX - mmWinDrag.x, sr.width - MM_M - mm.offsetWidth),
    ) + 'px';
  mm.style.top =
    Math.max(
      MM_M,
      Math.min(mmWinDrag.top + e.clientY - mmWinDrag.y, sr.height - MM_M - mm.offsetHeight),
    ) + 'px';
  mm.style.right = 'auto';
});
const endMmWinDrag = () => {
  mmWinDrag = null;
};
mmControls.addEventListener('pointerup', endMmWinDrag);
mmControls.addEventListener('pointercancel', endMmWinDrag);
/* resize ONLY from the 4 corners; coordinates are relative to #stage; the opposite corner stays fixed and the dragged corner stays under the cursor (offset kept) until it reaches the 20px margin */
let mmRC = null;
mm.addEventListener('pointerdown', (e) => {
  const h = e.target.closest('.mm-rc');
  if (!h || e.button !== 0) return;
  e.preventDefault();
  e.stopPropagation();
  const sr = stg.getBoundingClientRect(),
    r = mm.getBoundingClientRect(),
    c = h.dataset.c,
    L = r.left - sr.left,
    T = r.top - sr.top,
    R = L + r.width,
    B = T + r.height;
  mmRC = {
    c,
    L,
    T,
    R,
    B,
    ox: e.clientX - sr.left - (c.includes('w') ? L : R),
    oy: e.clientY - sr.top - (c.includes('n') ? T : B),
  };
  h.setPointerCapture(e.pointerId);
});
mm.addEventListener('pointermove', (e) => {
  if (!mmRC) return;
  const sr = stg.getBoundingClientRect(),
    d = mmRC,
    px = e.clientX - sr.left - d.ox,
    py = e.clientY - sr.top - d.oy;
  let { L, T, R, B } = d;
  if (d.c.includes('w')) L = Math.max(MM_M, Math.min(px, R - 120));
  else R = Math.min(sr.width - MM_M, Math.max(px, L + 120));
  if (d.c.includes('n')) T = Math.max(MM_M, Math.min(py, B - 80));
  else B = Math.min(sr.height - MM_M, Math.max(py, T + 80));
  mmApply(L, T, R - L, B - T);
});
const endMmRC = () => {
  mmRC = null;
};
mm.addEventListener('pointerup', endMmRC);
mm.addEventListener('pointercancel', endMmRC);
function refreshTB() {
  const on = (a, v) =>
    document.querySelectorAll(`[data-act="${a}"]`).forEach((b) => b.classList.toggle('on', !!v));
  on('grid', M.settings.grid);
  on('snap', M.settings.snap);
  on('layout', M.settings.layout === 'tidy');
  on('trackpad', tpMode());
  on('link', tool === 'link');
  on('select', tool === 'select');
  on('minimap', mmVisible());
}
/* ==========================================================
 * UI BUILD
 * ========================================================== */
const MENUS = [
  [
    'm_file',
    ['new', 'newTab', 'open', 'save', 'saveas', 'rename', 'close', '-', 'export', 'import', '-', 'preview', 'path'],
  ],
  [
    'm_edit',
    ['undo', 'redo', '-', 'cut', 'copy', 'paste', 'dup', 'del', '-', 'selAll', 'desel', '-', 'find'],
  ],
  ['m_insert', ['root', 'node', 'child', 'childLeft', 'childDown', 'sibling', 'link', '-', 'newPage']],
  [
    'm_view',
    [
      'minimap',
      'zoomIn',
      'zoomOut',
      'zoomReset',
      'fit',
      '-',
      'pagePrev',
      'pageNext',
      '-',
      'grid',
      'snap',
      'layout',
      'trackpad',
      '-',
      'full',
      'theme',
    ],
  ],
  ['m_help', ['shortcuts', 'about', 'license']],
];
const TB = [
  ['undo', '↶'],
  ['redo', '↷'],
  '|',
  ['dup', '⧉'],
  ['del', '✕'],
  '|',
  ['zoomOut', '−'],
  'z',
  ['zoomIn', '+'],
  ['fit', '⤢'],
  '|',
  ['grid', '▦'],
  ['snap', '⌗'],
  ['layout', '⊞'],
  ['trackpad', '✥'],
  ['minimap', '◫'],
];
const TL = [
  ['select', '↖'],
  ['node', '＋'],
  ['child', '→'],
  ['sibling', '↓'],
  ['link', '⟷'],
];
const AI = {
  left: '<path d="M1 1h12M1 6h8M1 11h11"/>',
  center: '<path d="M1 1h12M3 6h8M2 11h10"/>',
  right: '<path d="M1 1h12M5 6h8M2 11h11"/>',
};
function buildUI() {
  const tip = (a) => esc(t('a_' + a) + (shortcutOf(a) ? ` (${shortcutOf(a)})` : ''));
  $('#menubar').innerHTML = MENUS.map((m, i) => `<button data-m="${i}">${t(m[0])}</button>`).join(
    '',
  );
  $('#tbbtns').innerHTML = TB.map((x) =>
    x === '|'
      ? '<i class="sep"></i>'
      : x === 'z'
        ? `<button id="zl" data-act="zoomReset" title="${tip('zoomReset')}">100%</button>`
        : `<button data-act="${x[0]}" title="${tip(x[0])}">${x[1]}</button>`,
  ).join('');
  $('#tools').innerHTML =
    `<button class="ttl" data-act="root" title="${tip('root')}"><b>T</b><small>${t('title')}</small></button><hr>` +
    TL.map((x) => `<button data-act="${x[0]}" title="${tip(x[0])}">${x[1]}</button>`).join('') +
    '<hr>' +
    SH.map(
      (s) =>
        `<button data-shape="${s}" title="${t('s_' + s)}"><i class="shi sh-${s}"></i></button>`,
    ).join('');
  $('#theme').title = t('a_theme');
  $('#theme').textContent = theme === 'dark' ? '☾' : '☀'; /* same glyphs as the home button */
  $('#btnHelp').title = t('hm_help');
  $('#btnHelp').innerHTML = svgIc(IC.help);
  $('#pmenu').innerHTML = `<button data-hm-act="about">${svgIc(IC.info)}<span>${t('hm_info')}</span></button><button data-hm-act="license">${svgIc(IC.doc)}<span>${t('hm_license')}</span></button><button data-hm-act="shortcuts">${svgIc(IC.kbd)}<span>${t('hm_shortcuts')}</span></button>`;
  $('#btnProjects').textContent = t('a_projects');
  $('#pname').title = t('a_rename');
  $('#nsq').placeholder = t('s_ph');
  $('#nsq').setAttribute('aria-label', t('s_ph'));
  $('#nsearch [data-ns="prev"]').title = t('s_prev');
  $('#nsearch [data-ns="next"]').title = t('s_next');
  $('#nsearch [data-ns="clear"]').title = t('s_clear');
  buildHome();
  pagesRender();
  updTitle();
  setStat(st);
  hint();
  render();
}
function updTitle() {
  document.title = (cur ? cur.name + ' – ' : '') + 'Mindly';
  $('#pname').textContent = cur ? cur.name : t('st_none');
}
function setStat(s) {
  st = s;
  const e = $('#savestat');
  e.className = 'stat ' + s;
  e.textContent = t('st_' + s);
}
function hint() {
  $('#hint').textContent = tool === 'link' ? t(linkFrom ? 'h_link2' : 'h_link1') : t(tpMode() ? 'h_selectTp' : 'h_select');
}
function toast(m, ty) {
  const e = document.createElement('div');
  e.className = 'toast' + (ty === 'err' ? ' err' : '');
  e.textContent = m;
  $('#toasts').appendChild(e);
  setTimeout(() => e.remove(), 3200);
}
const err = (e, k) => toast(t(k) + (D['e_' + e.message] ? ': ' + t('e_' + e.message) : ''), 'err');
/* ==========================================================
 * POPUP / MODAL
 * ========================================================== */
function hidePop() {
  $('#ctx').hidden = true;
}
function popup(items, x, y) {
  const p = $('#ctx');
  const row = (it, i) =>
    `<button data-i="${i}"${it.sub ? ' data-s="1"' : ''}><span class="ck">${it.chk ? '✓' : ''}</span>${esc(it.l)}<kbd>${it.sub ? '▸' : esc(it.sc || '')}</kbd></button>`;
  p.innerHTML = items
    .map((it, i) =>
      it === '-'
        ? '<hr>'
        : row(it, i) +
          (it.sub
            ? `<div class="sub" hidden>${it.sub.map((q, k) => row(q, i + '.' + k)).join('')}</div>`
            : ''),
    )
    .join('');
  p.hidden = false;
  p.style.left = Math.max(0, Math.min(x, innerWidth - p.offsetWidth - 4)) + 'px';
  p.style.top = Math.max(0, Math.min(y, innerHeight - p.offsetHeight - 4)) + 'px';
  const openSub = (b) => {
    p.querySelectorAll('.sub').forEach((q) => (q.hidden = true));
    if (!b || !b.dataset.s) return;
    const q = b.nextElementSibling;
    q.hidden = false;
    q.style.top = b.offsetTop - 5 + 'px';
    q.classList.remove('flip');
    if (p.getBoundingClientRect().right + q.offsetWidth + 8 > innerWidth) q.classList.add('flip');
  };
  p.onmouseover = (e) => {
    const b = e.target.closest('button');
    if (b && b.parentElement === p) openSub(b);
  };
  p.onclick = (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.s) {
      openSub(b);
      return;
    }
    const k = b.dataset.i.split('.');
    let it = items[k[0]];
    if (k.length > 1) it = it.sub[k[1]];
    hidePop();
    it.f();
  };
}
function modal(title, body, btns, wide, oc) {
  const m = $('#modal');
  m.innerHTML = `<div class="dlg${wide ? ' wide' : ''}"><h3>${title}</h3><div class="mb"></div><div class="mbt"></div></div>`;
  const mb = m.querySelector('.mb');
  typeof body === 'string' ? (mb.innerHTML = body) : mb.appendChild(body);
  const bt = m.querySelector('.mbt');
  (btns || []).forEach((b) => {
    const e = document.createElement('button');
    e.className = 'btn ' + (b.c || '');
    e.textContent = b.l;
    e.onclick = () => {
      if (!b.f || b.f() !== false) closeModal();
    };
    bt.appendChild(e);
  });
  onMC = oc || null;
  m.hidden = false;
  m.onpointerdown = (e) => {
    if (e.target === m) closeModal();
  };
}
function closeModal() {
  const f = onMC;
  onMC = null;
  const m = $('#modal');
  m.hidden = true;
  m.innerHTML = '';
  f && f();
}
function ask(title, label, val) {
  return new Promise((res) => {
    const b = document.createElement('div');
    b.innerHTML = `<label class="f"><span>${label}</span><input maxlength="60" value="${esc(val)}"></label>`;
    let done = false;
    const fin = (v) => {
      if (!done) {
        done = true;
        res(v);
      }
    };
    modal(
      title,
      b,
      [
        { l: t('b_cancel'), f: () => fin(null) },
        {
          l: t('b_ok'),
          c: 'pri',
          f: () => {
            const v = b.querySelector('input').value.trim();
            if (!v) return false;
            fin(v);
          },
        },
      ],
      false,
      () => fin(null),
    );
    const i = b.querySelector('input');
    i.focus();
    i.select();
    i.onkeydown = (e) => {
      if (e.key === 'Enter') $('#modal .pri').click();
    };
  });
}
function confirmDlg(title, msg, label) {
  return new Promise((res) => {
    let done = false;
    const fin = (v) => {
      if (!done) {
        done = true;
        res(v);
      }
    };
    modal(
      title,
      `<p>${esc(msg)}</p>`,
      [
        { l: t('b_cancel'), f: () => fin(false) },
        { l: label || t('b_delete'), c: 'pri', f: () => fin(true) },
      ],
      false,
      () => fin(false),
    );
  });
}
function deleteChoiceDlg(name) {
  return new Promise((res) => {
    let done = false;
    const fin = (v) => {
      if (!done) {
        done = true;
        res(v);
      }
    };
    modal(
      t('d_del2Title'),
      `<p>${esc(t('d_del2Msg', name))}</p>`,
      [
        { l: t('b_cancel'), f: () => fin(null) },
        { l: t('b_delOnly'), f: () => fin('del') },
        { l: t('b_delExport'), c: 'pri', f: () => fin('exp') },
      ],
      false,
      () => fin(null),
    );
  });
}
function showInfo() {
  const r = (k, v) => `<div class="r"><span>${t(k)}</span><span>${v}</span></div>`;
  modal(
    t('hm_info'),
    `<div class="pinfo">${r('pi_name', 'Mindly')}${r('pi_version', '5.0')}${r('pi_what', t('pi_whatV'))}${r('pi_where', esc(t('pi_whereV')))}${r('pi_req', t('pi_reqV'))}${r('pi_export', t('pi_exportV'))}</div>`,
    [{ l: t('b_close'), c: 'pri' }],
  );
}
const LICENSE_TXT = `MIT License

Copyright (c) 2026 Mindly

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;
function showLicense() {
  modal(
    t('a_license'),
    `<pre class="lic">${esc(LICENSE_TXT)}</pre><p class="lic-more">${t('lic_more')} <a href="https://opensource.org/license/mit" target="_blank" rel="noopener">https://opensource.org/license/mit</a></p>`,
    [{ l: t('b_close'), c: 'pri' }],
    true,
  );
}
function showShortcuts() {
  const g = {};
  SC.forEach((s) => (g[s[0]] = g[s[0]] || []).push(s));
  let h = '<div class="sc">';
  for (const k in g)
    h +=
      `<h4>${t(k)}</h4>` +
      g[k]
        .map(
          (s) =>
            `<div class="r"><span>${t(s[3] || 'a_' + s[2])}</span><kbd>${esc(s[1])}</kbd></div>`,
        )
        .join('');
  modal(t('a_shortcuts'), h + '</div>', [{ l: t('b_close'), c: 'pri' }], true);
}
/* ==========================================================
 * PAGES
 * A project has one or more pages. M.nodes / M.links / M.view always hold the ACTIVE page;
 * PG.list keeps every page (the active page's entry is refreshed by pagesSync()).
 * In project.json the top-level nodes / links / view are the active page and `pages` lists the others.
 * ========================================================== */
let PG = { list: [], active: '' };
const pageById = (id) => PG.list.find((p) => p.id === id);
function pagesSync() {
  const a = pageById(PG.active);
  if (a) {
    a.nodes = M.nodes;
    a.links = M.links;
    a.view = M.view;
  }
}
function pagesLoad(p) {
  const raw = Array.isArray(p.pages) ? p.pages.filter((x) => x && typeof x === 'object') : [];
  if (!raw.length) {
    PG.list = [{ id: uid(), name: t('pg_default', 1), nodes: M.nodes, links: M.links, view: M.view }];
    PG.active = PG.list[0].id;
    return;
  }
  const act = raw.find((x) => x.id === p.activePage) || raw[0],
    seen = new Set();
  PG.list = raw.map((x, i) => {
    let id = String(x.id || uid());
    if (seen.has(id)) id = uid();
    seen.add(id);
    const on = x === act;
    return {
      id,
      name: String(x.name || '').trim().slice(0, 60) || t('pg_default', i + 1),
      nodes: on ? M.nodes : (x.nodes || []).map(mk),
      links: on ? M.links : (x.links || []).map(mkl),
      view: on ? M.view : x.view ? { ...blank().view, ...x.view } : null,
    };
  });
  PG.active = PG.list[raw.indexOf(act)].id;
}
function pagesRender() {
  const b = $('#pagebar');
  if (!cur || !pageById(PG.active)) {
    b.innerHTML = '';
    pagePanel(false);
    return;
  }
  const pg = pageById(PG.active),
    many = PG.list.length > 1,
    nav = (d, ch, k) =>
      many ? `<button type="button" class="pg-nav" data-pgstep="${d}" title="${esc(t(k))}">${ch}</button>` : '';
  b.innerHTML =
    nav(-1, '‹', 'a_pagePrev') +
    `<button type="button" class="pg-cur" data-pgmenu title="${esc(pg.name)}"><span>${esc(pg.name)}</span>${many ? `<small>${PG.list.indexOf(pg) + 1}/${PG.list.length}</small>` : ''}<i>▾</i></button>` +
    nav(1, '›', 'a_pageNext') +
    `<button type="button" class="pg-add" data-pgadd title="${esc(t('a_newPage'))}">＋</button>`;
  if (pgOpen) pagePanel(true);
}
function pageLoad(pg) {
  PG.active = pg.id;
  M.nodes = pg.nodes;
  M.links = pg.links;
  if (pg.view) M.view = pg.view;
  else {
    const s = SR();
    M.view = pg.view = { x: s.width / 2, y: s.height / 2, z: 1 };
  }
  undoS = pg.u || [];
  redoS = pg.r || [];
  pg.u = pg.r = null;
  sel = { n: new Set(), l: null };
  lk = '';
  linkFrom = null;
  tool = 'select';
  searchClear();
  if (M.settings.layout === 'tidy') layoutAll();
  hint();
  render();
  buildPanel();
  pagesRender();
}
function pageGo(id) {
  if (!cur || id === PG.active) return;
  pagePanel(false);
  const to = pageById(id);
  if (!to) return;
  if (editing) commitEdit();
  if (editingLink) commitEditLink();
  pagesSync();
  const from = pageById(PG.active);
  from.u = undoS;
  from.r = redoS;
  pageLoad(to);
  viewDirty();
}
function pageStep(d) {
  if (!need() || PG.list.length < 2) return;
  const i = PG.list.findIndex((p) => p.id === PG.active);
  pageGo(PG.list[(i + d + PG.list.length) % PG.list.length].id);
}
const pageName = (base) => {
  let n = String(base).slice(0, 60),
    i = 2;
  const names = new Set(PG.list.map((p) => p.name));
  while (names.has(n)) n = String(base).slice(0, 55) + ' ' + i++;
  return n;
};
const PG_MAX = 100;
async function pageAdd() {
  if (!need()) return;
  if (PG.list.length >= PG_MAX) return toast(t('pg_max'), 'err');
  const n = await ask(t('pg_newTitle'), t('pg_name'), pageName(t('pg_default', PG.list.length + 1)));
  if (n == null) return;
  const root = rootNode();
  root.isTitle = false; /* only the first page's title block follows the project name */
  const pg = { id: uid(), name: pageName(n), nodes: [root], links: [], view: null };
  PG.list.push(pg);
  pageGo(pg.id);
  markDirty();
}
async function pageRename(id) {
  const pg = pageById(id);
  if (!pg) return;
  const n = await ask(t('pg_renTitle'), t('pg_name'), pg.name);
  if (n == null || n === pg.name) return;
  pg.name = pageName(n);
  pagesRender();
  viewDirty();
}
function pageDup(id) {
  if (PG.list.length >= PG_MAX) return toast(t('pg_max'), 'err');
  pagesSync();
  const src = pageById(id);
  if (!src) return;
  const map = new Map(),
    nodes = JSON.parse(JSON.stringify(src.nodes)).map((n) => {
      const nid = uid();
      map.set(n.id, nid);
      return { ...n, id: nid, isTitle: false };
    }),
    links = JSON.parse(JSON.stringify(src.links)).map((l) => ({
      ...l,
      id: uid(),
      from: map.get(l.from) || l.from,
      to: map.get(l.to) || l.to,
    })),
    pg = {
      id: uid(),
      name: pageName(t('pg_copy', src.name)),
      nodes,
      links,
      view: src.view ? { ...src.view } : null,
    };
  PG.list.splice(PG.list.indexOf(src) + 1, 0, pg);
  pageGo(pg.id);
  markDirty();
}
async function pageDel(id) {
  const pg = pageById(id);
  if (!pg) return;
  if (PG.list.length < 2) return toast(t('pg_last'), 'err');
  if (!(await confirmDlg(t('pg_delTitle'), t('pg_delMsg', pg.name), t('b_delete')))) return;
  if (editing) cancelEdit();
  if (editingLink) cancelEdit();
  const i = PG.list.indexOf(pg);
  if (id === PG.active) {
    PG.list.splice(i, 1);
    pageLoad(PG.list[Math.min(i, PG.list.length - 1)]);
  } else {
    pagesSync();
    PG.list.splice(i, 1);
    pagesRender();
  }
  markDirty();
}
/* ----- page panel: opens above the pill; pick a page, rename / duplicate / delete, drag to reorder ----- */
let pgOpen = false;
function pagePanel(on) {
  pgOpen = !!on && !!cur;
  const p = $('#pgpanel');
  p.hidden = !pgOpen;
  if (!pgOpen) return;
  p.innerHTML =
    `<div class="pg-list" role="listbox">` +
    PG.list
      .map(
        (g) =>
          `<div class="pg-row${g.id === PG.active ? ' on' : ''}" role="option" aria-selected="${g.id === PG.active}" data-pg="${esc(g.id)}" draggable="true" title="${esc(t('pg_drag'))}"><span class="pg-ck">${g.id === PG.active ? '✓' : ''}</span><span class="pg-n">${esc(g.name)}</span><span class="pg-ico"><button type="button" data-pgact="ren" title="${esc(t('pg_ren'))}">✎</button><button type="button" data-pgact="dup" title="${esc(t('pg_dup'))}">⧉</button>${PG.list.length > 1 ? `<button type="button" data-pgact="del" title="${esc(t('pg_del'))}">✕</button>` : ''}</span></div>`,
      )
      .join('') +
    `</div><button type="button" class="pg-new" data-pgact="new">＋ ${esc(t('a_newPage'))}</button>`;
  const on1 = p.querySelector('.pg-row.on');
  if (on1) on1.scrollIntoView({ block: 'nearest' });
}
function pageReorder(id, to) {
  const i = PG.list.findIndex((p) => p.id === id);
  if (i < 0) return;
  const [pg] = PG.list.splice(i, 1);
  PG.list.splice(Math.max(0, Math.min(to, PG.list.length)), 0, pg);
  pagesRender();
  viewDirty();
}
/* ==========================================================
 * HISTORY & SAVING
 * ========================================================== */
const core = () => JSON.stringify({ nodes: M.nodes, links: M.links });
function snapshot(k) {
  const n = Date.now();
  if (k && k === lk && n - lt < 1200) {
    lt = n;
    return;
  }
  lk = k || '';
  lt = n;
  undoS.push(core());
  if (undoS.length > 300) undoS.shift();
  redoS = [];
}
function restore(s) {
  if (editing) cancelEdit();
  const o = JSON.parse(s);
  M.nodes = o.nodes;
  M.links = o.links;
  sel.n = new Set([...sel.n].filter(byId));
  if (sel.l && !M.links.some((l) => l.id === sel.l)) sel.l = null;
  lk = '';
  markDirty();
  render();
  buildPanel();
}
function undo() {
  if (!cur || !undoS.length) return;
  redoS.push(core());
  restore(undoS.pop());
}
function redo() {
  if (!cur || !redoS.length) return;
  undoS.push(core());
  restore(redoS.pop());
}
function markDirty() {
  if (!cur) return;
  searchRefresh();
  if (M.settings.layout === 'tidy') {
    layoutAll();
    render();
  }
  dirty = true;
  setStat('unsaved');
  clearTimeout(saveT);
  saveT = setTimeout(() => save(true), 1500);
}
function viewDirty() {
  if (!cur) return;
  dirty = true;
  clearTimeout(saveT);
  saveT = setTimeout(() => save(true), 1500);
}
const proj = () => {
  pagesSync();
  const o = { version: 1, nodes: M.nodes, links: M.links, settings: M.settings, view: M.view };
  if (PG.list.length) {
    /* the active page is the top-level nodes/links/view, so its entry carries only id + name */
    o.pages = PG.list.map((p) =>
      p.id === PG.active
        ? { id: p.id, name: p.name }
        : { id: p.id, name: p.name, nodes: p.nodes, links: p.links, view: p.view || undefined },
    );
    o.activePage = PG.active;
  }
  return o;
};
async function api(m, u, b) {
  const r = await fetch('/api' + u, {
    method: m,
    headers: { 'Content-Type': 'application/json' },
    body: b ? JSON.stringify(b) : undefined,
  });
  let j = {};
  try {
    j = await r.json();
  } catch (e) {}
  if (!r.ok) throw Error(j.error || 'error');
  return j;
}
async function save(auto) {
  if (!cur) return true;
  clearTimeout(saveT);
  if (!dirty && auto) return true;
  if (saving || renaming) return false;
  saving = true;
  setStat('saving');
  dirty = false;
  let ok = true;
  try {
    const r = await api('PUT', '/projects/' + encodeURIComponent(cur.id), { project: proj() });
    cur.modified = r.modified;
    setStat(dirty ? 'unsaved' : 'saved');
    if (!auto) toast(t('t_saved'));
  } catch (e) {
    dirty = true;
    ok = false;
    setStat('error');
    toast(t('t_saveErr'), 'err');
  }
  saving = false;
  if (dirty && ok) saveT = setTimeout(() => save(true), 500);
  return ok;
}
addEventListener('beforeunload', (e) => {
  if (dirty) {
    e.preventDefault();
    e.returnValue = '';
  }
});
addEventListener('pagehide', () => {
  if (dirty && cur)
    fetch('/api/projects/' + encodeURIComponent(cur.id), {
      method: 'PUT',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project: proj() }),
    });
});
/* ==========================================================
 * PROJECTS
 * ========================================================== */
/* One project per tab: a Web Lock named after the project is held while it is open, so the same
   project can never be edited (and saved) from two tabs at once. Different projects are fully
   independent in different tabs. The tab's URL (#project-folder) lets a reload reopen it. */
let projLock = null;
function tryLock(id) {
  if (!navigator.locks) return Promise.resolve({ id, release() {} });
  return new Promise((resolve) => {
    navigator.locks.request('mindly:' + id, { ifAvailable: true }, (lock) => {
      if (!lock) return void resolve(null);
      return new Promise((release) => resolve({ id, release }));
    });
  });
}
function setLock(h) {
  if (projLock) projLock.release();
  projLock = h;
}
async function relock(id) {
  const old = projLock;
  if (old) (old.release(), (projLock = null));
  projLock = await tryLock(id);
}
async function openElsewhere(id) {
  if (!navigator.locks || (cur && cur.id === id)) return false;
  const h = await tryLock(id);
  if (h) h.release();
  return !h;
}
const setHash = (id) =>
  history.replaceState(null, '', location.pathname + location.search + (id ? '#' + encodeURIComponent(id) : ''));
const openInTab = (id) =>
  window.open(location.pathname + (id ? '#' + encodeURIComponent(id) : ''), '_blank', 'noopener');
const recs = () => {
  try {
    return JSON.parse(PS.mRecent || '[]');
  } catch (e) {
    return [];
  }
};
const setRecs = (a) => (PS.mRecent = JSON.stringify(a.slice(0, 8)));
const fmtD = (s) => (s ? new Date(s).toLocaleString('en-GB') : '');
function resetCur() {
  cur = null;
  M = blank();
  PG = { list: [], active: '' };
  pagesRender();
  searchClear();
  undoS = [];
  redoS = [];
  dirty = false;
  clearTimeout(saveT);
  sel = { n: new Set(), l: null };
  editing = null;
  editBase = null;
  $('#editor').hidden = true;
  PS.removeItem('mLast');
  setLock(null);
  setHash('');
  setStat('none');
  updTitle();
  render();
  buildPanel();
}
async function openProject(id) {
  if (cur && dirty && !(await save(false))) return;
  let lk = null;
  if (!(cur && cur.id === id)) {
    lk = await tryLock(id);
    if (!lk) return toast(t('t_openElsewhere'), 'err');
  }
  try {
    const r = await api('GET', '/projects/' + encodeURIComponent(id));
    cur = {
      id: r.id,
      name: r.metadata.name,
      created: r.metadata.created,
      modified: r.metadata.modified,
    };
    M = norm(r.project);
    pagesLoad(r.project);
    searchClear();
    if (M.settings.layout === 'tidy') layoutAll();
    if (!r.project.view) {
      const s = SR();
      M.view = { x: s.width / 2, y: s.height / 2, z: 1 };
    }
    undoS = [];
    redoS = [];
    sel = { n: new Set(), l: null };
    dirty = false;
    tool = 'select';
    linkFrom = null;
    setRecs([id, ...recs().filter((x) => x !== id)]);
    PS.mLast = id;
    if (lk) setLock(lk);
    setHash(id);
    setStat('saved');
    updTitle();
    hint();
    render();
    buildPanel();
    pagesRender();
  } catch (e) {
    if (lk) lk.release();
    if (!cur) setHash('');
    err(e, 't_loadErr');
  }
}
const newMap = () => ({
  version: 1,
  nodes: [rootNode()],
  links: [],
  settings: { grid: true, snap: false, layout: 'tidy' },
});
async function newProject() {
  const n = await ask(t('d_new'), t('d_name'), t('untitled'));
  if (n == null) return;
  try {
    const r = await api('POST', '/projects', {
      name: n,
      project: { ...newMap(), view: { x: SR().width / 2, y: SR().height / 2, z: 1 } },
    });
    toast(t('t_created'));
    await openProject(r.id);
  } catch (e) {
    err(e, 't_saveErr');
  }
}
async function syncName(txt) {
  if (PG.list[0] && PG.active !== PG.list[0].id) return; /* only the first page names the project */
  const v = String(txt || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60);
  if (!v || !cur || v === cur.name || renaming) return;
  await save(true);
  if (!cur || saving) return;
  renaming = true;
  try {
    const old = cur.id,
      r = await api('POST', '/projects/' + encodeURIComponent(old) + '/rename', { name: v });
    cur.id = r.id;
    cur.name = r.metadata.name;
    PS.mLast = r.id;
    await relock(r.id);
    setHash(r.id);
    setRecs(recs().map((x) => (x === old ? r.id : x)));
    setFavs(favs().map((x) => (x === old ? r.id : x)));
    updTitle();
  } catch (e) {}
  renaming = false;
  if (dirty) {
    clearTimeout(saveT);
    saveT = setTimeout(() => save(true), 400);
  }
}
async function renameProject(id, name) {
  const v = await ask(t('d_rename'), t('d_name'), name);
  if (v == null || v === name) return;
  if (await openElsewhere(id)) return toast(t('t_openElsewhere'), 'err');
  if (cur && cur.id === id) await save(false);
  try {
    const r = await api('POST', '/projects/' + encodeURIComponent(id) + '/rename', { name: v });
    if (cur && cur.id === id) {
      cur.id = r.id;
      cur.name = r.metadata.name;
      updTitle();
      PS.mLast = r.id;
      await relock(r.id);
      setHash(r.id);
    }
    setRecs(recs().map((x) => (x === id ? r.id : x)));
    setFavs(favs().map((x) => (x === id ? r.id : x)));
    toast(t('t_renamed'));
    if (!cur) showHome();
  } catch (e) {
    err(e, 't_saveErr');
  }
}
async function dupProject(id, name) {
  const v = await ask(t('d_dup'), t('d_name'), t('copyOf', name));
  if (v == null) return null;
  try {
    const r = await api('POST', '/projects/' + encodeURIComponent(id) + '/duplicate', { name: v });
    toast(t('t_dupd'));
    if (!cur) showHome();
    return r.id;
  } catch (e) {
    err(e, 't_saveErr');
    return null;
  }
}
async function deleteProject(id, name) {
  if (await openElsewhere(id)) return toast(t('t_openElsewhere'), 'err');
  if (!(await confirmDlg(t('d_delTitle'), t('d_delMsg', name), t('d_delYes')))) return;
  const choice = await deleteChoiceDlg(name);
  if (!choice) return;
  if (choice === 'exp') {
    /* download the JSON first: if that fails, nothing is deleted */
    try {
      const open = cur && cur.id === id;
      const project = open ? proj() : (await api('GET', '/projects/' + encodeURIComponent(id))).project;
      downloadJson(name, project);
    } catch (e) {
      return toast(t('t_exportErr'), 'err');
    }
  }
  try {
    await api('DELETE', '/projects/' + encodeURIComponent(id));
    setRecs(recs().filter((x) => x !== id));
    setFavs(favs().filter((x) => x !== id));
    if (cur && cur.id === id) resetCur();
    toast(t(choice === 'exp' ? 't_deletedExp' : 't_deleted'));
    if (!cur) showHome();
  } catch (e) {
    err(e, 't_delErr');
  }
}
async function manager() {
  let list = [];
  try {
    list = (await api('GET', '/projects')).projects;
  } catch (e) {
    return err(e, 't_loadErr');
  }
  const box = document.createElement('div');
  /* sort menu: a custom dropdown, because a native <select> cannot show two-line options */
  const SORTS = [
    ['m', 'pm_mod1', 'pm_mod2'],
    ['c', 'pm_cre1', 'pm_cre2'],
    ['n', 'pm_name'],
  ];
  const sortLbl = (s) =>
    `<span class="sortdd-l">${s
      .slice(1)
      .map((k) => `<span>${t(k)}</span>`)
      .join('')}</span>`;
  box.innerHTML = `<div class="pmbar"><input id="pq" placeholder="${t('pm_search')}"><div class="sortdd" id="ps" data-v="m"><button type="button" class="sortdd-btn" aria-haspopup="listbox" aria-expanded="false">${sortLbl(SORTS[0])}<i class="sortdd-ar">▾</i></button><div class="sortdd-menu" role="listbox" hidden>${SORTS.map((s) => `<button type="button" role="option" data-v="${s[0]}" aria-selected="${s[0] === 'm'}">${sortLbl(s)}</button>`).join('')}</div></div><button class="btn pri two" data-r="new" title="${t('a_new')}"><span>${t('a_new1')}</span><span>${t('a_new2')}</span></button><button class="btn two" data-r="import" title="${t('a_importProj')}"><span>${t('a_imp1')}</span><span>${t('a_imp2')}</span></button></div><div id="prec"></div><div id="plist"></div>`;
  modal(t('a_projects'), box, [{ l: t('b_close') }], true);
  const dd = box.querySelector('#ps'),
    ddb = dd.querySelector('.sortdd-btn'),
    ddm = dd.querySelector('.sortdd-menu');
  const closeDD = () => {
    ddm.hidden = true;
    ddb.setAttribute('aria-expanded', 'false');
  };
  const openDD = () => {
    const r = ddb.getBoundingClientRect();
    ddm.style.left = r.left + 'px';
    ddm.style.top = r.bottom + 4 + 'px';
    ddm.style.minWidth = r.width + 'px';
    ddm.hidden = false;
    ddb.setAttribute('aria-expanded', 'true');
  };
  ddb.onclick = () => (ddm.hidden ? openDD() : closeDD());
  ddm.onclick = (e) => {
    const o = e.target.closest('[data-v]');
    if (!o) return;
    dd.dataset.v = o.dataset.v;
    ddb.querySelector('.sortdd-l').outerHTML = sortLbl(SORTS.find((s) => s[0] === o.dataset.v));
    ddm.querySelectorAll('[data-v]').forEach((x) => x.setAttribute('aria-selected', x === o));
    closeDD();
    ddb.focus();
    draw();
  };
  dd.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !ddm.hidden) {
      e.stopPropagation();
      closeDD();
      ddb.focus();
    } else if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && !ddm.hidden) {
      e.preventDefault();
      const o = [...ddm.querySelectorAll('[data-v]')],
        i = o.indexOf(document.activeElement);
      o[(i + (e.key === 'ArrowDown' ? 1 : -1) + o.length) % o.length].focus();
    }
  });
  box.addEventListener('pointerdown', (e) => {
    if (!dd.contains(e.target)) closeDD();
  });
  const draw = () => {
    const q = box.querySelector('#pq').value.toLowerCase(),
      s = dd.dataset.v;
    let a = list.filter((p) => p.name.toLowerCase().includes(q));
    a.sort((x, y) =>
      s === 'n'
        ? x.name.localeCompare(y.name)
        : s === 'c'
          ? y.created.localeCompare(x.created)
          : y.modified.localeCompare(x.modified),
    );
    const rc = recs()
      .map((id) => list.find((p) => p.id === id))
      .filter(Boolean);
    box.querySelector('#prec').innerHTML =
      rc.length && !q
        ? `<small class="muted">${t('pm_recent')}</small><br>` +
          rc
            .map((p) => `<button data-r="open" data-id="${esc(p.id)}">${esc(p.name)}</button>`)
            .join('')
        : '';
    box.querySelector('#plist').innerHTML = a.length
      ? a
          .map(
            (p) =>
              `<div class="row" data-r="open" data-id="${esc(p.id)}" tabindex="0"><div class="nm"><b>${esc(p.name)}</b><small>${t('pm_modified')}: ${fmtD(p.modified)} · ${t('pm_created')}: ${fmtD(p.created)}</small></div><button data-r="open" data-id="${esc(p.id)}">${t('b_open')}</button><button data-r="tab" data-id="${esc(p.id)}" title="${t('b_tab')}">↗</button><button data-r="ren" data-id="${esc(p.id)}" title="${t('b_ren')}">✎</button><button data-r="dup" data-id="${esc(p.id)}" title="${t('b_dup')}">⧉</button><button data-r="del" data-id="${esc(p.id)}" title="${t('b_delete')}">✕</button></div>`,
          )
          .join('')
      : `<p class="muted">${t('pm_none')}</p>`;
  };
  box.querySelector('#pq').oninput = draw;
  draw();
  box.onkeydown = (e) => {
    if (e.key === 'Enter' && e.target.classList.contains('row')) e.target.click();
  };
  box.onclick = async (e) => {
    const b = e.target.closest('[data-r]');
    if (!b) return;
    const id = b.dataset.id,
      p = list.find((x) => x.id === id),
      r = b.dataset.r;
    if (r === 'open') {
      closeModal();
      openProject(id);
    } else if (r === 'tab') openInTab(id);
    else if (r === 'new') newProject();
    else if (r === 'import') {
      $('#file').click();
    } else if (r === 'ren') {
      await renameProject(id, p.name);
      manager();
    } else if (r === 'dup') {
      const n = await dupProject(id, p.name);
      manager();
      void n;
    } else if (r === 'del') {
      await deleteProject(id, p.name);
      manager();
    }
  };
}
async function saveAs() {
  if (!need()) return;
  await save(false);
  const id = await dupProject(cur.id, cur.name);
  if (id) await openProject(id);
}
async function closeProject() {
  if (!cur) return;
  if (!(await save(false))) return;
  resetCur();
  showHome();
}
/* ==========================================================
 * HOME (start page: search, create / import, list of mind maps)
 * ========================================================== */
const favs = () => {
  try {
    return JSON.parse(PS.mFav || '[]');
  } catch (e) {
    return [];
  }
};
const setFavs = (a) => (PS.mFav = JSON.stringify(a));
const H = { q: '', f: 'all', view: PS.mView === 'list' ? 'list' : 'grid', list: [] };
const thumbCache = {};
const thumbKey = (p) => p.id + '|' + p.modified;
function thumbSVG(p) {
  const ns = (p.nodes || []).filter((n) => isFinite(n.x) && isFinite(n.y) && n.w > 0 && n.h > 0);
  if (!ns.length) return '';
  const x0 = Math.min(...ns.map((n) => n.x)),
    y0 = Math.min(...ns.map((n) => n.y)),
    x1 = Math.max(...ns.map((n) => n.x + n.w)),
    y1 = Math.max(...ns.map((n) => n.y + n.h)),
    pad = Math.max(x1 - x0, y1 - y0) * 0.06 + 8,
    by = Object.fromEntries(ns.map((n) => [n.id, n]));
  const lines = (p.links || [])
    .map((l) => {
      const a = by[l.from],
        b = by[l.to];
      return a && b
        ? `<line x1="${a.x + a.w / 2}" y1="${a.y + a.h / 2}" x2="${b.x + b.w / 2}" y2="${b.y + b.h / 2}"/>`
        : '';
    })
    .join('');
  const rects = ns
    .map(
      (n) =>
        `<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="${Math.min(n.radius || 0, n.h / 2, 14)}" fill="${esc(n.fill || '#fff')}" stroke="${esc(n.stroke || '#a1a1a1')}"/>`,
    )
    .join('');
  return `<svg viewBox="${x0 - pad} ${y0 - pad} ${x1 - x0 + 2 * pad} ${y1 - y0 + 2 * pad}" preserveAspectRatio="xMidYMid meet"><g stroke="#a1a1a1" stroke-width="1">${lines}</g><g stroke-width="1">${rects}</g></svg>`;
}
function fillThumbs() {
  const by = Object.fromEntries(H.list.map((p) => [p.id, p]));
  document.querySelectorAll('.home-card-thumb').forEach((el) => {
    const p = by[el.dataset.th],
      s = p && thumbCache[thumbKey(p)];
    if (s && el.innerHTML !== s) el.innerHTML = s;
  });
}
async function loadThumbs() {
  const todo = H.list.filter((p) => thumbCache[thumbKey(p)] === undefined);
  let i = 0;
  const worker = async () => {
    while (i < todo.length) {
      const p = todo[i++];
      try {
        const r = await api('GET', '/projects/' + encodeURIComponent(p.id));
        thumbCache[thumbKey(p)] = thumbSVG(r.project);
      } catch (e) {
        thumbCache[thumbKey(p)] = '';
      }
      fillThumbs();
    }
  };
  await Promise.all([worker(), worker(), worker(), worker()]);
}
/* Material icons (same set as Docly) */
const IC = {
  search:
    'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
  help: 'M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z',
  info: 'M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z',
  doc: 'M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z',
  kbd: 'M20 5H4c-1.1 0-1.99.9-1.99 2L2 17c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-9 3h2v2h-2V8zm0 3h2v2h-2v-2zM8 8h2v2H8V8zm0 3h2v2H8v-2zm-1 2H5v-2h2v2zm0-3H5V8h2v2zm9 7H8v-2h8v2zm0-4h-2v-2h2v2zm0-3h-2V8h2v2zm3 3h-2v-2h2v2zm0-3h-2V8h2v2z',
  list: 'M4 14h4v-4H4v4zm0 5h4v-4H4v4zM4 9h4V5H4v4zm5 5h12v-4H9v4zm0 5h12v-4H9v4zM9 5v4h12V5H9z',
  grid: 'M3 3v8h8V3H3zm6 6H5V5h4v4zm-6 4v8h8v-8H3zm6 6H5v-4h4v4zm4-16v8h8V3h-8zm6 6h-4V5h4v4zm-6 4v8h8v-8h-8zm6 6h-4v-4h4v4z',
  plus: 'M22 8h4v14h14v4H26v14h-4V26H8v-4h14z',
  upload: 'M24 4l-4 4h3v12h2V8h3zM12 36v-4H8v8h32v-8h-4v4z',
};
const svgIc = (d, vb = '0 0 24 24', cls = '') =>
  `<svg${cls ? ` class="${cls}"` : ''} viewBox="${vb}" aria-hidden="true"><path d="${d}"/></svg>`;
function homeDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  if (d.toDateString() === new Date().toDateString())
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
}
function buildHome() {
  const first = !$('#home').children.length,
    chips = [
      ['all', 'hm_all'],
      ['recent', 'hm_recent'],
      ['fav', 'hm_fav'],
    ]
      .map(([f, k]) => `<button class="filter-btn" data-f="${f}">${t(k)}</button>`)
      .join('');
  $('#home').innerHTML = `
    <div class="home-view${first ? ' home-enter' : ''}" data-view="${H.view}">
      <div class="home-header">
        <div class="home-header-left"><div class="brand"><span class="brand-mark">◉</span><span class="brand-name">Mindly</span></div></div>
        <label class="search-box home-search">${svgIc(IC.search, '0 0 24 24', 'search-icon')}<input id="hq" type="text" placeholder="${t('hm_search')}" value="${esc(H.q)}" autocomplete="off" spellcheck="false"></label>
        <div class="home-header-right"></div>
      </div>
      <button class="icon-btn home-help-btn" data-hm="help" title="${t('hm_help')}">${svgIc(IC.help)}</button>
      <div class="home-menu" id="hmenu" hidden>
        <button data-hm-act="about">${svgIc(IC.info)}<span>${t('hm_info')}</span></button>
        <button data-hm-act="license">${svgIc(IC.doc)}<span>${t('hm_license')}</span></button>
        <button data-hm-act="shortcuts">${svgIc(IC.kbd)}<span>${t('hm_shortcuts')}</span></button>
      </div>
      <button class="icon-btn home-view-toggle" data-hm="view" title="${t('hm_view')}">${svgIc(IC.list, '0 0 24 24', 'ic-list')}${svgIc(IC.grid, '0 0 24 24', 'ic-grid')}</button>
      <button class="theme-fab" data-act="theme" title="${t('a_theme')}">${theme === 'dark' ? '☾' : '☀'}</button>
      <div class="home-body">
        <div class="home-inner">
          <h2 class="home-section-title">${t('hm_create')}</h2>
          <div class="home-new-wrap">
            <button class="home-new-card" data-hm="new" title="${t('hm_new')}"><span class="home-new-thumb">${svgIc(IC.plus, '0 0 48 48')}</span><span class="home-new-label">${t('hm_new')}</span></button>
            <button class="home-new-card" data-hm="import" title="${t('hm_import')}"><span class="home-new-thumb">${svgIc(IC.upload, '0 0 48 48')}</span><span class="home-new-label">${t('hm_import')}</span></button>
          </div>
          <div class="home-docs-head"><h2 class="home-section-title">${t('hm_yours')}</h2><nav class="filters home-filters">${chips}</nav></div>
          <div id="hlist" class="home-content"></div>
          <footer class="home-footer"><p>${t('hm_foot')}</p></footer>
        </div>
      </div>
    </div>`;
  drawHome();
}
function homeActions(p, all) {
  const star = favs().includes(p.id),
    b = (cls, h, txt, title) =>
      `<button class="row-icon-btn ${cls}" data-h="${h}" title="${title}">${txt}</button>`;
  return `<div class="home-actions">${all ? b('', 'tab', '↗', t('b_tab')) + b('', 'ren', '✎', t('b_ren')) + b('', 'dup', '⧉', t('b_dup')) : ''}${b('star' + (star ? ' active' : ''), 'fav', star ? '★' : '☆', t('hm_star'))}${b('trash', 'del', '✕', t('b_delete'))}</div>`;
}
function drawHome() {
  const box = $('#hlist');
  if (!box) return;
  const q = H.q.trim().toLowerCase(),
    fv = favs(),
    isList = H.view === 'list';
  let a = H.list.filter((p) => p.name.toLowerCase().includes(q));
  if (H.f === 'fav') a = a.filter((p) => fv.includes(p.id));
  if (H.f === 'recent')
    a = recs()
      .map((id) => a.find((p) => p.id === id))
      .filter(Boolean);
  else a.sort((x, y) => y.modified.localeCompare(x.modified));
  const view = document.querySelector('.home-view');
  if (view) view.dataset.view = H.view;
  document
    .querySelectorAll('.home-filters .filter-btn')
    .forEach((b) => b.classList.toggle('active', b.dataset.f === H.f));
  if (!a.length) {
    const [h, m] = q
      ? ['hm_nores', 'hm_nores2']
      : !H.list.length
        ? ['hm_welcome', 'hm_welcome2']
        : ['hm_nothing', 'hm_nothing2'];
    box.innerHTML = `<div class="home-empty"><strong>${t(h)}</strong>${t(m)}</div>`;
    return;
  }
  const icon = '<span class="home-doc-icon"></span>';
  box.innerHTML = isList
    ? `<div class="home-list"><div class="home-list-head"><span>${t('pm_name')}</span><span>${t('pm_created')}</span><span>${t('pm_mod')}</span><span></span></div>${a
        .map(
          (p) =>
            `<div class="home-row" data-id="${esc(p.id)}" tabindex="0" title="${esc(p.name)}"><div class="home-row-name">${icon}<span class="home-row-title">${esc(p.name)}</span></div><span class="home-row-date">${homeDate(p.created)}</span><span class="home-row-date">${homeDate(p.modified)}</span>${homeActions(p, true)}</div>`,
        )
        .join('')}</div>`
    : `<div class="home-grid">${a
        .map(
          (p) =>
            `<div class="home-card" data-id="${esc(p.id)}" tabindex="0" title="${esc(p.name)}"><div class="home-card-thumb" data-th="${esc(p.id)}"></div><div class="home-card-tools"><button class="row-icon-btn" data-h="tab" title="${t('b_tab')}">↗</button><button class="row-icon-btn" data-h="ren" title="${t('b_ren')}">✎</button><button class="row-icon-btn" data-h="dup" title="${t('b_dup')}">⧉</button></div><div class="home-card-foot">${icon}<div class="home-card-meta"><div class="home-card-title">${esc(p.name)}</div><div class="home-card-date">${homeDate(p.modified)}</div></div>${homeActions(p, false)}</div></div>`,
        )
        .join('')}</div>`;
  fillThumbs();
}
async function showHome() {
  try {
    H.list = (await api('GET', '/projects')).projects;
  } catch (e) {
    H.list = [];
    err(e, 't_loadErr');
  }
  drawHome();
  loadThumbs();
}
$('#home').addEventListener('input', (e) => {
  if (e.target.id !== 'hq') return;
  H.q = e.target.value;
  drawHome();
});
function homeClick(e) {
  const mi = e.target.closest('[data-hm-act]'),
    menu = $('#hmenu');
  if (menu) menu.hidden = mi || !e.target.closest('[data-hm="help"]') ? true : !menu.hidden;
  if (mi) return ACT[mi.dataset.hmAct]();
  const chip = e.target.closest('[data-f]'),
    hm = e.target.closest('[data-hm]'),
    ab = e.target.closest('[data-h]'),
    card = e.target.closest('[data-id]');
  if (chip) {
    H.f = chip.dataset.f;
    drawHome();
  } else if (hm) {
    const a = hm.dataset.hm;
    if (a === 'new') newProject();
    else if (a === 'import') $('#file').click();
    else if (a === 'view') {
      H.view = H.view === 'grid' ? 'list' : 'grid';
      PS.mView = H.view;
      drawHome();
    }
  } else if (card) {
    const id = card.dataset.id,
      p = H.list.find((x) => x.id === id);
    if (!p) return;
    if (!ab) return e.ctrlKey || e.metaKey ? openInTab(id) : openProject(id);
    const a = ab.dataset.h;
    if (a === 'tab') openInTab(id);
    else if (a === 'fav') {
      const f = favs();
      setFavs(f.includes(id) ? f.filter((x) => x !== id) : [id, ...f]);
      drawHome();
    } else if (a === 'ren') renameProject(id, p.name);
    else if (a === 'dup') dupProject(id, p.name);
    else if (a === 'del') deleteProject(id, p.name);
  }
}
$('#home').addEventListener('click', homeClick);
/* middle-click a project = open it in a new tab */
$('#home').addEventListener('auxclick', (e) => {
  const c = e.button === 1 && e.target.closest('[data-id]');
  if (!c) return;
  e.preventDefault();
  openInTab(c.dataset.id);
});
addEventListener('keydown', (e) => {
  const m = $('#hmenu');
  if (e.key === 'Escape' && m && !m.hidden) m.hidden = true;
});
$('#home').addEventListener('keydown', (e) => {
  const c = e.target.closest && e.target.closest('[data-id]');
  if (c && e.target === c && (e.key === 'Enter' || e.key === ' ')) {
    e.preventDefault();
    openProject(c.dataset.id);
  }
});
/* ==========================================================
 * EDITING OPERATIONS
 * ========================================================== */
const oneSel = () => [...sel.n].map(byId).filter(Boolean).pop();
function setSel(ids, l = null) {
  sel = { n: new Set(ids), l };
  render();
  buildPanel();
}
function addNode(x, y, o = {}) {
  if (!need()) return;
  snapshot();
  const n = mk({ text: t('newNode'), ...o });
  if (!('w' in o)) fitNode(n);
  n.x = sn(x - n.w / 2);
  n.y = sn(y - n.h / 2);
  M.nodes.push(n);
  setSel([n.id]);
  markDirty();
  startEdit(n.id);
}
const centerW = () => {
  const r = SR();
  return toW(r.left + r.width / 2, r.top + r.height / 2);
};
function spawn(n, x, y, from, pl, side) {
  snapshot();
  const c = mk({ x, y, text: t('newNode') });
  fitNode(c);
  const par = byId(from),
    tidy = M.settings.layout === 'tidy',
    down = side === 'b' || !!(pl && n.down),
    sibs = M.links
      .filter((l) => l.from === from)
      .map((l) => byId(l.to))
      .filter((k) => k && !!k.down === down);
  if (down) {
    /* bottom branch: siblings sit in a row under the parent, ordered by horizontal CENTER */
    c.down = true;
    if (pl) {
      c.x = tidy ? n.x + n.w / 2 + 1 - c.w / 2 : n.x + n.w + 24;
      c.y = n.y;
    } else {
      c.y = par.y + par.h + 60;
      c.x = sibs.length
        ? tidy
          ? Math.max(...sibs.map((k) => k.x + k.w / 2)) + 1 - c.w / 2
          : Math.max(...sibs.map((k) => k.x + k.w)) + 24
        : par.x + par.w / 2 - c.w / 2;
    }
  } else {
    if (side) c.side = side;
    /* tidy layout orders siblings by vertical CENTER: place the new block by its center, otherwise
       taller siblings would push it above them and the links would no longer be symmetric */
    if (tidy) {
      if (pl) c.y = n.y + n.h / 2 + 1 - c.h / 2;
      else if (sibs.length) c.y = Math.max(...sibs.map((k) => k.y + k.h / 2)) + 1 - c.h / 2;
    }
  }
  M.nodes.push(c);
  freshNode = c.id;
  M.links.push(mkl({ ...(pl || {}), id: uid(), from, to: c.id, end: 'none' }));
  if (par) delete par[colKey(childSide(par, c))];
  setSel([c.id]);
  markDirty();
  startEdit(c.id);
}
function sideOf(n, d = 0) {
  if (n.down) return 'b';
  const l = M.links.find((x) => x.to === n.id),
    p = l && byId(l.from);
  if (!p || d > 50) return 'r';
  if (p.down || !M.links.some((x) => x.to === p.id))
    return n.side || (n.x + n.w / 2 < p.x + p.w / 2 ? 'l' : 'r');
  return sideOf(p, d + 1);
}
function child(left) {
  if (!need()) return;
  const n = oneSel();
  if (!n) return toast(t('t_nosel'), 'err');
  const auto = typeof left !== 'boolean' && left !== 'b'; /* Tab (no explicit side) */
  if (left === 'b' || (n.down && auto)) return spawn(n, n.x, n.y + n.h + 60, n.id, null, 'b');
  const dir = left === true ? 'l' : n.down && left === false ? 'r' : sideOf(n),
    tidy = M.settings.layout === 'tidy',
    kids = M.links
      .filter((l) => l.from === n.id)
      .map((l) => byId(l.to))
      .filter((k) => k && !k.down),
    y = kids.length ? Math.max(...kids.map((k) => k.y)) + (tidy ? 1 : n.h + 24) : n.y;
  spawn(n, dir === 'l' ? n.x - 90 - 140 : n.x + n.w + 90, y, n.id, null, dir);
}
function sibling() {
  if (!need()) return;
  const n = oneSel();
  if (!n) return toast(t('t_nosel'), 'err');
  const pl = M.links.find((l) => l.to === n.id);
  if (pl)
    spawn(n, n.x, M.settings.layout === 'tidy' ? n.y + 1 : n.y + n.h + 24, pl.from, pl, n.down ? undefined : n.side);
  else child();
}
function del() {
  if (!cur) return;
  if (sel.l) {
    snapshot();
    M.links = M.links.filter((l) => l.id !== sel.l);
    setSel([]);
    markDirty();
    return;
  }
  if (!sel.n.size) return;
  if (editing || editingLink) return; /* never delete a block while its text is being edited */
  snapshot();
  const rm = new Set(sel.n);
  /* deleting the title block removes everything connected to it (whole connected group) */
  for (const id of [...sel.n]) {
    const n = byId(id);
    if (!n || !n.isTitle) continue;
    const st = [id];
    while (st.length) {
      const i = st.pop();
      for (const l of M.links) {
        const o = l.from === i ? l.to : l.to === i ? l.from : null;
        if (o && !rm.has(o) && byId(o)) {
          rm.add(o);
          st.push(o);
        }
      }
    }
  }
  for (const i of subtree([...sel.n])) if (HID.has(i)) rm.add(i); /* a collapsed branch goes with its node */
  M.nodes = M.nodes.filter((n) => !rm.has(n.id));
  M.links = M.links.filter((l) => byId(l.from) && byId(l.to));
  setSel([]);
  markDirty();
}
const pick = () => {
  const ids = new Set(sel.n);
  for (const i of subtree([...sel.n])) if (HID.has(i)) ids.add(i); /* include collapsed branches */
  return {
    nodes: M.nodes.filter((n) => ids.has(n.id)),
    links: M.links.filter((l) => ids.has(l.from) && ids.has(l.to)),
  };
};
function clone(src, off) {
  const m = {};
  const nodes = src.nodes.map((n) => {
    const c = { ...n, id: uid(), x: n.x + off, y: n.y + off, isTitle: false };
    m[n.id] = c.id;
    return c;
  });
  return {
    nodes,
    links: src.links.map((l) => ({ ...l, id: uid(), from: m[l.from], to: m[l.to] })),
  };
}
function addClone(c) {
  M.nodes.push(...c.nodes);
  M.links.push(...c.links);
  setSel(c.nodes.map((n) => n.id));
  markDirty();
}
/* The clipboard is kept in projects/preferences.json (key mClip), not in the browser, and is
   passed to the other tabs right away, so blocks can be pasted between pages, projects and tabs.
   `clip` is only a memory fallback (used when the clipboard is too big for the file). */
const CLIP_MAX = 6 * 1024 * 1024;
let clipSeen = '';
const clipHere = () => (cur ? cur.id : '') + '|' + PG.active;
function clipWrite(c) {
  clip = c;
  const j = JSON.stringify(c);
  if (j.length > CLIP_MAX) {
    PS.removeItem('mClip'); /* never leave an older copy behind */
    PS.flushNow();
    return false;
  }
  PS.mClip = j;
  PS.flushNow(); /* send it now, so another tab can paste immediately */
  return true;
}
function clipRead() {
  try {
    const c = JSON.parse(PS.mClip || 'null');
    if (
      c &&
      Array.isArray(c.nodes) &&
      Array.isArray(c.links) &&
      c.nodes.every((n) => n && typeof n === 'object' && isFinite(n.x) && isFinite(n.y))
    )
      return c;
  } catch (e) {}
  return clip;
}
function copy() {
  if (!sel.n.size) return;
  const c = { ...JSON.parse(JSON.stringify(pick())), stamp: Date.now() + '-' + uid(), src: clipHere() };
  clipSeen = c.stamp;
  pc = 0;
  if (!clipWrite(c)) toast(t('t_clipLocal'));
}
function cut() {
  if (!sel.n.size) return;
  copy();
  del();
}
function paste() {
  const c = need() && clipRead();
  if (!c) return;
  snapshot();
  if (c.stamp !== clipSeen) {
    /* new content in the clipboard: into another page / project / tab it keeps its position,
       on the same page it lands slightly shifted so it does not hide the original */
    clipSeen = c.stamp;
    pc = c.src === clipHere() ? 0 : -1;
  }
  pc++;
  addClone(clone(c, 30 * pc));
}
function dup() {
  if (!need() || !sel.n.size) return;
  snapshot();
  addClone(clone(pick(), 30));
}
function selAll() {
  if (cur) setSel(M.nodes.filter((n) => !HID.has(n.id)).map((n) => n.id));
}
function desel() {
  if (editing) return cancelEdit();
  hidePop();
  tool = 'select';
  linkFrom = null;
  hint();
  setSel([]);
}
let editBase = null;
function restoreBase() {
  if (!editBase) return;
  for (const b of editBase) {
    const n = byId(b.id);
    if (n) Object.assign(n, b);
  }
  editBase = null;
}
function placeNodeEditor(n) {
  const v = M.view,
    ed = $('#editor'),
    lh = n.size * 1.25,
    padX = n.shape === 'rect' || n.shape === 'rounded' ? 12 : 12 + n.w * 0.06,
    nl = lines({ ...n, text: ed.value }).length,
    padY = Math.max(0, (n.h - nl * lh) / 2);
  Object.assign(ed.style, {
    left: n.x * v.z + v.x + 'px',
    top: n.y * v.z + v.y + 'px',
    width: n.w * v.z + 'px',
    height: n.h * v.z + 'px',
    boxSizing: 'border-box',
    border: '0',
    borderRadius: '8px',
    boxShadow: '0 0 0 2px var(--accent), 0 0 0 6px color-mix(in srgb, var(--accent) 20%, transparent)',
    padding: `${padY * v.z}px ${padX * v.z}px`,
    fontFamily: n.font,
    fontSize: n.size * v.z + 'px',
    lineHeight: lh * v.z + 'px',
    fontWeight: n.bold ? 700 : 400,
    fontStyle: n.italic ? 'italic' : 'normal',
    textAlign: n.align,
    color: n.color,
    background: n.fill,
  });
}
function placeLinkEditor(l, text) {
  const g = geo(l);
  if (!g) return;
  const mx = (g.p[0] + g.q[0]) / 2,
    my = (g.p[1] + g.q[1]) / 2,
    v = M.view,
    b = linkBox(l, text || ' '),
    w = Math.max(60, b.w);
  Object.assign($('#editor').style, {
    left: mx * v.z + v.x - (w * v.z) / 2 + 'px',
    top: my * v.z + v.y - (b.h * v.z) / 2 + 'px',
    width: w * v.z + 'px',
    height: b.h * v.z + 'px',
    boxSizing: 'border-box',
    border: '0',
    borderRadius: '3px',
    boxShadow: '0 0 0 2px var(--accent)',
    padding: LBL_PAD * v.z + 'px',
    fontFamily: LBL_FONT,
    fontSize: LBL_SIZE * v.z + 'px',
    lineHeight: LBL_SIZE * LBL_LH * v.z + 'px',
    fontWeight: l.bold ? 700 : 400,
    fontStyle: l.italic ? 'italic' : 'normal',
    textAlign: 'center',
    color: '#1f2937',
    background: '#ffffff',
  });
}
/* the block grows (and, in tidy mode, makes room) while you type */
function liveFit() {
  const ed = $('#editor');
  if (editing) {
    const n = byId(editing),
      b0 = editBase && editBase.find((b) => b.id === editing);
    if (!n || !b0) return;
    const p = { ...n, text: ed.value, w: b0.w, h: b0.h };
    if (n.manual) grow(p);
    else fitNode(p);
    n.w = p.w;
    n.h = p.h;
    if (M.settings.layout === 'tidy') layoutAll();
    render();
    placeNodeEditor(n);
  } else if (editingLink) {
    const l = M.links.find((x) => x.id === editingLink);
    if (l) placeLinkEditor(l, ed.value);
  }
}
function startEdit(id) {
  editEndedAt = Date.now() + 1500; /* Delete/Backspace right after creating/editing never removes the block */
  const n = byId(id);
  if (!n) return;
  editing = id;
  editBase = M.nodes.map((o) => ({ id: o.id, x: o.x, y: o.y, w: o.w, h: o.h }));
  if (!sel.n.has(id)) {
    sel = { n: new Set([id]), l: null };
    buildPanel();
  }
  const ed = $('#editor');
  ed.value = n.text;
  placeNodeEditor(n);
  ed.hidden = false;
  render();
  ed.focus();
  ed.select();
}
function startEditLink(id) {
  const l = M.links.find((x) => x.id === id);
  if (!l) return;
  editingLink = id;
  if (!geo(l)) return;
  const ed = $('#editor');
  ed.value = l.text;
  placeLinkEditor(l, l.text);
  ed.hidden = false;
  render();
  buildFbar();
  ed.focus();
  ed.select();
}
let freshNode = null; /* id of the block just created: keyboard Delete/Backspace never removes it */
let editEndedAt = 0; /* when the last text edit ended (guards Delete/Backspace key repeat) */
function commitEdit() {
  const id = editing;
  if (!id) return;
  editing = null;
  editEndedAt = Date.now();
  const ed = $('#editor');
  ed.hidden = true;
  restoreBase();
  const n = byId(id);
  if (n && ed.value !== n.text) {
    snapshot();
    n.text = ed.value;
    grow(n);
    markDirty();
    if (n.isTitle) syncName(n.text);
  }
  render();
  buildPanel();
}
function commitEditLink() {
  const id = editingLink;
  if (!id) return;
  editingLink = null;
  editEndedAt = Date.now();
  const ed = $('#editor');
  ed.hidden = true;
  const l = M.links.find((x) => x.id === id);
  if (l && ed.value !== l.text) {
    snapshot();
    l.text = ed.value;
    markDirty();
  }
  render();
  buildPanel();
}
function cancelEdit() {
  editEndedAt = Date.now();
  restoreBase();
  editing = null;
  editingLink = null;
  $('#editor').hidden = true;
  render();
}
$('#editor').addEventListener('keydown', (e) => {
  const c = combo(e);
  e.stopPropagation();
  if (['Enter', 'Esc', 'Tab', 'Shift+Tab'].includes(c)) freshNode = null;
  if (c === 'Enter') {
    e.preventDefault();
    if (editingLink) commitEditLink();
    else commitEdit();
  } else if (c === 'Esc') {
    e.preventDefault();
    cancelEdit();
  } else if (c === 'Tab' && !editingLink) {
    e.preventDefault();
    commitEdit();
    child();
  } else if (c === 'Shift+Tab' && !editingLink) {
    e.preventDefault();
    commitEdit();
    child(true);
  } else if ((c === 'Ctrl+B' || c === 'Ctrl+I') && editingLink) {
    e.preventDefault();
    const l = M.links.find((x) => x.id === editingLink),
      k = c === 'Ctrl+B' ? 'bold' : 'italic';
    if (l) {
      snapshot();
      l[k] = !l[k];
      markDirty();
      placeLinkEditor(l, $('#editor').value);
    }
  } else if (c === 'Ctrl+B' || c === 'Ctrl+I') {
    e.preventDefault();
    const id = editing,
      v = $('#editor').value;
    fmt(c === 'Ctrl+B' ? 'bold' : 'italic');
    if (byId(id)) {
      editing = id;
      const n = byId(id),
        ed = $('#editor');
      ed.style.fontWeight = n.bold ? 700 : 400;
      ed.style.fontStyle = n.italic ? 'italic' : 'normal';
      ed.value = v;
      liveFit();
    }
  } else if (c === 'Ctrl+Shift+E' && !editingLink) {
    e.preventDefault();
    fmtCenter();
  }
});
$('#editor').addEventListener('input', liveFit);
$('#editor').addEventListener('blur', () => {
  if (editing) commitEdit();
  if (editingLink) commitEditLink();
});
const LIM = {
  w: [40, 3000],
  h: [24, 3000],
  size: [6, 200],
  sw: [0, 30],
  radius: [0, 200],
  width: [1, 30],
  opacity: [0.1, 1],
};
function applyProp(p, v) {
  const tg = sel.l ? M.links.filter((l) => l.id === sel.l) : [...sel.n].map(byId).filter(Boolean);
  if (!tg.length) return;
  if (LIM[p]) v = Math.min(LIM[p][1], Math.max(LIM[p][0], +v || LIM[p][0]));
  snapshot('p' + p);
  if (p === 'text') {
    const ot = tg.find((x) => x.isTitle);
    if (ot) {
      clearTimeout(nameT);
      nameT = setTimeout(() => syncName(ot.text), 900);
    }
  }
  for (const o of tg) {
    o[p] = v;
    if (p === 'w' || p === 'h') o.manual = true;
    if (!sel.l && ['text', 'size', 'font', 'bold', 'italic', 'w', 'shape'].includes(p)) grow(o);
  }
  render();
  markDirty();
  if (sel.l && p === 'bold') buildPanel();
}
function fmt(p) {
  const ns = [...sel.n].map(byId).filter(Boolean);
  if (!ns.length) return toast(t('t_nosel'), 'err');
  applyProp(p, !ns[0][p]);
  buildPanel();
}
function fmtCenter() {
  if (!sel.n.size) return toast(t('t_nosel'), 'err');
  applyProp('align', 'center');
  buildPanel();
}
/* ==========================================================
 * PANEL
 * ========================================================== */
const fld = (k, h) => `<label class="f"><span>${t(k)}</span>${h}</label>`;
const inp = (ty, p, v, x = '') => `<input type="${ty}" data-p="${p}" value="${esc(v)}" ${x}>`;
const sl = (p, v, o, x = '') =>
  `<select data-p="${p}"${x}>${v === '' || v == null ? '<option value="" selected></option>' : ''}${o.map(([a, b]) => `<option value="${esc(a)}"${a === v ? ' selected' : ''}>${esc(b)}</option>`).join('')}</select>`;
const cfield = (p, v, x = '') =>
  `<button type="button" class="cs" data-cp="${p}" style="background:${esc(v)}" title="${esc(v)}"${x}></button>`;
const CAPS = () => ['none', 'arrow', 'dot'].map((c) => [c, t('c_' + c)]);
function buildPanel() {
  const ns = [...sel.n].map(byId).filter(Boolean),
    l = sel.l && M.links.find((x) => x.id === sel.l);
  let h;
  if (l)
    h =
      `<h4>${t('p_link')}</h4>` +
      fld(
        'p_linkText',
        `<input type="text" data-p="text" value="${esc(l.text)}" placeholder="${t('p_linkText')}">`,
      ) +
      fld(
        'p_style',
        `<div class="seg"><button data-b="bold" class="${l.bold ? 'on' : ''}" title="${t('a_bold')}"><b>B</b></button><button data-b="italic" class="${l.italic ? 'on' : ''}" title="${t('a_italic')}"><i>I</i></button></div>`,
      ) +
      fld('p_color', cfield('color', l.color)) +
      fld('p_width', inp('number', 'width', l.width, 'min="1" max="30"')) +
      fld(
        'p_type',
        sl('type', l.type, [
          ['straight', t('o_straight')],
          ['curve', t('o_curve')],
          ['ortho', t('o_ortho')],
        ]),
      ) +
      fld('p_dashed', `<input type="checkbox" data-p="dashed" ${l.dashed ? 'checked' : ''}>`) +
      fld('p_start', sl('start', l.start, CAPS())) +
      fld('p_end', sl('end', l.end, CAPS())) +
      `<button class="btn" data-act="del">${t('a_del')}</button>`;
  else {
    /* nothing selected: same bar, empty and disabled fields */
    const n = ns[0] || null,
      off = n ? '' : ' disabled',
      v = (k, d = '') => (n ? n[k] : d),
      on = (c) => (c ? 'on' : ''),
      gray = '#e5e7eb';
    h =
      `<h4>${ns.length > 1 ? t('p_multi', ns.length) : t('p_node')}</h4>` +
      (ns.length <= 1
        ? fld('p_text', `<textarea data-p="text" rows="3"${off}>${esc(v('text'))}</textarea>`)
        : '') +
      fld('p_fill', cfield('fill', v('fill', gray), off)) +
      fld('p_tcolor', cfield('color', v('color', gray), off)) +
      fld(
        'p_shape',
        sl(
          'shape',
          v('shape'),
          SH.map((s) => [s, t('s_' + s)]),
          off,
        ),
      ) +
      '<div class="two">' +
      fld('p_w', inp('number', 'w', n ? Math.round(n.w) : '', 'min="40"' + off)) +
      fld('p_h', inp('number', 'h', n ? Math.round(n.h) : '', 'min="24"' + off)) +
      '</div>' +
      fld('p_font', sl('font', v('font'), FONTS, off)) +
      fld('p_size', inp('number', 'size', v('size'), 'min="6" max="200"' + off)) +
      fld(
        'p_style',
        `<div class="seg"><button data-b="bold" class="${on(v('bold'))}" title="${t('a_bold')}"${off}><b>B</b></button><button data-b="italic" class="${on(v('italic'))}" title="${t('a_italic')}"${off}><i>I</i></button>` +
          ['left', 'center', 'right']
            .map(
              (a) =>
                `<button data-a="${a}" class="${on(v('align') === a)}" title="${t('p_align')}"${off}><svg width="14" height="12" stroke="currentColor" fill="none">${AI[a]}</svg></button>`,
            )
            .join('') +
          '</div>',
      ) +
      fld('p_stroke', cfield('stroke', v('stroke', gray), off)) +
      fld('p_sw', inp('number', 'sw', v('sw'), 'min="0" max="30"' + off)) +
      fld('p_radius', inp('number', 'radius', v('radius'), 'min="0" max="200"' + off)) +
      `<button class="btn" data-act="autofit"${off}>${t('a_autofit')}</button>`;
  }
  $('#props').innerHTML = h;
  buildFbar();
}
$('#props').addEventListener('input', (e) => {
  const el = e.target,
    p = el.dataset.p;
  if (!p) return;
  applyProp(
    p,
    el.type === 'checkbox'
      ? el.checked
      : el.type === 'number' || el.type === 'range'
        ? el.valueAsNumber
        : el.value,
  );
});
$('#props').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.b) {
    if (sel.l) {
      const l = M.links.find((x) => x.id === sel.l);
      if (l) {
        snapshot();
        const k = b.dataset.b === 'italic' ? 'italic' : 'bold';
        l[k] = !l[k];
        render();
        markDirty();
        buildPanel();
      }
    } else fmt(b.dataset.b);
  } else if (b.dataset.a) {
    applyProp('align', b.dataset.a);
    buildPanel();
  }
});
/* ==========================================================
 * FLOATING QUICK BAR
 * ========================================================== */
const lum = (c) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(c);
  if (!m) return 255;
  const v = parseInt(m[1], 16);
  return 0.299 * (v >> 16) + 0.587 * ((v >> 8) & 255) + 0.114 * (v & 255);
};
function buildFbar() {
  const f = $('#fbar'),
    ns = [...sel.n].map(byId).filter(Boolean),
    l = sel.l && M.links.find((x) => x.id === sel.l);
  let h = '';
  if (l)
    h = `<button data-lk="bold" title="${t('a_bold')}"><b>B</b></button><button data-lk="italic" title="${t('a_italic')}"><i>I</i></button><button type="button" class="cs" data-cp="color" style="background:${esc(l.color)}" title="${t('p_color')}"></button><button data-lk="text" title="${t('p_linkText')}">T</button><button data-lk="end" title="${t('p_end')}">→</button><button data-lk="dashed" title="${t('p_dashed')}">┅</button>`;
  else if (ns.length) {
    const n = ns[0];
    h = `<button data-b="bold" title="${t('a_bold')}"><b>B</b></button><button data-b="italic" title="${t('a_italic')}"><i>I</i></button>`;
  }
  f.innerHTML = h;
  f.dataset.has = h ? '1' : '';
  if (editingLink) f.hidden = true;
  else posFbar();
}
function posFbar() {
  const f = $('#fbar');
  if (!f.dataset.has || editing || editingLink || !cur) {
    f.hidden = true;
    return;
  }
  let ax, ay, by;
  if (sel.l) {
    const l = M.links.find((x) => x.id === sel.l),
      g = l && geo(l);
    if (!g) {
      f.hidden = true;
      return;
    }
    ax = (g.p[0] + g.q[0]) / 2;
    ay = by = (g.p[1] + g.q[1]) / 2;
  } else {
    const ns = [...sel.n].map(byId).filter(Boolean);
    if (!ns.length) {
      f.hidden = true;
      return;
    }
    const x0 = Math.min(...ns.map((n) => n.x)),
      x1 = Math.max(...ns.map((n) => n.x + n.w));
    ax = (x0 + x1) / 2;
    ay = Math.min(...ns.map((n) => n.y));
    by = Math.max(...ns.map((n) => n.y + n.h));
  }
  f.hidden = false;
  const v = M.view,
    r = SR();
  let y = ay * v.z + v.y - f.offsetHeight - 12;
  if (y < 4) y = by * v.z + v.y + 12;
  f.style.left =
    Math.max(4, Math.min(r.width - f.offsetWidth - 4, ax * v.z + v.x - f.offsetWidth / 2)) + 'px';
  f.style.top = Math.max(4, y) + 'px';
}
function setFill(c) {
  const ns = [...sel.n].map(byId).filter(Boolean);
  if (!ns.length) return;
  snapshot();
  ns.forEach((n) => {
    n.fill = c;
    n.color = lum(c) < 140 ? '#ffffff' : '#1f2937';
  });
  render();
  markDirty();
  buildPanel();
}
$('#fbar').addEventListener('input', (e) => {
  const p = e.target.dataset.p;
  if (p) applyProp(p, e.target.value);
});
$('#fbar').addEventListener('change', (e) => e.target.blur());
$('#fbar').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  b.blur();
  if (b.dataset.fill) setFill(b.dataset.fill);
  else if (b.dataset.b) fmt(b.dataset.b);
  else if (b.dataset.lk) {
    const l = M.links.find((x) => x.id === sel.l);
    if (!l) return;
    snapshot();
    if (b.dataset.lk === 'end') l.end = l.end === 'arrow' ? 'none' : 'arrow';
    else if (b.dataset.lk === 'text') startEditLink(l.id);
    else if (b.dataset.lk === 'bold') l.bold = !l.bold;
    else if (b.dataset.lk === 'italic') l.italic = !l.italic;
    else l.dashed = !l.dashed;
    render();
    markDirty();
    buildPanel();
  }
});
/* ==========================================================
 * COLOR PICKER (always hexadecimal)
 * ========================================================== */
const PALETTE = [
  '#000000', '#1f2937', '#374151', '#6b7280', '#a1a1a1', '#d3d3d3', '#f3f4f6', '#ffffff',
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4',
  '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#ec4899', '#f43f5e', '#92400e', '#065f46',
];
const normHex = (c) => {
  c = String(c || '').trim().toLowerCase();
  if (/^[0-9a-f]{3}$|^[0-9a-f]{6}$/.test(c)) c = '#' + c;
  if (/^#[0-9a-f]{3}$/.test(c)) c = '#' + [...c.slice(1)].map((x) => x + x).join('');
  return /^#[0-9a-f]{6}$/.test(c) ? c : null;
};
const hex2hsv = (hex) => {
  const v = parseInt(hex.slice(1), 16),
    r = (v >> 16) / 255,
    g = ((v >> 8) & 255) / 255,
    b = (v & 255) / 255,
    mx = Math.max(r, g, b),
    d = mx - Math.min(r, g, b);
  let h = 0;
  if (d) h = mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, mx ? d / mx : 0, mx];
};
const hsv2hex = (h, s, v) => {
  const f = (n) => {
    const k = (n + h / 60) % 6;
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
  };
  return '#' + [f(5), f(3), f(1)].map((x) => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
};
let cp = null;
function cpCurrent(prop) {
  const l = sel.l && M.links.find((x) => x.id === sel.l),
    o = l || byId([...sel.n][0]);
  return normHex(o && o[prop]) || '#ffffff';
}
function cpPaint(fromInput) {
  const pop = $('#cpop'),
    hex = hsv2hex(cp.h, cp.s, cp.v),
    sv = pop.querySelector('.cp-sv');
  sv.style.background = `linear-gradient(to top,#000,#0000),linear-gradient(to right,#fff,${hsv2hex(cp.h, 1, 1)})`;
  const dot = sv.querySelector('.cp-dot');
  dot.style.left = cp.s * 100 + '%';
  dot.style.top = (1 - cp.v) * 100 + '%';
  pop.querySelector('.cp-hue').value = Math.round(cp.h);
  if (!fromInput) pop.querySelector('.cp-hex').value = hex;
  return hex;
}
function cpApply(hex) {
  applyProp(cp.prop, hex);
  document.querySelectorAll(`.cs[data-cp="${cp.prop}"]`).forEach((b) => {
    b.style.background = hex;
    b.title = hex;
  });
}
function cpSet(h, s, v, fromInput, exact) {
  cp.h = h;
  cp.s = s;
  cp.v = v;
  const hex = cpPaint(fromInput);
  cpApply(exact || hex);
  if (exact && !fromInput) $('#cpop .cp-hex').value = exact;
}
function closeCP() {
  cp = null;
  const pop = $('#cpop');
  if (pop) pop.hidden = true;
}
function openCP(btn) {
  const pop = $('#cpop'),
    hex = cpCurrent(btn.dataset.cp),
    [h, s, v] = hex2hsv(hex);
  cp = { prop: btn.dataset.cp, h, s, v, btn };
  pop.innerHTML =
    '<div class="cp-sv"><i class="cp-dot"></i></div>' +
    '<input type="range" class="cp-hue" min="0" max="360" step="1">' +
    '<input type="text" class="cp-hex" maxlength="7" spellcheck="false" autocomplete="off">' +
    '<div class="cp-pal">' +
    PALETTE.map((c) => `<button type="button" data-c="${c}" style="background:${c}" title="${c}"></button>`).join('') +
    '</div>';
  pop.hidden = false;
  cpPaint(false);
  const r = btn.getBoundingClientRect(),
    pw = pop.offsetWidth,
    ph = pop.offsetHeight;
  let y = r.bottom + 6;
  if (y + ph > innerHeight - 8) y = Math.max(8, r.top - ph - 6);
  pop.style.left = Math.max(8, Math.min(innerWidth - pw - 8, r.left)) + 'px';
  pop.style.top = y + 'px';
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('.cs');
  if (!b || b.disabled) return;
  const same = cp && cp.btn === b && !$('#cpop').hidden;
  closeCP();
  if (!same) openCP(b);
});
document.addEventListener('pointerdown', (e) => {
  if (cp && !e.target.closest('#cpop, .cs')) closeCP();
});
$('#cpop').addEventListener('pointerdown', (e) => {
  const sv = e.target.closest('.cp-sv');
  if (!sv || !cp) return;
  const mv = (ev) => {
    const r = sv.getBoundingClientRect();
    cpSet(
      cp.h,
      Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width)),
      1 - Math.min(1, Math.max(0, (ev.clientY - r.top) / r.height)),
      false,
    );
  };
  sv.setPointerCapture(e.pointerId);
  mv(e);
  sv.onpointermove = mv;
  sv.onpointerup = () => {
    sv.onpointermove = sv.onpointerup = null;
  };
});
$('#cpop').addEventListener('input', (e) => {
  if (!cp) return;
  if (e.target.classList.contains('cp-hue')) cpSet(+e.target.value, cp.s, cp.v, false);
  else if (e.target.classList.contains('cp-hex')) {
    const hex = normHex(e.target.value);
    if (!hex) return;
    const [h, s, v] = hex2hsv(hex);
    cpSet(s ? h : cp.h, s, v, true, hex);
  }
});
$('#cpop').addEventListener('change', (e) => {
  if (cp && e.target.classList.contains('cp-hex')) e.target.value = hsv2hex(cp.h, cp.s, cp.v);
});
$('#cpop').addEventListener('keydown', (e) => {
  if (e.key === 'Escape' || e.key === 'Enter') closeCP();
});
$('#cpop').addEventListener('click', (e) => {
  const b = e.target.closest('[data-c]');
  if (!b || !cp) return;
  const [h, s, v] = hex2hsv(b.dataset.c);
  cpSet(s ? h : cp.h, s, v, false, b.dataset.c);
});
/* ==========================================================
 * VIEW
 * ========================================================== */
function zoomAt(f, cx, cy) {
  const r = SR(),
    v = M.view,
    nz = Math.min(4, Math.max(0.1, v.z * f)),
    k = nz / v.z,
    px = cx - r.left,
    py = cy - r.top;
  v.x = px - (px - v.x) * k;
  v.y = py - (py - v.y) * k;
  v.z = nz;
  render();
  viewDirty();
}
const zoomBy = (f) => {
  const r = SR();
  zoomAt(f, r.left + r.width / 2, r.top + r.height / 2);
};
function bbox() {
  const vis = M.nodes.filter((n) => !HID.has(n.id));
  if (!vis.length) return null;
  let a = 1e9,
    b = 1e9,
    c = -1e9,
    d = -1e9;
  for (const n of vis) {
    a = Math.min(a, n.x);
    b = Math.min(b, n.y);
    c = Math.max(c, n.x + n.w);
    d = Math.max(d, n.y + n.h);
  }
  return { x: a, y: b, w: c - a, h: d - b };
}
function fit() {
  if (!cur) return;
  const b = bbox(),
    r = SR();
  if (!b) {
    M.view = { x: r.width / 2, y: r.height / 2, z: 1 };
  } else {
    const z = Math.min(1, Math.max(0.1, Math.min(r.width / (b.w + 160), r.height / (b.h + 160))));
    M.view = { z, x: r.width / 2 - (b.x + b.w / 2) * z, y: r.height / 2 - (b.y + b.h / 2) * z };
  }
  render();
  viewDirty();
}
function setTpMode(v, quiet) {
  tpOn = !!v;
  PS.mTrackpad = v ? '1' : '0';
  hint();
  refreshTB();
  if (!quiet) toast(t(v ? 't_tpOn' : 't_tpOff'));
}
function toggle(k) {
  M.settings[k] = !M.settings[k];
  render();
  viewDirty();
}
/* ==========================================================
 * IMPORT / EXPORT
 * ========================================================== */
const fname = (ext) => (cur.name.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_') || 'mindly') + '.' + ext;
function dl(name, blob) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
function svgStr() {
  const b = bbox(),
    p = 40,
    bg = '#ffffff',
    W = b.w + p * 2,
    H = b.h + p * 2;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="${b.x - p} ${b.y - p} ${W} ${H}"><rect x="${b.x - p}" y="${b.y - p}" width="${W}" height="${H}" fill="${bg}"/>`;
  for (const l of M.links) {
    const g = geo(l);
    if (g) s += linkSVG(l, g, false, true);
  }
  for (const n of M.nodes) if (!HID.has(n.id)) s += nodeSVG(n, false);
  for (const l of M.links) {
    const g = geo(l);
    if (g) s += linkLabelSVG(l, g);
  }
  return s + '</svg>';
}
function preview() {
  if (!need()) return;
  if (!M.nodes.length) return toast(t('t_empty'), 'err');
  const box = document.createElement('div');
  box.style.cssText =
    'background:#fff;border:1px solid var(--border);border-radius:8px;padding:8px;overflow:auto;max-height:62vh;text-align:center';
  box.innerHTML = svgStr().replace(
    '<svg ',
    '<svg style="max-width:100%;height:auto;display:inline-block" ',
  );
  modal(
    t('a_preview'),
    box,
    [
      { l: t('b_close') },
      {
        l: t('a_exportJson'),
        f: () => {
          exportJson();
          return false;
        },
      },
      {
        l: t('a_exportSvg'),
        f: () => {
          exportSvg();
          return false;
        },
      },
      {
        l: t('a_exportPng'),
        f: () => {
          exportPng();
          return false;
        },
      },
      {
        l: t('a_exportPdf'),
        c: 'pri',
        f: () => {
          exportPdf();
          return false;
        },
      },
    ],
    true,
  );
}
function pdfBlob(jpg, pxW, pxH, pw, ph) {
  const enc = new TextEncoder(),
    parts = [],
    off = [];
  let len = 0;
  const add = (d) => {
    const u = typeof d === 'string' ? enc.encode(d) : d;
    parts.push(u);
    len += u.length;
  };
  const obj = (n, body, stream) => {
    off[n] = len;
    add(n + ' 0 obj\n' + body + '\n');
    if (stream !== undefined) {
      add('stream\n');
      add(stream);
      add('\nendstream\n');
    }
    add('endobj\n');
  };
  add('%PDF-1.4\n');
  obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
  obj(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  obj(
    3,
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw.toFixed(2)} ${ph.toFixed(2)}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`,
  );
  obj(
    4,
    `<< /Type /XObject /Subtype /Image /Width ${pxW} /Height ${pxH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpg.length} >>`,
    jpg,
  );
  const cs = `q ${pw.toFixed(2)} 0 0 ${ph.toFixed(2)} 0 0 cm /Im0 Do Q`;
  obj(5, `<< /Length ${cs.length} >>`, cs);
  const xr = len;
  let xt = 'xref\n0 6\n0000000000 65535 f \n';
  for (let i = 1; i <= 5; i++) xt += String(off[i]).padStart(10, '0') + ' 00000 n \n';
  add(xt + `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xr}\n%%EOF`);
  return new Blob(parts, { type: 'application/pdf' });
}
function downloadJson(name, project) {
  const file =
    (String(name)
      .replace(/(_mindly)+$/i, '')
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_') || 'mindly') + '_Mindly.json';
  dl(
    file,
    new Blob(
      [
        JSON.stringify(
          { format: 'mindly', metadata: { name, exported: new Date().toISOString() }, project },
          null,
          1,
        ),
      ],
      { type: 'application/json' },
    ),
  );
}
function exportJson() {
  if (!need()) return;
  downloadJson(cur.name, proj());
  toast(t('t_exported'));
}
/* ----- multi export (SVG / PNG / PDF): one file per page, named after the page's first block ----- */
const BADFN = /[<>:"/\\|?*\x00-\x1f]/g;
function withPage(pg, fn) {
  const sn = M.nodes,
    sl = M.links;
  M.nodes = pg.nodes;
  M.links = pg.links;
  try {
    calcHidden();
    return fn();
  } finally {
    M.nodes = sn;
    M.links = sl;
    calcHidden();
  }
}
function pageFileName(pg, used, ext) {
  const first = pg.nodes.find((n) => n.isTitle) || pg.nodes[0],
    base =
      String((first && first.text) || '')
        .replace(BADFN, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 80)
        .replace(/[. ]+$/, '') ||
      pg.name.replace(BADFN, '_') ||
      'mindly';
  let n = base,
    i = 2;
  while (used.has(n.toLowerCase())) n = base + ' ' + i++;
  used.add(n.toLowerCase());
  return n + '.' + ext;
}
const svgImage = (svg) =>
  new Promise((ok, ko) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = ko;
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
async function exportPages(ext, make) {
  if (!need()) return;
  pagesSync();
  const items = [];
  for (const pg of PG.list) {
    const r = withPage(pg, () => {
      const b = bbox();
      return b ? { pg, svg: svgStr(), W: b.w + 80, H: b.h + 80 } : null;
    });
    if (r) items.push(r);
  }
  if (!items.length) return toast(t('t_empty'), 'err');
  const used = new Set();
  try {
    for (let i = 0; i < items.length; i++) {
      const blob = await make(items[i]);
      dl(pageFileName(items[i].pg, used, ext), blob);
      if (i < items.length - 1) await new Promise((r) => setTimeout(r, 350));
    }
    toast(t('t_exported'));
  } catch (e) {
    toast(t('e_error'), 'err');
  }
}
const exportSvg = () => exportPages('svg', async (r) => new Blob([r.svg], { type: 'image/svg+xml' }));
const exportPng = () =>
  exportPages('png', async (r) => {
    const img = await svgImage(r.svg),
      c = document.createElement('canvas');
    c.width = r.W * 2;
    c.height = r.H * 2;
    const x = c.getContext('2d');
    x.scale(2, 2);
    x.drawImage(img, 0, 0, r.W, r.H);
    return new Promise((ok) => c.toBlob(ok));
  });
const exportPdf = () =>
  exportPages('pdf', async (r) => {
    const img = await svgImage(r.svg),
      k = Math.min(2, 8000 / Math.max(r.W, r.H)),
      c = document.createElement('canvas');
    c.width = Math.round(r.W * k);
    c.height = Math.round(r.H * k);
    const g = c.getContext('2d');
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, c.width, c.height);
    g.drawImage(img, 0, 0, c.width, c.height);
    const jpg = Uint8Array.from(atob(c.toDataURL('image/jpeg', 0.95).split(',')[1]), (ch) =>
        ch.charCodeAt(0),
      ),
      f = Math.min(0.75, 14400 / Math.max(r.W, r.H));
    return pdfBlob(jpg, c.width, c.height, r.W * f, r.H * f);
  });
/* ----- other map formats: XMind, FreeMind, OPML, Markdown (import + export) -----
 * Every format is converted to / from a simple tree { text, kids: [...], side } per page. */
const CRC_T = (() => {
  const a = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    a[n] = c >>> 0;
  }
  return a;
})();
function crc32(u) {
  let c = 0xffffffff;
  for (let i = 0; i < u.length; i++) c = CRC_T[(c ^ u[i]) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
/* minimal ZIP writer (no compression, UTF-8 names): enough for .xmind */
function zipStore(files, mime) {
  const enc = new TextEncoder(),
    parts = [],
    cen = [],
    d = new Date(),
    dd = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
    tm = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
  let off = 0;
  for (const f of files) {
    const nm = enc.encode(f.name),
      data = typeof f.data === 'string' ? enc.encode(f.data) : f.data,
      crc = crc32(data),
      sz = data.length,
      h = new DataView(new ArrayBuffer(30)),
      c = new DataView(new ArrayBuffer(46));
    h.setUint32(0, 0x04034b50, true);
    h.setUint16(4, 20, true);
    h.setUint16(6, 0x0800, true);
    h.setUint16(10, tm, true);
    h.setUint16(12, dd, true);
    h.setUint32(14, crc, true);
    h.setUint32(18, sz, true);
    h.setUint32(22, sz, true);
    h.setUint16(26, nm.length, true);
    parts.push(new Uint8Array(h.buffer), nm, data);
    c.setUint32(0, 0x02014b50, true);
    c.setUint16(4, 20, true);
    c.setUint16(6, 20, true);
    c.setUint16(8, 0x0800, true);
    c.setUint16(12, tm, true);
    c.setUint16(14, dd, true);
    c.setUint32(16, crc, true);
    c.setUint32(20, sz, true);
    c.setUint32(24, sz, true);
    c.setUint16(28, nm.length, true);
    c.setUint32(42, off, true);
    cen.push(new Uint8Array(c.buffer), nm);
    off += 30 + nm.length + sz;
  }
  let cl = 0;
  for (const p of cen) cl += p.length;
  const e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true);
  e.setUint16(8, files.length, true);
  e.setUint16(10, files.length, true);
  e.setUint32(12, cl, true);
  e.setUint32(16, off, true);
  return new Blob([...parts, ...cen, new Uint8Array(e.buffer)], { type: mime });
}
/* minimal ZIP reader: returns only the XMind content files (stored or deflated) */
async function zipRead(buf) {
  const u = new Uint8Array(buf),
    dv = new DataView(buf),
    dec = new TextDecoder(),
    out = {};
  let e = -1;
  for (let i = u.length - 22; i >= Math.max(0, u.length - 22 - 65536); i--)
    if (dv.getUint32(i, true) === 0x06054b50) {
      e = i;
      break;
    }
  if (e < 0) throw 0;
  const n = dv.getUint16(e + 10, true);
  let p = dv.getUint32(e + 16, true);
  for (let k = 0; k < n; k++) {
    if (dv.getUint32(p, true) !== 0x02014b50) throw 0;
    const meth = dv.getUint16(p + 10, true),
      csz = dv.getUint32(p + 20, true),
      nl = dv.getUint16(p + 28, true),
      xl = dv.getUint16(p + 30, true),
      cl = dv.getUint16(p + 32, true),
      lo = dv.getUint32(p + 42, true),
      name = dec.decode(u.subarray(p + 46, p + 46 + nl));
    p += 46 + nl + xl + cl;
    if (name !== 'content.json' && name !== 'content.xml') continue;
    const ds = lo + 30 + dv.getUint16(lo + 26, true) + dv.getUint16(lo + 28, true),
      raw = u.subarray(ds, ds + csz);
    if (meth === 0) out[name] = raw;
    else if (meth === 8) {
      if (typeof DecompressionStream === 'undefined') throw 0;
      const s = new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      out[name] = new Uint8Array(await new Response(s).arrayBuffer());
    } else throw 0;
  }
  return out;
}
/* ----- model <-> tree ----- */
function pageTree(pg) {
  const byid = new Map(pg.nodes.map((n) => [n.id, n])),
    kidsOf = new Map(),
    hasIn = new Set();
  for (const l of pg.links)
    if (byid.has(l.from) && byid.has(l.to) && l.from !== l.to) {
      hasIn.add(l.to);
      if (!kidsOf.has(l.from)) kidsOf.set(l.from, []);
      if (!kidsOf.get(l.from).includes(l.to)) kidsOf.get(l.from).push(l.to);
    }
  let roots = pg.nodes.filter((n) => !hasIn.has(n.id));
  if (!pg.nodes.length) return null;
  if (!roots.length) roots = [pg.nodes[0]];
  const main = roots.find((n) => n.isTitle) || roots[0],
    seen = new Set(),
    cy = (n) => n.y + n.h / 2,
    build = (n) => {
      seen.add(n.id);
      const o = { text: String(n.text || ''), kids: [] },
        ks = (kidsOf.get(n.id) || []).map((id) => byid.get(id)).sort((a, b) => cy(a) - cy(b));
      for (const c of ks)
        if (!seen.has(c.id)) {
          const k = build(c);
          if (n === main) k.side = c.side || (c.x + c.w / 2 < main.x + main.w / 2 ? 'l' : 'r');
          o.kids.push(k);
        }
      return o;
    },
    tree = build(main);
  for (const r of roots) if (r !== main && !seen.has(r.id)) tree.kids.push(build(r));
  return tree;
}
function docTree() {
  pagesSync();
  const a = PG.list.map((pg) => pageTree(pg)).filter(Boolean);
  if (!a.length) return null;
  return a.length === 1 ? a[0] : { text: cur.name, kids: a };
}
function buildPage(tree, first) {
  const nodes = [],
    links = [];
  let yy = 0;
  const clip = (s) => String(s == null ? '' : s).replace(/\r/g, '').trim().slice(0, 500),
    add = (tr, parent, side) => {
      if (nodes.length >= 20000) throw 0;
      const n = parent
        ? mk({ text: clip(tr.text), y: yy++, side })
        : mk({ ...titleOpts(), text: clip(tr.text), isTitle: first, y: yy++ });
      fitNode(n);
      nodes.push(n);
      if (parent) links.push(mkl({ from: parent.id, to: n.id }));
      return n;
    },
    walk = (tr, n, root) => {
      const ks = tr.kids || [],
        half = Math.ceil(ks.length / 2);
      ks.forEach((k, i) => {
        const side = root ? (k.side === 'l' || k.side === 'r' ? k.side : i < half ? 'r' : 'l') : undefined;
        walk(k, add(k, n, side), false);
      });
    };
  walk(tree, add(tree, null), true);
  return { nodes, links };
}
function treesToProject(pages) {
  const list = pages.slice(0, PG_MAX).map((p, i) => ({
      id: uid(),
      name: String(p.name || '').trim().slice(0, 60) || t('pg_default', i + 1),
      ...buildPage(p.tree, i === 0),
    })),
    f = list[0];
  return {
    version: 1,
    nodes: f.nodes,
    links: f.links,
    settings: { grid: true, snap: false, layout: 'tidy' },
    pages: list.map((p, i) =>
      i === 0 ? { id: p.id, name: p.name } : { id: p.id, name: p.name, nodes: p.nodes, links: p.links },
    ),
    activePage: f.id,
  };
}
/* ----- writers ----- */
const xe = (s) =>
  String(s)
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '&#10;');
const xid = () => uid() + uid() + uid();
const XML_H = '<?xml version="1.0" encoding="UTF-8"?>\n';
function xmindBlob() {
  pagesSync();
  const pgs = PG.list.map((pg) => ({ name: pg.name, tree: pageTree(pg) })).filter((p) => p.tree);
  if (!pgs.length) return null;
  const tj = (tr) => {
      const o = { id: xid(), class: 'topic', title: tr.text };
      if (tr.kids.length) o.children = { attached: tr.kids.map(tj) };
      return o;
    },
    tx = (tr) =>
      `<topic id="${xid()}"><title>${xe(tr.text)}</title>` +
      (tr.kids.length ? `<children><topics type="attached">${tr.kids.map(tx).join('')}</topics></children>` : '') +
      '</topic>',
    json = JSON.stringify(
      pgs.map((p) => ({ id: xid(), class: 'sheet', title: p.name, rootTopic: tj(p.tree) })),
      null,
      1,
    ),
    xml =
      XML_H.replace('?>', ' standalone="no"?>') +
      '<xmap-content xmlns="urn:xmind:xmap:xmlns:content:2.0" version="2.0">' +
      pgs.map((p) => `<sheet id="${xid()}">${tx(p.tree)}<title>${xe(p.name)}</title></sheet>`).join('') +
      '</xmap-content>';
  return zipStore(
    [
      { name: 'content.json', data: json },
      { name: 'metadata.json', data: JSON.stringify({ creator: { name: 'Mindly', version: '5' } }) },
      { name: 'manifest.json', data: JSON.stringify({ 'file-entries': { 'content.json': {}, 'metadata.json': {} } }) },
      { name: 'content.xml', data: xml },
      {
        name: 'META-INF/manifest.xml',
        data:
          XML_H.replace('?>', ' standalone="no"?>') +
          '<manifest xmlns="urn:xmind:xmap:xmlns:manifest:1.0" password-hint=""><file-entry full-path="content.xml" media-type="text/xml"/><file-entry full-path="META-INF/manifest.xml" media-type="text/xml"/></manifest>',
      },
    ],
    'application/vnd.xmind.workbook',
  );
}
function freemindBlob() {
  const tr = docTree();
  if (!tr) return null;
  const nd = (n, top) =>
    `<node ID="ID_${xid()}" TEXT="${xe(n.text)}"${top && n.side === 'l' ? ' POSITION="left"' : top ? ' POSITION="right"' : ''}>${n.kids.map((k) => nd(k, false)).join('')}</node>`;
  return new Blob(
    [`<map version="1.0.1">${`<node ID="ID_${xid()}" TEXT="${xe(tr.text)}">${tr.kids.map((k) => nd(k, true)).join('')}</node>`}</map>`],
    { type: 'application/x-freemind' },
  );
}
function opmlBlob() {
  const tr = docTree();
  if (!tr) return null;
  const ol = (n) => `<outline text="${xe(n.text)}">${n.kids.map(ol).join('')}</outline>`;
  return new Blob(
    [XML_H + `<opml version="2.0"><head><title>${xe(cur.name)}</title></head><body>${ol(tr)}</body></opml>\n`],
    { type: 'text/x-opml' },
  );
}
function mdBlob() {
  pagesSync();
  const pgs = PG.list.map((pg) => pageTree(pg)).filter(Boolean);
  if (!pgs.length) return null;
  const one = (s) => String(s).replace(/\s*\n\s*/g, ' ').trim(),
    bl = (n, d, out) => {
      out.push('  '.repeat(d) + '- ' + one(n.text));
      n.kids.forEach((k) => bl(k, d + 1, out));
    },
    out = [];
  if (pgs.length > 1) out.push('# ' + one(cur.name), '');
  for (const p of pgs) {
    out.push((pgs.length > 1 ? '## ' : '# ') + one(p.text));
    p.kids.forEach((k) => bl(k, 0, out));
    out.push('');
  }
  return new Blob([out.join('\n')], { type: 'text/markdown' });
}
const exportOther = (ext, make) => () => {
  if (!need()) return;
  const b = make();
  if (!b) return toast(t('t_empty'), 'err');
  dl(fname(ext), b);
  toast(t('t_exported'));
};
const exportXmind = exportOther('xmind', xmindBlob),
  exportFreemind = exportOther('mm', freemindBlob),
  exportOpml = exportOther('opml', opmlBlob),
  exportMd = exportOther('md', mdBlob);
/* ----- readers ----- */
function xmlDoc(txt) {
  const d = new DOMParser().parseFromString(txt, 'application/xml');
  if (d.getElementsByTagName('parsererror').length) throw 0;
  return d;
}
const xkids = (el, name) => [...el.children].filter((c) => c.localName === name);
function fromXmindJson(arr) {
  const topic = (o) => {
    const ch = o.children || {},
      ks = [...(ch.attached || []), ...(ch.detached || [])];
    return { text: o.title == null ? '' : String(o.title), kids: ks.map(topic) };
  };
  const sheets = (Array.isArray(arr) ? arr : [arr]).filter((s) => s && s.rootTopic);
  if (!sheets.length) throw 0;
  return sheets.map((s) => ({ name: s.title, tree: topic(s.rootTopic) }));
}
function fromXmindXml(txt) {
  const topic = (el) => {
      const ti = xkids(el, 'title')[0],
        ch = xkids(el, 'children')[0],
        ks = [];
      if (ch) for (const ts of xkids(ch, 'topics')) for (const k of xkids(ts, 'topic')) ks.push(topic(k));
      return { text: ti ? ti.textContent : '', kids: ks };
    },
    sheets = [...xmlDoc(txt).getElementsByTagName('sheet')].filter((s) => xkids(s, 'topic')[0]);
  if (!sheets.length) throw 0;
  return sheets.map((s) => {
    const ti = xkids(s, 'title')[0];
    return { name: ti ? ti.textContent : '', tree: topic(xkids(s, 'topic')[0]) };
  });
}
function fromFreemind(doc) {
  const node = (el, top) => {
    const rc = xkids(el, 'richcontent').find((r) => r.getAttribute('TYPE') !== 'NOTE' && r.getAttribute('TYPE') !== 'DETAILS'),
      o = {
        text: el.hasAttribute('TEXT') ? el.getAttribute('TEXT') : rc ? rc.textContent.replace(/\s+/g, ' ').trim() : '',
        kids: xkids(el, 'node').map((k) => node(k, false)),
      };
    if (top) {
      const p = (el.getAttribute('POSITION') || '').toLowerCase();
      if (p === 'left') o.side = 'l';
      else if (p === 'right') o.side = 'r';
    }
    return o;
  };
  const root = xkids(doc.documentElement, 'node')[0];
  if (!root) throw 0;
  const tr = node(root, false);
  tr.kids = xkids(root, 'node').map((k) => node(k, true));
  return [{ name: '', tree: tr }];
}
function fromOpml(doc, fallback) {
  const body = doc.getElementsByTagName('body')[0],
    ol = (el) => ({ text: el.getAttribute('text') || el.getAttribute('title') || '', kids: xkids(el, 'outline').map(ol) });
  if (!body) throw 0;
  const tops = xkids(body, 'outline').map(ol);
  if (!tops.length) throw 0;
  if (tops.length === 1) return [{ name: '', tree: tops[0] }];
  const ti = doc.getElementsByTagName('title')[0];
  return [{ name: '', tree: { text: (ti && ti.textContent.trim()) || fallback, kids: tops } }];
}
function fromOutline(txt, fallback) {
  const items = [],
    clean = (s) =>
      s
        .replace(/^\[[ xX]\]\s+/, '')
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/__(.+?)__/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
        .trim();
  let hd = 0,
    ls = [],
    fence = false;
  for (const raw of txt.replace(/^\uFEFF/, '').split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(raw)) {
      fence = !fence;
      continue;
    }
    if (fence || !raw.trim() || /^\s*(---+|\*\*\*+|___+)\s*$/.test(raw)) continue;
    const h = raw.match(/^(#{1,6})\s+(.*?)\s*#*\s*$/);
    if (h) {
      hd = h[1].length;
      ls = [];
      items.push({ d: hd, s: clean(h[2]) });
      continue;
    }
    const m = raw.match(/^([ \t]*)(?:[-*+•]|\d+[.)])\s+(.*)$/),
      ind = (m ? m[1] : raw.match(/^[ \t]*/)[0]).replace(/\t/g, '    ').length,
      s = clean(m ? m[2] : raw.trim());
    while (ls.length && ls[ls.length - 1] > ind) ls.pop();
    if (!ls.length || ls[ls.length - 1] < ind) ls.push(ind);
    items.push({ d: hd + ls.length, s });
  }
  if (!items.length) throw 0;
  const mkn = (s) => ({ text: s, kids: [] }),
    tops = [],
    stack = [];
  for (const it of items) {
    const n = mkn(it.s);
    while (stack.length && stack[stack.length - 1].d >= it.d) stack.pop();
    if (stack.length) stack[stack.length - 1].n.kids.push(n);
    else tops.push(n);
    stack.push({ d: it.d, n });
  }
  return [{ name: '', tree: tops.length === 1 ? tops[0] : { text: fallback, kids: tops } }];
}
async function readMap(f) {
  const ext = (f.name.match(/\.([^.]+)$/) || [, ''])[1].toLowerCase(),
    base = f.name.replace(/\.[^.]+$/, '') || t('untitled');
  if (ext === 'xmind') {
    const z = await zipRead(await f.arrayBuffer()),
      dec = new TextDecoder();
    return z['content.json']
      ? fromXmindJson(JSON.parse(dec.decode(z['content.json'])))
      : fromXmindXml(dec.decode(z['content.xml'] || (() => { throw 0; })()));
  }
  const txt = await f.text();
  if (ext === 'md' || ext === 'markdown' || ext === 'txt') return fromOutline(txt, base);
  const doc = xmlDoc(txt),
    root = doc.documentElement.localName;
  if (root === 'map') return fromFreemind(doc);
  if (root === 'opml') return fromOpml(doc, base);
  if (root === 'xmap-content') return fromXmindXml(txt);
  throw 0;
}
/* an imported map always opens on its FIRST page (the top-level data is the active page, so swap) */
function firstPageFirst(p) {
  if (!p || !Array.isArray(p.pages) || p.pages.length < 2) return p;
  const pg = p.pages.filter((x) => x && typeof x === 'object'),
    first = pg[0],
    act = pg.find((x) => x.id === p.activePage) || first;
  if (!first || first === act) return p;
  const out = { ...p, nodes: first.nodes || [], links: first.links || [], activePage: first.id };
  if (first.view) out.view = first.view;
  else delete out.view;
  out.pages = pg.map((x) =>
    x === first
      ? { id: x.id, name: x.name }
      : x === act
        ? { id: x.id, name: x.name, nodes: p.nodes, links: p.links, view: p.view }
        : x,
  );
  return out;
}
/* Reads ONE file (JSON, XMind, FreeMind, OPML, Markdown, text) and returns { name, project }
   without saving anything. */
async function readProject(f) {
  const safe = (x) => String(x || '').replace(BADFN, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);
  if (/\.json$/i.test(f.name)) {
    const j = JSON.parse(await f.text()),
      p = j.project || j;
    if (!p || !Array.isArray(p.nodes) || !Array.isArray(p.links)) throw 0;
    const name = (j.metadata && j.metadata.name) || f.name.replace(/(_Mindly)?\.json$/i, '') || t('untitled');
    return { name, project: firstPageFirst(p) };
  }
  const pages = await readMap(f),
    base = f.name.replace(/\.[^.]+$/, '') || t('untitled');
  return {
    name: safe(pages[0].tree.text) || safe(base) || t('untitled'),
    project: firstPageFirst(treesToProject(pages)),
  };
}
/* saves one imported map as its own project (does NOT open it) */
async function createImported(it) {
  try {
    return await api('POST', '/projects', { name: it.name, project: it.project });
  } catch (e) {
    return await api('POST', '/projects', { name: t('untitled'), project: it.project });
  }
}
/* several imported maps -> ONE project, one page per import (a file that already has pages keeps them) */
function mergeProjects(items) {
  const pages = [];
  for (const { name, project: p } of items) {
    const list = Array.isArray(p.pages) ? p.pages.filter((x) => x && typeof x === 'object') : [];
    if (!list.length) {
      pages.push({ name, nodes: p.nodes, links: p.links, view: p.view });
      continue;
    }
    const act = list.find((x) => x.id === p.activePage) || list[0];
    for (const x of list)
      pages.push({
        name: list.length > 1 ? (name + ' – ' + (x.name || '')).slice(0, 60) : name,
        nodes: x === act ? p.nodes : x.nodes || [],
        links: x === act ? p.links : x.links || [],
        view: x === act ? p.view : x.view,
      });
  }
  if (pages.length > PG_MAX) throw 0;
  pages.forEach((x) => {
    x.id = uid();
    x.name = String(x.name || '').trim().slice(0, 60) || t('untitled');
  });
  const first = pages[0],
    out = {
      version: 1,
      nodes: first.nodes,
      links: first.links,
      settings: items[0].project.settings || {},
      pages: pages.map((x, i) =>
        i === 0
          ? { id: x.id, name: x.name }
          : { id: x.id, name: x.name, nodes: x.nodes, links: x.links, view: x.view || undefined },
      ),
      activePage: first.id,
    };
  if (first.view) out.view = first.view;
  return out;
}
/* 2+ files selected: separate projects, or everything in one project (one page per file) */
function importChoiceDlg(n) {
  return new Promise((res) => {
    let done = false;
    const fin = (v) => {
      if (!done) {
        done = true;
        res(v);
      }
    };
    modal(
      t('d_impTitle', n),
      `<p>${esc(t('d_impMsg', n))}</p>`,
      [
        { l: t('b_cancel'), f: () => fin(null) },
        { l: t('b_impSep'), f: () => fin('sep') },
        { l: t('b_impOne'), c: 'pri', f: () => fin('one') },
      ],
      false,
      () => fin(null),
    );
  });
}
$('#file').addEventListener('change', async (e) => {
  const files = [...e.target.files];
  e.target.value = '';
  if (!files.length) return;
  if (files.length === 1) {
    try {
      const r = await createImported(await readProject(files[0]));
      await openProject(r.id);
      toast(t('t_imported'));
    } catch (x) {
      toast(t('t_importErr'), 'err');
    }
    return;
  }
  const mode = await importChoiceDlg(files.length);
  if (!mode) return;
  const items = [];
  let bad = 0;
  for (const f of files) {
    try {
      items.push(await readProject(f));
    } catch (x) {
      bad++;
    }
  }
  if (!items.length) return toast(t('t_importErr'), 'err');
  try {
    if (mode === 'sep') {
      /* like importing them one at a time, but none of them is opened automatically */
      for (const it of items) await createImported(it);
      toast(t('t_importedN', items.length));
      if (!cur) showHome();
    } else {
      const project = mergeProjects(items),
        name = await ask(t('d_new'), t('d_name'), t('imp_merged'));
      if (name == null) return;
      const r = await api('POST', '/projects', { name, project });
      await openProject(r.id);
      toast(t('t_imported'));
    }
    if (bad) toast(t('t_importPartial', bad, files.length), 'err');
  } catch (x) {
    toast(t('t_importErr'), 'err');
  }
});
/* ==========================================================
 * ACTIONS
 * ========================================================== */
async function showPath() {
  if (!need()) return;
  let path;
  try {
    path = (await api('GET', '/projects/' + encodeURIComponent(cur.id) + '/path')).path;
  } catch (e) {
    return err(e, 't_loadErr');
  }
  const box = document.createElement('div');
  box.innerHTML = `<label class="f"><span>${t('d_pathLbl')}</span><input id="ppath" readonly spellcheck="false" value="${esc(path)}"></label>`;
  const inp = box.querySelector('#ppath');
  modal(t('d_path'), box, [
    { l: t('b_close') },
    {
      l: t('b_copy'),
      c: 'pri',
      f: async () => {
        inp.select();
        try {
          await navigator.clipboard.writeText(path);
        } catch (e) {
          document.execCommand('copy');
        }
        toast(t('t_pathCopied'));
        return false;
      },
    },
  ]);
  inp.focus();
  inp.select();
}
const ACT = {
  new: newProject,
  newTab: () => openInTab(''),
  newPage: pageAdd,
  pagePrev: () => pageStep(-1),
  pageNext: () => pageStep(1),
  find: () => {
    if (!need()) return;
    searchOpen(true);
  },
  path: showPath,
  open: manager,
  projects: manager,
  save: () => need() && save(false),
  saveas: saveAs,
  close: closeProject,
  rename: () => (cur ? renameProject(cur.id, cur.name) : need()),
  import: () => $('#file').click(),
  exportJson,
  exportSvg,
  exportPng,
  exportPdf,
  exportXmind,
  exportFreemind,
  exportOpml,
  exportMd,
  preview,
  undo,
  redo,
  copy,
  cut,
  paste,
  dup,
  del,
  selAll,
  desel,
  sibling,
  child,
  edit: () => {
    const n = oneSel();
    n ? startEdit(n.id) : toast(t('t_nosel'), 'err');
  },
  node: () => {
    if (!need()) return;
    const r = SR(),
      i = mouse.x > r.left && mouse.x < r.right && mouse.y > r.top && mouse.y < r.bottom,
      [x, y] = i ? toW(mouse.x, mouse.y) : freeSpot(140, 56);
    addNode(x, y);
  },
  root: () => {
    if (!need()) return;
    const o = titleOpts(),
      r = SR(),
      i = mouse.x > r.left && mouse.x < r.right && mouse.y > r.top && mouse.y < r.bottom,
      [x, y] = i ? toW(mouse.x, mouse.y) : freeSpot(o.w, o.h);
    addNode(x, y, o);
  },
  link: () => {
    if (!need()) return;
    tool = tool === 'link' ? 'select' : 'link';
    linkFrom = null;
    hint();
    render();
  },
  select: () => {
    tool = 'select';
    linkFrom = null;
    hint();
    render();
  },
  connect: () => {},
  props: () => {
    const p = $('#props');
    p.hidden = !p.hidden;
    PS.mPanel = p.hidden ? '0' : '1';
    render();
  },
  minimap: () => setMmVis(!mmVisible()),
  trackpad: () => setTpMode(!tpMode()),
  zoomIn: () => zoomBy(1.2),
  zoomOut: () => zoomBy(1 / 1.2),
  zoomReset: () => cur && zoomBy(1 / M.view.z),
  fit,
  fitView: fit,
  autofit: () => {
    const ns = [...sel.n].map(byId).filter(Boolean);
    if (!ns.length) return toast(t('t_nosel'), 'err');
    snapshot();
    ns.forEach((n) => {
      n.manual = false;
      fitNode(n);
    });
    render();
    markDirty();
    buildPanel();
  },
  layout: toggleLayout,
  childLeft: () => child(true),
  childDown: () => child('b'),
  grid: () => toggle('grid'),
  snap: () => toggle('snap'),
  full: () =>
    document.fullscreenElement
      ? document.exitFullscreen()
      : document.documentElement.requestFullscreen(),
  theme: () => {
    theme = theme === 'dark' ? 'light' : 'dark';
    PS.mTheme = theme;
    document.body.dataset.theme = theme;
    buildUI();
  },
  bold: () => fmt('bold'),
  italic: () => fmt('italic'),
  center: fmtCenter,
  shortcuts: showShortcuts,
  shortcuts2: showShortcuts,
  about: showInfo,
  license: showLicense,
};
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-act],[data-shape],[data-m]');
  if (!b) return;
  b.blur();
  if (b.dataset.act) ACT[b.dataset.act]();
  else if (b.dataset.shape) {
    const o =
        b.dataset.shape === 'circle'
          ? { shape: 'circle', w: 100, h: 100 }
          : { shape: b.dataset.shape },
      [x, y] = freeSpot(o.w || 140, o.h || 56);
    addNode(x, y, o);
  } else {
    const m = MENUS[b.dataset.m],
      r = b.getBoundingClientRect();
    popup(
      m[1].map((a) =>
        a === '-'
          ? '-'
          : a === 'export'
            ? {
                l: t('a_export'),
                sub: ['exportPdf', 'exportPng', 'exportSvg', 'exportJson', 'exportXmind', 'exportFreemind', 'exportOpml', 'exportMd'].map((x) => ({
                  l: t('a_' + x),
                  sc: shortcutOf(x),
                  f: ACT[x],
                })),
              }
            : {
                l: t('a_' + a),
                sc: shortcutOf(a),
                f: ACT[a],
                chk:
                  a === 'grid'
                    ? M.settings.grid
                    : a === 'snap'
                      ? M.settings.snap
                      : a === 'layout'
                        ? M.settings.layout === 'tidy'
                        : a === 'minimap'
                          ? mmVisible()
                          : a === 'trackpad'
                            ? tpMode()
                            : false,
              },
      ),
      r.left,
      r.bottom,
    );
  }
});
document.addEventListener('pointerdown', (e) => {
  if (!e.target.closest('#ctx')) hidePop();
});
/* ==========================================================
 * CANVAS INTERACTION
 * ========================================================== */
function subtree(ids) {
  const out = new Set(ids),
    st = [...ids];
  while (st.length) {
    const i = st.pop();
    for (const l of M.links)
      if (l.from === i && !out.has(l.to) && byId(l.to)) {
        out.add(l.to);
        st.push(l.to);
      }
  }
  return out;
}
const GX = 70,
  GY = 18;
function layoutAll() {
  calcHidden();
  const inL = new Map();
  for (const l of M.links)
    if (l.text && byId(l.from) && byId(l.to)) {
      const b = linkBox(l),
        o = inL.get(l.to);
      if (!o || b.w > o.w) inL.set(l.to, b);
    }
  const gx = (c) => Math.max(GX, inL.has(c.id) ? inL.get(c.id).w + 40 : 0),
    eh = (n) => Math.max(n.h, inL.has(n.id) ? inL.get(n.id).h + 8 : 0);
  const T = new Map(),
    Hm = new Map(),
    seen = new Set();
  const kids = (n) => {
    const u = new Set(),
      a = [];
    for (const l of M.links)
      if (l.from === n.id && !u.has(l.to)) {
        u.add(l.to);
        const c = byId(l.to);
        if (c && !HID.has(c.id) && !c.down) a.push(c);
      }
    return a.sort((p, q) => p.y + p.h / 2 - q.y - q.h / 2);
  };
  const build = (n) => {
    const k = kids(n).filter((c) => !seen.has(c.id));
    k.forEach((c) => seen.add(c.id));
    T.set(n.id, k);
    k.forEach(build);
  };
  const hg = (n) => {
    if (Hm.has(n.id)) return Hm.get(n.id);
    const h = Math.max(eh(n), tot(T.get(n.id)));
    Hm.set(n.id, h);
    return h;
  };
  const tot = (k) => (k.length ? k.reduce((a, c) => a + hg(c), 0) + GY * (k.length - 1) : 0);
  const place = (n, dir, top) => {
    const k = T.get(n.id),
      h = hg(n);
    n.y = top + (h - n.h) / 2;
    let y = top + (h - tot(k)) / 2;
    for (const c of k) {
      c.x = dir === 'r' ? n.x + n.w + gx(c) : n.x - gx(c) - c.w;
      place(c, dir, y);
      y += hg(c) + GY;
    }
  };
  const hasIn = new Set(M.links.filter((l) => byId(l.from)).map((l) => l.to)),
    roots = M.nodes.filter((n) => !hasIn.has(n.id));
  roots.forEach((r) => seen.add(r.id));
  roots.forEach(build);
  for (const r of roots) {
    const k = T.get(r.id);
    if (!k.length) continue;
    const cx = r.x + r.w / 2;
    k.forEach((c) => {
      if (!c.side) c.side = c.x + c.w / 2 < cx ? 'l' : 'r';
    });
    for (const dir of ['r', 'l']) {
      const g = k.filter((c) => c.side === dir),
        H = tot(g);
      let y = r.y + r.h / 2 - H / 2;
      for (const c of g) {
        c.x = dir === 'r' ? r.x + r.w + gx(c) : r.x - gx(c) - c.w;
        place(c, dir, y);
        y += hg(c) + GY;
      }
    }
  }
  /* a node fed by 2+ parents sits halfway between them, so every incoming link is symmetric */
  const desc = (n, o = []) => {
    o.push(n);
    (T.get(n.id) || []).forEach((c) => desc(c, o));
    return o;
  };
  for (const n of M.nodes) {
    if (HID.has(n.id)) continue;
    const ps = [...new Set(M.links.filter((l) => l.to === n.id).map((l) => l.from))]
      .map(byId)
      .filter((p) => p && !HID.has(p.id));
    if (ps.length < 2) continue;
    const dy = (Math.min(...ps.map((p) => p.y + p.h / 2)) + Math.max(...ps.map((p) => p.y + p.h / 2))) / 2 - (n.y + n.h / 2);
    if (Math.abs(dy) < 0.5) continue;
    const grp = desc(n),
      ids = new Set(grp.map((g) => g.id));
    const clash = grp.some((g) =>
      M.nodes.some(
        (o) =>
          !ids.has(o.id) && !HID.has(o.id) &&
          g.x < o.x + o.w && g.x + g.w > o.x && g.y + dy < o.y + o.h && g.y + g.h + dy > o.y,
      ),
    );
    if (!clash) grp.forEach((g) => (g.y += dy));
  }
  layoutDown(inL);
}
/* Bottom branches: independent of the right/left sides. The children sit in a row centered under
   their parent, every subtree below its parent, widths adapt to the sizes of the blocks. If the
   branch would touch something else (e.g. a huge map on the right) it slides down until it is free. */
function layoutDown(inL) {
  const GXV = 24,
    GYV = 50,
    byIdm = new Map(M.nodes.map((n) => [n.id, n])),
    D = new Map() /* down children of a node */,
    TS = new Map() /* side-tree children of a node (right/left branches hanging off a down node) */,
    SIDES = new Map() /* down node -> { r: [...], l: [...] } */,
    HS = new Map(),
    FP = new Map(),
    marked = new Set(),
    claimed = new Set(),
    SD = new Set();
  const kidsAll = (n) => {
    const u = new Set(),
      a = [];
    for (const l of M.links)
      if (l.from === n.id && !u.has(l.to)) {
        u.add(l.to);
        const c = byIdm.get(l.to);
        if (c && c !== n && !HID.has(c.id)) a.push(c);
      }
    return a;
  };
  const byX = (p, q) => p.x + p.w / 2 - q.x - q.w / 2,
    byY = (p, q) => p.y + p.h / 2 - q.y - q.h / 2,
    kidsD = (n) => kidsAll(n).filter((c) => c.down && !marked.has(c.id)).sort(byX),
    kidsS = (n) => kidsAll(n).filter((c) => !c.down && !claimed.has(c.id) && !marked.has(c.id)).sort(byY);
  const ew = (n) => Math.max(n.w, inL.has(n.id) ? inL.get(n.id).w + 8 : 0),
    eh = (n) => Math.max(n.h, inL.has(n.id) ? inL.get(n.id).h + 8 : 0),
    gy = (c) => Math.max(GYV, inL.has(c.id) ? inL.get(c.id).h + 30 : 0),
    gxs = (c) => Math.max(GX, inL.has(c.id) ? inL.get(c.id).w + 40 : 0);
  /* horizontal room taken by the right/left branches of a node */
  const sw = (c) => {
      const k = TS.get(c.id) || [];
      return c.w + (k.length ? Math.max(...k.map((x) => gxs(x) + sw(x))) : 0);
    },
    ext = (n, dir) => {
      const g = (SIDES.get(n.id) || {})[dir] || [];
      return g.length ? Math.max(...g.map((c) => gxs(c) + sw(c))) : 0;
    },
    /* reach of a node (itself, its right/left branches and its bottom row) from its own center */
    fp = (n) => {
      if (FP.has(n.id)) return FP.get(n.id);
      const k = D.get(n.id) || [],
        el = ext(n, 'l'),
        er = ext(n, 'r');
      let l = Math.max(ew(n) / 2, el ? n.w / 2 + el : 0),
        r = Math.max(ew(n) / 2, er ? n.w / 2 + er : 0);
      if (k.length) {
        const o = offs(k);
        k.forEach((c, i) => {
          const f = fp(c);
          l = Math.max(l, f[0] - o[i]);
          r = Math.max(r, f[1] + o[i]);
        });
      }
      FP.set(n.id, [l, r]);
      return [l, r];
    },
    /* centers of a row of bottom children relative to the parent's center: the row is centered on the
       PARENT and every block stays right under it, side branches never push a block sideways */
    offs = (k) => {
      const o = [0];
      for (let i = 1; i < k.length; i++) o.push(o[i - 1] + fp(k[i - 1])[1] + GXV + fp(k[i])[0]);
      const m = o[o.length - 1] / 2;
      return o.map((v) => v - m);
    };
  /* vertical room of the side branches (they are centered on their node) */
  const hgS = (n) => {
      if (!HS.has(n.id)) HS.set(n.id, Math.max(eh(n), totS(TS.get(n.id) || [])));
      return HS.get(n.id);
    },
    totS = (k) => (k.length ? k.reduce((a, c) => a + hgS(c), 0) + GY * (k.length - 1) : 0),
    vb = (n) => {
      const s = SIDES.get(n.id);
      return s ? Math.max(0, (Math.max(totS(s.r), totS(s.l)) - n.h) / 2) : 0;
    };
  const build = (n, dn) => {
    const k = kidsD(n);
    k.forEach((c) => {
      marked.add(c.id);
      c.down = true;
    });
    D.set(n.id, k);
    k.forEach((c) => {
      dn.push(c);
      build(c, dn);
    });
  };
  const buildS = (n) => {
    const k = kidsS(n);
    k.forEach((c) => claimed.add(c.id));
    TS.set(n.id, k);
    k.forEach(buildS);
  };
  const sides = (c) => {
    const g = kidsS(c),
      cx = c.x + c.w / 2;
    g.forEach((k) => {
      claimed.add(k.id);
      if (k.side !== 'l' && k.side !== 'r') k.side = k.x + k.w / 2 < cx ? 'l' : 'r';
    });
    SIDES.set(c.id, { r: g.filter((k) => k.side === 'r'), l: g.filter((k) => k.side === 'l') });
    g.forEach(buildS);
  };
  const placeS = (n, dir, top) => {
    const k = TS.get(n.id) || [],
      h = hgS(n);
    n.y = top + (h - n.h) / 2;
    let y = top + (h - totS(k)) / 2;
    for (const c of k) {
      c.x = dir === 'r' ? n.x + n.w + gxs(c) : n.x - gxs(c) - c.w;
      placeS(c, dir, y);
      y += hgS(c) + GY;
    }
  };
  const placeSides = (n) => {
    const s = SIDES.get(n.id);
    if (!s) return;
    for (const dir of ['r', 'l']) {
      const g = s[dir];
      let y = n.y + n.h / 2 - totS(g) / 2;
      for (const c of g) {
        c.x = dir === 'r' ? n.x + n.w + gxs(c) : n.x - gxs(c) - c.w;
        placeS(c, dir, y);
        y += hgS(c) + GY;
      }
    }
  };
  const placeKids = (n) => {
    const k = D.get(n.id) || [],
      o = offs(k),
      cx = n.x + n.w / 2;
    k.forEach((c, i) => {
      c.y = n.y + n.h + vb(n) + gy(c);
      c.x = cx + o[i] - c.w / 2;
      placeSides(c);
      placeKids(c);
    });
  };
  /* a node hanging off a down node (and everything on its right/left) is positioned by that branch */
  const markSD = (c) => {
    if (SD.has(c.id)) return;
    SD.add(c.id);
    for (const k of kidsAll(c)) if (!k.down) markSD(k);
  };
  for (const d of M.nodes) if (d.down && !HID.has(d.id)) for (const c of kidsAll(d)) if (!c.down) markSD(c);
  const processHead = (h) => {
    const dn = [];
    build(h, dn);
    dn.forEach(sides);
    placeKids(h);
    const sideNodes = [],
      gather = (n) => {
        for (const c of TS.get(n.id) || []) {
          sideNodes.push(c);
          gather(c);
        }
      };
    for (const d of dn) {
      const s = SIDES.get(d.id);
      for (const c of [...s.r, ...s.l]) {
        sideNodes.push(c);
        gather(c);
      }
    }
    const grp = [...dn, ...sideNodes];
    /* a right/left block of a down node can itself have a bottom branch */
    for (const x of sideNodes) if (kidsAll(x).some((k) => k.down && !marked.has(k.id))) grp.push(...processHead(x));
    const ids = new Set(grp.map((g) => g.id));
    ids.add(h.id);
    for (let i = 0; i < 60; i++) {
      let dy = 0;
      for (const g of grp)
        for (const o of M.nodes)
          if (
            !ids.has(o.id) &&
            !HID.has(o.id) &&
            g.x < o.x + o.w + 10 &&
            g.x + g.w + 10 > o.x &&
            g.y - 8 < o.y + o.h &&
            g.y + g.h + 8 > o.y
          )
            dy = Math.max(dy, o.y + o.h + 20 - g.y);
      if (dy <= 0) break;
      grp.forEach((g) => (g.y += dy));
    }
    return grp;
  };
  const heads = M.nodes.filter((n) => !n.down && !HID.has(n.id) && !SD.has(n.id) && kidsAll(n).some((k) => k.down));
  for (const h of heads) processHead(h);
}
function toggleLayout() {
  if (!need()) return;
  M.settings.layout = M.settings.layout === 'tidy' ? 'free' : 'tidy';
  if (M.settings.layout === 'tidy') markDirty();
  else {
    render();
    viewDirty();
  }
  toast(t(M.settings.layout === 'tidy' ? 't_layoutTidy' : 't_layoutFree'));
  refreshTB();
}
const titleOpts = () => ({
  text: t('central'),
  w: 170,
  h: 70,
  size: 20,
  bold: false,
  fill: '#1f2937',
  color: '#ffffff',
  stroke: '#a1a1a1',
});
function freeSpot(w, h, c) {
  c = c || centerW();
  const ok = (x, y) =>
      !M.nodes.some(
        (n) =>
          x - w / 2 < n.x + n.w + 20 &&
          x + w / 2 > n.x - 20 &&
          y - h / 2 < n.y + n.h + 20 &&
          y + h / 2 > n.y - 20,
      ),
    L = [];
  for (let i = -4; i <= 4; i++) for (let j = -4; j <= 4; j++) L.push([i, j]);
  L.sort((a, b) => Math.hypot(a[0], a[1]) - Math.hypot(b[0], b[1]) || b[1] - a[1]);
  for (const [i, j] of L) {
    const x = c[0] + i * (w + 40),
      y = c[1] + j * (h + 40);
    if (ok(x, y)) return [x, y];
  }
  return c;
}
function hitNode(x, y, ex) {
  const m = 28 / M.view.z;
  let best = null,
    bd = 1e9;
  for (const n of M.nodes) {
    if (n.id === ex || HID.has(n.id)) continue;
    const dx = Math.max(n.x - x, 0, x - n.x - n.w),
      dy = Math.max(n.y - y, 0, y - n.y - n.h),
      d = Math.hypot(dx, dy);
    if (d <= m && d < bd) {
      bd = d;
      best = n;
    }
  }
  return best;
}
function linkClick(id) {
  if (!linkFrom) {
    linkFrom = id;
    sel = { n: new Set([id]), l: null };
    hint();
    render();
    return;
  }
  if (id === linkFrom) return;
  let l = M.links.find((x) => x.from === linkFrom && x.to === id);
  if (!l) {
    snapshot();
    l = mkl({ from: linkFrom, to: id, end: 'none' });
    M.links.push(l);
    markDirty();
  }
  linkFrom = null;
  tool = 'select';
  hint();
  setSel([], l.id);
}
svg.addEventListener('pointerdown', (e) => {
  hidePop();
  freshNode = null; /* any click on the map ends the protection of the just-created block */
  if (!cur) return;
  if (e.button === 2) {
    /* right button + drag on the background = multiple selection (same as Shift + drag) */
    if (e.target.closest('[data-n],[data-l],[data-h],[data-c]')) return;
    const [rx, ry] = toW(e.clientX, e.clientY);
    band = { x0: rx, y0: ry, x1: rx, y1: ry, base: new Set() };
    drag = { t: 'band', rc: true, on: false, sx: e.clientX, sy: e.clientY };
    svg.setPointerCapture(e.pointerId);
    return;
  }
  if (document.activeElement !== document.body) document.activeElement.blur();
  if (editing) commitEdit();
  const [wx, wy] = toW(e.clientX, e.clientY);
  if (e.button === 1 || space) {
    drag = { t: 'pan', sx: e.clientX, sy: e.clientY, vx: M.view.x, vy: M.view.y };
    svg.setPointerCapture(e.pointerId);
    return;
  }
  const h = e.target.dataset.h,
    ne = e.target.closest('[data-n]'),
    le = e.target.closest('[data-l]'),
    mod = e.shiftKey || e.ctrlKey || e.metaKey;
  if (e.target.dataset.c) {
    const action = e.target.dataset.c;
    if (action === 'collapse') {
      toggleCollapse(e.target.dataset.cn, e.target.dataset.cs);
      return;
    }
    const n = byId([...sel.n][0]);
    if (n) {
      if (action === 'add') {
        const cs = e.target.dataset.cs;
        child(cs === 'b' ? 'b' : cs === 'l' ? true : cs === 'r' ? false : wx < n.x + n.w / 2);
      } else if (action === 'link') {
        drag = { t: 'cn', id: n.id };
        conn = { id: n.id, x: wx, y: wy };
      }
    }
    return;
  } else if (h) {
    const n = byId([...sel.n][0]);
    drag = { t: 'rs', h, wx, wy, o: { x: n.x, y: n.y, w: n.w, h: n.h }, id: n.id, moved: false };
  } else if (ne) {
    const id = ne.dataset.n;
    if (tool === 'link') {
      linkClick(id);
      return;
    }
    if (mod) {
      sel.l = null;
      sel.n.has(id) ? sel.n.delete(id) : sel.n.add(id);
      render();
      buildPanel();
      return;
    }
    if (!sel.n.has(id)) setSel([id]);
    drag = {
      t: 'mv',
      id,
      ex: subtree(sel.n),
      sx: wx,
      sy: wy,
      o: new Map(
        [...(e.altKey ? sel.n : subtree(sel.n))].map((i) => {
          const n = byId(i);
          return [i, [n.x, n.y]];
        }),
      ),
      moved: false,
    };
  } else if (le && tool !== 'link') setSel([], le.dataset.l);
  else {
    if (!mod && (sel.n.size || sel.l)) setSel([]);
    if (mod || tpMode()) {
      band = { x0: wx, y0: wy, x1: wx, y1: wy, base: new Set(sel.n) };
      drag = { t: 'band' };
    } else drag = { t: 'pan', sx: e.clientX, sy: e.clientY, vx: M.view.x, vy: M.view.y };
  }
  svg.setPointerCapture(e.pointerId);
});
svg.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const z = M.view.z,
    [wx, wy] = toW(e.clientX, e.clientY);
  if (drag.t === 'pan') {
    M.view.x = drag.vx + e.clientX - drag.sx;
    M.view.y = drag.vy + e.clientY - drag.sy;
    render();
  } else if (drag.t === 'mv') {
    const dx = wx - drag.sx,
      dy = wy - drag.sy;
    if (!drag.moved) {
      if (Math.hypot(dx, dy) * z < 5) return; /* trackpad taps drift a few px */
      snapshot();
      drag.moved = true;
    }
    const m0 = drag.o.get(drag.id),
      ddx = sn(m0[0] + dx) - m0[0],
      ddy = sn(m0[1] + dy) - m0[1];
    if (!drag.fl) drag.fl = subtree([drag.id]);
    const dn = byId(drag.id),
      pl = M.links.find((x) => x.to === drag.id),
      pn = pl && byId(pl.from),
      ocx = m0[0] + dn.w / 2,
      ncx = ocx + ddx,
      fp = !!pn && !drag.o.has(pn.id) && (ocx - (pn.x + pn.w / 2)) * (ncx - (pn.x + pn.w / 2)) < 0;
    for (const [id, [x, y]] of drag.o) {
      const n = byId(id);
      n.x =
        fp && id !== drag.id && drag.fl.has(id) ? sn(ncx - (x + n.w / 2 - ocx) - n.w / 2) : x + ddx;
      n.y = y + ddy;
    }
    const o2 = [...M.nodes]
      .reverse()
      .find(
        (n) =>
          !drag.ex.has(n.id) &&
          !HID.has(n.id) &&
          wx >= n.x &&
          wx <= n.x + n.w &&
          wy >= n.y &&
          wy <= n.y + n.h,
      );
    dropT = o2 ? o2.id : null;
    render();
  } else if (drag.t === 'rs') {
    const dx = wx - drag.wx,
      dy = wy - drag.wy,
      o = drag.o,
      n = byId(drag.id);
    if (!drag.moved) {
      snapshot();
      drag.moved = true;
    }
    let x = o.x,
      y = o.y,
      w = o.w,
      h = o.h;
    if (drag.h.includes('e')) w = Math.max(40, sn(o.w + dx));
    if (drag.h.includes('w')) {
      w = Math.max(40, sn(o.w - dx));
      x = o.x + o.w - w;
    }
    if (drag.h.includes('s')) h = Math.max(24, sn(o.h + dy));
    if (drag.h.includes('n')) {
      h = Math.max(24, sn(o.h - dy));
      y = o.y + o.h - h;
    }
    if (e.shiftKey) {
      const hd = drag.h,
        mn = Math.max(40 / o.w, 24 / o.h);
      let k =
        hd.length === 2 ? Math.max(w / o.w, h / o.h) : hd === 'e' || hd === 'w' ? w / o.w : h / o.h;
      k = Math.max(mn, k);
      w = o.w * k;
      h = o.h * k;
      if (hd.length === 2) {
        x = hd.includes('w') ? o.x + o.w - w : o.x;
        y = hd.includes('n') ? o.y + o.h - h : o.y;
      } else if (hd === 'e' || hd === 'w') {
        x = hd === 'w' ? o.x + o.w - w : o.x;
        y = o.y + (o.h - h) / 2;
      } else {
        y = hd === 'n' ? o.y + o.h - h : o.y;
        x = o.x + (o.w - w) / 2;
      }
    }
    Object.assign(n, { x, y, w, h, manual: true });
    render();
  } else if (drag.t === 'cn') {
    const o = hitNode(wx, wy, drag.id);
    conn = { id: drag.id, x: wx, y: wy, hover: o ? o.id : null };
    render();
  } else if (drag.t === 'band') {
    if (drag.rc && !drag.on) {
      if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 5) return; /* still a plain right-click */
      drag.on = true;
      clearTimeout(rc.timer);
      rc.timer = null;
      hidePop();
      if (sel.n.size || sel.l) setSel([]);
    }
    band.x1 = wx;
    band.y1 = wy;
    const x = Math.min(band.x0, wx),
      y = Math.min(band.y0, wy),
      w = Math.abs(wx - band.x0),
      h = Math.abs(wy - band.y0);
    sel.n = new Set([
      ...band.base,
      ...M.nodes
        .filter(
          (n) => !HID.has(n.id) && n.x < x + w && n.x + n.w > x && n.y < y + h && n.y + n.h > y,
        )
        .map((n) => n.id),
    ]);
    render();
  }
});
const endDrag = (e) => {
  if (!drag) return;
  const d = drag,
    dt = dropT;
  if (d.rc && d.on) rcDragAt = Date.now(); /* swallow the context menu that follows a right-drag */
  drag = null;
  band = null;
  dropT = null;
  if (d.t === 'cn') {
    conn = null;
    const o = e && e.clientX != null ? hitNode(...toW(e.clientX, e.clientY), d.id) : null;
    if (o) {
      let l = M.links.find((x) => x.from === d.id && x.to === o.id);
      if (!l) {
        snapshot();
        l = mkl({ from: d.id, to: o.id, end: 'none' });
        M.links.push(l);
        markDirty();
      }
      setSel([], l.id);
      return;
    }
  }
  if (
    d.t === 'mv' &&
    d.moved &&
    dt &&
    byId(dt) &&
    !d.ex.has(dt) &&
    !M.links.some((x) => x.from === dt && x.to === d.id)
  ) {
    const old = M.links.find((x) => x.to === d.id);
    M.links = M.links.filter((x) => x.to !== d.id);
    M.links.push(old ? { ...old, id: uid(), from: dt } : mkl({ from: dt, to: d.id }));
    const n = byId(d.id),
      tn = byId(dt);
    if (!M.links.some((x) => x.to === dt)) n.side = n.x + n.w / 2 < tn.x + tn.w / 2 ? 'l' : 'r';
    else delete n.side;
    delete tn.colL;
    delete tn.colR;
    delete tn.colB;
    delete n.down;
  }
  if (d.t === 'mv' && d.moved) {
    const n = byId(d.id),
      l = M.links.find((x) => x.to === d.id),
      p = l && byId(l.from);
    if (n && p && !M.links.some((x) => x.to === p.id))
      n.side = n.x + n.w / 2 < p.x + p.w / 2 ? 'l' : 'r';
  }
  if (d.moved) markDirty();
  if (d.t === 'pan') viewDirty();
  render();
  buildPanel();
  if (d.t === 'mv' && !d.moved && byId(d.id)) {
    const now = Date.now();
    if (lastClk.id === d.id && now - lastClk.t < 450) {
      lastClk = { id: '', t: 0 };
      startEdit(d.id);
    } else lastClk = { id: d.id, t: now };
  }
};
svg.addEventListener('pointerup', endDrag);
svg.addEventListener('pointercancel', endDrag);
/* ==========================================================
 * TRACKPAD / WHEEL / TOUCH NAVIGATION
 * Same conventions as Figma, Miro, tldraw and Excalidraw:
 * two-finger swipe = scroll, pinch (or Ctrl/Cmd + wheel) = zoom around the pointer.
 * ========================================================== */
const wheelPx = (e) => {
  const k = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? SR().height : 1;
  return [e.deltaX * k, e.deltaY * k];
};
let wheelAcc = null,
  wheelRaf = 0;
function wheelFlush() {
  wheelRaf = 0;
  const a = wheelAcc;
  wheelAcc = null;
  if (!a || !cur) return;
  M.view.x -= a.dx;
  M.view.y -= a.dy;
  if (a.zf !== 1) zoomAt(a.zf, a.cx, a.cy);
  else {
    render();
    viewDirty();
  }
}
/* events are merged and applied once per frame: trackpads fire 60-120 events/s */
function wheelQueue(dx, dy, zf, cx, cy) {
  const a = wheelAcc || (wheelAcc = { dx: 0, dy: 0, zf: 1, cx, cy });
  a.dx += dx;
  a.dy += dy;
  a.zf *= zf;
  if (zf !== 1) {
    a.cx = cx;
    a.cy = cy;
  }
  if (!wheelRaf) wheelRaf = requestAnimationFrame(wheelFlush);
}
svg.addEventListener(
  'wheel',
  (e) => {
    e.preventDefault();
    if (!cur) return;
    const [dx, dy] = wheelPx(e),
      big = Math.max(Math.abs(dx), Math.abs(dy)),
      /* a trackpad sends many small deltas; a mouse wheel sends big steps */
      pad = e.deltaMode === 0 && big > 0 && big < 40;
    if (e.ctrlKey || e.metaKey) {
      if (!dy) return; /* macOS smart-zoom (two-finger double tap) = ctrl+wheel with zero delta */
      const d = pad ? Math.max(-25, Math.min(25, dy)) : dy;
      wheelQueue(0, 0, Math.exp(-d * (pad ? 0.01 : 0.0015)), e.clientX, e.clientY);
    } else if (e.shiftKey && !dx) wheelQueue(dy, 0, 1, 0, 0);
    else wheelQueue(dx, dy, 1, 0, 0);
  },
  { passive: false },
);
/* the browser must never zoom the whole page while the map is on screen */
$('#stage').addEventListener(
  'wheel',
  (e) => {
    if (e.ctrlKey || e.metaKey) e.preventDefault();
  },
  { passive: false },
);
/* Safari (macOS) sends pinch as gesture events instead of ctrl+wheel */
let gs = null;
svg.addEventListener('gesturestart', (e) => {
  e.preventDefault();
  gs = cur ? { z: M.view.z } : null;
});
svg.addEventListener('gesturechange', (e) => {
  e.preventDefault();
  if (cur && gs) zoomAt((gs.z * e.scale) / M.view.z, e.clientX, e.clientY);
});
svg.addEventListener('gestureend', (e) => {
  e.preventDefault();
  gs = null;
});
/* Touch screens (touch laptops, tablets): two fingers = pinch to zoom + pan */
const tp2 = new Map();
let pinch = null;
const pinchGeom = () => {
  const [a, b] = [...tp2.values()];
  return { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
};
svg.addEventListener(
  'pointerdown',
  (e) => {
    if (e.pointerType !== 'touch' || !cur) return;
    tp2.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (tp2.size < 2) return;
    e.stopImmediatePropagation();
    if (!pinch) {
      drag = null;
      band = null;
      dropT = null;
      conn = null;
      const g = pinchGeom(),
        r = SR(),
        v = M.view;
      pinch = { d0: g.d, z0: v.z, wx: (g.cx - r.left - v.x) / v.z, wy: (g.cy - r.top - v.y) / v.z };
    }
    svg.setPointerCapture(e.pointerId);
  },
  true,
);
svg.addEventListener(
  'pointermove',
  (e) => {
    const p = e.pointerType === 'touch' && tp2.get(e.pointerId);
    if (!p) return;
    p.x = e.clientX;
    p.y = e.clientY;
    if (!pinch || tp2.size < 2) return;
    e.stopImmediatePropagation();
    const g = pinchGeom(),
      r = SR(),
      v = M.view;
    v.z = Math.min(4, Math.max(0.1, (pinch.z0 * g.d) / pinch.d0));
    v.x = g.cx - r.left - pinch.wx * v.z;
    v.y = g.cy - r.top - pinch.wy * v.z;
    render();
    viewDirty();
  },
  true,
);
const pinchEnd = (e) => {
  if (e.pointerType !== 'touch') return;
  const active = !!pinch;
  tp2.delete(e.pointerId);
  if (tp2.size < 2) pinch = null;
  if (active) e.stopImmediatePropagation();
};
svg.addEventListener('pointerup', pinchEnd, true);
svg.addEventListener('pointercancel', pinchEnd, true);
svg.addEventListener('dblclick', (e) => {
  if (!cur || space) return;
  const el = document.elementFromPoint(e.clientX, e.clientY) || e.target,
    ne = el.closest('[data-n]'),
    le = el.closest('[data-l]');
  if (ne) return startEdit(ne.dataset.n);
  if (le) return startEditLink(le.dataset.l);
  if (el.dataset.h || el.dataset.c) return;
  const [x, y] = toW(e.clientX, e.clientY);
  addNode(x, y);
});
const rc = { timer: null, x: 0, y: 0 };
let rcDragAt = 0;
svg.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  if (!cur) return;
  if (drag && drag.rc && drag.on) return;
  if (Date.now() - rcDragAt < 400) return;
  const ne = e.target.closest('[data-n]'),
    [wx, wy] = toW(e.clientX, e.clientY);
  let items;
  if (ne) {
    const id = ne.dataset.n;
    if (!sel.n.has(id)) setSel([id]);
    items = [
      ['edit'],
      ['child'],
      ['sibling'],
      ['dup'],
      ['copy'],
      ['del'],
      [
        'connect',
        () => {
          tool = 'link';
          linkFrom = id;
          hint();
          render();
        },
      ],
    ];
  } else
    items = [
      ['node', () => addNode(wx, wy)],
      ['paste'],
      ['selAll'],
      '-',
      ['zoomIn'],
      ['zoomOut'],
      ['fit'],
      ['grid'],
    ];
  const cx = e.clientX,
    cy = e.clientY,
    show = () =>
      popup(
        items.map((i) =>
          i === '-'
            ? '-'
            : {
                l: t('a_' + i[0]),
                sc: shortcutOf(i[0]),
                f: i[1] || ACT[i[0]],
                chk: i[0] === 'grid' && M.settings.grid,
              },
        ),
        cx,
        cy,
      );
  if (ne) return show();
  if (rc.timer && Math.hypot(cx - rc.x, cy - rc.y) < 12) {
    clearTimeout(rc.timer);
    rc.timer = null;
    hidePop();
    addNode(wx, wy, titleOpts());
    return;
  }
  rc.x = cx;
  rc.y = cy;
  rc.timer = setTimeout(() => {
    rc.timer = null;
    show();
  }, 320);
});
addEventListener('mousemove', (e) => (mouse = { x: e.clientX, y: e.clientY }));
addEventListener('resize', render);
addEventListener('keydown', (e) => {
  const tg = e.target,
    typing = /^(INPUT|TEXTAREA|SELECT)$/.test(tg.tagName) || tg.isContentEditable,
    c = combo(e);
  if (!$('#modal').hidden) {
    if (c === 'Esc') closeModal();
    return;
  }
  if (c === 'Ctrl+S') {
    e.preventDefault();
    ACT.save();
    return;
  }
  if (typing && !['Ctrl+Shift+S', 'Ctrl+O', 'Ctrl+N', 'Ctrl+F', 'F1'].includes(c)) return;
  if (c === 'Space') {
    e.preventDefault();
    if (!space) {
      space = true;
      svg.classList.add('pan');
    }
    return;
  }
  if (e.altKey) return;
  const s = SC.find((x) => x[1] === c && x[2]);
  if (s) {
    e.preventDefault();
    /* Delete/Backspace: ignore auto-repeat and presses right after typing, so emptying a block's
       text can never also delete the block itself */
    if (
      s[2] === 'del' &&
      (e.repeat || Date.now() - editEndedAt < 700 || (freshNode && sel.n.size === 1 && sel.n.has(freshNode)))
    )
      return;
    ACT[s[2]]();
  }
});
addEventListener('keyup', (e) => {
  if (e.key === ' ') {
    space = false;
    svg.classList.remove('pan');
  }
});
/* ==========================================================
 * INIT
 * ========================================================== */
$('#pagebar').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.pgadd !== undefined) {
    pagePanel(false);
    pageAdd();
  } else if (b.dataset.pgstep) pageStep(+b.dataset.pgstep);
  else if (b.dataset.pgmenu !== undefined) pagePanel(!pgOpen);
});
$('#pgpanel').addEventListener('click', (e) => {
  const act = e.target.closest('[data-pgact]'),
    row = e.target.closest('[data-pg]');
  if (act) {
    const k = act.dataset.pgact,
      id = row && row.dataset.pg;
    pagePanel(false);
    if (k === 'new') pageAdd();
    else if (k === 'ren') pageRename(id);
    else if (k === 'dup') pageDup(id);
    else if (k === 'del') pageDel(id);
  } else if (row) {
    if (row.dataset.pg === PG.active) pagePanel(false);
    else pageGo(row.dataset.pg);
  }
});
/* drag a row to reorder the pages */
let pgDrag = '';
$('#pgpanel').addEventListener('dragstart', (e) => {
  const r = e.target.closest('[data-pg]');
  if (!r) return;
  pgDrag = r.dataset.pg;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', pgDrag);
});
$('#pgpanel').addEventListener('dragover', (e) => {
  const r = e.target.closest('[data-pg]');
  if (!pgDrag || !r) return;
  e.preventDefault();
  document.querySelectorAll('#pgpanel .over').forEach((x) => x.classList.remove('over'));
  if (r.dataset.pg !== pgDrag) r.classList.add('over');
});
$('#pgpanel').addEventListener('drop', (e) => {
  const r = e.target.closest('[data-pg]');
  if (!pgDrag || !r) return;
  e.preventDefault();
  const id = pgDrag;
  pgDrag = '';
  pageReorder(id, PG.list.findIndex((p) => p.id === r.dataset.pg));
});
$('#pgpanel').addEventListener('dragend', () => {
  pgDrag = '';
  document.querySelectorAll('#pgpanel .over').forEach((x) => x.classList.remove('over'));
});
/* right-click a page in the list to rename it */
$('#pgpanel').addEventListener('contextmenu', (e) => {
  const r = e.target.closest('[data-pg]');
  if (!r) return;
  e.preventDefault();
  const id = r.dataset.pg;
  pagePanel(false);
  pageRename(id);
});
/* project header: Info (?) button, same menu as the home */
$('#btnHelp').addEventListener('click', () => {
  const m = $('#pmenu');
  m.hidden = !m.hidden;
});
$('#pmenu').addEventListener('click', (e) => {
  const mi = e.target.closest('[data-hm-act]');
  $('#pmenu').hidden = true;
  if (mi) ACT[mi.dataset.hmAct]();
});
addEventListener('pointerdown', (e) => {
  if (!$('#pmenu').hidden && !e.target.closest('#pmenu, #btnHelp')) $('#pmenu').hidden = true;
});
addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !$('#pmenu').hidden) $('#pmenu').hidden = true;
});
addEventListener('pointerdown', (e) => {
  if (pgOpen && !e.target.closest('#pgpanel, #pagebar')) pagePanel(false);
});
addEventListener('keydown', (e) => {
  if (pgOpen && e.key === 'Escape') pagePanel(false);
});
$('#nsq').addEventListener('input', (e) => searchInput(e.target.value));
$('#nsq').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    if (S.hits.length) searchShow(S.i + (e.shiftKey ? -1 : 1));
  } else if (e.key === 'Escape') {
    e.preventDefault();
    searchOpen(false);
    e.target.blur();
  }
});
$('#nsearch').addEventListener('click', (e) => {
  const b = e.target.closest('[data-ns]');
  if (!b) return;
  if (b.dataset.ns === 'clear') searchOpen(false);
  else if (S.hits.length) searchShow(S.i + (b.dataset.ns === 'next' ? 1 : -1));
});
/* another tab changed theme / recent / favorites / view: follow it */
onPrefs = () => {
  const th = PS.mTheme === 'dark' ? 'dark' : 'light';
  if (th !== theme) {
    theme = th;
    document.body.dataset.theme = theme;
    buildUI();
    const f = document.querySelector('.theme-fab');
    if (f) f.textContent = theme === 'dark' ? '☾' : '☀';
  }
  const tp = PS.mTrackpad !== '0';
  if (tp !== tpOn) {
    tpOn = tp;
    hint();
    refreshTB();
  }
  const v = PS.mView === 'list' ? 'list' : 'grid';
  if (v !== H.view) H.view = v;
  if (!cur) drawHome();
};
/* the project list may have changed in another tab: refresh it when this tab is shown again */
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && !cur && $('#modal').hidden) showHome();
});
(async () => {
  $('#props').hidden = false;
  document.body.dataset.theme = theme;
  buildUI();
  buildPanel();
  await showHome();
  /* a reload (or a tab opened with "Open in new tab") reopens the project named in the URL */
  let id = '';
  try {
    id = decodeURIComponent(location.hash.slice(1));
  } catch (e) {}
  if (id) await openProject(id);
})();
