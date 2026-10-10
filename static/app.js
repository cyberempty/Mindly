'use strict';
const $=s=>document.querySelector(s),uid=()=>Math.random().toString(36).slice(2,10),esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
/* ---------- i18n ---------- */
const D={};
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
a_about|About Mindly
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
p_none|No selection
p_hint|Select a node or a link to edit its properties.
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
t_deleted|Project deleted
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
e_error|Unexpected error
d_name|Project name
d_new|New project
d_rename|Rename project
d_dup|Duplicate project
d_delTitle|Delete project
d_delMsg|Permanently delete "{0}"? This cannot be undone.
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
em_title|No project open
em_msg|Create a new mind map or open an existing project.
h_select|Click: select · double-click: edit · drag the background: pan · Ctrl+wheel: zoom · drag the ● to connect
h_link1|Connect: click the source node (Esc to cancel)
h_link2|Now click the target node (Esc to cancel)
ab_text|Mindly is a local mind map editor. All your data stays on your computer, in the "projects" folder.`.split('\n').forEach(l=>{const[a,b]=l.split('|');D[a]=b});
let theme=localStorage.mTheme||'light';
const t=(k,...a)=>{let s=D[k]||k;a.forEach((v,i)=>s=s.replace('{'+i+'}',()=>v));return s};
/* ---------- state ---------- */
const svg=$('#svg');
const FONTS=[['Segoe UI, Arial, sans-serif','Sans'],['Georgia, serif','Serif'],['Consolas, monospace','Mono'],['Comic Sans MS, cursive','Script']];
const SH=['rect','rounded','circle','ellipse','pill'];
const blank=()=>({nodes:[],links:[],settings:{grid:true,snap:false,layout:'tidy'},view:{x:400,y:300,z:1}});
const mk=o=>({id:uid(),x:0,y:0,w:140,h:56,text:'',fill:'#ffffff',color:'#1f2937',font:FONTS[0][0],size:16,bold:false,italic:false,align:'center',stroke:'#374151',sw:2,radius:6,opacity:1,shape:'rounded',...o});
const mkl=o=>({id:uid(),from:'',to:'',color:'#4b5563',width:2,type:'curve',dashed:false,start:'none',end:'none',text:'',bold:false,...o});
const norm=p=>{const b=blank();return{nodes:(p.nodes||[]).map(mk),links:(p.links||[]).map(mkl),settings:{...b.settings,...p.settings},view:{...b.view,...p.view}}};
const rootNode=()=>mk({isTitle:true,x:-85,y:-35,w:170,h:70,text:t('central'),size:20,bold:true,fill:'#1f2937',color:'#ffffff',stroke:'#111827'});
let renaming=false,nameT=null,cur=null,M=blank(),sel={n:new Set(),l:null},undoS=[],redoS=[],lk='',lt=0,dirty=false,saving=false,st='none',saveT,tool='select',linkFrom=null,clip=null,pc=0,space=false,editing=null,editingLink=null,drag=null,band=null,conn=null,dropT=null,lastClk={id:'',t:0},mouse={x:0,y:0},onMC=null;
const byId=id=>M.nodes.find(n=>n.id===id);
const sn=v=>M.settings.snap?Math.round(v/20)*20:v;
const SR=()=>svg.getBoundingClientRect();
const toW=(cx,cy)=>{const r=SR();return[(cx-r.left-M.view.x)/M.view.z,(cy-r.top-M.view.y)/M.view.z]};
const need=()=>{if(cur)return true;toast(t('t_noproj'),'err');if($('#modal').hidden)newProject();return false};
/* ---------- shortcuts ---------- */
const SC=[['g_file','Ctrl+N','new'],['g_file','Ctrl+O','open'],['g_file','Ctrl+S','save'],['g_file','Ctrl+Shift+S','saveas'],['g_file','Ctrl+W','close'],
['g_edit','Ctrl+Z','undo'],['g_edit','Ctrl+Y','redo'],['g_edit','Ctrl+Shift+Z','redo','a_redo2'],['g_edit','Ctrl+C','copy'],['g_edit','Ctrl+X','cut'],['g_edit','Ctrl+V','paste'],['g_edit','Ctrl+D','dup'],['g_edit','Delete','del'],['g_edit','Backspace','del'],['g_edit','Ctrl+A','selAll'],['g_edit','Esc','desel'],
['g_create','Tab','child'],['g_create','Shift+Tab','childLeft'],['g_create','Enter','sibling'],['g_create','F2','edit'],['g_create','T','root'],['g_create','Double right-click','','a_titleRC'],['g_create','N','node'],['g_create','T','root'],['g_create','L','link'],
['g_nav','+','zoomIn'],['g_nav','-','zoomOut'],['g_nav','0','zoomReset'],['g_nav','1','fit'],['g_nav','Space + drag','','a_pan'],['g_nav','Ctrl + wheel','','a_zoomWheel'],['g_nav','Wheel','','a_scrollWheel'],['g_sel','Shift + drag','','a_band'],['g_sel','Drag onto block','','a_reparent'],['g_sel','Shift + resize','','a_resizeProp'],['g_sel','Alt + drag','','a_moveAlone'],
['g_sel','Shift + click','','a_msShift'],['g_sel','Ctrl + click','','a_msCtrl'],
['g_fmt','Ctrl+B','bold'],['g_fmt','Ctrl+I','italic'],['g_fmt','Ctrl+Shift+E','center'],
['g_view','Ctrl++','zoomIn'],['g_view','Ctrl+-','zoomOut'],['g_view','Ctrl+0','fitView'],['g_view','F11','full'],
['g_help','F1','shortcuts'],['g_help','?','shortcuts2']];
const shortcutOf=a=>(SC.find(s=>s[2]===a)||[])[1];
const combo=e=>{let k=e.key;if(k==='=')k='+';if(k==='Escape')k='Esc';if(k===' ')k='Space';if(k.length===1)k=k.toUpperCase();const m=[];if(e.ctrlKey||e.metaKey)m.push('Ctrl');if(e.altKey)m.push('Alt');if(e.shiftKey&&k!=='+'&&k!=='?')m.push('Shift');m.push(k);return m.join('+')};
/* ---------- geometry & rendering ---------- */
const cv=document.createElement('canvas').getContext('2d');
function lines(n){const maxW=Math.max(10,n.w-24-(n.shape==='rect'||n.shape==='rounded'?0:n.w*.12));cv.font=`${n.italic?'italic ':''}${n.bold?'bold ':''}${n.size}px ${n.font}`;const out=[];for(const para of String(n.text).split('\n')){let line='';for(const w of para.split(' ')){const tr=line?line+' '+w:w;if(cv.measureText(tr).width>maxW&&line){out.push(line);line=w}else line=tr}out.push(line)}return out}
function fitNode(n){cv.font=`${n.italic?'italic ':''}${n.bold?'bold ':''}${n.size}px ${n.font}`;let tw=0;for(const l of String(n.text).split('\n'))tw=Math.max(tw,cv.measureText(l).width);const sh=n.shape,sq=sh==='rect'||sh==='rounded',rd=sh==='ellipse'||sh==='circle';
 n.w=Math.round(Math.min(340,Math.max(90,((tw+24)/(sq?1:.88)+4)*(rd?1.3:1))));let h=lines(n).length*n.size*1.25+20;if(rd)h*=1.3;n.h=Math.round(Math.max(40,h));if(sh==='circle')n.w=n.h=Math.max(n.w,n.h)}
function grow(n){if(!n.manual)return fitNode(n);const need=lines(n).length*n.size*1.25+16;if(need>n.h)n.h=Math.ceil(need)}
function nodeSVG(n,hide){const cx=n.x+n.w/2,cy=n.y+n.h/2,a=`fill="${esc(n.fill)}" stroke="${esc(n.stroke)}" stroke-width="${n.sw}"`;let s;
 if(n.shape==='circle'){const r=Math.min(n.w,n.h)/2;s=`<ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r}" ${a}/>`}
 else if(n.shape==='ellipse')s=`<ellipse cx="${cx}" cy="${cy}" rx="${n.w/2}" ry="${n.h/2}" ${a}/>`;
 else{const r=n.shape==='rect'?0:n.shape==='pill'?n.h/2:n.radius;s=`<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="${r}" ${a}/>`}
 if(!hide){const ls=lines(n),lh=n.size*1.25,y0=cy-ls.length*lh/2+lh/2,x=n.align==='left'?n.x+12:n.align==='right'?n.x+n.w-12:cx,an=n.align==='left'?'start':n.align==='right'?'end':'middle';
  s+=ls.map((l,i)=>`<text x="${x}" y="${y0+i*lh}" text-anchor="${an}" dominant-baseline="central" font-family="${esc(n.font)}" font-size="${n.size}" font-weight="${n.bold?700:400}" font-style="${n.italic?'italic':'normal'}" fill="${esc(n.color)}" style="pointer-events:none;white-space:pre">${esc(l)}</text>`).join('')}
 return `<g opacity="${n.opacity}">${s}</g>`}
const hw=n=>n.shape==='circle'?Math.min(n.w,n.h)/2:n.w/2,hh=n=>n.shape==='circle'?Math.min(n.w,n.h)/2:n.h/2,ang=(a,b)=>Math.atan2(b[1]-a[1],b[0]-a[0]);
function edge(n,tx,ty){const cx=n.x+n.w/2,cy=n.y+n.h/2,dx=tx-cx,dy=ty-cy;if(!dx&&!dy)return[cx,cy];const a=hw(n),b=hh(n),k=(n.shape==='ellipse'||n.shape==='circle')?1/Math.hypot(dx/a,dy/b):1/Math.max(Math.abs(dx)/a,Math.abs(dy)/b);return[cx+dx*k,cy+dy*k]}
function geo(l){const a=byId(l.from),b=byId(l.to);if(!a||!b)return null;const ac=[a.x+a.w/2,a.y+a.h/2],bc=[b.x+b.w/2,b.y+b.h/2],h=M.settings.layout==='tidy'||Math.abs(bc[0]-ac[0])>=Math.abs(bc[1]-ac[1]),s=(h?bc[0]>=ac[0]:bc[1]>=ac[1])?1:-1;let p,q,d,a1,a2;
 if(h){p=[ac[0]+s*hw(a),ac[1]];q=[bc[0]-s*hw(b),bc[1]]}else{p=[ac[0],ac[1]+s*hh(a)];q=[bc[0],bc[1]-s*hh(b)]}
 if(l.type==='ortho'){if(h){const m=(p[0]+q[0])/2;d=`M${p}L${m},${p[1]}L${m},${q[1]}L${q}`;a1=s>0?Math.PI:0;a2=s>0?0:Math.PI}else{const m=(p[1]+q[1])/2;d=`M${p}L${p[0]},${m}L${q[0]},${m}L${q}`;a1=s>0?-Math.PI/2:Math.PI/2;a2=s>0?Math.PI/2:-Math.PI/2}}
 else if(l.type==='curve'){const c1=h?[p[0]+(q[0]-p[0])/2,p[1]]:[p[0],p[1]+(q[1]-p[1])/2],c2=h?[q[0]-(q[0]-p[0])/2,q[1]]:[q[0],q[1]-(q[1]-p[1])/2];d=`M${p}C${c1} ${c2} ${q}`;a1=ang(c1,p);a2=ang(c2,q)}
 else{d=`M${p}L${q}`;a1=ang(q,p);a2=ang(p,q)}
 return{d,p,q,a1,a2}}
