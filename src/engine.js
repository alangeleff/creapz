const ASSET_VER='1781280000';
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
const SLAM_VY = 19.0, SLAM_REC = 0.26, SLAM_IFRAMES = 0.6, SLAM_R = 134;   // Crush Drop (down-slam)
const BASH_VX = 11.4, BASH_VY = 12.6;   // Scythe Bash (cReaper) — snappier than the dive per Alan
const OBJ = SPRITES.obst;
const SPIKE_IMG=new Image(); SPIKE_IMG.src='./assets/haz_spike2.png?v='+ASSET_VER;
const SPIKESHOT_IMG=new Image(); SPIKESHOT_IMG.src='./assets/haz_spikeshot1.png?v='+ASSET_VER;
const ROCK_IMG=new Image(); ROCK_IMG.src='./assets/haz_rock2.png?v='+ASSET_VER;
const CAVEPLAT_IMG=new Image(); CAVEPLAT_IMG.src='./assets/caveplat1.png?v='+ASSET_VER;
const CHEST_CLOSED_IMG=new Image(); CHEST_CLOSED_IMG.src='./assets/chest_closed1.png?v='+ASSET_VER;
const CHEST_OPEN_IMG=new Image(); CHEST_OPEN_IMG.src='./assets/chest_open1.png?v='+ASSET_VER;
const STONE_DEFS={amethyst:'#b24dff',chaos:'#e24dff',emerald:'#2fe06a',fluorite:'#5fe0c0',holy:'#fff0a0',obsidian:'#9a7fd0',ruby:'#ff3d5a',sapphire:'#4d8cff',topaz:'#ffc23c',master:'#ff7a2c'};
const STONE_IMGS={}; for(const _k in STONE_DEFS){ const _i=new Image(); _i.src='./assets/stone_'+_k+'.png?v='+ASSET_VER; STONE_IMGS[_k]=_i; }
const MEGA_LOOT_IMG={}, MEGA_LOOT_COL={};
['1','2','3','4','5','6'].forEach(function(k){ const i=new Image(); i.src='./assets/mega_vigor_frag'+k+'.png?v='+ASSET_VER; MEGA_LOOT_IMG['vigorfrag'+k]=i; MEGA_LOOT_COL['vigorfrag'+k]='#ff3d5a'; });
(function(){ const ig=new Image(); ig.src='./assets/mega_siphon.png?v='+ASSET_VER; MEGA_LOOT_IMG['mega_greed']=ig; MEGA_LOOT_COL['mega_greed']='#5fd8ff'; const id2=new Image(); id2.src='./assets/mega_discord.png?v='+ASSET_VER; MEGA_LOOT_IMG['mega_discord']=id2; MEGA_LOOT_COL['mega_discord']='#ffae57'; })();
const CREAPER_POWER_IMG=new Image(); CREAPER_POWER_IMG.src='./assets/creaper_power.png?v='+ASSET_VER;
const DINGBAT_POWER_IMG=new Image(); DINGBAT_POWER_IMG.src='./assets/dingbat_power.png?v='+ASSET_VER;
const CREAPER_PRAY_IMG=new Image(); CREAPER_PRAY_IMG.src='./assets/creaper_pray.png?v='+ASSET_VER;
const DINGBAT_PRAY_IMG=new Image(); DINGBAT_PRAY_IMG.src='./assets/dingbat_pray.png?v='+ASSET_VER;
const CREAPER_PRAY_CHIBI_IMG=new Image(); CREAPER_PRAY_CHIBI_IMG.src='./assets/creaper_pray_chibi.png?v='+ASSET_VER;
function prayImg(){ const im=isDing(chosen)?DINGBAT_PRAY_IMG:CREAPER_PRAY_IMG; return (im&&im.complete&&im.naturalWidth)?im:null; }
function drawPrayFrame(sx,yy,fc,scl,foot,atk){ const pimg=(atk && !isDing(chosen) && CREAPER_PRAY_CHIBI_IMG.complete && CREAPER_PRAY_CHIBI_IMG.naturalWidth)?CREAPER_PRAY_CHIBI_IMG:prayImg(); if(!pimg) return; const hh=(isDing(chosen)?107:142)*(scl||1), ww=hh*pimg.naturalWidth/pimg.naturalHeight; ctx.save(); ctx.imageSmoothingEnabled=true; if(fc<0){ ctx.translate(sx,0); ctx.scale(-1,1); ctx.translate(-sx,0);} ctx.drawImage(pimg, sx-ww/2, yy-hh+(foot===undefined?14:foot), ww, hh); ctx.restore(); }
const POWER_IMGS={};
function poweredImg(){ const ck=chosen; if(!POWER_IMGS[ck]){ const im=new Image(); im._ok=null; im.onload=()=>{im._ok=true;}; im.onerror=()=>{im._ok=false;}; im.src='./assets/power_'+ck+'.png?v='+ASSET_VER; POWER_IMGS[ck]=im; } const sk=POWER_IMGS[ck]; if(sk && sk._ok && sk.naturalWidth) return sk; return isDing(ck)?DINGBAT_POWER_IMG:CREAPER_POWER_IMG; }
const STONE_POWER={ruby:'Hellfire Aura',sapphire:'Time Frost',emerald:'Verdant Renewal',amethyst:'Phantom Veil',topaz:'Thunder Rush',holy:'Reaper Ascension',obsidian:'Void Maw',fluorite:'Prism Barrage',chaos:'Chaos Storm'};
const PICK_STONES=['ruby','sapphire','emerald','amethyst','topaz','holy','obsidian','fluorite','chaos','none'];
const PMETER=20, PDUR=7;
const STONE_HROT={ruby:-38,topaz:12,emerald:100,sapphire:180,amethyst:235,fluorite:130,obsidian:215,chaos:270,holy:12,master:-10};
let equippedStone=null, stoneCharge=0, powerActive=false, powerT=0, transformT=0, powerBoom=0, powerPulse=0, emHealAcc=0, powerDur=7, pendingStage=-1, stonePickSel=0, stonePickRects=[], charToggleRect=null, skinPrevRect=null, skinNextRect=null;
function activatePower(){ powerActive=true; powerDur=10; powerT=powerDur; transformT=0.95; powerBoom=0; powerPulse=0; emHealAcc=0; p.vx=0; p.vy=0; p.inv=Math.max(p.inv,0.6); if(equippedStone==='chaos'){ chaosPile=[]; chaosSpawnQ=[]; chaosAmmo=0; chaosSpawnN=7; chaosSpawnT=0.12;
    const scales=[1.5,1.25,1.1,0.95,0.82,0.7,0.58];
    for(let i=scales.length-1;i>0;i--){ const j=(Math.random()*(i+1))|0; const t=scales[i]; scales[i]=scales[j]; scales[j]=t; }
    for(let i=0;i<7;i++){ const ang=Math.PI*(0.12+0.78*(i/6))+(Math.random()-0.5)*0.45, rad=46+Math.random()*46;
      chaosSpawnQ.push({v:(Math.random()*9)|0, ox:-Math.cos(ang)*rad-6, oy:-Math.sin(ang)*rad*0.78-8, sp:Math.random()*6.28, rot:(Math.random()-0.5)*1.0, sc:scales[i], behind:Math.random()<0.5}); } } playSfx('sfx_ignite',1.0); playSfx('sfx_screamchorus',1.05); }
