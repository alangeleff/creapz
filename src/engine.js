const ASSET_VER='1780728456';
async function loadSprites(){
  if (window.SPRITES_INLINE) return window.SPRITES_INLINE;
  const S = await (await fetch('./assets/sprites.json?v='+ASSET_VER)).json();
  (function fix(o){ for (const k in o){
    if ((k==='src'||k==='flame'||k==='vortex') && typeof o[k]==='string' && !o[k].startsWith('data:')) o[k]='./assets/'+o[k]+'?v='+ASSET_VER;
    else if (o[k] && typeof o[k]==='object') fix(o[k]);
  } })(S);
  return S;
}
async function main(){
if (document.fonts && document.fonts.load){ try{ await Promise.race([document.fonts.load('40px Creepster'), new Promise(r=>setTimeout(r,800))]); }catch(e){} }
const SPRITES = await loadSprites();
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const tcv = document.createElement('canvas'), tctx = tcv.getContext('2d');
const W = 960, H = 440;
const RS = Math.min(2, Math.max(1, Math.round(window.devicePixelRatio || 1)));
cv.width = W*RS; cv.height = H*RS;
const GROUND = 360;
const GRAV = 0.6, WALK = 3.7, RUN = 7.4, JUMP = -13.2;
const DIVE_VX = 8.6, DIVE_VY = 9.4, DIVE_REC = 0.22, DIVE_ROT = 0.5;   // Power Dive (Dingbat)
const BASH_VX = 11.4, BASH_VY = 12.6;   // Scythe Bash (cReaper) — snappier than the dive per Alan
const OBJ = SPRITES.obst;
const SPIKE_IMG=new Image(); SPIKE_IMG.src='./assets/haz_spike2.png?v='+ASSET_VER;
const SPIKESHOT_IMG=new Image(); SPIKESHOT_IMG.src='./assets/haz_spikeshot1.png?v='+ASSET_VER;
const ROCK_IMG=new Image(); ROCK_IMG.src='./assets/haz_rock2.png?v='+ASSET_VER;
const CAVEPLAT_IMG=new Image(); CAVEPLAT_IMG.src='./assets/caveplat1.png?v='+ASSET_VER;
const CAVECEIL_IMG=new Image(); CAVECEIL_IMG.src='./assets/caveceil2.png?v='+ASSET_VER;
const CAVEGND_IMG=new Image(); CAVEGND_IMG.src='./assets/caveground_dirt1.png?v='+ASSET_VER;
const CAVETOP_IMG=new Image(); CAVETOP_IMG.src='./assets/caveground_top1.png?v='+ASSET_VER;
const ROCKPILE_IMG=new Image(); ROCKPILE_IMG.src='./assets/tex_rockpile1.png?v='+ASSET_VER;
const DIRT_SEAM_IMG=new Image(); DIRT_SEAM_IMG.src='./assets/dirt_seam1.png?v='+ASSET_VER;
const BG_IMGS={cavebg:(()=>{const i=new Image(); i.src='./assets/cavebg1.png?v='+ASSET_VER; return i;})(), cavebg2:(()=>{const i=new Image(); i.src='./assets/cavebg2.png?v='+ASSET_VER; return i;})()};
let stageIdx = 0, ST, WORLD, GOAL_X, SEG, OBST, SOLID, TSOLID=[], PLAT_DEF, CHK, SOUL_POS, HAZ=[], rocks=[], volleys=[], TEX=[], BG=[];
let STARS=[], TREES=[], GRAVES_BG=[];
let titleT = 99;
// ---- live progress (Phase A: single implicit save; slots arrive in Phase B) ----
const SAVEK='creapz_saves_v2', TOTAL_ACTS=27;   // 9 zones x 3 acts (the full realm)
const ZONE_STAGES={cem:[0,1],crypt:[2]};       // zone -> stage indices per act
const RELEASED={cem:2};                        // publicly playable act count per zone (dev sees everything built)
const DEVKEY='hellstone';
let devMode=false;
try{
  const q=new URLSearchParams(location.search);
  if(q.has('dev')){ if(q.get('dev')==='off') localStorage.removeItem('creapz_dev'); else localStorage.setItem('creapz_dev', q.get('dev')); }
  devMode = localStorage.getItem('creapz_dev')===DEVKEY;
}catch(e){}
const STAGE_ZONE=['cem','cem','crypt'];        // stageIdx -> zone
const STAGE_ACT=['cem1','cem2','crypt1'];      // stageIdx -> act record id
let saves={slots:[null,null,null]}, slotIdx=-1;
let prog={acts:{},heroAt:'cem'};               // alias of the bound slot
try{ const s0=JSON.parse(localStorage.getItem(SAVEK)); if(s0&&Array.isArray(s0.slots)) saves={slots:[s0.slots[0]||null,s0.slots[1]||null,s0.slots[2]||null]}; }catch(e){}
try{ // migrate the Phase-A single save into slot 1
  const p0=JSON.parse(localStorage.getItem('creapz_prog_v1'));
  if(p0&&p0.acts&&!saves.slots[0]){
    saves.slots[0]={chosen:'default',acts:p0.acts,heroAt:p0.heroAt||'cem',soulz:0,created:Date.now(),played:Date.now()};
    localStorage.setItem(SAVEK,JSON.stringify(saves));
  }
  if(p0) localStorage.removeItem('creapz_prog_v1');
}catch(e){}
function saveAll(){ try{ localStorage.setItem(SAVEK,JSON.stringify(saves)); }catch(e){} }
function bindSlot(i){ slotIdx=i; prog=saves.slots[i]; chosen=prog.chosen||'default'; }
function slotStats(sl){ const n=Object.keys(sl.acts||{}).filter(k=>sl.acts[k].done).length; return {acts:n, pct:Math.max(1,Math.round(n*100/TOTAL_ACTS)), soulz:sl.soulz||0}; }
function saveProg(){ if(slotIdx>=0&&prog){ prog.chosen=chosen; prog.played=Date.now(); } saveAll(); }
let optMsg='', deferredInstall=null;
window.addEventListener('beforeinstallprompt', e=>{ e.preventDefault(); deferredInstall=e; });
function exportSave(){
  try{
    const blob=new Blob([JSON.stringify({v:2,game:'creapz',saves})],{type:'application/json'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
    a.download='creapz-save-'+new Date().toISOString().slice(0,10)+'.json'; a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),5000);
    optMsg='save file exported — keep it somewhere safe'; playSfx('sfx_healthup');
  }catch(e){ optMsg='export failed'; playSfx('sfx_hurt'); }
}
function importSave(){
  const inp=document.createElement('input'); inp.type='file'; inp.accept='.json,application/json';
  inp.onchange=()=>{
    const f=inp.files&&inp.files[0]; if(!f) return;
    f.text().then(tx=>{
      try{
        const d=JSON.parse(tx);
        const sl=(d.saves&&d.saves.slots)||d.slots;
        if(!Array.isArray(sl)) throw new Error('bad');
        saves={slots:[sl[0]||null,sl[1]||null,sl[2]||null]}; saveAll();
        slotIdx=-1; prog={acts:{},heroAt:'cem'};
        optMsg='save imported — your stories are back'; playSfx('sfx_healthup');
      }catch(err){ optMsg='import failed — not a cReapZ save file'; playSfx('sfx_hurt'); }
    });
  };
  inp.click();
}
function installApp(){
  if (matchMedia('(display-mode: standalone)').matches){ optMsg='already installed — you\u2019re playing the app'; }
  else if (deferredInstall){ deferredInstall.prompt(); optMsg='follow the browser prompt'; }
  else if (/iPhone|iPad|iPod/.test(navigator.userAgent)){ optMsg='iOS: tap Share, then \u201cAdd to Home Screen\u201d'; }
  else { optMsg='use your browser menu \u2192 \u201cInstall app\u201d'; }
  playSfx('sfx_mtog');
}
function getActs(zone){
  const sl=ZONE_STAGES[zone]||[];
  const pub=devMode?sl.length:Math.min(sl.length,RELEASED[zone]||0);
  return [0,1,2].map(i=>{
    if(i>=sl.length) return sl.length?'soon':'locked';
    if(i>=pub) return 'soon';
    const rec=prog.acts[zone+(i+1)];
    if(rec&&rec.done) return 'done';
    if(i===0) return 'open';
    const prev=prog.acts[zone+i];
    return (prev&&prev.done)?'open':'locked';
  });
}
function zoneOpen(z){ return !!(ZONE_STAGES[z]&&ZONE_STAGES[z].length&&(devMode||(RELEASED[z]||0)>0)); }
function bootTest(){ document.querySelector('.touch').classList.toggle('ding', isDing(chosen)); banked=0; loadStage(window.__testIdx); mode='play'; }
function enterWorld(fromAct){
  if(testMode){ try{ if(history.length>1) history.back(); else location.href='editor'; }catch(e){ location.href='editor'; } return; }
  paused=false; tally=null; fading=0; fadeIn=0.5; panelSel=0;
  if(fromAct){ prog.heroAt=STAGE_ZONE[stageIdx]||prog.heroAt; saveProg(); }
  mode='world';
  WORLDMODE.enter({ctx,W,H,keys,isDing:isDing(chosen),getActs,zoneOpen,dev:devMode,playSfx,
    launch:(zone,ai)=>{ const si=(ZONE_STAGES[zone]||[])[ai]; if(si===undefined) return;
      prog.heroAt=zone; saveProg(); banked=0; mode='play'; loadStage(si); },
    exit:()=>{ playSfx('sfx_msel'); mode='title'; menuShown=true; },
    openSkins:()=>{ selMode='skin';
      if(isDing(chosen)){ dingSkin=chosen; selFoc=1; } else { creaperSkin=chosen; selFoc=0; }
      selRow=1; mode='select'; playSfx('sfx_mtog'); },
    heroAt:prog.heroAt,
    setHeroAt:z=>{ prog.heroAt=z; saveProg(); }});
}
function loadStage(i){
  stageIdx = i; ST = window.STAGES[i];
  WORLD = ST.world; GOAL_X = ST.goal; SEG = ST.seg;
  WORLDH = ST.h||H; GOALY = (ST.goalY!==undefined)?ST.goalY:GROUND;
  OBST = ST.obst.map(o => ({x:o.x, type:o.type, w:OBJ[o.type].w, h:OBJ[o.type].h, gy:(o.gy!==undefined?o.gy:GROUND), z:o.z}));
  SOLID = OBST.map(o => ({l:o.x-o.w/2, r:o.x+o.w/2, top:o.gy-o.h}));
  TSOLID = SEG.map(s => ({l:s[0], r:s[1], top:s[2], bot:s[2]+(s[3]||130)}));
  PLAT_DEF = ST.plats; CHK = (ST.chk||[]).map(c=>Array.isArray(c)?c:[c,GROUND]); SOUL_POS = ST.souls;
  TEX = (ST.tex||[]).map(t=>({t:t.t, x:t.x, y:t.y, w:t.w, z:t.z}));
  BG = (ST.bg||[]).map(b=>({t:b.t, par:b.par, alpha:b.alpha}));
  HAZ = (ST.hazards||[]).map(h=>{
    const o={t:h.t, x:h.x, w:h.w, y:h.y, d:h.d, z:h.z, cd:0, dir:h.dir, tx:h.tx, ty:h.ty, tw:h.tw, th:h.th};
    if(h.t==='rock'){ const n=Math.max(1,Math.round(h.w/160)); const step=h.w/n; o.spawns=[]; for(let i=0;i<n;i++) o.spawns.push(Math.round(h.x+step*(i+0.5))); o.cds=o.spawns.map(()=>0); }
    return o;
  });
  STARS = Array.from({length:Math.ceil(WORLD/120)},()=>[Math.random()*WORLD,Math.random()*GROUND*0.8,Math.random()*1.6+0.6]);
  TREES = Array.from({length:Math.ceil(WORLD/180)},(_,k)=>({x:80+k*180+((k*53)%50), big:(k%4===0)}));
  GRAVES_BG = Array.from({length:Math.ceil(WORLD/150)},(_,k)=>[80+k*150+((k*53)%40),0.7+((k*29)%4)*0.1,(k%4===0)]);
  reset(); titleT = 0;
  if (mode==='play') playMusic(ST.music);
  actScore=0; actSoulPts=0; actKillPts=0; killCount=0; gotHit=false; actTime=0;
  totalEnemies=zombies.length+bats.length;
  tally=null; fading=0; fadeIn=0.5;
}
const ORDER = SPRITES.order;
const LABELS = { default:'Violet', green:'Emerald', blue:'Azure', red:'Crimson' };

const keys = {};
const DOUBLE_TAP = 350;
const lastRelease = { ArrowLeft:-1e9, ArrowRight:-1e9 };
const runHeld = { ArrowLeft:false, ArrowRight:false };
let diveReq=null, diveGhosts=[];   // Power Dive: double-tap-forward request + afterimage trail
function press(code){
  if (code==='ArrowLeft'||code==='ArrowRight'){
    if (keys[code]) return; runHeld[code]=(performance.now()-lastRelease[code])<DOUBLE_TAP;
  }
  // Aerial attack: melee button midair -> Power Dive (Dingbat) / Scythe Bash (cReaper)
  if (code==='KeyZ' && !keys[code] && mode==='play' && p && !p.dead && !p.onGround)
    diveReq={dir:0, t:performance.now()};   // dir resolved at trigger (held dir, else facing)
  keys[code]=true;
}
function release(code){
  if (code==='ArrowLeft'||code==='ArrowRight'){ lastRelease[code]=performance.now(); runHeld[code]=false; }
  keys[code]=false;
}
addEventListener('keydown', e => {
  if (mode==='load'){ primeAudio(); if (loaded>=total){ mode='title'; titleFade=0; menuShown=false; playSfx('sfx_msel'); } return; }
  if (mode==='title'){
    primeAudio();
    if (e.code==='Escape'){ if(optionsOpen||cryptOpen){ optionsOpen=false; cryptOpen=false; playSfx('sfx_mtog'); } return; }
    if (cryptOpen){ if (e.code==='Enter'||e.code==='Space'){ cryptOpen=false; playSfx('sfx_mtog'); } return; }
    if (optionsOpen){
      if (e.code==='ArrowUp'||e.code==='ArrowDown'){ optSel=(optSel+(e.code==='ArrowDown'?1:5))%6; playSfx('sfx_mtog'); }
      else if (e.code==='ArrowLeft'||e.code==='ArrowRight'){
        const d=e.code==='ArrowRight'?'+':'-';
        if (optSel===0) titleMenuAction('m'+d); else if (optSel===1) titleMenuAction('s'+d);
      }
      else if (e.code==='Enter'||e.code==='Space'){
        if (optSel===2) titleMenuAction('export');
        else if (optSel===3) titleMenuAction('import');
        else if (optSel===4) titleMenuAction('install');
        else if (optSel===5) titleMenuAction('close');
      }
      return;
    }
    if (!menuShown){ menuShown=true; menuSel=0; playSfx('sfx_mtog'); return; }
    if (e.code==='ArrowLeft'||e.code==='ArrowRight'){ menuSel=(menuSel+(e.code==='ArrowRight'?1:2))%3; playSfx('sfx_mtog'); }
    else if (e.code==='Enter'||e.code==='Space'){ titleMenuAction(['play','crypt','options'][menuSel]); }
    return;
  }
  if (['ArrowLeft','ArrowRight','ArrowUp','Space',' '].includes(e.key)||e.code==='Space') e.preventDefault();
  if (mode==='slots'){
    if (slotConfirm>=0){
      if (e.code==='ArrowLeft'||e.code==='ArrowRight'){ confSel=confSel?0:1; playSfx('sfx_mtog'); }
      else if (e.code==='Enter'||e.code==='Space'){
        if(confSel===0){ saves.slots[slotConfirm]=null; saveAll(); playSfx('sfx_die'); } else playSfx('sfx_mtog');
        slotConfirm=-1;
      }
      else if (e.code==='Escape'){ slotConfirm=-1; playSfx('sfx_mtog'); }
      return;
    }
    if (e.code==='ArrowLeft'||e.code==='ArrowRight'){ slotSel=(slotSel+(e.code==='ArrowRight'?1:2))%3; playSfx('sfx_mtog'); }
    else if (e.code==='Enter'||e.code==='Space'){ activateSlot(slotSel); }
    else if ((e.code==='Delete'||e.code==='Backspace')&&saves.slots[slotSel]){ slotConfirm=slotSel; confSel=1; playSfx('sfx_mtog'); }
    else if (e.code==='Escape'){ mode='title'; menuShown=true; playSfx('sfx_mtog'); }
    return;
  }
  if (mode==='select'){
    const skinOnly=(selMode==='skin');
    if (e.code==='Escape'){
      playSfx('sfx_mtog');
      if (skinOnly){ saveProg(); enterWorld(false); } else { mode='slots'; }
      return;
    }
    if (!skinOnly && e.key==='1'){ playSfx('sfx_msel'); startGame(creaperSkin); return; }
    if (!skinOnly && e.key==='2'){ playSfx('sfx_msel'); startGame(dingSkin); return; }
    if (e.code==='ArrowUp'){ if (selRow===0){ selRow=1; playSfx('sfx_mtog'); } return; }
    if (e.code==='ArrowDown'){ if (selRow===1){ selRow=0; playSfx('sfx_mtog'); } return; }
    if (e.code==='ArrowLeft'||e.code==='ArrowRight'){
      const dd=e.code==='ArrowRight'?1:-1;
      if (selRow===0){ if(!skinOnly) selFoc=(selFoc+1)%2; }
      else if (selFoc===0){ const i=ORDER.indexOf(creaperSkin); creaperSkin=ORDER[(i+dd+ORDER.length)%ORDER.length]; }
      else { const i=DORDER.indexOf(dingSkin); dingSkin=DORDER[(i+dd+DORDER.length)%DORDER.length]; }
      playSfx('sfx_mtog'); return;
    }
    if (e.code==='Enter'||e.code==='Space'){ playSfx('sfx_msel'); startGame(selFoc===0?creaperSkin:dingSkin); }
    return;
  }
  if (mode==='world'){
    if (e.code==='Escape'){ if(!WORLDMODE.escape()){ mode='title'; menuShown=true; } playSfx('sfx_mtog'); return; }
    press(e.code); return;
  }
  if (e.code==='Escape'||e.code==='KeyP'){ if(mode==='play'&&!p.dead&&!p.won){ paused=!paused; panelSel=0; playSfx('sfx_mtog'); } return; }
  if (e.code==='KeyR'&&mode==='play'){ paused=false; onReset(); return; }
  if (mode==='play' && p && p.won && tally){
    if (e.code==='Enter'||e.code==='Space'){
      if (!tally.done){ tally.skip=true; playSfx('sfx_mtog'); }
      else if (fading<=0){ fading=0.0001; playSfx('sfx_msel'); }
    }
    else if (tally.done && (e.code==='ArrowLeft'||e.code==='ArrowRight') && menuRects.length){
      panelSel=(panelSel+1)%menuRects.length; playSfx('sfx_mtog');
    }
    return;
  }
  if (mode==='play' && p && menuOpen()){
    if (e.code==='ArrowUp'||e.code==='ArrowDown'){ const n2=menuRects.length||1; panelSel=(panelSel+(e.code==='ArrowDown'?1:n2-1))%n2; playSfx('sfx_mtog'); }
    else if ((e.code==='Enter'||e.code==='Space') && menuRects[panelSel]){ playSfx('sfx_msel'); menuRects[panelSel].action(); }
    return;
  }
  press(e.code);
});
addEventListener('keyup', e => release(e.code));
function bindBtn(id,code){
  const el=document.getElementById(id);
  el.addEventListener('pointerdown', e=>{e.preventDefault();press(code);});
  el.addEventListener('pointerup',   e=>{e.preventDefault();release(code);});
  el.addEventListener('pointerleave',e=>{e.preventDefault();release(code);});
  el.addEventListener('pointercancel',e=>{e.preventDefault();release(code);});
}
bindBtn('bL','ArrowLeft'); bindBtn('bR','ArrowRight'); bindBtn('bJ','Space'); bindBtn('bA','KeyZ'); bindBtn('bC','KeyX'); bindBtn('bD','ArrowDown');
// canvas taps (character select)
function canvasPt(e){ const r=cv.getBoundingClientRect(); return { x:(e.clientX-r.left)/r.width*W, y:(e.clientY-r.top)/r.height*H }; }
cv.addEventListener('pointermove', e=>{ if(mode==='world') WORLDMODE.pmove(canvasPt(e)); });
cv.addEventListener('pointerup',   e=>{ if(mode==='world') WORLDMODE.pup(canvasPt(e)); });
cv.addEventListener('pointercancel', e=>{ if(mode==='world') WORLDMODE.pup(canvasPt(e)); });
cv.addEventListener('pointerdown', e=>{
  primeAudio();
  const pt=canvasPt(e);
  if (mode==='world'){ WORLDMODE.pdown(pt); return; }
  if (mode==='load'){
    if (loaded>=total){
      mode='title'; titleFade=0; menuShown=false; playSfx('sfx_msel');
      try{
        if (matchMedia('(pointer:coarse)').matches && document.documentElement.requestFullscreen){
          document.documentElement.requestFullscreen({navigationUI:'hide'}).then(()=>{
            try{ screen.orientation.lock('landscape').catch(()=>{}); }catch(e2){}
          }).catch(()=>{});
        }
      }catch(e3){}
    }
    return;
  }
  if (mode==='title'){
    if (cryptOpen || optionsOpen || menuShown){
      for (const r of menuRects){ if (pt.x>r.x&&pt.x<r.x+r.w&&pt.y>r.y&&pt.y<r.y+r.h){
        if (typeof r.action==='string') titleMenuAction(r.action); else { playSfx('sfx_msel'); r.action(); }
        return; } }
      return;
    }
    menuShown=true; playSfx('sfx_mtog');
    return;
  }
  if (mode==='slots'){
    if (slotConfirm>=0){
      for (const r of confRects){ if (pt.x>r.x&&pt.x<r.x+r.w&&pt.y>r.y&&pt.y<r.y+r.h){
        if(r.yes){ saves.slots[slotConfirm]=null; saveAll(); playSfx('sfx_die'); } else playSfx('sfx_mtog');
        slotConfirm=-1; return; } }
      slotConfirm=-1; return;
    }
    for (const r of delRects){ if (pt.x>r.x&&pt.x<r.x+r.w&&pt.y>r.y&&pt.y<r.y+r.h){ slotConfirm=r.i; confSel=1; playSfx('sfx_mtog'); return; } }
    for (const r of slotRects){ if (pt.x>r.x&&pt.x<r.x+r.w&&pt.y>r.y&&pt.y<r.y+r.h){ slotSel=r.i; activateSlot(r.i); return; } }
    return;
  }
  if (mode==='select'){
    for (const d of dotRects){ if (pt.x>d.x&&pt.x<d.x+d.w&&pt.y>d.y&&pt.y<d.y+d.h){ if(d.who==='d') dingSkin=d.skin; else creaperSkin=d.skin; playSfx('sfx_mtog'); return; } }
    for (const c of cardRects){ if (pt.x>c.x&&pt.x<c.x+c.w&&pt.y>c.y&&pt.y<c.y+c.h){ playSfx('sfx_msel'); startGame(c.key==='creaper'?creaperSkin:dingSkin); break; } }
    return;
  }
  if (mode!=='play') return;
  if (p.won){
    if (!tally) return;
    if (!tally.done){ tally.skip=true; playSfx('sfx_mtog'); return; }
    if (fading<=0){ fading=0.0001; playSfx('sfx_msel'); }
    return;
  }
  if (menuOpen()){
    for (const r of menuRects){ if (pt.x>r.x&&pt.x<r.x+r.w&&pt.y>r.y&&pt.y<r.y+r.h){ playSfx('sfx_msel'); r.action(); return; } }
    return;
  }
  if (pt.x>PB.x-6&&pt.x<PB.x+PB.w+6&&pt.y>PB.y-6&&pt.y<PB.y+PB.h+6 && !p.winning){ paused=true; playSfx('sfx_mtog'); }
});

// ---- load sprites ----
const SPR = { chars:{} };
let loaded=0, total=0;
function L(d){ const img=new Image(); total++; img.onload=()=>loaded++; img.src=d.src;
  return {img,sw:d.sw,sh:d.sh,w:d.w,h:d.h,frames:d.frames,foots:d.foots,cxs:d.cxs,weapon:d.weapon}; }
SPR.obst = {};
for (const k in SPRITES.obst){ const d=SPRITES.obst[k]; const img=new Image(); total++; img.onload=()=>loaded++; img.src=d.src; SPR.obst[k]={img,w:d.w,h:d.h}; }
SPR.trees={}; for (const k in SPRITES.trees){ const d=SPRITES.trees[k]; const img=new Image(); total++; img.onload=()=>loaded++; img.src=d.src; SPR.trees[k]={img,w:d.w,h:d.h}; }
SPR.zombie={}; for (const k in SPRITES.zombie){ SPR.zombie[k]=L(SPRITES.zombie[k]); }
SPR.zgen={}; for (const k in SPRITES.zgen){ SPR.zgen[k]=L(SPRITES.zgen[k]); }
SPR.gob={}; for (const k in SPRITES.gob){ SPR.gob[k]=L(SPRITES.gob[k]); }
SPR.bd={}; for (const k in SPRITES.bd){ SPR.bd[k]=L(SPRITES.bd[k]); }
SPR.bat={}; for (const k in SPRITES.bat){ const d=SPRITES.bat[k]; const img=new Image(); total++; img.onload=()=>loaded++; img.src=d.src;
  SPR.bat[k]={img,sw:d.sw,sh:d.sh,w:d.w,h:d.h,frames:d.frames,cxs:d.cxs,cys:d.cys}; }
{ const d=SPRITES.dirt; const img=new Image(); total++; img.onload=()=>loaded++; img.src=d.src; SPR.dirt={img,w:d.w,h:d.h}; }
{ const d=SPRITES.gate; const img=new Image(); total++; img.onload=()=>loaded++; img.src=d.src; SPR.gate={img,w:d.w,h:d.h}; }
{ const d=SPRITES.cloud; const img=new Image(); total++; img.onload=()=>loaded++; img.src=d.src; SPR.cloud={img,w:d.w,h:d.h}; }
{ const d=SPRITES.chkst; const img=new Image(); total++; img.onload=()=>loaded++; img.src=d.src;
  const fimg=new Image(); total++; fimg.onload=()=>loaded++; fimg.src=d.flame;
  SPR.chkst={img,fimg,w:d.w,h:d.h,fpts:d.fpts}; }
SPR.hpicon={}; for (const k in SPRITES.hpicon){ const d=SPRITES.hpicon[k]; const img=new Image(); total++; img.onload=()=>loaded++; img.src=d.src; SPR.hpicon[k]={img,w:d.w,h:d.h}; }
{ const d=SPRITES.goal; const img=new Image(); total++; img.onload=()=>loaded++; img.src=d.src;
  const fimg=new Image(); total++; fimg.onload=()=>loaded++; fimg.src=d.flame;
  const vimg=new Image(); total++; vimg.onload=()=>loaded++; vimg.src=d.vortex;
  SPR.goal={img,fimg,vimg,w:d.w,h:d.h,fpts:d.fpts,vc:d.vc,vr:d.vr,vsz:d.vsz}; }
{ const d=SPRITES.grass; const img=new Image(); total++; img.onload=()=>loaded++; img.src=d.src; SPR.grass={img,w:d.w,h:d.h}; }
for (const ck in SPRITES.chars){ SPR.chars[ck]={};
  for (const an in SPRITES.chars[ck]){
    if (an==='fps'){ SPR.chars[ck].fps=SPRITES.chars[ck].fps; continue; }
    SPR.chars[ck][an]=L(SPRITES.chars[ck][an]);
  } }
const FPS = { idle:17, walk:16, run:16, jump:23, attack:38, hurt:48, kneel:48, cast:32, dive:1 };
function isDing(ck){ return ck==='dingbat'||ck.slice(0,5)==='ding_'; }
function pfps(st2){ const f=SPR.chars[chosen]&&SPR.chars[chosen].fps; return (f&&f[st2])||FPS[st2]; }
const FZ = { idle:24, walk:12, attack:16 };
const FZK = { zombie:FZ, zgen:FZ, gob:{idle:13, walk:12, attack:43}, bd:{idle:12, walk:12, attack:12} };
const KSPD = { zombie:1.7, zgen:1.7, gob:2.4, bd:1.15 };
const KRNG = { zombie:74, zgen:74, gob:76, bd:-1 };  // gob spear reach ~78; bd never melee-attacks (contact only)
const ZSPEED = 1.7;
const PMAXHP = 4, ZMAXHP = 2;
const SOUL_PTS = 100;
const KPTS = { bd:100, gob:300, bat:300, zombie:500, zgen:800 };
function timeBrackets(idx){
  const s=idx*30;   // each act shifts brackets by 30s
  return [[90+s,3000],[120+s,2000],[180+s,1000]];
}
// procedural soul (ASCEND design): cached radial bitmaps, no shadowBlur, no per-frame gradients
function _srad(size,stops){ const c=document.createElement('canvas'); c.width=c.height=size;
  const g=c.getContext('2d'), gr=g.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2);
  for (const st of stops) gr.addColorStop(st[0],st[1]);
  g.fillStyle=gr; g.fillRect(0,0,size,size); return c; }