function cap(c,pt,a,col,w){const s=9+w*2;if(c==='arrow'){const ca=Math.cos(a),sa=Math.sin(a),bx=pt[0]-ca*s,by=pt[1]-sa*s;return `<path d="M${pt}L${bx-sa*s*.45},${by+ca*s*.45}L${bx+sa*s*.45},${by-ca*s*.45}Z" fill="${col}"/>`}if(c==='dot')return `<circle cx="${pt[0]}" cy="${pt[1]}" r="${3+w}" fill="${col}"/>`;return''}
function linkSVG(l,g,s,ex){const c=esc(l.color),w=l.width;let h='';if(!ex)h+=`<path d="${g.d}" fill="none" stroke="transparent" stroke-width="${Math.max(14,w+8)}" style="pointer-events:stroke"/>`;if(s)h+=`<path d="${g.d}" fill="none" stroke="var(--accent)" stroke-opacity=".35" stroke-width="${w+8}"/>`;h+=`<path d="${g.d}" fill="none" stroke="${c}" stroke-width="${w}"${l.dashed?` stroke-dasharray="${w*3} ${w*2}"`:''} stroke-linejoin="round"/>`+cap(l.start,g.p,g.a1,c,w)+cap(l.end,g.q,g.a2,c,w);if(l.text&&editingLink!==l.id){const mx=(g.p[0]+g.q[0])/2,my=(g.p[1]+g.q[1])/2;const fontSize=12;cv.font=`${l.bold?'bold ':''}${fontSize}px sans-serif`;const textWidth=cv.measureText(l.text).width;const pad=4;h+=`<rect x="${mx-textWidth/2-pad}" y="${my-fontSize/2-pad}" width="${textWidth+pad*2}" height="${fontSize+pad*2}" fill="#ffffff" stroke="#ccc" stroke-width="1" rx="3"/>`;h+=`<text x="${mx}" y="${my}" text-anchor="middle" dominant-baseline="central" font-size="${fontSize}" font-weight="${l.bold?700:400}" fill="#1f2937" style="pointer-events:none">${esc(l.text)}</text>`;}return ex?h:`<g data-l="${l.id}" class="lnk">${h}</g>`}
function overlay(){let h='';const z=M.view.z;
 if(!editingLink){for(const id of sel.n){const n=byId(id);if(n)h+=`<rect class="sel" x="${n.x-5}" y="${n.y-5}" width="${n.w+10}" height="${n.h+10}" rx="6" fill="none" stroke-width="${1.5/z}" stroke-dasharray="${5/z}"/>`}
 if(sel.n.size===1&&!editing){const n=byId([...sel.n][0]);if(n)for(const[k,x,y]of[['nw',n.x,n.y],['ne',n.x+n.w,n.y],['sw',n.x,n.y+n.h],['se',n.x+n.w,n.y+n.h],['n',n.x+n.w/2,n.y],['s',n.x+n.w/2,n.y+n.h],['w',n.x,n.y+n.h/2],['e',n.x+n.w,n.y+n.h/2]]){const s=11/z;h+=`<rect class="hdl" data-h="${k}" x="${x-s/2}" y="${y-s/2}" width="${s}" height="${s}" stroke-width="${1/z}"/>`}}
 if(sel.n.size===1&&!editing&&!conn){const n=byId([...sel.n][0]);if(n)for(const[sx,g]of[[n.x+n.w+22/z,'→'],[n.x-22/z,'←']])h+=`<circle class="cn" data-c="1" cx="${sx}" cy="${n.y+n.h/2}" r="${11/z}" stroke="#fff" stroke-width="${1.5/z}"/><text x="${sx}" y="${n.y+n.h/2}" font-size="${14/z}" fill="#fff" text-anchor="middle" dominant-baseline="central" style="pointer-events:none">${g}</text>`}}
 if(conn){const n=byId(conn.id);if(n){const p=edge(n,conn.x,conn.y),e=[conn.x,conn.y];h+=`<path class="cnl" d="M${p}L${e}" stroke-width="${2/z}" stroke-dasharray="${6/z}"/>`+cap('arrow',e,ang(p,e),'#111827',2/z);const o=conn.hover&&byId(conn.hover);if(o)h+=`<rect class="src" x="${o.x-6}" y="${o.y-6}" width="${o.w+12}" height="${o.h+12}" rx="8" stroke-width="${2/z}"/>`}}
 const dtn=dropT&&byId(dropT);if(dtn)h+=`<rect class="src" x="${dtn.x-6}" y="${dtn.y-6}" width="${dtn.w+12}" height="${dtn.h+12}" rx="8" stroke-width="${2.5/z}"/>`;
 const f=linkFrom&&byId(linkFrom);if(f)h+=`<rect class="src" x="${f.x-6}" y="${f.y-6}" width="${f.w+12}" height="${f.h+12}" rx="8" stroke-width="${2/z}"/>`;
 if(band)h+=`<rect class="band" x="${Math.min(band.x0,band.x1)}" y="${Math.min(band.y0,band.y1)}" width="${Math.abs(band.x1-band.x0)}" height="${Math.abs(band.y1-band.y0)}" stroke-width="${1/z}"/>`;
 return h}
function render(){const v=M.view,w=$('#world');let h='';for(const l of M.links){const g=geo(l);if(g)h+=linkSVG(l,g,sel.l===l.id)}for(const n of M.nodes)h+=`<g data-n="${n.id}" class="node">${nodeSVG(n,editing===n.id)}</g>`;
 w.innerHTML=h+overlay();const tr=`translate(${v.x} ${v.y}) scale(${v.z})`;w.setAttribute('transform',tr);$('#grid').setAttribute('patternTransform',tr);$('#gridrect').style.display=M.settings.grid?'':'none';
 const z=Math.round(v.z*100)+'%',zl=$('#zl');if(zl)zl.textContent=z;$('#zf').textContent=z;$('#stats').textContent=t('p_stats',M.nodes.length,M.links.length);$('#empty').hidden=!!cur;svg.classList.toggle('tl',tool==='link');svg.classList.toggle('pan',space);refreshTB();posFbar();if(editingLink)$('#editor').hidden=false;else if(!editing)$('#editor').hidden=true;renderMinimap()}
/* ---------- minimap ---------- */
const mm=$('#minimap'),mmsvg=$('#mmsvg');
const MM_PAD=6;
localStorage.mMinimap='0'; /* the minimap is always OFF at startup */
let mmZoom=1,mmFitScale=1,mmOx=0,mmOy=0,mmBBox=null,mmWinDrag=null,mmResDrag=null,mmPanDrag=null,mmPinned=true;
function mmVisible(){return localStorage.mMinimap==='1'}
function setMmVis(v){localStorage.mMinimap=v?'1':'0';mm.hidden=!v||!cur;if(v&&cur)renderMinimap();refreshTB()}
function renderMinimap(){
  if(!mmVisible()||!cur||!M.nodes.length){mm.hidden=true;return}
  mm.hidden=false;
  const b=bbox();
  if(!b){mm.hidden=true;return}
  mmBBox=b;
  const W=mmsvg.clientWidth||220,H=mmsvg.clientHeight||140;
  mmsvg.setAttribute('viewBox',`0 0 ${W} ${H}`);
  const aw=W-MM_PAD*2,ah=H-MM_PAD*2;
  mmFitScale=Math.min(aw/b.w,ah/b.h);
  const s=mmFitScale*mmZoom;
  mmOx=(W-b.w*s)/2;
  mmOy=(H-b.h*s)/2;
  const toMM=(x,y)=>[(x-b.x)*s+mmOx,(y-b.y)*s+mmOy];
  let h='';
  for(const l of M.links){const a=byId(l.from),c=byId(l.to);if(a&&c){const p=toMM(a.x+a.w/2,a.y+a.h/2),q=toMM(c.x+c.w/2,c.y+c.h/2);h+=`<line class="mm-link" x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}"/>`}}
  for(const n of M.nodes){const[x,y]=toMM(n.x,n.y),w=n.w*s,hgt=n.h*s;h+=`<rect class="mm-node" x="${x}" y="${y}" width="${w}" height="${hgt}" rx="${Math.max(1,2*s)}" fill="${esc(n.fill)}"/>`;const fs=Math.max(5,Math.min(16,hgt*.5));if(n.text)h+=`<text class="mm-text" x="${x+w/2}" y="${y+hgt/2}" font-size="${fs}" fill="${esc(n.color)}">${esc(n.text)}</text>`}
  const r=SR();
  const vpx=(-M.view.x/M.view.z-b.x)*s+mmOx;
  const vpy=(-M.view.y/M.view.z-b.y)*s+mmOy;
  const vpw=r.width/M.view.z*s;
  const vph=r.height/M.view.z*s;
  h+=`<rect class="mm-vp" x="${vpx}" y="${vpy}" width="${vpw}" height="${vph}" rx="2"/>`;
  mmsvg.innerHTML=h;
  const ze=$('#mmzoom');if(ze)ze.textContent=Math.round(mmZoom*100)+'%'}
function mmToWorld(cx,cy){
  if(!mmBBox)return null;
  const r=mmsvg.getBoundingClientRect();
  const vbx=((cx-r.left)/r.width)*mmsvg.clientWidth;
  const vby=((cy-r.top)/r.height)*mmsvg.clientHeight;
  const s=mmFitScale*mmZoom;
  return[(vbx-mmOx)/s+mmBBox.x,(vby-mmOy)/s+mmBBox.y]}
