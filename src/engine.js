const ASSET_VER='1780580238';
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
const OBJ = SPRITES.obst;
let stageIdx = 0, ST, WORLD, GOAL_X, SEG, OBST, SOLID, PLAT_DEF, CHK, SOUL_POS;
let STARS=[], TREES=[], GRAVES_BG=[];
let titleT = 99;
function loadStage(i){
  stageIdx = i; ST = window.STAGES[i];
  WORLD = ST.world; GOAL_X = ST.goal; SEG = ST.seg;
  OBST = ST.obst.map(o => ({x:o.x, type:o.type, w:OBJ[o.type].w, h:OBJ[o.type].h}));
  SOLID = OBST.map(o => ({l:o.x-o.w/2, r:o.x+o.w/2, top:GROUND-o.h}));
  PLAT_DEF = ST.plats; CHK = ST.chk; SOUL_POS = ST.souls;
  STARS = Array.from({length:Math.ceil(WORLD/120)},()=>[Math.random()*WORLD,Math.random()*GROUND*0.8,Math.random()*1.6+0.6]);
  TREES = Array.from({length:Math.ceil(WORLD/180)},(_,k)=>({x:80+k*180+((k*53)%50), big:(k%4===0)}));
  GRAVES_BG = Array.from({length:Math.ceil(WORLD/150)},(_,k)=>[80+k*150+((k*53)%40),0.7+((k*29)%4)*0.1,(k%4===0)]);
  reset(); titleT = 0;
}
const ORDER = SPRITES.order;
const LABELS = { default:'Violet', green:'Emerald', blue:'Azure', red:'Crimson' };

