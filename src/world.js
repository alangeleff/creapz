// cReapZ overworld mode — driven by engine.js (WORLDMODE.enter/frame/pdown/pmove/pup/escape)
window.WORLDMODE=(function(){
const VW=1672,VH=941,ZOOM=1.45,SPEED=170,PAN=520;
// soon: roamable but not yet playable; locked: travel-blocked (castle lore)
const WORLDS=[
 {id:'cem',    x:227,y:640, name:'cReapY Cemetery',  col:'#a98aff', play:true},
 {id:'witch',  x:425,y:390, name:'Witchwood',        col:'#3ddc5a', soon:true},
 {id:'crypt',  x:552,y:736, name:'Crypt Depths',     col:'#e0a93c', soon:true},
 {id:'harbor', x:839,y:762, name:'Drowned Harbor',   col:'#41c8ff', soon:true},
 {id:'spire',  x:745,y:165, name:'Bell Spire',       col:'#8f86b8', soon:true},
 {id:'plains', x:832,y:394, name:'Ethereal Plains',  col:'#7df3e1', soon:true},
 {id:'charnel',x:1144,y:594,name:'Charnel Peak',     col:'#ff5c4a', soon:true},
 {id:'rift',   x:1124,y:231,name:'The Rift',         col:'#d36cff', soon:true},
 {id:'castle', x:1478,y:451,name:'Blood Moon Castle',col:'#e0506a', locked:true},
];
const FORKS=[{id:'fork',x:411,y:553},{id:'dockw',x:758,y:728},{id:'dock',x:869,y:687},
 {id:'meadow',x:909,y:409},{id:'meadw',x:832,y:423},{id:'wjun',x:414,y:420}];
const ALL={}; for(const n of [...WORLDS,...FORKS]) ALL[n.id]=n;
const EDGES=[['cem','fork'],['fork','wjun'],['wjun','witch'],['fork','crypt'],
 ['crypt','dockw'],['dockw','harbor'],['dockw','dock'],['dock','charnel'],
 ['wjun','meadw'],['wjun','spire'],['meadw','plains'],['meadw','meadow'],['spire','meadow'],['meadow','rift'],
 ['dock','meadow'],['charnel','castle'],['rift','castle']];
const EDGEPATHS={"charnel_castle": [[1144, 595], [1168, 589], [1189, 604], [1210, 619], [1234, 622], [1258, 598], [1282, 574], [1306, 553], [1330, 538], [1354, 526], [1378, 511], [1402, 496], [1426, 481], [1450, 463], [1459, 442], [1477, 451]], "rift_castle": [[1123, 232], [1147, 253], [1171, 274], [1195, 295], [1219, 307], [1243, 319], [1267, 331], [1291, 343], [1315, 361], [1339, 373], [1363, 385], [1387, 400], [1411, 418], [1435, 439], [1459, 442], [1477, 451]], "cem_fork": [[227, 640], [229, 643], [238, 646], [250, 637], [262, 634], [274, 634], [286, 622], [298, 610], [307, 601], [319, 595], [331, 589], [343, 583], [355, 580], [367, 574], [379, 568], [391, 562], [403, 556], [411, 553]], "fork_crypt": [[411, 553], [415, 556], [427, 568], [433, 580], [439, 592], [451, 604], [463, 616], [475, 628], [487, 640], [499, 652], [511, 664], [523, 676], [535, 685], [541, 697], [541, 709], [553, 718], [565, 727], [562, 739], [552, 736]], "crypt_dockw": [[552, 736], [556, 739], [568, 745], [565, 757], [562, 769], [574, 772], [586, 772], [598, 775], [610, 778], [622, 775], [634, 772], [646, 769], [658, 763], [670, 760], [682, 757], [694, 754], [706, 748], [718, 745], [730, 739], [742, 733], [754, 727], [758, 728]], "dockw_harbor": [[758, 728], [760, 727], [772, 739], [784, 745], [796, 745], [808, 751], [820, 760], [832, 766], [839, 762]], "dockw_dock": [[758, 728], [760, 724], [772, 712], [784, 712], [796, 706], [808, 700], [820, 694], [832, 694], [844, 694], [856, 694], [869, 687]], "dock_charnel": [[869, 687], [871, 688], [883, 688], [895, 688], [907, 688], [919, 685], [931, 685], [943, 685], [955, 685], [967, 685], [979, 685], [991, 685], [1003, 685], [1015, 685], [1027, 685], [1039, 682], [1051, 679], [1063, 673], [1075, 664], [1087, 658], [1099, 652], [1111, 643], [1123, 634], [1135, 622], [1147, 613], [1147, 601], [1144, 594]], "spire_meadow": [[745, 165], [745, 169], [745, 181], [757, 193], [769, 205], [775, 217], [787, 229], [799, 241], [811, 253], [823, 265], [832, 277], [835, 289], [838, 301], [850, 313], [862, 325], [874, 337], [880, 349], [886, 361], [892, 373], [895, 385], [904, 397], [909, 409]], "meadow_rift": [[909, 409], [913, 406], [916, 394], [928, 385], [940, 382], [952, 379], [964, 382], [976, 376], [988, 367], [1000, 364], [1012, 361], [1024, 352], [1036, 346], [1048, 334], [1060, 322], [1072, 310], [1084, 301], [1096, 295], [1105, 289], [1105, 277], [1114, 265], [1120, 253], [1123, 241], [1124, 231]], "dock_meadow": [[869, 687], [868, 685], [868, 673], [868, 661], [868, 649], [871, 637], [871, 625], [871, 613], [880, 601], [889, 589], [895, 577], [901, 565], [913, 553], [913, 541], [922, 529], [922, 517], [922, 505], [922, 493], [922, 481], [922, 469], [922, 457], [919, 445], [916, 433], [910, 421], [909, 409]], "meadw_plains": [[832, 423], [835, 424], [844, 418], [841, 409], [832, 403], [832, 394]], "meadw_meadow": [[832, 423], [835, 424], [847, 427], [859, 430], [871, 430], [883, 427], [895, 418], [907, 409], [909, 409]], "fork_wjun": [[411, 553], [412, 550], [412, 538], [415, 526], [418, 514], [421, 502], [430, 490], [439, 478], [442, 466], [448, 454], [448, 442], [445, 430], [433, 421], [421, 421], [414, 420]], "wjun_witch": [[414, 420], [418, 421], [430, 418], [433, 406], [427, 394], [425, 390]], "wjun_spire": [[414, 420], [418, 421], [430, 418], [442, 421], [454, 424], [466, 433], [478, 427], [490, 421], [502, 412], [514, 400], [526, 388], [529, 376], [535, 364], [544, 352], [556, 340], [568, 328], [580, 316], [592, 304], [604, 292], [616, 280], [628, 268], [640, 262], [652, 253], [664, 241], [676, 232], [688, 229], [700, 229], [712, 226], [724, 217], [736, 205], [748, 199], [751, 187], [748, 175], [745, 165]], "wjun_meadw": [[414, 420], [418, 421], [430, 418], [442, 421], [454, 424], [466, 433], [478, 433], [490, 433], [502, 424], [514, 412], [526, 400], [538, 397], [550, 394], [562, 394], [574, 394], [586, 394], [598, 394], [610, 394], [622, 394], [634, 394], [646, 394], [658, 394], [670, 397], [682, 400], [694, 400], [706, 400], [718, 400], [730, 400], [742, 409], [754, 409], [766, 409], [778, 412], [790, 415], [802, 418], [814, 421], [826, 421], [832, 423]]};
const EDGEDOTS={"charnel_castle": [[1144, 595], [1168, 589], [1189, 604], [1210, 619], [1234, 622], [1258, 598], [1282, 574], [1306, 553], [1330, 538], [1354, 526], [1378, 511], [1402, 496], [1426, 481], [1450, 463], [1459, 442]], "rift_castle": [[1123, 232], [1147, 253], [1171, 274], [1195, 295], [1219, 307], [1243, 319], [1267, 331], [1291, 343], [1315, 361], [1339, 373], [1363, 385], [1387, 400], [1411, 418], [1435, 439]], "cem_fork": [[227, 640], [250, 637], [274, 634], [286, 622], [298, 610], [319, 595], [331, 589], [343, 583], [367, 574], [379, 568], [391, 562], [403, 556]], "fork_crypt": [[427, 568], [433, 580], [439, 592], [451, 604], [463, 616], [475, 628], [487, 640], [499, 652], [511, 664], [523, 676], [535, 685], [541, 697], [553, 718], [565, 727]], "crypt_dockw": [[552, 736], [568, 745], [562, 769], [586, 772], [610, 778], [634, 772], [658, 763], [682, 757], [706, 748], [730, 739], [742, 733], [754, 727]], "dockw_harbor": [[772, 739], [784, 745], [808, 751], [820, 760], [832, 766]], "dockw_dock": [[772, 712], [796, 706], [808, 700], [820, 694], [844, 694]], "dock_charnel": [[869, 687], [883, 688], [907, 688], [931, 685], [955, 685], [979, 685], [1003, 685], [1027, 685], [1051, 679], [1063, 673], [1075, 664], [1087, 658], [1099, 652], [1111, 643], [1123, 634], [1135, 622], [1147, 613]], "spire_meadow": [[745, 165], [745, 181], [757, 193], [769, 205], [775, 217], [787, 229], [799, 241], [811, 253], [823, 265], [832, 277], [838, 301], [850, 313], [862, 325], [874, 337], [880, 349], [886, 361], [892, 373], [904, 397]], "meadow_rift": [[928, 385], [952, 379], [976, 376], [988, 367], [1012, 361], [1024, 352], [1036, 346], [1048, 334], [1060, 322], [1072, 310], [1084, 301], [1096, 295], [1105, 277], [1114, 265], [1120, 253]], "dock_meadow": [[868, 673], [868, 649], [871, 625], [880, 601], [889, 589], [895, 577], [901, 565], [913, 553], [922, 529], [922, 505], [922, 481], [922, 457], [916, 433], [910, 421]], "meadw_plains": [[832, 423], [841, 409]], "meadw_meadow": [[847, 427], [871, 430], [895, 418]], "fork_wjun": [[412, 538], [418, 514], [430, 490], [439, 478], [448, 454], [445, 430], [433, 421]], "wjun_witch": [[414, 420], [433, 406], [427, 394]], "wjun_spire": [[466, 433], [478, 427], [490, 421], [502, 412], [514, 400], [526, 388], [535, 364], [544, 352], [556, 340], [568, 328], [580, 316], [592, 304], [604, 292], [616, 280], [628, 268], [640, 262], [652, 253], [664, 241], [676, 232], [700, 229], [724, 217], [736, 205]], "wjun_meadw": [[538, 397], [562, 394], [586, 394], [610, 394], [634, 394], [658, 394], [682, 400], [706, 400], [730, 400], [742, 409], [766, 409], [790, 415], [814, 421]]};
const MAPIMG=new Image(); let MAPok=false;
MAPIMG.onload=()=>{ MAPok=true; }; MAPIMG.src='./assets/owmap2.png';
const HEROES={
  bat:   {src:'./assets/owbat3.png',  img:null, mirrorFB:true},
  reaper:{src:'./assets/owreap2.png', img:null, mirrorFB:false},
};
for(const k in HEROES){ const im=new Image(); im.onload=()=>{ HEROES[k].img=im; }; im.src=HEROES[k].src; }

let ctx,W,H,hooks,keys;
let camX=227,camY=640,panHold=false,drag=null;
let hero='cem',hx=227,hy=640,route=[],ptQ=[],walking=false,panel=null,toast=null,toastT=0,lastDir={r:1,m:1};
let focus='cem',camFollow=false,chipSel=0;

function vs(){ return Math.max(W/VW,H/VH)*ZOOM; }
function clampCam(){
  const s=vs(), hw=W/(2*s), hh=H/(2*s);
  camX=Math.max(hw,Math.min(VW-hw,camX));
  camY=Math.max(hh,Math.min(VH-hh,camY));
}
function vx(x){ return (x-camX)*vs()+W/2; }
function vy(y){ return (y-camY)*vs()+H/2; }
function edgePts(a,b){
  const k1=a+'_'+b, k2=b+'_'+a;
  if(EDGEPATHS[k1]) return EDGEPATHS[k1];
  if(EDGEPATHS[k2]) return EDGEPATHS[k2].slice().reverse();
  return [[ALL[a].x,ALL[a].y],[ALL[b].x,ALL[b].y]];
}
function nbrs(id){ const o=[]; for(const [a,b] of EDGES){ if(a===id)o.push(b); if(b===id)o.push(a);} return o; }
const _elen={};
function edgeLen(a,b){
  const k=a<b?a+'_'+b:b+'_'+a;
  if(_elen[k]===undefined){ const pts=edgePts(a,b); let L=0;
    for(let i=1;i<pts.length;i++) L+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);
    _elen[k]=L; }
  return _elen[k];
}
function pathTo(from,to){ // Dijkstra over real road lengths
  const blocked=id=>ALL[id].locked && !(hooks&&hooks.dev);
  if(blocked(to)) return null;
  const dist={}, par={}, open=new Set([from]), done=new Set();
  dist[from]=0;
  while(open.size){
    let c=null,best=Infinity;
    for(const k of open) if(dist[k]<best){ best=dist[k]; c=k; }
    open.delete(c); done.add(c);
    if(c===to) break;
    for(const nb of nbrs(c)){
      if(blocked(nb)||done.has(nb)) continue;
      const nd=dist[c]+edgeLen(c,nb);
      if(dist[nb]===undefined||nd<dist[nb]){ dist[nb]=nd; par[nb]=c; open.add(nb); }
    }
  }
  if(dist[to]===undefined) return null;
  const p=[to]; let k=to; while(k!==from){ k=par[k]; p.unshift(k); } return p;
}
function startEdge(){ if(route.length) ptQ=edgePts(hero,route[0]).slice(1).map(p=>({x:p[0],y:p[1]})); }
function panelRect(){ const w=Math.min(W-24,420), h=128; return {x:W/2-w/2,y:H-h-14,w,h}; }
function chipRect(P,i){ const cw=(P.w-56)/3; return {x:P.x+16+i*(cw+12), y:P.y+58, w:cw, h:52}; }
function menuBtnRect(){ return {x:12,y:12,w:84,h:34}; }
function skinsBtnRect(){ return {x:104,y:12,w:84,h:34}; }
function say(msg,t){ toast=msg; toastT=t||2.4; }

function enter(o){
  ctx=o.ctx; W=o.W; H=o.H; hooks=o; keys=o.keys;
  hero=(ALL[o.heroAt]&&!ALL[o.heroAt].locked)?o.heroAt:'cem';
  hx=ALL[hero].x; hy=ALL[hero].y;
  camX=hx; camY=hy;
  route=[]; ptQ=[]; walking=false; panel=null; toast=null; toastT=0; panHold=false; drag=null;
  focus=hero; camFollow=false; chipSel=0;
}

function tap(pt){
  const s=vs();
  const M=menuBtnRect();
  if(pt.x>M.x&&pt.x<M.x+M.w&&pt.y>M.y&&pt.y<M.y+M.h){ hooks.exit(); return; }
  const SK=skinsBtnRect();
  if(hooks.openSkins&&pt.x>SK.x&&pt.x<SK.x+SK.w&&pt.y>SK.y&&pt.y<SK.y+SK.h){ hooks.openSkins(); return; }
  if(panel){
    const P=panelRect();
    if(pt.x>P.x&&pt.x<P.x+P.w&&pt.y>P.y&&pt.y<P.y+P.h){
      const wld=ALL[panel], acts=hooks.getActs(panel);
      for(let i=0;i<3;i++){
        const c=chipRect(P,i);
        if(pt.x>c.x&&pt.x<c.x+c.w&&pt.y>c.y&&pt.y<c.y+c.h){
          const st=acts[i];
          if(st==='soon') say('Act '+['I','II','III'][i]+' is still being carved…');
          else if(st==='locked') say('Clear the previous act first');
          else { hooks.playSfx('sfx_msel'); panel=null; hooks.launch(wld.id,i); }
          return;
        }
      }
      return;
    }
    panel=null; return;
  }
  for(const n of WORLDS){
    const dx=pt.x-vx(n.x), dy=pt.y-vy(n.y), r=(26*s+14);
    if(dx*dx+dy*dy<r*r){ camFollow=false; focus=n.id; selectNode(n); return; }
  }
}
function selectNode(n){
  if(n.locked && !(hooks&&hooks.dev)){ say('Sealed by the usurper’s power…',2.2); return; }
  if(hero===n.id&&!walking){
    const zo=hooks.zoneOpen?hooks.zoneOpen(n.id):!!n.play;
    if(!zo){ say(n.name.toUpperCase()+' — coming soon…',2.4); }
    else { panel=n.id; chipSel=0; hooks.playSfx('sfx_mtog'); }
    return;
  }
  panHold=false;
  if(walking&&route.length){ const anchor=route[0]; const p=pathTo(anchor,n.id); if(p) route=p; else say('No open path there',2); }
  else { const p=pathTo(hero,n.id); if(p){ route=p.slice(1); walking=true; panel=null; startEdge(); } }
}
function nodeInDir(dx,dy){ const cur=ALL[focus]||ALL[hero]; let best=null,bs=-1e9;
  for(const n of WORLDS){ if(n.id===focus) continue; const ax=n.x-cur.x, ay=n.y-cur.y, d=Math.hypot(ax,ay); if(d<1)continue;
    const al=(ax*dx+ay*dy)/d; if(al<0.4) continue; const sc=al - d/5000; if(sc>bs){ bs=sc; best=n.id; } }
  return best; }
function key(code){
  if(panel){
    const acts=hooks.getActs(panel);
    if(code==='ArrowLeft'){ chipSel=(chipSel+2)%3; hooks.playSfx('sfx_mtog'); }
    else if(code==='ArrowRight'){ chipSel=(chipSel+1)%3; hooks.playSfx('sfx_mtog'); }
    else if(code==='Enter'||code==='Space'){ const st=acts[chipSel];
      if(st==='soon') say('Act '+['I','II','III'][chipSel]+' is still being carved…');
      else if(st==='locked') say('Clear the previous act first');
      else { hooks.playSfx('sfx_msel'); const w=panel; panel=null; hooks.launch(w,chipSel); } }
    return;
  }
  if(!focus) focus=hero;
  const D={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[code];
  if(D){ camFollow=true; const nx=nodeInDir(D[0],D[1]); if(nx){ focus=nx; hooks.playSfx('sfx_mtog'); } return; }
  if(code==='Enter'||code==='Space'){ camFollow=true; selectNode(ALL[focus]||ALL[hero]); }
}
function pdown(pt){ drag={x:pt.x,y:pt.y,moved:false}; }
function pmove(pt){
  if(!drag) return;
  const dx=pt.x-drag.x, dy=pt.y-drag.y;
  if(!drag.moved && dx*dx+dy*dy>36) drag.moved=true;
  if(drag.moved){
    const s=vs();
    camX-=dx/s; camY-=dy/s; clampCam();
    drag.x=pt.x; drag.y=pt.y; panHold=true; camFollow=false;
  }
}
function pup(pt){
  if(!drag) return;
  const wasTap=!drag.moved; drag=null;
  if(wasTap) tap(pt);
}
function escape(){ if(panel){ panel=null; return true; } return false; }

function frame(dt,t){
  ctx.clearRect(0,0,W,H);
  const s=vs();
  // keyboard pan
  if(camFollow && !drag){ const tgt = walking ? {x:hx,y:hy} : (ALL[focus]||{x:camX,y:camY});
    camX+=(tgt.x-camX)*Math.min(1,dt*4.5); camY+=(tgt.y-camY)*Math.min(1,dt*4.5); clampCam(); }
  if(!panHold&&!drag){
    camX+=(hx-camX)*Math.min(1,dt*3.2);
    camY+=(hy-camY)*Math.min(1,dt*3.2);
  }
  clampCam();
  ctx.fillStyle='#06040e'; ctx.fillRect(0,0,W,H);
  if(MAPok){ ctx.imageSmoothingEnabled=true; ctx.drawImage(MAPIMG, vx(0),vy(0), VW*s,VH*s); }
  // road dots
  for(const [a,b] of EDGES){
    const lit=!(ALL[a].locked||ALL[b].locked);
    const key=EDGEDOTS[a+'_'+b]?a+'_'+b:b+'_'+a;
    const dots=EDGEDOTS[key]||[];
    for(let i=0;i<dots.length;i++){
      const px=dots[i][0],py=dots[i][1];
      if(vx(px)<-20||vx(px)>W+20||vy(py)<-20||vy(py)>H+20) continue;
      ctx.globalAlpha=lit?(0.4+0.3*Math.sin(t*3-i*0.7)):0.14;
      ctx.fillStyle=lit?'#b9a6ff':'#5a5470';
      ctx.beginPath(); ctx.arc(vx(px),vy(py),2.4*s,0,7); ctx.fill();
    }
  }
  ctx.globalAlpha=1;
  // nodes
  for(const n of WORLDS){
    if(vx(n.x)<-140||vx(n.x)>W+140||vy(n.y)<-140||vy(n.y)>H+140) continue;
    const acts=hooks.getActs(n.id);
    const zopen=hooks.zoneOpen?hooks.zoneOpen(n.id):!!n.play;
    const zsoon=!zopen&&!n.locked;
    const R=22*s, done=acts.filter(a2=>a2==='done').length;
    const open=acts.includes('open');
    const pulse=(zopen&&open)?1+0.06*Math.sin(t*4):1;
    if(zopen){ const gr=ctx.createRadialGradient(vx(n.x),vy(n.y),0,vx(n.x),vy(n.y),R*2.4);
      gr.addColorStop(0,n.col+'55'); gr.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=gr; ctx.fillRect(vx(n.x)-R*2.4,vy(n.y)-R*2.4,R*4.8,R*4.8); }
    ctx.fillStyle=n.locked?'rgba(43,38,64,0.88)':'rgba(34,26,68,0.88)';
    ctx.strokeStyle=n.locked?'#4c4566':n.col; ctx.lineWidth=3*s;
    if(zsoon) ctx.globalAlpha=0.55;
    ctx.beginPath(); ctx.arc(vx(n.x),vy(n.y),R*pulse,0,7); ctx.fill(); ctx.stroke();
    ctx.globalAlpha=1;
    if(done===3){ ctx.strokeStyle='#c8fb50'; ctx.lineWidth=2.5*s; ctx.beginPath(); ctx.arc(vx(n.x),vy(n.y),R*0.55,0,7); ctx.stroke(); }
    if(n.locked){ ctx.fillStyle='#8a82a6'; ctx.font='bold '+(14*s)+'px sans-serif'; ctx.textAlign='center'; ctx.fillText('🔒',vx(n.x),vy(n.y)+5*s); }
    if(zsoon){ ctx.fillStyle='rgba(200,190,255,0.75)'; ctx.font='bold '+(8.5*s)+'px sans-serif'; ctx.textAlign='center'; ctx.fillText('SOON',vx(n.x),vy(n.y)+3.5*s); }
    for(let i=0;i<3;i++){
      const ax=vx(n.x)+(i-1)*11*s, ay=vy(n.y)+R+11*s, st=acts[i];
      ctx.beginPath(); ctx.arc(ax,ay,3.8*s,0,7);
      if(st==='done'){ ctx.fillStyle='#c8fb50'; ctx.fill(); }
      else { ctx.strokeStyle=st==='open'?'#b9a6ff':'#55506e'; ctx.lineWidth=1.7*s; ctx.stroke();
        if(st==='open'){ ctx.fillStyle='rgba(185,166,255,'+(0.3+0.3*Math.sin(t*4))+')'; ctx.fill(); } }
    }
    ctx.save();
    ctx.shadowColor='rgba(0,0,0,0.9)'; ctx.shadowBlur=6*s;
    ctx.fillStyle=n.locked?'#8a82a6':'#efe9ff';
    ctx.font=(14*s)+'px Creepster, cursive'; ctx.textAlign='center';
    ctx.fillText(n.name, vx(n.x), vy(n.y)-R-9*s);
    ctx.restore();
  }
  if(camFollow && focus && !panel){ const fn=ALL[focus]; if(fn){ const RR=26*s+12, pl=RR*(1+0.06*Math.sin(t*5)); ctx.strokeStyle='#c8fb50'; ctx.lineWidth=3*s; ctx.beginPath(); ctx.arc(vx(fn.x),vy(fn.y),pl,0,7); ctx.stroke(); } }
  // walker
  if(walking){
    if(!ptQ.length&&route.length) startEdge();
    if(ptQ.length){
      const tgt=ptQ[0];
      const dx=tgt.x-hx, dy=tgt.y-hy, d=Math.hypot(dx,dy), sp=SPEED*dt;
      if(d<sp){
        hx=tgt.x; hy=tgt.y; ptQ.shift();
        if(!ptQ.length){
          hero=route.shift();
          if(!route.length){
            walking=false;
            if(ALL[hero].name) hooks.setHeroAt(hero);
          } else startEdge();
        }
      } else {
        hx+=dx/d*sp; hy+=dy/d*sp;
        if(Math.abs(dx)>Math.abs(dy)) lastDir={r:0,m:dx>=0?1:-1};
        else if(Math.abs(dy)>2) lastDir={r:dy>=0?1:2,m:1};
      }
    } else walking=false;
  }
  const hop=walking?Math.abs(Math.sin(t*9))*3*s:0;
  const HCFG=HEROES[hooks.isDing?'bat':'reaper'];
  if(HCFG.img){
    const C=120;
    const st4=Math.floor(t*7)%4, st8=Math.floor(t*7)%8;
    let fi,mir;
    if(lastDir.r===0){ fi=st4; mir=lastDir.m<0; }
    else if(HCFG.mirrorFB){ fi=st8%4; mir=st8>=4; }
    else { fi=st4; mir=false; }
    if(!walking){ fi=0; }
    const hsc=(40*s)/C;
    ctx.fillStyle='rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(vx(hx),vy(hy)+4*s,10*s,3.6*s,0,0,7); ctx.fill();
    ctx.save(); ctx.translate(vx(hx),vy(hy)+5*s-hop); ctx.scale(mir?-hsc:hsc,hsc);
    ctx.imageSmoothingEnabled=false;
    ctx.drawImage(HCFG.img, fi*C,lastDir.r*C,C,C, -C/2,-C, C,C); ctx.restore();
    ctx.imageSmoothingEnabled=true;
  }
  // act panel
  if(panel){
    const wld=ALL[panel], P=panelRect(), acts=hooks.getActs(panel);
    ctx.fillStyle='rgba(18,14,36,0.95)'; ctx.strokeStyle=wld.col; ctx.lineWidth=2;
    ctx.beginPath(); ctx.roundRect(P.x,P.y,P.w,P.h,14); ctx.fill(); ctx.stroke();
    ctx.fillStyle='#e6e0fa'; ctx.font='22px Creepster, cursive'; ctx.textAlign='center';
    ctx.fillText(wld.name, P.x+P.w/2, P.y+34);
    ctx.font='12px sans-serif'; ctx.fillStyle='#9b8cff'; ctx.fillText('choose your act', P.x+P.w/2, P.y+50);
    for(let i=0;i<3;i++){
      const c=chipRect(P,i), st=acts[i];
      ctx.fillStyle=st==='done'?'rgba(200,251,80,0.12)':st==='open'?'rgba(123,92,255,0.25)':'rgba(60,56,80,0.4)';
      ctx.strokeStyle=st==='done'?'#c8fb50':st==='open'?'#a98aff':'#55506e'; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.roundRect(c.x,c.y,c.w,c.h,10); ctx.fill(); ctx.stroke();
      if(camFollow && i===chipSel){ ctx.strokeStyle='#c8fb50'; ctx.lineWidth=2.5; ctx.beginPath(); ctx.roundRect(c.x-2,c.y-2,c.w+4,c.h+4,11); ctx.stroke(); }
      ctx.fillStyle=(st==='locked'||st==='soon')?'#6e6886':'#e6e0fa'; ctx.font='bold 15px sans-serif';
      ctx.fillText('ACT '+['I','II','III'][i], c.x+c.w/2, c.y+22);
      ctx.font='11px sans-serif';
      ctx.fillStyle=st==='done'?'#c8fb50':st==='open'?'#b9a6ff':'#6e6886';
      ctx.fillText(st==='done'?'★ replay':st==='open'?'play':st==='soon'?'in development':'🔒 locked', c.x+c.w/2, c.y+40);
    }
  }
  // HUD: menu button
  const M=menuBtnRect();
  ctx.fillStyle='rgba(20,16,36,.78)'; ctx.beginPath(); ctx.roundRect(M.x,M.y,M.w,M.h,9); ctx.fill();
  ctx.strokeStyle='#7b5cff'; ctx.lineWidth=1.5; ctx.stroke();
  ctx.fillStyle='#c8fb50'; ctx.font='bold 13px sans-serif'; ctx.textAlign='center';
  ctx.fillText('MENU', M.x+M.w/2, M.y+22);
  const SK2=skinsBtnRect();
  ctx.fillStyle='rgba(20,16,36,.78)'; ctx.beginPath(); ctx.roundRect(SK2.x,SK2.y,SK2.w,SK2.h,9); ctx.fill();
  ctx.strokeStyle='#7b5cff'; ctx.lineWidth=1.5; ctx.stroke();
  ctx.fillStyle='#b9a6ff'; ctx.font='bold 13px sans-serif';
  ctx.fillText('SKINS', SK2.x+SK2.w/2, SK2.y+22);
  ctx.fillStyle='rgba(200,190,255,.55)'; ctx.font='11px sans-serif'; ctx.textAlign='left';
  ctx.fillText('drag to look around · tap a zone to travel', SK2.x+SK2.w+12, M.y+22);
  if(hooks.dev){
    ctx.fillStyle='rgba(226,59,59,.85)'; ctx.beginPath(); ctx.roundRect(W-66,12,54,24,7); ctx.fill();
    ctx.fillStyle='#fff'; ctx.font='bold 11px sans-serif'; ctx.textAlign='center'; ctx.fillText('DEV',W-39,28); ctx.textAlign='left';
  }
  if(toast&&toastT>0){ toastT-=dt;
    ctx.font='bold 14px sans-serif';
    const tw=ctx.measureText(toast).width+40;
    ctx.fillStyle='rgba(20,16,40,.9)'; ctx.strokeStyle='#7b5cff'; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.roundRect(W/2-tw/2,16,tw,36,9); ctx.fill(); ctx.stroke();
    ctx.fillStyle='#eaf6ff'; ctx.textAlign='center'; ctx.fillText(toast, W/2, 39);
  }
  ctx.textAlign='left';
}
return {enter,frame,pdown,pmove,pup,escape,key};
})();