function mmCenterOn(wx,wy){const r=SR();M.view.x=r.width/2-wx*M.view.z;M.view.y=r.height/2-wy*M.view.z;render();viewDirty()}
function mmZoomBy(f){
  mmZoom=Math.min(8,Math.max(.1,mmZoom*f));
  renderMinimap()}
mmsvg.addEventListener('pointerdown',e=>{
  if(e.button!==0)return;e.preventDefault();
  const pt=mmToWorld(e.clientX,e.clientY);if(!pt)return;
  mmPanDrag=true;mmCenterOn(pt[0],pt[1]);mmsvg.setPointerCapture(e.pointerId)});
mmsvg.addEventListener('pointermove',e=>{if(!mmPanDrag)return;const pt=mmToWorld(e.clientX,e.clientY);if(pt)mmCenterOn(pt[0],pt[1])});
const endMmPan=()=>{mmPanDrag=false};
mmsvg.addEventListener('pointerup',endMmPan);mmsvg.addEventListener('pointercancel',endMmPan);
mmsvg.addEventListener('wheel',e=>{e.preventDefault();e.stopPropagation();if(e.ctrlKey||e.metaKey){mmZoomBy(Math.exp(-e.deltaY*.0015))}},{passive:false});
mm.addEventListener('click',e=>{const b=e.target.closest('[data-mm]');if(!b)return;const a=b.dataset.mm;if(a==='zoomin')mmZoomBy(1.25);else if(a==='zoomout')mmZoomBy(1/1.25);else if(a==='close')setMmVis(false);else if(a==='pin'){mmPinned=!mmPinned;mm.classList.toggle('unpinned',!mmPinned);if(mmPinned){mm.style.left='';mm.style.top='';mm.style.right='10px'}renderMinimap()}});
const stg=$('#stage'),MM_M=20,mmzoomEl=$('#mmzoom');
function mmApply(L,T,W,H){mm.style.width=W+'px';mm.style.height=H+'px';mm.style.top=T+'px';if(mmPinned){mm.style.left='';mm.style.right=(stg.clientWidth-L-W)+'px'}else{mm.style.right='auto';mm.style.left=L+'px'}renderMinimap()}
function mmClamp(){if(mmPinned)return;const sr=stg.getBoundingClientRect(),r=mm.getBoundingClientRect();mm.style.left=Math.max(MM_M,Math.min(r.left-sr.left,sr.width-MM_M-r.width))+'px';mm.style.top=Math.max(MM_M,Math.min(r.top-sr.top,sr.height-MM_M-r.height))+'px';mm.style.right='auto'}
function mmResetAll(){mmZoom=1;mm.style.width='';mm.style.height='';if(mmPinned){mm.style.left=mm.style.top=mm.style.right=''}else mmClamp();renderMinimap()}
if(mmzoomEl)mmzoomEl.addEventListener('click',e=>{e.stopPropagation();mmResetAll()});
const mmControls=mm.querySelector('.mm-controls');
mmControls.addEventListener('pointerdown',e=>{if(mmPinned||e.target.closest('button'))return;e.preventDefault();const sr=stg.getBoundingClientRect(),r=mm.getBoundingClientRect();mmWinDrag={x:e.clientX,y:e.clientY,left:r.left-sr.left,top:r.top-sr.top};mmControls.setPointerCapture(e.pointerId)});
mmControls.addEventListener('pointermove',e=>{if(!mmWinDrag)return;const sr=stg.getBoundingClientRect();mm.style.left=Math.max(MM_M,Math.min(mmWinDrag.left+e.clientX-mmWinDrag.x,sr.width-MM_M-mm.offsetWidth))+'px';mm.style.top=Math.max(MM_M,Math.min(mmWinDrag.top+e.clientY-mmWinDrag.y,sr.height-MM_M-mm.offsetHeight))+'px';mm.style.right='auto'});
const endMmWinDrag=()=>{mmWinDrag=null};
mmControls.addEventListener('pointerup',endMmWinDrag);mmControls.addEventListener('pointercancel',endMmWinDrag);
/* resize ONLY from the 4 corners; coordinates are relative to #stage; the opposite corner stays fixed and the dragged corner stays under the cursor (offset kept) until it reaches the 20px margin */
let mmRC=null;
mm.addEventListener('pointerdown',e=>{const h=e.target.closest('.mm-rc');if(!h||e.button!==0)return;e.preventDefault();e.stopPropagation();const sr=stg.getBoundingClientRect(),r=mm.getBoundingClientRect(),c=h.dataset.c,L=r.left-sr.left,T=r.top-sr.top,R=L+r.width,B=T+r.height;mmRC={c,L,T,R,B,ox:e.clientX-sr.left-(c.includes('w')?L:R),oy:e.clientY-sr.top-(c.includes('n')?T:B)};h.setPointerCapture(e.pointerId)});
mm.addEventListener('pointermove',e=>{if(!mmRC)return;const sr=stg.getBoundingClientRect(),d=mmRC,px=e.clientX-sr.left-d.ox,py=e.clientY-sr.top-d.oy;let{L,T,R,B}=d;
 if(d.c.includes('w'))L=Math.max(MM_M,Math.min(px,R-120));else R=Math.min(sr.width-MM_M,Math.max(px,L+120));
 if(d.c.includes('n'))T=Math.max(MM_M,Math.min(py,B-80));else B=Math.min(sr.height-MM_M,Math.max(py,T+80));
 mmApply(L,T,R-L,B-T)});
const endMmRC=()=>{mmRC=null};mm.addEventListener('pointerup',endMmRC);mm.addEventListener('pointercancel',endMmRC);
function refreshTB(){const on=(a,v)=>document.querySelectorAll(`[data-act="${a}"]`).forEach(b=>b.classList.toggle('on',!!v));on('grid',M.settings.grid);on('snap',M.settings.snap);on('layout',M.settings.layout==='tidy');on('link',tool==='link');on('select',tool==='select');on('minimap',mmVisible())}
/* ---------- UI build ---------- */
const MENUS=[['m_file',['new','open','save','saveas','rename','close','-','export','import','-','preview']],['m_edit',['undo','redo','-','cut','copy','paste','dup','del','-','selAll','desel']],['m_insert',['root','node','child','childLeft','sibling','link']],['m_view',['props','minimap','zoomIn','zoomOut','zoomReset','fit','-','grid','snap','layout','-','full','theme']],['m_help',['shortcuts','about']]];
const TB=[['undo','↶'],['redo','↷'],'|',['dup','⧉'],['del','✕'],'|',['zoomOut','−'],'z',['zoomIn','+'],['fit','⤢'],'|',['grid','▦'],['snap','⌗'],['layout','⊞'],['minimap','◫'],'|',['props','☰']];
const TL=[['select','↖'],['node','＋'],['child','→'],['sibling','↓'],['link','⟷']];
const AI={left:'<path d="M1 1h12M1 6h8M1 11h11"/>',center:'<path d="M1 1h12M3 6h8M2 11h10"/>',right:'<path d="M1 1h12M5 6h8M2 11h11"/>'};
function buildUI(){const tip=a=>esc(t('a_'+a)+(shortcutOf(a)?` (${shortcutOf(a)})`:''));
 $('#menubar').innerHTML=MENUS.map((m,i)=>`<button data-m="${i}">${t(m[0])}</button>`).join('');
 $('#toolbar').innerHTML=TB.map(x=>x==='|'?'<i class="sep"></i>':x==='z'?`<button id="zl" data-act="zoomReset" title="${tip('zoomReset')}">100%</button>`:`<button data-act="${x[0]}" title="${tip(x[0])}">${x[1]}</button>`).join('');
 $('#tools').innerHTML=`<button class="ttl" data-act="root" title="${tip('root')}"><b>T</b><small>${t('title')}</small></button><hr>`+TL.map(x=>`<button data-act="${x[0]}" title="${tip(x[0])}">${x[1]}</button>`).join('')+'<hr>'+SH.map(s=>`<button data-shape="${s}" title="${t('s_'+s)}"><i class="shi sh-${s}"></i></button>`).join('');
 $('#theme').title=t('a_theme');$('#theme').textContent=theme==='dark'?'☀':'☾';$('#btnProjects').textContent=t('a_projects');$('#pname').title=t('a_rename');
 $('#empty').innerHTML=`<h2>${t('em_title')}</h2><p class="muted">${t('em_msg')}</p><div><button class="btn pri" data-act="new">${t('a_new')}</button> <button class="btn" data-act="open">${t('a_open')}</button> <button class="btn" data-act="import">${t('a_importProj')}</button></div>`;
 updTitle();setStat(st);hint();render()}
function updTitle(){document.title=(cur?cur.name+' – ':'')+'Mindly';$('#pname').textContent=cur?cur.name:t('st_none')}
function setStat(s){st=s;const e=$('#savestat');e.className='stat '+s;e.textContent=t('st_'+s)}
function hint(){$('#hint').textContent=tool==='link'?t(linkFrom?'h_link2':'h_link1'):t('h_select')}
function toast(m,ty){const e=document.createElement('div');e.className='toast'+(ty==='err'?' err':'');e.textContent=m;$('#toasts').appendChild(e);setTimeout(()=>e.remove(),3200)}
const err=(e,k)=>toast(t(k)+(D['e_'+e.message]?': '+t('e_'+e.message):''),'err');
/* ---------- popup / modal ---------- */
function hidePop(){$('#ctx').hidden=true}
function popup(items,x,y){const p=$('#ctx');
 const row=(it,i)=>`<button data-i="${i}"${it.sub?' data-s="1"':''}><span class="ck">${it.chk?'✓':''}</span>${esc(it.l)}<kbd>${it.sub?'▸':esc(it.sc||'')}</kbd></button>`;
 p.innerHTML=items.map((it,i)=>it==='-'?'<hr>':row(it,i)+(it.sub?`<div class="sub" hidden>${it.sub.map((q,k)=>row(q,i+'.'+k)).join('')}</div>`:'')).join('');
 p.hidden=false;p.style.left=Math.max(0,Math.min(x,innerWidth-p.offsetWidth-4))+'px';p.style.top=Math.max(0,Math.min(y,innerHeight-p.offsetHeight-4))+'px';
 const openSub=b=>{p.querySelectorAll('.sub').forEach(q=>q.hidden=true);if(!b||!b.dataset.s)return;const q=b.nextElementSibling;q.hidden=false;q.style.top=(b.offsetTop-5)+'px';q.classList.remove('flip');if(p.getBoundingClientRect().right+q.offsetWidth+8>innerWidth)q.classList.add('flip')};
 p.onmouseover=e=>{const b=e.target.closest('button');if(b&&b.parentElement===p)openSub(b)};
 p.onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.s){openSub(b);return}const k=b.dataset.i.split('.');let it=items[k[0]];if(k.length>1)it=it.sub[k[1]];hidePop();it.f()}}