const SOUL_GLOW=_srad(128,[[0,'rgba(120,215,255,0.55)'],[0.35,'rgba(95,205,255,0.28)'],[0.7,'rgba(70,160,255,0.10)'],[1,'rgba(60,140,255,0)']]);
const SOUL_CORE=_srad(64,[[0,'rgba(255,255,255,1)'],[0.28,'rgba(225,250,255,1)'],[0.55,'rgba(130,220,255,0.95)'],[0.82,'rgba(80,175,255,0.55)'],[1,'rgba(70,160,255,0)']]);
const SOUL_MOTE=_srad(20,[[0,'rgba(255,255,255,1)'],[0.4,'rgba(160,230,255,0.9)'],[1,'rgba(110,200,255,0)']]);
function drawSoulFx(x,y,R,A,ph){
  const bob=Math.sin(gt*2.2+ph)*4, br=0.5+0.5*Math.sin(gt*2.6+ph*1.7), cy=y+bob;
  ctx.globalCompositeOperation='lighter';
  const gs=R*(4.6+0.7*br); ctx.globalAlpha=A*0.85*(0.55+0.40*br);
  ctx.drawImage(SOUL_GLOW,x-gs/2,cy-gs/2,gs,gs);
  const cs=R*1.9*(1+0.06*br); ctx.globalAlpha=A;
  ctx.drawImage(SOUL_CORE,x-cs/2,cy-cs/2,cs,cs);
  for(let i=0;i<5;i++){ const u=((gt*0.42+ph+i/5)%1);
    const yy=cy+R*1.0-u*R*4.2, xx=x+Math.cos(u*10.5+ph+i)*R*1.25*(1-u*0.45);
    const ua=(u<0.12?u/0.12:1-(u-0.12)/0.88), s=2.4*(1-u*0.5)*(R/13);
    ctx.globalAlpha=A*0.9*ua; ctx.drawImage(SOUL_MOTE,xx-s*2,yy-s*2,s*4,s*4); }
  ctx.globalAlpha=1; ctx.globalCompositeOperation='source-over';
}
const BAT_FPS = 15, BITE_FPS = 29, BAT_PATROL = 1.25, BAT_CHASE = 2.1, BAT_AGGRO = 280;