function confirmStone(){ equippedStone=(PICK_STONES[stonePickSel]==='none')?null:PICK_STONES[stonePickSel]; playSfx('sfx_msel'); document.querySelector('.touch').classList.toggle('ding', isDing(chosen)); try{ poweredImg(); }catch(e){} mode='play'; loadStage(pendingStage); }
function prettySkin(id){ const m={'default':'Classic','green':'Emerald','blue':'Ruby','red':'Corruption','wraith':'Umbra','gilded':'Shadow','bone':'Wine','crimson':'Glitch','dingbat':'Classic','ding_swamp':'Swamp','ding_azure':'Azure','ding_blood':'Blood','ding_magic':'Magic','ding_mystic':'Mystic','ding_wisp':'Wisp','ding_news':'Newspaper','ding_noir':'Noir'}; return m[id]||(id.charAt(0).toUpperCase()+id.slice(1)); }
function toggleChar(){ chosen=isDing(chosen)?(creaperSkin||'default'):(dingSkin||'dingbat'); try{poweredImg();}catch(e){} playSfx('sfx_mtog'); }
function cycleSkin(dir){ const list=isDing(chosen)?DORDER:ORDER; let i=list.indexOf(chosen); if(i<0)i=0; chosen=list[(i+dir+list.length)%list.length]; if(isDing(chosen))dingSkin=chosen; else creaperSkin=chosen; try{poweredImg();}catch(e){} playSfx('sfx_mtog'); }
const CAVECEIL_IMG=new Image(); CAVECEIL_IMG.src='./assets/caveceil2.png?v='+ASSET_VER;
const CAVEGND_IMG=new Image(); CAVEGND_IMG.src='./assets/caveground_dirt1.png?v='+ASSET_VER;
const CAVETOP_IMG=new Image(); CAVETOP_IMG.src='./assets/caveground_top1.png?v='+ASSET_VER;
const ROCKPILE_IMG=new Image(); ROCKPILE_IMG.src='./assets/tex_rockpile1.png?v='+ASSET_VER;
const DECOR_NAMES=['skull1', 'bone01', 'bone02', 'bone03', 'bone04', 'bone05', 'bone06', 'bone07', 'bone08', 'bone09', 'bone10', 'bone11', 'bone12', 'bone13', 'bone14', 'bone15', 'bone16'];
const DECOR_IMG={}; DECOR_NAMES.forEach(n=>{ const i=new Image(); i.src='./assets/decor_'+n+'.png?v='+ASSET_VER; DECOR_IMG[n]=i; });
const CUSTOM_MUSIC={}, GAME_DEF={}, GROUND_BASE={}, GROUND_TOP={};
let SB_CUSTOM=[], SB_CFG=null;
fetch('./config/builder.json?cb='+ASSET_VER).then(r=>r.ok?r.json():null).then(c=>{ if(!c)return;
  (c.customAssets||[]).forEach(a=>{ const im=new Image(); im.src='./'+a.file+'?v='+ASSET_VER; if(a.kind==='bg'||a.kind==='fg') BG_IMGS[a.id]=im; else DECOR_IMG[a.id]=im; if(a.behavior) GAME_DEF[a.id]={behavior:a.behavior, ar:a.ar||1, params:a.params||{}}; });
  (c.music||[]).forEach(m=>{ if(m&&m.id&&m.file){ CUSTOM_MUSIC[m.id]=m.file; SB_CUSTOM.push({key:m.id,name:m.name||'Custom Track',zone:'Bonus Track'}); } });
  SB_CFG=c.jukebox||null;
  (c.grounds||[]).forEach(g=>{ if(g&&g.id){ const b=new Image(); b.src='./'+g.base+'?v='+ASSET_VER; GROUND_BASE[g.id]=b; const t=new Image(); t.src='./'+g.top+'?v='+ASSET_VER; GROUND_TOP[g.id]=t; } });
  // --- World Map: merge committed bench stages into the zone/act maps (overrides only assigned slots; hardcoded levels remain the fallback) ---
  const wm=c.worldMap||{};
  Object.keys(wm).forEach(zid=>{ const z=wm[zid]; if(!z||!Array.isArray(z.acts))return;
    z.acts.forEach((bid,i)=>{ if(!bid)return;
      fetch('./config/bench/'+bid+'.json?cb='+ASSET_VER).then(r=>r.ok?r.json():null).then(data=>{ if(!data)return;
        if(!window.STAGES) window.STAGES=[];
        const idx=window.STAGES.length; window.STAGES[idx]=data;
        if(!ZONE_STAGES[zid]) ZONE_STAGES[zid]=[];
        ZONE_STAGES[zid][i]=idx; STAGE_ZONE[idx]=zid; STAGE_ACT[idx]=zid+(i+1);
        if(z.public){ RELEASED[zid]=Math.max(RELEASED[zid]||0, ZONE_STAGES[zid].filter(v=>v!==undefined&&v!==null).length); }
        try{ if(data.music) preloadMusic(data.music); }catch(e){}
      }).catch(()=>{});
    });
  });
}).catch(()=>{});
const DIRT_SEAM_IMG=new Image(); DIRT_SEAM_IMG.src='./assets/dirt_seam1.png?v='+ASSET_VER;
const BG_IMGS={cavebg:(()=>{const i=new Image(); i.src='./assets/cavebg1.png?v='+ASSET_VER; return i;})(), cavebg2:(()=>{const i=new Image(); i.src='./assets/cavebg2.png?v='+ASSET_VER; return i;})(), cryptbg:(()=>{const i=new Image(); i.src='./assets/cryptbg1.png?v='+ASSET_VER; return i;})(), rockwall:(()=>{const i=new Image(); i.src='./assets/rockwall1.png?v='+ASSET_VER; return i;})(), bonedirt:(()=>{const i=new Image(); i.src='./assets/bonedirt1.png?v='+ASSET_VER; return i;})()};
let stageIdx = 0, ST, WORLD, GOAL_X, SEG, OBST, SOLID, TSOLID=[], PLAT_DEF, CHK, SOUL_POS, HAZ=[], rocks=[], volleys=[], TEX=[], BG=[], FG=[], GHURT=[], GSLAM=[], GBOUNCE=[];
let curses=[];   // Wood Witch aimed curse projectiles
let STARS=[], TREES=[], GRAVES_BG=[];
let titleT = 99;
// ---- live progress (Phase A: single implicit save; slots arrive in Phase B) ----
const SAVEK='creapz_saves_v2', TOTAL_ACTS=27;   // 9 zones x 3 acts (the full realm)
const ZONE_STAGES={cem:[0,1],crypt:[2,3]};       // zone -> stage indices per act
const RELEASED={cem:2};                        // publicly playable act count per zone (dev sees everything built)
const DEVKEY='hellstone';
let devMode=false;
let _devTaps=0, _devTapT=0, devToast='', devToastT=0;
try{
  const q=new URLSearchParams(location.search);
  if(q.has('dev')){ if(q.get('dev')==='off') localStorage.removeItem('creapz_dev'); else localStorage.setItem('creapz_dev', q.get('dev')); }
  devMode = localStorage.getItem('creapz_dev')===DEVKEY;
}catch(e){}
const STAGE_ZONE=['cem','cem','crypt','crypt'];        // stageIdx -> zone
const STAGE_ACT=['cem1','cem2','crypt1','crypt2'];      // stageIdx -> act record id
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
function bootTest(){ banked=0; if(!chosen) chosen=creaperSkin||'default'; SFXLIST.forEach(loadSfx); pendingStage=window.__testIdx; stonePickSel=0; mode='stonepick'; }
function enterWorld(fromAct){
  if(testMode){ try{ if(history.length>1) history.back(); else location.href='editor'; }catch(e){ location.href='editor'; } return; }
  paused=false; tally=null; fading=0; fadeIn=0.5; panelSel=0;
  if(fromAct){ prog.heroAt=STAGE_ZONE[stageIdx]||prog.heroAt; saveProg(); }
  mode='world';
  WORLDMODE.enter({ctx,W,H,keys,isDing:isDing(chosen),getActs,zoneOpen,dev:devMode,playSfx,
    launch:(zone,ai)=>{ const si=(ZONE_STAGES[zone]||[])[ai]; if(si===undefined) return;
      prog.heroAt=zone; saveProg(); banked=0; equippedStone=null; mode='play'; loadStage(si); },
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
  OBST = ST.obst.map(o => { const def=OBJ[o.type]||{w:96,h:62}; const m={x:o.x, type:o.type, w:def.w, h:def.h, gy:(o.gy!==undefined?o.gy:GROUND), z:o.z, f:o.f}; if(o.type==='chest'){ m.state='closed'; m.openT=0; m.loot=o.loot||'gold'; } return m; });
  loots=[];
  SOLID = OBST.map(o => ({l:o.x-o.w/2, r:o.x+o.w/2, top:o.gy-o.h}));
  TSOLID = SEG.map(s => ({l:s[0], r:s[1], top:s[2], bot:s[2]+(s[3]||130)}));
  stoneCharge=0; powerActive=false; powerT=0; transformT=0;
  PLAT_DEF = ST.plats; CHK = (ST.chk||[]).map(c=>Array.isArray(c)?c:[c,GROUND]); SOUL_POS = ST.souls;
  TEX = (ST.tex||[]).map(t=>({t:t.t, x:t.x, y:t.y, w:t.w, z:t.z, f:t.f, rot:t.rot, geom:t.geom}));
  BG = (ST.bg||[]).map(b=>({t:b.t, par:b.par, alpha:b.alpha, x:b.x, y:b.y, w:b.w, h:b.h, tile:b.tile, tscale:b.tscale, cover:b.cover}));
  FG = (ST.fg||[]).map(b=>({t:b.t, par:b.par, alpha:b.alpha, x:b.x, y:b.y, w:b.w, h:b.h, tile:b.tile, tscale:b.tscale, cover:b.cover, fade:b.fade, _fa:1}));
  HAZ = (ST.hazards||[]).map(h=>{
    const o={t:h.t, x:h.x, w:h.w, y:h.y, d:h.d, z:h.z, cd:0, dir:h.dir, tx:h.tx, ty:h.ty, tw:h.tw, th:h.th};
    if(h.t==='rock'){ const n=Math.max(1,Math.round(h.w/160)); const step=h.w/n; o.spawns=[]; for(let i=0;i<n;i++) o.spawns.push(Math.round(h.x+step*(i+0.5))); o.cds=o.spawns.map(()=>0); }
    return o;
  });
  // --- custom gameplay objects: a decor (tex) whose asset has a behavior gains collision ---
  GHURT=[]; GSLAM=[]; GBOUNCE=[];
  TEX.forEach(t=>{ const g=(typeof GAME_DEF!=='undefined')&&GAME_DEF[t.t]; if(!g) return;
    const dh=t.w*(g.ar||1), gm=t.geom||{x:0,y:0,w:1,h:1};
    const l=t.x+gm.x*t.w, r=t.x+(gm.x+gm.w)*t.w, top=(t.y-dh)+gm.y*dh, bot=(t.y-dh)+(gm.y+gm.h)*dh;
    if(g.behavior==='solid'){ TSOLID.push({l,r,top,bot}); SOLID.push({l,r,top}); }
    else if(g.behavior==='platform'){ SOLID.push({l,r,top}); }
    else if(g.behavior==='spikes'){ GHURT.push({l,r,top,bot}); }
    else if(g.behavior==='bounce'){ GBOUNCE.push({l,r,top, strength:(g.params&&g.params.bounce)||19}); }
    else if(g.behavior==='slam'){ const pa=g.params||{}; const solid={l,r,top,bot};
      GSLAM.push({tex:t, solid, restY:t.y, relTop:(top-t.y), relBot:(bot-t.y), dir:(pa.dir==='up'?-1:1), dist:(pa.dist||220), windup:(pa.windup||0.9), slamV:(pa.slamV||1500), retractV:(pa.retractV||220), dwell:(pa.dwell||0.5), trig:(pa.trig||120), dmg:(pa.dmg||1), phase:'idle', tmr:0, off:0}); }
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
const LABELS = { default:'Classic', green:'Emerald', blue:'Ruby', red:'Corruption' };

const keys = {};
const DOUBLE_TAP = 350;
const lastRelease = { ArrowLeft:-1e9, ArrowRight:-1e9 };
const runHeld = { ArrowLeft:false, ArrowRight:false };
let diveReq=null, diveGhosts=[], sapTrail=[], chaosPile=[], chaosAmmo=0, chaosGlitchT=0, chaosSpawnQ=[], chaosSpawnN=0, chaosSpawnT=0;   // Power Dive trail + Sapphire after-image trail
let maxHPShown=4, hpGrowPending=0, vigorFlash=0;   // Vigor HP-slot grow animation
let slamReq=null, slamGhosts=[], slamFx=[], zapFx=[];   // Crush Drop + Topaz dash-impact white flashes
let shakeT=0, shakeMag=0;
function press(code){
  if (code==='ArrowLeft'||code==='ArrowRight'){
    if (keys[code]) return; runHeld[code]=(performance.now()-lastRelease[code])<DOUBLE_TAP;
  }
  // Aerial attack: melee button midair -> Power Dive (Dingbat) / Scythe Bash (cReaper)
  if (code==='KeyZ' && !keys[code] && mode==='play' && p && !p.dead && !p.onGround)
    diveReq={dir:0, t:performance.now()};   // dir resolved at trigger (held dir, else facing)
  if ((code==='Space'||code==='ArrowUp') && mode==='play' && p && !p.dead && !p.won && !p.winning && !p.onGround && equippedStone && stoneCharge>=PMETER && !powerActive) activatePower();
  keys[code]=true;
}
function release(code){
  if (code==='ArrowLeft'||code==='ArrowRight'){ lastRelease[code]=performance.now(); runHeld[code]=false; }
  keys[code]=false;
}
addEventListener('keydown', e => {
  if (mode==='soulbox'){ if(e.code==='Escape'){ closeSoulBox(); } else if(e.code==='Space'){ e.preventDefault(); sbTogglePlay(); } else if(e.code==='ArrowRight'){ sbNext(false); } else if(e.code==='ArrowLeft'){ sbPrev(); } return; }
  if (mode==='load'){ primeAudio(); if (loaded>=total && titleReady){ mode='title'; titleFade=0; menuShown=false; playSfx('sfx_msel'); startMusicSync('title'); } return; }
  if (mode==='title'){
    primeAudio();
    if (e.code==='Escape'){ if(optionsOpen||cryptOpen){ optionsOpen=false; cryptOpen=false; playSfx('sfx_mtog'); } return; }
    if (cryptOpen){ if (e.code==='Enter'||e.code==='Space'){ cryptOpen=false; playSfx('sfx_mtog'); } return; }
    if (optionsOpen){
      if (e.code==='ArrowUp'||e.code==='ArrowDown'){ optSel=(optSel+(e.code==='ArrowDown'?1:6))%7; playSfx('sfx_mtog'); }
      else if (e.code==='ArrowLeft'||e.code==='ArrowRight'){
        const d=e.code==='ArrowRight'?'+':'-';
        if (optSel===0) titleMenuAction('m'+d); else if (optSel===1) titleMenuAction('s'+d);
      }
      else if (e.code==='Enter'||e.code==='Space'){
        if (optSel===2) titleMenuAction('export');
        else if (optSel===3) titleMenuAction('import');
        else if (optSel===4) titleMenuAction('install');
        else if (optSel===5) titleMenuAction('controller');
        else if (optSel===6) titleMenuAction('close');
      }
      return;
    }
    if (!menuShown){ menuShown=true; menuSel=0; playSfx('sfx_mtog'); return; }
    if (e.code==='ArrowLeft'||e.code==='ArrowRight'){ menuSel=(menuSel+(e.code==='ArrowRight'?1:2))%3; playSfx('sfx_mtog'); }
    else if (e.code==='Enter'||e.code==='Space'){ titleMenuAction(['play','options','soulbox'][menuSel]); }
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
    if (WORLDMODE.key) WORLDMODE.key(e.code); else press(e.code); return;
  }
  if (mode==='stonepick'){ primeAudio();
    if(e.code==='ArrowLeft'){ stonePickSel=(stonePickSel+PICK_STONES.length-1)%PICK_STONES.length; playSfx('sfx_mtog'); }
    else if(e.code==='ArrowRight'){ stonePickSel=(stonePickSel+1)%PICK_STONES.length; playSfx('sfx_mtog'); }
    else if(e.code==='ArrowUp'||e.code==='ArrowDown'){ toggleChar(); }
    else if(e.code==='Comma'){ cycleSkin(-1); }
    else if(e.code==='Period'){ cycleSkin(1); }
    else if(e.code==='Enter'||e.code==='Space'){ confirmStone(); }
    return; }
  if (mode==='controls'){ if(e.code==='Escape') ctrlDone(); return; }
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
// --- block mobile zoom gestures (two-finger button presses were triggering a stuck pinch-zoom) ---
['gesturestart','gesturechange','gestureend'].forEach(ev=>document.addEventListener(ev,e=>e.preventDefault(),{passive:false}));
document.addEventListener('touchmove',e=>{ if(e.touches&&e.touches.length>1) e.preventDefault(); },{passive:false});
let _ltap=0; document.addEventListener('touchend',e=>{ const n=Date.now(); if(n-_ltap<=320) e.preventDefault(); _ltap=n; },{passive:false});
// canvas taps (character select)
function canvasPt(e){ const r=cv.getBoundingClientRect(); return { x:(e.clientX-r.left)/r.width*W, y:(e.clientY-r.top)/r.height*H }; }
cv.addEventListener('pointermove', e=>{ if(mode==='world') WORLDMODE.pmove(canvasPt(e)); });
cv.addEventListener('pointerup',   e=>{ if(mode==='world') WORLDMODE.pup(canvasPt(e)); });
cv.addEventListener('pointercancel', e=>{ if(mode==='world') WORLDMODE.pup(canvasPt(e)); });
cv.addEventListener('pointerdown', e=>{
  primeAudio();
  const pt=canvasPt(e);
  if (mode==='world'){ WORLDMODE.pdown(pt); return; }
  if (mode==='stonepick'){ const inR=(rr)=>rr&&pt.x>rr.x&&pt.x<rr.x+rr.w&&pt.y>rr.y&&pt.y<rr.y+rr.h;
    if(inR(charToggleRect)){ toggleChar(); return; }
    if(inR(skinPrevRect)){ cycleSkin(-1); return; }
    if(inR(skinNextRect)){ cycleSkin(1); return; }
    for(const r of stonePickRects){ if(pt.x>r.x&&pt.x<r.x+r.w&&pt.y>r.y&&pt.y<r.y+r.h){ stonePickSel=r.i; confirmStone(); return; } } return; }
  if (mode==='controls'){ for(const r of ctrlRects){ if(pt.x>r.x&&pt.x<r.x+r.w&&pt.y>r.y&&pt.y<r.y+r.h){ if(r.act==='__reset'){ padMap=Object.assign({},GP_DEFAULT); savePadMap(); playSfx('sfx_mtog'); } else if(r.act==='__done'){ ctrlDone(); } else { gpListen=r.act; playSfx('sfx_mtog'); } return; } } return; }
  if (mode==='load'){
    if (loaded>=total && titleReady){
      mode='title'; titleFade=0; menuShown=false; playSfx('sfx_msel'); startMusicSync('title');
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
    if (pt.x<48 && pt.y<48){ const now2=performance.now(); if(now2-_devTapT>2500) _devTaps=0; _devTapT=now2;
      if(++_devTaps>=5){ _devTaps=0; const turnOn=localStorage.getItem('creapz_dev')!==DEVKEY;
        try{ if(turnOn){ localStorage.setItem('creapz_dev',DEVKEY); devMode=true; } else { localStorage.removeItem('creapz_dev'); devMode=false; } }catch(e){}
        playSfx('sfx_healthup',0.9); devToast=turnOn?'Dev stages unlocked':'Dev locked'; devToastT=2.4; }
      return; }
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
    for (const aR of arrowRects){ if (pt.x>aR.x&&pt.x<aR.x+aR.w&&pt.y>aR.y&&pt.y<aR.y+aR.h){ if(aR.who==='d'){ const i=DORDER.indexOf(dingSkin); dingSkin=DORDER[(i+aR.dir+DORDER.length)%DORDER.length]; selFoc=1; } else { const i=ORDER.indexOf(creaperSkin); creaperSkin=ORDER[(i+aR.dir+ORDER.length)%ORDER.length]; selFoc=0; } selRow=1; playSfx('sfx_mtog'); return; } }
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
let loaded=0, total=0, titleReady=false;
function L(d){ const img=new Image(); total++; img.onload=()=>loaded++; img.src=d.src;
  return {img,sw:d.sw,sh:d.sh,w:d.w,h:d.h,frames:d.frames,foots:d.foots,cxs:d.cxs,weapon:d.weapon}; }
// loading-screen runners load FIRST so they appear above the bar right away
['default','dingbat'].forEach(ck=>{ const c=SPRITES.chars[ck]; if(c&&c.run){ SPR.chars[ck]=SPR.chars[ck]||{}; SPR.chars[ck].run=L(c.run); if(c.fps) SPR.chars[ck].fps=c.fps; } });
SPR.obst = {};
for (const k in SPRITES.obst){ const d=SPRITES.obst[k]; const img=new Image(); total++; img.onload=()=>loaded++; img.src=d.src; SPR.obst[k]={img,w:d.w,h:d.h}; }
SPR.trees={}; for (const k in SPRITES.trees){ const d=SPRITES.trees[k]; const img=new Image(); total++; img.onload=()=>loaded++; img.src=d.src; SPR.trees[k]={img,w:d.w,h:d.h}; }
SPR.zombie={}; for (const k in SPRITES.zombie){ SPR.zombie[k]=L(SPRITES.zombie[k]); }
SPR.zgen={}; for (const k in SPRITES.zgen){ SPR.zgen[k]=L(SPRITES.zgen[k]); }
SPR.gob={}; for (const k in SPRITES.gob){ SPR.gob[k]=L(SPRITES.gob[k]); }
SPR.bd={}; for (const k in SPRITES.bd){ SPR.bd[k]=L(SPRITES.bd[k]); }
SPR.golem={}; for (const k in SPRITES.golem||{}){ SPR.golem[k]=L(SPRITES.golem[k]); }
SPR.witch={}; for (const k in SPRITES.witch||{}){ SPR.witch[k]=L(SPRITES.witch[k]); }
SPR.skel={}; for (const k in SPRITES.skel||{}){ SPR.skel[k]=L(SPRITES.skel[k]); }
SPR.knight={}; for (const k in SPRITES.knight||{}){ SPR.knight[k]=L(SPRITES.knight[k]); }
SPR.angel={}; for (const k in SPRITES.angel||{}){ SPR.angel[k]=L(SPRITES.angel[k]); }
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
for (const ck in SPRITES.chars){ SPR.chars[ck]=SPR.chars[ck]||{};
  for (const an in SPRITES.chars[ck]){
    if (an==='fps'){ SPR.chars[ck].fps=SPRITES.chars[ck].fps; continue; }
    if (SPR.chars[ck][an]) continue;   // already preloaded (run sprites for the loading screen)
    SPR.chars[ck][an]=L(SPRITES.chars[ck][an]);
  } }
const FPS = { idle:17, walk:16, run:16, jump:23, attack:38, hurt:48, kneel:48, cast:32, dive:1 };
function isDing(ck){ return ck==='dingbat'||ck.slice(0,5)==='ding_'; }
function pfps(st2){ const f=SPR.chars[chosen]&&SPR.chars[chosen].fps; return (f&&f[st2])||FPS[st2]; }
const FZ = { idle:24, walk:12, attack:16 };
const FZK = { zombie:FZ, zgen:FZ, gob:{idle:13, walk:12, attack:43}, bd:{idle:12, walk:12, attack:12}, golem:{idle:12, walk:12, attack:18}, witch:{idle:12, jump:22, attack:12}, skel:{idle:24, walk:24, run:24, jump:24, attack:24}, knight:{idle:12, walk:12, jump:12, attack:17}, angel:{idle:24, walk:24, run:24, attack:24} };
const KSPD = { zombie:1.7, zgen:1.7, gob:2.4, bd:1.15, golem:1.05 };
const KRNG = { zombie:74, zgen:74, gob:76, bd:-1, golem:200 };  // gob spear reach ~78; bd never melee-attacks (contact only)
const GOLEM_RNG=205, GOLEM_SHOCK=300, GOLEM_ATK_DUR=15/27+10/18;
function golemAtkFrame(el){ const t1=15/27; if(el<t1) return Math.min(14,Math.floor(el*27)); return Math.min(24,15+Math.floor((el-t1)*18)); }
const ZSPEED = 1.7;
const PMAXHP = 4, ZMAXHP = 2;
const DISCORD_BLOCK=0.22, DISCORD_KILL=0.12;
function curMaxHP(){ const m=artProg().megas||{}; return PMAXHP + Math.min(6,(m.vigorShards||[]).length); }
function greedMult(){ return (artProg().megas||{}).greed?2:1; }
function hasDiscord(){ return !!(artProg().megas||{}).discord; }
const SOUL_PTS = 100;
const KPTS = { bd:100, gob:300, bat:300, zombie:500, zgen:800, golem:1500, witch:600, skel:500, knight:700, angel:700 };
const CHASER = { skel:{walkSpd:1.5, runSpd:3.5, runRange:340, atkRange:92, atkFrames:22, atkFps:24, atkHit:[9,16], atkDmg:1}, knight:{walkSpd:1.6, atkRange:104, atkFrames:16, atkFps:17, atkHit:[6,12], atkDmg:2}, angel:{walkSpd:1.3, runSpd:2.6, runRange:540, atkRange:450, atkFrames:33, atkFps:24, atkFire:16, atkDmg:1, ranged:true, fly:true, flyLift:90, fcol:'dark', shotSpd:300, shotR:17, atkCdMin:1.4} };
function timeBrackets(idx){
  const s=idx*30;   // each act shifts brackets by 30s
  return [[90+s,3000],[120+s,2000],[180+s,1000]];
}
// procedural soul (ASCEND design): cached radial bitmaps, no shadowBlur, no per-frame gradients
function _srad(size,stops){ const c=document.createElement('canvas'); c.width=c.height=size;
  const g=c.getContext('2d'), gr=g.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2);
  for (const st of stops) gr.addColorStop(st[0],st[1]);
  g.fillStyle=gr; g.fillRect(0,0,size,size); return c; }
function makeSoulFx(r,g,b){ const C=a=>'rgba('+r+','+g+','+b+','+a+')'; const hi='rgba('+Math.min(255,r+110)+','+Math.min(255,g+45)+','+Math.min(255,b+30)+',1)';
  return { glow:_srad(128,[[0,C(0.55)],[0.35,C(0.28)],[0.7,C(0.10)],[1,C(0)]]),
    core:_srad(64,[[0,'rgba(255,255,255,1)'],[0.28,hi],[0.55,C(0.95)],[0.82,C(0.55)],[1,C(0)]]),
    mote:_srad(20,[[0,'rgba(255,255,255,1)'],[0.4,C(0.9)],[1,C(0)]]) }; }
const SOUL_FX={1:makeSoulFx(120,210,255),5:makeSoulFx(255,90,90),25:makeSoulFx(80,224,122),50:makeSoulFx(180,95,255),100:makeSoulFx(255,205,70)};
const SOUL_COL={1:'#7fe0ff',5:'#ff5a5a',25:'#5ae07a',50:'#b25aff',100:'#ffcf3c'};
function drawSoulFx(x,y,R,A,ph,val){
  const fx=SOUL_FX[val]||SOUL_FX[1];
  const bob=Math.sin(gt*2.2+ph)*4, br=0.5+0.5*Math.sin(gt*2.6+ph*1.7), cy=y+bob;
  ctx.globalCompositeOperation='lighter';
  const gs=R*(4.6+0.7*br); ctx.globalAlpha=A*0.85*(0.55+0.40*br);
  ctx.drawImage(fx.glow,x-gs/2,cy-gs/2,gs,gs);
  const cs=R*1.9*(1+0.06*br); ctx.globalAlpha=A;
  ctx.drawImage(fx.core,x-cs/2,cy-cs/2,cs,cs);
  for(let i=0;i<5;i++){ const u=((gt*0.42+ph+i/5)%1);
    const yy=cy+R*1.0-u*R*4.2, xx=x+Math.cos(u*10.5+ph+i)*R*1.25*(1-u*0.45);
    const ua=(u<0.12?u/0.12:1-(u-0.12)/0.88), s=2.4*(1-u*0.5)*(R/13);
    ctx.globalAlpha=A*0.9*ua; ctx.drawImage(fx.mote,xx-s*2,yy-s*2,s*4,s*4); }
  ctx.globalAlpha=1; ctx.globalCompositeOperation='source-over';
}
const BAT_FPS = 15, BITE_FPS = 29, BAT_PATROL = 1.25, BAT_CHASE = 2.1, BAT_AGGRO = 280;

let mode='select', chosen=ORDER[0];
let p, souls, soulCount, soulOrbGot=0, totalOrbVal=0, gt=0, camX=0, camY=0, WORLDH=440, GOALY=360, zombies, plats, chkOn, bats, bolts, impacts, loots=[];
let paused=false, menuRects=[];
let musicVol=1, sfxVol=1;
try{ musicVol=Math.min(1,Math.max(0,parseFloat(localStorage.getItem('creapz_mvol')??'1'))); sfxVol=Math.min(1,Math.max(0,parseFloat(localStorage.getItem('creapz_svol')??'1'))); }catch(e){}
function saveVols(){ try{ localStorage.setItem('creapz_mvol',musicVol); localStorage.setItem('creapz_svol',sfxVol); }catch(e){} }
let menuShown=false, optionsOpen=false, cryptOpen=false, titleFade=0;
let menuSel=0, optSel=0, selFoc=0, selRow=0, panelSel=0;   // keyboard nav cursors
// ---- gamepad mapping ----
const GP_ACTIONS=[['jump','Jump'],['attack','Attack'],['cast','Cast'],['left','Move Left'],['right','Move Right'],['down','Crouch / Down'],['pause','Pause']];
const GP_CODE={left:'ArrowLeft',right:'ArrowRight',down:'ArrowDown',jump:'Space',attack:'KeyZ',cast:'KeyX'};
const GP_DEFAULT={jump:0,attack:2,cast:3,left:14,right:15,down:13,pause:9};
function loadPadMap(){ try{ const j=JSON.parse(localStorage.getItem('creapz_padmap')); if(j) return Object.assign({},GP_DEFAULT,j); }catch(e){} return Object.assign({},GP_DEFAULT); }
let padMap=loadPadMap(), padPrev={}, padRepeat={}, gpListen=null, gpConnected=false, ctrlReturn='title', ctrlRects=[];
function savePadMap(){ try{ localStorage.setItem('creapz_padmap',JSON.stringify(padMap)); }catch(e){} }
function ctrlDone(){ gpListen=null; mode=ctrlReturn; playSfx('sfx_mtog'); }
function pollGamepad(){
  const gps=navigator.getGamepads?navigator.getGamepads():[]; let gp=null;
  for(const g of gps){ if(g&&g.connected){ gp=g; break; } }
  gpConnected=!!gp; if(!gp){ padPrev={}; return; }
  const bp=i=>(i!=null&&gp.buttons[i])?gp.buttons[i].pressed:false, ax=i=>gp.axes[i]||0;
  if(mode==='controls'){
    if(gpListen){ for(let i=0;i<gp.buttons.length;i++){ if(gp.buttons[i].pressed && !padPrev['b'+i]){ padMap[gpListen]=i; savePadMap(); gpListen=null; playSfx('sfx_msel'); break; } } }
    else if(gp.buttons[1] && gp.buttons[1].pressed && !padPrev['b1']) ctrlDone();
    for(let i=0;i<gp.buttons.length;i++) padPrev['b'+i]=gp.buttons[i].pressed; return;
  }
  if(mode==='play' && !menuOpen() && !(p&&p.winning)){
    const st={ left:bp(padMap.left)||ax(0)<-0.45, right:bp(padMap.right)||ax(0)>0.45, down:bp(padMap.down)||ax(1)>0.5, jump:bp(padMap.jump), attack:bp(padMap.attack), cast:bp(padMap.cast) };
    for(const a in GP_CODE){ if(st[a]&&!padPrev[a]) press(GP_CODE[a]); else if(!st[a]&&padPrev[a]) release(GP_CODE[a]); padPrev[a]=st[a]; }
    const pz=bp(padMap.pause); if(pz&&!padPrev.pause && p && !p.dead && !p.won && !p.winning){ paused=!paused; panelSel=0; playSfx('sfx_mtog'); } padPrev.pause=pz;
    return;
  }
  // any menu / paused / overlay: drive the same keyboard nav every menu already listens to
  for(const a in GP_CODE){ if(padPrev[a]){ release(GP_CODE[a]); padPrev[a]=false; } }
  const kbd=(ty,code)=>{ try{ window.dispatchEvent(new KeyboardEvent(ty,{code})); }catch(e){} };
  const now=performance.now();
  const NAV=[[12,1,-1,'ArrowUp'],[13,1,1,'ArrowDown'],[14,0,-1,'ArrowLeft'],[15,0,1,'ArrowRight']];
  for(const d of NAV){ const code=d[3], held=bp(d[0])||(d[2]<0?ax(d[1])<-0.5:ax(d[1])>0.5), key='n'+code;
    if(held){ if(!padPrev[key]){ kbd('keydown',code); padRepeat[key]=now+340; } else if(now>=padRepeat[key]){ kbd('keydown',code); padRepeat[key]=now+150; } }
    else if(padPrev[key]){ kbd('keyup',code); }
    padPrev[key]=held; }
  const conf=bp(0), back=bp(1), start=bp(9);
  if(conf&&!padPrev.gC) kbd('keydown','Enter'); else if(!conf&&padPrev.gC) kbd('keyup','Enter'); padPrev.gC=conf;
  if((back||start)&&!padPrev.gB) kbd('keydown','Escape'); else if(!(back||start)&&padPrev.gB) kbd('keyup','Escape'); padPrev.gB=(back||start);
}
function gpBtnName(i){ const n={0:'A / \u2715',1:'B / \u25cb',2:'X / \u25a1',3:'Y / \u25b3',4:'LB',5:'RB',6:'LT',7:'RT',8:'Select',9:'Start',10:'L3',11:'R3',12:'D-Up',13:'D-Down',14:'D-Left',15:'D-Right'}; return (i==null||i<0)?'\u2014':(n[i]||('Btn '+i)); }
function drawControls(){
  ctx.setTransform(RS,0,0,RS,0,0); ctx.fillStyle='#0c0a18'; ctx.fillRect(0,0,W,H);
  ctx.textAlign='center'; ctx.fillStyle='#eae6ff'; ctx.font='bold 26px sans-serif'; ctx.fillText('Controller Mapping', W/2, 48);
  ctx.font='13px sans-serif'; ctx.fillStyle=gpConnected?'#7fe0ff':'#ff9a9a'; ctx.fillText(gpConnected?'controller connected \u00b7 tap a row, then press a button to bind':'no controller detected \u2014 connect one & press any button', W/2, 72);
  ctrlRects=[]; const rw=440, rx=W/2-rw/2; let y=92;
  for(let i=0;i<GP_ACTIONS.length;i++){ const act=GP_ACTIONS[i][0], label=GP_ACTIONS[i][1], lis=(gpListen===act);
    ctx.fillStyle=lis?'rgba(200,251,80,.16)':'rgba(155,140,255,.10)'; roundRect(rx,y,rw,34,8); ctx.fill();
    if(lis){ ctx.strokeStyle='#c8fb50'; ctx.lineWidth=2; roundRect(rx,y,rw,34,8); ctx.stroke(); }
    ctx.textAlign='left'; ctx.fillStyle='#cfd0e8'; ctx.font='600 15px sans-serif'; ctx.fillText(label, rx+16, y+22);
    ctx.textAlign='right'; ctx.fillStyle=lis?'#c8fb50':'#9bd0ff'; ctx.font='bold 14px sans-serif'; ctx.fillText(lis?'press a button\u2026':gpBtnName(padMap[act]), rx+rw-16, y+22);
    ctrlRects.push({x:rx,y:y,w:rw,h:34,act}); y+=40; }
  y+=6; ctx.textAlign='center'; ctx.font='600 15px sans-serif';
  ctx.fillStyle='rgba(155,140,255,.16)'; roundRect(rx,y,rw/2-8,38,10); ctx.fill(); ctx.fillStyle='#cdbbe6'; ctx.fillText('Reset to Default', rx+(rw/2-8)/2, y+24); ctrlRects.push({x:rx,y:y,w:rw/2-8,h:38,act:'__reset'});
  ctx.fillStyle='rgba(63,191,106,.22)'; roundRect(rx+rw/2+8,y,rw/2-8,38,10); ctx.fill(); ctx.fillStyle='#a8f0c0'; ctx.fillText('Done', rx+rw/2+8+(rw/2-8)/2, y+24); ctrlRects.push({x:rx+rw/2+8,y:y,w:rw/2-8,h:38,act:'__done'});
  ctx.textAlign='left';
}
let slotSel=0, slotConfirm=-1, confSel=1, selMode='new', slotRects=[], delRects=[], confRects=[];
let TIMG=null;
const TITLEBG=new Image(); TITLEBG.src='./assets/title_keyart.png?v='+ASSET_VER;
const FLAME_FX=new Image(); FLAME_FX.src='./assets/fx_flame.png?v='+ASSET_VER; const FLAME_N=6;
const RUBY_ORB=new Image(); RUBY_ORB.src='./assets/fx_ruby_orb_v2.png?v='+ASSET_VER;
const CHAOS_FRAGS=[]; for(let i=1;i<=9;i++){ const im=new Image(); im.src='./assets/fx_chaosfrag'+i+'_v3.png?v='+ASSET_VER; CHAOS_FRAGS.push(im); }
let AC=null, musicGain=null, musicSrc=null, musicBuf={}, musicReady={}, musicKey=null, musicReq=0;
function audioInit(){
  if (AC) return;
  try{
    AC=new (window.AudioContext||window.webkitAudioContext)();
    musicGain=AC.createGain(); musicGain.gain.value=0.55; musicGain.connect(AC.destination);
  }catch(e){ AC=null; }
}
function getMusicBuf(key){
  if (!musicBuf[key]){
    const _url=(typeof CUSTOM_MUSIC!=='undefined'&&CUSTOM_MUSIC[key])?('./'+CUSTOM_MUSIC[key]+'?v='+ASSET_VER):('./assets/audio/'+key+'.m4a?v='+ASSET_VER);
    musicBuf[key]=fetch(_url)
      .then(r=>r.arrayBuffer()).then(ab=>AC.decodeAudioData(ab)).then(b=>{ musicReady[key]=b; return b; }).catch(()=>null);
  }
  return musicBuf[key];
}
async function playMusic(key){
  if (!AC || !key || window.SPRITES_INLINE) return;
  const req=++musicReq;
  if (musicSrc){ try{ musicSrc.stop(); }catch(e){} musicSrc=null; }
  musicKey=key;
  const buf=await getMusicBuf(key);
  if (req!==musicReq || musicSrc) return;            // superseded or already started
  if (!buf){ if (musicKey===key) musicKey=null; return; }   // not ready/failed -> allow the loop to retry
  const src=AC.createBufferSource(); src.buffer=buf; src.loop=true;
  src.connect(musicGain); src.start(); musicSrc=src;
}
function startMusicSync(key){
  if (!AC || window.SPRITES_INLINE) return false;
  const b=musicReady[key]; if(!b) return false;
  if (musicKey===key && musicSrc) return true;
  if (musicSrc){ try{musicSrc.stop();}catch(e){} musicSrc=null; }
  musicReq++;
  try{ if(AC.state==='suspended') AC.resume(); const src=AC.createBufferSource(); src.buffer=b; src.loop=true; src.connect(musicGain); src.start(); musicSrc=src; musicKey=key; return true; }catch(e){ return false; }
}
function stopMusic(){ musicReq++; if (musicSrc){ try{ musicSrc.stop(); }catch(e){} musicSrc=null; musicKey=null; } }
function preloadMusic(key){
  if (!AC || !key || window.SPRITES_INLINE) return;
  getMusicBuf(key);   // warm the cache only — playMusic is the sole starter
}
let audioPrimed=false;
function primeAudio(){
  audioInit();
  if (AC){
    try{ const _b=AC.createBufferSource(); _b.buffer=AC.createBuffer(1,1,22050); _b.connect(AC.destination); _b.start(0); }catch(e){}  // iOS/Android: play a real (silent) node in the gesture to unlock
    if (AC.state==='suspended') AC.resume().then(()=>{ if((mode==='title'||mode==='select'||mode==='world')&&musicKey!=='title') playMusic('title'); }).catch(()=>{});
  }
  if (AC && (mode==='title'||mode==='select'||mode==='world') && musicKey!=='title') playMusic('title');
  if (audioPrimed || !AC) return;
  audioPrimed=true;
  ['sfx_msel','sfx_mtog'].forEach(loadSfx);
  (window.STAGES||[]).forEach(st2=>preloadMusic(st2.music));
}
// resume audio after backgrounding / app-switch (iOS suspends the context and won't auto-resume)
function resumeAudio(){
  if(!AC) return;
  if(AC.state!=='running'){
    AC.resume().then(()=>{ if(musicKey){ const k=musicKey; if(musicSrc){ try{musicSrc.stop();}catch(e){} musicSrc=null; } musicKey=null; playMusic(k); } }).catch(()=>{});
  }
}
document.addEventListener('visibilitychange', ()=>{ if(!document.hidden) setTimeout(resumeAudio,80); });
window.addEventListener('focus', resumeAudio);
window.addEventListener('pageshow', resumeAudio);
document.addEventListener('pointerdown', resumeAudio, true);
document.addEventListener('keydown', resumeAudio, true);
let sfxBuf={}, sfxGain=null;
async function loadSfx(key){
  if (!AC || sfxBuf[key] || window.SPRITES_INLINE) return;
  try{
    const r=await fetch('./assets/audio/'+key+'.m4a?v='+ASSET_VER);
    sfxBuf[key]=await AC.decodeAudioData(await r.arrayBuffer());
  }catch(e){}
}
function ensureSfxGain(){
  if (AC && !sfxGain){ sfxGain=AC.createGain(); sfxGain.gain.value=0.45*sfxVol;
    try{ const comp=AC.createDynamicsCompressor(); comp.threshold.value=-20; comp.knee.value=26; comp.ratio.value=5; comp.attack.value=0.003; comp.release.value=0.18; sfxGain.connect(comp); comp.connect(AC.destination); }
    catch(e){ sfxGain.connect(AC.destination); } }
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
let sfxLast={};
function sfxLoop(key, vol){
  if (!AC || !sfxBuf[key]) return null;
  ensureSfxGain();
  const sc=AC.createBufferSource(); sc.buffer=sfxBuf[key]; sc.loop=true;
  const g=AC.createGain(); g.gain.value=(vol===undefined?1:vol); sc.connect(g); g.connect(sfxGain);
  try{ sc.start(); }catch(e){ return null; }
  return sc;
}
function stopLoop(sc){ if(sc){ try{ sc.stop(); }catch(e){} } }
function playSfx(key, vol, delay){
  if (!AC) return;
  ensureSfxGain();
  if (!delay){ const now=AC.currentTime||0, lt=sfxLast[key]; if (lt!==undefined && now-lt<0.04) return null; sfxLast[key]=now; }
  if (!sfxBuf[key]){ loadSfx(key).then(()=>{ if (AC && sfxBuf[key]) sfxFire(key, vol, 0); }); return null; }
  return sfxFire(key, vol, delay);
}
let countSrcs=[];
let banked=0, actScore=0, actSoulPts=0, actKillPts=0, killCount=0, totalEnemies=0, gotHit=false, actTime=0;
let tally=null, fading=0, fadeIn=0;
function addScore(base, kind){
  const m=Math.max(0.25, p.hp/curMaxHP());
  const pts=Math.round(base*m);
  actScore+=pts;
  if (kind==='soul') actSoulPts+=pts; else actKillPts+=pts;
}
function computeTally(){
  const rows=[
    {label:'SOULS  '+soulCount+' / '+totalOrbVal, pts:actSoulPts},
    {label:'REAPED  '+Math.min(killCount,totalEnemies)+' / '+totalEnemies, pts:actKillPts},
  ];
  let bonus=0, topTime=false;
  const br=timeBrackets(stageIdx);
  let tb=0;
  for (let i=0;i<br.length;i++){ if (actTime<=br[i][0]){ tb=br[i][1]; topTime=(i===0); break; } }
  if (!gotHit){ rows.push({label:'PERFECT RUN', pts:5000, bonus:true}); bonus+=5000; }
  if (soulOrbGot>=souls.length){ rows.push({label:'ALL SOULS', pts:2000, bonus:true}); bonus+=2000; }
  const reapAll=killCount>=totalEnemies;
  if (reapAll){ rows.push({label:'FULL REAP', pts:2000, bonus:true}); bonus+=2000; }
  const mm=Math.floor(actTime/60), ss=Math.floor(actTime%60);
  rows.push({label:'TIME  '+mm+':'+(ss<10?'0':'')+ss, pts:tb, bonus:true});
  bonus+=tb;
  if (topTime && reapAll && soulOrbGot>=souls.length){
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
    r.maxSouls=totalOrbVal;
    if(r.secret===undefined) r.secret=null;   // reserved: cReapY stone / secret collectible
    prog.soulz=(prog.soulz||0)+soulCount*greedMult();
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
  drawSoulFx(W*0.34, 299, 9, 1, 2.4, 1);
  ctx.restore();
}
function drawPauseBtn(){
  ctx.fillStyle='rgba(20,16,36,.55)'; roundRect(PB.x,PB.y,PB.w,PB.h,8); ctx.fill();
  ctx.strokeStyle='rgba(150,140,255,.4)'; ctx.lineWidth=1; ctx.stroke();
  ctx.fillStyle='#cfd0e8'; ctx.fillRect(PB.x+12,PB.y+8,5,16); ctx.fillRect(PB.x+23,PB.y+8,5,16);
}
function menuOpen(){ return paused || (p && p.dead && p.deadT>(p.deathHurt?3.05:2.3)) || (p && p.won); }
const SFXLIST=['sfx_slash','sfx_bolt','sfx_jump','sfx_soul','sfx_shriek','sfx_meleehit','sfx_projhit','sfx_die','sfx_wing','sfx_hurt','sfx_ignite','sfx_healthup','sfx_wportal','sfx_dportal','sfx_msel','sfx_mtog','sfx_gspear','sfx_rwhoosh','sfx_zswing','sfx_run','sfx_zsee','sfx_ksee','sfx_count','sfx_gsee','sfx_pdie','sfx_screamchorus','sfx_wportal_fast','sfx_wportal_rev','sfx_wportal_rev2','sfx_wportal_low','sfx_wportal_low2','sfx_portalblast','sfx_portalhum','sfx_chaosspawn','sfx_chaoslaunch','sfx_vigorboost','sfx_golemsee','sfx_golemsmash'];
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
        hp:curMaxHP(), hpShown:curMaxHP(), inv:0, flash:0, dead:false, hurtT:0, invHurt:0, diveT:0, diveRec:0, slamT:0, slamRec:0, deadT:0, spawn:sx, spawnY:sy, standPlat:null, castT:0, castCd:0, castFired:true, winning:false, winT:0 };
  camX=Math.max(0,Math.min(WORLD-W,sx-W*0.38));
  camY=Math.max(0,Math.min(WORLDH-H,sy-H*0.62));
  for(const bo of (bolts||[])){ if(bo.hum){ stopLoop(bo.hum); bo.hum=null; } }
  zbits=[]; bolts=[]; impacts=[]; chkFx=[]; slamGhosts=[]; slamFx=[]; zapFx=[]; curses=[]; shakeT=0; shakeMag=0; maxHPShown=curMaxHP(); hpGrowPending=0; vigorFlash=0;
  if (!keep){
    soulCount=0; soulOrbGot=0; chkOn=CHK.map(()=>false);
    souls = SOUL_POS.map((s,i)=>({x:s[0],y:s[1],val:(s[2]||1),got:false,pop:0,ph:i*0.31}));
    totalOrbVal = souls.reduce((a,s)=>a+s.val,0);
  }
  plats = PLAT_DEF.map(q=>({x:q.x!==undefined?q.x:q.x0, x0:q.x0, y:q.y, w:q.w, t:q.t, skin:q.skin, z:q.z,
    range:q.range||0, spd:q.spd||0, ph:0, dir:1, dxf:0,
    ct:0, falling:false, gone:false, dy:0, fv:0, rt:0}));
  const zspawn=ST.enemies;
  zombies = zspawn.map(z=>{ const kw=z[3]||'zombie', mh=(kw==='golem')?8:(kw==='knight')?4:(kw==='witch'||kw==='skel'||kw==='angel')?3:(kw==='zgen')?3:((kw==='gob'||kw==='bd')?1:ZMAXHP);
    return {x:z[0], y:(z[4]!==undefined?z[4]:GROUND), t:Math.random(), facing:(z[5]!==undefined?z[5]:-1), face:(z[5]!==undefined?z[5]:-1), state:'idle', atkT:0,
    dead:false, dieT:0, dframe:0, dstate:kw==='bd'?'walk':'idle', pdir:(z[5]!==undefined?z[5]:-1), min:z[1], max:z[2], kw,
    hp:mh, maxhp:mh, hpShown:mh, hitCd:0, shown:0, aggro:false, atkCd:0, smashDone:false, atkElapsed:0}; });
  const bspawn=ST.bats;
  bats = bspawn.map((b,i)=>({x:b[0], y:b[3], y0:b[3], t:Math.random()*3, ph:i*1.7, facing:(b[4]!==undefined?b[4]:-1), dir:(b[4]!==undefined?b[4]:(i%2?1:-1)),
    min:b[1], max:b[2], dead:false, dieT:0, yD:b[3], state:'idle', bt:0, biteCd:0}));
  hazReset();
}
function onReset(){ if (p && p.dead && !p.won) reset(true); else reset(); }
function inTerrain(x,y){ for(const sg of TSOLID){ if(x>sg.l+1 && x<sg.r-1 && y>sg.top+1 && y<sg.bot-1) return true; } return false; }
function floorNear(x,fy){ for(const t of segFloorsAt(x)){ if(t>=fy-4 && t<=fy+6) return true; } for(const sg of TSOLID){ if(x>sg.l&&x<sg.r && sg.top>=fy-4 && sg.top<=fy+6) return true; } return false; }
function updateSlam(dt){
  for(const s of GSLAM){ const t=s.tex;
    if(s.phase==='idle'){ if(p.x>s.solid.l-s.trig && p.x<s.solid.r+s.trig) { s.phase='windup'; s.tmr=0; } }
    else if(s.phase==='windup'){ s.tmr+=dt; const k=Math.min(1,s.tmr/s.windup); s.off=s.dir*14*k*k; if(s.tmr>=s.windup) s.phase='slam'; }
    else if(s.phase==='slam'){ s.off+=s.dir*s.slamV*dt; if(Math.abs(s.off)>=s.dist){ s.off=s.dir*s.dist; s.phase='dwell'; s.tmr=0; playSfx('sfx_hurt',0.25); } }
    else if(s.phase==='dwell'){ s.tmr+=dt; if(s.tmr>=s.dwell) s.phase='retract'; }
    else if(s.phase==='retract'){ s.off-=s.dir*s.retractV*dt; if(s.dir>0?(s.off<=0):(s.off>=0)){ s.off=0; s.phase='idle'; } }
    t.y=s.restY+s.off; const top=t.y+s.relTop, bot=t.y+s.relBot; s.solid.top=top; s.solid.bot=bot;
    const l=s.solid.l, r=s.solid.r, head=p.y-PH;
    if(!(p.x+PW/2>l && p.x-PW/2<r)) continue;
    if(s.dir<0){ // UP-slam: rising TOP pushes the player up; if a ceiling blocks the push -> crush
      if(top < p.y-2 && top > head){ const nh=top-PH; if(inTerrain(p.x,nh+2)||inTerrain(p.x-PW/2+3,nh+2)||inTerrain(p.x+PW/2-3,nh+2)){ crushPlayer(p.x<(l+r)/2?-1:1); } else { p.y=top; if(p.vy>0)p.vy=0; p.onGround=true; } }
      else if(Math.abs(p.y-top)<8 && p.vy>=-1){ p.y=top; if(p.vy>0)p.vy=0; p.onGround=true; }
    } else { // DOWN-slam: descending BOTTOM pushes the player down; if a floor blocks the push -> crush
      if(bot > head+2 && bot < p.y){ const nf=bot+PH; if(floorNear(p.x,nf)||inTerrain(p.x,nf-2)){ crushPlayer(p.x<(l+r)/2?-1:1); } else { p.y=nf; if(p.vy<0)p.vy=0; } }
      else if(Math.abs(p.y-top)<8 && p.vy>=-1){ p.y=top; if(p.vy>0)p.vy=0; p.onGround=true; }
    }
  }
}
function hazReset(){ rocks=[]; volleys=[]; loots=[]; for(const h of HAZ){ h.cd=0; if(h.cds) h.cds=h.cds.map(()=>0); } for(const s of GSLAM){ s.phase='idle'; s.off=0; s.tmr=0; if(s.tex&&s.solid){ s.tex.y=s.restY; s.solid.top=s.restY+s.relTop; s.solid.bot=s.restY+s.relBot; } } }
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
function addShake(m,d){ shakeMag=Math.max(shakeMag,m); shakeT=Math.max(shakeT,d); }
function slamBoom(x,y){
  addShake(9,0.26); slamFx.push({x,y,t:0});
  for(let i=0;i<16;i++){ const side=i%2?1:-1; zbits.push({x:x+side*8, y:y-6, vx:side*(150+Math.random()*230), vy:-(30+Math.random()*130), sz:2+Math.random()*3.2, life:0.3+Math.random()*0.3, t:0, c:['#caa37a','#9c8260','#d8c4a0','#7a6248'][(Math.random()*4)|0]}); }
  for (const z of zombies){ if(z.dead) continue; if(Math.abs(z.x-x)<SLAM_R && Math.abs(z.y-y)<150){ z.hp-=2; z.shown=3; if(z.hp<=0){ z.dead=true; z.dieT=0; z.dstate=z.state; z.dframe=Math.floor(z.t*FZK[z.kw][z.state])%SPR[z.kw][z.state].frames; zbitsBurst(z,16); killCount++; addScore(KPTS[z.kw]||300); playSfx('sfx_die',0.7); } } }
  for (const b of bats){ if(b.dead) continue; if(Math.abs(b.x-x)<SLAM_R && Math.abs(b.y-y)<160){ b.dead=true; b.dieT=0; batBits(b,14); killCount++; addScore(KPTS.bat); playSfx('sfx_die',0.7); } }
  playSfx('sfx_meleehit',0.9); playSfx('sfx_ignite',0.5);
}
function drawSlamFx(){
  for(const f of slamFx){ const k=f.t/0.4; if(k>=1) continue; const sx=f.x-camX, gy=f.y;
    ctx.save();
    const R=22+k*118;
    ctx.globalAlpha=(1-k)*0.8; ctx.strokeStyle='rgba(205,228,255,0.9)'; ctx.lineWidth=Math.max(0.5,3.6-2.6*k);
    ctx.beginPath(); ctx.ellipse(sx, gy-6, R, R*0.34, 0, 0, Math.PI*2); ctx.stroke();
    ctx.globalAlpha=(1-k)*0.45; ctx.strokeStyle='rgba(150,185,255,0.7)'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.ellipse(sx, gy-6, R*0.62, R*0.22, 0, 0, Math.PI*2); ctx.stroke();
    if(k<0.32){ ctx.globalAlpha=(0.32-k)/0.32*0.6; ctx.fillStyle='#dcebff'; ctx.beginPath(); ctx.ellipse(sx,gy-12,32*(1-k),21*(1-k),0,0,Math.PI*2); ctx.fill(); }
    ctx.restore();
  }
}
function zBodyBox(z){
  if (z.kw==='witch') return {x:z.x-26, y:z.y-120, w:52, h:120};
  if (z.kw==='skel') return {x:z.x-26, y:z.y-122, w:52, h:122};
  if (z.kw==='knight') return {x:z.x-30, y:z.y-132, w:60, h:132};
  if (z.kw==='angel') return {x:z.x-30, y:z.y-130, w:60, h:130};
  if (z.kw==='golem') return {x:z.x-92, y:z.y-191, w:184, h:189};
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
  pollGamepad();
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
  else if (mode==='stonepick') drawStonePick();
  else if (mode==='controls') drawControls();
  else if (mode==='soulbox'){}
  else { try{ update(dt); draw(); }catch(err){ if(!window.__loopErr){ window.__loopErr=1; console.error('loop error:',err); } } }
  if (devToastT>0){ devToastT-=dt; ctx.setTransform(RS,0,0,RS,0,0); ctx.save(); ctx.globalAlpha=Math.min(1,devToastT*2.5); const tw=210; ctx.fillStyle='rgba(8,6,18,0.85)'; roundRect(W/2-tw/2,H-54,tw,30,8); ctx.fill(); ctx.strokeStyle='rgba(200,251,80,0.6)'; ctx.lineWidth=1; ctx.stroke(); ctx.fillStyle='#c8fb50'; ctx.font='bold 14px sans-serif'; ctx.textAlign='center'; ctx.fillText(devToast, W/2, H-34); ctx.textAlign='left'; ctx.restore(); }
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
  if (p.invHurt>0) p.invHurt-=dt;
  if (shakeT>0){ shakeT-=dt; if(shakeT<=0){ shakeT=0; shakeMag=0; } }
  if (p.flash>0) p.flash-=dt;
  if (chaosGlitchT>0) chaosGlitchT-=dt;
  if (p.barrierT>0) p.barrierT-=dt;
  if (p.hurtT>0) p.hurtT-=dt;
  p.hpShown += (p.hp-p.hpShown)*Math.min(1,dt*8);
  { const cm=curMaxHP(); maxHPShown += (cm-maxHPShown)*Math.min(1,dt*6); if(hpGrowPending && cm-maxHPShown<0.06){ maxHPShown=cm; vigorFlash=0.5; hpGrowPending=0; } if(vigorFlash>0) vigorFlash-=dt; }
  if (powerActive && transformT>0 && !p.dead){
    transformT-=dt; powerPulse+=dt; p.vx=0; p.vy=0; p.onGround=false; p.y-=16*dt; p.inv=Math.max(p.inv,0.5);
    if(p.state!=='jump'){ p.state='jump'; p.clock=0; } p.clock+=dt;
    if(transformT<=0){ powerBoom=0.42; playSfx('sfx_wportal_low2',0.55); playSfx('sfx_meleehit',0.7); }
    camX=Math.max(0,Math.min(WORLD-W,p.x-W*0.38)); const _cty=Math.max(0,Math.min(WORLDH-H,p.y-H*0.62)); camY+=(_cty-camY)*Math.min(1,dt*7);
    return;
  }
  if (p.dead){
    const pd0=p.deadT; p.deadT+=dt;
    const _dpt=p.deathHurt?1.42:0.45; if (pd0<_dpt && p.deadT>=_dpt) playSfx('sfx_dportal');
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
  updateSlam(dt);
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
  { const _down=(keys['ArrowDown']||keys['KeyS']);
    if (_down && !p._downPrev && !p.onGround && !keys['KeyX'] && !p.dead && !p.won && !p.winning && p.diveT<=0 && p.diveRec<=0 && p.slamT<=0 && p.slamRec<=0){ p.slamT=1; p.vx=0; p.vy=SLAM_VY; slamGhosts=[]; playSfx('sfx_rwhoosh',1.0); }
    p._downPrev=_down; }
  if (p.slamRec>0){ p.slamRec-=dt; p.vx=0; }
  if (p.slamT>0){ slamGhosts.push({x:p.x,y:p.y}); if(slamGhosts.length>9) slamGhosts.shift(); p.vx=0; }
  else if (slamGhosts.length) slamGhosts.shift();
  if (powerActive && equippedStone==='sapphire' && transformT<=0){ if(Math.abs(p.vx)>1.5||!p.onGround){ sapTrail.push({x:p.x,y:p.y,st:p.state,fi:curFrame(),f:p.facing}); if(sapTrail.length>10) sapTrail.shift(); } else if(sapTrail.length) sapTrail.shift(); }
  else if (sapTrail.length) sapTrail.length=0;
  const kneeling = false;   // crouch removed; Down is now a modifier (Down+cast = upward attack)
  let dir=0;
  if (!kneeling){ if (keys['ArrowLeft']) dir=-1; else if (keys['ArrowRight']) dir=1; }
  const dc=dir<0?'ArrowLeft':'ArrowRight';
  const running=(dir!==0&&runHeld[dc])||keys['ShiftLeft']||keys['ShiftRight'];
  let inTar=false; for(const h of HAZ){ if(h.t==='tar' && p.onGround && p.x>=h.x && p.x<=h.x+h.w && Math.abs(p.y-h.y)<8){ inTar=true; break; } }
  if(p.inv<=0){ for(const z of GHURT){ if(p.x+26>z.l && p.x-26<z.r && p.y>z.top && (p.y-PH)<z.bot){ hurtPlayer((z.l+z.r)/2,1); break; } } }
  const speed=(running?RUN:WALK)*(inTar?0.4:1)*((powerActive&&equippedStone==='topaz')?1.7:1);
  if (p.diveT<=0 && p.diveRec<=0 && p.slamT<=0 && p.slamRec<=0){ if (dir!==0){ p.vx=dir*speed; p.facing=dir; } else p.vx=0; }
  if (!kneeling && p.diveRec<=0 && p.slamRec<=0 && (keys['Space']||keys['ArrowUp'])&&p.onGround){ p.vy=JUMP*(inTar?0.78:1); p.onGround=false; playSfx('sfx_jump',0.55); }
  if (keys['KeyZ']&&p.attackT<=0&&p.diveT<=0&&p.diveRec<=0&&p.slamRec<=0&&p.onGround&&SPR.chars[chosen].attack.weapon){
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
  if (keys['KeyX']&&p.castT<=0&&p.castCd<=0&&p.attackT<=0&&p.diveT<=0&&p.diveRec<=0&&p.slamT<=0&&p.slamRec<=0){
    p.castT=Math.min(0.5, SPR.chars[chosen].cast.frames/pfps('cast')); p.castCd=0.55; p.castFired=false; p.castUp = (keys['ArrowDown']||keys['KeyS']) && !(powerActive && (equippedStone==='obsidian'||equippedStone==='fluorite'||equippedStone==='chaos'));
  }
  if (p.castT>0){
    p.castT-=dt;
    const cf0=Math.min(0.5, SPR.chars[chosen].cast.frames/pfps('cast'));
    const cfi=Math.min(SPR.chars[chosen].cast.frames-1, Math.floor((cf0 - p.castT)*pfps('cast')));
    const fireAt = chosen==='dingbat' ? 2 : 3;   // dingbat: bolt leaves on the open-mouth frame (11f @40fps)
    if (!p.castFired && cfi>=fireAt){
      p.castFired=true; p.muzzleT=0.14;
      if (powerActive && equippedStone==='obsidian'){
        const vb={x:p.x+p.facing*40, y:p.y-58, vx:p.facing*210, t:0, dead:false, kind:'void', pullCd:0}; bolts.push(vb); playSfx('sfx_portalblast',0.9); vb.hum=sfxLoop('sfx_portalhum',0.6);
      }
      else if (powerActive && equippedStone==='fluorite'){
        const dir=p.facing, oy=p.y-58;
        for(let k=-1;k<=1;k++){ bolts.push({x:p.x+dir*36, y:oy, vx:dir*560, vy:k*160, t:0, dead:false, kind:'prism', homing:true, ph:Math.random()*6.28}); }
        playSfx('sfx_bolt'); playSfx('sfx_bolt',0.45,0.07);
      }
      else if (powerActive && equippedStone==='chaos' && chaosAmmo>0){
        const e=chaosPile.shift(), dir=p.facing;
        const px=(e&&e.wx!==undefined)?e.wx:p.x-dir*20, py=(e&&e.wy!==undefined)?e.wy:p.y-92;
        bolts.push({x:px, y:py, vx:dir*680, vy:-55, t:0, dead:false, kind:'chaosshard', homing:true, life:2.6, dmg:3, v:(e?e.v:0), scl:(e?e.sc:1)});
        chaosAmmo--; stoneCharge=Math.round(PMETER*chaosAmmo/7); chaosGlitchT=0.18;
        playSfx('sfx_chaoslaunch',0.9);
      }
      else if (p.castUp){
        const N=5, sp=560, base=-Math.PI/2;
        for(let i=0;i<N;i++){ const ang=base+(i-(N-1)/2)*0.42; bolts.push({x:p.x, y:p.y-64, vx:Math.cos(ang)*sp, vy:Math.sin(ang)*sp, t:0, dead:false, kind:'bolt'}); }
        playSfx('sfx_bolt',0.85); playSfx('sfx_bolt',0.5,0.06);
      }
      else if (isDing(chosen)){ bolts.push({x:p.x+p.facing*30, y:p.y-66, vx:p.facing*470, t:0, dead:false, kind:'wave'}); playSfx('sfx_shriek'); }
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
  const prevFeet=p.y; if (powerActive && equippedStone==='chaos' && chaosSpawnN>0 && !p.dead){ p.vy=0; p.onGround=false; } else if (p.diveT>0) p.vy=isDing(chosen)?DIVE_VY:BASH_VY; else if (p.slamT>0) p.vy=SLAM_VY; else p.vy+=GRAV; p.y+=p.vy;
  if (p.vy>=0){
    let cand=[]; for(const fy of segFloorsAt(p.x)) cand.push({t:fy,q:null});
    for (const s of SOLID){ if(p.x>=s.l&&p.x<=s.r) cand.push({t:s.top,q:null}); }
    for (const b of GBOUNCE){ if(p.x>=b.l&&p.x<=b.r) cand.push({t:b.top,q:null,bounce:b}); }
    for (const s of GSLAM){ if(p.x>=s.solid.l&&p.x<=s.solid.r) cand.push({t:s.solid.top,q:null}); }
    for (const q of plats){ if(q.gone) continue; if(p.x>=q.x-8&&p.x<=q.x+q.w+8) cand.push({t:q.y+q.dy,q:q}); }
    cand=cand.filter(c=>prevFeet<=c.t+1&&p.y>=c.t).sort((a,b)=>a.t-b.t);
    if (cand.length){ const c0=cand[0];
      if (c0.bounce){ p.y=c0.t; p.vy=-c0.bounce.strength; p.onGround=false; p.standPlat=null; playSfx('sfx_jump',0.7); }
      else { p.y=c0.t; p.vy=0; p.onGround=true; p.standPlat=c0.q;
        if (c0.q && c0.q.t==='c' && c0.q.ct===0) c0.q.ct=0.0001; }
    } else { p.onGround=false; p.standPlat=null; }
  } else {
    p.onGround=false; p.standPlat=null;
    // ceiling bonk: rising head into a terrace underside -> stop vertically (don't eject sideways)
    for (const s of TSOLID){
      if (p.x+PW/2>s.l+3 && p.x-PW/2<s.r-3){
        const head=p.y-PH;
        if (head<s.bot && head>s.top-40 && (prevFeet-PH)>=s.bot-1){ p.y=s.bot+PH; p.vy=0; break; }
      }
    }
  }
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
    p.inv=1.2; p.invHurt=1.2; p.flash=0.35; p.hurtT=0;
    if (p.hp<=0){ p.hp=0; p.dead=true; p.deadT=0; p.inv=0; p.flash=0; p.deathHurt=true; p.tossDir=-p.facing; playSfx('sfx_pdie'); }
    camX=Math.max(0,Math.min(WORLD-W,p.x-W*0.38));
    camY=Math.max(0,Math.min(WORLDH-H,p.y-H*0.62));
  }
  for (let ci=0; ci<CHK.length; ci++){
    if (chkOn[ci]) continue;
    const cx=CHK[ci][0], cgy=CHK[ci][1];
    if (overlap(pBodyBox(), {x:cx-42, y:cgy-150, w:84, h:162})){
      chkOn[ci]=true; p.spawn=cx; p.spawnY=cgy;
      chkFx.push({cx, cgy, t:0, hit:false}); playSfx('sfx_ignite',1.6);
    }
  }
  p.x=Math.max(18,Math.min(WORLD-18,p.x));
  if (p.x>=GOAL_X-24 && Math.abs(p.y-GOALY)<120 && p.onGround && !p.won && !p.winning){ p.winning=true; p.winT=0; p.vx=0; p.vy=0; playSfx('sfx_wportal'); }
  if (p.onGround && p.diveT>0){ p.diveT=0; p.diveRec=DIVE_REC; p.vx=0; p.clock=0; playSfx('sfx_meleehit',0.45); }
  if (p.onGround && p.slamT>0){ p.slamT=0; p.slamRec=SLAM_REC; p.vx=0; p.clock=0; p.inv=Math.max(p.inv,SLAM_IFRAMES); slamBoom(p.x, p.y); }
  let st;
  if (p.diveT>0) st='dive';
  else if (p.slamT>0||p.slamRec>0) st='kneel';
  else if (p.diveRec>0) st='kneel';
  else if (p.hurtT>0) st='hurt';
  else if (p.attackT>0) st='attack'; else if (p.castT>0) st='cast'; else if (kneeling && p.onGround) st='kneel'; else if(!p.onGround) st='jump';
  else if (p.vx!==0) st=running?'run':'walk'; else st='idle';
  if (st!==p.state) p.clock=0; p.state=st; p.clock+=dt;
  const pb={x:p.x-26,y:p.y-96,w:52,h:96};
  for (const s of souls){
    if (s.got){ if(s.pop<1) s.pop+=dt/0.28; continue; }
    const r=30, sb={x:s.x-r,y:s.y-r,w:2*r,h:2*r};
    if (overlap(pb,sb)){ s.got=true; s.pop=0; soulCount+=s.val; soulOrbGot++; addScore(SOUL_PTS,'soul'); playSfx('sfx_soul'); if(equippedStone && !powerActive) stoneCharge=Math.min(PMETER, stoneCharge+s.val*greedMult()); }
  }
  // --- combat ---
  let pwb = (p.attackT>0) ? worldWeaponBox(SPR.chars[chosen].attack, curFrame(), p.x, p.y, p.facing) : null;
  for (const o of OBST){
    if (o.type!=='chest') continue;
    if (o.state==='closed'){
      const cb={x:o.x-o.w*0.5, y:o.gy-o.h, w:o.w, h:o.h};
      if (!p.dead && ((p.diveT>0 && overlap(pb,cb)) || (pwb && overlap(pwb,cb)))){
        o.state='open'; o.openT=0; playSfx('sfx_meleehit',0.85); playSfx('sfx_ignite',1.1); spawnLoot(o);
      }
    } else o.openT+=dt;
  }
  for (const L of loots){
    if (L.collected){ L.fade=(L.fade||0)+dt*3.2; continue; }
    L.t+=dt; L.y += (L.restY - L.y)*0.1;
    const drawY=L.y+Math.sin(L.t*3)*3, lb={x:L.x-18,y:drawY-18,w:36,h:36};
    if (!p.dead && overlap(pb,lb)){ L.collected=true; L.fade=0; collectLoot(L); }
  }
  loots=loots.filter(L=>!L.collected || (L.fade||0)<1);
  if (powerActive){
    if(equippedStone!=='chaos') powerT-=dt; if(powerBoom>0)powerBoom-=dt; powerPulse+=dt;
    if (equippedStone==='ruby'){
      const aura={x:p.x-58,y:p.y-118,w:116,h:120};
      for (const z of zombies){ if(z.dead) continue; if(overlap(aura,zBodyBox(z))){
        if(Math.random()<0.75) zbits.push({x:z.x+(Math.random()-0.5)*30, y:z.y-28-Math.random()*46, vx:(Math.random()-0.5)*50, vy:-55-Math.random()*80, sz:1.6+Math.random()*2.6, life:0.35+Math.random()*0.4, t:0, c:['#ffe08a','#ff7a2c','#ff3d2c'][(Math.random()*3)|0]});
        if(z.hitCd<=0){ z.hp-=1; z.hitCd=0.25; z.shown=3;
          if(z.hp<=0){ z.dead=true; z.dieT=0; z.dstate=z.state; z.dframe=0; zbitsBurst(z,14); killCount++; addScore(KPTS[z.kw]||300); playSfx('sfx_die',0.55); } else playSfx('sfx_meleehit',0.45); }
      } }
    }
    else if (equippedStone==='emerald'){
      // Verdant Renewal: pull loose souls in like a magnet + regenerate health
      for(const s of souls){ if(s.got) continue; const dx=p.x-s.x, dy=(p.y-50)-s.y, d=Math.hypot(dx,dy); if(d>2 && d<470){ const pull=Math.min(0.9, dt*(3.0+360/d)); s.x+=dx*pull; s.y+=dy*pull; } }
      emHealAcc+=dt; if(emHealAcc>=1.2){ emHealAcc-=1.2; if(p.hp<curMaxHP()){ p.hp=Math.min(curMaxHP(),p.hp+1); playSfx('sfx_healthup',0.6); for(let i=0;i<9;i++) zbits.push({x:p.x,y:p.y-50,vx:(Math.random()-0.5)*120,vy:-40-Math.random()*95,sz:2+Math.random()*2.5,life:0.5+Math.random()*0.4,t:0,c:'#3ddc84'}); } }
    }
    else if (equippedStone==='amethyst'){
      // Phantom Veil: go spectral — invincible and phase clean through enemies & hazards
      p.inv=Math.max(p.inv,0.35);
    }
    else if (equippedStone==='topaz'){
      if(Math.abs(p.vx)>8) p.inv=Math.max(p.inv,0.2);   // invincible ONLY during the supercharged dash
      // Thunder Rush: electric strikes zap any enemy you run through
      for (const z of zombies){ if(z.dead) continue; if(z.hitCd<=0 && overlap(pBodyBox(), zBodyBox(z))){ z.hp-=2; z.hitCd=0.2; z.shown=3;
        for(let i=0;i<7;i++) zbits.push({x:z.x+(Math.random()-0.5)*24, y:z.y-44-Math.random()*30, vx:(Math.random()-0.5)*200, vy:-40-Math.random()*120, sz:1.5+Math.random()*2, life:0.2+Math.random()*0.25, t:0, c:['#fff2a0','#ffe04a','#ffffff'][(Math.random()*3)|0]});
        playSfx('sfx_bolt',0.5); zapFx.push({x:z.x, y:z.y-44, t:0}); addShake(3,0.08);
        if(z.hp<=0){ z.dead=true; z.dieT=0; z.dstate=z.state; z.dframe=0; zbitsBurst(z,14); killCount++; addScore(KPTS[z.kw]||300); playSfx('sfx_die',0.55); } } }
    }
    else if (equippedStone==='chaos'){
      // Chaos Storm: shards spawn in staggered (sound each), then the battery hovers above/behind + follows you
      const ax0=p.x - p.facing*34, ay0=p.y-104;
      if(chaosSpawnN>0){ chaosSpawnT-=dt; if(chaosSpawnT<=0){ chaosSpawnT=0.11; const e=chaosSpawnQ.shift(); if(e){ e.wx=ax0+e.ox; e.wy=ay0+e.oy; chaosPile.push(e); chaosAmmo++; playSfx('sfx_chaosspawn',0.6); } chaosSpawnN--; } }
      for(const e of chaosPile){ e.wx=ax0+e.ox; e.wy=ay0+e.oy+Math.sin(gt*2+e.sp)*3; }
    }
    if (equippedStone==='chaos'){ if(chaosAmmo<=0 && chaosSpawnN<=0){ powerActive=false; stoneCharge=0; chaosPile=[]; } }
    else if (powerT<=0){ powerActive=false; stoneCharge=0; }
  }
  const FROST=(powerActive&&equippedStone==='sapphire'), efr=FROST?0.32:1;
  for (const z of zombies){
    z.t+=dt*efr; const zpx=z.x;
    if (z.hitCd>0) z.hitCd-=dt;
    if (z.shown>0) z.shown-=dt;
    z.hpShown += (z.hp-z.hpShown)*Math.min(1,dt*10);
    if (z.dead){ z.dieT+=dt; if(z.dieT<0.7 && !z.erase) zbitsEmit(z,dt); continue; }
    const dx=p.x-z.x, ad=Math.abs(dx), dy=Math.abs(z.y-p.y); z.facing = z.aggro ? (dx<0?-1:1) : z.face;
    const _onscr=(z.x-camX)>-20 && (z.x-camX)<W+20;   // must be on-screen, near, and on the same vertical band
    if (!z.aggro && ad<260 && dy<160 && _onscr && !p.dead){
      z.aggro=true;
      if (z.kw==='bd') playSfx('sfx_zsee',0.7);
      else if (z.kw==='gob') playSfx('sfx_gsee',0.7);
      else if (z.kw==='zombie'||z.kw==='zgen') playSfx('sfx_ksee',0.7);
      else if (z.kw==='golem') playSfx('sfx_golemsee',0.95);
    } else if (z.aggro && (ad>440 || dy>260)) z.aggro=false;
    // player weapon strikes zombie body
    if ((p.diveT>0||p.slamT>0) && z.hitCd<=0 && overlap(pBodyBox(), zBodyBox(z))){
      z.hp-=1; z.hitCd=0.6; z.shown=3; playSfx('sfx_meleehit',0.6);
      if (z.hp<=0){ z.dead=true; z.dieT=0; z.dstate=z.state; z.dframe=Math.floor(z.t*FZK[z.kw][z.state])%SPR[z.kw][z.state].frames; zbitsBurst(z,16); killCount++; addScore(KPTS[z.kw]||300); playSfx('sfx_die',0.7); continue; }
    }
    if (pwb && z.hitCd<=0 && overlap(pwb, zBodyBox(z))){
      const _dk=(hasDiscord() && z.kw!=='zgen' && Math.random()<DISCORD_KILL);
      z.hp-=_dk?99:1; z.hitCd=0.45; z.shown=3; playSfx('sfx_meleehit',0.6);
      z.x=clamp(z.x + (z.x<p.x?-12:12), z.min, z.max);
      if(_dk){ for(let i=0;i<18;i++) zbits.push({x:z.x,y:z.y-44,vx:(Math.random()-0.5)*250,vy:-40-Math.random()*170,sz:2+Math.random()*3,life:0.3+Math.random()*0.35,t:0,c:['#ffae57','#ff6a2c','#ffffff'][(Math.random()*3)|0]}); }
      if (z.hp<=0){ z.dead=true; z.dieT=0; z.dstate=z.state; z.dframe=Math.floor(z.t*FZK[z.kw][z.state])%SPR[z.kw][z.state].frames; zbitsBurst(z,16); killCount++; addScore(KPTS[z.kw]||300); playSfx('sfx_die',0.7); continue; }
    }
    if (CHASER[z.kw]){
      const C=CHASER[z.kw]; if(z.atkCd>0) z.atkCd-=dt; const ad=Math.abs(p.x-z.x);
      if(C.fly){ if(z.yhover===undefined) z.yhover=z.y-(C.flyLift||0); if(!z.aggro && ad<C.atkRange+120 && (z.x-camX)>-30 && (z.x-camX)<W+30 && !p.dead) z.aggro=true; }
      if(z.atkT>0){
        z.atkT-=dt*efr; z.state='attack'; const af=Math.min(C.atkFrames-1, Math.floor((C.atkFrames/C.atkFps - z.atkT)*C.atkFps));
        if(C.ranged){ if(af>=C.atkFire && !z.fired){ z.fired=true; chaserFire(z,C); } }
        else if(af>=C.atkHit[0] && af<=C.atkHit[1] && z.hitCd<=0 && p.inv<=0 && !p.dead){ const wb={x:z.facing>0?z.x-10:z.x-C.atkRange+10, y:z.y-96, w:C.atkRange, h:96}; if(overlap(wb,pBodyBox())){ hurtPlayer(z.x,C.atkDmg); z.hitCd=0.5; } }
        if(z.atkT<=0){ z.atkCd=(C.atkCdMin||0.7)+Math.random()*0.6; }
        if(C.fly){ z.y=z.yhover+Math.sin(gt*1.8+z.t)*5; } else z.x=terrWallX(z.x,zpx,z.y,16); continue;
      }
      if(z.aggro && !p.dead){
        if(ad<=C.atkRange && z.atkCd<=0){ z.atkT=C.atkFrames/C.atkFps; z.state='attack'; z.fired=false; if(!C.ranged) playSfx('sfx_zswing',0.7); }
        else if(ad>C.atkRange){ if(C.runSpd && ad<=C.runRange){ z.state='run'; z.x=clamp(z.x+z.facing*C.runSpd*efr,z.min,z.max); } else { z.state='walk'; z.x=clamp(z.x+z.facing*C.walkSpd*efr,z.min,z.max); } }
        else z.state='idle';
      } else z.state='idle';
      if(C.fly){ z.y=z.yhover+Math.sin(gt*1.8+z.t)*5; } else z.x=terrWallX(z.x,zpx,z.y,16);
      if(p.inv<=0 && !p.dead && overlap(pBodyBox(), zBodyBox(z))) hurtPlayer(z.x,1);
      continue;
    }
    if (z.kw==='witch'){
      if(z.wmode===undefined){ z.wmode='idle'; z.castCd=0.8+Math.random(); z.teleCd=3+Math.random()*3; z.atkDur=8/12; z.hopDur=0.55; z.teleDur=0.5; z.alpha=1; z.fired=false; z.hopT=0; z.teleT=0; z.atkT=0; }
      if(z.castCd>0) z.castCd-=dt; if(z.teleCd>0) z.teleCd-=dt;
      if(z.teleT>0){ z.teleT-=dt; const k=z.teleT/z.teleDur; z.alpha = k>0.5?(k-0.5)*2:(0.5-k)*2;
        if(!z.teleDone && k<=0.5){ witchRelocate(z); z.teleDone=true; for(let i=0;i<16;i++) zbits.push({x:z.x+(Math.random()-0.5)*30,y:z.y-50+(Math.random()-0.5)*70,vx:(Math.random()-0.5)*130,vy:-30-Math.random()*120,sz:2+Math.random()*2.5,life:0.4+Math.random()*0.3,t:0,c:['#9bff4a','#5fd83a','#caffa0'][(Math.random()*3)|0]}); }
        if(z.teleT<=0){ z.alpha=1; z.wmode='idle'; } z.state='idle'; continue; }
      if(z.hopT>0){ z.hopT-=dt; const k=Math.max(0,Math.min(1,1-z.hopT/z.hopDur)); z.x=z.hx0+(z.hx1-z.hx0)*k; z.y=z.hy0+(z.hy1-z.hy0)*k-58*Math.sin(k*Math.PI); z.state='jump';
        if(z.hopT<=0){ z.x=z.hx1; z.y=z.hy1; z.wmode='idle'; z.state='idle'; } continue; }
      if(z.atkT>0){ z.atkT-=dt; z.state='attack'; const el=z.atkDur-z.atkT, af=17+Math.floor(el*12);
        if(af>=19 && !z.fired){ z.fired=true; witchFireCurse(z); }
        if(z.atkT<=0){ z.wmode='idle'; z.state='idle'; } continue; }
      if(z.aggro && !p.dead){ const ad=Math.abs(p.x-z.x);
        if(ad<170){ if(z.teleCd<=0 && Math.random()<0.45) witchStartTele(z); else witchStartHop(z); }
        else if(z.castCd<=0){ z.atkT=z.atkDur; z.fired=false; z.wmode='attack'; z.state='attack'; z.castCd=1.8+Math.random()*1.3; }
        else if(z.teleCd<=0 && Math.random()<0.006){ witchStartTele(z); }
        else z.state='idle';
      } else z.state='idle';
      if (p.inv<=0 && !p.dead && overlap(pBodyBox(), zBodyBox(z))) hurtPlayer(z.x,1);
      continue;
    }
    if (z.kw==='golem'){
      if (z.atkCd>0) z.atkCd-=dt;
      if (z.atkT>0){
        z.atkT-=dt*efr; z.state='attack'; z.atkElapsed=GOLEM_ATK_DUR-z.atkT;
        const gf=golemAtkFrame(z.atkElapsed);
        // raised-hands hitbox (jump ONTO the golem during wind-up = risky)
        if (p.inv<=0 && !p.dead){ let hb=null; if(gf>=8&&gf<=15) hb={x:z.x-134, y:z.y-262, w:268, h:153}; else if(gf>=16&&gf<=23) hb={x:z.x-169, y:z.y-105, w:337, h:110}; if(hb && overlap(hb,pBodyBox())) hurtPlayer(z.x,2); }
        // IMPACT: hands touch down -> shake + ground shockwave (grounded + near; jump to avoid)
        if (gf>=20 && !z.smashDone){ z.smashDone=true; addShake(14,0.5); playSfx('sfx_meleehit',0.95); playSfx('sfx_zswing',0.7);
          for(let i=0;i<28;i++){ const sd=(Math.random()<0.5?-1:1); zbits.push({x:z.x+sd*(18+Math.random()*GOLEM_SHOCK), y:z.y-2, vx:sd*(70+Math.random()*250), vy:-30-Math.random()*160, sz:2+Math.random()*3.6, life:0.4+Math.random()*0.45, t:0, c:['#7a6a4a','#5c8a3a','#9a8a5a','#4a5a2a','#caa'][(Math.random()*5)|0]}); }
          if (p.onGround && !p.dead && p.inv<=0 && Math.abs(p.x-z.x)<GOLEM_SHOCK) hurtPlayer(z.x,2);
        }
        if (z.atkT<=0){ z.atkCd=1.4; z.state='idle'; }
      }
      else if (z.aggro && Math.abs(p.x-z.x)<GOLEM_RNG && z.atkCd<=0 && !p.dead){ z.atkT=GOLEM_ATK_DUR; z.atkElapsed=0; z.smashDone=false; z.state='attack'; playSfx('sfx_golemsmash',0.95); }
      else if (z.aggro && Math.abs(p.x-z.x)>GOLEM_RNG-40){ z.state='walk'; z.x=clamp(z.x+z.facing*KSPD.golem*efr, z.min, z.max); }
      else z.state='idle';
      z.x=terrWallX(z.x, zpx, z.y, 16);
      if (p.inv<=0 && !p.dead && overlap(pBodyBox(), zBodyBox(z))) hurtPlayer(z.x,1);
      continue;
    }
    // zombie behavior + its sword strikes player
    if (z.atkT>0){
      z.atkT-=dt*efr; z.state='attack';
      const zfi=Math.floor(z.t*FZK[z.kw].attack)%SPR[z.kw].attack.frames;
      const zwb=worldWeaponBox(SPR[z.kw].attack, zfi, z.x, z.y, z.facing);
      if (zwb && p.inv<=0 && !p.dead && overlap(zwb, pBodyBox())) hurtPlayer(z.x, z.kw==='zgen'?2:1);
    } else if (ad<KRNG[z.kw]){ z.state='attack'; z.atkT=SPR[z.kw].attack.frames/FZK[z.kw].attack; if (z.kw==='gob') playSfx('sfx_gspear',0.8,0.18); else playSfx('sfx_zswing',0.8); }
    else if (ad<340){ z.state='walk'; z.x=clamp(z.x+z.facing*KSPD[z.kw]*efr, z.min, z.max); }
    else if (z.kw==='bd'){
      z.state='walk';
      z.x+=z.pdir*KSPD.bd*efr;
      if (z.x>=z.max){ z.x=z.max; z.pdir=-1; } else if (z.x<=z.min){ z.x=z.min; z.pdir=1; }
      z.facing=z.pdir;
    }
    else z.state='idle';
    z.x=terrWallX(z.x, zpx, z.y, 16);
    if (p.inv<=0 && !p.dead && overlap(pBodyBox(), zBodyBox(z))) hurtPlayer(z.x);
  }
  for (const b of bats){
    b.t+=dt*efr;
    if (b.dead){ b.dieT+=dt; if(b.dieT<0.45&&Math.random()<0.5&&!b.erase) batBits(b,1); continue; }
    if (b.biteCd>0) b.biteCd-=dt;
    const tx=p.x, ty=p.y-58;
    const dxp=tx-b.x, dyp=ty-b.y, dist=Math.hypot(dxp,dyp);
    if (b.state==='bite'){
      b.bt+=dt*efr;
      const bf=b.bt*BITE_FPS;
      let lv; if (bf<8) lv=1.2; else if (bf<15) lv=5.0; else if (bf<23) lv=0.35; else lv=-2.2;
      b.x+=b.facing*lv*efr;
      if (bf<15){ const dy3=(p.y-58)-b.y; b.y+=Math.sign(dy3)*Math.min(1.6,Math.abs(dy3)); }
      if (b.bt>=SPR.bat.bite.frames/BITE_FPS){ b.state='idle'; b.biteCd=0.7; }
    } else if (dist<BAT_AGGRO && !p.dead){
      b.x+=Math.sign(dxp)*Math.min(BAT_CHASE,Math.abs(dxp))*efr;
      b.y+=Math.sign(dyp)*Math.min(1.5,Math.abs(dyp))*efr;
      if (Math.abs(dxp)>6) b.facing=Math.sign(dxp);
      if (dist<185 && b.biteCd<=0){ b.state='bite'; b.bt=0; if (Math.abs(dxp)>6) b.facing=Math.sign(dxp); playSfx('sfx_rwhoosh',0.8); }
    } else {
      b.x+=b.dir*BAT_PATROL*efr;
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
    if ((p.diveT>0||p.slamT>0) && overlap(pBodyBox(), bb)){ b.dead=true; b.dieT=0; batBits(b,14); killCount++; addScore(KPTS.bat); playSfx('sfx_meleehit',0.6); playSfx('sfx_die',0.7); continue; }
    if (pwb && overlap(pwb, batBox(b))){ b.dead=true; b.dieT=0; batBits(b,14); killCount++; addScore(KPTS.bat); playSfx('sfx_meleehit',0.6); playSfx('sfx_die',0.7); }
  }
  for (const bo of bolts){
    if (bo.dead) continue;
    bo.t+=dt;
    if(bo.kind==='void'){
      bo.x+=bo.vx*dt*(bo.t<0.5?1:0.35); if(bo.pullCd>0) bo.pullCd-=dt;
      const R=330, tick=(bo.pullCd<=0), killR=92;
      for(const z of zombies){ if(z.dead) continue; const dx=bo.x-z.x, dy=bo.y-(z.y-40), d=Math.hypot(dx,dy);
        if(d<R && d>1){ const pull=Math.min(54, dt*(330+20000/d)); z.x+=Math.sign(dx)*Math.min(Math.abs(dx),pull); z.y+=Math.sign(dy)*Math.min(Math.abs(dy),pull);
          if(d<killR && tick){ z.hp-=1; z.shown=3; if(z.hp<=0) voidErase(z,bo); } } }
      for(const b of bats){ if(b.dead) continue; const dx=bo.x-b.x, dy=bo.y-b.y, d=Math.hypot(dx,dy);
        if(d<R && d>1){ const pull=Math.min(52, dt*(320+18000/d)); b.x+=Math.sign(dx)*Math.min(Math.abs(dx),pull); b.y+=Math.sign(dy)*Math.min(Math.abs(dy),pull);
          if(d<killR && tick) voidEraseBat(b,bo); } }
      if(tick) bo.pullCd=0.22;
      if(Math.random()<0.8){ const ang=Math.random()*6.28, rr=50+Math.random()*120; zbits.push({x:bo.x+Math.cos(ang)*rr, y:bo.y+Math.sin(ang)*rr, vx:-Math.cos(ang)*(170+Math.random()*170), vy:-Math.sin(ang)*(170+Math.random()*170), sz:1.4+Math.random()*2, life:0.3+Math.random()*0.28, t:0, c:['#9a7fd0','#7b5cff','#c8a8ff'][(Math.random()*3)|0]}); }
      if(bo.t>1.7){ bo.dead=true; stopLoop(bo.hum); bo.hum=null; impacts.push({x:bo.x,y:bo.y,t:0});
        for(const z of zombies){ if(z.dead) continue; if(Math.hypot(bo.x-z.x,bo.y-(z.y-40))<130){ z.hp-=2; z.shown=3; if(z.hp<=0) voidErase(z,bo); } }
        for(const b of bats){ if(b.dead) continue; if(Math.hypot(bo.x-b.x,bo.y-b.y)<130) voidEraseBat(b,bo); }
        for(let i=0;i<22;i++) zbits.push({x:bo.x,y:bo.y,vx:(Math.random()-0.5)*340,vy:(Math.random()-0.5)*340,sz:2+Math.random()*3,life:0.3+Math.random()*0.3,t:0,c:['#9a7fd0','#7b5cff','#ffffff'][(Math.random()*3)|0]}); }
      continue;
    }
    if(bo.homing){ let best=null,bd=1e9;
      for(const z of zombies){ if(z.dead) continue; const d=Math.hypot(z.x-bo.x,(z.y-40)-bo.y); if(d<bd){bd=d;best={x:z.x,y:z.y-40};} }
      for(const b of bats){ if(b.dead) continue; const d=Math.hypot(b.x-bo.x,b.y-bo.y); if(d<bd){bd=d;best={x:b.x,y:b.y};} }
      if(best && bd<560){ const want=Math.atan2(best.y-bo.y,best.x-bo.x), cur=Math.atan2(bo.vy||0,bo.vx);
        let dd=((want-cur+Math.PI*3)%(Math.PI*2))-Math.PI; dd=Math.max(-0.13,Math.min(0.13,dd));
        const sp=Math.hypot(bo.vx,bo.vy||0)||560, na=cur+dd; bo.vx=Math.cos(na)*sp; bo.vy=Math.sin(na)*sp; } }
    bo.x+=bo.vx*dt; bo.y+=(bo.vy||0)*dt;
    if (bo.t>(bo.life||1.1)){ bo.dead=true; continue; }
    let hit=false;
    // projectiles pass through terrain/platforms/decor — only enemies stop them (Alan 2026-06-09)
    if (!hit) for (const z of zombies){
      if (z.dead) continue;
      const zb=zBodyBox(z);
      if (bo.x>zb.x-6&&bo.x<zb.x+zb.w+6&&bo.y>zb.y&&bo.y<zb.y+zb.h){
        z.hp-=(bo.dmg||1); z.shown=3; playSfx('sfx_projhit');
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
  for (const zf of zapFx) zf.t+=dt;
  zapFx=zapFx.filter(zf=>zf.t<0.16);
  for (const f of slamFx) f.t+=dt;
  slamFx=slamFx.filter(f=>f.t<0.42);
  for (const fx of chkFx){
    fx.t+=dt;
    if (!fx.hit && fx.t>0.62){ fx.hit=true; p.hp=Math.min(curMaxHP(), p.hp+1); playSfx('sfx_healthup'); }
  }
  chkFx=chkFx.filter(fx=>fx.t<1.1);
  for(const bo of bolts){ if(bo.kind==='void'&&bo.dead&&bo.hum){ stopLoop(bo.hum); bo.hum=null; } }
  bolts=bolts.filter(bo=>!bo.dead||bo.t<1.2);
  updateCurses(dt*efr);
  updateHazards(dt*efr);
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
  if(t.t==='rockpile'){ if(ROCKPILE_IMG.complete && ROCKPILE_IMG.naturalWidth){ const dh=t.w*ROCKPILE_IMG.naturalHeight/ROCKPILE_IMG.naturalWidth; ctx.drawImage(ROCKPILE_IMG, x0, t.y-dh, t.w, dh); } return; }
  if(DECOR_IMG[t.t]){ const img=DECOR_IMG[t.t]; if(img.complete&&img.naturalWidth){ const dh=t.w*img.naturalHeight/img.naturalWidth; const px=x0+t.w/2, py=t.y; ctx.save(); ctx.translate(px,py); if(t.rot) ctx.rotate(t.rot); ctx.scale(t.f===-1?-1:1,1); ctx.drawImage(img,-t.w/2,-dh,t.w,dh); ctx.restore(); } return; } }
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
function crushPlayer(dir){ if(p.dead||p.won||p.winning) return; gotHit=true; p.hp=0; p.dead=true; p.deadT=0; p.inv=0; p.flash=0; p.hurtT=0; p.vx=0; p.vy=0; p.deathHurt=true; p.tossDir=-p.facing; playSfx('sfx_hurt'); playSfx('sfx_pdie'); }
function hurtPlayer(srcX,dmg){
  if (p.diveT>0||p.diveRec>0) return;   // Power Dive i-frames (until normal stance resumes)
  if (hasDiscord() && Math.random()<DISCORD_BLOCK){ p.barrierT=0.4; p.inv=Math.max(p.inv,0.55); p.invHurt=Math.max(p.invHurt||0,0.3); playSfx('sfx_meleehit',0.5); for(let i=0;i<12;i++){ const a=i/12*6.283; zbits.push({x:p.x,y:p.y-50,vx:Math.cos(a)*130,vy:Math.sin(a)*130-20,sz:2+Math.random()*2,life:0.3+Math.random()*0.22,t:0,c:'#ffae57'}); } return; }
  gotHit=true; playSfx('sfx_hurt');
  p.hp-=(dmg||1); p.inv=1.0; p.invHurt=1.0; p.flash=0.35;
  p.hurtT=0.45;  // single retro hurt still + flicker, fixed hit-stun
  const away=(p.x<srcX)?-1:1; p.vx=away*2; p.x+=away*8;
  if(p.onGround){ p.vy=-7; p.onGround=false; }
  if (p.hp<=0){ p.hp=0; p.dead=true; p.deadT=0; p.inv=0; p.flash=0; p.hurtT=0; p.deathHurt=true; p.tossDir=-p.facing; playSfx('sfx_pdie'); }
}
function curFrame(){
  const a=SPR.chars[chosen][p.state], fps=pfps(p.state);
  if (p.state==='kneel' && !p.dead && p.diveRec<=0) return a.frames-1;   // crouch snaps straight to the final (cleaned) pose
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
    if (kind.indexOf('g:')===0){ const gid=kind.slice(2), b=GROUND_BASE[gid], t=GROUND_TOP[gid];
      ctx.save(); ctx.beginPath(); ctx.rect(x0,sgy,x1-x0,bot-sgy); ctx.clip();
      if(b&&b.complete&&b.naturalWidth) tileImage(b,sgy,bot-sgy,1); else { ctx.fillStyle='#4a3a28'; ctx.fillRect(x0,sgy,x1-x0,bot-sgy); }
      ctx.restore();
      if(t&&t.complete&&t.naturalWidth){ const TH=70, tw=TH*t.naturalWidth/t.naturalHeight, topY=sgy-0.6*TH; ctx.save(); ctx.beginPath(); ctx.rect(x0,topY,x1-x0,TH); ctx.clip(); ctx.imageSmoothingEnabled=true; const off=((camX%tw)+tw)%tw; for(let x=-off;x<W+tw;x+=tw) ctx.drawImage(t,x,topY,tw,TH); ctx.restore(); }
      ctx.fillStyle='rgba(0,0,0,.4)'; ctx.fillRect(x0,sgy,3,bot-sgy); ctx.fillRect(x1-3,sgy,3,bot-sgy);
      return;
    }
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
function spawnLoot(o){ const lt=o.loot||'gold'; const rise=(lt.indexOf('stone_')===0||MEGA_LOOT_IMG[lt])?90:56; loots.push({x:o.x, y:o.gy-o.h+12, restY:o.gy-o.h-rise, t:0, type:lt, collected:false, fade:0}); }
function collectLoot(L){
  if (L.type.indexOf('stone_')===0){ const key=L.type.slice(6), col=STONE_DEFS[key]||'#ffcf3c';
    addScore(3000); playSfx('sfx_soul'); playSfx('sfx_healthup',0.85);
    const cy=L.restY!==undefined?L.restY:L.y;
    for(let i=0;i<18;i++) zbits.push({x:L.x, y:cy, vx:(Math.random()-0.5)*230, vy:-30-Math.random()*180, sz:2.5+Math.random()*3.5, life:0.5+Math.random()*0.5, t:0, c:col});
    if(key!=='master'){ const _ps=artProg(); _ps.owned=_ps.owned||[]; if(_ps.owned.indexOf(key)<0){ _ps.owned.push(key); if(prog) saveProg(); } }
    return; }
  if (/^vigorfrag[1-6]$/.test(L.type)){ const k=parseInt(L.type.slice(9)); const _ps=artProg(); _ps.megas=_ps.megas||{}; _ps.megas.vigorShards=_ps.megas.vigorShards||[]; if(_ps.megas.vigorShards.indexOf(k)<0){ _ps.megas.vigorShards.push(k); if(prog) saveProg(); p.hp=Math.min(curMaxHP(),p.hp+1); hpGrowPending=1; playSfx('sfx_vigorboost',0.95); } addScore(2500); playSfx('sfx_soul'); const cy=L.restY!==undefined?L.restY:L.y; for(let i=0;i<14;i++) zbits.push({x:L.x, y:cy, vx:(Math.random()-0.5)*210, vy:-30-Math.random()*170, sz:2.5+Math.random()*3, life:0.5+Math.random()*0.5, t:0, c:'#ff3d5a'}); return; }
  if (L.type==='mega_greed' || L.type==='mega_discord'){ { const _ps=artProg(); _ps.megas=_ps.megas||{}; _ps.megas[L.type==='mega_greed'?'greed':'discord']=true; if(prog) saveProg(); } addScore(3000); playSfx('sfx_soul'); playSfx('sfx_healthup',0.9); return; }
  if (L.type==='heart'){ p.hp=Math.min(curMaxHP(),p.hp+1); playSfx('sfx_healthup'); }
  else if (L.type==='soul' || /^soul\d+$/.test(L.type)){ const v=L.type==='soul'?1:parseInt(L.type.slice(4)); soulCount+=v; if(equippedStone && !powerActive) stoneCharge=Math.min(PMETER, stoneCharge+v*greedMult()); addScore(SOUL_PTS,'soul'); playSfx('sfx_soul'); }
  else if (L.type==='stone'){ addScore(2000); playSfx('sfx_soul'); playSfx('sfx_healthup',0.7); }
  else { addScore(500); playSfx('sfx_soul',0.8); }
}
function drawTreasure(x,y,type,sc,al){
  if (MEGA_LOOT_IMG[type]){ const img=MEGA_LOOT_IMG[type], col=MEGA_LOOT_COL[type]||'#ff3d5a';
    ctx.save(); ctx.globalAlpha=al;
    const pulse=0.8+0.2*Math.sin(gt*4.2), R=38*sc*pulse;
    const g0=ctx.createRadialGradient(x,y,2,x,y,R); g0.addColorStop(0,col+'cc'); g0.addColorStop(0.5,col+'55'); g0.addColorStop(1,col+'00');
    ctx.fillStyle=g0; ctx.beginPath(); ctx.arc(x,y,R,0,7); ctx.fill();
    ctx.globalAlpha=al;
    if (img && img.complete && img.naturalWidth){ const hh=46*sc, ww=hh*img.naturalWidth/img.naturalHeight; ctx.imageSmoothingEnabled=true; ctx.drawImage(img, x-ww/2, y-hh/2, ww, hh); }
    else { ctx.fillStyle=col; ctx.beginPath(); ctx.arc(x,y,12*sc,0,7); ctx.fill(); }
    ctx.restore(); return;
  }
  if (type.indexOf('stone_')===0){ const key=type.slice(6), img=STONE_IMGS[key], col=STONE_DEFS[key]||'#ffcf3c';
    ctx.save(); ctx.globalAlpha=al;
    const pulse=0.78+0.22*Math.sin(gt*4.2), R=40*sc*pulse;
    const g0=ctx.createRadialGradient(x,y,2,x,y,R); g0.addColorStop(0,col); g0.addColorStop(0.45,col+'66'); g0.addColorStop(1,col+'00');
    ctx.fillStyle=g0; ctx.beginPath(); ctx.arc(x,y,R,0,7); ctx.fill();
    for(let k=0;k<6;k++){ const a2=gt*1.7+k*1.0472, rr=28*sc; ctx.globalAlpha=al*(0.35+0.4*Math.sin(gt*5+k)); ctx.fillStyle=col; ctx.beginPath(); ctx.arc(x+Math.cos(a2)*rr, y+Math.sin(a2)*rr, 2.4*sc,0,7); ctx.fill(); }
    ctx.globalAlpha=al;
    if (img && img.complete && img.naturalWidth){ const hh=36*sc, ww=hh*img.naturalWidth/img.naturalHeight; ctx.imageSmoothingEnabled=true; ctx.drawImage(img, x-ww/2, y-hh/2, ww, hh); }
    else { ctx.fillStyle=col; ctx.beginPath(); ctx.arc(x,y,12*sc,0,7); ctx.fill(); }
    ctx.restore(); return;
  }
  ctx.save(); ctx.globalAlpha=al;
  let col={heart:'#ff4d6d',soul:'#7fe0ff',gold:'#ffcf3c',stone:'#46e0c0'}[type]||'#ffcf3c';
  if(/^soul\d+$/.test(type)){ col=SOUL_COL[parseInt(type.slice(4))]||'#7fe0ff'; }
  const g=ctx.createRadialGradient(x,y,1,x,y,26*sc); g.addColorStop(0,col); g.addColorStop(0.5,col+'66'); g.addColorStop(1,col+'00');
  ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,26*sc,0,7); ctx.fill();
  ctx.translate(x,y); ctx.scale(sc,sc);
  if (type==='heart'){ ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(0,8); ctx.bezierCurveTo(-12,-4,-7,-14,0,-6); ctx.bezierCurveTo(7,-14,12,-4,0,8); ctx.fill(); }
  else if (type==='soul' || /^soul\d+$/.test(type)){ ctx.fillStyle=col; ctx.beginPath(); ctx.arc(0,0,9,0,7); ctx.fill(); ctx.fillStyle='rgba(255,255,255,.9)'; ctx.beginPath(); ctx.arc(-2,-2,3,0,7); ctx.fill(); }
  else { ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(0,-11); ctx.lineTo(9,-3); ctx.lineTo(5,11); ctx.lineTo(-5,11); ctx.lineTo(-9,-3); ctx.closePath(); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.55)'; ctx.beginPath(); ctx.moveTo(0,-11); ctx.lineTo(9,-3); ctx.lineTo(0,-1); ctx.closePath(); ctx.fill(); }
  ctx.restore();
}
function drawLoots(){ for(const L of loots){ const sx=pxf(L.x,1); if(sx<-60||sx>W+60) continue; const y=L.y+Math.sin(L.t*3)*3; const sc=L.collected?(1+(L.fade||0)*0.8):1, al=L.collected?Math.max(0,1-(L.fade||0)):1; drawTreasure(sx,y,L.type,sc,al); } }
function drawObstacle(o){
  const _sx=pxf(o.x,1); if(_sx<-90||_sx>W+90) return;
  if(o.f===-1){ ctx.save(); ctx.translate(_sx,0); ctx.scale(-1,1); ctx.translate(-_sx,0); drawObstacleBody(o); ctx.restore(); }
  else drawObstacleBody(o);
}
function drawObstacleBody(o){
  const sx=pxf(o.x,1); if(sx<-90||sx>W+90) return;
  if (o.type==='chest'){
    const opening=o.state==='open', img=opening?CHEST_OPEN_IMG:CHEST_CLOSED_IMG;
    if (img.complete && img.naturalWidth){ const dw=o.w, dh=dw*img.naturalHeight/img.naturalWidth; ctx.imageSmoothingEnabled=true; ctx.drawImage(img, sx-dw/2, o.gy-dh, dw, dh); }
    else { ctx.fillStyle='#5a3a1e'; ctx.fillRect(sx-o.w/2,o.gy-o.h,o.w,o.h); }
    if (opening && o.openT<0.55){ const a=Math.max(0,1-o.openT/0.55), cy=o.gy-o.h*0.7, rad=18+o.openT*210;
      const g=ctx.createRadialGradient(sx,cy,2,sx,cy,rad); g.addColorStop(0,'rgba(255,252,220,'+(a*0.95).toFixed(2)+')'); g.addColorStop(0.45,'rgba(255,214,96,'+(a*0.55).toFixed(2)+')'); g.addColorStop(1,'rgba(255,180,40,0)');
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(sx,cy,rad,0,7); ctx.fill();
      ctx.strokeStyle='rgba(255,240,180,'+(a*0.8).toFixed(2)+')'; ctx.lineWidth=2;
      for(let k=0;k<8;k++){ const ang=k*0.785+o.openT*2.4; ctx.beginPath(); ctx.moveTo(sx,cy); ctx.lineTo(sx+Math.cos(ang)*rad*0.9, cy+Math.sin(ang)*rad*0.9); ctx.stroke(); } }
    return;
  }
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
function drawForegrounds(){
  for(const b of FG){ const img=BG_IMGS[b.t]; if(!img||!img.complete||!img.naturalWidth) continue;
    const par=(b.par!==undefined&&b.par!==null)?b.par:0.3;
    ctx.globalAlpha=(b.alpha!==undefined)?b.alpha:1;
    if(b.w&&b.h){ const pp=(b.par!==undefined&&b.par!==null)?b.par:1; const ox=(b.x||0)-camX*pp, oy=(b.y||0)-camY*pp;
      if(b.fade){ let inside=false; if(typeof p!=='undefined'&&p&&!p.dead){ const pb=pBodyBox(); const psx=pb.x-camX, psy=pb.y-camY; inside = psx>=ox && psy>=oy && (psx+pb.w)<=(ox+b.w) && (psy+pb.h)<=(oy+b.h); } const tgt=inside?0.3:1; b._fa=(b._fa!==undefined?b._fa:1); b._fa+=(tgt-b._fa)*0.16; ctx.globalAlpha*=b._fa; }
      if(b.tile){ const ts=(b.tscale||1), tw=img.naturalWidth*ts, th=img.naturalHeight*ts; ctx.save(); ctx.beginPath(); ctx.rect(ox,oy,b.w,b.h); ctx.clip(); for(let yy=oy; yy<oy+b.h; yy+=th) for(let xx=ox; xx<ox+b.w; xx+=tw) ctx.drawImage(img,xx,yy,tw,th); ctx.restore(); }
      else ctx.drawImage(img, ox, oy, b.w, b.h);
      ctx.globalAlpha=1; continue; }
    if(b.cover){ const span=W+Math.max(0,(typeof WORLD!=='undefined'?WORLD:0))*Math.min(par,1); const cs=Math.max(span/img.naturalWidth, H/img.naturalHeight); const cw=img.naturalWidth*cs, ch=img.naturalHeight*cs; ctx.drawImage(img, -camX*par, (H-ch)/2 - camY*par, cw, ch); ctx.globalAlpha=1; continue; }
    const iw=img.naturalWidth, ih=img.naturalHeight, sc=Math.max(W/iw,H/ih), dw=iw*sc, dh=ih*sc;
    let ox=(-camX*par)%dw; if(ox>0)ox-=dw; let oy=(-camY*par)%dh; if(oy>0)oy-=dh;
    for(let y=oy; y<H; y+=dh) for(let x=ox; x<W; x+=dw) ctx.drawImage(img, x, y, dw, dh);
    ctx.globalAlpha=1;
  }
}
function drawBackgrounds(){
  for(const b of BG){ const img=BG_IMGS[b.t]; if(!img||!img.complete||!img.naturalWidth) continue;
    const par=(b.par!==undefined&&b.par!==null)?b.par:0.3;
    ctx.globalAlpha=(b.alpha!==undefined)?b.alpha:1;
    if(b.w&&b.h){ const pp=(b.par!==undefined&&b.par!==null)?b.par:1; const ox=(b.x||0)-camX*pp, oy=(b.y||0)-camY*pp;
      if(b.tile){ const ts=(b.tscale||1), tw=img.naturalWidth*ts, th=img.naturalHeight*ts; ctx.save(); ctx.beginPath(); ctx.rect(ox,oy,b.w,b.h); ctx.clip(); for(let yy=oy; yy<oy+b.h; yy+=th) for(let xx=ox; xx<ox+b.w; xx+=tw) ctx.drawImage(img,xx,yy,tw,th); ctx.restore(); }
      else ctx.drawImage(img, ox, oy, b.w, b.h);
      ctx.globalAlpha=1; continue; }  // placed bg: tile=repeat pattern, else stretch; par 1=locked
    if(b.cover){ const span=W+Math.max(0,(typeof WORLD!=='undefined'?WORLD:0))*Math.min(par,1); const cs=Math.max(span/img.naturalWidth, H/img.naturalHeight); const cw=img.naturalWidth*cs, ch=img.naturalHeight*cs; ctx.drawImage(img, -camX*par, (H-ch)/2 - camY*par, cw, ch); ctx.globalAlpha=1; continue; }
    const iw=img.naturalWidth, ih=img.naturalHeight, sc=Math.max(W/iw,H/ih), dw=iw*sc, dh=ih*sc;
    let ox=(-camX*par)%dw; if(ox>0)ox-=dw; let oy=(-camY*par)%dh; if(oy>0)oy-=dh;
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
function bgGrad(s){ const g=ctx.createLinearGradient(0,0,0,H); for(const a of s) g.addColorStop(a[0],a[1]); ctx.fillStyle=g; ctx.fillRect(0,0,W,H); }
function witchBG(){
  const horizon=H*0.66;
  bgGrad([[0,'#070d09'],[0.4,'#0e1a12'],[0.72,'#16271a'],[1,'#1f3320']]);
  const mx=pxf(1100,0.04); const mg=ctx.createRadialGradient(mx,80,6,mx,80,70); mg.addColorStop(0,'rgba(170,210,170,.28)'); mg.addColorStop(1,'rgba(170,210,170,0)'); ctx.fillStyle=mg; ctx.beginPath(); ctx.arc(mx,80,70,0,7); ctx.fill();
  ctx.fillStyle='rgba(5,11,7,0.92)'; for(let i=0;i<14;i++){ const x=pxf(i*260,0.1); const r=90+((i*73)%70); ctx.beginPath(); ctx.arc(x,8,r,0,Math.PI); ctx.fill(); } ctx.fillRect(0,0,W,42);
  ctx.fillStyle='rgba(10,20,13,0.85)'; for(const t0 of [200,900,1700,2600,3600,4700,5900,7200,8600,10100]){ const x=pxf(t0,0.14); if(x>-50&&x<W+50){ const tw=26+((t0*7)%20); ctx.fillRect(x-tw/2,40,tw,horizon-40); } }
  for(let i=0;i<24;i++){ const span=W+260; const wx=((((i*397)%span)-130+Math.sin(gt*0.6+i)*10-camX*0.35)%span+span)%span-130; const wy=60+((i*173)%Math.max(60,horizon-60)); const a=0.12+0.10*Math.sin(gt*2+i*1.7); const r=10+(i%4)*8; const gr=ctx.createRadialGradient(wx,wy,1,wx,wy,r); gr.addColorStop(0,'rgba(140,245,120,'+a.toFixed(2)+')'); gr.addColorStop(1,'rgba(140,245,120,0)'); ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(wx,wy,r,0,7); ctx.fill(); }
  const sg=ctx.createLinearGradient(0,horizon-20,0,H); sg.addColorStop(0,'rgba(60,140,60,0)'); sg.addColorStop(1,'rgba(50,130,55,0.18)'); ctx.fillStyle=sg; ctx.fillRect(0,horizon-20,W,H-horizon+20);
  for(let k=0;k<3;k++){ const off=(gt*(5+k*4))%(W+300); ctx.fillStyle='rgba(110,150,110,'+(0.05+k*0.022).toFixed(2)+')'; for(let fx=-off;fx<W;fx+=W+260) ctx.fillRect(fx,horizon-26-k*16,W+300,48);} 
}
function harborBG(){
  const horizon=H*0.56;
  bgGrad([[0,'#0c131b'],[0.4,'#1e2c38'],[0.7,'#3e5260'],[1,'#5a6e7a']]);
  ctx.fillStyle='rgba(20,30,38,0.7)';
  for(const o of [[1300,1],[3200,-1],[5400,1],[7800,-1]]){ const x=pxf(o[0],0.05); if(x>-90&&x<W+90){ ctx.save(); ctx.translate(x,horizon); ctx.rotate(o[1]*0.12); ctx.fillRect(-50,-8,100,16); ctx.fillRect(-6,-70,8,70); ctx.beginPath(); ctx.moveTo(-6,-70); ctx.lineTo(28,-46); ctx.lineTo(-6,-42); ctx.fill(); ctx.restore(); } }
  ctx.fillStyle='rgba(26,34,40,0.85)'; for(const r0 of [800,2200,4000,6200,8800]){ const x=pxf(r0,0.08); if(x>-40&&x<W+40){ const hh=40+((r0*7)%50); ctx.beginPath(); ctx.moveTo(x-26,horizon+6); ctx.lineTo(x-6,horizon-hh); ctx.lineTo(x+4,horizon-hh*0.6); ctx.lineTo(x+14,horizon-hh); ctx.lineTo(x+30,horizon+6); ctx.fill(); } }
  const og=ctx.createLinearGradient(0,horizon,0,H); og.addColorStop(0,'#3a4e5a'); og.addColorStop(1,'#1c2a34'); ctx.fillStyle=og; ctx.fillRect(0,horizon,W,H-horizon);
  ctx.fillStyle='rgba(140,165,180,0.16)'; for(let r=0;r<12;r++){ const y=horizon+10+r*((H-horizon)/12); const amp=3+r*0.6; ctx.beginPath(); for(let x=0;x<=W;x+=20){ const yy=y+Math.sin(x*0.04+gt*1.5+r)*amp; if(x===0)ctx.moveTo(x,yy); else ctx.lineTo(x,yy);} ctx.lineTo(W,y+8); ctx.lineTo(0,y+8); ctx.fill(); }
  ctx.fillStyle='rgba(200,220,230,0.22)'; for(let x=0;x<W;x+=60){ const xx=(x-(gt*20)%60); const yy=horizon+Math.sin(xx*0.05+gt*2)*4; ctx.fillRect(xx,yy,30,2); }
  for(let k=0;k<5;k++){ const off=(gt*(5+k*3))%(W+340); ctx.fillStyle='rgba(160,178,190,'+(0.05+k*0.02).toFixed(2)+')'; for(let fx=-off;fx<W;fx+=W+300) ctx.fillRect(fx,horizon-30-k*16,W+340,52);} 
}
function spireBG(){
  bgGrad([[0,'#14121a'],[0.5,'#1d1a24'],[1,'#26222e']]);
  const off=((-camY*0.5)%48+48)%48;
  ctx.strokeStyle='rgba(0,0,0,0.25)'; ctx.lineWidth=1; for(let y=off-48;y<H;y+=48){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
  ctx.strokeStyle='rgba(255,255,255,0.03)'; for(let y=off-47;y<H;y+=48){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
  for(const col of [220, W-300]){
    for(let i=-1;i<4;i++){ const wy=((-camY*0.6)%460+460)%460 + i*460 - 200; if(wy>H||wy+150<0) continue;
      ctx.save(); ctx.beginPath(); ctx.rect(col+6,wy-30,78,150); ctx.arc(col+45,wy,39,Math.PI,0); ctx.clip();
      const sg=ctx.createLinearGradient(0,wy-40,0,wy+130); sg.addColorStop(0,'#3a4250'); sg.addColorStop(1,'#5a6470'); ctx.fillStyle=sg; ctx.fillRect(col,wy-40,90,180);
      const seg=Math.floor(gt/7), ft=gt-(seg*7+1+((seg*2654435761)%1000)/1000*3); if(ft>=0&&ft<0.25){ ctx.fillStyle='rgba(200,220,255,'+(0.6*(1-ft/0.25)).toFixed(2)+')'; ctx.fillRect(col,wy-40,90,180);} ctx.restore();
      ctx.fillStyle='#0a0a10'; ctx.fillRect(col+42,wy-26,6,150); ctx.fillRect(col+2,wy+50,86,5);
      ctx.strokeStyle='#0a0a10'; ctx.lineWidth=4; ctx.beginPath(); ctx.rect(col+6,wy-30,78,150); ctx.arc(col+45,wy,39,Math.PI,0); ctx.stroke();
    }
  }
  for(let i=-1;i<5;i++){ const lx=(i%2?330:W-330); const ly=((-camY*0.8)%380+380)%380 + i*380 - 100; if(ly<-20||ly>H) continue;
    ctx.strokeStyle='#1a1a22'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(lx,ly-30); ctx.lineTo(lx,ly); ctx.stroke();
    const fl=0.6+0.4*Math.sin(gt*8+i); const gr=ctx.createRadialGradient(lx,ly+6,1,lx,ly+6,34); gr.addColorStop(0,'rgba(255,170,70,'+(0.5*fl).toFixed(2)+')'); gr.addColorStop(1,'rgba(255,170,70,0)'); ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(lx,ly+6,34,0,7); ctx.fill();
    ctx.fillStyle='#2a2230'; ctx.fillRect(lx-6,ly,12,16); ctx.fillStyle='rgba(255,190,90,'+fl.toFixed(2)+')'; ctx.beginPath(); ctx.arc(lx,ly+7,4,0,7); ctx.fill();
  }
}
function charnelBG(){
  const horizon=H*0.58;
  bgGrad([[0,'#1a0a0a'],[0.4,'#2e120e'],[0.74,'#521f12'],[1,'#742a14']]);
  const lp=0.5+0.3*Math.sin(gt*0.9); const lg=ctx.createLinearGradient(0,horizon-20,0,H); lg.addColorStop(0,'rgba(255,110,30,0)'); lg.addColorStop(1,'rgba(255,110,30,'+(0.3*lp).toFixed(2)+')'); ctx.fillStyle=lg; ctx.fillRect(0,horizon-20,W,H-horizon+20);
  ctx.fillStyle='rgba(24,12,10,0.88)'; ctx.beginPath(); ctx.moveTo(0,H);
  for(let i=0;i<=18;i++){ const x=pxf(i*520,0.06); const h=120+((i*167)%160); ctx.lineTo(x,horizon-h*0.6);} ctx.lineTo(W,H); ctx.closePath(); ctx.fill();
  for(const l0 of [600,2400,4600,7200,9800]){ const x=pxf(l0,0.06); if(x>-30&&x<W+30){ ctx.strokeStyle='rgba(255,'+Math.round(90+30*Math.sin(gt*2+l0))+',30,0.5)'; ctx.lineWidth=3; ctx.beginPath(); let yy=horizon-140,xx=x; ctx.moveTo(xx,yy); while(yy<horizon+8){ yy+=14; xx=x+Math.sin(yy*0.06+gt*1.5)*8; ctx.lineTo(xx,yy);} ctx.stroke(); } }
  ctx.fillStyle='rgba(40,26,22,0.7)'; for(const b0 of [1500,5000,8500]){ const x=pxf(b0,0.07); if(x>-40&&x<W+40){ ctx.fillRect(x-2,horizon-40,4,40); for(let r=0;r<4;r++) ctx.fillRect(x-14+r*7,horizon-36+r*8,14,3); ctx.beginPath(); ctx.arc(x,horizon-46,7,0,7); ctx.fill(); } }
  for(let i=0;i<30;i++){ const span=W+200; const wx=(((i*373)%span)-100+Math.sin(gt+i)*8); const x=((wx-camX*0.3)%span+span)%span-100; const y=H-((i*53+gt*45)%(H+40)); const a=0.4+0.4*Math.sin(gt*3+i); ctx.fillStyle='rgba(255,'+(120+((i*7)%80))+',40,'+(0.5*a).toFixed(2)+')'; const sz=1+(i%3); ctx.fillRect(x,y,sz,sz); }
  for(const s0 of [2000,6000]){ const x=pxf(s0,0.1); if(x>-40&&x<W+40){ for(let j=0;j<3;j++){ const y=horizon-j*30-((gt*20)%30); ctx.fillStyle='rgba(220,210,205,'+(0.12-j*0.03).toFixed(2)+')'; ctx.beginPath(); ctx.arc(x+Math.sin(gt*0.5+j)*8,y,18+j*8,0,7); ctx.fill(); } } }
  ctx.fillStyle='rgba(150,140,135,0.2)'; for(let i=0;i<50;i++){ let x=((i*149)%(W+120))-60-gt*10; x=((x%(W+120))+(W+120))%(W+120)-60; const y=((i*61+gt*110)%(H+30))-15; ctx.fillRect(x,y,2,2);} 
}
function riftBG(){
  bgGrad([[0,'#070410'],[0.5,'#130a22'],[1,'#1e1036']]);
  ctx.fillStyle='rgba(230,220,255,0.7)'; for(const s of STARS){ const x=((pxf(s[0],0.08)%W)+W)%W; const tw=0.5+0.5*Math.sin(gt*2+s[0]); if(tw>0.6) ctx.fillRect(x,s[1]%H,s[2],s[2]); }
  const spx=pxf(400,0.05); if(spx>-60&&spx<W){ ctx.fillStyle='rgba(40,38,60,0.5)'; ctx.fillRect(spx-9,H*0.3,18,H*0.42); ctx.beginPath(); ctx.moveTo(spx-9,H*0.3); ctx.lineTo(spx,H*0.25); ctx.lineTo(spx+9,H*0.3); ctx.fill(); }
  const vx=pxf(4600,0.1); if(vx<W+280){ const cx=vx, cy=H*0.45;
    const vg=ctx.createRadialGradient(cx,cy,10,cx,cy,270); vg.addColorStop(0,'rgba(140,60,220,0.5)'); vg.addColorStop(0.5,'rgba(60,20,90,0.4)'); vg.addColorStop(1,'rgba(20,10,40,0)'); ctx.fillStyle=vg; ctx.beginPath(); ctx.arc(cx,cy,270,0,7); ctx.fill();
    ctx.fillStyle='rgba(8,4,14,0.85)'; ctx.beginPath(); ctx.ellipse(cx,cy,90,150,Math.sin(gt*0.3)*0.2,0,7); ctx.fill();
    ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.strokeStyle='rgba(200,120,255,0.35)'; ctx.lineWidth=2; for(let a=0;a<3;a++){ ctx.beginPath(); for(let t=0;t<6.3;t+=0.3){ const rr=40+t*22+a*30; const px2=cx+Math.cos(t+gt*0.5+a)*rr*0.6, py2=cy+Math.sin(t+gt*0.5+a)*rr; if(t===0)ctx.moveTo(px2,py2); else ctx.lineTo(px2,py2);} ctx.stroke(); } ctx.restore();
  }
  for(let i=0;i<22;i++){ const par=0.15+((i%4)*0.08); const wx=200+i*620+((i*331)%400); const x=pxf(wx,par); if(x<-60||x>W+60) continue; const y=((i*137)%H)+Math.sin(gt*0.4+i*1.3)*12; const w=10+((i*23)%40), h=6+((i*17)%24); const rot=Math.sin(gt*0.2+i)*0.3; ctx.save(); ctx.translate(x,y); ctx.rotate(rot); ctx.fillStyle='rgba(36,28,54,0.92)'; ctx.fillRect(-w/2,-h/2,w,h); ctx.fillStyle='rgba(70,55,100,0.5)'; ctx.fillRect(-w/2,-h/2,w,2); ctx.restore(); }
}
function castleBG(){
  bgGrad([[0,'#120a10'],[0.5,'#1c1018'],[1,'#241420']]);
  const offY=((-camY*0.5)%56+56)%56, offX=((-camX*0.2)%84+84)%84;
  ctx.strokeStyle='rgba(0,0,0,0.25)'; ctx.lineWidth=1;
  for(let y=offY-56;y<H;y+=56){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
  for(let x=offX-84;x<W;x+=84){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
  ctx.fillStyle='rgba(10,6,10,0.5)'; for(let i=0;i<6;i++){ const x=pxf(i*900+200,0.18); if(x>-90&&x<W+90){ ctx.fillRect(x,H*0.2,110,H*0.55); ctx.beginPath(); ctx.arc(x+55,H*0.2,55,Math.PI,0); ctx.fill(); } }
  for(const g0 of [700,2600,4800,7400]){ const x=pxf(g0,0.2); if(x>-30&&x<W+30){ const b=H*0.74; ctx.fillStyle='rgba(14,9,13,0.85)'; ctx.fillRect(x-14,b-30,28,30); ctx.beginPath(); ctx.arc(x,b-34,12,0,7); ctx.fill(); ctx.beginPath(); ctx.moveTo(x-14,b-30); ctx.lineTo(x-26,b-14); ctx.lineTo(x-12,b-18); ctx.fill(); ctx.beginPath(); ctx.moveTo(x+14,b-30); ctx.lineTo(x+26,b-14); ctx.lineTo(x+12,b-18); ctx.fill(); } }
  for(let i=0;i<7;i++){ const x=pxf(i*620+120,0.25); if(x<-20||x>W+20) continue; const y=H*0.32+((i*53)%40); const fl=0.6+0.4*Math.sin(gt*9+i*2);
    const gr=ctx.createRadialGradient(x,y,2,x,y,46); gr.addColorStop(0,'rgba(255,150,60,'+(0.5*fl).toFixed(2)+')'); gr.addColorStop(1,'rgba(255,150,60,0)'); ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(x,y,46,0,7); ctx.fill();
    ctx.fillStyle='#1a1014'; ctx.fillRect(x-2,y,4,18); ctx.fillStyle='rgba(255,190,90,'+fl.toFixed(2)+')'; ctx.beginPath(); ctx.moveTo(x-4,y); ctx.quadraticCurveTo(x,y-14*fl,x+4,y); ctx.fill();
  }
  for(let i=0;i<3;i++){ const x=pxf(i*1400+500,0.15); if(x<-40||x>W+40) continue; const y=H*0.16; ctx.strokeStyle='#160e14'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,y); ctx.stroke(); ctx.fillStyle='#241620'; ctx.fillRect(x-22,y,44,5); for(let c=-2;c<=2;c++){ const cf=0.6+0.4*Math.sin(gt*7+c+i); ctx.fillStyle='rgba(255,200,110,'+(0.7*cf).toFixed(2)+')'; ctx.beginPath(); ctx.arc(x+c*11,y-3,2.5,0,7); ctx.fill(); } }
  for(let k=0;k<2;k++){ const off=(gt*(4+k*3))%(W+300); ctx.fillStyle='rgba(80,40,50,'+(0.05+k*0.02).toFixed(2)+')'; for(let fx=-off;fx<W;fx+=W+260) ctx.fillRect(fx,H*0.7-k*16,W+300,60);} 
}
function etherealBG(){
  const horizon=H*0.60;
  // gloomy storm gradient
  const g=ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,'#161a26'); g.addColorStop(0.40,'#28313f'); g.addColorStop(0.64,'#46525f'); g.addColorStop(0.84,'#68758a'); g.addColorStop(1,'#7e8b98');
  ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  // distant peaks + spire silhouettes (far parallax)
  ctx.fillStyle='rgba(40,49,61,0.7)';
  ctx.beginPath(); ctx.moveTo(0,horizon+1);
  for(let i=0;i<=22;i++){ const x=pxf(i*470,0.06); const h=28+((i*167)%55)+((i*71)%24); ctx.lineTo(x,horizon-h*0.45); }
  ctx.lineTo(W,horizon+1); ctx.closePath(); ctx.fill();
  ctx.fillStyle='rgba(30,38,50,0.78)';
  for(const sx0 of [900,3300,6400,9600,12800]){ const x=pxf(sx0,0.06); if(x>-40&&x<W+40){ const hh=80+((sx0*7)%55); ctx.fillRect(x-6,horizon-hh,12,hh); ctx.beginPath(); ctx.moveTo(x-7,horizon-hh); ctx.lineTo(x,horizon-hh-24); ctx.lineTo(x+7,horizon-hh); ctx.fill(); } }
  // far storm clouds (medium gray, drifting)
  const drawCloudRow=(yBase,par,drift,col,a,n,rr)=>{
    const span=W+560;
    for(let i=0;i<n;i++){ let x=((i*(span/n) - gt*drift - camX*par)%span+span)%span-280;
      const y=yBase+((i*89)%46); const r=rr+((i*61)%60);
      const gr=ctx.createRadialGradient(x,y,2,x,y,r);
      gr.addColorStop(0,col+a+')'); gr.addColorStop(1,col+'0)');
      ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(x,y,r,0,7); ctx.fill(); }
  };
  drawCloudRow(36,0.10,5,'rgba(74,85,98,',0.5,13,96);
  // near storm clouds (darker, frame the crack)
  drawCloudRow(20,0.18,8,'rgba(20,25,33,',0.62,12,104);
  // floating land chunks (mid parallax, gentle bob)
  for(let i=0;i<7;i++){ const wx=500+i*1500+((i*331)%420); const x=pxf(wx,0.27); if(x<-130||x>W+130) continue;
    const y=120+((i*97)%96)+Math.sin(gt*0.5+i*1.7)*6; const w=58+((i*53)%56), h=20+((i*37)%16);
    ctx.fillStyle='rgba(25,31,41,0.92)';
    ctx.beginPath(); ctx.ellipse(x,y,w,h*0.7,0,0,7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x-w*0.8,y); ctx.lineTo(x-w*0.2,y+h*1.9); ctx.lineTo(x+w*0.1,y+h*1.3); ctx.lineTo(x+w*0.7,y+h*0.4); ctx.closePath(); ctx.fill();
    ctx.fillStyle='rgba(84,102,86,0.55)'; ctx.beginPath(); ctx.ellipse(x,y-h*0.45,w*0.9,h*0.4,0,Math.PI,0); ctx.fill();
  }
  // horizon mist (subtle)
  for(let k=0;k<3;k++){ const off=(gt*(7+k*5))%(W+320); ctx.fillStyle='rgba(172,185,200,'+(0.04+k*0.015).toFixed(3)+')'; for(let fx=-off;fx<W;fx+=W+280) ctx.fillRect(fx,horizon-22-k*16,W+320,42); }
  // rainfall (screen-space diagonal streaks)
  ctx.strokeStyle='rgba(186,200,220,0.20)'; ctx.lineWidth=1; ctx.beginPath();
  for(let i=0;i<95;i++){ const sp=540+(i%5)*130; let x=((i*149)%(W+160))-80 - gt*30; x=((x%(W+160))+(W+160))%(W+160)-80; const y=((i*47+gt*sp)%(H+40))-20; ctx.moveTo(x,y); ctx.lineTo(x-5,y+15); }
  ctx.stroke();
  // occasional lightning (deterministic per ~8s segment + jitter)
  const seg=Math.floor(gt/8), jit=((seg*2654435761)%1000)/1000*3.5, fs=seg*8+1.2+jit, ft=gt-fs;
  if(ft>=0 && ft<0.4){ const a=ft<0.07?ft/0.07:Math.max(0,1-(ft-0.07)/0.33);
    ctx.fillStyle='rgba(206,222,255,'+(0.30*a).toFixed(3)+')'; ctx.fillRect(0,0,W,H);
    const rr=((seg*48271)%1000)/1000; let bxl=70+rr*(W-140), yy=-4;
    ctx.strokeStyle='rgba(235,244,255,'+(0.75*a).toFixed(2)+')'; ctx.lineWidth=2.3; ctx.beginPath(); ctx.moveTo(bxl,yy);
    while(yy<horizon){ yy+=22+((Math.floor(yy*1.7)*7)%20); bxl+=((Math.floor(yy*1.3)*13)%34)-17; ctx.lineTo(bxl,yy); } ctx.stroke();
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

let cardRects=[], arrowRects=[];
let creaperSkin='default', dingSkin='dingbat';
const SKINC={default:'#5b3fd6', green:'#18a88a', blue:'#d82a2a', red:'#20c8c8', wraith:'#ff7a2a', gilded:'#2fcf55', bone:'#8a2a6a', crimson:'#d8e040'};
const DSKINC={dingbat:'#b5762e', ding_swamp:'#6f9a1a', ding_azure:'#2470d8', ding_blood:'#c0231e', ding_magic:'#1fe0a0', ding_mystic:'#9a4ae0', ding_wisp:'#7fd8e8', ding_news:'#c4c4c4', ding_noir:'#ff3ca0'};
const DORDER=['dingbat','ding_swamp','ding_azure','ding_blood','ding_magic','ding_mystic','ding_wisp','ding_news','ding_noir'];
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
  ctx.fillText(selMode==='skin'?'your character is bound to this story — colors only  ·  Esc returns to the realm':'tap a character to begin  ·  ◀ ▶ change the skin  ·  or arrow keys + space', W/2, 82);
  const cw=250, gap=(W-2*cw)/3, cardY=104, cardH=246;
  cardRects=[]; arrowRects=[];
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
      const isC=(it.key==='creaper');
      const list=isC?ORDER:DORDER, cmap=isC?SKINC:DSKINC, cur=isC?creaperSkin:dingSkin;
      // skin name + index atop the card
      ctx.textAlign='center';
      ctx.fillStyle=cmap[cur]||'#cdbbe6'; ctx.font='bold 19px sans-serif';
      ctx.fillText(prettySkin(cur), cardX+cw/2, cardY+32);
      ctx.fillStyle='#8a82a6'; ctx.font='11px sans-serif';
      ctx.fillText((list.indexOf(cur)+1)+' / '+list.length, cardX+cw/2, cardY+49);
      // big tap arrows flanking the character (cycle skins, endless loop)
      const ay=cardY+cardH-100, aw=40, ah=96, hot=(selRow===1 && (isC?0:1)===selFoc);
      for (const ar of [[-1,cardX+6],[1,cardX+cw-6-aw]]){
        const dir=ar[0], ax=ar[1];
        arrowRects.push({x:ax,y:ay-ah/2,w:aw,h:ah,who:isC?'c':'d',dir:dir});
        ctx.fillStyle='rgba(20,16,40,.6)'; roundRect(ax,ay-ah/2,aw,ah,10); ctx.fill();
        ctx.strokeStyle = hot?('rgba(200,251,80,'+(0.55+0.45*Math.sin(gt*4)).toFixed(2)+')'):'rgba(155,140,255,.55)';
        ctx.lineWidth=2; roundRect(ax,ay-ah/2,aw,ah,10); ctx.stroke();
        ctx.fillStyle='#e9e3ff'; const mx=ax+aw/2, my=ay, t=11; ctx.beginPath();
        if(dir<0){ ctx.moveTo(mx+t*0.6,my-t); ctx.lineTo(mx-t*0.6,my); ctx.lineTo(mx+t*0.6,my+t); }
        else { ctx.moveTo(mx-t*0.6,my-t); ctx.lineTo(mx+t*0.6,my); ctx.lineTo(mx-t*0.6,my+t); }
        ctx.closePath(); ctx.fill();
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
function drawStoneMeter(){ if(!equippedStone) return;
  const x=14,y=49,w=150,h=14, bx=x+26, bw=w-26;
  ctx.fillStyle='rgba(16,12,30,.66)'; roundRect(x-2,y-2,w+6,h+6,7); ctx.fill();
  const img=STONE_IMGS[equippedStone];
  if(img&&img.naturalWidth){ const ih=15, iw=img.naturalWidth*ih/img.naturalHeight; ctx.drawImage(img, x+11-iw/2, y+h/2-ih/2, iw, ih); }
  ctx.fillStyle='rgba(0,0,0,.5)'; roundRect(bx,y+3,bw,h-6,5); ctx.fill();
  const col=STONE_DEFS[equippedStone]||'#c8fb50';
  const frac = powerActive ? (equippedStone==='chaos' ? chaosAmmo/7 : Math.max(0,powerT/powerDur)) : stoneCharge/PMETER;
  ctx.save(); roundRect(bx,y+3,bw,h-6,5); ctx.clip();
  ctx.fillStyle=col; ctx.fillRect(bx,y+3,Math.max(0,bw*frac),h-6);
  if(!powerActive && frac>=1){ ctx.fillStyle='rgba(255,255,255,'+(0.25+0.3*Math.sin(gt*8)).toFixed(2)+')'; ctx.fillRect(bx,y+3,bw,h-6); }
  ctx.restore();
  if(!powerActive && frac>=1){ ctx.fillStyle='#fff'; ctx.font='bold 9px sans-serif'; ctx.textAlign='right'; ctx.fillText('JUMP\u00d72!', bx+bw-3, y+h-4); ctx.textAlign='left'; }
}
function drawPoweredFrame(sx, yy, fc){
  if(yy===undefined) yy=p.y; if(fc===undefined) fc=p.facing;
  const pimg=poweredImg(); if(!pimg||!pimg.complete||!pimg.naturalWidth) return;
  const hh=isDing(chosen)?122:163, ww=hh*pimg.naturalWidth/pimg.naturalHeight;
  ctx.save(); ctx.imageSmoothingEnabled=true; if(fc<0){ ctx.translate(sx,0); ctx.scale(-1,1); ctx.translate(-sx,0);} 
  ctx.drawImage(pimg, sx-ww/2, yy - hh + 16, ww, hh); ctx.restore();
}
function drawGlitchShard(img,w,h,seed){
  // ominous purple glow behind the shard
  ctx.save(); ctx.globalCompositeOperation='lighter'; const g=ctx.createRadialGradient(0,0,1,0,0,w*0.62); g.addColorStop(0,'rgba(150,90,255,0.5)'); g.addColorStop(0.5,'rgba(110,90,235,0.22)'); g.addColorStop(1,'rgba(90,60,200,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(0,0,w*0.62,0,7); ctx.fill(); ctx.restore();
  // base shard with the ripple band cut out
  const bandY=-h/2+((gt*1.3+seed)%1)*h, bandH=Math.max(4,h*0.3);
  ctx.save(); ctx.beginPath(); ctx.rect(-w,-h,w*2,h*2); ctx.rect(-w/2-2,bandY,w+4,bandH); ctx.clip('evenodd'); ctx.imageSmoothingEnabled=true; ctx.drawImage(img,-w/2,-h/2,w,h); ctx.restore();
  // displaced/stretched slices warping the shard along the wave
  const NS=4; for(let k=0;k<NS;k++){ const yy=bandY+k*(bandH/NS), hh=bandH/NS+1, env=Math.sin((k+0.5)/NS*Math.PI), dx=(Math.sin(gt*30+seed*5+k*2)*w*0.2+(Math.random()-0.5)*w*0.12)*env, sxk=1+(Math.random()<0.3?Math.random()*0.4:0);
    ctx.save(); ctx.beginPath(); ctx.rect(-w/2-5,yy,w+10,hh); ctx.clip(); ctx.scale(sxk,1); ctx.imageSmoothingEnabled=true; ctx.drawImage(img,-w/2+dx,-h/2,w,h); ctx.restore(); }
}
function drawChaosPile(behind){
  for(const e of chaosPile){ if(!!e.behind!==behind) continue; const img=CHAOS_FRAGS[e.v]; if(!img||!img.complete||!img.naturalWidth) continue;
    const ex=e.wx-camX, ey=e.wy, h=24*(e.sc||1), w=h*img.naturalWidth/img.naturalHeight;
    ctx.save(); ctx.translate(ex,ey); ctx.rotate(e.rot+Math.sin(gt*1.5+e.sp)*0.16); drawGlitchShard(img,w,h,e.sp); ctx.restore();
  }
}
function drawChaosBack(){
  if(!(powerActive && transformT<=0 && equippedStone==='chaos')) return;
  const sx=pxf(p.x,1), cy=p.y-54, pul=0.7+0.3*Math.sin(gt*3);
  ctx.save(); ctx.globalCompositeOperation='lighter';
  const g=ctx.createRadialGradient(sx,cy,8,sx,cy,98); g.addColorStop(0,'rgba(150,90,255,'+(0.34*pul).toFixed(2)+')'); g.addColorStop(0.5,'rgba(95,85,235,'+(0.18*pul).toFixed(2)+')'); g.addColorStop(1,'rgba(60,40,160,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(sx,cy,98,0,7); ctx.fill();
  ctx.restore();
  drawChaosPile(true);
}
function drawRubyBackOrbs(){
  if(!(powerActive && transformT<=0 && equippedStone==='ruby')) return;
  const sx=pxf(p.x,1), cx=sx, cy=p.y-50, Rb=78, ORB=4;
  for(let o=0;o<ORB;o++){ const ph=o/ORB*6.283, th=gt*2.2+ph; if(Math.sin(th)>=0) continue;
    const ex=cx+Math.cos(th)*(Rb+12), ey=cy+Math.sin(th)*20, r=Math.max(6,11+3*Math.sin(gt*10+ph)), hue=(14+30*(0.5+0.5*Math.sin(gt*6+ph)))|0;
    ctx.save(); ctx.globalCompositeOperation='lighter'; const g=ctx.createRadialGradient(ex,ey,0.5,ex,ey,r); g.addColorStop(0,'rgba(255,240,190,0.45)'); g.addColorStop(0.4,'hsla('+hue+',100%,58%,0.40)'); g.addColorStop(1,'rgba(255,60,30,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(ex,ey,r,0,7); ctx.fill(); ctx.restore();
    if(Math.random()<0.25) zbits.push({x:ex+(Math.random()-0.5)*r*0.6, y:ey, vx:(Math.random()-0.5)*18, vy:-34-Math.random()*40, sz:1+Math.random()*1.4, life:0.4+Math.random()*0.35, t:0, c:'hsl('+hue+',100%,'+(58+((Math.random()*16)|0))+'%)'}); }
}
function drawFluoriteAura(layer){
  if(!(powerActive && transformT<=0 && equippedStone==='fluorite')) return;
  const sx=pxf(p.x,1), fcx=sx, fcy=p.y-50, Rb2=78, NC=5;
  // shared orbit (ruby fire-soul path): backside lower + slight bob -> identical both layers, so motion is continuous
  const cp=[];
  for(let i=0;i<NC;i++){ const ph=i/NC*6.283, th=gt*2.2+ph, depth=(Math.sin(th)+1)/2,
    ex=fcx+Math.cos(th)*(Rb2+12), ey=fcy+Math.sin(th)*20+(1-depth)*10+Math.sin(gt*3+ph)*3;
    cp.push({ex,ey,th,ph,depth}); }
  const shard=(q,i)=>{ const hue=(gt*150+i*72)%360, dsc=0.72+0.28*q.depth, sz=7*dsc;
    ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.translate(q.ex,q.ey);
    const gg=ctx.createRadialGradient(0,0,0.5,0,0,sz*2.2); gg.addColorStop(0,'hsla('+hue+',100%,82%,'+(0.25+0.45*q.depth).toFixed(2)+')'); gg.addColorStop(1,'hsla('+hue+',100%,60%,0)'); ctx.fillStyle=gg; ctx.beginPath(); ctx.arc(0,0,sz*2.2,0,7); ctx.fill();
    ctx.fillStyle='hsla('+hue+',100%,74%,'+(0.5+0.4*q.depth).toFixed(2)+')'; ctx.beginPath(); ctx.moveTo(0,-sz); ctx.lineTo(sz*0.55,0); ctx.lineTo(0,sz); ctx.lineTo(-sz*0.55,0); ctx.closePath(); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,'+(0.55+0.4*q.depth).toFixed(2)+')'; ctx.beginPath(); ctx.moveTo(0,-sz*0.46); ctx.lineTo(sz*0.24,0); ctx.lineTo(0,sz*0.46); ctx.lineTo(-sz*0.24,0); ctx.closePath(); ctx.fill();
    ctx.restore();
    if(Math.random()<0.4) zbits.push({x:p.x+Math.cos(q.th)*(Rb2+12), y:q.ey, vx:(Math.random()-0.5)*22, vy:(Math.random()-0.5)*22, sz:1+Math.random()*1.3, life:0.3+Math.random()*0.3, t:0, c:'hsl('+Math.round(hue)+',100%,72%)'}); };
  if(layer==='front'){
    // white prism core + faint rainbow mote coat (only on the front pass, over the body)
    ctx.save(); ctx.globalCompositeOperation='lighter';
    const cg=ctx.createRadialGradient(fcx,fcy,3,fcx,fcy,72); cg.addColorStop(0,'rgba(255,255,255,0.30)'); cg.addColorStop(0.5,'rgba(220,235,255,0.11)'); cg.addColorStop(1,'rgba(220,235,255,0)'); ctx.fillStyle=cg; ctx.beginPath(); ctx.arc(fcx,fcy,72,0,7); ctx.fill();
    for(let m=0;m<12;m++){ const a=gt*(1.2+(m%3)*0.5)+m*0.84,
      mx=fcx+Math.cos(a)*(13+(m%4)*6)*Math.cos(m*1.3)+Math.sin(gt*1.2+m)*6,
      my=(p.y-48)+Math.sin(a*1.1+m)*(16+(m%5)*5)+Math.cos(gt*1.5+m)*5,
      hue=(gt*150+m*40)%360, pls=0.45+0.55*Math.abs(Math.sin(gt*4+m*1.7)), r=0.9+0.5*pls;
      const g=ctx.createRadialGradient(mx,my,0.2,mx,my,r*2.2); g.addColorStop(0,'hsla('+hue+',100%,86%,'+(0.34*pls).toFixed(2)+')'); g.addColorStop(0.5,'hsla('+hue+',100%,68%,'+(0.13*pls).toFixed(2)+')'); g.addColorStop(1,'hsla('+hue+',100%,60%,0)');
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(mx,my,r*2.2,0,7); ctx.fill(); }
    ctx.restore();
    // rising rainbow power fountain at the feet — constant flow fueling upward
    for(let k=0;k<5;k++){ const hue=(gt*150+Math.random()*90)%360; zbits.push({x:p.x+(Math.random()-0.5)*30, y:p.y-2-Math.random()*6, vx:(Math.random()-0.5)*26, vy:-72-Math.random()*95, sz:1.2+Math.random()*2, life:0.5+Math.random()*0.5, t:0, c:'hsl('+Math.round(hue)+',100%,'+(62+((Math.random()*18)|0))+'%)'}); }
  }
  // energy line: back segments (both ends behind) on the back pass, the rest on the front pass -> continuous loop
  { const lp=0.5+0.5*Math.sin(gt*2.0), lhue=(gt*120)%360;
    ctx.save(); ctx.globalCompositeOperation='lighter';
    ctx.strokeStyle='hsla('+lhue+',100%,74%,'+(0.10+0.72*lp).toFixed(2)+')'; ctx.lineWidth=1.2; ctx.shadowColor='hsla('+lhue+',100%,62%,0.95)'; ctx.shadowBlur=4+9*lp;
    for(let i=0;i<NC;i++){ const q0=cp[i], q1=cp[(i+1)%NC], backSeg=(Math.sin(q0.th)<0 && Math.sin(q1.th)<0);
      if((layer==='back')===backSeg){ ctx.beginPath(); ctx.moveTo(q0.ex,q0.ey); ctx.lineTo(q1.ex,q1.ey); ctx.stroke(); } }
    ctx.restore(); }
  // crystals: back half on the back pass, front half on the front pass
  for(let i=0;i<NC;i++){ const q=cp[i], isBack=Math.sin(q.th)<0; if((layer==='back')===isBack) shard(q,i); }
}
function drawPower(){ if(!powerActive && transformT<=0 && powerBoom<=0) return;
  const col=STONE_DEFS[equippedStone]||'#ffcf3c', sx=pxf(p.x,1), cy=p.y-60;
  // VIGNETTE: spotlight the hero, dark the rest (ramps in on charge, lifts on boom)
  const vig = transformT>0 ? (1-transformT/0.95) : (powerBoom>0 ? powerBoom/0.42 : 0);
  if(vig>0){ const va=0.64*vig, vg=ctx.createRadialGradient(sx,cy,40,sx,cy,Math.max(W,H)*0.72);
    vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(0.42,'rgba(0,0,0,'+(va*0.32).toFixed(2)+')'); vg.addColorStop(1,'rgba(0,0,0,'+va.toFixed(2)+')');
    ctx.fillStyle=vg; ctx.fillRect(0,camY,W,H); }
  // CHARGE / HANG: energy gathers inward, frame floats, crackle builds
  if(transformT>0){ const k=transformT/0.95;
    const gr=ctx.createRadialGradient(sx,cy,2,sx,cy,90*(1-k)+22);
    gr.addColorStop(0,col); gr.addColorStop(0.5,col+'66'); gr.addColorStop(1,col+'00');
    ctx.globalAlpha=0.45+0.5*(1-k); ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(sx,cy,90*(1-k)+22,0,7); ctx.fill(); ctx.globalAlpha=1;
    ctx.save(); ctx.globalCompositeOperation='lighter';
    for(let i=0;i<16;i++){ const ph=((gt*1.4+i*0.0625)%1), rr=(1-ph)*(120*(1-k)+50)+8, ang=i*2.39996+gt*1.1, px=sx+Math.cos(ang)*rr, py=cy+Math.sin(ang)*rr*0.92, pr=Math.max(2,4+3*Math.sin(gt*9+i));
      ctx.globalAlpha=(0.12+0.5*ph)*(0.45+0.55*(1-k)); const pg=ctx.createRadialGradient(px,py,0.4,px,py,pr); pg.addColorStop(0,'rgba(255,250,235,0.95)'); pg.addColorStop(0.45,col); pg.addColorStop(1,col+'00'); ctx.fillStyle=pg; ctx.beginPath(); ctx.arc(px,py,pr,0,7); ctx.fill(); }
    ctx.globalAlpha=1; ctx.restore();
    ctx.globalAlpha=1;
    if(equippedStone){ const simg=STONE_IMGS[equippedStone]; if(simg&&simg.naturalWidth){ const kk=1-k; const ry=cy-12-kk*112, ssz=34+kk*36;
      const sg=ctx.createRadialGradient(sx,ry,2,sx,ry,ssz); sg.addColorStop(0,col); sg.addColorStop(0.5,col+'88'); sg.addColorStop(1,col+'00'); ctx.globalAlpha=0.85; ctx.fillStyle=sg; ctx.beginPath(); ctx.arc(sx,ry,ssz,0,7); ctx.fill(); ctx.globalAlpha=1;
      const sw=ssz*simg.naturalWidth/simg.naturalHeight; ctx.imageSmoothingEnabled=true; ctx.drawImage(simg, sx-sw/2, ry-ssz/2, sw, ssz); } }
  }
  // BOOM: outward shockwave
  if(powerBoom>0){ const tp=1-powerBoom/0.42, R=tp*230;
    ctx.globalAlpha=Math.max(0,1-tp); ctx.strokeStyle='#ffffff'; ctx.lineWidth=9*(1-tp); ctx.beginPath(); ctx.arc(sx,cy,R*0.62,0,7); ctx.stroke();
    ctx.strokeStyle=col; ctx.lineWidth=13*(1-tp); ctx.beginPath(); ctx.arc(sx,cy,R,0,7); ctx.stroke(); ctx.globalAlpha=1;
  }
  // SUSTAINED — per-stone signature FX while active (no generic ring)
  if(powerActive && transformT<=0){
    if(equippedStone==='ruby'){
      const cx=sx, cy=p.y-50, Rb=78, ORB=4, haveOrb=(RUBY_ORB.complete&&RUBY_ORB.naturalWidth);
      const flick=0.72+0.28*Math.sin(gt*12)+0.12*Math.sin(gt*27);
      // back orbs now drawn in drawRubyBackOrbs() BEFORE the player so they pass behind the character
      // transparent glass barrier — the character shows through
      // procedural fiery protective core (no image) — translucent so the character shows through
      ctx.save(); ctx.beginPath(); ctx.arc(cx,cy,Rb,0,7); ctx.clip();
      const rg=ctx.createRadialGradient(cx,cy-Rb*0.15,2,cx,cy,Rb);
      rg.addColorStop(0,'rgba(255,205,95,0.30)'); rg.addColorStop(0.55,'rgba(255,110,40,0.22)'); rg.addColorStop(1,'rgba(190,28,16,0.12)');
      ctx.fillStyle=rg; ctx.fillRect(cx-Rb,cy-Rb,Rb*2,Rb*2);
      // sweeping diagonal color band (top-right -> bottom-left), hue cycling red/orange/yellow
      ctx.globalCompositeOperation='lighter';
      const sweep=(gt*0.45)%1, p1=Math.min(0.96,Math.max(0.04,sweep)), p0=Math.max(0,p1-0.28), p2=Math.min(1,p1+0.28);
      const h1=10+8*Math.sin(gt*2), h2=42+10*Math.sin(gt*2.0+1), h3=24+8*Math.sin(gt*2.0+2);
      const lg=ctx.createLinearGradient(cx+Rb,cy-Rb,cx-Rb,cy+Rb);
      lg.addColorStop(0,'hsla('+h1+',100%,55%,0.10)'); lg.addColorStop(p0,'hsla('+h1+',100%,55%,0.10)');
      lg.addColorStop(p1,'hsla('+h2+',100%,62%,0.5)'); lg.addColorStop(p2,'hsla('+h3+',100%,55%,0.12)'); lg.addColorStop(1,'hsla('+h3+',100%,55%,0.10)');
      ctx.fillStyle=lg; ctx.fillRect(cx-Rb,cy-Rb,Rb*2,Rb*2);
      // inner churning embers glow
      const cg=ctx.createRadialGradient(cx+Rb*0.3*Math.sin(gt*1.6),cy+Rb*0.3*Math.cos(gt*1.9),2,cx,cy,Rb*0.8);
      cg.addColorStop(0,'rgba(255,230,150,0.35)'); cg.addColorStop(1,'rgba(255,120,40,0)');
      ctx.fillStyle=cg; ctx.beginPath(); ctx.arc(cx,cy,Rb,0,7); ctx.fill();
      ctx.restore();
      // fiery glowing rim along the border (flickering)
      ctx.save(); ctx.globalCompositeOperation='lighter';
      const bg2=ctx.createRadialGradient(cx,cy,Rb*0.72,cx,cy,Rb+15); bg2.addColorStop(0,'rgba(255,80,20,0)'); bg2.addColorStop(0.8,'rgba(255,90,20,'+(0.14*flick).toFixed(2)+')'); bg2.addColorStop(0.93,'hsla('+(18+12*Math.sin(gt*5))+',100%,55%,'+(0.55*flick).toFixed(2)+')'); bg2.addColorStop(1,'rgba(255,170,60,0)');
      ctx.fillStyle=bg2; ctx.beginPath(); ctx.arc(cx,cy,Rb+15,0,7); ctx.fill();
      ctx.strokeStyle='hsla('+(20+15*Math.sin(gt*6))+',100%,62%,'+(0.5*flick).toFixed(2)+')'; ctx.lineWidth=Math.max(1,2.4+1.4*Math.sin(gt*10)); ctx.beginPath(); ctx.arc(cx,cy,Rb,0,7); ctx.stroke();
      ctx.restore();
      // front orbs (lower half) — bigger/brighter, on top
      for(let o=0;o<ORB;o++){ const ph=o/ORB*6.283, th=gt*2.2+ph; if(Math.sin(th)<0) continue;
        const ex=cx+Math.cos(th)*(Rb+12), ey=cy+Math.sin(th)*20, r=Math.max(8,15+4*Math.sin(gt*10+ph)), hue=(14+30*(0.5+0.5*Math.sin(gt*6+ph)))|0;
        ctx.save(); ctx.globalCompositeOperation='lighter'; const g=ctx.createRadialGradient(ex,ey,0.6,ex,ey,r); g.addColorStop(0,'rgba(255,250,215,0.95)'); g.addColorStop(0.4,'hsla('+hue+',100%,62%,0.60)'); g.addColorStop(1,'rgba(255,60,30,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(ex,ey,r,0,7); ctx.fill(); ctx.restore();
        if(Math.random()<0.5) zbits.push({x:ex+(Math.random()-0.5)*r*0.6, y:ey, vx:(Math.random()-0.5)*22, vy:-42-Math.random()*48, sz:1.1+Math.random()*1.6, life:0.45+Math.random()*0.4, t:0, c:'hsl('+hue+',100%,'+(60+((Math.random()*16)|0))+'%)'}); }
      if(Math.random()<0.5) zbits.push({x:p.x+(Math.random()-0.5)*52, y:p.y-30-Math.random()*40, vx:(Math.random()-0.5)*36, vy:-50-Math.random()*70, sz:1.2+Math.random()*2, life:0.4+Math.random()*0.4, t:0, c:['#ffcf3c','#ff7a2c','#ff3d2c'][(Math.random()*3)|0]});
    }
    else if(equippedStone==='emerald'){
      const pulse=0.5+0.5*Math.sin(gt*4);
      ctx.save(); ctx.globalCompositeOperation='lighter';
      const bg=ctx.createRadialGradient(sx,cy,6,sx,cy,86+12*pulse); bg.addColorStop(0,'rgba(61,220,132,'+(0.34+0.16*pulse).toFixed(2)+')'); bg.addColorStop(0.5,'rgba(47,224,106,0.16)'); bg.addColorStop(1,'rgba(47,224,106,0)'); ctx.fillStyle=bg; ctx.beginPath(); ctx.arc(sx,cy,90,0,7); ctx.fill();
      // rising health stream: sparkly green pixels spiral up from the feet and wrap around the body (front pass)
      for(let i=0;i<16;i++){ const t2=((gt*0.55+i/16)%1), ry=p.y-2-t2*100, swing=Math.sin(t2*6.283*1.4+i*1.3+gt*2)*(22*(0.35+0.65*t2)), rx=sx+swing, fade=Math.sin(t2*Math.PI), ps=(i%4===0?2.2:1.2);
        ctx.fillStyle='rgba('+(90+((Math.random()*40)|0))+',255,'+(150+((Math.random()*60)|0))+','+(0.35+0.5*fade).toFixed(2)+')'; ctx.fillRect(rx-ps/2,ry-ps/2,ps,ps);
        if(Math.random()<0.25){ ctx.fillStyle='rgba(210,255,220,'+(0.6*fade).toFixed(2)+')'; ctx.fillRect(rx-0.8,ry-0.8,1.7,1.7); } }
      ctx.restore();
      // feet emission rising behind the body (constant green flow)
      for(let k=0;k<3;k++) zbits.push({x:p.x+(Math.random()-0.5)*32, y:p.y-2-Math.random()*5, vx:(Math.random()-0.5)*24, vy:-58-Math.random()*72, sz:1.2+Math.random()*1.8, life:0.6+Math.random()*0.5, t:0, c:['#3ddc84','#7fffa0','#aaffc0'][(Math.random()*3)|0]});
    }
    else if(equippedStone==='amethyst'){
      ctx.save(); ctx.globalCompositeOperation='lighter';
      const g=ctx.createRadialGradient(sx,cy,6,sx,cy,74); g.addColorStop(0,'rgba(176,107,255,0.32)'); g.addColorStop(0.6,'rgba(123,92,255,0.13)'); g.addColorStop(1,'rgba(123,92,255,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(sx,cy,76,0,7); ctx.fill();
      for(let i=0;i<3;i++){ if(Math.random()<0.5){ const px=sx+(Math.random()-0.5)*56, py=cy+(Math.random()-0.5)*88, s=2+Math.random()*2.6; ctx.globalAlpha=0.5+Math.random()*0.5; ctx.fillStyle='#e7d4ff'; ctx.fillRect(px-0.7,py-s,1.4,2*s); ctx.fillRect(px-s,py-0.7,2*s,1.4); } }
      ctx.globalAlpha=1; ctx.restore();
    }
    else if(equippedStone==='topaz'){
      ctx.save(); ctx.globalCompositeOperation='lighter';
      const pul=0.55+0.45*Math.abs(Math.sin(gt*15));
      const g=ctx.createRadialGradient(sx,cy,4,sx,cy,74); g.addColorStop(0,'rgba(255,255,215,'+(0.22*pul).toFixed(2)+')'); g.addColorStop(0.45,'rgba(255,224,74,'+(0.16*pul).toFixed(2)+')'); g.addColorStop(1,'rgba(255,194,60,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(sx,cy,74,0,7); ctx.fill();
      for(let i=0;i<12;i++){ const a=gt*(3.2+i*0.6)+i*1.3, rr=18+22*Math.abs(Math.sin(gt*4.5+i*1.7)), px=sx+Math.cos(a)*rr, py=cy+Math.sin(a*1.4)*rr*0.9, s=Math.max(0.8,1.5+1.3*Math.sin(gt*20+i*2)), wt=Math.sin(gt*26+i*3)>0;
        ctx.fillStyle=wt?'rgba(255,255,200,0.18)':'rgba(255,210,60,0.16)'; ctx.beginPath(); ctx.arc(px,py,s*2.4,0,7); ctx.fill();
        ctx.fillStyle=wt?'rgba(255,255,255,0.95)':'rgba(255,224,74,0.92)'; ctx.beginPath(); ctx.arc(px,py,s,0,7); ctx.fill(); }
      ctx.restore();
      if(Math.random()<0.75) zbits.push({x:p.x+(Math.random()-0.5)*48, y:p.y-50+(Math.random()-0.5)*68, vx:(Math.random()-0.5)*160, vy:(Math.random()-0.5)*160, sz:1+Math.random()*1.6, life:0.14+Math.random()*0.18, t:0, c:(Math.random()<0.5?'#ffffff':'#ffe04a')});
    }
    else if(equippedStone==='sapphire'){
      // Time Frost: icy world tint + frost aura + drifting crystals
      ctx.save(); ctx.globalCompositeOperation='lighter';
      ctx.fillStyle='rgba(90,170,255,0.06)'; ctx.fillRect(0,camY,W,H);
      const g=ctx.createRadialGradient(sx,cy,6,sx,cy,72); g.addColorStop(0,'rgba(130,200,255,0.32)'); g.addColorStop(0.6,'rgba(77,140,255,0.14)'); g.addColorStop(1,'rgba(77,140,255,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(sx,cy,74,0,7); ctx.fill();
      ctx.restore();
      if(Math.random()<0.5) zbits.push({x:p.x+(Math.random()-0.5)*64, y:p.y-36-Math.random()*44, vx:(Math.random()-0.5)*28, vy:-8-Math.random()*26, sz:1.2+Math.random()*1.8, life:0.6+Math.random()*0.5, t:0, c:['#bfe4ff','#7fc8ff','#ffffff'][(Math.random()*3)|0]});
    }
    else if(equippedStone==='chaos'){
      drawChaosPile(false);
      // flashing glitch pixels floating up/down around the body
      ctx.save();
      for(let i=0;i<16;i++){ if(Math.random()<0.5) continue; const a=i*1.7,
          px2=sx+Math.cos(a+gt*0.6)*(18+(i%5)*8), py2=(p.y-50)+Math.sin(a*1.3+gt*0.8)*(34+(i%4)*9)+Math.sin(gt*2.2+i)*7,
          ps=(Math.random()<0.28?3:1.5), c=['#ffffff','#b06bff','#ff3d5a','#5fe0ff','#e24dff'][i%5];
        ctx.fillStyle=c; ctx.globalAlpha=0.5+0.5*Math.random(); ctx.fillRect(px2-ps/2,py2-ps/2,ps,ps); }
      ctx.globalAlpha=1; ctx.restore();
    }
    else if(equippedStone!=='fluorite'){
      const pr=48+6*Math.sin(gt*6); const g=ctx.createRadialGradient(sx,cy+14,4,sx,cy+14,pr+22); g.addColorStop(0,col+'00'); g.addColorStop(0.7,col+'44'); g.addColorStop(1,col+'00'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(sx,cy+14,pr+22,0,7); ctx.fill();
    }
  }
}

function drawStonePick(){
  ctx.setTransform(RS,0,0,RS,0,0);
  const bg=ctx.createLinearGradient(0,0,0,H); bg.addColorStop(0,'#0a0712'); bg.addColorStop(1,'#170d24'); ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
  ctx.textAlign='center'; ctx.fillStyle='#eae6ff'; ctx.font='bold 30px sans-serif'; ctx.fillText('Equip a cReapY Stone', W/2, 64);
  ctx.font='14px sans-serif'; ctx.fillStyle='#9b8cff'; ctx.fillText('charge it with souls \u00b7 in the air, tap Jump again to unleash', W/2, 90);
  const cname=isDing(chosen)?'Dingbat':'cReaper', cw=210, cx0=W/2-cw/2;
  let cy0=100;
  ctx.fillStyle='rgba(123,92,255,.18)'; roundRect(cx0,cy0,cw,28,8); ctx.fill(); ctx.strokeStyle='#7b5cff'; ctx.lineWidth=1.5; roundRect(cx0,cy0,cw,28,8); ctx.stroke();
  ctx.fillStyle='#cdbbe6'; ctx.font='bold 14px sans-serif'; ctx.fillText('\u25c2  Character: '+cname+'  \u25b8', W/2, cy0+19);
  charToggleRect={x:cx0,y:cy0,w:cw,h:28};
  let cy1=132; const sname=prettySkin(chosen);
  ctx.fillStyle='rgba(60,90,160,.18)'; roundRect(cx0,cy1,cw,28,8); ctx.fill(); ctx.strokeStyle='#5fb4ff'; ctx.lineWidth=1.5; roundRect(cx0,cy1,cw,28,8); ctx.stroke();
  ctx.fillStyle='#bfe4ff'; ctx.font='bold 14px sans-serif'; ctx.fillText('\u25c2  Skin: '+sname+'  \u25b8', W/2, cy1+19);
  skinPrevRect={x:cx0,y:cy1,w:cw/2,h:28}; skinNextRect={x:cx0+cw/2,y:cy1,w:cw/2,h:28};
  const n=PICK_STONES.length, sz=66, gap=12, totalW=n*sz+(n-1)*gap, x0=W/2-totalW/2, y=H/2+18;
  stonePickRects=[];
  for(let i=0;i<n;i++){ const key=PICK_STONES[i], cx=x0+i*(sz+gap)+sz/2, cy=y, seld=i===stonePickSel;
    ctx.fillStyle=seld?'rgba(200,251,80,.14)':'rgba(255,255,255,.04)'; roundRect(cx-sz/2,cy-sz/2,sz,sz,12); ctx.fill();
    if(seld){ ctx.strokeStyle='#c8fb50'; ctx.lineWidth=3; roundRect(cx-sz/2,cy-sz/2,sz,sz,12); ctx.stroke(); }
    if(key==='none'){ ctx.fillStyle='#8a80a8'; ctx.font='bold 13px sans-serif'; ctx.fillText('NONE', cx, cy+4); }
    else { const img=STONE_IMGS[key]; if(img&&img.naturalWidth){ const h=sz-14, w=h*img.naturalWidth/img.naturalHeight; if(seld){ctx.save();ctx.shadowColor=STONE_DEFS[key];ctx.shadowBlur=20;} ctx.drawImage(img,cx-w/2,cy-h/2,w,h); if(seld)ctx.restore(); } }
    stonePickRects.push({x:cx-sz/2,y:cy-sz/2,w:sz,h:sz,i}); }
  const sel=PICK_STONES[stonePickSel];
  ctx.font='bold 21px sans-serif'; ctx.fillStyle= sel==='none'?'#9b8cff':STONE_DEFS[sel];
  ctx.fillText(sel==='none'?'No stone \u2014 pure skill':(sel.charAt(0).toUpperCase()+sel.slice(1)+'  \u2014  '+(STONE_POWER[sel]||'')), W/2, y+sz/2+46);
  ctx.font='13px sans-serif'; ctx.fillStyle='#cdbbe6'; ctx.fillText('\u2190 \u2192  choose       Space / tap  equip & descend', W/2, H-34);
  ctx.textAlign='left';
}
function drawPlayerHP(){
  const x=14,y=14,w=196,h=26, bx=x+44, bw=w-46;
  ctx.fillStyle='rgba(16,12,30,.72)'; roundRect(x-2,y-2,w+6,h+6,9); ctx.fill();
  ctx.strokeStyle='rgba(150,140,255,.4)'; ctx.lineWidth=1; ctx.stroke();
  const hi=SPR.hpicon[chosen]||SPR.hpicon[isDing(chosen)?'dingbat':chosen];
  if (hi){ const ih=30, iw=hi.w*ih/hi.h; ctx.drawImage(hi.img, x+16-iw/2, y+h/2-ih/2, iw, ih); }
  ctx.fillStyle='rgba(0,0,0,.55)'; roundRect(bx,y+4,bw,h-8,6); ctx.fill();
  const frac=Math.max(0,Math.min(1,p.hpShown/maxHPShown));
  const low = frac<0.34 ? (0.55+0.45*Math.sin(gt*9)) : 0;
  const c=hpColor(frac);
  ctx.save(); roundRect(bx,y+4,bw,h-8,6); ctx.clip();
  const g=ctx.createLinearGradient(bx,0,bx+bw,0); g.addColorStop(0,c.d); g.addColorStop(1,c.l);
  ctx.fillStyle=g; ctx.fillRect(bx,y+4,bw*frac,h-8);
  ctx.fillStyle='rgba(255,255,255,.18)'; ctx.fillRect(bx,y+5,bw*frac,3);
  if(vigorFlash>0){ ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.fillStyle='rgba(255,255,255,'+(0.78*(vigorFlash/0.5)).toFixed(2)+')'; ctx.fillRect(bx,y+4,bw,h-8); ctx.restore(); }
  ctx.restore();
  ctx.strokeStyle='rgba(0,0,0,.55)'; ctx.lineWidth=2;
  const _mx=maxHPShown, _segs=Math.round(_mx); for(let i=1;i<_segs;i++){ const sn=bx+bw*i/_mx; ctx.beginPath(); ctx.moveTo(sn,y+5); ctx.lineTo(sn,y+h-5); ctx.stroke(); }
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

function voidErase(z,bo){ z.dead=true; z.dieT=0; z.dstate=z.state; z.dframe=Math.floor(z.t*FZK[z.kw][z.state])%SPR[z.kw][z.state].frames; z.erase={x:bo.x,y:bo.y}; killCount++; addScore(KPTS[z.kw]||300); playSfx('sfx_dportal',0.6); }
function voidEraseBat(b,bo){ b.dead=true; b.dieT=0; b.erase={x:bo.x,y:bo.y}; killCount++; addScore(KPTS.bat); playSfx('sfx_dportal',0.6); }
function witchFloorAt(x){
  let best=null; for(const t of segFloorsAt(x)){ if(best===null||t>best) best=t; }
  if(best!==null) return best;
  for(const q of plats){ if(q.gone) continue; if(x>=q.x&&x<=q.x+q.w) return q.y+(q.dy||0); }
  return null;
}
function witchRelocate(z){
  const L=camX+60, R=camX+W-60; let lo,hi;
  if(p.x < camX+W/2){ lo=camX+W*0.55; hi=R; } else { lo=L; hi=camX+W*0.45; }
  for(let t=0;t<12;t++){ const tx=lo+Math.random()*(hi-lo), fy=witchFloorAt(tx); if(fy!==null){ z.x=tx; z.y=fy; return; } }
  z.x=Math.max(L,Math.min(R,2*(camX+W/2)-z.x)); const fy=witchFloorAt(z.x); if(fy!==null) z.y=fy;
}
function witchFireCurse(z){
  const wx=z.x+z.facing*20, wy=z.y-92, dx=p.x-wx, dy=(p.y-44)-wy, d=Math.hypot(dx,dy)||1, sp=330;
  curses.push({x:wx,y:wy,vx:dx/d*sp,vy:dy/d*sp,t:0,dead:false,col:'green',r:14}); playSfx('sfx_shriek',0.7);
  for(let i=0;i<10;i++) zbits.push({x:wx,y:wy,vx:(Math.random()-0.5)*120,vy:(Math.random()-0.5)*120,sz:1.5+Math.random()*2,life:0.3+Math.random()*0.25,t:0,c:['#9bff4a','#5fd83a','#caffa0'][(Math.random()*3)|0]});
}
function chaserFire(z,C){
  const wx=z.x+z.facing*22, wy=z.y-(C.fly?64:80), dx=p.x-wx, dy=(p.y-44)-wy, d=Math.hypot(dx,dy)||1, sp=C.shotSpd||310;
  curses.push({x:wx,y:wy,vx:dx/d*sp,vy:dy/d*sp,t:0,dead:false,col:C.fcol||'green',r:C.shotR||15});
  playSfx('sfx_shriek',0.6);
  const cols=C.fcol==='dark'?['#b06bff','#7a3ad8','#e0c0ff']:['#9bff4a','#5fd83a','#caffa0'];
  for(let i=0;i<10;i++) zbits.push({x:wx,y:wy,vx:(Math.random()-0.5)*120,vy:(Math.random()-0.5)*120,sz:1.5+Math.random()*2,life:0.3+Math.random()*0.25,t:0,c:cols[(Math.random()*3)|0]});
}
function witchStartHop(z){
  let target=null;
  for(const q of plats){ if(q.gone) continue; const cx=q.x+q.w/2, top=q.y+(q.dy||0);
    if(top<z.y-30 && Math.abs(cx-z.x)<300 && Math.abs(cx-z.x)>30){ if(!target||Math.abs(cx-z.x)<Math.abs(target.x-z.x)) target={x:cx,y:top}; } }
  if(!target){ const dir=(p.x<z.x)?1:-1; let tx=Math.max(camX+40,Math.min(camX+W-40,z.x+dir*150)); const fy=witchFloorAt(tx); target={x:tx,y:(fy!==null?fy:z.y)}; }
  z.hx0=z.x; z.hy0=z.y; z.hx1=target.x; z.hy1=target.y; z.hopT=z.hopDur; z.wmode='hop'; z.state='jump'; playSfx('sfx_rwhoosh',0.5);
}
function witchStartTele(z){ z.teleT=z.teleDur; z.teleDone=false; z.wmode='tele'; z.teleCd=4.5+Math.random()*3; playSfx('sfx_wportal',0.5);
  for(let i=0;i<16;i++) zbits.push({x:z.x+(Math.random()-0.5)*30,y:z.y-50+(Math.random()-0.5)*70,vx:(Math.random()-0.5)*120,vy:-30-Math.random()*120,sz:2+Math.random()*2.5,life:0.4+Math.random()*0.3,t:0,c:['#9bff4a','#5fd83a','#caffa0'][(Math.random()*3)|0]}); }
function updateCurses(dt){
  for(const c of curses){ if(c.dead) continue; c.t+=dt; c.x+=c.vx*dt; c.y+=c.vy*dt;
    if(c.t>2.4){ c.dead=true; continue; }
    if(p.inv<=0 && !p.dead){ const pb=pBodyBox(); if(c.x>pb.x-6&&c.x<pb.x+pb.w+6&&c.y>pb.y-6&&c.y<pb.y+pb.h+6){ hurtPlayer(c.x,1); c.dead=true; const hc=c.col==='dark'?['#b06bff','#7a3ad8','#ffffff']:['#9bff4a','#5fd83a','#ffffff']; for(let i=0;i<14;i++) zbits.push({x:c.x,y:c.y,vx:(Math.random()-0.5)*190,vy:(Math.random()-0.5)*190,sz:2+Math.random()*2.5,life:0.3+Math.random()*0.3,t:0,c:hc[(Math.random()*3)|0]}); } }
    if(Math.random()<0.55) zbits.push({x:c.x,y:c.y,vx:(Math.random()-0.5)*26,vy:(Math.random()-0.5)*26,sz:1+Math.random()*1.4,life:0.2+Math.random()*0.2,t:0,c:(c.col==='dark'?'#9a5ae8':'#7fe83a')});
  }
  curses=curses.filter(c=>!c.dead);
}
function drawCurses(){
  for(const c of curses){ if(c.dead) continue; const sx=c.x-camX; if(sx<-30||sx>W+30) continue; const sy=c.y, fl=0.7+0.3*Math.sin(gt*30+c.t*40), R=c.r||14, dark=c.col==='dark';
    ctx.save(); ctx.globalCompositeOperation='lighter';
    const g=ctx.createRadialGradient(sx,sy,1,sx,sy,R);
    if(dark){ g.addColorStop(0,'rgba(225,190,255,'+(0.9*fl).toFixed(2)+')'); g.addColorStop(0.45,'rgba(150,80,230,'+(0.6*fl).toFixed(2)+')'); g.addColorStop(1,'rgba(90,30,170,0)'); }
    else { g.addColorStop(0,'rgba(205,255,150,'+(0.9*fl).toFixed(2)+')'); g.addColorStop(0.45,'rgba(120,230,60,'+(0.55*fl).toFixed(2)+')'); g.addColorStop(1,'rgba(70,180,30,0)'); }
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(sx,sy,R,0,7); ctx.fill();
    ctx.fillStyle='rgba(245,240,255,'+fl.toFixed(2)+')'; ctx.beginPath(); ctx.arc(sx,sy,3,0,7); ctx.fill(); ctx.restore();
  }
}
function drawZombie(z){
  if(z.dead && z.erase){ const a=SPR[z.kw][z.dstate], k=Math.min(1,z.dieT/0.55); if(k>=1) return; const sx2=z.x-camX, ex=z.erase.x-camX, ey=z.erase.y, lx=sx2+(ex-sx2)*k, ly=z.y+(ey-z.y)*k, sc=Math.max(0.02,1-k);
    ctx.save(); ctx.globalAlpha=Math.max(0,1-k*0.9); ctx.translate(lx,ly); ctx.rotate(k*7*(z.facing<0?-1:1)); ctx.scale(sc*(z.facing<0?-1:1),sc); ctx.imageSmoothingEnabled=true; ctx.drawImage(a.img, z.dframe*a.sw,0,a.sw,a.sh, -a.w/2,-a.h/2, a.w,a.h); ctx.restore(); return; }
  let state=z.dead?z.dstate:z.state;
  const a=SPR[z.kw][state]; const sx=z.x-camX; if(sx<-120||sx>W+120) return;
  let fi, alpha=1, dy=0;
  if (z.dead){ fi=z.dframe; const k=z.dieT/0.7; alpha=Math.max(0,1-k); dy=-34*k; if(z.dieT>0.75) return; }
  else if (z.kw==='golem' && state==='attack') fi=golemAtkFrame(z.atkElapsed||0);
  else if (CHASER[z.kw]){ if(state==='attack') fi=Math.min(a.frames-1, Math.floor((CHASER[z.kw].atkFrames/CHASER[z.kw].atkFps - z.atkT)*CHASER[z.kw].atkFps)); else fi=Math.floor(z.t*FZK[z.kw][state])%a.frames; }
  else if (z.kw==='witch'){ if(state==='attack') fi=Math.min(24,17+Math.floor((z.atkDur-z.atkT)*12)); else if(state==='jump') fi=Math.min(24,Math.max(0,Math.floor((1-(z.hopT||0)/(z.hopDur||1))*24))); else fi=Math.floor(z.t*12)%a.frames; }
  else fi=Math.floor(z.t*FZK[z.kw][state])%a.frames;
  if(z.kw==='witch' && z.alpha!==undefined) alpha*=z.alpha;
  ctx.save(); ctx.globalAlpha=alpha;
  if (z.facing<0){ ctx.translate(sx,0); ctx.scale(-1,1); ctx.translate(-sx,0); }
  ctx.imageSmoothingEnabled=true;
  ctx.drawImage(a.img, fi*a.sw,0,a.sw,a.sh, sx-a.cxs[fi], z.y-a.foots[fi]+dy, a.w,a.h);
  ctx.restore(); ctx.globalAlpha=1;
}
function drawBat(b){
  if(b.dead && b.erase){ const a=SPR.bat.idle, k=Math.min(1,b.dieT/0.5); if(k>=1) return; const sx2=b.x-camX, ex=b.erase.x-camX, ey=b.erase.y, lx=sx2+(ex-sx2)*k, ly=(b.yD||b.y)+(ey-(b.yD||b.y))*k, sc=Math.max(0.02,1-k);
    ctx.save(); ctx.globalAlpha=Math.max(0,1-k*0.9); ctx.translate(lx,ly); ctx.rotate(k*7); ctx.scale(sc,sc); ctx.imageSmoothingEnabled=true; ctx.drawImage(a.img,0,0,a.sw,a.sh,-a.w/2,-a.h/2,a.w,a.h); ctx.restore(); return; }
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
function renderCrushDeath(sx, gt){
  const t=p.deadT, TP=1.42, STEPS=4, BACK=32, DOWN=12, dir=p.tossDir||-p.facing;
  const hf=Math.min(SPR.chars[chosen].hurt.frames-1, Math.floor(t*FPS.hurt));
  const endX=sx + dir*BACK, endY=p.y + DOWN;
  if (t < TP){
    const prog=Math.min(1, t/TP);
    const step=Math.min(STEPS, Math.floor(prog*(STEPS+1)));       // discrete recoil steps (slower hold each)
    const ease=step/STEPS;
    const tx=sx + dir*BACK*Math.pow(ease,1.2), ty=p.y + DOWN*ease;  // slight back + downward per step (falling)
    const gi=0.12 + 0.55*prog;                                    // glitch slowly increases
    const redOn=(Math.floor(gt*22)%2===0);                        // flickering hurt-red hue
    ctx.globalAlpha = redOn?1:0.74;
    drawCharSprite(chosen,'hurt',hf,tx,ty,p.facing,1, redOn?0.65:0.28);
    if (gi>0.3){ ctx.save(); ctx.globalAlpha=0.4; drawGlitchAnim(chosen,'hurt',hf,tx,ty,p.facing,1, gi); ctx.restore(); }
    ctx.globalAlpha=1;
    return;
  }
  const te=t-TP, pcx=endX - dir*20, pcy=endY-46;                  // portal hooks from where he landed
  let ps=0;
  if (te<=0.4) ps=80*(te/0.4);
  else if (te<=1.0) ps=80;
  else ps=Math.max(0, 80*(1-(te-1.0)/0.45));
  if (ps>0.5) drawPortal(pcx, pcy, ps, gt);
  const gi=Math.min(1, 0.55 + te/1.1), g2=gi*gi;
  const frq=6+26*g2;
  const fl=(Math.floor(gt*frq)%4===0)?Math.max(0.25,1-0.9*g2):(Math.random()<0.12*g2?0.55:1);
  if (te<=0.4){ ctx.globalAlpha=fl; drawGlitchAnim(chosen,'hurt',hf,endX,endY,p.facing,1,gi); ctx.globalAlpha=1; }
  else { const k=Math.min(1,(te-0.4)/0.7), s=Math.max(0.05,1-k); const cxp=endX+(pcx-endX)*k, fy=endY+((pcy+58*s)-endY)*k; ctx.globalAlpha=Math.max(0,1-k*0.9)*fl; drawGlitchAnim(chosen,'hurt',hf,cxp,fy,p.facing,s,gi); ctx.globalAlpha=1; }
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
    if (p.slamT>0){
      const slamA=(SPR.chars[chosen]&&SPR.chars[chosen].slam)?'slam':'kneel';
      for (let gi3=0; gi3<slamGhosts.length; gi3+=2){
        const g3=slamGhosts[gi3], gsx3=g3.x-camX;
        ctx.save(); ctx.globalAlpha=0.05+0.13*(gi3/Math.max(1,slamGhosts.length));
        drawCharSprite(chosen,slamA,0,gsx3,g3.y,p.facing,1,0); ctx.restore();
      }
      ctx.save(); ctx.strokeStyle='rgba(185,212,255,0.55)'; ctx.lineWidth=2;
      for(let s3=0;s3<5;s3++){ const ox=sx-26+s3*13+(Math.random()*4-2); ctx.beginPath(); ctx.moveTo(ox,p.y-152); ctx.lineTo(ox,p.y-152+34+Math.random()*20); ctx.stroke(); }
      ctx.restore();
      drawCharSprite(chosen,slamA,0,sx,p.y,p.facing,1,0);
    }
    else if (p.state==='dive'){
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
    else if (powerActive && transformT>0){ const k=transformT/0.95, fast=Math.floor(gt*24)%2;
      ctx.save();
      if(k<0.32 && fast){ ctx.filter='grayscale(1) sepia(1) saturate('+(3+(0.32-k)/0.32*5).toFixed(1)+') hue-rotate('+(STONE_HROT[equippedStone]||0)+'deg) brightness(1.2)'; }
      else { ctx.filter = fast ? 'grayscale(1) invert(1) brightness(1.15)' : 'grayscale(1) brightness(1.7) contrast(1.25)'; }
      drawPoweredFrame(sx); ctx.filter='none'; ctx.restore(); } 
    else if (!(p.invHurt>0 && !powerActive && Math.floor(gt*16)%2===0)){
      if(powerActive&&equippedStone==='sapphire'&&transformT<=0){ for(let gi=0;gi<sapTrail.length;gi++){ const g=sapTrail[gi]; ctx.save(); ctx.globalAlpha=0.08+0.26*(gi/Math.max(1,sapTrail.length)); drawCharSprite(chosen,g.st,g.fi,g.x-camX,g.y,g.f,1,0); ctx.restore(); } }
      const _spec=(powerActive&&equippedStone==='amethyst'&&transformT<=0), _obs=(powerActive&&equippedStone==='obsidian'&&transformT<=0), _top=(powerActive&&equippedStone==='topaz'&&transformT<=0), _chaos=(powerActive&&equippedStone==='chaos'&&transformT<=0), _upcast=(p.castT>0 && p.castUp && !!prayImg());
      let _skip=false; ctx.save();
      if(_upcast){ _skip=true; const fast=Math.floor(gt*24)%2; ctx.filter= fast ? 'grayscale(1) invert(1) brightness(1.15)' : 'grayscale(1) brightness(1.7) contrast(1.25)'; drawPrayFrame(sx,p.y,p.facing,isDing(chosen)?1.05:0.82,isDing(chosen)?-1:2,true); ctx.filter='none'; }
      if(_spec){ ctx.globalAlpha=0.42+0.12*Math.sin(gt*6); }
      if(_obs){ if(Math.random()<0.12){ _skip=true; } else { ctx.globalAlpha=0.45+0.5*Math.random(); ctx.filter='invert(1) brightness(1.2) drop-shadow(0 0 6px rgba(150,90,255,0.85))'; if(Math.random()<0.45) ctx.translate((Math.random()-0.5)*6,0); } }
      if(_top){ const r=Math.random(); ctx.filter = r<0.08 ? 'brightness(0) invert(1)' : (r<0.20 ? 'brightness(1.8) saturate(2.2) sepia(0.5) hue-rotate(-8deg)' : 'brightness(1.18) saturate(1.5)'); }
      if(_chaos){ _skip=true; const cf=curFrame();
        if(chaosSpawnN>0 && prayImg()){ const fast=Math.floor(gt*24)%2; ctx.save(); ctx.filter= fast ? 'grayscale(1) invert(1) brightness(1.15)' : 'grayscale(1) brightness(1.7) contrast(1.25)'; drawPrayFrame(sx,p.y,p.facing); ctx.filter='none'; ctx.restore(); }
        else {
        const gl=chaosGlitchT>0, jx=gl?(Math.random()-0.5)*9:0, spd=0.8, bandY=(p.y-94)+((gt*spd)%1)*100, bandH=24;
        // base inverted sprite with the ripple band CUT OUT (distorted slices replace those rows)
        ctx.save(); ctx.beginPath(); ctx.rect(-9999,-9999,19998,19998); ctx.rect(sx-56+jx, bandY, 112, bandH); ctx.clip('evenodd'); ctx.filter='invert(1)'; drawCharSprite(chosen,p.state,cf,sx+jx,p.y,p.facing,1,0); ctx.restore();
        // glitchy distortion ripple: thin slices shoved + stretched sideways along the wave (warps the body)
        const NS=7; for(let k=0;k<NS;k++){ const yy=bandY+k*(bandH/NS), hh=bandH/NS+1, env=Math.sin((k+0.5)/NS*Math.PI),
            dxs=(Math.sin(gt*24+k*1.9)*12+(Math.random()-0.5)*8)*env, sxk=1+(Math.random()<0.32?Math.random()*0.7:0);
          ctx.save(); ctx.beginPath(); ctx.rect(sx-58, yy, 116, hh); ctx.clip();
          ctx.translate(sx+jx,0); ctx.scale(sxk,1); ctx.translate(-(sx+jx),0);
          ctx.filter=Math.random()<0.3?'invert(1) brightness(1.7)':'invert(1)';
          drawCharSprite(chosen,p.state,cf,sx+jx+dxs,p.y,p.facing,1,0); ctx.restore(); }
        // blast glitch burst on each launch
        if(gl){ for(let gI=0;gI<3;gI++){ const sy=p.y-92+Math.random()*86, sh=5+Math.random()*13, dx=(Math.random()-0.5)*18;
          ctx.save(); ctx.beginPath(); ctx.rect(sx-56, sy, 112, sh); ctx.clip(); ctx.filter='invert(1) saturate(3) hue-rotate('+((Math.random()*300)|0)+'deg)'; ctx.globalAlpha=0.85; drawCharSprite(chosen,p.state,cf,sx+dx,p.y,p.facing,1,0); ctx.restore(); } } } }
      if(!_skip) drawCharSprite(chosen, p.state, curFrame(), sx, p.y, p.facing, 1, (p.invHurt>0 && !powerActive)?0.45:0);
      ctx.filter='none'; ctx.restore();
    }
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
  const dAnim=p.deathHurt?'hurt':'kneel';
  const dFrame=p.deathHurt?Math.min(SPR.chars[chosen].hurt.frames-1, Math.floor(p.deadT*FPS.hurt)):curFrame();
  if (p.deathHurt){ renderCrushDeath(sx, gt); return; }
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
    drawGlitchAnim(chosen,dAnim,dFrame, sx, p.y, p.facing, 1, gi);
    ctx.globalAlpha=1;
  } else if (t<=1.7){
    const k=(t-1.0)/0.7, s=Math.max(0.05,1-k);
    const cxp=sx+(pcx-sx)*k, fy=p.y+((pcy+58*s)-p.y)*k;
    ctx.globalAlpha=Math.max(0,1-k*0.9)*fl;
    drawGlitchAnim(chosen,dAnim,dFrame, cxp, fy, p.facing, s, gi);
    ctx.globalAlpha=1;
  }
}
function draw(){
  let _shx=0,_shy=0; if(shakeT>0){ const m=shakeMag*Math.min(1,shakeT/0.13); _shx=(Math.random()*2-1)*m; _shy=(Math.random()*2-1)*m; }
  ctx.setTransform(RS,0,0,RS,_shx*RS,_shy*RS);
  if (ST.theme==='crypt') caveBG(); else if (ST.theme==='plains') etherealBG(); else if (ST.theme==='witch') witchBG(); else if (ST.theme==='harbor') harborBG(); else if (ST.theme==='spire') spireBG(); else if (ST.theme==='charnel') charnelBG(); else if (ST.theme==='rift') riftBG(); else if (ST.theme==='castle') castleBG(); else { skyBG(); drawFence(); }
  drawBackgrounds();   // parallax background image layers (cover the base when present)
  vignette();
  ctx.save(); ctx.translate(0,-camY);
  drawSpikes();
  drawWorldProps();
  drawChecks();
  drawRocks();
  drawVolleys();
  drawLoots();
  for (const z of zombies) drawZombie(z);
  for (const b of bats) drawBat(b);
  drawZbits();
  drawGoal();
  for (const s of souls){
    if (s.got&&s.pop>=1) continue; const sx=pxf(s.x,1); if(sx<-60||sx>W+60) continue;
    let alpha=1,sc=1; if(s.got){ alpha=Math.max(0,1-s.pop); sc=1+0.7*s.pop; }
    drawSoulFx(sx, s.y, 13*sc, alpha, s.ph*19, s.val);
  }
  drawFluoriteAura('back');
  drawRubyBackOrbs();
  drawChaosBack();
  drawPlayerLayer();
  drawSlamFx();
  drawPower();
  drawFluoriteAura('front');
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
  drawCurses();
  for (const bo of bolts){
    if (bo.dead) continue;
    const bx=bo.x-camX; if(bx<-60||bx>W+60) continue;
    if (bo.kind==='void'){
      const k=Math.min(1,bo.t*4), rx=Math.max(7,34*k), ry=rx*0.72;
      ctx.save(); ctx.translate(bx,bo.y);
      // blurry white-purple glowing border (outer)
      ctx.save(); ctx.scale(1,ry/rx); const og=ctx.createRadialGradient(0,0,rx*0.55,0,0,rx*1.5); og.addColorStop(0,'rgba(235,225,255,0)'); og.addColorStop(0.78,'rgba(235,225,255,0)'); og.addColorStop(0.9,'rgba(240,232,255,0.5)'); og.addColorStop(1,'rgba(190,160,255,0)'); ctx.fillStyle=og; ctx.beginPath(); ctx.arc(0,0,rx*1.5,0,7); ctx.fill(); ctx.restore();
      // deep portal interior (clipped to the oval) with swarming star speckles
      ctx.save(); ctx.scale(1,ry/rx); ctx.beginPath(); ctx.arc(0,0,rx,0,7); ctx.clip();
      const ig=ctx.createRadialGradient(0,0,1,0,0,rx); ig.addColorStop(0,'#06000e'); ig.addColorStop(0.62,'#140026'); ig.addColorStop(1,'#23103a'); ctx.fillStyle=ig; ctx.fillRect(-rx,-rx,rx*2,rx*2);
      for(let s=0;s<26;s++){ const ang=s*2.39996+Math.sin(gt*3.0+s*1.7)*1.8+gt*2.4, rad=(0.12+0.86*((s*0.043+gt*0.55)%1))*rx, px=Math.cos(ang)*rad, py=Math.sin(ang)*rad, tw=0.35+0.65*Math.abs(Math.sin(gt*11+s*2.1)); ctx.fillStyle='rgba(232,214,255,'+tw.toFixed(2)+')'; ctx.beginPath(); ctx.arc(px,py,Math.max(0.5,0.7+0.9*tw),0,7); ctx.fill(); }
      ctx.restore();
      // crisp glowing inner rim (blurred)
      ctx.save(); ctx.scale(1,ry/rx); ctx.strokeStyle='rgba(245,238,255,0.65)'; ctx.lineWidth=2.4; ctx.shadowColor='rgba(220,205,255,0.95)'; ctx.shadowBlur=9; ctx.beginPath(); ctx.arc(0,0,rx,0,7); ctx.stroke(); ctx.restore();
      // pulsing purple glow rings around the maw
      { const pl=0.5+0.5*Math.sin(gt*5); ctx.save(); ctx.scale(1,ry/rx); ctx.shadowColor='rgba(150,70,255,0.95)'; ctx.shadowBlur=8+12*pl; ctx.lineWidth=2+1.6*pl;
        ctx.strokeStyle='rgba(176,107,255,'+(0.28+0.5*pl).toFixed(2)+')'; ctx.beginPath(); ctx.arc(0,0,Math.max(1,rx*1.12),0,7); ctx.stroke();
        ctx.strokeStyle='rgba(150,80,255,'+(0.16+0.34*pl).toFixed(2)+')'; ctx.beginPath(); ctx.arc(0,0,Math.max(1,rx*1.32),0,7); ctx.stroke(); ctx.restore(); }
      ctx.restore();
      continue;
    }
    if (bo.kind==='prism'){
      const hue=((gt*240 + (bo.ph||0)*57)%360);
      for(let g2=2;g2>=0;g2--){ const gx2=bx-Math.sign(bo.vx)*g2*10, gy2=bo.y-Math.sign(bo.vy||0)*g2*10, ga=[0.95,0.5,0.22][g2], r=[8,6,4][g2];
        ctx.fillStyle='hsla('+((hue+g2*30)%360)+',100%,'+(70-g2*6)+'%,'+ga+')'; ctx.beginPath(); ctx.arc(gx2,gy2,r,0,7); ctx.fill(); }
      ctx.fillStyle='rgba(255,255,255,'+(0.7+0.3*Math.sin(gt*40)).toFixed(2)+')'; ctx.beginPath(); ctx.arc(bx,bo.y,2.4,0,7); ctx.fill();
      continue;
    }
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
    if (bo.kind==='chaosshard'){
      const img=CHAOS_FRAGS[bo.v||0], ang=Math.atan2(bo.vy||0,bo.vx);
      if(img&&img.complete&&img.naturalWidth){ const h=28*(bo.scl||1), w=h*img.naturalWidth/img.naturalHeight;
        ctx.save(); ctx.translate(bx,bo.y); ctx.rotate(ang); if(bo.vx<0) ctx.scale(1,-1); drawGlitchShard(img,w,h,(bo.v||0)*1.3+bo.t); ctx.restore(); }
      if(Math.random()<0.55) zbits.push({x:bo.x,y:bo.y,vx:(Math.random()-0.5)*46,vy:(Math.random()-0.5)*46,sz:1+Math.random()*1.7,life:0.2+Math.random()*0.26,t:0,c:['#9fb6ff','#7b5cff','#bfe0ff','#ffffff'][(Math.random()*4)|0]});
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
  for (const zf of zapFx){ const ix=zf.x-camX; if(ix<-100||ix>W+100) continue; const k=zf.t/0.16, rr=20+96*k, a=1-k;
    ctx.save(); ctx.globalCompositeOperation='lighter';
    const fg=ctx.createRadialGradient(ix,zf.y,1,ix,zf.y,rr); fg.addColorStop(0,'rgba(255,255,255,'+(0.95*a).toFixed(2)+')'); fg.addColorStop(0.45,'rgba(255,252,215,'+(0.5*a).toFixed(2)+')'); fg.addColorStop(1,'rgba(255,238,120,0)'); ctx.fillStyle=fg; ctx.beginPath(); ctx.arc(ix,zf.y,rr,0,7); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,'+(0.92*a).toFixed(2)+')'; ctx.beginPath(); ctx.arc(ix,zf.y,Math.max(1,16*(1-k)),0,7); ctx.fill();
    ctx.restore(); }
  if(p.barrierT>0){ const bx2=p.x-camX, by2=p.y-48, k=Math.max(0,p.barrierT/0.4), rr=28+12*(1-k);
    ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.strokeStyle='rgba(255,180,90,'+(0.75*k).toFixed(2)+')'; ctx.lineWidth=2.5; ctx.shadowColor='rgba(255,150,60,0.9)'; ctx.shadowBlur=10;
    ctx.beginPath(); for(let a=0;a<=6;a++){ const an=a/6*6.283+gt*0.5, px=bx2+Math.cos(an)*rr, py=by2+Math.sin(an)*rr*1.18; if(a===0)ctx.moveTo(px,py); else ctx.lineTo(px,py); } ctx.stroke();
    const fg=ctx.createRadialGradient(bx2,by2,rr*0.3,bx2,by2,rr*1.2); fg.addColorStop(0,'rgba(255,170,80,0)'); fg.addColorStop(0.7,'rgba(255,170,80,'+(0.12*k).toFixed(2)+')'); fg.addColorStop(1,'rgba(255,150,60,0)'); ctx.fillStyle=fg; ctx.beginPath(); ctx.arc(bx2,by2,rr*1.2,0,7); ctx.fill();
    ctx.restore(); }
  for (const z of zombies) drawZHP(z);
  ctx.restore();
  if (WORLDH>H){ // light dies as you descend
    const dk=Math.max(0,Math.min(1,camY/(WORLDH-H)))*0.40;
    ctx.fillStyle='rgba(2,1,6,'+dk.toFixed(2)+')'; ctx.fillRect(0,0,W,H);
  }
  drawForegrounds();   // foreground occluder layers (player passes behind — secret areas)
  // HUD
  drawPlayerHP();
  drawStoneMeter();
  if (!menuOpen() && !p.winning) drawPauseBtn();
  drawProgress();
  ctx.textAlign='right'; ctx.font='bold 15px sans-serif';
  ctx.fillStyle='rgba(20,16,36,.55)'; roundRect(W-184,36,154,24,7); ctx.fill();
  ctx.fillStyle='#eaf6ff';
  ctx.fillText((banked+actScore).toLocaleString('en-US'), W-40, 53);
  ctx.textAlign='left'; ctx.font='10px sans-serif'; ctx.fillStyle='rgba(200,190,255,.7)';
  ctx.fillText('SCORE', W-176, 52);
  ctx.fillStyle='rgba(20,16,36,.5)'; roundRect(W-184,64,154,26,7); ctx.fill();
  ctx.fillStyle='#7fe0ff'; ctx.beginPath(); ctx.arc(W-168,77,8,0,7); ctx.fill();
  ctx.fillStyle='#cfeaff'; ctx.beginPath(); ctx.arc(W-168,77,4.5,0,7); ctx.fill();
  ctx.fillStyle='#eaf6ff'; ctx.font='bold 15px sans-serif'; ctx.textAlign='right'; ctx.fillText(soulCount+' / '+totalOrbVal, W-40, 82); ctx.textAlign='left';
  if (testMode){ const gm=greedMult(); ctx.font='bold 11px sans-serif'; ctx.textAlign='right';
    ctx.fillStyle = gm>1 ? '#5fd8ff' : '#9a93b5';
    ctx.fillText('TEST \u00b7 Greed '+(gm>1?'\u00d72 ON':'OFF')+' \u00b7 banking '+(soulCount*gm)+' soulz', W-40, 99);
    ctx.textAlign='left'; }
  if (p.dead && p.deadT>(p.deathHurt?3.05:2.3)){
    menuPanel('YOU DIED', [
      {label: p.spawn>90?'Rise at Checkpoint':'Try Again', action:()=>{ paused=false; onReset(); }},
      {label:'Restart Act', action:()=>{ paused=false; loadStage(stageIdx); }},
      {label:'Return to Overworld', action:()=>{ enterWorld(true); }},
    ], null, '#e23b3b');
  } else if (p.won){
    drawTally();
  } else if (paused){
    menuPanel('Paused', [
      {label:'Artifacts', action:()=>{ openArtifacts(); }},
      {label:'Return to Overworld', action:()=>{ enterWorld(true); }},
      {label:'Restart Act', action:()=>{ paused=false; loadStage(stageIdx); }},
      {label:'Controller', action:()=>{ ctrlReturn='play'; gpListen=null; mode='controls'; }},
      {label:'Close', action:()=>{ paused=false; }},
    ]);
  }
  drawTitleCard();
  if (fading>0){ ctx.fillStyle='rgba(5,3,12,'+Math.min(1,fading/0.6).toFixed(2)+')'; ctx.fillRect(0,0,W,H); }
  if (fadeIn>0){ ctx.fillStyle='rgba(5,3,12,'+Math.min(1,fadeIn/0.5).toFixed(2)+')'; ctx.fillRect(0,0,W,H); }
}
function drawTitle(){
  ctx.setTransform(RS,0,0,RS,0,0);
  camX=0;
  // full-screen key art (Vivid baked into the asset)
  if (TITLEBG && TITLEBG.complete && TITLEBG.naturalWidth){ ctx.globalAlpha=titleFade; ctx.drawImage(TITLEBG,0,0,W,H); ctx.globalAlpha=1; }
  else { skyBG(); drawFence(); ctx.fillStyle='#1d1730'; ctx.fillRect(0,GROUND,W,H-GROUND); }
  ctx.textAlign='center';
  if(!menuShown && !cryptOpen && !optionsOpen){
    // ATTRACT: high logo + subtitle, above the heroes
    ctx.globalAlpha=titleFade;
    ctx.font="64px Frijole, Creepster, sans-serif";
    ctx.fillStyle='rgba(8,5,16,.85)'; ctx.fillText('cReapZ', W/2+3, 86);
    ctx.fillStyle='#c8fb50'; ctx.fillText('cReapZ', W/2, 83);
    ctx.save(); ctx.shadowColor='#000'; ctx.shadowBlur=7; ctx.font="700 15px Inter, system-ui, sans-serif"; ctx.fillStyle='#e7d3a0'; ctx.fillText('The Myth of Ascension', W/2, 108); ctx.restore();
    ctx.globalAlpha=1;
  } else if(!cryptOpen && !optionsOpen){
    // MENU: bottom scrim + mini corner logo
    const grd=ctx.createLinearGradient(0,H*0.52,0,H); grd.addColorStop(0,'rgba(5,3,12,0)'); grd.addColorStop(1,'rgba(5,3,12,.92)'); ctx.fillStyle=grd; ctx.fillRect(0,H*0.5,W,H*0.5);
    ctx.textAlign='left'; ctx.font="30px Frijole, Creepster, sans-serif"; ctx.fillStyle='rgba(8,5,16,.8)'; ctx.fillText('cReapZ', 24+2, 48+2); ctx.fillStyle='#c8fb50'; ctx.fillText('cReapZ', 24, 48); ctx.textAlign='center';
  }
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
    ctx.fillText('PRESS ANY BUTTON', W/2, 312);
  } else {
    const items=[['Play','play'],['Options','options'],['Soul Box','soulbox']];
    const bw2=150, bh2=44, gap2=16, x0=W/2-(items.length*bw2+(items.length-1)*gap2)/2;
    items.forEach((it,k)=>{
      const bx2=x0+k*(bw2+gap2), by2=378;
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
  const mw=420, mh=404, mx=W/2-mw/2, my=H/2-mh/2;
  ctx.fillStyle='rgba(22,16,44,.97)'; roundRect(mx,my,mw,mh,14); ctx.fill();
  ctx.strokeStyle='rgba(150,140,255,.5)'; ctx.lineWidth=1.5; ctx.stroke();
  ctx.textAlign='center'; ctx.fillStyle='#eae6ff'; ctx.font='bold 24px sans-serif';
  ctx.fillText('OPTIONS', W/2, my+40);
  menuRects=[];
  [['MUSIC','m',musicVol],['SOUND','s',sfxVol]].forEach((row,i)=>{
    const y=my+70+i*48;
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
  [['Export Save','export',2],['Import Save','import',3],['Install App','install',4],['Controller','controller',5]].forEach((row,k)=>{
    const y=my+162+k*40;
    const hot=(optSel===row[2]);
    ctx.fillStyle=hot?'rgba(200,251,80,.16)':'rgba(155,140,255,.16)'; roundRect(mx+60,y,mw-120,33,9); ctx.fill();
    ctx.strokeStyle=hot?'#c8fb50':'rgba(155,140,255,.45)'; ctx.lineWidth=hot?2:1; ctx.stroke();
    ctx.fillStyle='#e8e6f5'; ctx.font='600 14px sans-serif'; ctx.textAlign='center';
    ctx.fillText(row[0], W/2, y+22);
    menuRects.push({x:mx+60,y:y,w:mw-120,h:33,action:row[1]});
  });
  if (optMsg){ ctx.fillStyle='#7fe0ff'; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText(optMsg, W/2, my+mh-44); }
  const by3=my+mh-30;
  ctx.fillStyle=(optSel===6)?'rgba(200,251,80,.16)':'rgba(155,140,255,.16)'; roundRect(W/2-80,by3-12,160,34,10); ctx.fill();
  ctx.strokeStyle=(optSel===6)?'#c8fb50':'rgba(155,140,255,.45)'; ctx.lineWidth=(optSel===6)?2:1; ctx.stroke();
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
  else if (a==='soulbox'){ openSoulBox(); }
  else if (a==='close'){ optionsOpen=false; cryptOpen=false; optMsg=''; }
  else if (a==='export'){ exportSave(); }
  else if (a==='import'){ importSave(); }
  else if (a==='install'){ installApp(); }
  else if (a==='controller'){ ctrlReturn='title'; gpListen=null; mode='controls'; }
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
  if (loaded>=total && titleReady){
    const pu=0.5+0.5*Math.sin(gt*3.5);
    ctx.fillStyle='rgba(200,251,80,'+(0.4+0.6*pu).toFixed(2)+')';
    ctx.fillText('TAP TO BEGIN', W/2, by2+46);
  } else if (loaded>=total){
    ctx.fillStyle='#9b8cff'; ctx.fillText('preparing audio\u2026', W/2, by2+44);
  } else {
    ctx.fillText(Math.round(pct*100)+'%', W/2, by2+44);
  }
  ctx.textAlign='left';
  return;
  ctx.fillStyle='#0d0b1a_unused'; ctx.fillRect(0,0,W,H);
  ctx.fillStyle='#9b8cff'; ctx.font='18px sans-serif'; ctx.textAlign='center'; ctx.fillText('Loading... '+loaded+'/'+total, W/2, H/2); ctx.textAlign='left';
}
try{
  audioInit();                                   // create the (suspended) AudioContext at load so the first tap can unlock it on iOS
  ['sfx_msel','sfx_mtog'].forEach(loadSfx);       // warm menu SFX
  Promise.resolve(getMusicBuf('title')).then(()=>{ titleReady=true; }).catch(()=>{ titleReady=true; });  // fetch+decode title music before the menu
  setTimeout(()=>{ titleReady=true; }, 9000);     // safety: never block the load screen forever
}catch(e){ titleReady=true; }
/* ===================== SOUL BOX (in-game jukebox) ===================== */
const SB_BUILTIN=[
  ['title','Title Theme','Main Menu'],
  ['act1','Cemetery — Act I','cReapY Cemetery'],
  ['act2','Cemetery — Act II','cReapY Cemetery'],
  ['crypt1','Crypt Depths — I','Crypt Depths'],
  ['crypt2','Crypt Depths — II','Crypt Depths'],
  ['ethereal1','Ethereal Plains — I','Ethereal Plains'],
  ['ethereal2','Ethereal Plains — II','Ethereal Plains'],
];
let SB_TRACKS=[], sbIdx=0, sbPlaying=false, sbMode='soul', sbRepeat='all', sbShuffle=false;
let sbSrc=null, sbAnalyser=null, sbGain=null, sbVol=0.85, sbStartT=0, sbOffset=0, sbDur=0, sbRAF=0, sbOpen=false, sbToken=0;
let sbData=null, sbBuilt=false, sbBars=[], sbFill=null, sbTimeCur=null, sbTimeTot=null;
let sbSoulCv=null, sbSoulCtx=null, sbDPR=1, sbMotes=[], sbRings=[], sbBeatAvg=0, sbHueRot=0;
function sbFmt(s){ s=Math.max(0,Math.floor(s||0)); return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); }
function sbIco(n){
  const s='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">';
  const P={
    play:'<polygon points="6 4 20 12 6 20" fill="currentColor" stroke="none"/>',
    pause:'<rect x="6" y="5" width="4" height="14" rx="1.2" fill="currentColor" stroke="none"/><rect x="14" y="5" width="4" height="14" rx="1.2" fill="currentColor" stroke="none"/>',
    back:'<polygon points="19 5 9 12 19 19" fill="currentColor" stroke="none"/><rect x="5" y="5" width="2.4" height="14" rx="1" fill="currentColor" stroke="none"/>',
    fwd:'<polygon points="5 5 15 12 5 19" fill="currentColor" stroke="none"/><rect x="16.6" y="5" width="2.4" height="14" rx="1" fill="currentColor" stroke="none"/>',
    shuffle:'<path d="M16 3h5v5"/><path d="M4 20 21 3"/><path d="M21 16v5h-5"/><path d="M15 15l6 6"/><path d="M4 4l5 5"/>',
    repeat:'<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
    repeat1:'<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/><circle cx="12" cy="12" r="3.4" fill="var(--sb-bg)" stroke="none"/><text x="12" y="14.6" font-size="7" font-weight="700" text-anchor="middle" fill="currentColor" stroke="none">1</text>',
    vol:'<polygon points="11 5 6 9 2 9 2 15 6 15 11 19" fill="currentColor" stroke="none"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a9 9 0 0 1 0 14"/>',
    vollow:'<polygon points="11 5 6 9 2 9 2 15 6 15 11 19" fill="currentColor" stroke="none"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/>',
    x:'<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    soul:'<path d="M12 2.5l1.9 5L19 9l-5.1 1.5L12 15.5l-1.9-5L5 9l5.1-1.5z" fill="currentColor" stroke="none"/><circle cx="18.5" cy="17.5" r="1.5" fill="currentColor" stroke="none"/>',
    disc:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none"/><path d="M12 3a9 9 0 0 1 0 18" opacity=".45"/>',
    cass:'<rect x="2" y="5" width="20" height="14" rx="2.5"/><circle cx="8" cy="12" r="2.2"/><circle cx="16" cy="12" r="2.2"/><path d="M8 16.5h8"/>',
    note:'<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="2.6" fill="currentColor" stroke="none"/><circle cx="20" cy="16" r="2.6" fill="currentColor" stroke="none"/>'
  };
  return s+(P[n]||'')+'</svg>';
}
const SB_CSS=`
#soulbox{position:fixed;inset:0;z-index:400;display:none;align-items:center;justify-content:center;
  --sb-bg:#0a0814;--sb-panel:#15112a;--sb-line:#2c2350;--sb-lime:#c8fb50;--sb-violet:#7b5cff;--sb-viob:#9b8cff;--sb-ink:#ece9ff;--sb-dim:#9b93c4;
  background:radial-gradient(120% 80% at 50% -10%, #221a4a 0%, var(--sb-bg) 55%),var(--sb-bg);
  font-family:system-ui,-apple-system,sans-serif;color:var(--sb-ink);
  padding:max(12px,env(safe-area-inset-top)) max(12px,env(safe-area-inset-right)) max(12px,env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left));}
#soulbox.open{display:flex}
#soulbox *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
#soulbox .sb-card{width:100%;max-width:440px;max-height:100%;overflow:hidden;background:linear-gradient(180deg,var(--sb-panel),#100c22);
  border:1px solid var(--sb-line);border-radius:24px;position:relative;box-shadow:0 30px 80px rgba(0,0,0,.6);display:flex;flex-direction:column}
#soulbox .sb-head{padding:14px 18px 4px;text-align:center;position:relative;flex:none}
#soulbox .sb-x{position:absolute;right:12px;top:12px;width:34px;height:34px;border-radius:11px;display:grid;place-items:center;background:#1d1838;border:1px solid var(--sb-line);color:var(--sb-ink);cursor:pointer}
#soulbox .sb-x svg{width:18px;height:18px}
#soulbox .sb-brand{font-size:10px;letter-spacing:3px;color:var(--sb-lime);font-weight:700;opacity:.85}
#soulbox .sb-title{font-family:Frijole,Creepster,serif;font-size:26px;line-height:1;margin:3px 0 2px;color:#fff;text-shadow:0 0 22px rgba(123,92,255,.4)}
#soulbox .sb-sub{font-size:9px;letter-spacing:2px;color:var(--sb-dim);font-weight:600}
#soulbox .sb-body{overflow-y:auto;padding-bottom:6px}
#soulbox .sb-modes{display:flex;gap:6px;justify-content:center;margin:8px 14px 0}
#soulbox .sb-mode{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;padding:7px 4px;border-radius:12px;cursor:pointer;background:#1a1533;border:1px solid var(--sb-line);color:var(--sb-dim);transition:.15s}
#soulbox .sb-mode svg{width:19px;height:19px}
#soulbox .sb-mode span{font-size:9px;letter-spacing:1px;font-weight:700}
#soulbox .sb-mode.on{border-color:var(--sb-lime);color:var(--sb-lime);background:#1f2616;box-shadow:0 0 14px rgba(200,251,80,.18)}
#soulbox .sb-mode:active{transform:scale(.96)}
#soulbox .sb-stage{position:relative;height:200px;margin:10px 14px 0;border-radius:18px;overflow:hidden;background:radial-gradient(80% 90% at 50% 30%, #241a52 0%, #120d28 70%);border:1px solid var(--sb-line)}
#soulbox .sb-eq{position:absolute;inset:0;display:flex;align-items:flex-end;justify-content:center;gap:4px;padding:0 14px;z-index:1}
#soulbox .sb-eq i{width:7px;border-radius:4px 4px 0 0;background:linear-gradient(180deg,var(--sb-lime),#5cc0ff 55%,var(--sb-violet));box-shadow:0 0 8px rgba(200,251,80,.4);opacity:.55;height:10%;transition:height .07s linear}
#soulbox .sb-soulcv{position:absolute;inset:0;width:100%;height:100%;z-index:2;display:none;pointer-events:none}
#soulbox .sb-viz{position:absolute;left:50%;top:42%;transform:translate(-50%,-50%);z-index:2;display:none}
#soulbox .sb-viz.show{display:block}
#soulbox .sb-vinyl{width:158px;height:158px;border-radius:50%;position:relative;animation:sbspin 3.4s linear infinite;background:repeating-radial-gradient(circle,#0c0c15 0 2px,#17141f 2px 4px);box-shadow:0 0 34px rgba(123,92,255,.4),inset 0 0 46px #000,0 0 0 4px #0a0a10}
#soulbox .sb-vinyl::before{content:"";position:absolute;inset:33%;border-radius:50%;background:radial-gradient(circle,var(--sb-lime) 0 60%,#92cf2e);box-shadow:0 0 14px rgba(200,251,80,.5)}
#soulbox .sb-vinyl::after{content:"";position:absolute;left:50%;top:50%;width:9px;height:9px;border-radius:50%;background:#0a0814;transform:translate(-50%,-50%)}
@keyframes sbspin{to{transform:rotate(360deg)}}
#soulbox .sb-cass{width:196px;height:120px;border-radius:14px;position:relative;background:linear-gradient(160deg,#262049,#15112a);border:1px solid var(--sb-line);box-shadow:0 0 26px rgba(123,92,255,.3)}
#soulbox .sb-cass .strip{position:absolute;left:14px;right:14px;top:11px;height:26px;border-radius:6px;background:#0e0b1d;border:1px solid var(--sb-line);display:flex;align-items:center;justify-content:center}
#soulbox .sb-cass .strip b{font-size:10px;letter-spacing:2px;color:var(--sb-lime)}
#soulbox .sb-cass .win{position:absolute;left:22px;right:22px;bottom:16px;height:48px;border-radius:8px;background:#0c0a18;border:1px solid var(--sb-line);display:flex;align-items:center;justify-content:space-around}
#soulbox .sb-reel{width:38px;height:38px;border-radius:50%;border:3px solid #2c2350;position:relative;background:radial-gradient(circle,#1b1636 38%,#0e0b1d 40%);animation:sbspin 1.5s linear infinite}
#soulbox .sb-reel::before{content:"";position:absolute;inset:7px;border-radius:50%;border:2px dashed var(--sb-viob)}
#soulbox .sb-now{position:absolute;left:0;right:0;bottom:10px;text-align:center;padding:0 16px;z-index:3;text-shadow:0 1px 12px rgba(0,0,0,.85)}
#soulbox .sb-nl{font-size:9px;letter-spacing:2px;color:var(--sb-lime);font-weight:700;opacity:.85}
#soulbox .sb-nt{font-size:16px;font-weight:700;color:#fff;margin-top:2px}
#soulbox .sb-nz{font-size:11px;font-weight:600;color:var(--sb-viob);margin-top:1px}
#soulbox .sb-prog{margin:13px 18px 0;display:flex;align-items:center;gap:10px}
#soulbox .sb-time{font-size:10px;font-weight:600;color:var(--sb-dim);min-width:30px;text-align:center}
#soulbox .sb-track{flex:1;height:7px;border-radius:7px;background:#241d44;position:relative;cursor:pointer}
#soulbox .sb-fillwrap{position:absolute;inset:0;border-radius:7px;overflow:hidden}
#soulbox .sb-fill{position:absolute;left:0;top:0;bottom:0;width:0;border-radius:7px;background:linear-gradient(90deg,var(--sb-violet),var(--sb-lime));box-shadow:0 0 10px rgba(200,251,80,.5)}
#soulbox .sb-ctrls{display:flex;align-items:center;justify-content:center;gap:15px;margin:15px 0 4px}
#soulbox .sb-btn{width:46px;height:46px;border-radius:14px;display:grid;place-items:center;cursor:pointer;background:#1d1838;border:1px solid var(--sb-line);color:var(--sb-ink);transition:.12s}
#soulbox .sb-btn svg{width:20px;height:20px}
#soulbox .sb-btn:active{transform:scale(.9)}
#soulbox .sb-btn.on{border-color:var(--sb-lime);color:var(--sb-lime);background:#1f2a16;box-shadow:0 0 14px rgba(200,251,80,.25)}
#soulbox .sb-play{width:64px;height:64px;border-radius:20px;background:linear-gradient(180deg,var(--sb-lime),#92cf2e);color:#10210a;border:none;box-shadow:0 8px 26px rgba(200,251,80,.4)}
#soulbox .sb-play svg{width:25px;height:25px}
#soulbox .sb-foot{display:flex;align-items:center;gap:10px;padding:4px 20px 8px;color:var(--sb-dim)}
#soulbox .sb-foot svg{width:18px;height:18px;flex:none}
#soulbox .sb-vol{flex:1;height:6px;border-radius:6px;background:#241d44;position:relative;cursor:pointer}
#soulbox .sb-volfill{position:absolute;left:0;top:0;bottom:0;border-radius:6px;background:linear-gradient(90deg,var(--sb-violet),var(--sb-lime))}
#soulbox .sb-lh{display:flex;align-items:center;justify-content:space-between;margin:8px 20px 6px}
#soulbox .sb-lh .lt{font-size:11px;letter-spacing:1.5px;color:var(--sb-dim);font-weight:700}
#soulbox .sb-lh .cnt{font-size:10px;font-weight:700;color:var(--sb-violet);background:#211a44;border-radius:8px;padding:2px 8px}
#soulbox .sb-list{margin:0 10px 8px;max-height:30vh;overflow-y:auto}
#soulbox .sb-row{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:12px;cursor:pointer;transition:.1s}
#soulbox .sb-row+.sb-row{margin-top:3px}
#soulbox .sb-row.active{background:linear-gradient(90deg,#1f2a16,#1a1633);border:1px solid rgba(200,251,80,.25)}
#soulbox .sb-dot{width:30px;height:30px;border-radius:9px;flex:none;display:grid;place-items:center;background:#241d44;color:var(--sb-viob)}
#soulbox .sb-dot svg{width:15px;height:15px}
#soulbox .sb-row.active .sb-dot{background:var(--sb-lime);color:#10210a}
#soulbox .sb-meta{flex:1;min-width:0}
#soulbox .sb-tn{font-size:14px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#soulbox .sb-tz{font-size:11px;font-weight:600;color:var(--sb-dim);margin-top:1px}
#soulbox .sb-dur{font-size:11px;font-weight:600;color:var(--sb-dim)}
#soulbox .sb-miniq{display:none;gap:2px;align-items:flex-end;height:15px}
#soulbox .sb-row.active .sb-miniq{display:flex}
#soulbox .sb-row.active .sb-dur{display:none}
#soulbox .sb-miniq i{width:3px;background:var(--sb-lime);border-radius:2px;animation:sbmq .7s ease-in-out infinite}
#soulbox .sb-miniq i:nth-child(2){animation-delay:.18s}#soulbox .sb-miniq i:nth-child(3){animation-delay:.36s}
@keyframes sbmq{0%,100%{height:4px}50%{height:14px}}
#soulbox.sb-paused .sb-vinyl,#soulbox.sb-paused .sb-reel{animation-play-state:paused}
#soulbox.sb-paused .sb-miniq i{animation-play-state:paused}
 #soulbox .sb-left,#soulbox .sb-right{display:contents}
/* landscape: flex columns; the visualizer flex-grows to fill all vertical space (no dead space, any height) */
@media (orientation:landscape) and (min-width:720px){
  #soulbox{padding:max(8px,env(safe-area-inset-top)) max(10px,env(safe-area-inset-right)) max(8px,env(safe-area-inset-bottom)) max(10px,env(safe-area-inset-left))}
  #soulbox .sb-card{max-width:940px;max-height:100%}
  #soulbox .sb-body{display:flex;gap:12px;overflow:hidden;align-items:stretch;flex:1;min-height:0}
  #soulbox .sb-left{display:flex;flex-direction:column;flex:1.05 1 0;min-height:0;min-width:0}
  #soulbox .sb-right{display:flex;flex-direction:column;flex:.95 1 0;min-height:0;min-width:0}
  #soulbox .sb-modes{margin:6px 0 0 14px}
  #soulbox .sb-stage{flex:1 1 auto;height:auto;min-height:120px;margin:8px 0 0 14px}
  #soulbox .sb-prog{margin:11px 0 0 14px}
  #soulbox .sb-ctrls{margin:11px 0 2px}
  #soulbox .sb-foot{padding:4px 0 8px 14px}
  #soulbox .sb-lh{margin:6px 16px 6px 6px}
  #soulbox .sb-list{flex:1 1 auto;max-height:none;min-height:0;margin:0 6px 4px}
}
/* short landscape (phones): compact head + controls so the stage keeps room */
@media (orientation:landscape) and (max-height:560px){
  #soulbox .sb-head{padding:7px 16px 0}
  #soulbox .sb-title{font-size:19px}#soulbox .sb-brand{font-size:9px}#soulbox .sb-sub{display:none}
  #soulbox .sb-mode{padding:4px}#soulbox .sb-mode svg{width:15px;height:15px}#soulbox .sb-mode span{font-size:8px}
  #soulbox .sb-stage{min-height:96px}
  #soulbox .sb-ctrls{margin:8px 0 2px;gap:12px}
  #soulbox .sb-btn{width:38px;height:38px;border-radius:11px}#soulbox .sb-btn svg{width:17px;height:17px}
  #soulbox .sb-play{width:50px;height:50px;border-radius:15px}#soulbox .sb-play svg{width:21px;height:21px}
  #soulbox .sb-foot{padding:2px 0 6px 14px}
}
`;
function sbBuildTracks(){
  let list=SB_BUILTIN.map(b=>({key:b[0],name:b[1],zone:b[2]}))
    .concat((typeof SB_CUSTOM!=='undefined'?SB_CUSTOM:[]).map(c=>({key:c.key,name:c.name,zone:c.zone||'Bonus Track'})));
  const cfg=(typeof SB_CFG!=='undefined')?SB_CFG:null;
  if(cfg){
    if(cfg.names) list.forEach(t=>{ if(cfg.names[t.key]) t.name=cfg.names[t.key]; });
    if(Array.isArray(cfg.hidden)) list=list.filter(t=>!cfg.hidden.includes(t.key));
    if(Array.isArray(cfg.order)) list.sort((a,b)=>{const ia=cfg.order.indexOf(a.key),ib=cfg.order.indexOf(b.key);return (ia<0?999:ia)-(ib<0?999:ib);});
  }
  return list;
}
function sbInit(){
  if(sbBuilt) return; sbBuilt=true;
  const st=document.createElement('style'); st.textContent=SB_CSS; document.head.appendChild(st);
  const el=document.createElement('div'); el.id='soulbox';
  el.innerHTML=`<div class="sb-card">
    <div class="sb-head">
      <div class="sb-x" id="sbX">${sbIco('x')}</div>
      <div class="sb-brand">cReapZ</div>
      <div class="sb-title">Soul Box</div>
      <div class="sb-sub">EVERY TRACK FROM THE REALM</div>
    </div>
    <div class="sb-body">
      <div class="sb-left">
      <div class="sb-modes" id="sbModes">
        <div class="sb-mode" data-m="soul">${sbIco('soul')}<span>SOUL</span></div>
        <div class="sb-mode" data-m="vinyl">${sbIco('disc')}<span>VINYL</span></div>
        <div class="sb-mode" data-m="cass">${sbIco('cass')}<span>CASSETTE</span></div>
      </div>
      <div class="sb-stage">
        <div class="sb-eq" id="sbEq"></div>
        <canvas class="sb-soulcv" id="sbSoulCv"></canvas>
        <div class="sb-viz" data-v="vinyl"><div class="sb-vinyl"></div></div>
        <div class="sb-viz" data-v="cass"><div class="sb-cass"><div class="strip"><b>SOUL BOX</b></div><div class="win"><div class="sb-reel"></div><div class="sb-reel"></div></div></div></div>
        <div class="sb-now"><div class="sb-nl">NOW PLAYING</div><div class="sb-nt" id="sbName">—</div><div class="sb-nz" id="sbZone"></div></div>
      </div>
      <div class="sb-prog">
        <div class="sb-time" id="sbCur">0:00</div>
        <div class="sb-track" id="sbTrack"><div class="sb-fillwrap"><div class="sb-fill" id="sbFill"></div></div></div>
        <div class="sb-time" id="sbTot">0:00</div>
      </div>
      <div class="sb-ctrls">
        <div class="sb-btn" id="sbShuf">${sbIco('shuffle')}</div>
        <div class="sb-btn" id="sbPrev">${sbIco('back')}</div>
        <button class="sb-btn sb-play" id="sbPlay">${sbIco('play')}</button>
        <div class="sb-btn" id="sbNext">${sbIco('fwd')}</div>
        <div class="sb-btn" id="sbRep">${sbIco('repeat')}</div>
      </div>
      <div class="sb-foot">${sbIco('vollow')}<div class="sb-vol" id="sbVolBar"><div class="sb-volfill" id="sbVolFill"></div></div>${sbIco('vol')}</div>
      </div>
      <div class="sb-right">
      <div class="sb-lh"><div class="lt">TRACK LIST</div><div class="cnt" id="sbCnt"></div></div>
      <div class="sb-list" id="sbList"></div>
      </div>
    </div></div>`;
  document.body.appendChild(el);
  sbFill=el.querySelector('#sbFill'); sbTimeCur=el.querySelector('#sbCur'); sbTimeTot=el.querySelector('#sbTot');
  sbSoulCv=el.querySelector('#sbSoulCv'); sbSoulCtx=sbSoulCv.getContext('2d');
  const eq=el.querySelector('#sbEq'); sbBars=[];
  for(let i=0;i<27;i++){ const b=document.createElement('i'); eq.appendChild(b); sbBars.push(b); }
  try{ const m=localStorage.getItem('creapz_sb_mode'); if(m) sbMode=m; const v=localStorage.getItem('creapz_sb_vol'); if(v!=null) sbVol=Math.max(0,Math.min(1,parseFloat(v))); }catch(e){}
  el.querySelector('#sbX').onclick=closeSoulBox;
  el.querySelector('#sbPlay').onclick=sbTogglePlay;
  el.querySelector('#sbPrev').onclick=()=>{ playSfx('sfx_mtog',0.5); sbPrev(); };
  el.querySelector('#sbNext').onclick=()=>{ playSfx('sfx_mtog',0.5); sbNext(false); };
  el.querySelector('#sbRep').onclick=sbCycleRepeat;
  el.querySelector('#sbShuf').onclick=sbToggleShuffle;
  el.querySelectorAll('.sb-mode').forEach(m=>{ m.onclick=()=>sbSetMode(m.dataset.m); });
  const seek=(ev,bar,fn)=>{ const r=bar.getBoundingClientRect(); const x=(ev.touches?ev.touches[0].clientX:ev.clientX)-r.left; fn(Math.max(0,Math.min(1,x/r.width))); };
  const tr=el.querySelector('#sbTrack'); tr.onpointerdown=e=>{ e.preventDefault(); seek(e,tr,sbSeek); };
  const vb=el.querySelector('#sbVolBar'); const volDrag=e=>{ seek(e,vb,sbSetVol); };
  vb.onpointerdown=e=>{ e.preventDefault(); volDrag(e); vb.setPointerCapture&&vb.setPointerCapture(e.pointerId); vb.onpointermove=volDrag; };
  vb.onpointerup=()=>{ vb.onpointermove=null; };
  window.addEventListener('resize',()=>{ if(sbOpen) sbSizeSoul(); });
  sbSetMode(sbMode); sbUpdRepeat(); sbUpdShuf(); sbUpdVol();
}
function sbSizeSoul(){ if(!sbSoulCv) return; const r=sbSoulCv.getBoundingClientRect(); if(!r.width) return;
  sbDPR=Math.min(2,window.devicePixelRatio||1);
  sbSoulCv.width=Math.round(r.width*sbDPR); sbSoulCv.height=Math.round(r.height*sbDPR);
  sbSoulCtx=sbSoulCv.getContext('2d'); sbSoulCtx.setTransform(sbDPR,0,0,sbDPR,0,0);
}
function sbAudioInit(){
  if(!AC) audioInit();
  if(AC && !sbAnalyser){
    sbAnalyser=AC.createAnalyser(); sbAnalyser.fftSize=128; sbAnalyser.smoothingTimeConstant=0.72;
    sbGain=AC.createGain(); sbGain.gain.value=sbVol;
    sbAnalyser.connect(sbGain); sbGain.connect(AC.destination);
    sbData=new Uint8Array(sbAnalyser.frequencyBinCount);
  }
}
function sbStop(){ if(sbSrc){ try{ sbSrc.onended=null; sbSrc.stop(); }catch(e){} sbSrc=null; } }
function sbCurTime(){ return sbPlaying && AC ? Math.min(sbDur||1e9, sbOffset+(AC.currentTime-sbStartT)) : sbOffset; }
function sbStartFrom(off){
  sbAudioInit(); if(!AC) return;
  const t=SB_TRACKS[sbIdx]; if(!t) return;
  sbStop(); const tok=++sbToken;
  sbSyncUI();
  getMusicBuf(t.key).then(buf=>{
    if(tok!==sbToken || !sbOpen) return;
    if(!buf){ sbPlaying=false; sbSyncUI(); return; }
    const src=AC.createBufferSource(); src.buffer=buf; sbDur=buf.duration;
    src.loop=(sbRepeat==='one');
    src.connect(sbAnalyser);
    src.onended=()=>{ if(src!==sbSrc||tok!==sbToken) return; if(sbRepeat==='one') return; sbNext(true); };
    try{ if(AC.state==='suspended') AC.resume(); }catch(e){}
    src.start(0, Math.max(0,Math.min(off, buf.duration-0.05)));
    sbSrc=src; sbStartT=AC.currentTime; sbOffset=off; sbPlaying=true; sbSyncUI();
  });
}
function sbPlayIndex(i){ sbIdx=i; sbOffset=0; playSfx('sfx_msel',0.5); sbStartFrom(0); }
function sbTogglePlay(){ if(sbPlaying){ sbOffset=sbCurTime(); sbStop(); sbPlaying=false; sbSyncUI(); } else { sbStartFrom(sbOffset); } }
function sbNext(auto){
  if(!SB_TRACKS.length) return;
  if(sbShuffle){ let n=Math.floor(Math.random()*SB_TRACKS.length); if(SB_TRACKS.length>1&&n===sbIdx)n=(n+1)%SB_TRACKS.length; sbIdx=n; }
  else { if(sbIdx>=SB_TRACKS.length-1){ if(auto&&sbRepeat==='off'){ sbPlaying=false; sbStop(); sbOffset=0; sbSyncUI(); return; } sbIdx=0; } else sbIdx++; }
  sbOffset=0; sbStartFrom(0);
}
function sbPrev(){ if(!SB_TRACKS.length) return; if(sbCurTime()>3){ sbOffset=0; sbStartFrom(0); return; } sbIdx=(sbIdx-1+SB_TRACKS.length)%SB_TRACKS.length; sbOffset=0; sbStartFrom(0); }
function sbSeek(frac){ sbOffset=frac*(sbDur||0); if(sbPlaying) sbStartFrom(sbOffset); else { sbFill.style.width=(frac*100)+'%'; sbTimeCur.textContent=sbFmt(sbOffset); } }
function sbCycleRepeat(){ sbRepeat = sbRepeat==='off'?'all':sbRepeat==='all'?'one':'off'; if(sbSrc) sbSrc.loop=(sbRepeat==='one'); playSfx('sfx_mtog',0.6); sbUpdRepeat(); }
function sbToggleShuffle(){ sbShuffle=!sbShuffle; playSfx('sfx_mtog',0.6); sbUpdShuf(); }
function sbSetMode(m){ sbMode=m; try{localStorage.setItem('creapz_sb_mode',m);}catch(e){}
  const el=document.getElementById('soulbox'); if(!el) return;
  el.querySelectorAll('.sb-mode').forEach(x=>x.classList.toggle('on',x.dataset.m===m));
  el.querySelectorAll('.sb-viz').forEach(z=>z.classList.toggle('show',z.dataset.v===m));
  if(sbSoulCv) sbSoulCv.style.display=(m==='soul')?'block':'none';
  if(m==='soul') sbSizeSoul();
  if(m!=='soul') playSfx('sfx_mtog',0.5);
}
function sbSetVol(v){ sbVol=Math.max(0,Math.min(1,v)); if(sbGain) sbGain.gain.value=sbVol; try{localStorage.setItem('creapz_sb_vol',sbVol);}catch(e){} sbUpdVol(); }
function sbUpdVol(){ const f=document.getElementById('sbVolFill'); if(f) f.style.width=(sbVol*100)+'%'; }
function sbUpdRepeat(){ const b=document.getElementById('sbRep'); if(!b) return; b.classList.toggle('on',sbRepeat!=='off'); b.innerHTML=sbIco(sbRepeat==='one'?'repeat1':'repeat'); }
function sbUpdShuf(){ const b=document.getElementById('sbShuf'); if(b) b.classList.toggle('on',sbShuffle); }
function sbRenderList(){
  const list=document.getElementById('sbList'); if(!list) return;
  document.getElementById('sbCnt').textContent=SB_TRACKS.length+' TRACKS';
  list.innerHTML='';
  SB_TRACKS.forEach((t,i)=>{
    const r=document.createElement('div'); r.className='sb-row'+(i===sbIdx?' active':'');
    r.innerHTML=`<div class="sb-dot">${sbIco('note')}</div><div class="sb-meta"><div class="sb-tn">${t.name}</div><div class="sb-tz">${t.zone||''}</div></div><div class="sb-dur"></div><div class="sb-miniq"><i></i><i></i><i></i></div>`;
    r.onclick=()=>sbPlayIndex(i);
    list.appendChild(r);
  });
}
function sbSyncUI(){
  const el=document.getElementById('soulbox'); if(!el) return;
  const t=SB_TRACKS[sbIdx]||{name:'—',zone:''};
  el.querySelector('#sbName').textContent=t.name; el.querySelector('#sbZone').textContent=t.zone||'';
  el.querySelector('#sbPlay').innerHTML=sbIco(sbPlaying?'pause':'play');
  el.classList.toggle('sb-paused',!sbPlaying);
  sbTimeTot.textContent=sbFmt(sbDur);
  el.querySelectorAll('.sb-row').forEach((r,i)=>r.classList.toggle('active',i===sbIdx));
}
function sbDrawSoul(e,bass,treble){
  const cx=sbSoulCtx, cv=sbSoulCv; if(!cx||!cv) return;
  const w=cv.width/sbDPR, h=cv.height/sbDPR; if(!w) return;
  cx.clearRect(0,0,w,h);
  const ox=w/2, oy=h*0.5;
  sbHueRot+=0.01+e*0.05;
  sbBeatAvg=sbBeatAvg*0.9+e*0.1;
  const beat = e>sbBeatAvg*1.28 && e>0.14;
  cx.globalCompositeOperation='lighter';
  const R=20+bass*40+e*16;
  // outer halo
  let g=cx.createRadialGradient(ox,oy,0,ox,oy,R*2.7);
  g.addColorStop(0,'rgba(200,251,80,'+(0.35+e*0.5).toFixed(3)+')');
  g.addColorStop(0.4,'rgba(123,92,255,'+(0.25+e*0.4).toFixed(3)+')');
  g.addColorStop(1,'rgba(40,20,90,0)');
  cx.fillStyle=g; cx.beginPath(); cx.arc(ox,oy,R*2.7,0,6.2832); cx.fill();
  // wavy aura ring
  cx.strokeStyle='rgba(155,140,255,'+(0.25+e*0.45).toFixed(3)+')'; cx.lineWidth=2;
  cx.beginPath();
  for(let a=0;a<=6.2832;a+=0.18){ const wob=1+Math.sin(a*5+sbHueRot*3)*0.10*(0.5+e); const rr=R*1.5*wob; const px=ox+Math.cos(a)*rr, py=oy+Math.sin(a)*rr*0.92; a===0?cx.moveTo(px,py):cx.lineTo(px,py); }
  cx.closePath(); cx.stroke();
  // core
  let c=cx.createRadialGradient(ox,oy-2,0,ox,oy,R*0.95);
  c.addColorStop(0,'rgba(255,255,255,'+(0.9).toFixed(2)+')');
  c.addColorStop(0.45,'rgba(200,251,80,0.92)');
  c.addColorStop(1,'rgba(123,92,255,0)');
  cx.fillStyle=c; cx.beginPath(); cx.arc(ox,oy,R*(1+e*0.25),0,6.2832); cx.fill();
  // spawn rising motes (like in-game souls)
  const spawn = 0.4 + e*3.2 + (beat?7:0);
  let acc=(sbDrawSoul._a=(sbDrawSoul._a||0)+spawn);
  while(acc>=1 && sbMotes.length<150){ acc-=1;
    const a=Math.random()*6.2832, rr=R*(0.3+Math.random()*0.5);
    sbMotes.push({x:ox+Math.cos(a)*rr, y:oy+Math.sin(a)*rr*0.7, vy:-(0.6+Math.random()*1.6)-e*2.0, ph:Math.random()*6.2832, amp:6+Math.random()*10, life:0, max:0.8+Math.random()*0.9, sz:1+Math.random()*2.6, lime:Math.random()<0.55});
  }
  sbDrawSoul._a=acc;
  for(const m of sbMotes){ m.life+=0.016; m.ph+=0.13; m.y+=m.vy; m.vy*=0.985;
    const k=1-m.life/m.max; if(k<=0) continue;
    const x=m.x+Math.sin(m.ph)*m.amp*0.15;
    cx.fillStyle = m.lime?('rgba(210,251,110,'+(k*0.95).toFixed(3)+')'):('rgba(165,150,255,'+(k*0.95).toFixed(3)+')');
    cx.beginPath(); cx.arc(x,m.y,m.sz*(0.5+k*0.7),0,6.2832); cx.fill();
  }
  sbMotes=sbMotes.filter(m=>m.life<m.max && m.y>-12);
  // beat shock rings
  if(beat) sbRings.push({r:R*1.2,life:0});
  for(const rg of sbRings){ rg.life+=0.045; rg.r+=4.5; const k=1-rg.life; if(k<=0) continue;
    cx.strokeStyle='rgba(200,251,80,'+(k*0.5).toFixed(3)+')'; cx.lineWidth=2.2;
    cx.beginPath(); cx.arc(ox,oy,rg.r,0,6.2832); cx.stroke();
  }
  sbRings=sbRings.filter(rg=>rg.life<1);
  cx.globalCompositeOperation='source-over';
}
function sbFrame(){
  if(!sbOpen) return;
  let energy=0,bass=0,treble=0;
  if(sbAnalyser){
    sbAnalyser.getByteFrequencyData(sbData);
    const n=sbBars.length, span=sbData.length-6;
    for(let i=0;i<n;i++){ const bin=2+Math.floor(i/n*span); const v=sbData[bin]/255; sbBars[i].style.height=(6+v*v*150)+'%'; }
    let s=0;for(let i=2;i<26;i++)s+=sbData[i];energy=s/(24*255);
    let b=0;for(let i=1;i<8;i++)b+=sbData[i];bass=b/(7*255);
    let t=0;for(let i=28;i<58;i++)t+=sbData[i];treble=t/(30*255);
  }
  if(sbMode==='soul') sbDrawSoul(sbPlaying?energy:0, sbPlaying?bass:0, sbPlaying?treble:0);
  if(sbDur>0){ const ct=sbCurTime(); sbFill.style.width=Math.min(100,ct/sbDur*100)+'%'; sbTimeCur.textContent=sbFmt(ct); }
  sbRAF=requestAnimationFrame(sbFrame);
}
function openSoulBox(){
  sbInit();
  SB_TRACKS=sbBuildTracks();
  if(sbIdx>=SB_TRACKS.length) sbIdx=0;
  mode='soulbox'; sbOpen=true;
  stopMusic();
  sbRenderList(); sbSyncUI();
  document.getElementById('soulbox').classList.add('open');
  const tc=document.querySelector('.touch'); if(tc) tc.style.display='none';
  sbMotes=[]; sbRings=[]; sbSizeSoul(); setTimeout(sbSizeSoul,60);
  sbAudioInit(); try{ if(AC && AC.state==='suspended') AC.resume(); }catch(e){}
  sbPlayIndex(sbIdx);
  cancelAnimationFrame(sbRAF); sbRAF=requestAnimationFrame(sbFrame);
}
function closeSoulBox(){
  sbOpen=false; sbStop(); sbPlaying=false; cancelAnimationFrame(sbRAF);
  const el=document.getElementById('soulbox'); if(el) el.classList.remove('open');
  mode='title'; menuShown=true; playSfx('sfx_mtog');
  try{ playMusic('title'); }catch(e){}
}
/* =================== END SOUL BOX =================== */

reset(); requestAnimationFrame(loop);
}
main();

/* ====================== Artifacts Screen (ownership-driven DOM overlay) ====================== */
const ART_ORDER=['ruby','topaz','emerald','sapphire','amethyst','fluorite','obsidian','chaos'];
const ART_GLOWC={ruby:'#ff3d5a',topaz:'#ffd24a',emerald:'#3ddc84',sapphire:'#4aa8ff',amethyst:'#b06bff',fluorite:'#6be0d0',obsidian:'#8a7fb0',chaos:'#ff7ad9'};
const ART_POS=[[50.13,13.93],[74.53,25.25],[84.39,49.59],[74.39,73.93],[49.87,83.24],[25.7,74.02],[15.61,49.85],[25.78,25.33]];
const ART_VERTS=[[49.67,14.67],[74.38,24.96],[84.02,49.53],[73.95,73.8],[49.75,82.79],[26.05,74.38],[15.54,49.75],[25.69,25.18]];
const ART_EDGES=[[0,3],[3,6],[6,1],[1,4],[4,7],[7,2],[2,5],[5,0]];
const ART_CTR=[49.84,49.57], ART_SCALE=14, ART_CIRCLE={c:[49.84,49.57],d:22.5,w:1};
const ART_MSLOT={w:26,h:52,pos:[[28.95,51.24],[51.41,51.24],[71.99,51.24]]};
const ART_INFO={
  ruby:{name:'Ruby',zone:'Charnel Peak',power:'Hellfire Aura',desc:'Cloak yourself in burning soulfire — anything that touches you ignites.'},
  topaz:{name:'Topaz',zone:'Crypt Depths',power:'Thunder Rush',desc:'Surge with electric speed, crackling through everything in your path.'},
  emerald:{name:'Emerald',zone:'Witchwood',power:'Verdant Renewal',desc:'Regenerate health and pull loose souls toward you like a magnet.'},
  sapphire:{name:'Sapphire',zone:'Drowned Harbor',power:'Time Frost',desc:'Slow the world to a crawl while you move at full speed.'},
  amethyst:{name:'Amethyst',zone:'cReapY Cemetery',power:'Phantom Veil',desc:'Turn spectral — invincible, phasing clean through hazards.'},
  fluorite:{name:'Fluorite',zone:'Ethereal Plains',power:'Prism Barrage',desc:'Split your soul-bolts into a homing prismatic volley.'},
  obsidian:{name:'Obsidian',zone:'Bell Spire',power:'Void Maw',desc:'Warp your projectile into a void that drags enemies in.'},
  chaos:{name:'Chaos',zone:'The Rift',power:'Wieldable Chaos',desc:'Unpredictable, reality-bending power. Its true effect is unknown…'},
  holy:{name:'The Holy Stone',zone:'Forged from all 8',power:'Reaper Ascension',desc:'The Miracle Stone. Ascend into an unstoppable super-form, master of every soul.'}
};
const ART_MEGADEF=[
  {id:'vigor',name:'Vigor',c:'#ff3d5a',power:'+1 Maximum Life',desc:'A bound heart-soul shattered into six shards. Each shard you reclaim permanently expands your life meter by one.',acq:'Six shards hidden across the realm'},
  {id:'greed',name:'Greed',c:'#5fd8ff',img:'mega_siphon',power:'Double soul value',desc:'Greed feeds on greed — every soul you collect is worth double, your essence swelling twice as fast.',acq:'Hidden in the realm'},
  {id:'discord',name:'Discord',c:'#ffae57',img:'mega_discord',power:'— yet to be unleashed —',desc:'A soul of pure discord, its chaotic power still being forged. What it will do remains unwritten.',acq:'Hidden in the realm'}
];
function artV(){ return (typeof ASSET_VER!=='undefined')?ASSET_VER:'1'; }
function artStoneURL(id){ return './assets/stone_'+id+'.png?v='+artV(); }
function artShade(h,a){ var c=h.replace('#','');var r=parseInt(c.slice(0,2),16)+a,g=parseInt(c.slice(2,4),16)+a,b=parseInt(c.slice(4,6),16)+a;return '#'+[r,g,b].map(function(v){return Math.max(0,Math.min(255,v)).toString(16).padStart(2,'0');}).join(''); }
const ART_CSS=`
#artifacts{position:fixed;inset:0;z-index:380;display:none;align-items:flex-start;justify-content:center;overflow-y:auto;
  --a-gold:#d8b25a;--a-lime:#c8fb50;--a-viob:#9b8cff;--a-ink:#efe9ff;--a-dim:#9a8fc0;
  background:radial-gradient(130% 80% at 50% -8%, #241546 0%, #0a0712 60%),#0a0712;
  font-family:system-ui,-apple-system,sans-serif;color:var(--a-ink);
  padding:max(14px,env(safe-area-inset-top)) 14px max(20px,env(safe-area-inset-bottom))}
#artifacts.open{display:flex}
#artifacts *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
#artifacts .art-screen{width:100%;max-width:460px;animation:artEnter .34s ease both}
@keyframes artEnter{from{opacity:0;transform:translateY(10px) scale(.985)}to{opacity:1;transform:none}}
#artifacts .art-head{display:flex;align-items:center;justify-content:center;position:relative;margin-bottom:4px;height:40px}
#artifacts .art-t{font-family:Frijole,Creepster,serif;font-size:26px;background:linear-gradient(180deg,#fff,#e7d3a0);-webkit-background-clip:text;background-clip:text;color:transparent}
#artifacts .art-brand{position:absolute;left:0;top:10px;font:700 10px system-ui;letter-spacing:3px;color:var(--a-gold);opacity:.8}
#artifacts .art-x{position:absolute;right:0;top:2px;width:36px;height:36px;border-radius:10px;display:grid;place-items:center;background:#1d1640;border:1px solid #33264f;color:var(--a-ink);font-size:18px;cursor:pointer}
#artifacts .art-sec{margin-top:14px}
#artifacts .art-seclbl{display:flex;align-items:center;gap:9px;margin:0 4px 8px}
#artifacts .art-seclbl b{font:700 12px system-ui;letter-spacing:1.5px;color:var(--a-gold)}
#artifacts .art-ln{flex:1;height:1px;background:linear-gradient(90deg,rgba(216,178,90,.5),transparent)}
#artifacts .art-n{font:700 11px system-ui;color:var(--a-viob)}
#artifacts .art-case{position:relative;width:100%;aspect-ratio:1;border-radius:22px;overflow:hidden;background:#0b0716 url(./assets/artifacts_case.png?v=art1) center/cover;box-shadow:0 18px 44px rgba(0,0,0,.55)}
#artifacts .art-bgsvg{position:absolute;inset:0;width:100%;height:100%;z-index:1}
#artifacts .art-elines{filter:drop-shadow(0 0 1px rgba(200,251,80,.5));animation:artEglow 3s ease-in-out infinite}
#artifacts .art-elines line,#artifacts .art-elines circle{stroke:#c8fb50;stroke-linecap:round;fill:none}
@keyframes artEglow{0%,100%{opacity:.6}50%{opacity:.92}}
#artifacts .art-stone{position:absolute;transform:translate(-50%,-50%);z-index:3;cursor:pointer}
#artifacts .art-stone.owned{animation:artBob 3.6s ease-in-out infinite}
@keyframes artBob{0%,100%{transform:translate(-50%,-50%) translateY(0)}50%{transform:translate(-50%,-50%) translateY(-3px)}}
#artifacts .art-simg{position:relative;width:100%;height:100%}
#artifacts .art-simg img{width:100%;height:100%;object-fit:contain;display:block}
#artifacts .art-simg img.lit{filter:drop-shadow(0 3px 6px rgba(0,0,0,.6))}
#artifacts .art-glow{position:absolute;inset:8%;border-radius:50%;filter:blur(11px);opacity:.5;z-index:-1;animation:artPulse 2.8s ease-in-out infinite}
@keyframes artPulse{0%,100%{opacity:.3}50%{opacity:.62}}
#artifacts .art-stone.full .art-glow{inset:-6%;filter:blur(15px);animation:artPulseF 2.8s ease-in-out infinite}
@keyframes artPulseF{0%,100%{opacity:.5}50%{opacity:.82}}
#artifacts .art-shine{position:absolute;inset:0;background:linear-gradient(115deg,transparent 44%,rgba(255,255,255,.85) 50%,transparent 56%);background-size:250% 100%;-webkit-mask-size:contain;mask-size:contain;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;-webkit-mask-position:center;mask-position:center;mix-blend-mode:screen;animation:artShim 2.5s linear infinite;pointer-events:none;opacity:0}
@keyframes artShim{0%{background-position:135% 0;opacity:0}4%{opacity:1}24%{background-position:-35% 0;opacity:1}30%{background-position:-35% 0;opacity:0}100%{background-position:-35% 0;opacity:0}}
#artifacts .art-core{position:absolute;left:49.84%;top:49.57%;transform:translate(-50%,-50%);z-index:4;cursor:pointer;width:16%;aspect-ratio:1;animation:artBob 3.6s ease-in-out infinite;animation-delay:-2.1s}
#artifacts .art-core .art-ring{position:absolute;inset:-22%;border-radius:50%;border:1px solid rgba(216,178,90,.4);animation:artSpin 18s linear infinite}
#artifacts .art-core .art-ring.r2{inset:-40%;border-color:rgba(123,92,255,.3);animation-duration:28s;animation-direction:reverse}
@keyframes artSpin{to{transform:rotate(360deg)}}
#artifacts .art-megacase{position:relative;width:100%;aspect-ratio:3.018;border-radius:22px;overflow:hidden;background:#0b0716 url(./assets/mega_case.png?v=art1) center/cover;box-shadow:0 18px 44px rgba(0,0,0,.55)}
#artifacts .art-mslot{position:absolute;transform:translate(-50%,-50%);border-radius:50%;cursor:pointer}
#artifacts .art-mslot .art-msimg{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}
#artifacts .art-comp{position:fixed;inset:0;z-index:390;background:rgba(6,4,12,.6);backdrop-filter:blur(3px);display:none;align-items:center;justify-content:center;padding:16px}
#artifacts .art-comp.open{display:flex}
#artifacts .art-page{width:100%;max-width:420px;max-height:100%;overflow-y:auto;border-radius:20px;position:relative;background:linear-gradient(180deg,#1b1206,#120b04);border:1px solid #5a4422;box-shadow:0 30px 80px rgba(0,0,0,.7)}
#artifacts .art-ribbon{height:7px;border-radius:20px 20px 0 0;background:linear-gradient(90deg,#7a5a1e,#d8b25a,#7a5a1e)}
#artifacts .art-cx{position:absolute;right:12px;top:16px;width:34px;height:34px;border-radius:10px;display:grid;place-items:center;background:#241a0e;border:1px solid #5a4422;color:#e7d3a0;cursor:pointer;z-index:3;font-size:18px}
#artifacts .art-pstone{height:184px;display:grid;place-items:center;position:relative}
#artifacts .art-pstone img{width:140px;height:140px;object-fit:contain;filter:drop-shadow(0 6px 14px rgba(0,0,0,.6))}
#artifacts .art-pstone img.sil{filter:brightness(0) opacity(.6)}
#artifacts .art-pglow{position:absolute;width:150px;height:150px;border-radius:50%;filter:blur(24px);opacity:.45}
#artifacts .art-pname{font-family:Frijole,Creepster,serif;text-align:center;font-size:26px;margin:0 16px 2px;background:linear-gradient(180deg,#fff,#e7d3a0);-webkit-background-clip:text;background-clip:text;color:transparent}
#artifacts .art-pclass{text-align:center;font:700 10px system-ui;letter-spacing:2px;color:#b78a3a;margin-bottom:13px}
#artifacts .art-pblock{margin:0 18px 12px;background:rgba(0,0,0,.32);border:1px solid #4a381c;border-radius:12px;padding:11px 14px}
#artifacts .art-pblock .bt{font:700 10px system-ui;letter-spacing:2px;color:#d8b25a;margin-bottom:4px}
#artifacts .art-pblock .bv{font:600 14px system-ui;color:#f3ecd6}
#artifacts .art-pblock .bv.dim{color:#6f6044}
#artifacts .art-pblock .bd{font:500 13px system-ui;color:#bdae8e;margin-top:3px;line-height:1.45}
#artifacts .art-pfoot{margin:8px 18px 16px;text-align:center;font:italic 600 12px system-ui;color:#8c7a52;line-height:1.5}
@media(prefers-reduced-motion:reduce){#artifacts *{animation:none !important}}
`;
let artEl=null;
function artProg(){ if(typeof prog!=='undefined'&&prog) return prog; if(!window.__artProg) window.__artProg={owned:[],megas:(typeof testMode!=='undefined'&&testMode)?{greed:true,discord:true}:{}}; return window.__artProg; }
function artStoneImgHTML(id,lit){
  const g=ART_GLOWC[id]||'#fff';
  if(lit) return '<div class="art-simg"><div class="art-glow" style="background:'+g+'"></div><img class="lit" src="'+artStoneURL(id)+'"><div class="art-shine" style="-webkit-mask-image:url('+artStoneURL(id)+');mask-image:url('+artStoneURL(id)+')"></div></div>';
  return '';
}
function artBuild(){
  const st=document.createElement('style'); st.textContent=ART_CSS; document.head.appendChild(st);
  artEl=document.createElement('div'); artEl.id='artifacts';
  artEl.innerHTML='<div class="art-screen">'
    +'<div class="art-head"><div class="art-brand">REALM OF cReapZ</div><div class="art-t">Artifacts</div><div class="art-x" id="artX">✕</div></div>'
    +'<div class="art-sec"><div class="art-seclbl"><b>cReapY STONEZ</b><div class="art-ln"></div><div class="art-n" id="artScnt">0 / 8</div></div>'
    +'<div class="art-case"><svg class="art-bgsvg" id="artSvg" viewBox="0 0 100 100" preserveAspectRatio="none"></svg><div id="artStones"></div><div class="art-core" id="artCore"></div></div></div>'
    +'<div class="art-sec"><div class="art-seclbl"><b>MEGA SOULS</b><div class="art-ln"></div><div class="art-n" id="artMcnt">0 / 3</div></div>'
    +'<div class="art-megacase" id="artMega"></div></div>'
    +'</div><div class="art-comp" id="artComp"><div class="art-page" id="artPage"></div></div>';
  document.body.appendChild(artEl);
  artEl.querySelector('#artX').onclick=closeArtifacts;
  artEl.addEventListener('pointerdown',function(e){ if(e.target===artEl) closeArtifacts(); });
  artEl.querySelector('#artComp').addEventListener('pointerdown',function(e){ if(e.target.id==='artComp') e.currentTarget.classList.remove('open'); });
}
function artRender(){
  const _ps=artProg(); const owned=_ps.owned||[]; const oset={}; owned.forEach(function(k){oset[k]=1;});
  const cnt=ART_ORDER.filter(function(k){return oset[k];}).length; const allBase=cnt>=8; const asc=!!oset['holy'];
  // energy group: lines between owned linked stones + holy ring on ascension
  let inner='';
  ART_EDGES.forEach(function(e){ if(oset[ART_ORDER[e[0]]]&&oset[ART_ORDER[e[1]]]){ const a=ART_VERTS[e[0]],b=ART_VERTS[e[1]]; inner+='<line stroke-width="0.9" x1="'+a[0]+'" y1="'+a[1]+'" x2="'+b[0]+'" y2="'+b[1]+'"></line>'; } });
  if(asc) inner+='<circle cx="'+ART_CIRCLE.c[0]+'" cy="'+ART_CIRCLE.c[1]+'" r="'+(ART_CIRCLE.d/2)+'" stroke-width="'+ART_CIRCLE.w+'"></circle>';
  artEl.querySelector('#artSvg').innerHTML = inner ? ('<g class="art-elines">'+inner+'</g>') : '';
  // stones
  const sw=artEl.querySelector('#artStones'); sw.innerHTML='';
  ART_ORDER.forEach(function(id,i){ const el=document.createElement('div'); const own=!!oset[id];
    el.className='art-stone'+(own?' owned':'')+(own&&allBase?' full':'');
    el.style.left=ART_POS[i][0]+'%'; el.style.top=ART_POS[i][1]+'%'; el.style.width=ART_SCALE+'%'; el.style.aspectRatio='1';
    el.innerHTML=own?artStoneImgHTML(id,true):'';
    el.onclick=function(){ openArtStone(id,own,false); }; sw.appendChild(el); });
  artEl.querySelector('#artScnt').textContent=cnt+' / 8';
  // core (holy)
  const core=artEl.querySelector('#artCore'); core.style.left=ART_CTR[0]+'%'; core.style.top=ART_CTR[1]+'%';
  core.innerHTML='<div class="art-ring"></div><div class="art-ring r2"></div>'+(asc?artStoneImgHTML('holy',true):'');
  core.onclick=function(){ openArtStone('holy',asc,true); };
  // mega souls
  const megas=_ps.megas||{}; const shards=megas.vigorShards||[]; const vf=shards.length, greed=!!megas.greed, discord=!!megas.discord;
  const found={vigor:vf>0, greed:greed, discord:discord};
  const mega=artEl.querySelector('#artMega'); mega.innerHTML='';
  ART_MEGADEF.forEach(function(m,i){ const d=document.createElement('div'); d.className='art-mslot';
    d.style.left=ART_MSLOT.pos[i][0]+'%'; d.style.top=ART_MSLOT.pos[i][1]+'%'; d.style.width=ART_MSLOT.w+'%'; d.style.height=ART_MSLOT.h+'%';
    if(m.id==='vigor'){ if(vf>0){ let h=''; shards.forEach(function(k){ h+='<img class="art-msimg" src="./assets/mega_vigor_frag'+k+'.png?v='+artV()+'">'; }); d.innerHTML=h; d.style.filter='drop-shadow(0 0 9px '+m.c+'cc)'; } }
    else if(found[m.id]){ d.innerHTML='<img class="art-msimg" src="./assets/'+m.img+'.png?v='+artV()+'">'; d.style.filter='drop-shadow(0 0 9px '+m.c+'cc)'; }
    d.onclick=function(){ openArtMega(m,found[m.id],vf); }; mega.appendChild(d); });
  const mc=(found.vigor?1:0)+(found.greed?1:0)+(found.discord?1:0);
  artEl.querySelector('#artMcnt').textContent=mc+' / 3';
}
function openArtStone(id,owned,holy){
  const info=ART_INFO[id]||{name:'???',zone:'Unknown',power:'? ? ?',desc:''}; const lock=!owned; const c=holy?'#fff0a0':(ART_GLOWC[id]||'#c8fb50');
  const acqV = holy?'The Myth of Ascension':('Hidden in '+info.zone); const acqD = holy?'Said to take form only when all eight stones are reunited.':(lock?('Lost somewhere in '+info.zone+'.'):'Reclaimed — it fuels the star.');
  const page=artEl.querySelector('#artPage');
  page.innerHTML='<div class="art-ribbon"></div><div class="art-cx" id="artCx">✕</div>'
   +'<div class="art-pstone">'+(lock?'':'<div class="art-pglow" style="background:'+c+'"></div>')+'<img class="'+(lock?'sil':'')+'" src="'+artStoneURL(id)+'"></div>'
   +'<div class="art-pname">'+(lock?'Undiscovered':info.name)+'</div><div class="art-pclass">'+(holy?'THE MIRACLE STONE':'ONE OF EIGHT LEGENDARY STONES')+'</div>'
   +'<div class="art-pblock"><div class="bt">⚡ ABILITY</div><div class="bv '+(lock?'dim':'')+'">'+(lock?'? ? ?':info.power)+'</div><div class="bd">'+(lock?'Its power is sealed until the stone is reclaimed.':info.desc)+'</div></div>'
   +'<div class="art-pblock"><div class="bt">📍 HOW TO ACQUIRE</div><div class="bv">'+acqV+'</div><div class="bd">'+acqD+'</div></div>'
   +'<div class="art-pfoot">"When all eight are brought together, a miraculous power is unleashed — the Myth of Ascension."</div>';
  artEl.querySelector('#artComp').classList.add('open');
  page.querySelector('#artCx').onclick=function(){ artEl.querySelector('#artComp').classList.remove('open'); };
}
function openArtMega(m,found,vf){
  const lock=!found; const page=artEl.querySelector('#artPage');
  let heroImg;
  if(m.id==='vigor'){ heroImg = (vf>0) ? '<div class="art-pglow" style="background:'+m.c+'"></div><img src="./assets/mega_vigor.png?v='+artV()+'">' : '<img class="sil" src="./assets/mega_vigor.png?v='+artV()+'">'; }
  else heroImg = lock ? '<img class="sil" src="./assets/'+m.img+'.png?v='+artV()+'">' : '<div class="art-pglow" style="background:'+m.c+'"></div><img src="./assets/'+m.img+'.png?v='+artV()+'">';
  const fragLine = (m.id==='vigor') ? '<div class="art-pblock"><div class="bt">◈ FRAGMENTS</div><div class="bv">'+vf+' / 6 reclaimed</div><div class="bd">Each shard restores one point of maximum life.</div></div>' : '';
  page.innerHTML='<div class="art-ribbon"></div><div class="art-cx" id="artCx">✕</div>'
   +'<div class="art-pstone">'+heroImg+'</div>'
   +'<div class="art-pname">'+(lock?'Undiscovered':m.name)+'</div><div class="art-pclass">MEGA SOUL</div>'
   +'<div class="art-pblock"><div class="bt">⚡ EFFECT</div><div class="bv '+(lock?'dim':'')+'">'+(lock?'? ? ?':m.power)+'</div><div class="bd">'+(lock?'Its essence is sealed until you claim one.':m.desc)+'</div></div>'
   +fragLine
   +'<div class="art-pblock"><div class="bt">📍 HOW TO ACQUIRE</div><div class="bv">'+(lock?'Hidden in the realm':m.acq)+'</div><div class="bd">'+(lock?'A Mega Soul lies somewhere in the realm, waiting to be claimed.':'Claimed — its power flows through you.')+'</div></div>';
  artEl.querySelector('#artComp').classList.add('open');
  page.querySelector('#artCx').onclick=function(){ artEl.querySelector('#artComp').classList.remove('open'); };
}
function openArtifacts(){ if(!artEl) artBuild(); artRender(); artEl.classList.add('open'); }
function closeArtifacts(){ if(artEl) artEl.classList.remove('open'); }