function modal(title,body,btns,wide,oc){const m=$('#modal');m.innerHTML=`<div class="dlg${wide?' wide':''}"><h3>${title}</h3><div class="mb"></div><div class="mbt"></div></div>`;const mb=m.querySelector('.mb');typeof body==='string'?mb.innerHTML=body:mb.appendChild(body);const bt=m.querySelector('.mbt');(btns||[]).forEach(b=>{const e=document.createElement('button');e.className='btn '+(b.c||'');e.textContent=b.l;e.onclick=()=>{if(!b.f||b.f()!==false)closeModal()};bt.appendChild(e)});onMC=oc||null;m.hidden=false;m.onpointerdown=e=>{if(e.target===m)closeModal()}}
function closeModal(){const f=onMC;onMC=null;const m=$('#modal');m.hidden=true;m.innerHTML='';f&&f()}
function ask(title,label,val){return new Promise(res=>{const b=document.createElement('div');b.innerHTML=`<label class="f"><span>${label}</span><input maxlength="60" value="${esc(val)}"></label>`;let done=false;const fin=v=>{if(!done){done=true;res(v)}};modal(title,b,[{l:t('b_cancel'),f:()=>fin(null)},{l:t('b_ok'),c:'pri',f:()=>{const v=b.querySelector('input').value.trim();if(!v)return false;fin(v)}}],false,()=>fin(null));const i=b.querySelector('input');i.focus();i.select();i.onkeydown=e=>{if(e.key==='Enter')$('#modal .pri').click()}})}
function confirmDlg(title,msg){return new Promise(res=>{let done=false;const fin=v=>{if(!done){done=true;res(v)}};modal(title,`<p>${esc(msg)}</p>`,[{l:t('b_cancel'),f:()=>fin(false)},{l:t('b_delete'),c:'pri',f:()=>fin(true)}],false,()=>fin(false))})}
function showShortcuts(){const g={};SC.forEach(s=>(g[s[0]]=g[s[0]]||[]).push(s));let h='<div class="sc">';for(const k in g)h+=`<h4>${t(k)}</h4>`+g[k].map(s=>`<div class="r"><span>${t(s[3]||'a_'+s[2])}</span><kbd>${esc(s[1])}</kbd></div>`).join('');modal(t('a_shortcuts'),h+'</div>',[{l:t('b_close'),c:'pri'}],true)}
/* ---------- history & saving ---------- */
const core=()=>JSON.stringify({nodes:M.nodes,links:M.links});
function snapshot(k){const n=Date.now();if(k&&k===lk&&n-lt<1200){lt=n;return}lk=k||'';lt=n;undoS.push(core());if(undoS.length>300)undoS.shift();redoS=[]}
function restore(s){if(editing)cancelEdit();const o=JSON.parse(s);M.nodes=o.nodes;M.links=o.links;sel.n=new Set([...sel.n].filter(byId));if(sel.l&&!M.links.some(l=>l.id===sel.l))sel.l=null;lk='';markDirty();render();buildPanel()}
function undo(){if(!cur||!undoS.length)return;redoS.push(core());restore(undoS.pop())}
function redo(){if(!cur||!redoS.length)return;undoS.push(core());restore(redoS.pop())}
function markDirty(){if(!cur)return;if(M.settings.layout==='tidy'){layoutAll();render()}dirty=true;setStat('unsaved');clearTimeout(saveT);saveT=setTimeout(()=>save(true),1500)}
function viewDirty(){if(!cur)return;dirty=true;clearTimeout(saveT);saveT=setTimeout(()=>save(true),1500)}
const proj=()=>({version:1,nodes:M.nodes,links:M.links,settings:M.settings,view:M.view});
async function api(m,u,b){const r=await fetch('/api'+u,{method:m,headers:{'Content-Type':'application/json'},body:b?JSON.stringify(b):undefined});let j={};try{j=await r.json()}catch(e){}if(!r.ok)throw Error(j.error||'error');return j}
async function save(auto){if(!cur)return true;clearTimeout(saveT);if(!dirty&&auto)return true;if(saving||renaming)return false;saving=true;setStat('saving');dirty=false;let ok=true;
 try{const r=await api('PUT','/projects/'+encodeURIComponent(cur.id),{project:proj()});cur.modified=r.modified;setStat(dirty?'unsaved':'saved');if(!auto)toast(t('t_saved'))}catch(e){dirty=true;ok=false;setStat('error');toast(t('t_saveErr'),'err')}
 saving=false;if(dirty&&ok)saveT=setTimeout(()=>save(true),500);return ok}
addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue=''}});
addEventListener('pagehide',()=>{if(dirty&&cur)fetch('/api/projects/'+encodeURIComponent(cur.id),{method:'PUT',keepalive:true,headers:{'Content-Type':'application/json'},body:JSON.stringify({project:proj()})})});
/* ---------- projects ---------- */
const recs=()=>{try{return JSON.parse(localStorage.mRecent||'[]')}catch(e){return[]}};
const setRecs=a=>localStorage.mRecent=JSON.stringify(a.slice(0,8));
const fmtD=s=>s?new Date(s).toLocaleString('en-GB'):'';
function resetCur(){cur=null;M=blank();undoS=[];redoS=[];dirty=false;clearTimeout(saveT);sel={n:new Set(),l:null};editing=null;$('#editor').hidden=true;localStorage.removeItem('mLast');setStat('none');updTitle();render();buildPanel()}
async function openProject(id){if(cur&&dirty&&!(await save(false)))return;try{const r=await api('GET','/projects/'+encodeURIComponent(id));cur={id:r.id,name:r.metadata.name,created:r.metadata.created,modified:r.metadata.modified};M=norm(r.project);if(M.settings.layout==='tidy')layoutAll();if(!r.project.view){const s=SR();M.view={x:s.width/2,y:s.height/2,z:1}}undoS=[];redoS=[];sel={n:new Set(),l:null};dirty=false;tool='select';linkFrom=null;setRecs([id,...recs().filter(x=>x!==id)]);localStorage.mLast=id;setStat('saved');updTitle();hint();render();buildPanel()}catch(e){err(e,'t_loadErr')}}
const newMap=()=>({version:1,nodes:[rootNode()],links:[],settings:{grid:true,snap:false,layout:'tidy'}});
async function newProject(){const n=await ask(t('d_new'),t('d_name'),t('untitled'));if(n==null)return;try{const r=await api('POST','/projects',{name:n,project:{...newMap(),view:{x:SR().width/2,y:SR().height/2,z:1}}});toast(t('t_created'));await openProject(r.id)}catch(e){err(e,'t_saveErr')}}
async function syncName(txt){const v=String(txt||'').replace(/\s+/g,' ').trim().slice(0,60);if(!v||!cur||v===cur.name||renaming)return;await save(true);if(!cur||saving)return;renaming=true;
 try{const old=cur.id,r=await api('POST','/projects/'+encodeURIComponent(old)+'/rename',{name:v});cur.id=r.id;cur.name=r.metadata.name;localStorage.mLast=r.id;setRecs(recs().map(x=>x===old?r.id:x));updTitle()}catch(e){}
 renaming=false;if(dirty){clearTimeout(saveT);saveT=setTimeout(()=>save(true),400)}}
async function renameProject(id,name){const v=await ask(t('d_rename'),t('d_name'),name);if(v==null||v===name)return;if(cur&&cur.id===id)await save(false);try{const r=await api('POST','/projects/'+encodeURIComponent(id)+'/rename',{name:v});if(cur&&cur.id===id){cur.id=r.id;cur.name=r.metadata.name;updTitle();localStorage.mLast=r.id}setRecs(recs().map(x=>x===id?r.id:x));toast(t('t_renamed'))}catch(e){err(e,'t_saveErr')}}
async function dupProject(id,name){const v=await ask(t('d_dup'),t('d_name'),t('copyOf',name));if(v==null)return null;try{const r=await api('POST','/projects/'+encodeURIComponent(id)+'/duplicate',{name:v});toast(t('t_dupd'));return r.id}catch(e){err(e,'t_saveErr');return null}}
async function deleteProject(id,name){if(!(await confirmDlg(t('d_delTitle'),t('d_delMsg',name))))return;try{await api('DELETE','/projects/'+encodeURIComponent(id));setRecs(recs().filter(x=>x!==id));if(cur&&cur.id===id)resetCur();toast(t('t_deleted'))}catch(e){err(e,'t_saveErr')}}
async function manager(){let list=[];try{list=(await api('GET','/projects')).projects}catch(e){return err(e,'t_loadErr')}
 const box=document.createElement('div');box.innerHTML=`<div class="pmbar"><input id="pq" placeholder="${t('pm_search')}"><select id="ps"><option value="m">${t('pm_mod')}</option><option value="c">${t('pm_cre')}</option><option value="n">${t('pm_name')}</option></select><button class="btn pri" data-r="new">${t('a_new')}</button><button class="btn" data-r="import">${t('a_importProj')}</button></div><div id="prec"></div><div id="plist"></div>`;
 modal(t('a_projects'),box,[{l:t('b_close')}],true);
 const draw=()=>{const q=box.querySelector('#pq').value.toLowerCase(),s=box.querySelector('#ps').value;let a=list.filter(p=>p.name.toLowerCase().includes(q));a.sort((x,y)=>s==='n'?x.name.localeCompare(y.name):s==='c'?y.created.localeCompare(x.created):y.modified.localeCompare(x.modified));
  const rc=recs().map(id=>list.find(p=>p.id===id)).filter(Boolean);box.querySelector('#prec').innerHTML=rc.length&&!q?`<small class="muted">${t('pm_recent')}</small><br>`+rc.map(p=>`<button data-r="open" data-id="${esc(p.id)}">${esc(p.name)}</button>`).join(''):'';
  box.querySelector('#plist').innerHTML=a.length?a.map(p=>`<div class="row"><div class="nm"><b data-r="open" data-id="${esc(p.id)}">${esc(p.name)}</b><small>${t('pm_modified')}: ${fmtD(p.modified)} · ${t('pm_created')}: ${fmtD(p.created)}</small></div><button data-r="open" data-id="${esc(p.id)}">${t('b_open')}</button><button data-r="ren" data-id="${esc(p.id)}" title="${t('b_ren')}">✎</button><button data-r="dup" data-id="${esc(p.id)}" title="${t('b_dup')}">⧉</button><button data-r="del" data-id="${esc(p.id)}" title="${t('b_delete')}">✕</button></div>`).join(''):`<p class="muted">${t('pm_none')}</p>`};
 box.querySelector('#pq').oninput=draw;box.querySelector('#ps').onchange=draw;draw();
 box.onclick=async e=>{const b=e.target.closest('[data-r]');if(!b)return;const id=b.dataset.id,p=list.find(x=>x.id===id),r=b.dataset.r;
  if(r==='open'){closeModal();openProject(id)}else if(r==='new')newProject();else if(r==='import'){$('#file').click()}else if(r==='ren'){await renameProject(id,p.name);manager()}else if(r==='dup'){const n=await dupProject(id,p.name);manager();void n}else if(r==='del'){await deleteProject(id,p.name);manager()}}}