let mode='select', chosen=ORDER[0];
let p, souls, soulCount, gt=0, camX=0, camY=0, WORLDH=440, GOALY=360, zombies, plats, chkOn, bats, bolts, impacts;
let paused=false, menuRects=[];
let musicVol=1, sfxVol=1;
try{ musicVol=Math.min(1,Math.max(0,parseFloat(localStorage.getItem('creapz_mvol')??'1'))); sfxVol=Math.min(1,Math.max(0,parseFloat(localStorage.getItem('creapz_svol')??'1'))); }catch(e){}
function saveVols(){ try{ localStorage.setItem('creapz_mvol',musicVol); localStorage.setItem('creapz_svol',sfxVol); }catch(e){} }
let menuShown=false, optionsOpen=false, cryptOpen=false, titleFade=0;
let menuSel=0, optSel=0, selFoc=0, selRow=0, panelSel=0;   // keyboard nav cursors
let slotSel=0, slotConfirm=-1, confSel=1, selMode='new', slotRects=[], delRects=[], confRects=[];
let TIMG=null;
let AC=null, musicGain=null, musicSrc=null, musicBuf={}, musicKey=null, musicReq=0;
function audioInit(){
  if (AC) return;
  try{
    AC=new (window.AudioContext||window.webkitAudioContext)();
    musicGain=AC.createGain(); musicGain.gain.value=0.55; musicGain.connect(AC.destination);
  }catch(e){ AC=null; }
}
function getMusicBuf(key){
  if (!musicBuf[key]){
    musicBuf[key]=fetch('./assets/audio/'+key+'.m4a?v='+ASSET_VER)
      .then(r=>r.arrayBuffer()).then(ab=>AC.decodeAudioData(ab)).catch(()=>null);
  }
  return musicBuf[key];
}
async function playMusic(key){
  if (!AC || !key || window.SPRITES_INLINE) return;
  const req=++musicReq;
  if (musicSrc){ try{ musicSrc.stop(); }catch(e){} musicSrc=null; }
  musicKey=key;
  const buf=await getMusicBuf(key);
  if (req!==musicReq || !buf || musicSrc) return;   // superseded, failed, or already started — never stack
  const src=AC.createBufferSource(); src.buffer=buf; src.loop=true;
  src.connect(musicGain); src.start(); musicSrc=src;
}
function stopMusic(){ musicReq++; if (musicSrc){ try{ musicSrc.stop(); }catch(e){} musicSrc=null; musicKey=null; } }
function preloadMusic(key){
  if (!AC || !key || window.SPRITES_INLINE) return;
  getMusicBuf(key);   // warm the cache only — playMusic is the sole starter
}
let audioPrimed=false;
function primeAudio(){
  audioInit(); if (AC && AC.state==='suspended') AC.resume();
  if (audioPrimed || !AC) return;
  audioPrimed=true;
  ['sfx_msel','sfx_mtog'].forEach(loadSfx);
  (window.STAGES||[]).forEach(st2=>preloadMusic(st2.music));
}
let sfxBuf={}, sfxGain=null;
async function loadSfx(key){
  if (!AC || sfxBuf[key] || window.SPRITES_INLINE) return;
  try{
    const r=await fetch('./assets/audio/'+key+'.m4a?v='+ASSET_VER);
    sfxBuf[key]=await AC.decodeAudioData(await r.arrayBuffer());
  }catch(e){}
}
function ensureSfxGain(){
  if (AC && !sfxGain){ sfxGain=AC.createGain(); sfxGain.gain.value=0.45*sfxVol; sfxGain.connect(AC.destination); }
}
let runSrc=null;
function setRunLoop(state){
  if (!AC){ return; }
  if (!state){ if (runSrc){ try{ runSrc.stop(); }catch(e){} runSrc=null; } return; }
  if (!sfxBuf['sfx_run']){ loadSfx('sfx_run'); return; }
  ensureSfxGain();
  if (!runSrc){
    runSrc=AC.createBufferSource(); runSrc.buffer=sfxBuf['sfx_run']; runSrc.loop=true;
    const g=AC.createGain(); g.gain.value=2.6; runSrc.connect(g); g.connect(sfxGain);
    runSrc.start();
  }
  runSrc.playbackRate.value = state==='run' ? 1.0 : 0.62;
}
function sfxFire(key, vol, delay){
  const s=AC.createBufferSource(); s.buffer=sfxBuf[key];
  if (vol!==undefined && vol!==1){ const g=AC.createGain(); g.gain.value=vol; s.connect(g); g.connect(sfxGain); }
  else s.connect(sfxGain);
  s.start(delay ? AC.currentTime+delay : 0);
  return s;
}
function playSfx(key, vol, delay){
  if (!AC) return;
  ensureSfxGain();
  if (!sfxBuf[key]){ loadSfx(key).then(()=>{ if (AC && sfxBuf[key]) sfxFire(key, vol, 0); }); return null; }
  return sfxFire(key, vol, delay);
}
let countSrcs=[];
let banked=0, actScore=0, actSoulPts=0, actKillPts=0, killCount=0, totalEnemies=0, gotHit=false, actTime=0;
let tally=null, fading=0, fadeIn=0;
function addScore(base, kind){
  const m=Math.max(0.25, p.hp/PMAXHP);
  const pts=Math.round(base*m);
  actScore+=pts;
  if (kind==='soul') actSoulPts+=pts; else actKillPts+=pts;
}
function computeTally(){
  const rows=[
    {label:'SOULS  '+soulCount+' / '+souls.length, pts:actSoulPts},
    {label:'REAPED  '+Math.min(killCount,totalEnemies)+' / '+totalEnemies, pts:actKillPts},
  ];
  let bonus=0, topTime=false;
  const br=timeBrackets(stageIdx);
  let tb=0;
  for (let i=0;i<br.length;i++){ if (actTime<=br[i][0]){ tb=br[i][1]; topTime=(i===0); break; } }
  if (!gotHit){ rows.push({label:'PERFECT RUN', pts:5000, bonus:true}); bonus+=5000; }
  if (soulCount>=souls.length){ rows.push({label:'ALL SOULS', pts:2000, bonus:true}); bonus+=2000; }
  const reapAll=killCount>=totalEnemies;
  if (reapAll){ rows.push({label:'FULL REAP', pts:2000, bonus:true}); bonus+=2000; }
  const mm=Math.floor(actTime/60), ss=Math.floor(actTime%60);
  rows.push({label:'TIME  '+mm+':'+(ss<10?'0':'')+ss, pts:tb, bonus:true});
  bonus+=tb;
  if (topTime && reapAll && soulCount>=souls.length){
    rows.push({label:'KILLER BONUS', pts:10000, killer:true}); bonus+=10000;
  }
  const total=actScore+bonus;
  tally={rows, total, t:0, skip:false, done:false, hold:0};
  const aid=STAGE_ACT[stageIdx];
  if (aid){
    const r=prog.acts[aid]||(prog.acts[aid]={});
    r.done=true;
    r.hi=Math.max(r.hi||0, total);
    r.souls=Math.max(r.souls||0, soulCount);
    r.maxSouls=souls.length;
    if(r.secret===undefined) r.secret=null;   // reserved: cReapY stone / secret collectible
    prog.soulz=(prog.soulz||0)+soulCount;
    saveProg();
  }
}
let chkFx=[];
const PB={x:14,y:92,w:40,h:32};
function menuPanel(title, items, sub, titleColor){
  ctx.fillStyle='rgba(8,5,18,.72)'; ctx.fillRect(0,0,W,H);
  const mw=310, ih=46, gap=13, mh=86+items.length*(ih+gap)+(sub?26:0);
  const mx=W/2-mw/2, my=H/2-mh/2;
  ctx.fillStyle='rgba(22,16,44,.97)'; roundRect(mx,my,mw,mh,14); ctx.fill();
  ctx.strokeStyle='rgba(150,140,255,.5)'; ctx.lineWidth=1.5; ctx.stroke();
  ctx.fillStyle=titleColor||'#eae6ff'; ctx.font='bold 26px sans-serif'; ctx.textAlign='center';
  ctx.fillText(title, W/2, my+44);
  menuRects=[];
  if (panelSel>=items.length) panelSel=0;
  items.forEach((it,i)=>{
    const by=my+66+i*(ih+gap);
    const hot=(i===panelSel);
    ctx.fillStyle=hot?'rgba(200,251,80,.16)':'rgba(155,140,255,.16)'; roundRect(mx+26,by,mw-52,ih,10); ctx.fill();
    ctx.strokeStyle=hot?'#c8fb50':'rgba(155,140,255,.45)'; ctx.lineWidth=hot?2:1; ctx.stroke();
    ctx.fillStyle='#e8e6f5'; ctx.font='600 18px sans-serif';
    ctx.fillText(it.label, W/2, by+30);
    menuRects.push({x:mx+26,y:by,w:mw-52,h:ih,action:it.action});
  });
  if (sub){ ctx.fillStyle='rgba(200,190,255,.6)'; ctx.font='13px sans-serif'; ctx.fillText(sub, W/2, my+mh-16); }
  ctx.textAlign='left';
}
function drawTally(){
  if (!tally) return;
  const hasNext=stageIdx+1<window.STAGES.length;
  ctx.fillStyle='rgba(8,5,18,.78)'; ctx.fillRect(0,0,W,H);
  const mw=560, mx=W/2-mw/2;
  ctx.textAlign='center';
  ctx.font="44px Creepster, sans-serif"; ctx.fillStyle='#c8fb50';
  ctx.fillText('ACT '+ST.act+' CLEAR', W/2, 78);
  ctx.font='13px sans-serif'; ctx.fillStyle='rgba(200,190,255,.65)';
  ctx.fillText(ST.name, W/2, 100);
  const n=tally.rows.length;
  let total=0;
  for (let i=0;i<n;i++){
    const r=tally.rows[i];
    const age=tally.done?1:Math.max(0,Math.min(1,(tally.t-i*0.42)/0.4));
    if (age<=0) break;
    const y=136+i*32;
    const shown=Math.round(r.pts*age);
    total+= tally.done? r.pts : shown;
    ctx.globalAlpha=Math.min(1,age*2);
    ctx.textAlign='left';
    ctx.font=r.killer?'bold 20px sans-serif':'600 17px sans-serif';
    ctx.fillStyle=r.killer?'#ffd84d':(r.bonus?'#7fe0ff':'#e8e6f5');
    ctx.fillText(r.label, mx+30, y);
    ctx.textAlign='right';
    ctx.fillText(shown.toLocaleString('en-US'), mx+mw-30, y);
    ctx.globalAlpha=1;
  }
  const ty=136+n*32+18;
  ctx.strokeStyle='rgba(150,140,255,.5)'; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.moveTo(mx+24,ty-26); ctx.lineTo(mx+mw-24,ty-26); ctx.stroke();
  ctx.textAlign='left'; ctx.font='bold 24px sans-serif'; ctx.fillStyle='#c8fb50';
  ctx.fillText('TOTAL', mx+30, ty+4);
  ctx.textAlign='right';
  ctx.fillText(total.toLocaleString('en-US'), mx+mw-30, ty+4);
  if (banked>0){
    ctx.font='13px sans-serif'; ctx.fillStyle='rgba(200,190,255,.65)';
    ctx.fillText('RUN  '+(banked+total).toLocaleString('en-US'), mx+mw-30, ty+26);
  }
  ctx.textAlign='center'; ctx.font='14px sans-serif'; ctx.fillStyle='rgba(232,230,245,.8)';
  menuRects=[];
  if (tally.done){
    if (true){
      const pu=0.55+0.45*Math.sin(gt*4);
      ctx.fillStyle='rgba(200,251,80,'+pu.toFixed(2)+')';
      ctx.fillText('Return to the overworld  ·  tap to continue', W/2, ty+56);
    } else {
      const bw2=170, bh2=40, by2=ty+44;
      if (panelSel>=2) panelSel=0;
      [['Replay Act',()=>{ loadStage(stageIdx); }],['Characters',()=>{ mode='select'; }]].forEach((it,k)=>{
        const bx2=W/2-bw2-12+k*(bw2+24);
        const hot=(k===panelSel);
        ctx.fillStyle=hot?'rgba(200,251,80,.16)':'rgba(155,140,255,.16)'; roundRect(bx2,by2,bw2,bh2,10); ctx.fill();
        ctx.strokeStyle=hot?'#c8fb50':'rgba(155,140,255,.45)'; ctx.lineWidth=hot?2:1; ctx.stroke();
        ctx.fillStyle='#e8e6f5'; ctx.font='600 16px sans-serif';
        ctx.fillText(it[0], bx2+bw2/2, by2+26);
        menuRects.push({x:bx2,y:by2,w:bw2,h:bh2,action:it[1]});
      });
      ctx.font='12px sans-serif'; ctx.fillStyle='rgba(200,190,255,.55)';
      ctx.fillText('More acts coming soon', W/2, by2+64);
    }
  } else {
    ctx.fillText('tap to skip', W/2, ty+56);
  }
  ctx.textAlign='left';
}
function drawTitleCard(){
  if (titleT>2.7) return;
  const t=titleT;
  let inK=Math.min(1,t/0.5); inK=1-Math.pow(1-inK,3);
  let outK=t>2.1?Math.min(1,(t-2.1)/0.5):0; outK=outK*outK*(3-2*outK);
  const offL=-W*1.1*(1-inK)+W*1.15*outK;       // main panel: left -> in -> exits right
  const offR= W*1.1*(1-inK)-W*1.15*outK;       // act badge: right -> in -> exits left
  // main skewed panel
  ctx.save(); ctx.translate(offL,0);
  ctx.fillStyle='rgba(14,9,30,0.93)';
  ctx.beginPath(); ctx.moveTo(-90,118); ctx.lineTo(W*0.80,118); ctx.lineTo(W*0.72,252); ctx.lineTo(-90,252); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#c8fb50';
  ctx.beginPath(); ctx.moveTo(W*0.80,118); ctx.lineTo(W*0.835,118); ctx.lineTo(W*0.755,252); ctx.lineTo(W*0.72,252); ctx.closePath(); ctx.fill();
  ctx.fillStyle='rgba(155,140,255,0.85)';
  ctx.beginPath(); ctx.moveTo(W*0.835,118); ctx.lineTo(W*0.85,118); ctx.lineTo(W*0.77,252); ctx.lineTo(W*0.755,252); ctx.closePath(); ctx.fill();
  ctx.textAlign='left';
  ctx.font="58px Creepster, sans-serif";
  ctx.fillStyle='#1a1133'; ctx.fillText(ST.name, 64, 202);
  ctx.fillStyle='#eae6ff'; ctx.fillText(ST.name, 60, 198);
  ctx.restore();
  // act badge strip
  ctx.save(); ctx.translate(offR,0);
  ctx.fillStyle='rgba(14,9,30,0.93)';
  ctx.beginPath(); ctx.moveTo(W*0.30,268); ctx.lineTo(W+90,268); ctx.lineTo(W+90,330); ctx.lineTo(W*0.265,330); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#7fe0ff';
  ctx.beginPath(); ctx.moveTo(W*0.30,268); ctx.lineTo(W*0.318,268); ctx.lineTo(W*0.283,330); ctx.lineTo(W*0.265,330); ctx.closePath(); ctx.fill();
  ctx.font="40px Creepster, sans-serif";
  ctx.fillStyle='#c8fb50'; ctx.fillText('ACT  '+ST.act, W*0.40, 312);
  // soul orb spinning beside the act numeral
  drawSoulFx(W*0.34, 299, 9, 1, 2.4);
  ctx.restore();
}
function drawPauseBtn(){
  ctx.fillStyle='rgba(20,16,36,.55)'; roundRect(PB.x,PB.y,PB.w,PB.h,8); ctx.fill();
  ctx.strokeStyle='rgba(150,140,255,.4)'; ctx.lineWidth=1; ctx.stroke();
  ctx.fillStyle='#cfd0e8'; ctx.fillRect(PB.x+12,PB.y+8,5,16); ctx.fillRect(PB.x+23,PB.y+8,5,16);
}
function menuOpen(){ return paused || (p && p.dead && p.deadT>2.3) || (p && p.won); }
const SFXLIST=['sfx_slash','sfx_bolt','sfx_jump','sfx_soul','sfx_shriek','sfx_meleehit','sfx_projhit','sfx_die','sfx_wing','sfx_hurt','sfx_ignite','sfx_healthup','sfx_wportal','sfx_dportal','sfx_msel','sfx_mtog','sfx_gspear','sfx_rwhoosh','sfx_zswing','sfx_run','sfx_zsee','sfx_ksee','sfx_count','sfx_gsee','sfx_pdie'];
function bootIntoWorld(){ primeAudio(); SFXLIST.forEach(loadSfx); banked=0; document.querySelector('.touch').classList.toggle('ding', isDing(chosen)); enterWorld(false); }
function startGame(ck){
  if (selMode==='skin'){ chosen=ck; saveProg(); }
  else {
    saves.slots[slotIdx]={chosen:ck,acts:{},heroAt:'cem',soulz:0,created:Date.now(),played:Date.now()};
    bindSlot(slotIdx); saveAll();
  }
  bootIntoWorld();
}
function activateSlot(i){
  const sl=saves.slots[i];
  if (sl){ bindSlot(i); playSfx('sfx_msel'); bootIntoWorld(); }
  else { slotIdx=i; selMode='new'; selFoc=0; selRow=0; mode='select'; playSfx('sfx_msel'); }
}
function reset(keep){
  const sx = keep && p ? p.spawn : 90;
  const sy = keep && p && p.spawnY!==undefined ? p.spawnY : (segFloorsAt(sx)[0]!==undefined?segFloorsAt(sx)[0]:GROUND);
  p = { x:sx, y:sy, vx:0, vy:0, facing:1, onGround:true, state:'idle', clock:0, attackT:0, won:false,
        hp:PMAXHP, hpShown:PMAXHP, inv:0, flash:0, dead:false, hurtT:0, diveT:0, diveRec:0, deadT:0, spawn:sx, spawnY:sy, standPlat:null, castT:0, castCd:0, castFired:true, winning:false, winT:0 };
  camX=Math.max(0,Math.min(WORLD-W,sx-W*0.38));
  camY=Math.max(0,Math.min(WORLDH-H,sy-H*0.62));
  zbits=[]; bolts=[]; impacts=[]; chkFx=[];
  if (!keep){
    soulCount=0; chkOn=CHK.map(()=>false);
    souls = SOUL_POS.map((s,i)=>({x:s[0],y:s[1],got:false,pop:0,ph:i*0.31}));
  }
  plats = PLAT_DEF.map(q=>({x:q.x!==undefined?q.x:q.x0, x0:q.x0, y:q.y, w:q.w, t:q.t, skin:q.skin, z:q.z,
    range:q.range||0, spd:q.spd||0, ph:0, dir:1, dxf:0,
    ct:0, falling:false, gone:false, dy:0, fv:0, rt:0}));
  const zspawn=ST.enemies;
  zombies = zspawn.map(z=>{ const kw=z[3]||'zombie', mh=(kw==='zgen')?3:((kw==='gob'||kw==='bd')?1:ZMAXHP);
    return {x:z[0], y:(z[4]!==undefined?z[4]:GROUND), t:Math.random(), facing:-1, state:'idle', atkT:0,
    dead:false, dieT:0, dframe:0, dstate:kw==='bd'?'walk':'idle', pdir:1, min:z[1], max:z[2], kw,
    hp:mh, maxhp:mh, hpShown:mh, hitCd:0, shown:0, aggro:false}; });
  const bspawn=ST.bats;
  bats = bspawn.map((b,i)=>({x:b[0], y:b[3], y0:b[3], t:Math.random()*3, ph:i*1.7, facing:-1, dir:i%2?1:-1,
    min:b[1], max:b[2], dead:false, dieT:0, yD:b[3], state:'idle', bt:0, biteCd:0}));
  hazReset();
}
function onReset(){ if (p && p.dead && !p.won) reset(true); else reset(); }
function hazReset(){ rocks=[]; volleys=[]; for(const h of HAZ){ h.cd=0; if(h.cds) h.cds=h.cds.map(()=>0); } }
let zbits=[];
const ZBIT_COLS=['#4a5d3a','#6b7d52','#8a8f96','#5d6168','#9aa4ab','#3a4030','#b9c0c6'];
function zbitsBurst(z,n){
  const b=zBodyBox(z), cols=z.kw==='zgen'?ZGEN_COLS:(z.kw==='gob'?GOB_COLS:(z.kw==='bd'?BD_COLS:ZBIT_COLS));
  for(let i=0;i<n;i++){
    zbits.push({x:b.x+Math.random()*b.w, y:b.y+Math.random()*b.h,
      vx:(Math.random()-0.5)*70, vy:-25-Math.random()*55,
      sz:2.5+Math.random()*3.5, life:0.55+Math.random()*0.5,
      t:0, c:cols[(Math.random()*cols.length)|0]});
  }
}
function zbitsEmit(z,dt){
  const a=SPR[z.kw][z.dstate], k=z.dieT/0.7, dy=-34*k;
  const cols=z.kw==='zgen'?ZGEN_COLS:(z.kw==='gob'?GOB_COLS:(z.kw==='bd'?BD_COLS:ZBIT_COLS));
  const x0=z.x-a.w*0.30, w0=a.w*0.6, y0=z.y-a.foots[0]+dy, h0=a.foots[0];
  let n=Math.min(4,Math.max(1,Math.round(dt*46)));
  while(n--) zbits.push({x:x0+Math.random()*w0, y:y0+Math.random()*h0,
    vx:(Math.random()-0.5)*55, vy:-30-Math.random()*45,
    sz:2+Math.random()*3.5, life:0.45+Math.random()*0.4,
    t:0, c:cols[(Math.random()*cols.length)|0]});
}
function updateZbits(dt){
  for(const b of zbits){ b.t+=dt; b.x+=b.vx*dt; b.y+=b.vy*dt; b.vy+=14*dt; }
  zbits=zbits.filter(b=>b.t<b.life);
}
function drawZbits(){
  for(const b of zbits){
    const sx=b.x-camX; if(sx<-20||sx>W+20) continue;
    const k=1-b.t/b.life;
    ctx.globalAlpha=Math.max(0,k*0.9);
    ctx.fillStyle=b.c;
    const s2=b.sz*(0.5+0.5*k);
    ctx.fillRect(sx-s2/2, b.y-s2/2, s2, s2);
  }
  ctx.globalAlpha=1;
}
const BD_COLS=['#b9c0c6','#8a8f96','#4a2a5a','#5d3a6b','#2c2f33','#d8dde2'];
const GOB_COLS=['#3f6b3a','#5d8f54','#7b1d2a','#5a1420','#8a8f96','#2c4a28'];
const ZGEN_COLS=['#15181f','#23262e','#383d49','#aac6d8','#8fb0c4','#5c1212'];
const BAT_COLS=['#241a30','#3a2a4a','#51356b','#1a1422','#6b4a8a','#43314f'];
function batBox(b){ return {x:b.x-36, y:b.yD-25, w:72, h:50}; }
function batBits(b,n){
  for(let i=0;i<n;i++) zbits.push({x:b.x-30+Math.random()*60, y:b.yD-20+Math.random()*40,
    vx:(Math.random()-0.5)*80, vy:-10-Math.random()*50,
    sz:2+Math.random()*3.5, life:0.45+Math.random()*0.4,
    t:0, c:BAT_COLS[(Math.random()*BAT_COLS.length)|0]});
}
function onSeg(x){ for(const s of SEG){ if(x>=s[0]&&x<=s[1]) return true; } return false; }
function segFloorsAt(x){ const out=[]; for(const s of SEG){ if(x>=s[0]&&x<=s[1]) out.push(s.length>2?s[2]:GROUND); } return out; }
function overlap(a,b){ return a.x<b.x+b.w && a.x+a.w>b.x && a.y<b.y+b.h && a.y+a.h>b.y; }
function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }
function worldWeaponBox(spr, fi, x, y, facing){
  const wb = spr.weapon ? spr.weapon[fi] : null; if(!wb) return null;
  const cx=spr.cxs[fi], ft=spr.foots[fi];
  let dx0=wb[0]-cx, dx1=wb[2]-cx, WX0, WX1;
  if (facing>0){ WX0=x+dx0; WX1=x+dx1; } else { WX0=x-dx1; WX1=x-dx0; }
  const WY0=(y-ft)+wb[1];
  return {x:Math.min(WX0,WX1), y:WY0, w:Math.abs(WX1-WX0), h:wb[3]-wb[1]};
}
function pBodyBox(){ return {x:p.x-20, y:p.y-94, w:40, h:86}; }
function zBodyBox(z){
  if (z.kw==='gob') return {x:z.x-19, y:z.y-78, w:38, h:74};
  if (z.kw==='bd')  return {x:z.x-18, y:z.y-100, w:36, h:96};
  return {x:z.x-24, y:z.y-112, w:48, h:104};
}
function pAttackBox(){ if(p.attackT<=0) return null; const reach=98,bh=110; const x=p.facing>0?p.x-8:p.x-reach+8; return {x,y:p.y-bh,w:reach,h:bh}; }
function pBody(){ return {x:p.x-24,y:p.y-92,w:48,h:92}; }
function zBody(z){ const a=SPR.zombie[z.state]; const bw=a.w*0.40, bh=a.foots[0]*0.82; return {x:z.x-bw/2,y:z.y-bh,w:bw,h:bh}; }
function zAtkBox(z){ const reach=78,bh=104; const x=z.facing>0?z.x-6:z.x-reach+6; return {x,y:z.y-bh,w:reach,h:bh}; }
const PW=52, PH=88;

// --- Editor test-play: boot straight into a draft level from localStorage ---
let testMode=false;
try{
  const q=new URLSearchParams(location.search);
  if(q.get('test')==='1'){
    const raw=localStorage.getItem('creapz_testlevel');
    if(raw){ const st=JSON.parse(raw); window.STAGES=window.STAGES||[]; window.STAGES.push(st);
      window.__testIdx=window.STAGES.length-1; testMode=true;
      try{ const sv=JSON.parse(localStorage.getItem('creapz_saves_v2')); const sl=sv&&sv.slots&&sv.slots.find(x=>x); chosen=(sl&&sl.chosen)||'default'; }catch(e){ chosen='default'; }
    }
  }
}catch(e){}
loadStage(testMode?window.__testIdx:0); mode='load'; titleT=99;
if (!window.SPRITES_INLINE){
  total++; TIMG=new Image(); TIMG.onload=()=>loaded++; TIMG.onerror=()=>loaded++; TIMG.src='./assets/title.png?v='+ASSET_VER;
  audioInit();
  if (AC){
    ['title','act1','act2'].forEach(k=>{ total++; getMusicBuf(k).then(()=>loaded++); });
    ['sfx_slash','sfx_bolt','sfx_jump','sfx_soul','sfx_shriek','sfx_meleehit','sfx_projhit','sfx_die','sfx_wing',
     'sfx_hurt','sfx_ignite','sfx_healthup','sfx_wportal','sfx_dportal','sfx_msel','sfx_mtog',
     'sfx_gspear','sfx_rwhoosh','sfx_zswing','sfx_run','sfx_zsee','sfx_ksee','sfx_count','sfx_gsee','sfx_pdie'].forEach(k=>{ total++; loadSfx(k).then(()=>loaded++); });
  }
}
let last=performance.now();
function loop(now){
  const dt=Math.min(0.05,(now-last)/1000); last=now; gt+=dt;
  document.querySelector('.touch').style.display = mode==='play'?'flex':'none';
  if (musicGain) musicGain.gain.value = (mode==='play' ? (paused?0.22:0.55) : 0.62) * musicVol;
  const moving = mode==='play' && !paused && p && !p.dead && !p.won && !p.winning && p.onGround && (p.state==='run'||p.state==='walk');
  setRunLoop(moving ? p.state : null);
  if ((mode==='select'||mode==='title'||mode==='world') && AC && AC.state==='running' && musicKey!=='title') playMusic('title');
  if (testMode && mode==='load' && loaded>=total){ bootTest(); }
  if (mode==='load') drawLoading();
  else if (mode==='title'){ titleFade=Math.min(1,titleFade+dt/1.1); drawTitle(); }
  else if (loaded<total) drawLoading();
  else if (mode==='slots') drawSlots();
  else if (mode==='select') drawSelect();
  else if (mode==='world'){
    ctx.setTransform(RS,0,0,RS,0,0);
    WORLDMODE.frame(dt, gt);
    if (fadeIn>0){ fadeIn-=dt; ctx.fillStyle='rgba(5,3,12,'+Math.min(1,fadeIn/0.5).toFixed(2)+')'; ctx.fillRect(0,0,W,H); }
  }
  else { update(dt); draw(); }
  requestAnimationFrame(loop);
}

