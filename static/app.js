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
a_save|Save
a_saveas|Save as / duplicate…
a_close|Close project
a_rename|Rename project…
a_export|Export
a_import|Import…
a_importProj|Import project
a_exportJson|Export JSON
a_exportSvg|Export SVG
a_exportPng|Export PNG
a_exportPdf|Export PDF
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
a_scrollWheel|Scroll the map
a_band|Area selection
a_moveAlone|Move only this block (without its branch)
a_layout|Tidy mode (invisible grid)
a_minimap|Minimap
a_childLeft|Add child node on the left
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
t_empty|The map is empty
t_nosel|Select a node first
t_noproj|Open or create a project
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
copyOf|Copy of {0}
untitled|Untitled map
central|Central idea
newNode|New node
pm_search|Search projects…
pm_mod|Last modified
pm_cre|Creation date
pm_name|Name
pm_recent|Recent
pm_none|No projects found.
pm_created|Created
pm_modified|Modified
hm_create|Create a new mind map
hm_new|Create new mind map
hm_import|Import JSON
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
pi_exportV|SVG, PNG, PDF and JSON backup (File > Export). JSON files are named NAME_Mindly.json.
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
h_link1|Connect: click the source node (Esc to cancel)
h_link2|Now click the target node (Esc to cancel)
ab_text|Mindly is a local mind map editor. All your data stays on your computer, in the "projects" folder.`
  .split('\n')
  .forEach((l) => {
    const [a, b] = l.split('|');
    D[a] = b;
  });
let theme = localStorage.mTheme || 'light';
const t = (k, ...a) => {
  let s = D[k] || k;
  a.forEach((v, i) => (s = s.replace('{' + i + '}', () => v)));
  return s;
};
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
  ['g_create', 'Tab', 'child'],
  ['g_create', 'Shift+Tab', 'childLeft'],
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
  ['g_nav', 'Ctrl + wheel', '', 'a_zoomWheel'],
  ['g_nav', 'Wheel', '', 'a_scrollWheel'],
  ['g_sel', 'Shift + drag', '', 'a_band'],
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
  if (!a || !b) return null;
  const ac = [a.x + a.w / 2, a.y + a.h / 2],
    bc = [b.x + b.w / 2, b.y + b.h / 2],
    h = M.settings.layout === 'tidy' || Math.abs(bc[0] - ac[0]) >= Math.abs(bc[1] - ac[1]),
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
          ['n', n.x + n.w / 2, n.y],
          ['s', n.x + n.w / 2, n.y + n.h],
          ['w', n.x, n.y + n.h / 2],
          ['e', n.x + n.w, n.y + n.h / 2],
        ]) {
          const s = 11 / z;
          h += `<rect class="hdl" data-h="${k}" x="${x - s / 2}" y="${y - s / 2}" width="${s}" height="${s}" stroke-width="${1 / z}"/>`;
        }
    }
    if (sel.n.size === 1 && !editing && !conn) {
      const n = byId([...sel.n][0]);
      if (n)
        for (const [sx, sy, g, d] of [
          [n.x + n.w + 22 / z, n.y + n.h / 2 - 15 / z, '→', 'link'],
          [n.x + n.w + 22 / z, n.y + n.h / 2 + 15 / z, '+', 'add'],
          [n.x - 22 / z, n.y + n.h / 2 - 15 / z, '←', 'link'],
          [n.x - 22 / z, n.y + n.h / 2 + 15 / z, '+', 'add'],
        ])
          h += `<circle class="cn" data-c="${d}" cx="${sx}" cy="${sy}" r="${11 / z}" stroke="#fff" stroke-width="${1.5 / z}"/><text x="${sx}" y="${sy}" font-size="${14 / z}" fill="#fff" text-anchor="middle" dominant-baseline="central" style="pointer-events:none">${g}</text>`;
    }
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
  for (const l of M.links) {
    const g = geo(l);
    if (g) h += linkSVG(l, g, sel.l === l.id);
  }
  for (const n of M.nodes)
    h += `<g data-n="${n.id}" class="node">${nodeSVG(n, editing === n.id)}</g>`;
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
localStorage.mMinimap = '0'; /* the minimap is always OFF at startup */
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
  return localStorage.mMinimap === '1';
}
function setMmVis(v) {
  localStorage.mMinimap = v ? '1' : '0';
  mm.hidden = !v || !cur;
  if (v && cur) renderMinimap();
  refreshTB();
}
function renderMinimap() {
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
    mx = (vr.width / M.view.z) * 0.75,
    my = (vr.height / M.view.z) * 0.75,
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
  let h = '';
  for (const l of M.links) {
    const a = byId(l.from),
      c = byId(l.to);
    if (a && c) {
      const p = toMM(a.x + a.w / 2, a.y + a.h / 2),
        q = toMM(c.x + c.w / 2, c.y + c.h / 2);
      h += `<line class="mm-link" x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}"/>`;
    }
  }
  for (const n of M.nodes) {
    const [x, y] = toMM(n.x, n.y),
      w = n.w * s,
      hgt = n.h * s;
    h += `<rect class="mm-node" x="${x}" y="${y}" width="${w}" height="${hgt}" rx="${Math.max(1, 2 * s)}" fill="${esc(n.fill)}"/>`;
    const fs = Math.max(5, Math.min(16, hgt * 0.5));
    if (n.text && hgt >= 6)
      h += `<text class="mm-text" x="${x + w / 2}" y="${y + hgt / 2}" font-size="${fs}" fill="${esc(n.color)}">${esc(n.text)}</text>`;
  }
  const r = SR();
  const vpx = (-M.view.x / M.view.z - b.x) * s + mmOx;
  const vpy = (-M.view.y / M.view.z - b.y) * s + mmOy;
  const vpw = (r.width / M.view.z) * s;
  const vph = (r.height / M.view.z) * s;
  h += `<rect class="mm-vp" x="${vpx}" y="${vpy}" width="${vpw}" height="${vph}" rx="2"/>`;
  mmsvg.innerHTML = h;
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
function mmCenterOn(wx, wy) {
  const r = SR();
  M.view.x = r.width / 2 - wx * M.view.z;
  M.view.y = r.height / 2 - wy * M.view.z;
  render();
  viewDirty();
}
function mmZoomBy(f) {
  mmZoom = Math.min(8, Math.max(0.1, mmZoom * f));
  renderMinimap();
}
mmsvg.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return;
  e.preventDefault();
  const pt = mmToWorld(e.clientX, e.clientY);
  if (!pt) return;
  mmPanDrag = true;
  mmCenterOn(pt[0], pt[1]);
  mmsvg.setPointerCapture(e.pointerId);
});
mmsvg.addEventListener('pointermove', (e) => {
  if (!mmPanDrag) return;
  const pt = mmToWorld(e.clientX, e.clientY);
  if (pt) mmCenterOn(pt[0], pt[1]);
});
const endMmPan = () => {
  mmPanDrag = false;
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
    ['new', 'open', 'save', 'saveas', 'rename', 'close', '-', 'export', 'import', '-', 'preview'],
  ],
  ['m_edit', ['undo', 'redo', '-', 'cut', 'copy', 'paste', 'dup', 'del', '-', 'selAll', 'desel']],
  ['m_insert', ['root', 'node', 'child', 'childLeft', 'sibling', 'link']],
  [
    'm_view',
    [
      'minimap',
      'zoomIn',
      'zoomOut',
      'zoomReset',
      'fit',
      '-',
      'grid',
      'snap',
      'layout',
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
  $('#theme').textContent = theme === 'dark' ? '☀' : '☾';
  $('#btnProjects').textContent = t('a_projects');
  $('#pname').title = t('a_rename');
  buildHome();
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
  $('#hint').textContent = tool === 'link' ? t(linkFrom ? 'h_link2' : 'h_link1') : t('h_select');
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
const proj = () => ({
  version: 1,
  nodes: M.nodes,
  links: M.links,
  settings: M.settings,
  view: M.view,
});
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
const recs = () => {
  try {
    return JSON.parse(localStorage.mRecent || '[]');
  } catch (e) {
    return [];
  }
};
const setRecs = (a) => (localStorage.mRecent = JSON.stringify(a.slice(0, 8)));
const fmtD = (s) => (s ? new Date(s).toLocaleString('en-GB') : '');
function resetCur() {
  cur = null;
  M = blank();
  undoS = [];
  redoS = [];
  dirty = false;
  clearTimeout(saveT);
  sel = { n: new Set(), l: null };
  editing = null;
  editBase = null;
  $('#editor').hidden = true;
  localStorage.removeItem('mLast');
  setStat('none');
  updTitle();
  render();
  buildPanel();
}
async function openProject(id) {
  if (cur && dirty && !(await save(false))) return;
  try {
    const r = await api('GET', '/projects/' + encodeURIComponent(id));
    cur = {
      id: r.id,
      name: r.metadata.name,
      created: r.metadata.created,
      modified: r.metadata.modified,
    };
    M = norm(r.project);
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
    localStorage.mLast = id;
    setStat('saved');
    updTitle();
    hint();
    render();
    buildPanel();
  } catch (e) {
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
    localStorage.mLast = r.id;
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
  if (cur && cur.id === id) await save(false);
  try {
    const r = await api('POST', '/projects/' + encodeURIComponent(id) + '/rename', { name: v });
    if (cur && cur.id === id) {
      cur.id = r.id;
      cur.name = r.metadata.name;
      updTitle();
      localStorage.mLast = r.id;
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
  box.innerHTML = `<div class="pmbar"><input id="pq" placeholder="${t('pm_search')}"><select id="ps"><option value="m">${t('pm_mod')}</option><option value="c">${t('pm_cre')}</option><option value="n">${t('pm_name')}</option></select><button class="btn pri" data-r="new">${t('a_new')}</button><button class="btn" data-r="import">${t('a_importProj')}</button></div><div id="prec"></div><div id="plist"></div>`;
  modal(t('a_projects'), box, [{ l: t('b_close') }], true);
  const draw = () => {
    const q = box.querySelector('#pq').value.toLowerCase(),
      s = box.querySelector('#ps').value;
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
              `<div class="row"><div class="nm"><b data-r="open" data-id="${esc(p.id)}">${esc(p.name)}</b><small>${t('pm_modified')}: ${fmtD(p.modified)} · ${t('pm_created')}: ${fmtD(p.created)}</small></div><button data-r="open" data-id="${esc(p.id)}">${t('b_open')}</button><button data-r="ren" data-id="${esc(p.id)}" title="${t('b_ren')}">✎</button><button data-r="dup" data-id="${esc(p.id)}" title="${t('b_dup')}">⧉</button><button data-r="del" data-id="${esc(p.id)}" title="${t('b_delete')}">✕</button></div>`,
          )
          .join('')
      : `<p class="muted">${t('pm_none')}</p>`;
  };
  box.querySelector('#pq').oninput = draw;
  box.querySelector('#ps').onchange = draw;
  draw();
  box.onclick = async (e) => {
    const b = e.target.closest('[data-r]');
    if (!b) return;
    const id = b.dataset.id,
      p = list.find((x) => x.id === id),
      r = b.dataset.r;
    if (r === 'open') {
      closeModal();
      openProject(id);
    } else if (r === 'new') newProject();
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
    return JSON.parse(localStorage.mFav || '[]');
  } catch (e) {
    return [];
  }
};
const setFavs = (a) => (localStorage.mFav = JSON.stringify(a));
const H = { q: '', f: 'all', view: localStorage.mView === 'list' ? 'list' : 'grid', list: [] };
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
  return `<div class="home-actions">${all ? b('', 'ren', '✎', t('b_ren')) + b('', 'dup', '⧉', t('b_dup')) : ''}${b('star' + (star ? ' active' : ''), 'fav', star ? '★' : '☆', t('hm_star'))}${b('trash', 'del', '✕', t('b_delete'))}</div>`;
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
            `<div class="home-card" data-id="${esc(p.id)}" tabindex="0" title="${esc(p.name)}"><div class="home-card-thumb" data-th="${esc(p.id)}"></div><div class="home-card-tools"><button class="row-icon-btn" data-h="ren" title="${t('b_ren')}">✎</button><button class="row-icon-btn" data-h="dup" title="${t('b_dup')}">⧉</button></div><div class="home-card-foot">${icon}<div class="home-card-meta"><div class="home-card-title">${esc(p.name)}</div><div class="home-card-date">${homeDate(p.modified)}</div></div>${homeActions(p, false)}</div></div>`,
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
      localStorage.mView = H.view;
      drawHome();
    }
  } else if (card) {
    const id = card.dataset.id,
      p = H.list.find((x) => x.id === id);
    if (!p) return;
    if (!ab) return openProject(id);
    const a = ab.dataset.h;
    if (a === 'fav') {
      const f = favs();
      setFavs(f.includes(id) ? f.filter((x) => x !== id) : [id, ...f]);
      drawHome();
    } else if (a === 'ren') renameProject(id, p.name);
    else if (a === 'dup') dupProject(id, p.name);
    else if (a === 'del') deleteProject(id, p.name);
  }
}
$('#home').addEventListener('click', homeClick);
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
  if (side) c.side = side;
  M.nodes.push(c);
  M.links.push(mkl({ ...(pl || {}), id: uid(), from, to: c.id, end: 'none' }));
  setSel([c.id]);
  markDirty();
  startEdit(c.id);
}
function sideOf(n, d = 0) {
  const l = M.links.find((x) => x.to === n.id),
    p = l && byId(l.from);
  if (!p || d > 50) return 'r';
  if (!M.links.some((x) => x.to === p.id))
    return n.side || (n.x + n.w / 2 < p.x + p.w / 2 ? 'l' : 'r');
  return sideOf(p, d + 1);
}
function child(left) {
  if (!need()) return;
  const n = oneSel();
  if (!n) return toast(t('t_nosel'), 'err');
  const dir = left === true ? 'l' : sideOf(n),
    tidy = M.settings.layout === 'tidy',
    kids = M.links
      .filter((l) => l.from === n.id)
      .map((l) => byId(l.to))
      .filter(Boolean),
    y = kids.length ? Math.max(...kids.map((k) => k.y)) + (tidy ? 1 : n.h + 24) : n.y;
  spawn(n, dir === 'l' ? n.x - 90 - 140 : n.x + n.w + 90, y, n.id, null, dir);
}
function sibling() {
  if (!need()) return;
  const n = oneSel();
  if (!n) return toast(t('t_nosel'), 'err');
  const pl = M.links.find((l) => l.to === n.id);
  if (pl)
    spawn(n, n.x, M.settings.layout === 'tidy' ? n.y + 1 : n.y + n.h + 24, pl.from, pl, n.side);
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
  snapshot();
  M.nodes = M.nodes.filter((n) => !sel.n.has(n.id));
  M.links = M.links.filter((l) => byId(l.from) && byId(l.to));
  setSel([]);
  markDirty();
}
const pick = () => ({
  nodes: M.nodes.filter((n) => sel.n.has(n.id)),
  links: M.links.filter((l) => sel.n.has(l.from) && sel.n.has(l.to)),
});
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
function copy() {
  if (!sel.n.size) return;
  clip = JSON.parse(JSON.stringify(pick()));
  pc = 0;
}
function cut() {
  if (!sel.n.size) return;
  copy();
  del();
}
function paste() {
  if (!need() || !clip) return;
  snapshot();
  pc++;
  addClone(clone(clip, 30 * pc));
}
function dup() {
  if (!need() || !sel.n.size) return;
  snapshot();
  addClone(clone(pick(), 30));
}
function selAll() {
  if (cur) setSel(M.nodes.map((n) => n.id));
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
function commitEdit() {
  const id = editing;
  if (!id) return;
  editing = null;
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
  restoreBase();
  editing = null;
  editingLink = null;
  $('#editor').hidden = true;
  render();
}
$('#editor').addEventListener('keydown', (e) => {
  const c = combo(e);
  e.stopPropagation();
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
  if (!M.nodes.length) return null;
  let a = 1e9,
    b = 1e9,
    c = -1e9,
    d = -1e9;
  for (const n of M.nodes) {
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
  for (const n of M.nodes) s += nodeSVG(n, false);
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
function exportPdf() {
  if (!need()) return;
  if (!M.nodes.length) return toast(t('t_empty'), 'err');
  const b = bbox(),
    W = b.w + 80,
    H = b.h + 80,
    k = Math.min(2, 8000 / Math.max(W, H)),
    img = new Image();
  img.onload = () => {
    const c = document.createElement('canvas');
    c.width = Math.round(W * k);
    c.height = Math.round(H * k);
    const g = c.getContext('2d');
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, c.width, c.height);
    g.drawImage(img, 0, 0, c.width, c.height);
    const jpg = Uint8Array.from(atob(c.toDataURL('image/jpeg', 0.95).split(',')[1]), (ch) =>
        ch.charCodeAt(0),
      ),
      f = Math.min(0.75, 14400 / Math.max(W, H));
    dl(fname('pdf'), pdfBlob(jpg, c.width, c.height, W * f, H * f));
    toast(t('t_exported'));
  };
  img.onerror = () => toast(t('e_error'), 'err');
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr());
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
function exportSvg() {
  if (!need()) return;
  if (!M.nodes.length) return toast(t('t_empty'), 'err');
  dl(fname('svg'), new Blob([svgStr()], { type: 'image/svg+xml' }));
  toast(t('t_exported'));
}
function exportPng() {
  if (!need()) return;
  if (!M.nodes.length) return toast(t('t_empty'), 'err');
  const b = bbox(),
    W = b.w + 80,
    H = b.h + 80,
    img = new Image();
  img.onload = () => {
    const c = document.createElement('canvas');
    c.width = W * 2;
    c.height = H * 2;
    const x = c.getContext('2d');
    x.scale(2, 2);
    x.drawImage(img, 0, 0, W, H);
    c.toBlob((bl) => {
      dl(fname('png'), bl);
      toast(t('t_exported'));
    });
  };
  img.onerror = () => toast(t('e_error'), 'err');
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr());
}
$('#file').addEventListener('change', async (e) => {
  const f = e.target.files[0];
  e.target.value = '';
  if (!f) return;
  try {
    const j = JSON.parse(await f.text()),
      p = j.project || j;
    if (!p || !Array.isArray(p.nodes) || !Array.isArray(p.links)) throw 0;
    const name = (j.metadata && j.metadata.name) || f.name.replace(/(_Mindly)?\.json$/i, '') || t('untitled');
    const r = await api('POST', '/projects', { name, project: p });
    await openProject(r.id);
    toast(t('t_imported'));
  } catch (x) {
    toast(t('t_importErr'), 'err');
  }
});
/* ==========================================================
 * ACTIONS
 * ========================================================== */
const ACT = {
  new: newProject,
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
    localStorage.mPanel = p.hidden ? '0' : '1';
    render();
  },
  minimap: () => setMmVis(!mmVisible()),
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
  grid: () => toggle('grid'),
  snap: () => toggle('snap'),
  full: () =>
    document.fullscreenElement
      ? document.exitFullscreen()
      : document.documentElement.requestFullscreen(),
  theme: () => {
    theme = theme === 'dark' ? 'light' : 'dark';
    localStorage.mTheme = theme;
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
                sub: ['exportPdf', 'exportPng', 'exportSvg', 'exportJson'].map((x) => ({
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
        if (c) a.push(c);
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
    if (n.id === ex) continue;
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
    const n = byId([...sel.n][0]);
    const action = e.target.dataset.c;
    if (n) {
      if (action === 'add') {
        const isLeft = wx < n.x + n.w / 2;
        child(isLeft);
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
    if (mod) {
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
      if (Math.hypot(dx, dy) * z < 3) return;
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
        (n) => !drag.ex.has(n.id) && wx >= n.x && wx <= n.x + n.w && wy >= n.y && wy <= n.y + n.h,
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
        .filter((n) => n.x < x + w && n.x + n.w > x && n.y < y + h && n.y + n.h > y)
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
svg.addEventListener(
  'wheel',
  (e) => {
    e.preventDefault();
    if (!cur) return;
    if (e.ctrlKey || e.metaKey) zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX, e.clientY);
    else {
      const v = M.view;
      if (e.shiftKey && !e.deltaX) v.x -= e.deltaY;
      else {
        v.x -= e.deltaX;
        v.y -= e.deltaY;
      }
      render();
      viewDirty();
    }
  },
  { passive: false },
);
svg.addEventListener('dblclick', (e) => {
  if (!cur || space) return;
  const el = document.elementFromPoint(e.clientX, e.clientY) || e.target,
    ne = el.closest('[data-n]'),
    le = el.closest('[data-l]');
  if (ne) return startEdit(ne.dataset.n);
  if (le) return startEditLink(le.dataset.l);
  if (el.dataset.h) return;
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
  if (typing && !['Ctrl+Shift+S', 'Ctrl+O', 'Ctrl+N', 'F1'].includes(c)) return;
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
(async () => {
  $('#props').hidden = false;
  document.body.dataset.theme = theme;
  buildUI();
  buildPanel();
  showHome();
})();