async function saveAs(){if(!need())return;await save(false);const id=await dupProject(cur.id,cur.name);if(id)await openProject(id)}
async function closeProject(){if(!cur)return;if(!(await save(false)))return;resetCur();manager()}
/* ---------- editing operations ---------- */
const oneSel=()=>[...sel.n].map(byId).filter(Boolean).pop();
function setSel(ids,l=null){sel={n:new Set(ids),l};render();buildPanel()}
function addNode(x,y,o={}){if(!need())return;snapshot();const n=mk({text:t('newNode'),...o});if(!('w' in o))fitNode(n);n.x=sn(x-n.w/2);n.y=sn(y-n.h/2);M.nodes.push(n);setSel([n.id]);markDirty();startEdit(n.id)}
const centerW=()=>{const r=SR();return toW(r.left+r.width/2,r.top+r.height/2)};
function spawn(n,x,y,from,pl,side){snapshot();const c=mk({x,y,text:t('newNode')});fitNode(c);if(side)c.side=side;M.nodes.push(c);M.links.push(mkl({...(pl||{}),id:uid(),from,to:c.id,end:'none'}));setSel([c.id]);markDirty();startEdit(c.id)}
function sideOf(n,d=0){const l=M.links.find(x=>x.to===n.id),p=l&&byId(l.from);if(!p||d>50)return'r';if(!M.links.some(x=>x.to===p.id))return n.side||(n.x+n.w/2<p.x+p.w/2?'l':'r');return sideOf(p,d+1)}
function child(left){if(!need())return;const n=oneSel();if(!n)return toast(t('t_nosel'),'err');const dir=left===true?'l':sideOf(n),tidy=M.settings.layout==='tidy',kids=M.links.filter(l=>l.from===n.id).map(l=>byId(l.to)).filter(Boolean),y=kids.length?Math.max(...kids.map(k=>k.y))+(tidy?1:n.h+24):n.y;spawn(n,dir==='l'?n.x-90-140:n.x+n.w+90,y,n.id,null,dir)}
function sibling(){if(!need())return;const n=oneSel();if(!n)return toast(t('t_nosel'),'err');const pl=M.links.find(l=>l.to===n.id);if(pl)spawn(n,n.x,M.settings.layout==='tidy'?n.y+1:n.y+n.h+24,pl.from,pl,n.side);else child()}
function del(){if(!cur)return;if(sel.l){snapshot();M.links=M.links.filter(l=>l.id!==sel.l);setSel([]);markDirty();return}if(!sel.n.size)return;snapshot();M.nodes=M.nodes.filter(n=>!sel.n.has(n.id));M.links=M.links.filter(l=>byId(l.from)&&byId(l.to));setSel([]);markDirty()}
const pick=()=>({nodes:M.nodes.filter(n=>sel.n.has(n.id)),links:M.links.filter(l=>sel.n.has(l.from)&&sel.n.has(l.to))});
function clone(src,off){const m={};const nodes=src.nodes.map(n=>{const c={...n,id:uid(),x:n.x+off,y:n.y+off,isTitle:false};m[n.id]=c.id;return c});return{nodes,links:src.links.map(l=>({...l,id:uid(),from:m[l.from],to:m[l.to]}))}}
function addClone(c){M.nodes.push(...c.nodes);M.links.push(...c.links);setSel(c.nodes.map(n=>n.id));markDirty()}
function copy(){if(!sel.n.size)return;clip=JSON.parse(JSON.stringify(pick()));pc=0}
function cut(){if(!sel.n.size)return;copy();del()}
function paste(){if(!need()||!clip)return;snapshot();pc++;addClone(clone(clip,30*pc))}
function dup(){if(!need()||!sel.n.size)return;snapshot();addClone(clone(pick(),30))}
function selAll(){if(cur)setSel(M.nodes.map(n=>n.id))}
function desel(){if(editing)return cancelEdit();hidePop();tool='select';linkFrom=null;hint();setSel([])}
function startEdit(id){const n=byId(id);if(!n)return;editing=id;if(!sel.n.has(id)){sel={n:new Set([id]),l:null};buildPanel()}const v=M.view,ed=$('#editor');Object.assign(ed.style,{left:n.x*v.z+v.x+'px',top:n.y*v.z+v.y+'px',width:n.w*v.z+'px',height:n.h*v.z+'px',fontFamily:n.font,fontSize:n.size*v.z+'px',fontWeight:n.bold?700:400,fontStyle:n.italic?'italic':'normal',textAlign:n.align,color:n.color,background:n.fill});ed.value=n.text;ed.hidden=false;render();ed.focus();ed.select()}
function startEditLink(id){const l=M.links.find(x=>x.id===id);if(!l)return;editingLink=id;const g=geo(l);if(!g)return;const mx=(g.p[0]+g.q[0])/2,my=(g.p[1]+g.q[1])/2;const v=M.view,ed=$('#editor');const fontSize=12;cv.font=`${l.bold?'bold ':''}${fontSize}px sans-serif`;const textWidth=cv.measureText(l.text||' ').width;const pad=4;const w=Math.max(50,textWidth+pad*2),h=fontSize+pad*2;Object.assign(ed.style,{left:mx*v.z+v.x-w*v.z/2+'px',top:my*v.z+v.y-h*v.z/2+'px',width:w*v.z+'px',height:h*v.z+'px',fontFamily:'sans-serif',fontSize:fontSize*v.z+'px',fontWeight:l.bold?700:400,fontStyle:'normal',textAlign:'center',color:'#1f2937',background:'#ffffff',border:'1px solid #ccc',borderRadius:'3px'});ed.value=l.text;ed.hidden=false;render();buildFbar();ed.focus();ed.select()}
function commitEdit(){const id=editing;if(!id)return;editing=null;const ed=$('#editor');ed.hidden=true;const n=byId(id);if(n&&ed.value!==n.text){snapshot();n.text=ed.value;grow(n);markDirty();if(n.isTitle)syncName(n.text)}render();buildPanel()}
function commitEditLink(){const id=editingLink;if(!id)return;editingLink=null;const ed=$('#editor');ed.hidden=true;const l=M.links.find(x=>x.id===id);if(l&&ed.value!==l.text){snapshot();l.text=ed.value;markDirty()}render();buildPanel()}
function cancelEdit(){editing=null;editingLink=null;$('#editor').hidden=true;render()}
$('#editor').addEventListener('keydown',e=>{const c=combo(e);e.stopPropagation();if(c==='Enter'){e.preventDefault();if(editingLink)commitEditLink();else commitEdit()}else if(c==='Esc'){e.preventDefault();cancelEdit()}else if(c==='Tab'&&!editingLink){e.preventDefault();commitEdit();child()}else if(c==='Shift+Tab'&&!editingLink){e.preventDefault();commitEdit();child(true)}else if(c==='Ctrl+B'||c==='Ctrl+I'){e.preventDefault();const id=editing,v=$('#editor').value;fmt(c==='Ctrl+B'?'bold':'italic');if(byId(id)){editing=id;const n=byId(id),ed=$('#editor');ed.style.fontWeight=n.bold?700:400;ed.style.fontStyle=n.italic?'italic':'normal';ed.value=v}}else if(c==='Ctrl+Shift+E'&&!editingLink){e.preventDefault();fmtCenter()}});
$('#editor').addEventListener('blur',()=>{if(editing)commitEdit();if(editingLink)commitEditLink()});
const LIM={w:[40,3000],h:[24,3000],size:[6,200],sw:[0,30],radius:[0,200],width:[1,30],opacity:[.1,1]};
function applyProp(p,v){const tg=sel.l?M.links.filter(l=>l.id===sel.l):[...sel.n].map(byId).filter(Boolean);if(!tg.length)return;if(LIM[p])v=Math.min(LIM[p][1],Math.max(LIM[p][0],+v||LIM[p][0]));snapshot('p'+p);if(p==='text'){const ot=tg.find(x=>x.isTitle);if(ot){clearTimeout(nameT);nameT=setTimeout(()=>syncName(ot.text),900)}}
 for(const o of tg){o[p]=v;if(p==='w'||p==='h')o.manual=true;if(!sel.l&&['text','size','font','bold','italic','w','shape'].includes(p))grow(o)}render();markDirty();if(sel.l&&p==='bold')buildPanel()}