function update(dt){
  if (titleT<3) titleT+=dt;
  if (fadeIn>0) fadeIn-=dt;
  if (paused) return;
  if (p.won){
    if (!tally) computeTally();
    tally.t+=dt;
    const shown=Math.min(tally.rows.length, Math.floor(tally.t/0.42)+1);
    if (!tally.skip && shown>(tally.sndRows||0)){ tally.sndRows=shown; const cs=playSfx('sfx_count',0.8); if(cs) countSrcs.push(cs); }
    const dur=(tally.rows.length-1)*0.42+0.4;   // = the exact moment the last row's numbers freeze
    if (!tally.done && (tally.skip || tally.t>=dur)){
      tally.done=true; panelSel=0;
      for (const cs of countSrcs){ try{ cs.stop(); }catch(e2){} }
      countSrcs.length=0;
    }
    if (tally.done){
      tally.hold+=dt;
      if (tally.hold>3.0 || fading>0){
        fading+=dt;
        if (fading>=0.65){ enterWorld(true); }
      }
    }
    return;
  }
  if (p.inv>0) p.inv-=dt;
  if (p.flash>0) p.flash-=dt;
  if (p.hurtT>0) p.hurtT-=dt;
  p.hpShown += (p.hp-p.hpShown)*Math.min(1,dt*8);
  if (p.dead){
    const pd0=p.deadT; p.deadT+=dt;
    if (pd0<0.45 && p.deadT>=0.45) playSfx('sfx_dportal');
    if (p.state!=='kneel'){ p.state='kneel'; p.clock=0; }
    p.clock+=dt;
    return;
  }
  actTime+=dt;
  if (p.winning){
    p.winT+=dt; p.inv=1;
    if (p.state!=='idle'){ p.state='idle'; p.clock=0; }
    p.clock+=dt;
    if (p.winT>1.0){
      const gw=SPR.goal, gy=GOALY+10-gw.h;
      const ty=gy+gw.vc[1]+52, k=Math.min(1,dt*4.5);
      p.x+=(GOAL_X-p.x)*k; p.y+=(ty-p.y)*k;
    }
    if (p.winT>1.9){ p.winning=false; p.won=true; }
    camX=Math.max(0,Math.min(WORLD-W,p.x-W*0.38));
    return;
  }
  // platforms tick
  for (const q of plats){
    q.dxf=0;
    if (q.t==='m'){ const ox=q.x; q.ph+=dt*q.spd*q.dir; if(q.ph>=1){q.ph=1;q.dir=-1;} else if(q.ph<=0){q.ph=0;q.dir=1;}
      q.x=q.x0+q.range*q.ph; q.dxf=q.x-ox; }
    else if (q.t==='c'){
      if (q.falling){ q.fv+=900*dt; q.dy+=q.fv*dt; q.rt+=dt;
        if (q.dy>30) q.gone=true;
        if (q.rt>3.2){ q.falling=false; q.gone=false; q.dy=0; q.fv=0; q.ct=0; q.rt=0; } }
      else if (q.ct>0){ q.ct+=dt; if (q.ct>0.55) q.falling=true; }
    }
  }
  // mover carries the player
  if (p.onGround && p.standPlat && p.standPlat.t==='m') p.x+=p.standPlat.dxf;
  // --- Aerial attack (Power Dive / Scythe Bash): melee button while midair ---
  if (diveReq){
    if (performance.now()-diveReq.t<150 && !p.onGround && p.diveT<=0 && p.diveRec<=0
        && p.hurtT<=0 && p.castT<=0 && p.attackT<=0 && !p.dead && !p.won && !p.winning){
      const ddir = diveReq.dir || (keys['ArrowLeft']?-1:keys['ArrowRight']?1:p.facing);
      const _dvx=isDing(chosen)?DIVE_VX:BASH_VX, _dvy=isDing(chosen)?DIVE_VY:BASH_VY;
      p.diveT=1; p.facing=ddir; p.vx=ddir*_dvx; p.vy=_dvy; diveGhosts=[]; playSfx('sfx_rwhoosh',0.9);
    }
    diveReq=null;
  }
  if (p.diveRec>0){ p.diveRec-=dt; p.vx=0; }
  if (p.diveT>0){ diveGhosts.push({x:p.x,y:p.y}); if(diveGhosts.length>9) diveGhosts.shift(); }
  else if (diveGhosts.length) diveGhosts.shift();
  const kneeling = p.onGround && (keys['ArrowDown']||keys['KeyS']) && p.attackT<=0 && p.castT<=0 && p.hurtT<=0;
  let dir=0;
  if (!kneeling){ if (keys['ArrowLeft']) dir=-1; else if (keys['ArrowRight']) dir=1; }
  const dc=dir<0?'ArrowLeft':'ArrowRight';
  const running=(dir!==0&&runHeld[dc])||keys['ShiftLeft']||keys['ShiftRight'];
  let inTar=false; for(const h of HAZ){ if(h.t==='tar' && p.onGround && p.x>=h.x && p.x<=h.x+h.w && Math.abs(p.y-h.y)<8){ inTar=true; break; } }
  const speed=(running?RUN:WALK)*(inTar?0.4:1);
  if (p.diveT<=0 && p.diveRec<=0){ if (dir!==0){ p.vx=dir*speed; p.facing=dir; } else p.vx=0; }
  if (!kneeling && p.diveRec<=0 && (keys['Space']||keys['ArrowUp'])&&p.onGround){ p.vy=JUMP*(inTar?0.78:1); p.onGround=false; playSfx('sfx_jump',0.55); }
  if (keys['KeyZ']&&p.attackT<=0&&p.diveT<=0&&p.diveRec<=0&&p.onGround&&SPR.chars[chosen].attack.weapon){
    p.attackT=SPR.chars[chosen].attack.frames/pfps('attack');
    playSfx(isDing(chosen)?'sfx_wing':'sfx_slash');
  }
  if (p.attackT>0){
    p.attackT-=dt;
    if (isDing(chosen)){
      const afr=Math.floor((SPR.chars[chosen].attack.frames/pfps('attack')-p.attackT)*pfps('attack'));
      if (afr>=2 && afr<=7) p.x+=p.facing*(p.onGround?2.7:1.8);
    }
  }
  if (p.castCd>0) p.castCd-=dt;
  if (p.muzzleT>0) p.muzzleT-=dt;
  if (keys['KeyX']&&p.castT<=0&&p.castCd<=0&&p.attackT<=0&&p.diveT<=0&&p.diveRec<=0){
    p.castT=Math.min(0.5, SPR.chars[chosen].cast.frames/pfps('cast')); p.castCd=0.55; p.castFired=false;
  }
  if (p.castT>0){
    p.castT-=dt;
    const cf0=Math.min(0.5, SPR.chars[chosen].cast.frames/pfps('cast'));
    const cfi=Math.min(SPR.chars[chosen].cast.frames-1, Math.floor((cf0 - p.castT)*pfps('cast')));
    const fireAt = chosen==='dingbat' ? 2 : 3;   // dingbat: bolt leaves on the open-mouth frame (11f @40fps)
    if (!p.castFired && cfi>=fireAt){
      p.castFired=true; p.muzzleT=0.14;
      if (isDing(chosen)){ bolts.push({x:p.x+p.facing*30, y:p.y-66, vx:p.facing*470, t:0, dead:false, kind:'wave'}); playSfx('sfx_shriek'); }
      else { bolts.push({x:p.x+p.facing*40, y:p.y-56, vx:p.facing*560, t:0, dead:false, kind:'bolt'}); playSfx('sfx_bolt'); }
    }
  }
  let nx=p.x+p.vx;
  for (const s of TSOLID){
    if (p.y>s.top+4 && (p.y-PH)<s.bot){
      if (nx+PW/2>s.l && nx-PW/2<s.r){
        if (p.x+PW/2<=s.l+0.5) nx=s.l-PW/2; else if (p.x-PW/2>=s.r-0.5) nx=s.r+PW/2;
      }
    }
  }
  p.x=nx;
  const prevFeet=p.y; if (p.diveT>0) p.vy=isDing(chosen)?DIVE_VY:BASH_VY; else p.vy+=GRAV; p.y+=p.vy;
  if (p.vy>=0){
    let cand=[]; for(const fy of segFloorsAt(p.x)) cand.push({t:fy,q:null});
    for (const s of SOLID){ if(p.x>=s.l&&p.x<=s.r) cand.push({t:s.top,q:null}); }
    for (const q of plats){ if(q.gone) continue; if(p.x>=q.x-8&&p.x<=q.x+q.w+8) cand.push({t:q.y+q.dy,q:q}); }
    cand=cand.filter(c=>prevFeet<=c.t+1&&p.y>=c.t).sort((a,b)=>a.t-b.t);
    if (cand.length){ p.y=cand[0].t; p.vy=0; p.onGround=true; p.standPlat=cand[0].q;
      if (cand[0].q && cand[0].q.t==='c' && cand[0].q.ct===0) cand[0].q.ct=0.0001;
    } else { p.onGround=false; p.standPlat=null; }
  } else { p.onGround=false; p.standPlat=null; }
  // hard-resolve overlap with solid terrain walls (accurate edges, no pass-through)
  for (const s of TSOLID){
    if (p.y>s.top+4 && (p.y-PH)<s.bot){
      const pl=p.x-PW/2, pr=p.x+PW/2;
      if (pr>s.l && pl<s.r){
        if (pr-s.l < s.r-pl) p.x=s.l-PW/2; else p.x=s.r+PW/2;
      }
    }
  }
  if (p.y>WORLDH+220){
    gotHit=true; playSfx('sfx_hurt');
    p.hp-=1; p.x=p.spawn; p.y=(p.spawnY!==undefined?p.spawnY:GROUND); p.vy=0; p.vx=0; p.onGround=true; p.standPlat=null;
    p.inv=1.2; p.flash=0.35; p.hurtT=0;
    if (p.hp<=0){ p.hp=0; p.dead=true; p.deadT=0; p.inv=0; p.flash=0; playSfx('sfx_pdie'); }
    camX=Math.max(0,Math.min(WORLD-W,p.x-W*0.38));
    camY=Math.max(0,Math.min(WORLDH-H,p.y-H*0.62));
  }
  for (let ci=0; ci<CHK.length; ci++){
    if (!chkOn[ci] && p.x>=CHK[ci][0]-10 && Math.abs(p.y-CHK[ci][1])<170){
      chkOn[ci]=true; p.spawn=CHK[ci][0]; p.spawnY=CHK[ci][1];
      chkFx.push({cx:CHK[ci][0], cgy:CHK[ci][1], t:0, hit:false}); playSfx('sfx_ignite',1.6);
    }
  }
  p.x=Math.max(18,Math.min(WORLD-18,p.x));
  if (p.x>=GOAL_X-24 && Math.abs(p.y-GOALY)<120 && p.onGround && !p.won && !p.winning){ p.winning=true; p.winT=0; p.vx=0; p.vy=0; playSfx('sfx_wportal'); }
  if (p.onGround && p.diveT>0){ p.diveT=0; p.diveRec=DIVE_REC; p.vx=0; p.clock=0; playSfx('sfx_meleehit',0.45); }
  let st;
  if (p.diveT>0) st='dive';
  else if (p.diveRec>0) st='kneel';
  else if (p.hurtT>0) st='hurt';
  else if (p.attackT>0) st='attack'; else if (p.castT>0) st='cast'; else if (kneeling && p.onGround) st='kneel'; else if(!p.onGround) st='jump';
  else if (p.vx!==0) st=running?'run':'walk'; else st='idle';
  if (st!==p.state) p.clock=0; p.state=st; p.clock+=dt;
  const pb={x:p.x-26,y:p.y-96,w:52,h:96};
  for (const s of souls){
    if (s.got){ if(s.pop<1) s.pop+=dt/0.28; continue; }
    const r=30, sb={x:s.x-r,y:s.y-r,w:2*r,h:2*r};
    if (overlap(pb,sb)){ s.got=true; s.pop=0; soulCount++; addScore(SOUL_PTS,'soul'); playSfx('sfx_soul'); }
  }
  // --- combat ---
  let pwb = (p.attackT>0) ? worldWeaponBox(SPR.chars[chosen].attack, curFrame(), p.x, p.y, p.facing) : null;
  for (const z of zombies){
    z.t+=dt; const zpx=z.x;
    if (z.hitCd>0) z.hitCd-=dt;
    if (z.shown>0) z.shown-=dt;
    z.hpShown += (z.hp-z.hpShown)*Math.min(1,dt*10);
    if (z.dead){ z.dieT+=dt; if(z.dieT<0.7) zbitsEmit(z,dt); continue; }
    const dx=p.x-z.x, ad=Math.abs(dx); z.facing = dx<0?-1:1;
    if (!z.aggro && ad<340 && !p.dead){
      z.aggro=true;
      if (z.kw==='bd') playSfx('sfx_zsee',0.7);
      else if (z.kw==='gob') playSfx('sfx_gsee',0.7);
      else if (z.kw==='zombie'||z.kw==='zgen') playSfx('sfx_ksee',0.7);
    } else if (z.aggro && ad>420) z.aggro=false;
    // player weapon strikes zombie body
    if (p.diveT>0 && z.hitCd<=0 && overlap(pBodyBox(), zBodyBox(z))){
      z.hp-=1; z.hitCd=0.6; z.shown=3; playSfx('sfx_meleehit',0.6);
      if (z.hp<=0){ z.dead=true; z.dieT=0; z.dstate=z.state; z.dframe=Math.floor(z.t*FZK[z.kw][z.state])%SPR[z.kw][z.state].frames; zbitsBurst(z,16); killCount++; addScore(KPTS[z.kw]||300); playSfx('sfx_die',0.7); continue; }
    }
    if (pwb && z.hitCd<=0 && overlap(pwb, zBodyBox(z))){
      z.hp-=1; z.hitCd=0.45; z.shown=3; playSfx('sfx_meleehit',0.6);
      z.x=clamp(z.x + (z.x<p.x?-12:12), z.min, z.max);
      if (z.hp<=0){ z.dead=true; z.dieT=0; z.dstate=z.state; z.dframe=Math.floor(z.t*FZK[z.kw][z.state])%SPR[z.kw][z.state].frames; zbitsBurst(z,16); killCount++; addScore(KPTS[z.kw]||300); playSfx('sfx_die',0.7); continue; }
    }
    // zombie behavior + its sword strikes player
    if (z.atkT>0){
      z.atkT-=dt; z.state='attack';
      const zfi=Math.floor(z.t*FZK[z.kw].attack)%SPR[z.kw].attack.frames;
      const zwb=worldWeaponBox(SPR[z.kw].attack, zfi, z.x, z.y, z.facing);
      if (zwb && p.inv<=0 && !p.dead && overlap(zwb, pBodyBox())) hurtPlayer(z.x, z.kw==='zgen'?2:1);
    } else if (ad<KRNG[z.kw]){ z.state='attack'; z.atkT=SPR[z.kw].attack.frames/FZK[z.kw].attack; if (z.kw==='gob') playSfx('sfx_gspear',0.8,0.18); else playSfx('sfx_zswing',0.8); }
    else if (ad<340){ z.state='walk'; z.x=clamp(z.x+z.facing*KSPD[z.kw], z.min, z.max); }
    else if (z.kw==='bd'){
      z.state='walk';
      z.x+=z.pdir*KSPD.bd;
      if (z.x>=z.max){ z.x=z.max; z.pdir=-1; } else if (z.x<=z.min){ z.x=z.min; z.pdir=1; }
      z.facing=z.pdir;
    }
    else z.state='idle';
    z.x=terrWallX(z.x, zpx, z.y, 16);
    if (p.inv<=0 && !p.dead && overlap(pBodyBox(), zBodyBox(z))) hurtPlayer(z.x);
  }
  for (const b of bats){
    b.t+=dt;
    if (b.dead){ b.dieT+=dt; if(b.dieT<0.45&&Math.random()<0.5) batBits(b,1); continue; }
    if (b.biteCd>0) b.biteCd-=dt;
    const tx=p.x, ty=p.y-58;
    const dxp=tx-b.x, dyp=ty-b.y, dist=Math.hypot(dxp,dyp);
    if (b.state==='bite'){
      b.bt+=dt;
      const bf=b.bt*BITE_FPS;
      let lv; if (bf<8) lv=1.2; else if (bf<15) lv=5.0; else if (bf<23) lv=0.35; else lv=-2.2;
      b.x+=b.facing*lv;
      if (bf<15){ const dy3=(p.y-58)-b.y; b.y+=Math.sign(dy3)*Math.min(1.6,Math.abs(dy3)); }
      if (b.bt>=SPR.bat.bite.frames/BITE_FPS){ b.state='idle'; b.biteCd=0.7; }
    } else if (dist<BAT_AGGRO && !p.dead){
      b.x+=Math.sign(dxp)*Math.min(BAT_CHASE,Math.abs(dxp));
      b.y+=Math.sign(dyp)*Math.min(1.5,Math.abs(dyp));
      if (Math.abs(dxp)>6) b.facing=Math.sign(dxp);
      if (dist<185 && b.biteCd<=0){ b.state='bite'; b.bt=0; if (Math.abs(dxp)>6) b.facing=Math.sign(dxp); playSfx('sfx_rwhoosh',0.8); }
    } else {
      b.x+=b.dir*BAT_PATROL;
      if (b.x>=b.max){ b.dir=-1; } else if (b.x<=b.min){ b.dir=1; }
      b.facing=b.dir;
      b.y+=(b.y0-b.y)*0.03;
    }
    b.x=clamp(b.x,b.min-40,b.max+40);
    b.y=clamp(b.y, b.y0-150, Math.min(WORLDH-60, b.y0+150));   // stay near patrol altitude (tall worlds: no cross-floor camping)
    b.yD=b.y+Math.sin(b.t*3.1+b.ph)*10;
    let bb=batBox(b);
    if (b.state==='bite' && b.bt>8/BITE_FPS && b.bt<23/BITE_FPS){ bb={x:bb.x+(b.facing<0?-30:0), y:bb.y-4, w:bb.w+30, h:bb.h+8}; }
    if (p.inv<=0 && !p.dead && overlap(pBodyBox(), bb)) hurtPlayer(b.x);
    if (p.diveT>0 && overlap(pBodyBox(), bb)){ b.dead=true; b.dieT=0; batBits(b,14); killCount++; addScore(KPTS.bat); playSfx('sfx_meleehit',0.6); playSfx('sfx_die',0.7); continue; }
    if (pwb && overlap(pwb, batBox(b))){ b.dead=true; b.dieT=0; batBits(b,14); killCount++; addScore(KPTS.bat); playSfx('sfx_meleehit',0.6); playSfx('sfx_die',0.7); }
  }
  for (const bo of bolts){
    if (bo.dead) continue;
    bo.t+=dt; bo.x+=bo.vx*dt;
    if (bo.t>1.1){ bo.dead=true; continue; }
    let hit=false;
    for (const s of SOLID){ if (bo.x>s.l-6&&bo.x<s.r+6&&bo.y>s.top){ hit=true; break; } }
    if (!hit) for (const z of zombies){
      if (z.dead) continue;
      const zb=zBodyBox(z);
      if (bo.x>zb.x-6&&bo.x<zb.x+zb.w+6&&bo.y>zb.y&&bo.y<zb.y+zb.h){
        z.hp-=1; z.shown=3; playSfx('sfx_projhit');
        z.x=clamp(z.x+(bo.vx>0?9:-9), z.min, z.max);
        if (z.hp<=0){ z.dead=true; z.dieT=0; z.dstate=z.state; z.dframe=Math.floor(z.t*FZK[z.kw][z.state])%SPR[z.kw][z.state].frames; zbitsBurst(z,16); killCount++; addScore(KPTS[z.kw]||300); playSfx('sfx_die',0.7); }
        hit=true; break;
      }
    }
    if (!hit) for (const b of bats){
      if (b.dead) continue;
      const bb2=batBox(b);
      if (bo.x>bb2.x-6&&bo.x<bb2.x+bb2.w+6&&bo.y>bb2.y&&bo.y<bb2.y+bb2.h){
        b.dead=true; b.dieT=0; batBits(b,14); killCount++; addScore(KPTS.bat); playSfx('sfx_projhit'); playSfx('sfx_die',0.7); hit=true; break;
      }
    }
    if (hit){
      bo.dead=true;
      impacts.push({x:bo.x, y:bo.y, t:0});
      const sc3=bo.kind==='wave'?['#d9a8ff','#b06cff','#8a3cff','#ffffff']:['#7fe0ff','#bfeaff','#3ca3ff','#ffffff'];
      for (let k2=0;k2<13;k2++) zbits.push({x:bo.x, y:bo.y, vx:(Math.random()-0.5)*220, vy:(Math.random()-0.5)*170,
        sz:1.8+Math.random()*2.8, life:0.28+Math.random()*0.25, t:0,
        c:sc3[(Math.random()*4)|0]});
    }
  }
  for (const im of impacts) im.t+=dt;
  impacts=impacts.filter(im=>im.t<0.32);
  for (const fx of chkFx){
    fx.t+=dt;
    if (!fx.hit && fx.t>0.62){ fx.hit=true; p.hp=Math.min(PMAXHP, p.hp+1); playSfx('sfx_healthup'); }
  }
  chkFx=chkFx.filter(fx=>fx.t<1.1);
  bolts=bolts.filter(bo=>!bo.dead||bo.t<1.2);
  updateHazards(dt);
  updateZbits(dt);
  camX=Math.max(0,Math.min(WORLD-W,p.x-W*0.38));
  const _cty=Math.max(0,Math.min(WORLDH-H,p.y-H*0.62));
  camY+=(_cty-camY)*Math.min(1,dt*7);
  if (Math.abs(_cty-camY)<0.4) camY=_cty;
}
function updateHazards(dt){
  const pb={x:p.x-22,y:p.y-82,w:44,h:82};
  for(const h of HAZ){
    if(h.cd>0) h.cd-=dt;
    if(h.t==='spike'){
      const sb={x:h.x+8,y:h.y-34,w:h.w-16,h:40};
      if(p.inv<=0 && !p.dead && !p.winning && overlap(pb,sb)) hurtPlayer(p.x);
    } else if(h.t==='spikeshot'){
      if(h.cd<=0 && !p.dead && !p.winning){
        const inTrig = p.x>h.tx && p.x<h.tx+h.tw && p.y>h.ty && (p.y-PH)<h.ty+h.th;
        if(inTrig){ const dir=h.dir||-1; for(let k=-1;k<=1;k++) volleys.push({x:h.x, y:h.y+k*40, vx:dir*7.2, dist:0, dead:false}); h.cd=1.8; playSfx('sfx_gspear',0.7); }
      }
    } else if(h.t==='rock'){
      // each spawn point along the span drops independently as the player passes under it
      for(let i=0;i<h.spawns.length;i++){
        if(h.cds[i]>0){ h.cds[i]-=dt; continue; }
        if(!p.dead && !p.winning && Math.abs(p.x-h.spawns[i])<58 && p.y>h.y+30){
          rocks.push({x:h.spawns[i], y:h.y, vy:0, delay:0.55, ang:Math.random()*6.28, spin:(Math.random()<0.5?-1:1)*(2.2+Math.random()*2), dead:false, dt2:0});
          h.cds[i]=2.2; playSfx('sfx_zswing',0.5);
        }
      }
    }
  }
  for(const r of rocks){
    if(r.dead){ r.dt2+=dt; continue; }
    if(r.delay>0){ r.delay-=dt; r.ang=(r.ang||0)+dt*1.5; continue; }   // telegraph: hover+shake at the ceiling before dropping
    r.vy=Math.min(15, r.vy+0.85); r.y+=r.vy; r.ang=(r.ang||0)+(r.spin||3)*dt+r.vy*0.012;
    const rb={x:r.x-20,y:r.y-20,w:40,h:40};
    if(p.inv<=0 && !p.dead && !p.winning && overlap(pb,rb)){ r.dead=true; r.dt2=0; hurtPlayer(r.x); playSfx('sfx_meleehit',0.7); rockBits(r); continue; }
    // land on the first floor beneath
    const floors=segFloorsAt(r.x); let land=null;
    for(const fy of floors){ if(fy>=r.y-22 && (land===null||fy<land)) land=fy; }
    if(land!==null && r.y>=land-10){ r.y=land-6; r.dead=true; r.dt2=0; playSfx('sfx_meleehit',0.45); rockBits(r); }
    else if(r.y>WORLDH+80){ r.dead=true; r.dt2=99; }
  }
  rocks=rocks.filter(r=>!r.dead||r.dt2<0.5);
  for(const v of volleys){
    if(v.dead) continue;
    v.x+=v.vx; v.dist+=Math.abs(v.vx);
    const vb={x:v.x-18,y:v.y-12,w:36,h:24};
    if(p.inv<=0 && !p.dead && !p.winning && overlap(pb,vb)){ v.dead=true; hurtPlayer(v.x); playSfx('sfx_meleehit',0.7); continue; }
    for(const s of TSOLID){ if(v.x>s.l-4 && v.x<s.r+4 && v.y>s.top && v.y<s.bot){ v.dead=true; break; } }
    if(v.dist>1500) v.dead=true;
  }
  volleys=volleys.filter(v=>!v.dead);
}
function rockBits(r){
  for(let i=0;i<10;i++) zbits.push({x:r.x,y:r.y,vx:(Math.random()-0.5)*150,vy:-40-Math.random()*90,
    sz:2.5+Math.random()*3.5,life:0.4+Math.random()*0.4,t:0,c:['#6b6470','#8a828f','#54505c','#9a93a0'][(Math.random()*4)|0]});
}
function drawSpikeProj(sx,sy,dir){
  if(SPIKESHOT_IMG.complete && SPIKESHOT_IMG.naturalWidth){ const hh=34, ww=hh*SPIKESHOT_IMG.naturalWidth/SPIKESHOT_IMG.naturalHeight;
    ctx.save(); ctx.translate(sx,sy); ctx.scale(dir,1); ctx.imageSmoothingEnabled=true; ctx.drawImage(SPIKESHOT_IMG,-ww/2,-hh/2,ww,hh); ctx.restore(); }
  else { ctx.fillStyle='#cfc8b6'; ctx.strokeStyle='#6b6457'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(sx+dir*16,sy); ctx.lineTo(sx-dir*12,sy-9); ctx.lineTo(sx-dir*12,sy+9); ctx.closePath(); ctx.fill(); ctx.stroke(); }
}
function drawVolleys(){ for(const v of volleys){ if(v.dead)continue; const sx=v.x-camX; if(sx<-40||sx>W+40)continue; drawSpikeProj(sx, v.y, v.vx<0?-1:1); } }
function drawOneHaz(h){
  if(h.t==='spikeshot'){ const lx=h.x-camX; if(lx<-60||lx>W+60) return; const dir=h.dir||-1; for(let k=-1;k<=1;k++) drawSpikeProj(lx, h.y+k*40, dir); return; }
  {
    const x0=h.x-camX, x1=h.x+h.w-camX; if(x1<-30||x0>W+30) return;
    if(h.t==='spike'){
      if(SPIKE_IMG.complete && SPIKE_IMG.naturalWidth){
        const th=72, tw=th*SPIKE_IMG.naturalWidth/SPIKE_IMG.naturalHeight;
        ctx.save(); ctx.beginPath(); ctx.rect(h.x-camX,h.y-th+18,h.w,th+6); ctx.clip();
        for(let x=h.x; x<h.x+h.w; x+=tw) ctx.drawImage(SPIKE_IMG, x-camX, h.y+22-th, tw, th);
        ctx.restore();
      } else {
        for(let cx2=h.x; cx2<h.x+h.w-6; cx2+=18){ const sx2=cx2-camX, hgt=20+((cx2*7)%10);
          ctx.fillStyle='#cfc8b6'; ctx.beginPath(); ctx.moveTo(sx2,h.y); ctx.lineTo(sx2+8,h.y-hgt); ctx.lineTo(sx2+16,h.y); ctx.fill(); }
      }
    } else if(h.t==='tar'){
      const td=(h.d||22), top=h.y-8, H2=td+8;
      ctx.save(); ctx.beginPath(); ctx.rect(h.x-camX,top,h.w,H2); ctx.clip();
      const g2=ctx.createLinearGradient(0,top,0,top+H2); g2.addColorStop(0,'#241a2e'); g2.addColorStop(1,'#0c0712');
      ctx.fillStyle=g2; ctx.fillRect(h.x-camX,top,h.w,H2);
      for(let i=0;i<h.w/40;i++){ const bx=h.x+20+i*40, ph=((gt*0.6+i*0.37)%1);
        const by=h.y+2-ph*9, r=2.5+2.5*Math.sin(gt*2+i);
        ctx.fillStyle='rgba(80,64,96,'+(0.5*(1-ph)).toFixed(2)+')'; ctx.beginPath(); ctx.arc(bx-camX,by,Math.max(1,r),0,7); ctx.fill(); }
      ctx.fillStyle='rgba(150,130,170,.18)'; ctx.fillRect(h.x-camX,h.y-9,h.w,2);
      ctx.restore();
    }
    // rock spawn point: invisible during gameplay (Alan) — nothing drawn
  }
}
function drawRocks(){
  for(const r of rocks){
    let sx2=r.x-camX; if(sx2<-50||sx2>W+50) continue;
    if(r.dead) continue;
    const wob = r.delay>0 ? (Math.random()-0.5)*4 : 0;   // shaking telegraph
    if(r.delay>0){ // dust trickle warning below the loosening rock
      ctx.fillStyle='rgba(180,160,140,'+(0.25+0.2*Math.sin(gt*20)).toFixed(2)+')';
      for(let d=0;d<3;d++){ ctx.fillRect(sx2-6+d*6+(Math.random()-0.5)*3, r.y+14+((gt*120+d*9)%26), 2, 4); }
    }
    if(ROCK_IMG.complete && ROCK_IMG.naturalWidth){
      const rs=46; ctx.save(); ctx.translate(sx2+wob,r.y); ctx.rotate(r.ang||0); ctx.drawImage(ROCK_IMG,-rs/2,-rs/2,rs,rs); ctx.restore();
    } else {
      ctx.fillStyle='#6b6470'; ctx.beginPath(); ctx.ellipse(sx2+wob,r.y,18,16,0,0,7); ctx.fill();
    }
  }
}
function drawOneTex(t){ const x0=t.x-camX; if(x0+t.w<-30||x0>W+30) return; ctx.imageSmoothingEnabled=true;
  if(t.t==='ceiling'){ if(CAVECEIL_IMG.complete && CAVECEIL_IMG.naturalWidth){ const dh=t.w*CAVECEIL_IMG.naturalHeight/CAVECEIL_IMG.naturalWidth; ctx.drawImage(CAVECEIL_IMG, x0, t.y, t.w, dh); } return; }
  if(t.t==='rockpile'){ if(ROCKPILE_IMG.complete && ROCKPILE_IMG.naturalWidth){ const dh=t.w*ROCKPILE_IMG.naturalHeight/ROCKPILE_IMG.naturalWidth; ctx.drawImage(ROCKPILE_IMG, x0, t.y-dh, t.w, dh); } return; } }