const keys = {};
const DOUBLE_TAP = 350;
const lastRelease = { ArrowLeft:-1e9, ArrowRight:-1e9 };
const runHeld = { ArrowLeft:false, ArrowRight:false };
function press(code){
  if (code==='ArrowLeft'||code==='ArrowRight'){
    if (keys[code]) return; runHeld[code]=(performance.now()-lastRelease[code])<DOUBLE_TAP;
  }
  keys[code]=true;
}
function release(code){
  if (code==='ArrowLeft'||code==='ArrowRight'){ lastRelease[code]=performance.now(); runHeld[code]=false; }
  keys[code]=false;
}
addEventListener('keydown', e => {
  if (['ArrowLeft','ArrowRight','ArrowUp','Space',' '].includes(e.key)||e.code==='Space') e.preventDefault();
  if (mode==='select'){ if(e.key==='1') startGame(creaperSkin); else if(e.key==='2') startGame('dingbat'); return; }
  if (e.code==='Escape'||e.code==='KeyP'){ if(mode==='play'&&!p.dead&&!p.won) paused=!paused; return; }
  if (e.code==='KeyR'){ paused=false; onReset(); return; }
  if (e.code==='KeyC'){ paused=false; mode='select'; return; }
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
bindBtn('bL','ArrowLeft'); bindBtn('bR','ArrowRight'); bindBtn('bJ','Space'); bindBtn('bA','KeyZ'); bindBtn('bC','KeyX');
// canvas taps (character select)
function canvasPt(e){ const r=cv.getBoundingClientRect(); return { x:(e.clientX-r.left)/r.width*W, y:(e.clientY-r.top)/r.height*H }; }
cv.addEventListener('pointerdown', e=>{
  const pt=canvasPt(e);
  if (mode==='select'){
    for (const d of dotRects){ if (pt.x>d.x&&pt.x<d.x+d.w&&pt.y>d.y&&pt.y<d.y+d.h){ creaperSkin=d.skin; return; } }
    for (const c of cardRects){ if (pt.x>c.x&&pt.x<c.x+c.w&&pt.y>c.y&&pt.y<c.y+c.h){ startGame(c.key==='creaper'?creaperSkin:'dingbat'); break; } }
    return;
  }
  if (mode!=='play') return;
  if (menuOpen()){
    for (const r of menuRects){ if (pt.x>r.x&&pt.x<r.x+r.w&&pt.y>r.y&&pt.y<r.y+r.h){ r.action(); return; } }
    return;
  }
  if (pt.x>PB.x-6&&pt.x<PB.x+PB.w+6&&pt.y>PB.y-6&&pt.y<PB.y+PB.h+6 && !p.winning){ paused=true; }
});

// ---- load sprites ----
const SPR = { chars:{} };
let loaded=0, total=0;
function L(d){ const img=new Image(); total++; img.onload=()=>loaded++; img.src=d.src;
  return {img,sw:d.sw,sh:d.sh,w:d.w,h:d.h,frames:d.frames,foots:d.foots,cxs:d.cxs,weapon:d.weapon}; }
SPR.soul = L(SPRITES.soul);
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
const FPS = { idle:17, walk:16, run:16, jump:23, attack:38, hurt:48, kneel:48, cast:32 };
function pfps(st2){ const f=SPR.chars[chosen]&&SPR.chars[chosen].fps; return (f&&f[st2])||FPS[st2]; }
const FZ = { idle:24, walk:12, attack:16 };
const FZK = { zombie:FZ, zgen:FZ, gob:{idle:13, walk:12, attack:43}, bd:{idle:12, walk:12, attack:12} };
const KSPD = { zombie:1.7, zgen:1.7, gob:2.4, bd:1.15 };
const KRNG = { zombie:74, zgen:74, gob:76, bd:-1 };  // gob spear reach ~78; bd never melee-attacks (contact only)
const ZSPEED = 1.7;
const PMAXHP = 4, ZMAXHP = 2;
const SOUL_FPS = 20;
const BAT_FPS = 15, BITE_FPS = 29, BAT_PATROL = 1.25, BAT_CHASE = 2.1, BAT_AGGRO = 280;

let mode='select', chosen=ORDER[0];
let p, souls, soulCount, gt=0, camX=0, zombies, plats, chkOn, bats, bolts, impacts;
let paused=false, menuRects=[];
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
  items.forEach((it,i)=>{
    const by=my+66+i*(ih+gap);
    ctx.fillStyle='rgba(155,140,255,.16)'; roundRect(mx+26,by,mw-52,ih,10); ctx.fill();
    ctx.strokeStyle='rgba(155,140,255,.45)'; ctx.lineWidth=1; ctx.stroke();
    ctx.fillStyle='#e8e6f5'; ctx.font='600 18px sans-serif';
    ctx.fillText(it.label, W/2, by+30);
    menuRects.push({x:mx+26,y:by,w:mw-52,h:ih,action:it.action});
  });
  if (sub){ ctx.fillStyle='rgba(200,190,255,.6)'; ctx.font='13px sans-serif'; ctx.fillText(sub, W/2, my+mh-16); }
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
  const sa=SPR.soul;
  if (sa){ const fi=Math.floor(gt*SOUL_FPS)%sa.frames; const dw=sa.w*0.55, dh=sa.h*0.55;
    ctx.drawImage(sa.img, fi*sa.sw,0,sa.sw,sa.sh, W*0.34-dw/2, 299-dh/2, dw, dh); }
  ctx.restore();
}
function drawPauseBtn(){
  ctx.fillStyle='rgba(20,16,36,.55)'; roundRect(PB.x,PB.y,PB.w,PB.h,8); ctx.fill();
  ctx.strokeStyle='rgba(150,140,255,.4)'; ctx.lineWidth=1; ctx.stroke();
  ctx.fillStyle='#cfd0e8'; ctx.fillRect(PB.x+12,PB.y+8,5,16); ctx.fillRect(PB.x+23,PB.y+8,5,16);
}
function menuOpen(){ return paused || (p && p.dead && p.deadT>2.3) || (p && p.won); }
function startGame(ck){ chosen=ck; mode='play'; loadStage(stageIdx); }
function reset(keep){
  const sx = keep && p ? p.spawn : 90;
  p = { x:sx, y:GROUND, vx:0, vy:0, facing:1, onGround:true, state:'idle', clock:0, attackT:0, won:false,
        hp:PMAXHP, hpShown:PMAXHP, inv:0, flash:0, dead:false, hurtT:0, deadT:0, spawn:sx, standPlat:null, castT:0, castCd:0, castFired:true, winning:false, winT:0 };
  camX=Math.max(0,Math.min(WORLD-W,sx-W*0.38)); zbits=[]; bolts=[]; impacts=[]; chkFx=[];
  if (!keep){
    soulCount=0; chkOn=CHK.map(()=>false);
    souls = SOUL_POS.map((s,i)=>({x:s[0],y:s[1],got:false,pop:0,ph:i*0.31}));
  }
  plats = PLAT_DEF.map(q=>({x:q.x!==undefined?q.x:q.x0, x0:q.x0, y:q.y, w:q.w, t:q.t,
    range:q.range||0, spd:q.spd||0, ph:0, dir:1, dxf:0,
    ct:0, falling:false, gone:false, dy:0, fv:0, rt:0}));
  const zspawn=ST.enemies;
  zombies = zspawn.map(z=>{ const kw=z[3]||'zombie', mh=(kw==='zgen')?3:((kw==='gob'||kw==='bd')?1:ZMAXHP);
    return {x:z[0], y:GROUND, t:Math.random(), facing:-1, state:'idle', atkT:0,
    dead:false, dieT:0, dframe:0, dstate:kw==='bd'?'walk':'idle', pdir:1, min:z[1], max:z[2], kw,
    hp:mh, maxhp:mh, hpShown:mh, hitCd:0, shown:0}; });
  const bspawn=ST.bats;
  bats = bspawn.map((b,i)=>({x:b[0], y:b[3], y0:b[3], t:Math.random()*3, ph:i*1.7, facing:-1, dir:i%2?1:-1,
    min:b[1], max:b[2], dead:false, dieT:0, yD:b[3], state:'idle', bt:0, biteCd:0}));
}
function onReset(){ if (p && p.dead && !p.won) reset(true); else reset(); }
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

loadStage(0); mode='select'; titleT=99;
let last=performance.now();
function loop(now){
  const dt=Math.min(0.05,(now-last)/1000); last=now; gt+=dt;
  document.querySelector('.touch').style.display = mode==='play'?'flex':'none';
  if (loaded<total) drawLoading();
  else if (mode==='select') drawSelect();
  else { update(dt); draw(); }
  requestAnimationFrame(loop);
}

function update(dt){
  if (titleT<3) titleT+=dt;
  if (paused || p.won) return;
  if (p.inv>0) p.inv-=dt;
  if (p.flash>0) p.flash-=dt;
  if (p.hurtT>0) p.hurtT-=dt;
  p.hpShown += (p.hp-p.hpShown)*Math.min(1,dt*8);
  if (p.dead){
    p.deadT+=dt;
    if (p.state!=='kneel'){ p.state='kneel'; p.clock=0; }
    p.clock+=dt;
    return;
  }
  if (p.winning){
    p.winT+=dt; p.inv=1;
    if (p.state!=='idle'){ p.state='idle'; p.clock=0; }
    p.clock+=dt;
    if (p.winT>1.0){
      const gw=SPR.goal, gy=GROUND+10-gw.h;
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
  let dir=0;
  if (keys['ArrowLeft']) dir=-1; else if (keys['ArrowRight']) dir=1;
  const dc=dir<0?'ArrowLeft':'ArrowRight';
  const running=(dir!==0&&runHeld[dc])||keys['ShiftLeft']||keys['ShiftRight'];
  const speed=running?RUN:WALK;
  if (dir!==0){ p.vx=dir*speed; p.facing=dir; } else p.vx=0;
  if ((keys['Space']||keys['ArrowUp'])&&p.onGround){ p.vy=JUMP; p.onGround=false; }
  if (keys['KeyZ']&&p.attackT<=0&&SPR.chars[chosen].attack.weapon) p.attackT=SPR.chars[chosen].attack.frames/pfps('attack');
  if (p.attackT>0) p.attackT-=dt;
  if (p.castCd>0) p.castCd-=dt;
  if (p.muzzleT>0) p.muzzleT-=dt;
  if (keys['KeyX']&&p.castT<=0&&p.castCd<=0&&p.attackT<=0){
    p.castT=Math.min(0.5, SPR.chars[chosen].cast.frames/pfps('cast')); p.castCd=0.55; p.castFired=false;
  }
  if (p.castT>0){
    p.castT-=dt;
    const cf0=Math.min(0.5, SPR.chars[chosen].cast.frames/pfps('cast'));
    const cfi=Math.min(SPR.chars[chosen].cast.frames-1, Math.floor((cf0 - p.castT)*pfps('cast')));
    if (!p.castFired && cfi>=3){
      p.castFired=true; p.muzzleT=0.14;
      if (chosen==='dingbat') bolts.push({x:p.x+p.facing*30, y:p.y-66, vx:p.facing*470, t:0, dead:false, kind:'wave'});
      else bolts.push({x:p.x+p.facing*40, y:p.y-56, vx:p.facing*560, t:0, dead:false, kind:'bolt'});
    }
  }
  let nx=p.x+p.vx;
  for (const s of SOLID){
    if (p.y>s.top+4 && (p.y-PH)<GROUND){
      if (nx+PW/2>s.l && nx-PW/2<s.r){
        if (p.x+PW/2<=s.l+0.5) nx=s.l-PW/2; else if (p.x-PW/2>=s.r-0.5) nx=s.r+PW/2;
      }
    }
  }
  p.x=nx;
  const prevFeet=p.y; p.vy+=GRAV; p.y+=p.vy;
  if (p.vy>=0){
    let cand=[]; if(onSeg(p.x)) cand.push({t:GROUND,q:null});
    for (const s of SOLID){ if(p.x>=s.l&&p.x<=s.r) cand.push({t:s.top,q:null}); }
    for (const q of plats){ if(q.gone) continue; if(p.x>=q.x-8&&p.x<=q.x+q.w+8) cand.push({t:q.y+q.dy,q:q}); }
    cand=cand.filter(c=>prevFeet<=c.t+1&&p.y>=c.t).sort((a,b)=>a.t-b.t);
    if (cand.length){ p.y=cand[0].t; p.vy=0; p.onGround=true; p.standPlat=cand[0].q;
      if (cand[0].q && cand[0].q.t==='c' && cand[0].q.ct===0) cand[0].q.ct=0.0001;
    } else { p.onGround=false; p.standPlat=null; }
  } else { p.onGround=false; p.standPlat=null; }
  // hard-resolve any overlap with solid obstacles (accurate edges, no pass-through)
  for (const s of SOLID){
    if (p.y>s.top+4 && (p.y-PH)<GROUND){
      const pl=p.x-PW/2, pr=p.x+PW/2;
      if (pr>s.l && pl<s.r){
        if (pr-s.l < s.r-pl) p.x=s.l-PW/2; else p.x=s.r+PW/2;
      }
    }
  }
  if (p.y>H+220){
    p.hp-=1; p.x=p.spawn; p.y=GROUND; p.vy=0; p.vx=0; p.onGround=true; p.standPlat=null;
    p.inv=1.2; p.flash=0.35; p.hurtT=0;
    if (p.hp<=0){ p.hp=0; p.dead=true; p.deadT=0; p.inv=0; p.flash=0; }
    camX=Math.max(0,Math.min(WORLD-W,p.x-W*0.38));
  }
  for (let ci=0; ci<CHK.length; ci++){
    if (!chkOn[ci] && p.x>=CHK[ci]-10){ chkOn[ci]=true; p.spawn=CHK[ci]; chkFx.push({cx:CHK[ci], t:0, hit:false}); }
  }
  p.x=Math.max(18,Math.min(WORLD-18,p.x));
  if (p.x>=GOAL_X-24 && p.onGround && !p.won && !p.winning){ p.winning=true; p.winT=0; p.vx=0; p.vy=0; }
  let st;
  if (p.hurtT>0) st='hurt';
  else if (p.attackT>0) st='attack'; else if (p.castT>0) st='cast'; else if(!p.onGround) st='jump';
  else if (p.vx!==0) st=running?'run':'walk'; else st='idle';
  if (st!==p.state) p.clock=0; p.state=st; p.clock+=dt;
  const pb={x:p.x-26,y:p.y-96,w:52,h:96};
  for (const s of souls){
    if (s.got){ if(s.pop<1) s.pop+=dt/0.28; continue; }
    const r=30, sb={x:s.x-r,y:s.y-r,w:2*r,h:2*r};
    if (overlap(pb,sb)){ s.got=true; s.pop=0; soulCount++; }
  }
  // --- combat ---
  let pwb = (p.attackT>0) ? worldWeaponBox(SPR.chars[chosen].attack, curFrame(), p.x, p.y, p.facing) : null;
  for (const z of zombies){
    z.t+=dt;
    if (z.hitCd>0) z.hitCd-=dt;
    if (z.shown>0) z.shown-=dt;
    z.hpShown += (z.hp-z.hpShown)*Math.min(1,dt*10);
    if (z.dead){ z.dieT+=dt; if(z.dieT<0.7) zbitsEmit(z,dt); continue; }
    const dx=p.x-z.x, ad=Math.abs(dx); z.facing = dx<0?-1:1;
    // player weapon strikes zombie body
    if (pwb && z.hitCd<=0 && overlap(pwb, zBodyBox(z))){
      z.hp-=1; z.hitCd=0.45; z.shown=3;
      z.x=clamp(z.x + (z.x<p.x?-12:12), z.min, z.max);
      if (z.hp<=0){ z.dead=true; z.dieT=0; z.dstate=z.state; z.dframe=Math.floor(z.t*FZK[z.kw][z.state])%SPR[z.kw][z.state].frames; zbitsBurst(z,16); continue; }
    }
    // zombie behavior + its sword strikes player
    if (z.atkT>0){
      z.atkT-=dt; z.state='attack';
      const zfi=Math.floor(z.t*FZK[z.kw].attack)%SPR[z.kw].attack.frames;
      const zwb=worldWeaponBox(SPR[z.kw].attack, zfi, z.x, z.y, z.facing);
      if (zwb && p.inv<=0 && !p.dead && overlap(zwb, pBodyBox())) hurtPlayer(z.x, z.kw==='zgen'?2:1);
    } else if (ad<KRNG[z.kw]){ z.state='attack'; z.atkT=SPR[z.kw].attack.frames/FZK[z.kw].attack; }
    else if (ad<340){ z.state='walk'; z.x=clamp(z.x+z.facing*KSPD[z.kw], z.min, z.max); }
    else if (z.kw==='bd'){
      z.state='walk';
      z.x+=z.pdir*KSPD.bd;
      if (z.x>=z.max){ z.x=z.max; z.pdir=-1; } else if (z.x<=z.min){ z.x=z.min; z.pdir=1; }
      z.facing=z.pdir;
    }
    else z.state='idle';
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
      if (dist<185 && b.biteCd<=0){ b.state='bite'; b.bt=0; if (Math.abs(dxp)>6) b.facing=Math.sign(dxp); }
    } else {
      b.x+=b.dir*BAT_PATROL;
      if (b.x>=b.max){ b.dir=-1; } else if (b.x<=b.min){ b.dir=1; }
      b.facing=b.dir;
      b.y+=(b.y0-b.y)*0.03;
    }
    b.x=clamp(b.x,b.min-40,b.max+40);
    b.y=clamp(b.y,70,GROUND-60);
    b.yD=b.y+Math.sin(b.t*3.1+b.ph)*10;
    let bb=batBox(b);
    if (b.state==='bite' && b.bt>8/BITE_FPS && b.bt<23/BITE_FPS){ bb={x:bb.x+(b.facing<0?-30:0), y:bb.y-4, w:bb.w+30, h:bb.h+8}; }
    if (p.inv<=0 && !p.dead && overlap(pBodyBox(), bb)) hurtPlayer(b.x);
    if (pwb && overlap(pwb, batBox(b))){ b.dead=true; b.dieT=0; batBits(b,14); }
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
        z.hp-=1; z.shown=3;
        z.x=clamp(z.x+(bo.vx>0?9:-9), z.min, z.max);
        if (z.hp<=0){ z.dead=true; z.dieT=0; z.dstate=z.state; z.dframe=Math.floor(z.t*FZK[z.kw][z.state])%SPR[z.kw][z.state].frames; zbitsBurst(z,16); }
        hit=true; break;
      }
    }
    if (!hit) for (const b of bats){
      if (b.dead) continue;
      const bb2=batBox(b);
      if (bo.x>bb2.x-6&&bo.x<bb2.x+bb2.w+6&&bo.y>bb2.y&&bo.y<bb2.y+bb2.h){
        b.dead=true; b.dieT=0; batBits(b,14); hit=true; break;
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
    if (!fx.hit && fx.t>0.62){ fx.hit=true; p.hp=Math.min(PMAXHP, p.hp+1); }
  }
  chkFx=chkFx.filter(fx=>fx.t<1.1);
  bolts=bolts.filter(bo=>!bo.dead||bo.t<1.2);
  updateZbits(dt);
  camX=Math.max(0,Math.min(WORLD-W,p.x-W*0.38));
}
function hurtPlayer(srcX,dmg){
  p.hp-=(dmg||1); p.inv=1.0; p.flash=0.35;
  p.hurtT=Math.min(0.45, SPR.chars[chosen].hurt.frames/pfps('hurt'));
  const away=(p.x<srcX)?-1:1; p.vx=away*2; p.x+=away*8;
  if(p.onGround){ p.vy=-7; p.onGround=false; }
  if (p.hp<=0){ p.hp=0; p.dead=true; p.deadT=0; p.inv=0; p.flash=0; p.hurtT=0; }
}
function curFrame(){
  const a=SPR.chars[chosen][p.state], fps=pfps(p.state);
  if (p.state==='attack'||p.state==='hurt'||p.state==='kneel'||p.state==='cast') return Math.min(a.frames-1, Math.floor(p.clock*fps));
  return Math.floor(p.clock*fps)%a.frames;
}

// ---- scenery ----

function pxf(wx,f){ return wx-camX*f; }
function tileDirt(x0,x1,topY,darken,f){
  const dt=SPR.dirt; if(!dt) return; const th=H-topY; const tw=dt.w*th/dt.h;
  const fac=(f===undefined)?1:f;
  const off=(((camX*fac)%tw)+tw)%tw;
  for(let x=-off; x<W+tw; x+=tw) ctx.drawImage(dt.img, x, topY, tw, th);
  if(darken>0){ ctx.fillStyle='rgba(6,4,12,'+darken+')'; ctx.fillRect(x0,topY,x1-x0,th); }
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
function drawPlats(){
  const d=SPR.dirt, gr=SPR.grass, TH=26;
  for (const q of plats){
    if (q.gone && q.dy>340) continue;
    const x0=pxf(q.x,1), y=q.y+q.dy; if(x0+q.w<-30||x0>W+30) continue;
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
    const sx=pxf(CHK[i],1); if(sx<-120||sx>W+120) continue;
    const on=chkOn[i], gy=GROUND+8-st.h, x0=sx-st.w/2;
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
function drawGround(){
  for (const s of SEG){
    const x0=pxf(s[0],1),x1=pxf(s[1],1); if(x1<-20||x0>W+20) continue;
    ctx.save(); ctx.beginPath(); ctx.rect(x0,GROUND,x1-x0,H-GROUND); ctx.clip();
    tileDirt(x0,x1,GROUND,0);
    ctx.restore();
    if (SPR.grass){
      const gr=SPR.grass, gy=GROUND-Math.round(gr.h*0.55);
      ctx.save(); ctx.beginPath(); ctx.rect(x0,gy,x1-x0,gr.h); ctx.clip();
      const goff=((camX%gr.w)+gr.w)%gr.w;
      for (let gx=-goff; gx<W+gr.w; gx+=gr.w) ctx.drawImage(gr.img, gx, gy, gr.w, gr.h);
      ctx.restore();
    }
    ctx.fillStyle='rgba(0,0,0,.4)'; ctx.fillRect(x0,GROUND,3,H-GROUND); ctx.fillRect(x1-3,GROUND,3,H-GROUND);
  }
}
function drawObstacle(o){
  const sx=pxf(o.x,1); if(sx<-90||sx>W+90) return;
  const im=SPR.obst[o.type]; ctx.imageSmoothingEnabled=true;
  ctx.drawImage(im.img, sx-o.w/2, GROUND-o.h, o.w, o.h);
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
let creaperSkin='default';
const SKINC={default:'#7b5cff', green:'#3ddc5a', blue:'#2f7bff', red:'#e0504a'};
function drawSelect(){
  ctx.setTransform(RS,0,0,RS,0,0);
  camX=0; skyBG();
  drawFence();
  ctx.fillStyle='#1d1730'; ctx.fillRect(0,GROUND,W,H-GROUND); ctx.fillStyle='#5a4499'; ctx.fillRect(0,GROUND,W,8);
  ctx.textAlign='center';
  ctx.fillStyle='#eae6ff'; ctx.font='bold 30px sans-serif'; ctx.fillText('Choose your Creap', W/2, 56);
  ctx.fillStyle='#9b8cff'; ctx.font='15px sans-serif'; ctx.fillText('tap a character to begin  ·  dots pick the cReaper cloak', W/2, 82);
  const cw=250, gap=(W-2*cw)/3, cardY=104, cardH=246;
  cardRects=[]; dotRects=[];
  const roster=[{key:'creaper', label:'cReaper', ck:creaperSkin},{key:'dingbat', label:'Dingbat', ck:'dingbat'}];
  for (let i=0;i<2;i++){
    const it=roster[i], cardX=gap+i*(cw+gap);
    cardRects.push({x:cardX,y:cardY,w:cw,h:cardH,key:it.key});
    ctx.fillStyle='rgba(20,16,40,.55)';
    ctx.strokeStyle = it.key==='creaper' ? (SKINC[creaperSkin]||'#5a4d8c') : '#8a6a3a';
    roundRect(cardX,cardY,cw,cardH,12); ctx.fill(); ctx.lineWidth=2; ctx.stroke();
    const a=SPR.chars[it.ck].idle;
    const cfps=(SPR.chars[it.ck].fps&&SPR.chars[it.ck].fps.idle)||FPS.idle;
    const fi=Math.floor(gt*cfps)%a.frames;
    const sc=150/a.h; drawCharSprite(it.ck,'idle',fi, cardX+cw/2, cardY+cardH-54, 1, sc);
    ctx.fillStyle='#eae6ff'; ctx.font='bold 18px sans-serif'; ctx.fillText(it.label, cardX+cw/2, cardY+cardH-16);
    if (it.key==='creaper'){
      // color dots floating above the character
      const dn=ORDER.length, dr2=11, dgap=34, dx0=cardX+cw/2-((dn-1)*dgap)/2, dy=cardY+34;
      for (let k=0;k<dn;k++){
        const sk=ORDER[k], dx=dx0+k*dgap;
        dotRects.push({x:dx-15,y:dy-15,w:30,h:30,skin:sk});
        ctx.fillStyle=SKINC[sk]||'#888';
        ctx.beginPath(); ctx.arc(dx,dy,dr2,0,7); ctx.fill();
        if (sk===creaperSkin){
          ctx.strokeStyle='#ffffff'; ctx.lineWidth=2.5;
          ctx.beginPath(); ctx.arc(dx,dy,dr2+4.5,0,7); ctx.stroke();
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
  const hi=SPR.hpicon[chosen];
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
    const dx=bx+bw*(CHK[i]/GOAL_X), dy=by+bh/2;
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
  const gy=GROUND+10-g.h, x0=sx-g.w/2;
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
    if (!(p.inv>0 && Math.floor(gt*16)%2===0)) drawCharSprite(chosen, p.state, curFrame(), sx, p.y, p.facing, 1, p.inv>0?0.45:0);
    if (p.muzzleT>0){
      const k=1-p.muzzleT/0.14, hx=sx+p.facing*42, hy=p.y-56;
      // soft rim glow washing over the character
      const cg=ctx.createRadialGradient(sx,p.y-52,4,sx,p.y-52,64);
      cg.addColorStop(0,'rgba(170,230,255,'+(0.30*(1-k)).toFixed(2)+')'); cg.addColorStop(1,'rgba(120,200,255,0)');
      ctx.fillStyle=cg; ctx.beginPath(); ctx.arc(sx,p.y-52,64,0,7); ctx.fill();
      // hot muzzle burst at the hand
      const mr=10+26*k;
      const mg=ctx.createRadialGradient(hx,hy,1,hx,hy,mr);
      const wave=chosen==='dingbat';
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
  skyBG();
  drawFence();
  vignette();
  drawSpikes();
  drawGround();
  drawChecks();
  drawPlats();
  for (const o of OBST) drawObstacle(o);
  for (const z of zombies) drawZombie(z);
  for (const b of bats) drawBat(b);
  drawZbits();
  drawGoal();
  const sa=SPR.soul;
  for (const s of souls){
    if (s.got&&s.pop>=1) continue; const sx=pxf(s.x,1); if(sx<-60||sx>W+60) continue;
    let alpha=1,sc=1; if(s.got){ alpha=Math.max(0,1-s.pop); sc=1+0.7*s.pop; }
    const fi=Math.floor(gt*SOUL_FPS+s.ph*sa.frames)%sa.frames; const dw=sa.w*sc,dh=sa.h*sc;
    ctx.globalAlpha=alpha; ctx.drawImage(sa.img, fi*sa.sw,0,sa.sw,sa.sh, sx-dw/2, s.y-dh/2, dw,dh); ctx.globalAlpha=1;
  }
  drawPlayerLayer();
  for (const fx of chkFx){
    const st=SPR.chkst; if(!st) break;
    const sx=fx.cx-camX, gy=GROUND+8-st.h;
    if (fx.t<0.62){
      // purple energy streams rising up the statue
      const k=fx.t/0.62;
      for (let w2=0; w2<7; w2++){
        const ph=((fx.t*1.7)+w2*0.143)%1;
        const wy=GROUND+4-ph*(st.h+34);
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
  // HUD
  drawPlayerHP();
  ctx.fillStyle='rgba(20,16,36,.5)'; roundRect(14,54,128,28,7); ctx.fill();
  ctx.fillStyle='#7fe0ff'; ctx.beginPath(); ctx.arc(32,68,9,0,7); ctx.fill();
  ctx.fillStyle='#cfeaff'; ctx.beginPath(); ctx.arc(32,68,5,0,7); ctx.fill();
  ctx.fillStyle='#eaf6ff'; ctx.font='bold 16px sans-serif'; ctx.textAlign='left'; ctx.fillText('x '+soulCount+' / '+souls.length, 48, 74);
  if (!menuOpen() && !p.winning) drawPauseBtn();
  drawProgress();
  if (p.dead && p.deadT>2.3){
    menuPanel('YOU DIED', [
      {label: p.spawn>90?'Rise at Checkpoint':'Try Again', action:()=>{ paused=false; onReset(); }},
      {label:'Restart Act', action:()=>{ paused=false; loadStage(stageIdx); }},
      {label:'Characters', action:()=>{ paused=false; mode='select'; }},
    ], null, '#e23b3b');
  } else if (p.won){
    const items=[];
    if (stageIdx+1 < window.STAGES.length){
      items.push({label:'Continue — Act '+window.STAGES[stageIdx+1].act, action:()=>{ paused=false; loadStage(stageIdx+1); }});
    }
    items.push({label:'Replay Act', action:()=>{ paused=false; loadStage(stageIdx); }});
    items.push({label:'Characters', action:()=>{ paused=false; mode='select'; }});
    menuPanel('Act '+ST.act+' Complete!', items,
      'Souls: '+soulCount+' / '+souls.length+(stageIdx+1>=window.STAGES.length?'   ·   More acts coming soon':''), '#c8fb50');
  } else if (paused){
    menuPanel('Paused', [
      {label:'Characters', action:()=>{ paused=false; mode='select'; }},
      {label:'Restart Act', action:()=>{ paused=false; loadStage(stageIdx); }},
      {label:'Close', action:()=>{ paused=false; }},
    ]);
  }
  drawTitleCard();
}
function drawLoading(){
  ctx.setTransform(RS,0,0,RS,0,0);
  ctx.fillStyle='#0d0b1a'; ctx.fillRect(0,0,W,H);
  ctx.fillStyle='#9b8cff'; ctx.font='18px sans-serif'; ctx.textAlign='center'; ctx.fillText('Loading... '+loaded+'/'+total, W/2, H/2); ctx.textAlign='left';
}
reset(); requestAnimationFrame(loop);
}
main();