function fmt(p){const ns=[...sel.n].map(byId).filter(Boolean);if(!ns.length)return toast(t('t_nosel'),'err');applyProp(p,!ns[0][p]);buildPanel()}
function fmtCenter(){if(!sel.n.size)return toast(t('t_nosel'),'err');applyProp('align','center');buildPanel()}
/* ---------- panel ---------- */
const fld=(k,h)=>`<label class="f"><span>${t(k)}</span>${h}</label>`;
const inp=(ty,p,v,x='')=>`<input type="${ty}" data-p="${p}" value="${esc(v)}" ${x}>`;
const sl=(p,v,o)=>`<select data-p="${p}">${o.map(([a,b])=>`<option value="${esc(a)}"${a===v?' selected':''}>${esc(b)}</option>`).join('')}</select>`;
const CAPS=()=>['none','arrow','dot'].map(c=>[c,t('c_'+c)]);
function buildPanel(){const ns=[...sel.n].map(byId).filter(Boolean),l=sel.l&&M.links.find(x=>x.id===sel.l);let h;
 if(l)h=`<h4>${t('p_link')}</h4>`+fld('p_linkText',`<input type="text" data-p="text" value="${esc(l.text)}" placeholder="${t('p_linkText')}">`)+fld('p_style',`<button data-b="bold" class="${l.bold?'on':''}" title="${t('a_bold')}"><b>B</b></button>`)+fld('p_color',inp('color','color',l.color))+fld('p_width',inp('number','width',l.width,'min="1" max="30"'))+fld('p_type',sl('type',l.type,[['straight',t('o_straight')],['curve',t('o_curve')],['ortho',t('o_ortho')]]))+fld('p_dashed',`<input type="checkbox" data-p="dashed" ${l.dashed?'checked':''}>`)+fld('p_start',sl('start',l.start,CAPS()))+fld('p_end',sl('end',l.end,CAPS()))+`<button class="btn" data-act="del">${t('a_del')}</button>`;
 else if(ns.length){const n=ns[0];h=`<h4>${ns.length>1?t('p_multi',ns.length):t('p_node')}</h4>`+(ns.length===1?fld('p_text',`<textarea data-p="text" rows="3">${esc(n.text)}</textarea>`):'')+fld('p_fill',inp('color','fill',n.fill))+fld('p_tcolor',inp('color','color',n.color))+fld('p_shape',sl('shape',n.shape,SH.map(s=>[s,t('s_'+s)])))+'<div class="two">'+fld('p_w',inp('number','w',Math.round(n.w),'min="40"'))+fld('p_h',inp('number','h',Math.round(n.h),'min="24"'))+'</div>'+fld('p_font',sl('font',n.font,FONTS))+fld('p_size',inp('number','size',n.size,'min="6" max="200"'))+fld('p_style',`<div class="seg"><button data-b="bold" class="${n.bold?'on':''}" title="${t('a_bold')}"><b>B</b></button><button data-b="italic" class="${n.italic?'on':''}" title="${t('a_italic')}"><i>I</i></button>`+['left','center','right'].map(a=>`<button data-a="${a}" class="${n.align===a?'on':''}" title="${t('p_align')}"><svg width="14" height="12" stroke="currentColor" fill="none">${AI[a]}</svg></button>`).join('')+'</div>')+fld('p_stroke',inp('color','stroke',n.stroke))+fld('p_sw',inp('number','sw',n.sw,'min="0" max="30"'))+fld('p_radius',inp('number','radius',n.radius,'min="0" max="200"'))+fld('p_op',inp('range','opacity',n.opacity,'min="0.1" max="1" step="0.05"'))+`<button class="btn" data-act="autofit">${t('a_autofit')}</button>`}
 else h=`<h4>${t('p_none')}</h4><p class="muted">${t('p_hint')}</p>`;
 $('#props').innerHTML=h;buildFbar()}
$('#props').addEventListener('input',e=>{const el=e.target,p=el.dataset.p;if(!p)return;applyProp(p,el.type==='checkbox'?el.checked:(el.type==='number'||el.type==='range')?el.valueAsNumber:el.value)});
$('#props').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.b){if(sel.l){const l=M.links.find(x=>x.id===sel.l);if(l){snapshot();l.bold=!l.bold;render();markDirty();buildPanel()}}else fmt(b.dataset.b)}else if(b.dataset.a){applyProp('align',b.dataset.a);buildPanel()}});
/* ---------- floating quick bar ---------- */
const lum=c=>{const m=/^#?([0-9a-f]{6})$/i.exec(c);if(!m)return 255;const v=parseInt(m[1],16);return .299*(v>>16)+.587*((v>>8)&255)+.114*(v&255)};
function buildFbar(){const f=$('#fbar'),ns=[...sel.n].map(byId).filter(Boolean),l=sel.l&&M.links.find(x=>x.id===sel.l);let h='';
 if(l)h=`<button data-lk="bold" title="${t('a_bold')}"><b>B</b></button><input type="color" data-p="color" value="${esc(l.color)}" title="${t('p_color')}"><button data-lk="text" title="${t('p_linkText')}">T</button><button data-lk="end" title="${t('p_end')}">→</button><button data-lk="dashed" title="${t('p_dashed')}">┅</button>`;
 else if(ns.length){const n=ns[0];h=`<button data-b="bold" title="${t('a_bold')}"><b>B</b></button><button data-b="italic" title="${t('a_italic')}"><i>I</i></button>`}
 f.innerHTML=h;f.dataset.has=h?'1':'';if(editingLink)f.hidden=true;else posFbar()}
function posFbar(){const f=$('#fbar');if(!f.dataset.has||editing||editingLink||!cur){f.hidden=true;return}let ax,ay,by;
 if(sel.l){const l=M.links.find(x=>x.id===sel.l),g=l&&geo(l);if(!g){f.hidden=true;return}ax=(g.p[0]+g.q[0])/2;ay=by=(g.p[1]+g.q[1])/2}
 else{const ns=[...sel.n].map(byId).filter(Boolean);if(!ns.length){f.hidden=true;return}const x0=Math.min(...ns.map(n=>n.x)),x1=Math.max(...ns.map(n=>n.x+n.w));ax=(x0+x1)/2;ay=Math.min(...ns.map(n=>n.y));by=Math.max(...ns.map(n=>n.y+n.h))}
 f.hidden=false;const v=M.view,r=SR();let y=ay*v.z+v.y-f.offsetHeight-12;if(y<4)y=by*v.z+v.y+12;f.style.left=Math.max(4,Math.min(r.width-f.offsetWidth-4,ax*v.z+v.x-f.offsetWidth/2))+'px';f.style.top=Math.max(4,y)+'px'}
function setFill(c){const ns=[...sel.n].map(byId).filter(Boolean);if(!ns.length)return;snapshot();ns.forEach(n=>{n.fill=c;n.color=lum(c)<140?'#ffffff':'#1f2937'});render();markDirty();buildPanel()}
$('#fbar').addEventListener('input',e=>{const p=e.target.dataset.p;if(p)applyProp(p,e.target.value)});
$('#fbar').addEventListener('change',e=>e.target.blur());
$('#fbar').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;b.blur();if(b.dataset.fill)setFill(b.dataset.fill);else if(b.dataset.b)fmt(b.dataset.b);else if(b.dataset.lk){const l=M.links.find(x=>x.id===sel.l);if(!l)return;snapshot();if(b.dataset.lk==='end')l.end=l.end==='arrow'?'none':'arrow';else if(b.dataset.lk==='text')startEditLink(l.id);else if(b.dataset.lk==='bold')l.bold=!l.bold;else l.dashed=!l.dashed;render();markDirty();buildPanel()}});
/* ---------- view ---------- */
function zoomAt(f,cx,cy){const r=SR(),v=M.view,nz=Math.min(4,Math.max(.1,v.z*f)),k=nz/v.z,px=cx-r.left,py=cy-r.top;v.x=px-(px-v.x)*k;v.y=py-(py-v.y)*k;v.z=nz;render();viewDirty()}
const zoomBy=f=>{const r=SR();zoomAt(f,r.left+r.width/2,r.top+r.height/2)};
function bbox(){if(!M.nodes.length)return null;let a=1e9,b=1e9,c=-1e9,d=-1e9;for(const n of M.nodes){a=Math.min(a,n.x);b=Math.min(b,n.y);c=Math.max(c,n.x+n.w);d=Math.max(d,n.y+n.h)}return{x:a,y:b,w:c-a,h:d-b}}
function fit(){if(!cur)return;const b=bbox(),r=SR();if(!b){M.view={x:r.width/2,y:r.height/2,z:1}}else{const z=Math.min(1.5,Math.max(.1,Math.min(r.width/(b.w+160),r.height/(b.h+160))));M.view={z,x:r.width/2-(b.x+b.w/2)*z,y:r.height/2-(b.y+b.h/2)*z}}render();viewDirty()}
function toggle(k){M.settings[k]=!M.settings[k];render();viewDirty()}
/* ---------- import / export ---------- */
const fname=ext=>(cur.name.replace(/[<>:"/\\|?*\x00-\x1f]/g,'_')||'mindly')+'.'+ext;
function dl(name,blob){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),2000)}
function svgStr(){const b=bbox(),p=40,bg='#ffffff',W=b.w+p*2,H=b.h+p*2;let s=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="${b.x-p} ${b.y-p} ${W} ${H}"><rect x="${b.x-p}" y="${b.y-p}" width="${W}" height="${H}" fill="${bg}"/>`;for(const l of M.links){const g=geo(l);if(g)s+=linkSVG(l,g,false,true)}for(const n of M.nodes)s+=nodeSVG(n,false);return s+'</svg>'}
function preview(){if(!need())return;if(!M.nodes.length)return toast(t('t_empty'),'err');const box=document.createElement('div');box.style.cssText='background:#fff;border:1px solid var(--border);border-radius:8px;padding:8px;overflow:auto;max-height:62vh;text-align:center';box.innerHTML=svgStr().replace('<svg ','<svg style="max-width:100%;height:auto;display:inline-block" ');
 modal(t('a_preview'),box,[{l:t('b_close')},{l:t('a_exportJson'),f:()=>{exportJson();return false}},{l:t('a_exportSvg'),f:()=>{exportSvg();return false}},{l:t('a_exportPng'),f:()=>{exportPng();return false}},{l:t('a_exportPdf'),c:'pri',f:()=>{exportPdf();return false}}],true)}
function pdfBlob(jpg,pxW,pxH,pw,ph){const enc=new TextEncoder(),parts=[],off=[];let len=0;const add=d=>{const u=typeof d==='string'?enc.encode(d):d;parts.push(u);len+=u.length};
 const obj=(n,body,stream)=>{off[n]=len;add(n+' 0 obj\n'+body+'\n');if(stream!==undefined){add('stream\n');add(stream);add('\nendstream\n')}add('endobj\n')};
 add('%PDF-1.4\n');
 obj(1,'<< /Type /Catalog /Pages 2 0 R >>');obj(2,'<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
 obj(3,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw.toFixed(2)} ${ph.toFixed(2)}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`);
 obj(4,`<< /Type /XObject /Subtype /Image /Width ${pxW} /Height ${pxH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpg.length} >>`,jpg);
 const cs=`q ${pw.toFixed(2)} 0 0 ${ph.toFixed(2)} 0 0 cm /Im0 Do Q`;obj(5,`<< /Length ${cs.length} >>`,cs);
 const xr=len;let xt='xref\n0 6\n0000000000 65535 f \n';for(let i=1;i<=5;i++)xt+=String(off[i]).padStart(10,'0')+' 00000 n \n';
 add(xt+`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xr}\n%%EOF`);return new Blob(parts,{type:'application/pdf'})}