// shared z layering for the visual prop types (default keeps legacy order)
const ZBASE={terrace:0,tex:50000,plat:100000,haz:200000,obst:300000};
function zEff(kind,z,idx){ return (z!==undefined&&z!==null)?z:(ZBASE[kind]+idx); }
function drawWorldProps(){
  const props=[];
  SEG.forEach((s,i)=>props.push({z:zEff('terrace',s[4],i),f:()=>drawOneTerrace(s)}));
  TEX.forEach((t,i)=>props.push({z:zEff('tex',t.z,i),f:()=>drawOneTex(t)}));
  plats.forEach((q,i)=>props.push({z:zEff('plat',q.z,i),f:()=>drawOnePlat(q)}));
  HAZ.forEach((h,i)=>props.push({z:zEff('haz',h.z,i),f:()=>drawOneHaz(h)}));
  OBST.forEach((o,i)=>props.push({z:zEff('obst',o.z,i),f:()=>drawObstacle(o)}));
  props.sort((a,b)=>a.z-b.z);
  for(const p of props) p.f();
}
function hurtPlayer(srcX,dmg){
  if (p.diveT>0||p.diveRec>0) return;   // Power Dive i-frames (until normal stance resumes)
  gotHit=true; playSfx('sfx_hurt');
  p.hp-=(dmg||1); p.inv=1.0; p.flash=0.35;
  p.hurtT=0.45;  // single retro hurt still + flicker, fixed hit-stun
  const away=(p.x<srcX)?-1:1; p.vx=away*2; p.x+=away*8;
  if(p.onGround){ p.vy=-7; p.onGround=false; }
  if (p.hp<=0){ p.hp=0; p.dead=true; p.deadT=0; p.inv=0; p.flash=0; p.hurtT=0; playSfx('sfx_pdie'); }
}
function curFrame(){
  const a=SPR.chars[chosen][p.state], fps=pfps(p.state);
  if (p.state==='attack'||p.state==='hurt'||p.state==='kneel'||p.state==='cast'||p.state==='dive') return Math.min(a.frames-1, Math.floor(p.clock*fps));
  return Math.floor(p.clock*fps)%a.frames;
}

// ---- scenery ----