function exportPdf(){if(!need())return;if(!M.nodes.length)return toast(t('t_empty'),'err');const b=bbox(),W=b.w+80,H=b.h+80,k=Math.min(2,8000/Math.max(W,H)),img=new Image();
 img.onload=()=>{const c=document.createElement('canvas');c.width=Math.round(W*k);c.height=Math.round(H*k);const g=c.getContext('2d');g.fillStyle='#ffffff';g.fillRect(0,0,c.width,c.height);g.drawImage(img,0,0,c.width,c.height);
  const jpg=Uint8Array.from(atob(c.toDataURL('image/jpeg',.95).split(',')[1]),ch=>ch.charCodeAt(0)),f=Math.min(.75,14400/Math.max(W,H));
  dl(fname('pdf'),pdfBlob(jpg,c.width,c.height,W*f,H*f));toast(t('t_exported'))};
 img.onerror=()=>toast(t('e_error'),'err');img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svgStr())}
function exportJson(){if(!need())return;dl(fname('json'),new Blob([JSON.stringify({format:'mindly',metadata:{name:cur.name,exported:new Date().toISOString()},project:proj()},null,1)],{type:'application/json'}));toast(t('t_exported'))}
function exportSvg(){if(!need())return;if(!M.nodes.length)return toast(t('t_empty'),'err');dl(fname('svg'),new Blob([svgStr()],{type:'image/svg+xml'}));toast(t('t_exported'))}
function exportPng(){if(!need())return;if(!M.nodes.length)return toast(t('t_empty'),'err');const b=bbox(),W=b.w+80,H=b.h+80,img=new Image();img.onload=()=>{const c=document.createElement('canvas');c.width=W*2;c.height=H*2;const x=c.getContext('2d');x.scale(2,2);x.drawImage(img,0,0,W,H);c.toBlob(bl=>{dl(fname('png'),bl);toast(t('t_exported'))})};img.onerror=()=>toast(t('e_error'),'err');img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svgStr())}
$('#file').addEventListener('change',async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;try{const j=JSON.parse(await f.text()),p=j.project||j;if(!p||!Array.isArray(p.nodes)||!Array.isArray(p.links))throw 0;const name=(j.metadata&&j.metadata.name)||f.name.replace(/\.json$/i,'')||t('untitled');const r=await api('POST','/projects',{name,project:p});await openProject(r.id);toast(t('t_imported'))}catch(x){toast(t('t_importErr'),'err')}});
/* ---------- actions ---------- */
const ACT={new:newProject,open:manager,projects:manager,save:()=>need()&&save(false),saveas:saveAs,close:closeProject,rename:()=>cur?renameProject(cur.id,cur.name):need(),import:()=>$('#file').click(),exportJson,exportSvg,exportPng,exportPdf,preview,
 undo,redo,copy,cut,paste,dup,del,selAll,desel,sibling,child,edit:()=>{const n=oneSel();n?startEdit(n.id):toast(t('t_nosel'),'err')},
 node:()=>{if(!need())return;const r=SR(),i=mouse.x>r.left&&mouse.x<r.right&&mouse.y>r.top&&mouse.y<r.bottom,[x,y]=i?toW(mouse.x,mouse.y):freeSpot(140,56);addNode(x,y)},
 root:()=>{if(!need())return;const o=titleOpts(),r=SR(),i=mouse.x>r.left&&mouse.x<r.right&&mouse.y>r.top&&mouse.y<r.bottom,[x,y]=i?toW(mouse.x,mouse.y):freeSpot(o.w,o.h);addNode(x,y,o)},
 link:()=>{if(!need())return;tool=tool==='link'?'select':'link';linkFrom=null;hint();render()},select:()=>{tool='select';linkFrom=null;hint();render()},
 connect:()=>{},props:()=>{const p=$('#props');p.hidden=!p.hidden;localStorage.mPanel=p.hidden?'0':'1';render()},minimap:()=>setMmVis(!mmVisible()),zoomIn:()=>zoomBy(1.2),zoomOut:()=>zoomBy(1/1.2),zoomReset:()=>cur&&zoomBy(1/M.view.z),fit,fitView:fit,autofit:()=>{const ns=[...sel.n].map(byId).filter(Boolean);if(!ns.length)return toast(t('t_nosel'),'err');snapshot();ns.forEach(n=>{n.manual=false;fitNode(n)});render();markDirty();buildPanel()},layout:toggleLayout,childLeft:()=>child(true),grid:()=>toggle('grid'),snap:()=>toggle('snap'),
 full:()=>document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen(),
 theme:()=>{theme=theme==='dark'?'light':'dark';localStorage.mTheme=theme;document.body.dataset.theme=theme;buildUI()},
 bold:()=>fmt('bold'),italic:()=>fmt('italic'),center:fmtCenter,shortcuts:showShortcuts,shortcuts2:showShortcuts,
 about:()=>modal(t('a_about'),`<p><b>Mindly</b></p><p>${t('ab_text')}</p>`,[{l:t('b_close'),c:'pri'}])};
document.addEventListener('click',e=>{const b=e.target.closest('[data-act],[data-shape],[data-m]');if(!b)return;b.blur();
 if(b.dataset.act)ACT[b.dataset.act]();
 else if(b.dataset.shape){const o=b.dataset.shape==='circle'?{shape:'circle',w:100,h:100}:{shape:b.dataset.shape},[x,y]=freeSpot(o.w||140,o.h||56);addNode(x,y,o)}
 else{const m=MENUS[b.dataset.m],r=b.getBoundingClientRect();popup(m[1].map(a=>a==='-'?'-':a==='export'?{l:t('a_export'),sub:['exportPdf','exportPng','exportSvg','exportJson'].map(x=>({l:t('a_'+x),sc:shortcutOf(x),f:ACT[x]}))}:{l:t('a_'+a),sc:shortcutOf(a),f:ACT[a],chk:a==='grid'?M.settings.grid:a==='snap'?M.settings.snap:a==='layout'?M.settings.layout==='tidy':a==='minimap'?mmVisible():false}),r.left,r.bottom)}});
document.addEventListener('pointerdown',e=>{if(!e.target.closest('#ctx'))hidePop()});
/* ---------- canvas interaction ---------- */
function subtree(ids){const out=new Set(ids),st=[...ids];while(st.length){const i=st.pop();for(const l of M.links)if(l.from===i&&!out.has(l.to)&&byId(l.to)){out.add(l.to);st.push(l.to)}}return out}
const GX=70,GY=18;
function layoutAll(){const T=new Map(),Hm=new Map(),seen=new Set();
 const kids=n=>{const u=new Set(),a=[];for(const l of M.links)if(l.from===n.id&&!u.has(l.to)){u.add(l.to);const c=byId(l.to);if(c)a.push(c)}return a.sort((p,q)=>p.y+p.h/2-q.y-q.h/2)};
 const build=n=>{const k=kids(n).filter(c=>!seen.has(c.id));k.forEach(c=>seen.add(c.id));T.set(n.id,k);k.forEach(build)};
 const hg=n=>{if(Hm.has(n.id))return Hm.get(n.id);const h=Math.max(n.h,tot(T.get(n.id)));Hm.set(n.id,h);return h};
 const tot=k=>k.length?k.reduce((a,c)=>a+hg(c),0)+GY*(k.length-1):0;
 const place=(n,dir,top)=>{const k=T.get(n.id),h=hg(n);n.y=top+(h-n.h)/2;let y=top+(h-tot(k))/2;for(const c of k){c.x=dir==='r'?n.x+n.w+GX:n.x-GX-c.w;place(c,dir,y);y+=hg(c)+GY}};
 const hasIn=new Set(M.links.filter(l=>byId(l.from)).map(l=>l.to)),roots=M.nodes.filter(n=>!hasIn.has(n.id));
 roots.forEach(r=>seen.add(r.id));roots.forEach(build);
 for(const r of roots){const k=T.get(r.id);if(!k.length)continue;const cx=r.x+r.w/2;k.forEach(c=>{if(!c.side)c.side=c.x+c.w/2<cx?'l':'r'});
  for(const dir of['r','l']){const g=k.filter(c=>c.side===dir),H=tot(g);let y=r.y+r.h/2-H/2;for(const c of g){c.x=dir==='r'?r.x+r.w+GX:r.x-GX-c.w;place(c,dir,y);y+=hg(c)+GY}}}
}
function toggleLayout(){if(!need())return;M.settings.layout=M.settings.layout==='tidy'?'free':'tidy';if(M.settings.layout==='tidy')markDirty();else{render();viewDirty()}toast(t(M.settings.layout==='tidy'?'t_layoutTidy':'t_layoutFree'));refreshTB()}
const titleOpts=()=>({text:t('central'),w:170,h:70,size:20,bold:true,fill:'#1f2937',color:'#ffffff',stroke:'#111827'});
function freeSpot(w,h,c){c=c||centerW();const ok=(x,y)=>!M.nodes.some(n=>x-w/2<n.x+n.w+20&&x+w/2>n.x-20&&y-h/2<n.y+n.h+20&&y+h/2>n.y-20),L=[];for(let i=-4;i<=4;i++)for(let j=-4;j<=4;j++)L.push([i,j]);L.sort((a,b)=>Math.hypot(a[0],a[1])-Math.hypot(b[0],b[1])||b[1]-a[1]);for(const[i,j]of L){const x=c[0]+i*(w+40),y=c[1]+j*(h+40);if(ok(x,y))return[x,y]}return c}
function hitNode(x,y,ex){const m=28/M.view.z;let best=null,bd=1e9;for(const n of M.nodes){if(n.id===ex)continue;const dx=Math.max(n.x-x,0,x-n.x-n.w),dy=Math.max(n.y-y,0,y-n.y-n.h),d=Math.hypot(dx,dy);if(d<=m&&d<bd){bd=d;best=n}}return best}
function linkClick(id){if(!linkFrom){linkFrom=id;sel={n:new Set([id]),l:null};hint();render();return}if(id===linkFrom)return;let l=M.links.find(x=>x.from===linkFrom&&x.to===id);if(!l){snapshot();l=mkl({from:linkFrom,to:id,end:'none'});M.links.push(l);markDirty()}linkFrom=null;tool='select';hint();setSel([],l.id)}
svg.addEventListener('pointerdown',e=>{hidePop();if(e.button===2||!cur)return;if(document.activeElement!==document.body)document.activeElement.blur();if(editing)commitEdit();
 const[wx,wy]=toW(e.clientX,e.clientY);
 if(e.button===1||space){drag={t:'pan',sx:e.clientX,sy:e.clientY,vx:M.view.x,vy:M.view.y};svg.setPointerCapture(e.pointerId);return}
 const h=e.target.dataset.h,ne=e.target.closest('[data-n]'),le=e.target.closest('[data-l]'),mod=e.shiftKey||e.ctrlKey||e.metaKey;
 if(e.target.dataset.c){const n=byId([...sel.n][0]);drag={t:'cn',id:n.id};conn={id:n.id,x:wx,y:wy}}
 else if(h){const n=byId([...sel.n][0]);drag={t:'rs',h,wx,wy,o:{x:n.x,y:n.y,w:n.w,h:n.h},id:n.id,moved:false}}
 else if(ne){const id=ne.dataset.n;if(tool==='link'){linkClick(id);return}
  if(mod){sel.l=null;sel.n.has(id)?sel.n.delete(id):sel.n.add(id);render();buildPanel();return}
  if(!sel.n.has(id))setSel([id]);
  drag={t:'mv',id,ex:subtree(sel.n),sx:wx,sy:wy,o:new Map([...(e.altKey?sel.n:subtree(sel.n))].map(i=>{const n=byId(i);return[i,[n.x,n.y]]})),moved:false}}
 else if(le&&tool!=='link')setSel([],le.dataset.l);
 else{if(!mod&&(sel.n.size||sel.l))setSel([]);if(mod){band={x0:wx,y0:wy,x1:wx,y1:wy,base:new Set(sel.n)};drag={t:'band'}}else drag={t:'pan',sx:e.clientX,sy:e.clientY,vx:M.view.x,vy:M.view.y}}
 svg.setPointerCapture(e.pointerId)});
svg.addEventListener('pointermove',e=>{if(!drag)return;const z=M.view.z,[wx,wy]=toW(e.clientX,e.clientY);
 if(drag.t==='pan'){M.view.x=drag.vx+e.clientX-drag.sx;M.view.y=drag.vy+e.clientY-drag.sy;render()}
 else if(drag.t==='mv'){const dx=wx-drag.sx,dy=wy-drag.sy;if(!drag.moved){if(Math.hypot(dx,dy)*z<3)return;snapshot();drag.moved=true}const m0=drag.o.get(drag.id),ddx=sn(m0[0]+dx)-m0[0],ddy=sn(m0[1]+dy)-m0[1];if(!drag.fl)drag.fl=subtree([drag.id]);const dn=byId(drag.id),pl=M.links.find(x=>x.to===drag.id),pn=pl&&byId(pl.from),ocx=m0[0]+dn.w/2,ncx=ocx+ddx,fp=!!pn&&!drag.o.has(pn.id)&&(ocx-(pn.x+pn.w/2))*(ncx-(pn.x+pn.w/2))<0;for(const[id,[x,y]]of drag.o){const n=byId(id);n.x=(fp&&id!==drag.id&&drag.fl.has(id))?sn(ncx-(x+n.w/2-ocx)-n.w/2):x+ddx;n.y=y+ddy}const o2=[...M.nodes].reverse().find(n=>!drag.ex.has(n.id)&&wx>=n.x&&wx<=n.x+n.w&&wy>=n.y&&wy<=n.y+n.h);dropT=o2?o2.id:null;render()}
 else if(drag.t==='rs'){const dx=wx-drag.wx,dy=wy-drag.wy,o=drag.o,n=byId(drag.id);if(!drag.moved){snapshot();drag.moved=true}let x=o.x,y=o.y,w=o.w,h=o.h;
  if(drag.h.includes('e'))w=Math.max(40,sn(o.w+dx));if(drag.h.includes('w')){w=Math.max(40,sn(o.w-dx));x=o.x+o.w-w}
  if(drag.h.includes('s'))h=Math.max(24,sn(o.h+dy));if(drag.h.includes('n')){h=Math.max(24,sn(o.h-dy));y=o.y+o.h-h}
  if(e.shiftKey){const hd=drag.h,mn=Math.max(40/o.w,24/o.h);let k=hd.length===2?Math.max(w/o.w,h/o.h):(hd==='e'||hd==='w')?w/o.w:h/o.h;k=Math.max(mn,k);w=o.w*k;h=o.h*k;
   if(hd.length===2){x=hd.includes('w')?o.x+o.w-w:o.x;y=hd.includes('n')?o.y+o.h-h:o.y}
   else if(hd==='e'||hd==='w'){x=hd==='w'?o.x+o.w-w:o.x;y=o.y+(o.h-h)/2}
   else{y=hd==='n'?o.y+o.h-h:o.y;x=o.x+(o.w-w)/2}}
  Object.assign(n,{x,y,w,h,manual:true});render()}
 else if(drag.t==='cn'){const o=hitNode(wx,wy,drag.id);conn={id:drag.id,x:wx,y:wy,hover:o?o.id:null};render()}
 else if(drag.t==='band'){band.x1=wx;band.y1=wy;const x=Math.min(band.x0,wx),y=Math.min(band.y0,wy),w=Math.abs(wx-band.x0),h=Math.abs(wy-band.y0);sel.n=new Set([...band.base,...M.nodes.filter(n=>n.x<x+w&&n.x+n.w>x&&n.y<y+h&&n.y+n.h>y).map(n=>n.id)]);render()}});
const endDrag=e=>{if(!drag)return;const d=drag,dt=dropT;drag=null;band=null;dropT=null;if(d.t==='cn'){conn=null;const o=e&&e.clientX!=null?hitNode(...toW(e.clientX,e.clientY),d.id):null;if(o){let l=M.links.find(x=>x.from===d.id&&x.to===o.id);if(!l){snapshot();l=mkl({from:d.id,to:o.id,end:'none'});M.links.push(l);markDirty()}setSel([],l.id);return}}if(d.t==='mv'&&d.moved&&dt&&byId(dt)&&!d.ex.has(dt)&&!M.links.some(x=>x.from===dt&&x.to===d.id)){const old=M.links.find(x=>x.to===d.id);M.links=M.links.filter(x=>x.to!==d.id);M.links.push(old?{...old,id:uid(),from:dt}:mkl({from:dt,to:d.id}));const n=byId(d.id),tn=byId(dt);if(!M.links.some(x=>x.to===dt))n.side=n.x+n.w/2<tn.x+tn.w/2?'l':'r';else delete n.side}
 if(d.t==='mv'&&d.moved){const n=byId(d.id),l=M.links.find(x=>x.to===d.id),p=l&&byId(l.from);if(n&&p&&!M.links.some(x=>x.to===p.id))n.side=n.x+n.w/2<p.x+p.w/2?'l':'r'}if(d.moved)markDirty();if(d.t==='pan')viewDirty();render();buildPanel();if(d.t==='mv'&&!d.moved&&byId(d.id)){const now=Date.now();if(lastClk.id===d.id&&now-lastClk.t<450){lastClk={id:'',t:0};startEdit(d.id)}else lastClk={id:d.id,t:now}}};
svg.addEventListener('pointerup',endDrag);svg.addEventListener('pointercancel',endDrag);
svg.addEventListener('wheel',e=>{e.preventDefault();if(!cur)return;if(e.ctrlKey||e.metaKey)zoomAt(Math.exp(-e.deltaY*.0015),e.clientX,e.clientY);else{const v=M.view;if(e.shiftKey&&!e.deltaX)v.x-=e.deltaY;else{v.x-=e.deltaX;v.y-=e.deltaY}render();viewDirty()}},{passive:false});
svg.addEventListener('dblclick',e=>{if(!cur||space)return;const el=document.elementFromPoint(e.clientX,e.clientY)||e.target,ne=el.closest('[data-n]'),le=el.closest('[data-l]');if(ne)return startEdit(ne.dataset.n);if(le)return startEditLink(le.dataset.l);if(el.dataset.h)return;const[x,y]=toW(e.clientX,e.clientY);addNode(x,y)});
const rc={timer:null,x:0,y:0};
svg.addEventListener('contextmenu',e=>{e.preventDefault();if(!cur)return;const ne=e.target.closest('[data-n]'),[wx,wy]=toW(e.clientX,e.clientY);let items;
 if(ne){const id=ne.dataset.n;if(!sel.n.has(id))setSel([id]);items=[['edit'],['child'],['sibling'],['dup'],['copy'],['del'],['connect',()=>{tool='link';linkFrom=id;hint();render()}],['props',()=>{$('#props').hidden=false;localStorage.mPanel='1';render()}]]}
 else items=[['node',()=>addNode(wx,wy)],['paste'],['selAll'],'-',['zoomIn'],['zoomOut'],['fit'],['grid']];
 const cx=e.clientX,cy=e.clientY,show=()=>popup(items.map(i=>i==='-'?'-':{l:t('a_'+i[0]),sc:shortcutOf(i[0]),f:i[1]||ACT[i[0]],chk:i[0]==='grid'&&M.settings.grid}),cx,cy);
 if(ne)return show();
 if(rc.timer&&Math.hypot(cx-rc.x,cy-rc.y)<12){clearTimeout(rc.timer);rc.timer=null;hidePop();addNode(wx,wy,titleOpts());return}
 rc.x=cx;rc.y=cy;rc.timer=setTimeout(()=>{rc.timer=null;show()},320)});
addEventListener('mousemove',e=>mouse={x:e.clientX,y:e.clientY});
addEventListener('resize',render);
addEventListener('keydown',e=>{const tg=e.target,typing=/^(INPUT|TEXTAREA|SELECT)$/.test(tg.tagName)||tg.isContentEditable,c=combo(e);
 if(!$('#modal').hidden){if(c==='Esc')closeModal();return}
 if(c==='Ctrl+S'){e.preventDefault();ACT.save();return}
 if(typing&&!['Ctrl+Shift+S','Ctrl+O','Ctrl+N','F1'].includes(c))return;
 if(c==='Space'){e.preventDefault();if(!space){space=true;svg.classList.add('pan')}return}
 if(e.altKey)return;
 const s=SC.find(x=>x[1]===c&&x[2]);if(s){e.preventDefault();ACT[s[2]]()}});
addEventListener('keyup',e=>{if(e.key===' '){space=false;svg.classList.remove('pan')}});
/* ---------- init ---------- */
(async()=>{$('#props').hidden=localStorage.mPanel!=='1';document.body.dataset.theme=theme;buildUI();buildPanel();let list=[];try{list=(await api('GET','/projects')).projects}catch(e){err(e,'t_loadErr')}
 manager()})();