function pxf(wx,f){ return wx-camX*f; }
function tileDirt(x0,x1,topY,darken,f,hgt){
  const dt=SPR.dirt; if(!dt) return;
  const th=(hgt!==undefined)?hgt:(H-topY);
  if(th<=0) return;   // strips below the flat-world horizon: explicit height required (negative th = infinite tiling loop)
  const di=(DIRT_SEAM_IMG.complete&&DIRT_SEAM_IMG.naturalWidth)?DIRT_SEAM_IMG:dt.img;
  const TILE=84, tw=dt.w*TILE/dt.h, ty=TILE;   // seamless tile -> repeats both axes, no stretch; caller clips
  const fac=(f===undefined)?1:f;
  const off=(((camX*fac)%tw)+tw)%tw;
  for(let y=topY; y<topY+th; y+=ty)
    for(let x=-off; x<W+tw; x+=tw) ctx.drawImage(di, x, y, tw, ty);
  if(darken>0){ ctx.fillStyle='rgba(6,4,12,'+darken+')'; ctx.fillRect(x0,topY,x1-x0,th); }
}
function tileImage(img, topY, hgt, fac){
  if(!img||!img.complete||!img.naturalWidth||hgt<=0) return;
  const TILE=84, tw=img.naturalWidth*TILE/img.naturalHeight, ty=TILE;
  const fc=(fac===undefined)?1:fac, off=(((camX*fc)%tw)+tw)%tw;
  for(let y=topY; y<topY+hgt; y+=ty) for(let x=-off; x<W+tw; x+=tw) ctx.drawImage(img,x,y,tw,ty);
}
function drawCaveTopper(x0,x1,sgy){
  const img=CAVETOP_IMG; if(!img.complete||!img.naturalWidth) return;
  const TH=104, tw=TH*img.naturalWidth/img.naturalHeight, topY=sgy-0.40*TH;
  ctx.save(); ctx.beginPath(); ctx.rect(x0,topY,x1-x0,TH); ctx.clip(); ctx.imageSmoothingEnabled=true;
  const off=((camX%tw)+tw)%tw;
  for(let x=-off; x<W+tw; x+=tw) ctx.drawImage(img,x,topY,tw,TH);
  ctx.restore();
}
function drawTreeImg(x,type){ const t=SPR.trees[type]; if(!t) return; ctx.drawImage(t.img, x-t.w/2, GROUND+10-t.h, t.w, t.h); }
function drawGraveBg(x,base,sc,cross){
  ctx.fillStyle='#211d33';
  if (cross){ const w=8*sc,ah=40*sc,aw=26*sc; ctx.fillRect(x-w/2,base-ah,w,ah); ctx.fillRect(x-aw/2,base-ah*0.72,aw,w); }
  else { const w=30*sc,hh=42*sc; ctx.beginPath(); ctx.moveTo(x-w/2,base); ctx.lineTo(x-w/2,base-hh+w/2); ctx.arc(x,base-hh+w/2,w/2,Math.PI,0); ctx.lineTo(x+w/2,base); ctx.closePath(); ctx.fill(); }
}
function drawFence(){
  const g=SPR.gate; if(!g) return; const f=0.82, gw=g.w, gh=g.h, baseY=GROUND+6;
  const off=((camX*f)%gw+gw)%gw;
  for (let x=-off; x<W+gw; x+=gw) ctx.drawImage(g.img, x, baseY-gh, gw, gh);
}
function drawSpikes(){
  if (WORLDH>H) return;   // tall worlds: gaps are shafts, not death pits
  for (let i=0;i<SEG.length-1;i++){
    const g0=SEG[i][1], g1=SEG[i+1][0];
    const x0=pxf(g0,1), x1=pxf(g1,1); if(x1<-20||x0>W+20) continue;
    for (let k=0; k*16<g1-g0-12; k++){
      const sx=x0+4+k*16+((k*37)%6), hgt=18+((k*53)%13);
      ctx.fillStyle=(k%2)?'#8e8674':'#aaa28e';
      ctx.beginPath(); ctx.moveTo(sx,H); ctx.lineTo(sx+7,H-hgt); ctx.lineTo(sx+14,H); ctx.fill();
      ctx.fillStyle='rgba(0,0,0,.35)';
      ctx.beginPath(); ctx.moveTo(sx+7,H-hgt); ctx.lineTo(sx+14,H); ctx.lineTo(sx+9,H); ctx.fill();
    }
  }
}
function drawOnePlat(q){
  const d=SPR.dirt, gr=SPR.grass, TH=26;
  if (q.t==='k'){ if (q.gone && q.dy>340) return; const x0=pxf(q.x,1), y=q.y+q.dy; if(x0+q.w<-30||x0>W+30) return;
    if (CAVEPLAT_IMG.complete && CAVEPLAT_IMG.naturalWidth){ const dh=q.w*CAVEPLAT_IMG.naturalHeight/CAVEPLAT_IMG.naturalWidth;
      ctx.imageSmoothingEnabled=true; ctx.drawImage(CAVEPLAT_IMG, x0, y-dh*0.46, q.w, dh); return; } }
  if (q.skin==='cave'){
    if (q.gone && q.dy>340) return;
    const x0=pxf(q.x,1), y=q.y+q.dy; if(x0+q.w<-30||x0>W+30) return;
    let jx=0, jy=0; if (q.t==='c' && q.ct>0 && !q.falling){ jx=(Math.random()-0.5)*3; jy=(Math.random()-0.5)*2; }
    ctx.save(); ctx.translate(jx,jy);
    ctx.save(); ctx.beginPath(); ctx.rect(x0,y,q.w,TH); ctx.clip();
    if (CAVEGND_IMG.complete && CAVEGND_IMG.naturalWidth){ const tw=CAVEGND_IMG.naturalWidth*(64/CAVEGND_IMG.naturalHeight); for(let gx=x0; gx<x0+q.w; gx+=tw) ctx.drawImage(CAVEGND_IMG, gx, y-6, tw, 64); }
    else { ctx.fillStyle='#3a2a1a'; ctx.fillRect(x0,y,q.w,TH); }
    ctx.fillStyle='rgba(0,0,0,.42)'; ctx.fillRect(x0,y+TH-5,q.w,5);
    if (q.t==='c'){ ctx.strokeStyle='rgba(10,6,16,.6)'; ctx.lineWidth=1.5;
      for (let cx2=x0+14; cx2<x0+q.w-6; cx2+=26){ ctx.beginPath(); ctx.moveTo(cx2,y+3); ctx.lineTo(cx2-5,y+12); ctx.lineTo(cx2+3,y+TH-4); ctx.stroke(); } }
    ctx.restore();
    if (CAVETOP_IMG.complete && CAVETOP_IMG.naturalWidth){ const TT=48, tw=TT*CAVETOP_IMG.naturalWidth/CAVETOP_IMG.naturalHeight, ty=y-0.40*TT;
      ctx.save(); ctx.beginPath(); ctx.rect(x0,ty,q.w,TT); ctx.clip(); ctx.imageSmoothingEnabled=true;
      for(let gx=x0; gx<x0+q.w; gx+=tw) ctx.drawImage(CAVETOP_IMG, gx, ty, tw, TT); ctx.restore(); }
    ctx.strokeStyle='rgba(0,0,0,.5)'; ctx.lineWidth=2; ctx.strokeRect(x0,y,q.w,TH);
    ctx.restore();
    return;
  }
  {
    if (q.gone && q.dy>340) return;
    const x0=pxf(q.x,1), y=q.y+q.dy; if(x0+q.w<-30||x0>W+30) return;
    let jx=0, jy=0;
    if (q.t==='c' && q.ct>0 && !q.falling){ jx=(Math.random()-0.5)*3; jy=(Math.random()-0.5)*2; }
    ctx.save(); ctx.translate(jx,jy);
    ctx.save(); ctx.beginPath(); ctx.rect(x0,y,q.w,TH); ctx.clip();
    if (d){ const tw=d.w*(64/d.h); for(let gx=x0; gx<x0+q.w; gx+=tw) ctx.drawImage(d.img, gx, y-6, tw, 64); }
    else { ctx.fillStyle='#2a2138'; ctx.fillRect(x0,y,q.w,TH); }
    ctx.fillStyle='rgba(0,0,0,.42)'; ctx.fillRect(x0,y+TH-5,q.w,5);
    if (q.t==='c'){
      ctx.strokeStyle='rgba(10,6,16,.6)'; ctx.lineWidth=1.5;
      for (let cx2=x0+14; cx2<x0+q.w-6; cx2+=26){
        ctx.beginPath(); ctx.moveTo(cx2,y+3); ctx.lineTo(cx2-5,y+12); ctx.lineTo(cx2+3,y+TH-4); ctx.stroke();
      }
    }
    ctx.restore();
    if (gr){
      const gy=y-Math.round(gr.h*0.55);
      ctx.save(); ctx.beginPath(); ctx.rect(x0,gy,q.w,gr.h); ctx.clip();
      for (let gx=x0; gx<x0+q.w; gx+=gr.w) ctx.drawImage(gr.img, gx, gy, gr.w, gr.h);
      ctx.restore();
    }
    ctx.strokeStyle='rgba(0,0,0,.5)'; ctx.lineWidth=2; ctx.strokeRect(x0,y,q.w,TH);
    ctx.restore();
  }
}
function drawChecks(){
  const st=SPR.chkst; if(!st) return;
  for (let i=0;i<CHK.length;i++){
    const sx=pxf(CHK[i][0],1); if(sx<-120||sx>W+120) continue;
    const on=chkOn[i], gy=CHK[i][1]+8-st.h, x0=sx-st.w/2;
    ctx.globalAlpha = on?1:0.82;
    ctx.drawImage(st.img, x0, gy, st.w, st.h);
    ctx.globalAlpha = 1;
    if (on){
      // flickering brazier fire: alpha + scale dance per flame
      for (const fp of st.fpts){
        const fx=x0+fp[0], fy2=gy+fp[1];
        const r=12+3.5*Math.sin(gt*12.5+fx*0.7)+2*Math.sin(gt*29+fx);
        const grd=ctx.createRadialGradient(fx,fy2,1,fx,fy2,Math.max(6,r*2));
        grd.addColorStop(0,'rgba(225,160,255,.42)'); grd.addColorStop(0.5,'rgba(170,80,255,.22)');
        grd.addColorStop(1,'rgba(120,40,220,0)');
        ctx.fillStyle=grd; ctx.beginPath(); ctx.arc(fx,fy2,Math.max(6,r*2),0,7); ctx.fill();
      }
      const fl=0.78+0.16*Math.sin(gt*11+i*2.1)+0.06*Math.sin(gt*27+i*5);
      const sc2=1+0.05*Math.sin(gt*13+i);
      ctx.save(); ctx.globalAlpha=Math.max(0,Math.min(1,fl));
      ctx.translate(x0+st.w/2, gy+st.h);
      ctx.scale(1, sc2);
      ctx.drawImage(st.fimg, -st.w/2, -st.h, st.w, st.h);
      ctx.restore(); ctx.globalAlpha=1;
    }
  }
}
function drawOneTerrace(s){
  const crypt=(ST.theme==='crypt'), kind=(s[6]||'cemetery');
  {
    const x0=pxf(s[0],1),x1=pxf(s[1],1); if(x1<-20||x0>W+20) return;
    const sgy=s.length>2?s[2]:GROUND;
    const bot=s.length>2?sgy+(s[3]||130):H;
    if (sgy-camY>H+40 || bot-camY<-40) return;
    ctx.save(); ctx.beginPath(); ctx.rect(x0,sgy,x1-x0,bot-sgy); ctx.clip();
    if (kind==='cave' && CAVEGND_IMG.complete && CAVEGND_IMG.naturalWidth){
      tileImage(CAVEGND_IMG, sgy, bot-sgy, 1);
      ctx.fillStyle='rgba(8,5,16,0.16)'; ctx.fillRect(x0,sgy,x1-x0,bot-sgy);
    } else {
      tileDirt(x0,x1,sgy,0,undefined,bot-sgy);
      if (crypt){ ctx.fillStyle='rgba(34,22,52,0.55)'; ctx.fillRect(x0,sgy,x1-x0,bot-sgy);
        ctx.fillStyle='rgba(224,169,60,0.10)'; ctx.fillRect(x0,sgy,x1-x0,10); }
    }
    ctx.restore();
    if (kind==='cave') drawCaveTopper(x0,x1,sgy);
    if (SPR.grass && !crypt && kind!=='cave'){
      const gr=SPR.grass, gy=sgy-Math.round(gr.h*0.55);
      ctx.save(); ctx.beginPath(); ctx.rect(x0,gy,x1-x0,gr.h); ctx.clip();
      const goff=((camX%gr.w)+gr.w)%gr.w;
      for (let gx=-goff; gx<W+gr.w; gx+=gr.w) ctx.drawImage(gr.img, gx, gy, gr.w, gr.h);
      ctx.restore();
    }
    if (crypt && kind!=='cave'){ // embedded amber crystals glowing on the terrace face — WORLD-anchored
      for (let wx2=s[0]+22; wx2<s[1]-14; wx2+=74){
        const cx2=pxf(wx2,1); if(cx2<-30||cx2>W+30) continue;
        const cy3=sgy+34+((wx2*13)%52), r3=3+((wx2*7)%3);
        const a3=0.45+0.25*Math.sin(gt*2.2+wx2*0.13);
        const gr3=ctx.createRadialGradient(cx2,cy3,0.5,cx2,cy3,r3*3.4);
        gr3.addColorStop(0,'rgba(248,206,98,'+a3.toFixed(2)+')');
        gr3.addColorStop(0.45,'rgba(224,169,60,'+(a3*0.5).toFixed(2)+')');
        gr3.addColorStop(1,'rgba(224,169,60,0)');
        ctx.fillStyle=gr3; ctx.beginPath(); ctx.arc(cx2,cy3,r3*3.4,0,7); ctx.fill();
        ctx.fillStyle='rgba(248,210,110,'+(0.5+a3*0.3).toFixed(2)+')';
        ctx.beginPath(); ctx.arc(cx2,cy3,r3,0,7); ctx.fill();
      }
    }
    ctx.fillStyle='rgba(0,0,0,.4)'; ctx.fillRect(x0,sgy,3,bot-sgy); ctx.fillRect(x1-3,sgy,3,bot-sgy);
  }
}
function terrWallX(nx, px, y, hw){
  for(const s of TSOLID){
    if(y>s.top+6 && (y-50)<s.bot && nx+hw>s.l && nx-hw<s.r){
      if(px+hw<=s.l+1) nx=s.l-hw; else if(px-hw>=s.r-1) nx=s.r+hw;
    }
  }
  return nx;
}
function drawObstacle(o){
  const sx=pxf(o.x,1); if(sx<-90||sx>W+90) return;
  const im=SPR.obst[o.type]; ctx.imageSmoothingEnabled=true;
  ctx.drawImage(im.img, sx-o.w/2, o.gy-o.h, o.w, o.h);
}
// self-drifting clouds, two depth layers (right -> left, independent of camera)
const CLOUDS=Array.from({length:10},(_,i)=>{
  const near=i>=6;
  return { x0:(i*419)%(W+340), y: near? 26+((i*73)%140) : 14+((i*61)%110),
    s: near? 0.85+((i*37)%55)/100 : 0.38+((i*29)%30)/100,
    al: near? 0.34+((i*13)%14)/100 : 0.18+((i*11)%10)/100,
    spd: near? 17+((i*23)%12) : 7+((i*17)%6), near };
});
function drawClouds(nearLayer){
  const c=SPR.cloud; if(!c) return;
  const span=W+360;
  for (const cl of CLOUDS){
    if (cl.near!==nearLayer) continue;
    const x=((cl.x0 - gt*cl.spd) % span + span) % span - 180;
    const dw=c.w*cl.s, dh=c.h*cl.s;
    if (x+dw<-10||x>W+10) continue;
    ctx.globalAlpha=cl.al;
    ctx.drawImage(c.img, x, cl.y, dw, dh);
    ctx.globalAlpha=1;
  }
}
function skyBG(){
  const g=ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,'#0d0a22'); g.addColorStop(.55,'#241844'); g.addColorStop(1,'#3a2152');
  ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  ctx.fillStyle='rgba(255,255,255,.6)';
  for (const s of STARS){ const x=((pxf(s[0],0.15)%W)+W)%W; ctx.fillRect(x,s[1],s[2],s[2]); }
  drawClouds(false);
  const mX=W-150; const gg=ctx.createRadialGradient(mX,96,10,mX,96,120);
  gg.addColorStop(0,'rgba(220,225,255,.35)'); gg.addColorStop(1,'rgba(220,225,255,0)');
  ctx.fillStyle=gg; ctx.beginPath(); ctx.arc(mX,96,120,0,7); ctx.fill();
  ctx.fillStyle='#eef0ff'; ctx.beginPath(); ctx.arc(mX,96,40,0,7); ctx.fill();
  ctx.fillStyle='rgba(150,150,200,.25)'; ctx.beginPath(); ctx.arc(mX+14,86,9,0,7); ctx.arc(mX-10,104,6,0,7); ctx.fill();
  drawClouds(true);
  ctx.fillStyle='#1a1233';
  for (let i=0;i<6;i++){ const hx=pxf(i*620,0.3); ctx.beginPath(); ctx.ellipse(hx+200,GROUND+40,300,150,0,Math.PI,0); ctx.fill(); }
  if (SPR.dirt) tileDirt(0,W,GROUND,0.5,0.42);   // bg earth scrolls with the tree layer
  for (const t of TREES){ const x=pxf(t.x,0.42); if(SPR.trees && x>-110 && x<W+110) drawTreeImg(x, t.big?'big':'small'); }
  for (const [gx,sc,cr] of GRAVES_BG){ const x=pxf(gx,0.6); if(x>-40&&x<W+40) drawGraveBg(x,GROUND+4,sc,cr); }
  const fy=GROUND-30;
  for (let k=0;k<2;k++){ ctx.fillStyle=k?'rgba(150,140,200,.05)':'rgba(120,120,170,.07)'; const off=(gt*(10+k*8))%(W+200); for(let fx=-off;fx<W;fx+=W+120) ctx.fillRect(fx,fy-k*16,W+200,60); }
}
function drawBackgrounds(){
  for(const b of BG){ const img=BG_IMGS[b.t]; if(!img||!img.complete||!img.naturalWidth) continue;
    const par=(b.par!==undefined&&b.par!==null)?b.par:0.3;
    const iw=img.naturalWidth, ih=img.naturalHeight, sc=Math.max(W/iw,H/ih), dw=iw*sc, dh=ih*sc;
    let ox=(-camX*par)%dw; if(ox>0)ox-=dw; let oy=(-camY*par)%dh; if(oy>0)oy-=dh;
    ctx.globalAlpha=(b.alpha!==undefined)?b.alpha:1;
    for(let y=oy; y<H; y+=dh) for(let x=ox; x<W; x+=dw) ctx.drawImage(img, x, y, dw, dh);
    ctx.globalAlpha=1;
  }
}
function caveBG(){
  const g=ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,'#160f26'); g.addColorStop(1,'#0a0712');
  ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  for(let i=0;i<26;i++){ // amber torch-glow motes drifting in the dark, deep parallax both axes
    const span=W+260;
    const wx=((((i*397)%span)-130+Math.sin(gt*0.5+i)*8-camX*0.35)%span+span)%span-130;
    const wy=((i*263)%Math.max(H,WORLDH));
    const sy2=wy-camY*0.85;
    if(sy2<-50||sy2>H+50) continue;
    const a=0.10+0.07*Math.sin(gt*2+i*1.7);
    const r=24+(i%4)*14;
    const gr2=ctx.createRadialGradient(wx,sy2,1,wx,sy2,r);
    gr2.addColorStop(0,'rgba(224,169,60,'+a.toFixed(2)+')'); gr2.addColorStop(1,'rgba(224,169,60,0)');
    ctx.fillStyle=gr2; ctx.beginPath(); ctx.arc(wx,sy2,r,0,7); ctx.fill();
  }
}
function vignette(){
  const vg=ctx.createRadialGradient(W/2,H/2,H*0.35,W/2,H/2,H*0.85);
  vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,.45)'); ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);
}
function drawCharSprite(ck,state,fi,cx,feetY,facing,scale,tint){
  const a=SPR.chars[ck][state]; const dw=a.w*scale, dh=a.h*scale;
  ctx.save();
  if (facing<0){ ctx.translate(cx,0); ctx.scale(-1,1); ctx.translate(-cx,0); }
  ctx.imageSmoothingEnabled=true;
  if (tint && tint>0){
    if (tcv.width!==a.sw||tcv.height!==a.sh){ tcv.width=a.sw; tcv.height=a.sh; }
    tctx.clearRect(0,0,a.sw,a.sh);
    tctx.drawImage(a.img, fi*a.sw,0,a.sw,a.sh, 0,0,a.sw,a.sh);
    tctx.globalCompositeOperation='source-atop';
    tctx.fillStyle='rgba(255,45,45,'+Math.min(0.6,tint)+')';
    tctx.fillRect(0,0,a.sw,a.sh);
    tctx.globalCompositeOperation='source-over';
    ctx.drawImage(tcv, 0,0,a.sw,a.sh, cx-a.cxs[fi]*scale, feetY-a.foots[fi]*scale, dw,dh);
  } else {
    ctx.drawImage(a.img, fi*a.sw,0,a.sw,a.sh, cx-a.cxs[fi]*scale, feetY-a.foots[fi]*scale, dw,dh);
  }
  ctx.restore();
}

let cardRects=[], dotRects=[];
let creaperSkin='default', dingSkin='dingbat';
const SKINC={default:'#7b5cff', green:'#3ddc5a', blue:'#2f7bff', red:'#e0504a', wraith:'#34343e', gilded:'#c49016', bone:'#ddd6c4', crimson:'#7a1a20'};
const DSKINC={dingbat:'#8a5a2a', ding_onyx:'#3c3c46', ding_frost:'#8fa8c8', ding_blood:'#7a1f24'};
const DORDER=['dingbat','ding_onyx','ding_frost','ding_blood'];
function drawSlots(){
  ctx.setTransform(RS,0,0,RS,0,0);
  camX=0; skyBG(); drawFence();
  ctx.fillStyle='#1d1730'; ctx.fillRect(0,GROUND,W,H-GROUND); ctx.fillStyle='#5a4499'; ctx.fillRect(0,GROUND,W,8);
  ctx.textAlign='center';
  ctx.fillStyle='#eae6ff'; ctx.font='bold 30px sans-serif'; ctx.fillText('Choose your Save', W/2, 56);
  ctx.fillStyle='#9b8cff'; ctx.font='14px sans-serif'; ctx.fillText('three stories, one realm  ·  arrows + space  ·  Esc for title', W/2, 82);
  const cw=272, gap=(W-3*cw)/4, cardY=104, cardH=250;
  slotRects=[]; delRects=[];
  for (let i=0;i<3;i++){
    const sl=saves.slots[i], cardX=gap+i*(cw+gap);
    slotRects.push({x:cardX,y:cardY,w:cw,h:cardH,i});
    ctx.fillStyle='rgba(20,16,40,.62)';
    ctx.strokeStyle = sl ? (isDing(sl.chosen)?(DSKINC[sl.chosen]||'#8a6a3a'):(SKINC[sl.chosen]||'#7b5cff')) : 'rgba(123,92,255,.4)';
    roundRect(cardX,cardY,cw,cardH,12); ctx.fill(); ctx.lineWidth=2; ctx.stroke();
    if (i===slotSel){
      const pu=0.55+0.45*Math.sin(gt*4);
      ctx.strokeStyle='rgba(200,251,80,'+pu.toFixed(2)+')'; ctx.lineWidth=3;
      roundRect(cardX-5,cardY-5,cw+10,cardH+10,15); ctx.stroke();
    }
    ctx.fillStyle='rgba(200,190,255,.5)'; ctx.font='bold 12px sans-serif';
    ctx.fillText('SLOT '+(i+1), cardX+cw/2, cardY+22);
    if (!sl){
      ctx.fillStyle='rgba(200,251,80,.85)'; ctx.font='52px sans-serif';
      ctx.fillText('+', cardX+cw/2, cardY+cardH/2+6);
      ctx.fillStyle='#9b8cff'; ctx.font='bold 15px sans-serif';
      ctx.fillText('NEW GAME', cardX+cw/2, cardY+cardH/2+44);
      continue;
    }
    const a=SPR.chars[sl.chosen]&&SPR.chars[sl.chosen].idle;
    if (a){
      const cfps=(SPR.chars[sl.chosen].fps&&SPR.chars[sl.chosen].fps.idle)||FPS.idle;
      const fi=Math.floor(gt*cfps)%a.frames;
      drawCharSprite(sl.chosen,'idle',fi, cardX+cw/2, cardY+150, 1, 110/a.h);
    }
    const st=slotStats(sl);
    ctx.fillStyle='#eae6ff'; ctx.font='bold 16px sans-serif';
    ctx.fillText(isDing(sl.chosen)?'Dingbat':'cReaper', cardX+cw/2, cardY+176);
    ctx.font='13px sans-serif'; ctx.fillStyle='#b9a6ff';
    ctx.fillText(st.acts+' / '+TOTAL_ACTS+' acts cleared  ·  '+(st.acts?st.pct:0)+'%', cardX+cw/2, cardY+200);
    ctx.fillStyle='#7fe0ff';
    ctx.fillText(st.soulz.toLocaleString('en-US')+' soulz banked', cardX+cw/2, cardY+221);
    const dx2=cardX+cw-30, dy2=cardY+10;
    delRects.push({x:dx2,y:dy2,w:22,h:22,i});
    ctx.strokeStyle='rgba(226,59,59,.75)'; ctx.lineWidth=1.5;
    roundRect(dx2,dy2,22,22,6); ctx.stroke();
    ctx.fillStyle='rgba(226,59,59,.85)'; ctx.font='bold 13px sans-serif';
    ctx.fillText('✕', dx2+11, dy2+16);
  }
  if (slotConfirm>=0){
    ctx.fillStyle='rgba(8,5,18,.78)'; ctx.fillRect(0,0,W,H);
    const mw=360, mh=150, mx=W/2-mw/2, my=H/2-mh/2;
    ctx.fillStyle='rgba(22,16,44,.97)'; roundRect(mx,my,mw,mh,14); ctx.fill();
    ctx.strokeStyle='rgba(226,59,59,.6)'; ctx.lineWidth=1.5; ctx.stroke();
    ctx.fillStyle='#e23b3b'; ctx.font='bold 20px sans-serif';
    ctx.fillText('Erase Slot '+(slotConfirm+1)+'?', W/2, my+38);
    ctx.fillStyle='rgba(200,190,255,.7)'; ctx.font='12px sans-serif';
    ctx.fillText('this story will be lost forever', W/2, my+60);
    confRects=[];
    [['ERASE',true],['KEEP',false]].forEach((it,k)=>{
      const bw2=130, bx2=W/2-bw2-14+k*(bw2+28), by2=my+mh-62;
      const hot=(confSel===k);
      ctx.fillStyle=hot?(k===0?'rgba(226,59,59,.25)':'rgba(200,251,80,.16)'):'rgba(155,140,255,.14)';
      roundRect(bx2,by2,bw2,42,10); ctx.fill();
      ctx.strokeStyle=hot?(k===0?'#e23b3b':'#c8fb50'):'rgba(155,140,255,.45)'; ctx.lineWidth=hot?2:1; ctx.stroke();
      ctx.fillStyle='#e8e6f5'; ctx.font='600 15px sans-serif';
      ctx.fillText(it[0], bx2+bw2/2, by2+27);
      confRects.push({x:bx2,y:by2,w:bw2,h:42,yes:it[1]});
    });
  }
  ctx.textAlign='left';
}
function drawSelect(){
  ctx.setTransform(RS,0,0,RS,0,0);
  camX=0; skyBG();
  drawFence();
  ctx.fillStyle='#1d1730'; ctx.fillRect(0,GROUND,W,H-GROUND); ctx.fillStyle='#5a4499'; ctx.fillRect(0,GROUND,W,8);
  ctx.textAlign='center';
  ctx.fillStyle='#eae6ff'; ctx.font='bold 30px sans-serif'; ctx.fillText(selMode==='skin'?'Choose your Skin':'Choose your Creap', W/2, 56);
  ctx.fillStyle='#9b8cff'; ctx.font='15px sans-serif';
  ctx.fillText(selMode==='skin'?'your character is bound to this story — colors only  ·  Esc returns to the realm':'tap a character to begin  ·  dots pick the colors  ·  or arrows + space', W/2, 82);
  const cw=250, gap=(W-2*cw)/3, cardY=104, cardH=246;
  cardRects=[]; dotRects=[];
  const roster=[{key:'creaper', label:'cReaper', ck:creaperSkin},{key:'dingbat', label:'Dingbat', ck:dingSkin}];
  for (let i=0;i<2;i++){
    const it=roster[i], cardX=gap+i*(cw+gap);
    const storyLocked = selMode==='skin' && ((it.key==='creaper')===isDing(chosen));
    if (storyLocked) ctx.globalAlpha=0.32;
    else cardRects.push({x:cardX,y:cardY,w:cw,h:cardH,key:it.key});
    ctx.fillStyle='rgba(20,16,40,.55)';
    ctx.strokeStyle = it.key==='creaper' ? (SKINC[creaperSkin]||'#5a4d8c') : (DSKINC[dingSkin]||'#8a6a3a');
    roundRect(cardX,cardY,cw,cardH,12); ctx.fill(); ctx.lineWidth=2; ctx.stroke();
    if (i===selFoc){
      const pu2=0.55+0.45*Math.sin(gt*4);
      ctx.strokeStyle='rgba(200,251,80,'+(selRow===0?pu2.toFixed(2):'0.35')+')'; ctx.lineWidth=3;
      roundRect(cardX-5,cardY-5,cw+10,cardH+10,15); ctx.stroke();
    }
    const a=SPR.chars[it.ck].idle;
    const cfps=(SPR.chars[it.ck].fps&&SPR.chars[it.ck].fps.idle)||FPS.idle;
    const fi=Math.floor(gt*cfps)%a.frames;
    const sc=150/a.h; drawCharSprite(it.ck,'idle',fi, cardX+cw/2, cardY+cardH-54, 1, sc);
    ctx.fillStyle='#eae6ff'; ctx.font='bold 18px sans-serif'; ctx.fillText(it.label, cardX+cw/2, cardY+cardH-16);
    if (storyLocked){
      ctx.globalAlpha=1;
      ctx.fillStyle='rgba(8,5,18,.55)'; roundRect(cardX,cardY,cw,cardH,12); ctx.fill();
      ctx.fillStyle='#8a82a6'; ctx.font='bold 14px sans-serif';
      ctx.fillText('BOUND TO ANOTHER STORY', cardX+cw/2, cardY+cardH/2);
      continue;
    }
    {
      // color dots floating above the character
      const isC=(it.key==='creaper');
      const list=isC?ORDER:DORDER, cmap=isC?SKINC:DSKINC, cur=isC?creaperSkin:dingSkin;
      const dn=list.length, dr2=dn>6?9:11, dgap=Math.min(34,(cw-50)/Math.max(1,dn-1)), dx0=cardX+cw/2-((dn-1)*dgap)/2, dy=cardY+34;
      for (let k=0;k<dn;k++){
        const sk=list[k], dx=dx0+k*dgap;
        dotRects.push({x:dx-13,y:dy-13,w:26,h:26,skin:sk,who:isC?'c':'d'});
        ctx.fillStyle=cmap[sk]||'#888';
        ctx.beginPath(); ctx.arc(dx,dy,dr2,0,7); ctx.fill();
        if (sk===cur){
          ctx.strokeStyle='#ffffff'; ctx.lineWidth=2.5;
          ctx.beginPath(); ctx.arc(dx,dy,dr2+4.5,0,7); ctx.stroke();
          if (selRow===1 && (isC?0:1)===selFoc){
            const pu3=0.55+0.45*Math.sin(gt*4);
            ctx.strokeStyle='rgba(200,251,80,'+pu3.toFixed(2)+')'; ctx.lineWidth=2.5;
            ctx.beginPath(); ctx.arc(dx,dy,dr2+8.5,0,7); ctx.stroke();
          }
        } else {
          ctx.strokeStyle='rgba(0,0,0,.45)'; ctx.lineWidth=1.5;
          ctx.beginPath(); ctx.arc(dx,dy,dr2,0,7); ctx.stroke();
        }
      }
    }
  }
  ctx.textAlign='left';
}
function roundRect(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
function lerpC(a,b,t){ return 'rgb('+Math.round(a[0]+(b[0]-a[0])*t)+','+Math.round(a[1]+(b[1]-a[1])*t)+','+Math.round(a[2]+(b[2]-a[2])*t)+')'; }
function hpColor(f){
  if (f>0.5){ const t=(f-0.5)*2; return {d:lerpC([225,175,45],[150,225,60],t), l:lerpC([245,205,70],[200,251,80],t)}; }
  const t=Math.max(0,f)*2; return {d:lerpC([150,25,35],[225,150,45],t), l:lerpC([220,55,55],[245,200,70],t)};
}
function drawSkullIcon(cx,cy,r){
  ctx.fillStyle='#e9e6f5'; ctx.beginPath(); ctx.arc(cx,cy-1,r,0,7); ctx.fill();
  ctx.fillRect(cx-r*0.55,cy+r*0.3,r*1.1,r*0.7);
  ctx.fillStyle='#1a1530'; ctx.beginPath(); ctx.arc(cx-r*0.42,cy-1,r*0.3,0,7); ctx.arc(cx+r*0.42,cy-1,r*0.3,0,7); ctx.fill();
}
function drawPlayerHP(){
  const x=14,y=14,w=196,h=26, bx=x+44, bw=w-46;
  ctx.fillStyle='rgba(16,12,30,.72)'; roundRect(x-2,y-2,w+6,h+6,9); ctx.fill();
  ctx.strokeStyle='rgba(150,140,255,.4)'; ctx.lineWidth=1; ctx.stroke();
  const hi=SPR.hpicon[chosen]||SPR.hpicon[isDing(chosen)?'dingbat':chosen];
  if (hi){ const ih=30, iw=hi.w*ih/hi.h; ctx.drawImage(hi.img, x+16-iw/2, y+h/2-ih/2, iw, ih); }
  ctx.fillStyle='rgba(0,0,0,.55)'; roundRect(bx,y+4,bw,h-8,6); ctx.fill();
  const frac=Math.max(0,Math.min(1,p.hpShown/PMAXHP));
  const low = frac<0.34 ? (0.55+0.45*Math.sin(gt*9)) : 0;
  const c=hpColor(frac);
  ctx.save(); roundRect(bx,y+4,bw,h-8,6); ctx.clip();
  const g=ctx.createLinearGradient(bx,0,bx+bw,0); g.addColorStop(0,c.d); g.addColorStop(1,c.l);
  ctx.fillStyle=g; ctx.fillRect(bx,y+4,bw*frac,h-8);
  ctx.fillStyle='rgba(255,255,255,.18)'; ctx.fillRect(bx,y+5,bw*frac,3);
  ctx.restore();
  ctx.strokeStyle='rgba(0,0,0,.55)'; ctx.lineWidth=2;
  for(let i=1;i<PMAXHP;i++){ const sn=bx+bw*i/PMAXHP; ctx.beginPath(); ctx.moveTo(sn,y+5); ctx.lineTo(sn,y+h-5); ctx.stroke(); }
  if(low>0){ ctx.strokeStyle='rgba(230,50,50,'+(0.25+0.5*low)+')'; ctx.lineWidth=2.5; roundRect(bx,y+4,bw,h-8,6); ctx.stroke(); }
}
function drawProgress(){
  const bx=W-200, bw=170, by=20, bh=9, frac=Math.min(1,p.x/GOAL_X);
  ctx.fillStyle='rgba(12,10,24,.72)'; roundRect(bx-3,by-3,bw+6,bh+6,6); ctx.fill();
  ctx.strokeStyle='rgba(127,224,255,.35)'; ctx.lineWidth=1.5; ctx.stroke();
  if (frac>0.004){
    const fw=bw*frac;
    const g=ctx.createLinearGradient(bx,0,bx+Math.max(fw,30),0);
    g.addColorStop(0,'#1c5bb8'); g.addColorStop(0.7,'#3ca3ff'); g.addColorStop(1,'#9fe9ff');
    ctx.save(); ctx.shadowColor='rgba(90,190,255,.9)'; ctx.shadowBlur=8;
    ctx.fillStyle=g; roundRect(bx,by,Math.max(fw,4),bh,Math.min(4,fw/2)); ctx.fill(); ctx.restore();
    const pu=0.6+0.4*Math.sin(gt*6);
    ctx.fillStyle='rgba(220,245,255,'+(0.5*pu).toFixed(3)+')';
    ctx.beginPath(); ctx.arc(bx+fw,by+bh/2,3.2+1.2*pu,0,7); ctx.fill();
  }
  for (let i=0;i<CHK.length;i++){
    const dx=bx+bw*(CHK[i][0]/GOAL_X), dy=by+bh/2;
    if (chkOn[i]){
      ctx.save(); ctx.shadowColor='rgba(127,224,255,1)'; ctx.shadowBlur=7;
      ctx.fillStyle='#bfeaff'; ctx.beginPath(); ctx.arc(dx,dy,3.6,0,7); ctx.fill(); ctx.restore();
      ctx.fillStyle='#ffffff'; ctx.beginPath(); ctx.arc(dx,dy,1.6,0,7); ctx.fill();
    } else {
      ctx.fillStyle='rgba(10,8,20,.92)'; ctx.beginPath(); ctx.arc(dx,dy,3.4,0,7); ctx.fill();
      ctx.strokeStyle='rgba(127,224,255,.45)'; ctx.lineWidth=1.2; ctx.stroke();
    }
  }
  const gx2=bx+bw, gy2=by+bh/2;
  ctx.strokeStyle='rgba(200,251,80,.85)'; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.arc(gx2,gy2,4.5,0,7); ctx.stroke();
  if (frac>=1){ ctx.fillStyle='#c8fb50'; ctx.beginPath(); ctx.arc(gx2,gy2,2.8,0,7); ctx.fill(); }
}
function drawZHP(z){
  if (z.dead) return;
  if (z.hp>=z.maxhp && z.shown<=0) return;
  const a=SPR[z.kw][z.state]; const sx=z.x-camX; if(sx<-80||sx>W+80) return;
  const w=46,h=7,x=sx-w/2,y=z.y - a.foots[0] - 14;
  ctx.fillStyle='rgba(10,8,18,.78)'; roundRect(x-2,y-2,w+4,h+4,4); ctx.fill();
  ctx.strokeStyle='rgba(210,70,70,.55)'; ctx.lineWidth=1; ctx.stroke();
  const frac=Math.max(0,Math.min(1,z.hpShown/z.maxhp));
  const g=ctx.createLinearGradient(x,0,x+w,0); g.addColorStop(0,'#7a0d12'); g.addColorStop(1,'#ec3b3b');
  ctx.fillStyle=g; ctx.fillRect(x,y,w*frac,h);
  ctx.strokeStyle='rgba(0,0,0,.6)'; ctx.lineWidth=1.5;
  for(let i=1;i<z.maxhp;i++){ const sn=x+w*i/z.maxhp; ctx.beginPath(); ctx.moveTo(sn,y); ctx.lineTo(sn,y+h); ctx.stroke(); }
}

function drawZombie(z){
  let state=z.dead?z.dstate:z.state;
  const a=SPR[z.kw][state]; const sx=z.x-camX; if(sx<-120||sx>W+120) return;
  let fi, alpha=1, dy=0;
  if (z.dead){ fi=z.dframe; const k=z.dieT/0.7; alpha=Math.max(0,1-k); dy=-34*k; if(z.dieT>0.75) return; }
  else fi=Math.floor(z.t*FZK[z.kw][state])%a.frames;
  ctx.save(); ctx.globalAlpha=alpha;
  if (z.facing<0){ ctx.translate(sx,0); ctx.scale(-1,1); ctx.translate(-sx,0); }
  ctx.imageSmoothingEnabled=true;
  ctx.drawImage(a.img, fi*a.sw,0,a.sw,a.sh, sx-a.cxs[fi], z.y-a.foots[fi]+dy, a.w,a.h);
  ctx.restore(); ctx.globalAlpha=1;
}
function drawBat(b){
  const biting=(!b.dead && b.state==='bite');
  const a=biting?SPR.bat.bite:SPR.bat.idle, sx=b.x-camX; if(sx<-170||sx>W+170) return;
  let alpha=1, dy2=0;
  if (b.dead){ const k=b.dieT/0.5; if(k>=1) return; alpha=1-k; dy2=22*k; }
  const fi=biting?Math.min(a.frames-1,Math.floor(b.bt*BITE_FPS)):Math.floor(b.t*BAT_FPS)%a.frames;
  ctx.save(); ctx.globalAlpha=alpha;
  if (b.facing<0){ ctx.translate(sx,0); ctx.scale(-1,1); ctx.translate(-sx,0); }
  ctx.imageSmoothingEnabled=true;
  ctx.drawImage(a.img, fi*a.sw,0,a.sw,a.sh, sx-a.cxs[fi], b.yD-a.cys[fi]+dy2, a.w,a.h);
  ctx.restore(); ctx.globalAlpha=1;
}
function drawPortal(cx,cy,size,t){
  ctx.save(); ctx.translate(cx,cy); ctx.scale(0.52,1);
  const g=ctx.createRadialGradient(0,0,size*0.08,0,0,size);
  g.addColorStop(0,'rgba(245,230,255,0.95)'); g.addColorStop(0.4,'rgba(190,110,255,0.85)');
  g.addColorStop(0.78,'rgba(110,40,200,0.65)'); g.addColorStop(1,'rgba(110,40,200,0)');
  ctx.fillStyle=g; ctx.beginPath(); ctx.arc(0,0,size,0,7); ctx.fill();
  ctx.lineCap='round';
  for (let i=0;i<5;i++){
    const a0=t*5+i*1.26;
    ctx.lineWidth=Math.max(1.5,size*0.07);
    ctx.strokeStyle='rgba('+(185+i*14)+','+(120+i*22)+',255,0.55)';
    ctx.beginPath(); ctx.arc(0,0,size*(0.28+0.14*i),a0,a0+2.1); ctx.stroke();
  }
  ctx.strokeStyle='rgba(215,150,255,0.9)'; ctx.lineWidth=Math.max(2,size*0.05);
  ctx.beginPath(); ctx.arc(0,0,size*0.96,0,7); ctx.stroke();
  ctx.restore();
}
function drawGlitchAnim(ck,anim,fi,cx,feetY,facing,scale,gi){
  const a=SPR.chars[ck][anim], dw=a.w*scale, dh=a.h*scale;
  const dx=cx-a.cxs[fi]*scale, dy=feetY-a.foots[fi]*scale;
  ctx.save();
  if (facing<0){ ctx.translate(cx,0); ctx.scale(-1,1); ctx.translate(-cx,0); }
  ctx.imageSmoothingEnabled=true;
  const N=6, sh=a.sh/N, dhs=dh/N, g2=gi*gi;
  for(let i=0;i<N;i++){
    if (Math.random()<0.16*g2) continue;
    const off=(Math.random()-0.5)*2*(0.5+8.5*g2);
    ctx.drawImage(a.img, fi*a.sw, i*sh, a.sw, sh, dx+off, dy+i*dhs, dw, dhs+0.6);
  }
  if (Math.random()<0.6*g2){
    ctx.globalCompositeOperation='lighter'; ctx.globalAlpha*=0.16;
    ctx.drawImage(a.img, fi*a.sw,0,a.sw,a.sh, dx+(Math.random()<0.5?-3:3), dy, dw,dh);
    ctx.globalCompositeOperation='source-over';
  }
  ctx.restore();
}
function drawGoal(){
  const g=SPR.goal; if(!g) return;
  const sx=pxf(GOAL_X,1); if(sx<-160||sx>W+160) return;
  const gy=GOALY+10-g.h, x0=sx-g.w/2;
  const vx2=x0+g.vc[0], vy2=gy+g.vc[1];
  // rotating vortex behind the arch
  ctx.save();
  ctx.translate(vx2,vy2); ctx.rotate(gt*0.85);
  ctx.drawImage(g.vimg, -g.vsz/2, -g.vsz/2, g.vsz, g.vsz);
  ctx.restore();
  // breathing glow over the vortex
  const pu=0.7+0.3*Math.sin(gt*3.4);
  const gl=ctx.createRadialGradient(vx2,vy2,2,vx2,vy2,g.vr[1]*1.25);
  gl.addColorStop(0,'rgba(220,170,255,'+(0.22*pu).toFixed(2)+')');
  gl.addColorStop(1,'rgba(140,60,255,0)');
  ctx.fillStyle=gl; ctx.beginPath(); ctx.arc(vx2,vy2,g.vr[1]*1.3,0,7); ctx.fill();
  // swirl arcs riding the vortex
  ctx.save(); ctx.translate(vx2,vy2); ctx.scale(g.vr[0]/g.vr[1],1); ctx.lineCap='round';
  for (let i=0;i<3;i++){
    const a0=-gt*2.2+i*2.1;
    ctx.strokeStyle='rgba('+(195+i*15)+','+(130+i*25)+',255,0.4)';
    ctx.lineWidth=2.2-i*0.5;
    ctx.beginPath(); ctx.arc(0,0,g.vr[1]*(0.35+0.2*i),a0,a0+1.9); ctx.stroke();
  }
  ctx.restore();
  // stone arch on top
  ctx.drawImage(g.img, x0, gy, g.w, g.h);
  // torch flames flicker
  for (const fp of g.fpts){
    const fx=x0+fp[0], fy2=gy+fp[1];
    const r=11+3*Math.sin(gt*12.5+fx*0.7)+2*Math.sin(gt*27+fx);
    const fg=ctx.createRadialGradient(fx,fy2,1,fx,fy2,Math.max(6,r*2));
    fg.addColorStop(0,'rgba(225,160,255,.40)'); fg.addColorStop(0.5,'rgba(170,80,255,.20)');
    fg.addColorStop(1,'rgba(120,40,220,0)');
    ctx.fillStyle=fg; ctx.beginPath(); ctx.arc(fx,fy2,Math.max(6,r*2),0,7); ctx.fill();
  }
  const fl2=0.80+0.14*Math.sin(gt*11)+0.06*Math.sin(gt*26);
  const sc2=1+0.05*Math.sin(gt*13);
  ctx.save(); ctx.globalAlpha=Math.max(0,Math.min(1,fl2));
  ctx.translate(x0+g.w/2, gy+g.h); ctx.scale(1,sc2);
  ctx.drawImage(g.fimg, -g.w/2, -g.h, g.w, g.h);
  ctx.restore(); ctx.globalAlpha=1;
}
function drawPlayerLayer(){
  if (p.won) return;
  const sx=p.x-camX;
  if (p.winning){
    const t=p.winT, gi=Math.min(1,t/1.6);
    const fl=(Math.floor(gt*(6+26*gi*gi))%4===0)?Math.max(0.25,1-0.9*gi*gi):(Math.random()<0.12*gi*gi?0.55:1);
    let s=1, al=1;
    if (t>1.0){ const k=Math.min(1,(t-1.0)/0.8); s=Math.max(0.05,1-k); al=Math.max(0,1-k*0.92); }
    ctx.globalAlpha=al*fl;
    drawGlitchAnim(chosen,'idle',curFrame(), sx, p.y, p.facing, s, gi);
    ctx.globalAlpha=1;
    return;
  }
  if (!p.dead){
    if (p.state==='dive'){
      for (let gi2=0; gi2<diveGhosts.length; gi2+=2){
        const g2=diveGhosts[gi2], gsx=g2.x-camX;
        ctx.save(); ctx.globalAlpha=0.05+0.12*(gi2/Math.max(1,diveGhosts.length));
        ctx.translate(gsx, g2.y-44); ctx.rotate(p.facing*DIVE_ROT); ctx.translate(-gsx, -(g2.y-44));
        drawCharSprite(chosen,'dive',0,gsx,g2.y,p.facing,1,0);
        ctx.restore();
      }
      ctx.save(); ctx.translate(sx, p.y-44); ctx.rotate(p.facing*DIVE_ROT); ctx.translate(-sx, -(p.y-44));
      drawCharSprite(chosen,'dive',0,sx,p.y,p.facing,1,0);
      ctx.restore();
    }
    else if (!(p.inv>0 && Math.floor(gt*16)%2===0)) drawCharSprite(chosen, p.state, curFrame(), sx, p.y, p.facing, 1, p.inv>0?0.45:0);
    if (p.muzzleT>0){
      const k=1-p.muzzleT/0.14, hx=sx+p.facing*42, hy=p.y-56;
      // soft rim glow washing over the character
      const cg=ctx.createRadialGradient(sx,p.y-52,4,sx,p.y-52,64);
      cg.addColorStop(0,'rgba(170,230,255,'+(0.30*(1-k)).toFixed(2)+')'); cg.addColorStop(1,'rgba(120,200,255,0)');
      ctx.fillStyle=cg; ctx.beginPath(); ctx.arc(sx,p.y-52,64,0,7); ctx.fill();
      // hot muzzle burst at the hand
      const mr=10+26*k;
      const mg=ctx.createRadialGradient(hx,hy,1,hx,hy,mr);
      const wave=isDing(chosen);
      mg.addColorStop(0,'rgba(255,255,255,'+(0.95*(1-k)).toFixed(2)+')');
      mg.addColorStop(0.5, wave?'rgba(205,150,255,'+(0.6*(1-k)).toFixed(2)+')':'rgba(140,225,255,'+(0.6*(1-k)).toFixed(2)+')');
      mg.addColorStop(1, wave?'rgba(140,60,255,0)':'rgba(60,140,255,0)');
      ctx.fillStyle=mg; ctx.beginPath(); ctx.arc(hx,hy,mr,0,7); ctx.fill();
      for (let s2=0;s2<4;s2++){
        const a2=(s2/4)*6.28+k*2.5;
        ctx.strokeStyle='rgba(200,240,255,'+(0.7*(1-k)).toFixed(2)+')'; ctx.lineWidth=1.6;
        ctx.beginPath(); ctx.moveTo(hx+Math.cos(a2)*mr*0.4, hy+Math.sin(a2)*mr*0.4);
        ctx.lineTo(hx+Math.cos(a2)*mr*0.95, hy+Math.sin(a2)*mr*0.95); ctx.stroke();
      }
    }
    return;
  }
  const t=p.deadT, pcx=sx - p.facing*26, pcy=p.y-66;
  let ps=0;
  if (t>0.45 && t<=1.0) ps=80*(t-0.45)/0.55;
  else if (t>1.0 && t<=1.7) ps=80;
  else if (t>1.7) ps=Math.max(0, 80*(1-(t-1.7)/0.45));
  if (ps>0.5) drawPortal(pcx, pcy, ps, gt);
  const gi=Math.min(1,t/1.7), g2=gi*gi;
  const frq=6+26*g2;
  const fl=(Math.floor(gt*frq)%4===0)?Math.max(0.25,1-0.9*g2):(Math.random()<0.12*g2?0.55:1);
  if (t<=1.0){
    ctx.globalAlpha=fl;
    drawGlitchAnim(chosen,'kneel',curFrame(), sx, p.y, p.facing, 1, gi);
    ctx.globalAlpha=1;
  } else if (t<=1.7){
    const k=(t-1.0)/0.7, s=Math.max(0.05,1-k);
    const cxp=sx+(pcx-sx)*k, fy=p.y+((pcy+58*s)-p.y)*k;
    ctx.globalAlpha=Math.max(0,1-k*0.9)*fl;
    drawGlitchAnim(chosen,'kneel',curFrame(), cxp, fy, p.facing, s, gi);
    ctx.globalAlpha=1;
  }
}
function draw(){
  ctx.setTransform(RS,0,0,RS,0,0);
  if (ST.theme==='crypt') caveBG(); else { skyBG(); drawFence(); }
  drawBackgrounds();   // parallax background image layers (cover the base when present)
  vignette();
  ctx.save(); ctx.translate(0,-camY);
  drawSpikes();
  drawWorldProps();
  drawChecks();
  drawRocks();
  drawVolleys();
  for (const z of zombies) drawZombie(z);
  for (const b of bats) drawBat(b);
  drawZbits();
  drawGoal();
  for (const s of souls){
    if (s.got&&s.pop>=1) continue; const sx=pxf(s.x,1); if(sx<-60||sx>W+60) continue;
    let alpha=1,sc=1; if(s.got){ alpha=Math.max(0,1-s.pop); sc=1+0.7*s.pop; }
    drawSoulFx(sx, s.y, 13*sc, alpha, s.ph*19);
  }
  drawPlayerLayer();
  for (const fx of chkFx){
    const st=SPR.chkst; if(!st) break;
    const sx=fx.cx-camX, gy=(fx.cgy!==undefined?fx.cgy:GROUND)+8-st.h;
    if (fx.t<0.62){
      // purple energy streams rising up the statue
      const k=fx.t/0.62;
      for (let w2=0; w2<7; w2++){
        const ph=((fx.t*1.7)+w2*0.143)%1;
        const wy=(fx.cgy!==undefined?fx.cgy:GROUND)+4-ph*(st.h+34);
        const wx=sx+Math.sin((ph*6.0)+w2*2.4)*14;
        const al=Math.max(0,(1-ph)*0.85)*Math.min(1,k*3);
        const r=3+2.6*Math.sin(w2+ph*9);
        const g2=ctx.createRadialGradient(wx,wy,0.5,wx,wy,Math.max(2,r*2.2));
        g2.addColorStop(0,'rgba(235,200,255,'+(al).toFixed(2)+')');
        g2.addColorStop(0.5,'rgba(185,110,255,'+(al*0.6).toFixed(2)+')');
        g2.addColorStop(1,'rgba(130,50,230,0)');
        ctx.fillStyle=g2; ctx.beginPath(); ctx.arc(wx,wy,Math.max(2,r*2.2),0,7); ctx.fill();
      }
    } else if (fx.t<0.78){
      // streak homing into the player
      const k=(fx.t-0.62)/0.16;
      const x0=sx, y0=gy-18, x1=p.x-camX, y1=p.y-52;
      const ex=x0+(x1-x0)*k, ey=y0+(y1-y0)*k;
      ctx.strokeStyle='rgba(210,150,255,'+(0.7*(1-k*0.5)).toFixed(2)+')'; ctx.lineWidth=3;
      ctx.beginPath(); ctx.moveTo(x0+(x1-x0)*Math.max(0,k-0.25), y0+(y1-y0)*Math.max(0,k-0.25)); ctx.lineTo(ex,ey); ctx.stroke();
      const g3=ctx.createRadialGradient(ex,ey,1,ex,ey,13);
      g3.addColorStop(0,'rgba(245,225,255,0.95)'); g3.addColorStop(1,'rgba(150,70,255,0)');
      ctx.fillStyle=g3; ctx.beginPath(); ctx.arc(ex,ey,13,0,7); ctx.fill();
    } else {
      // burst on the player: +1 life
      const k=(fx.t-0.78)/0.32, bx2=p.x-camX, by2=p.y-52;
      ctx.strokeStyle='rgba(200,130,255,'+(0.85*(1-k)).toFixed(2)+')';
      ctx.lineWidth=Math.max(1,3.5*(1-k));
      ctx.beginPath(); ctx.arc(bx2,by2,8+44*k,0,7); ctx.stroke();
      ctx.strokeStyle='rgba(245,225,255,'+(0.5*(1-k)).toFixed(2)+')';
      ctx.beginPath(); ctx.arc(bx2,by2,(8+44*k)*0.66,0,7); ctx.stroke();
      if (k<0.5){
        const g4=ctx.createRadialGradient(bx2,by2,1,bx2,by2,26);
        g4.addColorStop(0,'rgba(240,215,255,'+(0.6*(1-k*2)).toFixed(2)+')'); g4.addColorStop(1,'rgba(160,80,255,0)');
        ctx.fillStyle=g4; ctx.beginPath(); ctx.arc(bx2,by2,26,0,7); ctx.fill();
      }
      ctx.fillStyle='rgba(235,210,255,'+(0.9*(1-k)).toFixed(2)+')';
      ctx.font='bold 16px sans-serif'; ctx.textAlign='center';
      ctx.fillText('+1', bx2, by2-30-22*k); ctx.textAlign='left';
    }
  }
  for (const bo of bolts){
    if (bo.dead) continue;
    const bx=bo.x-camX; if(bx<-60||bx>W+60) continue;
    if (bo.kind==='wave'){
      // soundwave: stacked crescent rings rippling forward from the mouth
      const dir=Math.sign(bo.vx), grow=Math.min(1, bo.t*1.8);
      ctx.lineCap='round';
      for (let k=0;k<4;k++){
        const ax=bx-dir*k*10;
        const r=(7+k*4.5)*(0.6+0.4*grow)+2.2*Math.sin(gt*30+k*1.7);
        const al=(k===0?0.95:0.78-k*0.18);
        ctx.strokeStyle=k===0?'rgba(240,222,255,'+al.toFixed(2)+')':'rgba('+(196-k*14)+','+(126-k*10)+',255,'+al.toFixed(2)+')';
        ctx.lineWidth=Math.max(1.4, 3.4-k*0.6);
        const a0=dir>0?-1.05:Math.PI-1.05;
        ctx.beginPath(); ctx.arc(ax,bo.y,Math.max(3,r),a0,a0+2.1); ctx.stroke();
      }
      const mg=ctx.createRadialGradient(bx,bo.y,1,bx,bo.y,9);
      mg.addColorStop(0,'rgba(235,215,255,0.5)'); mg.addColorStop(1,'rgba(150,80,255,0)');
      ctx.fillStyle=mg; ctx.beginPath(); ctx.arc(bx,bo.y,9,0,7); ctx.fill();
      continue;
    }
    for (let g2=2; g2>=0; g2--){
      const gx2=bx-Math.sign(bo.vx)*g2*13, ga=[0.9,0.4,0.18][g2], r=[9,7,5][g2];
      const grd=ctx.createRadialGradient(gx2,bo.y,1,gx2,bo.y,r*2);
      grd.addColorStop(0,'rgba(235,250,255,'+ga+')');
      grd.addColorStop(0.45,'rgba(120,210,255,'+(ga*0.8).toFixed(2)+')');
      grd.addColorStop(1,'rgba(40,110,255,0)');
      ctx.fillStyle=grd; ctx.beginPath(); ctx.arc(gx2,bo.y,r*2,0,7); ctx.fill();
    }
    const fl2=0.7+0.3*Math.sin(gt*40);
    ctx.fillStyle='rgba(255,255,255,'+fl2.toFixed(2)+')';
    ctx.beginPath(); ctx.arc(bx,bo.y,3.2,0,7); ctx.fill();
  }
  for (const im of impacts){
    const ix=im.x-camX; if(ix<-80||ix>W+80) continue;
    const k=im.t/0.32;
    const r=10+58*k;
    if (k<0.4){
      const cg2=ctx.createRadialGradient(ix,im.y,1,ix,im.y,22);
      cg2.addColorStop(0,'rgba(255,255,255,'+(0.95*(1-k/0.4)).toFixed(2)+')');
      cg2.addColorStop(1,'rgba(150,225,255,0)');
      ctx.fillStyle=cg2; ctx.beginPath(); ctx.arc(ix,im.y,22,0,7); ctx.fill();
    }
    ctx.strokeStyle='rgba(140,220,255,'+(0.8*(1-k)).toFixed(2)+')';
    ctx.lineWidth=Math.max(1,4*(1-k));
    ctx.beginPath(); ctx.arc(ix,im.y,r,0,7); ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,'+(0.5*(1-k)).toFixed(2)+')';
    ctx.lineWidth=Math.max(0.5,2*(1-k));
    ctx.beginPath(); ctx.arc(ix,im.y,r*0.72,0,7); ctx.stroke();
  }
  for (const z of zombies) drawZHP(z);
  ctx.restore();
  if (WORLDH>H){ // light dies as you descend
    const dk=Math.max(0,Math.min(1,camY/(WORLDH-H)))*0.40;
    ctx.fillStyle='rgba(2,1,6,'+dk.toFixed(2)+')'; ctx.fillRect(0,0,W,H);
  }
  // HUD
  drawPlayerHP();
  ctx.fillStyle='rgba(20,16,36,.5)'; roundRect(14,54,128,28,7); ctx.fill();
  ctx.fillStyle='#7fe0ff'; ctx.beginPath(); ctx.arc(32,68,9,0,7); ctx.fill();
  ctx.fillStyle='#cfeaff'; ctx.beginPath(); ctx.arc(32,68,5,0,7); ctx.fill();
  ctx.fillStyle='#eaf6ff'; ctx.font='bold 16px sans-serif'; ctx.textAlign='left'; ctx.fillText('x '+soulCount+' / '+souls.length, 48, 74);
  if (!menuOpen() && !p.winning) drawPauseBtn();
  drawProgress();
  ctx.textAlign='right'; ctx.font='bold 15px sans-serif';
  ctx.fillStyle='rgba(20,16,36,.55)'; roundRect(W-184,36,154,24,7); ctx.fill();
  ctx.fillStyle='#eaf6ff';
  ctx.fillText((banked+actScore).toLocaleString('en-US'), W-40, 53);
  ctx.textAlign='left'; ctx.font='10px sans-serif'; ctx.fillStyle='rgba(200,190,255,.7)';
  ctx.fillText('SCORE', W-176, 52);
  if (p.dead && p.deadT>2.3){
    menuPanel('YOU DIED', [
      {label: p.spawn>90?'Rise at Checkpoint':'Try Again', action:()=>{ paused=false; onReset(); }},
      {label:'Restart Act', action:()=>{ paused=false; loadStage(stageIdx); }},
      {label:'Return to Overworld', action:()=>{ enterWorld(true); }},
    ], null, '#e23b3b');
  } else if (p.won){
    drawTally();
  } else if (paused){
    menuPanel('Paused', [
      {label:'Return to Overworld', action:()=>{ enterWorld(true); }},
      {label:'Restart Act', action:()=>{ paused=false; loadStage(stageIdx); }},
      {label:'Close', action:()=>{ paused=false; }},
    ]);
  }
  drawTitleCard();
  if (fading>0){ ctx.fillStyle='rgba(5,3,12,'+Math.min(1,fading/0.6).toFixed(2)+')'; ctx.fillRect(0,0,W,H); }
  if (fadeIn>0){ ctx.fillStyle='rgba(5,3,12,'+Math.min(1,fadeIn/0.5).toFixed(2)+')'; ctx.fillRect(0,0,W,H); }
}
function drawTitle(){
  ctx.setTransform(RS,0,0,RS,0,0);
  camX=0; skyBG(); drawFence();
  ctx.fillStyle='#1d1730'; ctx.fillRect(0,GROUND,W,H-GROUND);
  ctx.fillStyle='#5a4499'; ctx.fillRect(0,GROUND,W,8);
  ctx.globalAlpha=titleFade;
  if (TIMG && TIMG.complete && TIMG.naturalWidth){
    const th=296, tw=TIMG.naturalWidth*th/TIMG.naturalHeight;
    ctx.drawImage(TIMG, W/2-tw/2, 2, tw, th);
  }
  ctx.textAlign='center';
  ctx.font="54px Frijole, Creepster, sans-serif";
  ctx.fillStyle='#16102e'; ctx.fillText('cReapZ', W/2+3, 326);
  ctx.fillStyle='#c8fb50'; ctx.fillText('cReapZ', W/2, 323);
  ctx.globalAlpha=1;
  menuRects=[];
  if (cryptOpen){
    menuPanel('THE CRYPT', [
      {label:'Close', action:()=>{ cryptOpen=false; }},
    ], 'Coming soon — spend collected soulz on skins, colors & unlockables');
  } else if (optionsOpen){
    drawOptions();
  } else if (!menuShown){
    const pu=0.5+0.5*Math.sin(gt*3.5);
    ctx.fillStyle='rgba(234,230,255,'+(0.35+0.6*pu).toFixed(2)+')';
    ctx.font='600 19px sans-serif';
    ctx.fillText('PRESS ANY BUTTON', W/2, 386);
  } else {
    const items=[['Play','play'],['Crypt','crypt'],['Options','options']];
    const bw2=168, bh2=44, gap2=26, x0=W/2-(items.length*bw2+(items.length-1)*gap2)/2;
    items.forEach((it,k)=>{
      const bx2=x0+k*(bw2+gap2), by2=352;
      const hot=(k===menuSel);
      ctx.fillStyle=hot?'rgba(200,251,80,.14)':'rgba(20,16,40,.78)'; roundRect(bx2,by2,bw2,bh2,10); ctx.fill();
      ctx.strokeStyle = hot?'#c8fb50':'rgba(155,140,255,.45)'; ctx.lineWidth=hot?2:1.5; ctx.stroke();
      ctx.fillStyle='#e8e6f5'; ctx.font='600 19px sans-serif';
      ctx.fillText(it[0], bx2+bw2/2, by2+29);
      menuRects.push({x:bx2,y:by2,w:bw2,h:bh2,action:it[1]});
    });
  }
  ctx.textAlign='left';
}
function drawOptions(){
  ctx.fillStyle='rgba(8,5,18,.72)'; ctx.fillRect(0,0,W,H);
  const mw=420, mh=388, mx=W/2-mw/2, my=H/2-mh/2;
  ctx.fillStyle='rgba(22,16,44,.97)'; roundRect(mx,my,mw,mh,14); ctx.fill();
  ctx.strokeStyle='rgba(150,140,255,.5)'; ctx.lineWidth=1.5; ctx.stroke();
  ctx.textAlign='center'; ctx.fillStyle='#eae6ff'; ctx.font='bold 24px sans-serif';
  ctx.fillText('OPTIONS', W/2, my+40);
  menuRects=[];
  [['MUSIC','m',musicVol],['SOUND','s',sfxVol]].forEach((row,i)=>{
    const y=my+78+i*56;
    ctx.textAlign='left'; ctx.font='600 15px sans-serif'; ctx.fillStyle=(i===optSel)?'#c8fb50':'#cfd0e8';
    if (i===optSel){ ctx.fillText('\u25b8', mx+14, y+6); }
    ctx.fillText(row[0], mx+28, y+6);
    // minus
    ctx.fillStyle='rgba(155,140,255,.18)'; roundRect(mx+118,y-16,36,32,8); ctx.fill();
    ctx.textAlign='center'; ctx.fillStyle='#e8e6f5'; ctx.font='bold 20px sans-serif'; ctx.fillText('-', mx+136, y+7);
    menuRects.push({x:mx+118,y:y-16,w:36,h:32,action:row[1]+'-'});
    // bar
    const bx2=mx+168, bw2=160;
    ctx.fillStyle='rgba(0,0,0,.5)'; roundRect(bx2,y-9,bw2,18,6); ctx.fill();
    ctx.fillStyle='#c8fb50'; if(row[2]>0){ roundRect(bx2,y-9,Math.max(8,bw2*row[2]),18,6); ctx.fill(); }
    // plus
    ctx.fillStyle='rgba(155,140,255,.18)'; roundRect(bx2+bw2+14,y-16,36,32,8); ctx.fill();
    ctx.fillStyle='#e8e6f5'; ctx.fillText('+', bx2+bw2+32, y+7);
    menuRects.push({x:bx2+bw2+14,y:y-16,w:36,h:32,action:row[1]+'+'});
  });
  [['Export Save','export',2],['Import Save','import',3],['Install App','install',4]].forEach((row,k)=>{
    const y=my+196+k*46;
    const hot=(optSel===row[2]);
    ctx.fillStyle=hot?'rgba(200,251,80,.16)':'rgba(155,140,255,.16)'; roundRect(mx+60,y,mw-120,38,10); ctx.fill();
    ctx.strokeStyle=hot?'#c8fb50':'rgba(155,140,255,.45)'; ctx.lineWidth=hot?2:1; ctx.stroke();
    ctx.fillStyle='#e8e6f5'; ctx.font='600 15px sans-serif'; ctx.textAlign='center';
    ctx.fillText(row[0], W/2, y+25);
    menuRects.push({x:mx+60,y:y,w:mw-120,h:38,action:row[1]});
  });
  if (optMsg){ ctx.fillStyle='#7fe0ff'; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText(optMsg, W/2, my+348); }
  const by3=my+mh-30;
  ctx.fillStyle=(optSel===5)?'rgba(200,251,80,.16)':'rgba(155,140,255,.16)'; roundRect(W/2-80,by3-12,160,34,10); ctx.fill();
  ctx.strokeStyle=(optSel===5)?'#c8fb50':'rgba(155,140,255,.45)'; ctx.lineWidth=(optSel===5)?2:1; ctx.stroke();
  ctx.fillStyle='#e8e6f5'; ctx.font='600 16px sans-serif'; ctx.textAlign='center';
  ctx.fillText('Close', W/2, by3+11);
  menuRects.push({x:W/2-80,y:by3-12,w:160,h:34,action:'close'});
  ctx.textAlign='left';
}
function titleMenuAction(a){
  playSfx('sfx_msel');
  if (a==='play'){ mode='slots'; slotSel=0; slotConfirm=-1; }
  else if (a==='crypt'){ cryptOpen=true; }
  else if (a==='options'){ optionsOpen=true; }
  else if (a==='close'){ optionsOpen=false; cryptOpen=false; optMsg=''; }
  else if (a==='export'){ exportSave(); }
  else if (a==='import'){ importSave(); }
  else if (a==='install'){ installApp(); }
  else if (a==='m-'){ musicVol=Math.max(0,Math.round((musicVol-0.1)*10)/10); saveVols(); }
  else if (a==='m+'){ musicVol=Math.min(1,Math.round((musicVol+0.1)*10)/10); saveVols(); }
  else if (a==='s-'){ sfxVol=Math.max(0,Math.round((sfxVol-0.1)*10)/10); if(sfxGain) sfxGain.gain.value=0.45*sfxVol; saveVols(); }
  else if (a==='s+'){ sfxVol=Math.min(1,Math.round((sfxVol+0.1)*10)/10); if(sfxGain) sfxGain.gain.value=0.45*sfxVol; saveVols(); }
}
function drawLoading(){
  ctx.setTransform(RS,0,0,RS,0,0);
  ctx.fillStyle='#0d0b1a'; ctx.fillRect(0,0,W,H);
  const pct=total>0?Math.min(1,loaded/total):0;
  ctx.textAlign='center';
  ctx.font="60px Frijole, Creepster, sans-serif";
  ctx.fillStyle='#16102e'; ctx.fillText('cReapZ', W/2+3, 153);
  ctx.fillStyle='#c8fb50'; ctx.fillText('cReapZ', W/2, 150);
  // the runners: cReaper leading, Dingbat chasing, right above the bar
  const bw2=340, bx2=W/2-bw2/2, by2=300;
  try{
    const a1=SPR.chars && SPR.chars.default && SPR.chars.default.run;
    const a2=SPR.chars && SPR.chars.dingbat && SPR.chars.dingbat.run;
    if (a1 && a1.img.complete && a1.img.naturalWidth){
      const fi=Math.floor(gt*16)%a1.frames;
      drawCharSprite('default','run',fi, W/2+46, by2-9, 1, 0.62);
    }
    if (a2 && a2.img.complete && a2.img.naturalWidth){
      const fi2=Math.floor(gt*42)%a2.frames;
      drawCharSprite('dingbat','run',fi2, W/2-46, by2+2, 1, 0.85);
    }
  }catch(e){}
  ctx.fillStyle='rgba(255,255,255,.14)'; roundRect(bx2,by2,bw2,14,7); ctx.fill();
  if (pct>0){ ctx.fillStyle='#c8fb50'; roundRect(bx2,by2,Math.max(10,bw2*pct),14,7); ctx.fill(); }
  ctx.fillStyle='#cfd0e8'; ctx.font='600 15px sans-serif';
  if (loaded>=total){
    const pu=0.5+0.5*Math.sin(gt*3.5);
    ctx.fillStyle='rgba(200,251,80,'+(0.4+0.6*pu).toFixed(2)+')';
    ctx.fillText('TAP TO BEGIN', W/2, by2+46);
  } else {
    ctx.fillText(Math.round(pct*100)+'%', W/2, by2+44);
  }
  ctx.textAlign='left';
  return;
  ctx.fillStyle='#0d0b1a_unused'; ctx.fillRect(0,0,W,H);
  ctx.fillStyle='#9b8cff'; ctx.font='18px sans-serif'; ctx.textAlign='center'; ctx.fillText('Loading... '+loaded+'/'+total, W/2, H/2); ctx.textAlign='left';
}
reset(); requestAnimationFrame(loop);
}
main();
