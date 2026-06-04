# -*- coding: utf-8 -*-
import numpy as np, base64, io, json
from PIL import Image, ImageFilter
try:
    from scipy import ndimage
except ImportError:
    import os; os.system('pip install scipy --break-system-packages -q'); from scipy import ndimage

U = "/sessions/magical-charming-keller/mnt/uploads/"
SHEETS = {
    "idle":   U + "75592b9c-4792.png",
    "walk":   U + "2634381e-4793.png",
    "run":    U + "a5a6be16-4794.png",
    "jump":   U + "ebed3283-4795.png",
    "attack": U + "78597a66-4805.png",
    "hurt":   U + "b2abe24b-cReaperhurt.png",
    "cast":   U + "4cdad1c5-4845.png",
}
GRIDS = { "hurt": (7, 7) }
SOUL_IMG = U + "c5bed651-ChatGPT_Image_Jun_3_2026_07_17_33_AM.png"
RANGES  = { "attack": (10, 25), "jump": (4, 25), "hurt": (11, 31), "cast": (4, 11) }
RECOLOR = { "attack": (21, 27, -1) }
PLANT   = {"idle","walk","run","attack","hurt","kneel","cast"}
TARGET = 104
STORE_CAP = 280
VARIANTS = {
    "default": None,
    "green":   {"hue":0.33, "sat":1.05},
    "blue":    {"hue":0.60, "sat":1.18},
    "red":     {"hue":0.00, "sat":1.10},
}

def slice_sheet(path, cols, rows):
    src = Image.open(path).convert("RGBA"); W, H = src.size
    cw, ch = W // cols, H // rows
    return [src.crop((c*cw, r*ch, (c+1)*cw, (r+1)*ch)) for r in range(rows) for c in range(cols)], cw, ch
def union_crop(cells, cw, ch):
    aa=[np.array(c.split()[3]) for c in cells]
    def first(a,ax):
        m=a.any(axis=ax); return int(np.argmax(m)) if m.any() else 0
    x0=min(first(a,0) for a in aa); y0=min(first(a,1) for a in aa)
    x1=max(cw-first(a[:,::-1],0) for a in aa); y1=max(ch-first(a[::-1,:],1) for a in aa)
    pad=6;x0=max(0,x0-pad);y0=max(0,y0-pad);x1=min(cw,x1+pad);y1=min(ch,y1+pad)
    return [c.crop((x0,y0,x1,y1)) for c in cells],(x1-x0,y1-y0)
def recolor_blue(img,delta):
    a=np.array(img).astype(int); R,G,B,A=a[...,0],a[...,1],a[...,2],a[...,3]
    m=(A>40)&(B>R)&(B>G)&((B-np.maximum(R,G))>15)&(B>40)
    for c,d in enumerate(delta): a[...,c]=np.where(m,np.clip(a[...,c]+d,0,255),a[...,c])
    return Image.fromarray(a.astype('uint8'),'RGBA')
def anchor(fr):
    a=np.array(fr); R,G,B=a[...,0].astype(int),a[...,1].astype(int),a[...,2].astype(int); al=a[...,3]>30
    m=al&((B-np.maximum(R,G))>30)&(B>60)
    if m.any():
        lab,n=ndimage.label(m)
        if n>1: m=(lab==(int(np.argmax(ndimage.sum(m,lab,range(1,n+1))))+1))
        al=m
    ys,xs=np.where(al)
    if len(ys)==0: al2=a[...,3]>30; ys,xs=np.where(al2)
    return (xs.min()+xs.max())/2.0,int(ys.min()),int(ys.max())

# ---- variant recolor ----
def rgb2hsv(a):
    r,g,b=a[...,0]/255.,a[...,1]/255.,a[...,2]/255.
    mx=np.maximum(np.maximum(r,g),b); mn=np.minimum(np.minimum(r,g),b); d=mx-mn
    h=np.zeros_like(mx); m=d>1e-6
    rr=((mx==r)&m); gg=((mx==g)&m); bb=((mx==b)&m)
    h[rr]=((g-b)[rr]/d[rr])%6; h[gg]=((b-r)[gg]/d[gg])+2; h[bb]=((r-g)[bb]/d[bb])+4
    return h/6.0, np.where(mx>0,d/np.maximum(mx,1e-6),0), mx
def hsv2rgb(h,s,v):
    i=np.floor(h*6).astype(int); f=h*6-i; i=i%6
    p=v*(1-s); q=v*(1-f*s); t=v*(1-(1-f)*s)
    r=np.choose(i,[v,q,p,p,t,v]); g=np.choose(i,[t,v,v,q,p,p]); b=np.choose(i,[p,p,t,v,v,q])
    return np.stack([r,g,b],-1)*255
def robe_mask(a):
    R,G,B,A=a[...,0],a[...,1],a[...,2],a[...,3]
    return (A>40)&(B>R)&(B>G)&((B-np.maximum(R,G))>15)&(B>40)
def skull_mask(a):
    R,G,B,A=a[...,0],a[...,1],a[...,2],a[...,3]; mn=np.minimum(np.minimum(R,G),B); mx=np.maximum(np.maximum(R,G),B)
    return (A>40)&(mn>120)&((mx-mn)<60)
def eyes_mask(a):
    sk=skull_mask(a)
    if sk.sum()<12: return np.zeros(sk.shape,bool)
    ys0=np.where(sk)[0]; top=ys0.min(); h=max(1,ys0.max()-top)
    def filt(cand):
        lab,n=ndimage.label(cand); keep=np.zeros(cand.shape,bool)
        for i in range(1,n+1):
            comp=(lab==i); sz=comp.sum()
            if sz<3 or sz>140: continue
            if np.where(comp)[0].mean()<top+h*0.66: keep|=comp
        return keep
    skc=ndimage.binary_closing(sk,iterations=4)
    prim=filt(ndimage.binary_fill_holes(skc)&~skc)
    if prim.sum()>0: return prim
    R,G,B,A=a[...,0],a[...,1],a[...,2],a[...,3]
    dark=(A>40)&(np.maximum(np.maximum(R,G),B)<115)
    left=np.zeros(sk.shape,bool); right=np.zeros(sk.shape,bool); up=np.zeros(sk.shape,bool)
    for s in range(1,8): left|=np.roll(sk,s,1); right|=np.roll(sk,-s,1); up|=np.roll(sk,s,0)
    return filt(dark&left&right&up)
def apply_variant(img, spec):
    if spec is None: return img
    a=np.array(img).astype(float); A=a[...,3]; m=robe_mask(a); h,s,v=rgb2hsv(a)
    h=np.where(m,spec["hue"],h); s=np.where(m,np.clip(s*spec.get("sat",1.0),0,1),s)
    a[...,:3]=np.where(m[...,None],hsv2rgb(h,s,v),a[...,:3])
    if not spec.get("red"):
        return Image.fromarray(np.clip(a,0,255).astype('uint8'),'RGBA')
    # whole-shape detection from ORIGINAL art: grow bone-white seeds to full enclosed skull/hand shapes
    orig=np.array(img).astype(int); oR,oG,oB,oA=orig[...,0],orig[...,1],orig[...,2],orig[...,3]
    omn=np.minimum(np.minimum(oR,oG),oB); omx=np.maximum(np.maximum(oR,oG),oB)
    cloak0=robe_mask(orig)
    white=(oA>40)&(omn>168)&((omx-omn)<26)        # bone-white seeds (skull + hands)
    lab,n=ndimage.label(white)
    if n==0: return Image.fromarray(np.clip(a,0,255).astype('uint8'),'RGBA')
    comps=[]
    for i in range(1,n+1):
        c=lab==i; ys,xs=np.where(c); comps.append((i,int(c.sum()),xs.mean(),ys.mean(),int(xs.min()),int(xs.max()),int(ys.min()),int(ys.max())))
    Hf=img.height
    up=[c for c in comps if c[3]<Hf*0.62]; skull=max(up,key=lambda c:c[1]) if up else max(comps,key=lambda c:c[1])
    skcx=skull[2]; skw=max(8,skull[5]-skull[4]); sky0=skull[6]
    seed=(lab==skull[0])
    for c in comps:                               # hand seeds: near body, not far scythe
        if c[0]==skull[0]: continue
        if 6<=c[1]<=240 and abs(c[2]-skcx)<skw*2.4 and c[3]>sky0: seed|=(lab==c[0])
    # grow seeds across the full enclosed shape (white + grey shadow tones), stopped by outline + cloak
    outline=(oA>40)&(omx<70)
    interior=(oA>40)&(~cloak0)&(~outline)
    ilab,inu=ndimage.label(interior)
    seed_ids=set(int(v) for v in np.unique(ilab[seed]) if v>0)
    shape=np.isin(ilab,list(seed_ids)) if seed_ids else seed
    # eye = largest cyan blob inside skull bbox
    pad=2; ex0,ex1,ey0,ey1=max(0,skull[4]-pad),skull[5]+pad,max(0,skull[6]-pad),skull[7]+pad
    box=np.zeros(white.shape,bool); box[ey0:ey1+1,ex0:ex1+1]=True
    eyec=(oA>40)&box&((oB-oR)>6)&((oG-oR)>-6)&(omx>70)&~white
    elab,en=ndimage.label(eyec); eye=np.zeros(eyec.shape,bool)
    if en>0:
        szs=[(elab==i).sum() for i in range(1,en+1)]; mxsz=max(szs)
        for i in range(1,en+1):
            if (elab==i).sum()>=max(4,0.3*mxsz): eye|=(elab==i)
    # recolor full shape to black (keep slight luminance form); nothing light left over
    dk=np.clip(omx*0.16,0,46)
    for ci in range(3): a[...,ci]=np.where(shape,dk,a[...,ci])
    a[eye]=[255,205,55,255]                        # flat gold eye, no glow
    return Image.fromarray(np.clip(a,0,255).astype('uint8'),'RGBA')

def weapon_boxes(frames):
    al=[(np.array(f.split()[3])>40) for f in frames]
    persist=np.mean(al,axis=0); body=persist>0.5
    out=[]
    for a in al:
        w=a&(~body); ys,xs=np.where(w)
        out.append([int(xs.min()),int(ys.min()),int(xs.max()),int(ys.max())] if len(xs)>=8 else None)
    return out

def weapon_boxes_silver(frames):
    out=[]
    for f in frames:
        a=np.array(f); op=a[...,3]>40
        R,G,B=a[...,0].astype(int),a[...,1].astype(int),a[...,2].astype(int)
        mx=np.maximum(np.maximum(R,G),B); mn2=np.minimum(np.minimum(R,G),B)
        sat=np.where(mx>0,(mx-mn2)/np.maximum(mx,1),1.0)
        sil=op&(sat<0.30)&(mx>110)
        lab,n=ndimage.label(sil)
        keep=np.zeros(sil.shape,bool)
        for i in range(1,n+1):
            c=lab==i
            if int(c.sum())>=60: keep|=c
        ys,xs=np.where(keep)
        out.append([int(xs.min()),int(ys.min()),int(xs.max()),int(ys.max())] if len(xs)>=8 else None)
    return out

def save_strip(strip):
    alpha = strip.split()[3]
    p = strip.convert("RGB").quantize(colors=255, method=Image.MEDIANCUT, dither=Image.NONE)
    pal = p.getpalette(); pal = pal + [0,0,0]*(256 - len(pal)//3); p.putpalette(pal)
    p.paste(255, alpha.point(lambda a: 255 if a < 128 else 0))
    buf = io.BytesIO(); p.save(buf, format="PNG", transparency=255)
    return buf

# build base frames + geometry per anim, then variants
def process_cells(name, cells, cw, ch, sc_override=None):
    frames,(uw,uh)=union_crop(cells,cw,ch)
    cxs0,tops,bots=[],[],[]
    use_alpha = name in ("hurt","kneel")   # poses split the robe; anchor true content bottom instead
    for fr in frames:
        if use_alpha:
            al=np.array(fr.split()[3])>40; ys=np.where(al.any(1))[0]; xs=np.where(al.any(0))[0]
            cx=(int(xs.min())+int(xs.max()))/2.0; t=int(ys.min()); bb=int(ys.max())
        else:
            cx,t,bb=anchor(fr)
        cxs0.append(cx); tops.append(t); bots.append(bb)
    med=float(np.median([b-t+1 for t,b in zip(tops,bots)]))
    sc = sc_override if sc_override else TARGET/med
    fo = 0 if use_alpha else 0.04*med
    dw,dh=max(1,round(uw*sc)),max(1,round(uh*sc))
    foots=[min(dh,max(1,round((b+fo+1)*sc))) for b in bots]
    cxs=[max(0,round(cx*sc)) for cx in cxs0]
    if name in PLANT:
        fc=int(round(np.median(foots))); cc=int(round(np.median(cxs))); foots=[fc]*len(foots); cxs=[cc]*len(cxs)
    cap = 190 if name=="hurt" else STORE_CAP        # hurt is masked by tint/flicker; store lighter
    q=min(1.0,cap/dh); sw,sh=max(1,round(dw*q)),max(1,round(dh*q))
    bd={"frames":frames,"dw":dw,"dh":dh,"sw":sw,"sh":sh,"foots":foots,"cxs":cxs,"sc":sc}
    if name=="attack":
        wb=weapon_boxes(frames); sx_=dw/uw; sy_=dh/uh
        bd["weapon"]=[([round(b[0]*sx_),round(b[1]*sy_),round(b[2]*sx_),round(b[3]*sy_)] if b else None) for b in wb]
    return bd

base = {}
idle_sc=None; idle_cw=None
for name,p in SHEETS.items():
    cols,rows=GRIDS.get(name,(5,5))
    cells,cw,ch=slice_sheet(p,cols,rows)
    a,b=RANGES.get(name,(0,cols*rows)); cells=cells[a:b]
    if name in RECOLOR: cells=[recolor_blue(c,RECOLOR[name]) for c in cells]
    # hurt: pose compresses the robe, so inherit idle's scale (res-adjusted) instead of self-normalizing
    ov = (idle_sc*(idle_cw/cw)) if (name in ("hurt","cast") and idle_sc) else None
    base[name]=process_cells(name,cells,cw,ch,ov)
    if name=="idle": idle_sc=base[name]["sc"]; idle_cw=cw
import zipfile
with zipfile.ZipFile(U+"9487a481-cReaperKneel.zip") as zf: zf.extractall("/tmp/kneel")
kn=[Image.open("/tmp/kneel/%02d.png"%i).convert("RGBA") for i in range(1,20)]
base["kneel"]=process_cells("kneel",kn,256,256, idle_sc*(idle_cw/256))

chars={}
for vname,spec in VARIANTS.items():
    chars[vname]={}
    for name,bd in base.items():
        vf=[apply_variant(fr,spec).resize((bd["sw"],bd["sh"]),Image.LANCZOS) for fr in bd["frames"]]
        strip=Image.new("RGBA",(bd["sw"]*len(vf),bd["sh"]),(0,0,0,0))
        for i,f in enumerate(vf): strip.paste(f,(i*bd["sw"],0),f)
        buf=save_strip(strip)
        entry={"sw":bd["sw"],"sh":bd["sh"],"w":bd["dw"],"h":bd["dh"],"frames":len(vf),
               "foots":bd["foots"],"cxs":bd["cxs"],
               "src":"data:image/png;base64,"+base64.b64encode(buf.getvalue()).decode()}
        if "weapon" in bd: entry["weapon"]=bd["weapon"]
        chars[vname][name]=entry
    print("variant",vname,"built")

def make_soul(path,th=52,N=30):
    src=Image.open(path).convert("RGBA"); al=np.array(src.split()[3])
    ys=np.where(al.any(axis=1))[0]; xs=np.where(al.any(axis=0))[0]
    orb=src.crop((xs.min(),ys.min(),xs.max()+1,ys.max()+1)).resize((round((xs.max()-xs.min()+1)*th/(ys.max()-ys.min()+1)),th),Image.LANCZOS)
    ow,oh=orb.size; sil=orb.split()[3]; pad=int(max(ow,oh)*0.5); CW,CH=ow+2*pad,oh+2*pad; Ab=oh*0.08; fr=[]
    for i in range(N):
        t=i/N; bob=int(round(Ab*np.sin(2*np.pi*t))); g=0.5+0.5*np.sin(2*np.pi*t)
        c=Image.new("RGBA",(CW,CH),(0,0,0,0))
        glow=Image.composite(Image.new("RGBA",(ow,oh),(95,205,255,255)),Image.new("RGBA",(ow,oh),(0,0,0,0)),sil).filter(ImageFilter.GaussianBlur(radius=max(3,ow*0.11)))
        ga=np.array(glow); ga[...,3]=(ga[...,3]*(0.30+0.55*g)).astype("uint8"); glow=Image.fromarray(ga,"RGBA")
        gs=1.0+0.10*g; gbb=glow.resize((int(ow*gs),int(oh*gs)),Image.LANCZOS)
        c.alpha_composite(gbb,(int((CW-gbb.width)/2),int((CH-gbb.height)/2)+bob))
        ob=np.array(orb).astype(float); ob[...,:3]=np.clip(ob[...,:3]*(1.0+0.05*g),0,255)
        c.alpha_composite(Image.fromarray(ob.astype("uint8"),"RGBA"),(pad,pad+bob)); fr.append(c)
    return fr,CW,CH
sfr,scw,sch=make_soul(SOUL_IMG)
sstrip=Image.new("RGBA",(scw*len(sfr),sch),(0,0,0,0))
for i,f in enumerate(sfr): sstrip.paste(f,(i*scw,0))
sbuf=io.BytesIO(); sstrip.save(sbuf,format="PNG",optimize=True)
soul={"sw":scw,"sh":sch,"w":scw,"h":sch,"frames":len(sfr),"src":"data:image/png;base64,"+base64.b64encode(sbuf.getvalue()).decode()}

def make_obj(path, target_h, thr=110):
    im=Image.open(path).convert("RGBA"); al=np.array(im.split()[3])
    m=al>thr
    if not m.any(): m=al>0
    ys=np.where(m.any(axis=1))[0]; xs=np.where(m.any(axis=0))[0]
    im=im.crop((int(xs.min()),int(ys.min()),int(xs.max()+1),int(ys.max()+1)))
    w=max(1,round(im.width*target_h/im.height)); im=im.resize((w,target_h),Image.LANCZOS)
    buf=save_strip(im)
    return {"w":w,"h":target_h,"src":"data:image/png;base64,"+base64.b64encode(buf.getvalue()).decode()}
obst={"crate":make_obj(U+"69c93222-crate.png",84),"grave":make_obj(U+"dd50c7ce-gravestone.png",104)}
print("obst crate",obst["crate"]["w"],"x",obst["crate"]["h"],"| grave",obst["grave"]["w"],"x",obst["grave"]["h"])

# ---- background trees (use provided art) ----
def make_tree(path, target_h):
    im=Image.open(path).convert("RGBA"); al=np.array(im.split()[3])>30
    ys=np.where(al.any(axis=1))[0]; xs=np.where(al.any(axis=0))[0]
    im=im.crop((int(xs.min()),int(ys.min()),int(xs.max()+1),int(ys.max()+1)))
    w=max(1,round(im.width*target_h/im.height)); im=im.resize((w,target_h),Image.LANCZOS)
    buf=save_strip(im)
    return {"w":w,"h":target_h,"src":"data:image/png;base64,"+base64.b64encode(buf.getvalue()).decode()}
trees={"big":make_tree(U+"5f05bb78-big_tree.png",172),"small":make_tree(U+"b952b0fb-small_tree.png",122)}
def make_tile(path,size):
    im=Image.open(path).convert("RGBA").resize((size,size),Image.LANCZOS)
    buf=io.BytesIO(); im.save(buf,"PNG",optimize=True)
    return {"w":size,"h":size,"src":"data:image/png;base64,"+base64.b64encode(buf.getvalue()).decode()}
dirt=make_tile(U+"ea65837d-dirt.png",150)
gate=make_obj(U+"4fe929b7-gate.png",90,thr=45)
def make_grass(path, target_h):
    im=Image.open(path).convert("RGBA"); al=np.array(im.split()[3])>30
    ys=np.where(al.any(axis=1))[0]; xs=np.where(al.any(axis=0))[0]
    im=im.crop((int(xs.min()),int(ys.min()),int(xs.max()+1),int(ys.max()+1)))
    w=max(1,round(im.width*target_h/im.height)); im=im.resize((w,target_h),Image.LANCZOS)
    buf=io.BytesIO(); im.save(buf,"PNG",optimize=True)
    return {"w":w,"h":target_h,"src":"data:image/png;base64,"+base64.b64encode(buf.getvalue()).decode()}
grass=make_grass(U+"0c97adc9-grasstopper.png",30)
print("grass tile",grass["w"],"x",grass["h"])
print("dirt tile",dirt["w"],"| gate",gate["w"],"x",gate["h"])
print("trees big",trees["big"]["w"],"x",trees["big"]["h"],"| small",trees["small"]["w"],"x",trees["small"]["h"])

# ---- zombie knight enemy (frame folders) ----
def load_frames(folder,count):
    return [Image.open(folder+("/%02d.png"%i)).convert("RGBA") for i in range(1,count+1)]
def build_anim(frames, sc, want_weapon=False):
    arrs=[np.array(f.split()[3])>30 for f in frames]; cw,chh=frames[0].size
    x0=min(int(np.where(a.any(0))[0].min()) for a in arrs); x1=max(int(np.where(a.any(0))[0].max()) for a in arrs)
    y0=min(int(np.where(a.any(1))[0].min()) for a in arrs); y1=max(int(np.where(a.any(1))[0].max()) for a in arrs)
    pad=4; x0=max(0,x0-pad);y0=max(0,y0-pad);x1=min(cw,x1+pad);y1=min(chh,y1+pad)
    cr=[f.crop((x0,y0,x1+1,y1+1)) for f in frames]; uw,uh=cr[0].size
    foots=[]; cxs=[]
    for f in cr:
        al=np.array(f.split()[3])>40; ys=np.where(al.any(1))[0]
        foots.append(int(ys.max())+1)
        # body center from bottom 45% (legs) for stable horizontal anchor
        cut=int(uh*0.55); sub=al[cut:,:]; xs2=np.where(sub.any(0))[0]
        cxs.append((int(xs2.min())+int(xs2.max()))/2 if len(xs2) else uw/2)
    dw,dh=max(1,round(uw*sc)),max(1,round(uh*sc))
    foot=min(dh,int(round(np.median(foots)*sc))); cx=int(round(np.median(cxs)*sc))
    q=min(1.0,STORE_CAP/dh); sw,sh=max(1,round(dw*q)),max(1,round(dh*q))
    rs=[f.resize((sw,sh),Image.LANCZOS) for f in cr]
    strip=Image.new("RGBA",(sw*len(rs),sh),(0,0,0,0))
    for i,f in enumerate(rs): strip.paste(f,(i*sw,0),f)
    buf=save_strip(strip)
    res={"sw":sw,"sh":sh,"w":dw,"h":dh,"frames":len(rs),"foots":[foot]*len(rs),"cxs":[cx]*len(rs),
            "src":"data:image/png;base64,"+base64.b64encode(buf.getvalue()).decode()}
    if want_weapon:
        wb=weapon_boxes_silver(cr) if want_weapon=='silver' else weapon_boxes(cr); res["weapon"]=[([round(b[0]*sc),round(b[1]*sc),round(b[2]*sc),round(b[3]*sc)] if b else None) for b in wb]
    return res,uh
ZF_idle=load_frames("/tmp/840de037-zombieidle",49)
ZF_walk=load_frames("/tmp/4623bbc5-zombiewalk",23)
ZF_atk =load_frames("/tmp/73bd9e8a-zombieattack",13)
ZTH=120
# measure body heights to scale consistently (attack uses walk's scale since same source res + raised sword)
def uh_of(frames):
    arrs=[np.array(f.split()[3])>30 for f in frames]
    y0=min(int(np.where(a.any(1))[0].min()) for a in arrs); y1=max(int(np.where(a.any(1))[0].max()) for a in arrs)
    return (y1-y0+9)
sci=ZTH/uh_of(ZF_idle); scw=ZTH/uh_of(ZF_walk)
zid,_=build_anim(ZF_idle,sci); zwk,_=build_anim(ZF_walk,scw); zat,_=build_anim(ZF_atk,scw,want_weapon=True)
zombie={"idle":zid,"walk":zwk,"attack":zat}
print("zombie idle",zid["w"],"x",zid["h"],"| walk",zwk["w"],"x",zwk["h"],"| attack",zat["w"],"x",zat["h"])

# ---- Zombie GENERAL: black armor, pale blue flesh, red eyes ----
def zgen_recolor(fr):
    a=np.array(fr).astype(float); A=a[...,3]>40
    R,G,B=a[...,0],a[...,1],a[...,2]
    mx=np.maximum(np.maximum(R,G),B); mn=np.minimum(np.minimum(R,G),B)
    d=np.maximum(mx-mn,1e-6); sat=np.where(mx>0,(mx-mn)/np.maximum(mx,1),0); val=mx/255.0
    hch=np.zeros_like(mx)
    rr=(mx==R)&(d>1); gg=(mx==G)&(d>1); bb=(mx==B)&(d>1)
    hch[rr]=((G-B)[rr]/d[rr])%6; hch[gg]=((B-R)[gg]/d[gg])+2; hch[bb]=((R-G)[bb]/d[bb])+4
    hch=hch/6.0
    flesh=A&(hch>=0.2)&(hch<0.45)&(sat>0.15)
    metal=A&(sat<0.16)&(val>0.18)&(~flesh)
    # all gold/yellow (eye + chest jewel + accents) goes red; wide range so shaded gold doesn't leak
    eye=A&(hch>=0.03)&(hch<0.21)&(sat>0.22)&(val>0.30)
    out=a.copy()
    # black armor: crush value, cool tint
    v2=val*0.30+0.03
    out[...,0]=np.where(metal, v2*255*0.92, out[...,0])
    out[...,1]=np.where(metal, v2*255*0.96, out[...,1])
    out[...,2]=np.where(metal, v2*255*1.10, out[...,2])
    # pale blue flesh: hue->0.58, low sat, lifted value
    pv=np.clip(val*1.30+0.10,0,1); ps=0.30
    pr=pv*(1-ps); pg=pv*(1-ps*0.35); pb=pv
    out[...,0]=np.where(flesh, pr*255, out[...,0])
    out[...,1]=np.where(flesh, pg*255, out[...,1])
    out[...,2]=np.where(flesh, pb*255, out[...,2])
    # red eyes (keep shading from value)
    ev=np.clip(val*1.15,0,1)
    out[...,0]=np.where(eye, np.clip(ev*255*1.05,0,255), out[...,0])
    out[...,1]=np.where(eye, ev*48, out[...,1])
    out[...,2]=np.where(eye, ev*40, out[...,2])
    return Image.fromarray(np.clip(out,0,255).astype("uint8"),"RGBA")
GF_idle=[zgen_recolor(f) for f in ZF_idle]
GF_walk=[zgen_recolor(f) for f in ZF_walk]
GF_atk =[zgen_recolor(f) for f in ZF_atk]
gid,_=build_anim(GF_idle,sci); gwk,_=build_anim(GF_walk,scw); gat,_=build_anim(GF_atk,scw,want_weapon=True)
zgen={"idle":gid,"walk":gwk,"attack":gat}
print("zgen built")


# ---- Goblin Grunt: 3 sheets, ground enemy, spear weapon boxes ----
def stray_clean(fr):
    """drop opaque components disconnected from the main body that are bright or tiny (bg leftovers); spear stays (connected to hand)"""
    a=np.array(fr); op=a[...,3]>30
    lab,n=ndimage.label(op)
    if n<=1: return fr
    sizes=ndimage.sum(op,lab,range(1,n+1)); main=int(np.argmax(sizes))+1
    R,G,B=a[...,0].astype(int),a[...,1].astype(int),a[...,2].astype(int)
    mn=np.minimum(np.minimum(R,G),B)
    kill=np.zeros(op.shape,bool)
    for i in range(1,n+1):
        if i==main: continue
        c=lab==i; sz=int(sizes[i-1])
        if sz<30 or np.median(mn[c])>135: kill|=c
    if kill.any(): a[...,3]=np.where(kill,0,a[...,3])
    return Image.fromarray(a,'RGBA')

GOB_idle_c, gcw_i, _ = slice_sheet(U+"602889d3-4837.png", 5,5)
GOB_walk_c, gcw_w, _ = slice_sheet(U+"5b24ffea-4838.png", 5,5)
GOB_atk_c,  gcw_a, _ = slice_sheet(U+"fad1efc1-4840.png", 7,7)
GOB_walk_c=[stray_clean(c) for c in GOB_walk_c[0:24]]
GOB_idle_c=GOB_idle_c[0:25]
GOB_atk_c=[stray_clean(c) for c in GOB_atk_c[9:34]]
GTH=92
gsci=GTH/uh_of(GOB_idle_c); gscw=GTH/uh_of(GOB_walk_c)
gsa=gscw*(gcw_w/gcw_a)
gid2,_=build_anim(GOB_idle_c,gsci); gwk2,_=build_anim(GOB_walk_c,gscw); gat2,_=build_anim(GOB_atk_c,gsa,want_weapon="silver")
gob={"idle":gid2,"walk":gwk2,"attack":gat2}
print("gob idle",gid2["w"],"x",gid2["h"],"| walk",gwk2["w"],"x",gwk2["h"],"| attack",gat2["w"],"x",gat2["h"],"| wpn frames",sum(1 for b in gat2["weapon"] if b))

# ---- Blood Ravager (flying bat): per-frame centroid anchors ----
def debris_clean(fr):
    """remove large bright background chunks stuck to the sprite; keep teeth/eyes (small clusters)"""
    a=np.array(fr); op=a[...,3]>40
    R,G,B=a[...,0].astype(int),a[...,1].astype(int),a[...,2].astype(int)
    mn=np.minimum(np.minimum(R,G),B)
    core=op&(mn>150)
    lab,n=ndimage.label(core)
    if n==0: return fr
    bad=np.zeros(core.shape,bool)
    for i in range(1,n+1):
        c=lab==i
        if c.sum()>=60: bad|=c
    if not bad.any(): return fr
    # grow into bright AA fringe
    fringe=op&(mn>110)
    bad=ndimage.binary_propagation(bad, mask=fringe)
    # fill with median of nearby dark opaque pixels
    ring=ndimage.binary_dilation(bad,iterations=7)&op&(~bad)&(mn<=110)
    if ring.any():
        fill=[int(np.median(ch[ring])) for ch in (a[...,0],a[...,1],a[...,2])]
    else:
        fill=[26,20,34]
    for ci in range(3): a[...,ci]=np.where(bad, fill[ci], a[...,ci])
    return Image.fromarray(a,'RGBA')

def build_bat_anim(path, cols, rows, n0, n1, sc_force=None, clean=False, mirror=False):
    cells, cw, ch = slice_sheet(path, cols, rows)
    cells = cells[n0:n1]
    if clean: cells=[debris_clean(c) for c in cells]
    if mirror: cells=[c.transpose(Image.FLIP_LEFT_RIGHT) for c in cells]
    frames,(uw,uh) = union_crop(cells, cw, ch)
    bcx, bcy, bhh = [], [], []
    for fr in frames:
        al = np.array(fr.split()[3]) > 40
        ys2, xs2 = np.where(al)
        bcx.append(float(xs2.mean())); bcy.append(float(ys2.mean()))
        yy = np.where(al.any(1))[0]; bhh.append(int(yy.max())-int(yy.min())+1)
    sc = sc_force if sc_force else 116.0 / float(np.median(bhh))
    dw, dh = max(1,round(uw*sc)), max(1,round(uh*sc))
    q = min(1.0, STORE_CAP/dh); sw2, sh2 = max(1,round(dw*q)), max(1,round(dh*q))
    strip = Image.new("RGBA", (sw2*len(frames), sh2), (0,0,0,0))
    for i2,fr in enumerate(frames):
        strip.paste(fr.resize((sw2,sh2), Image.LANCZOS), (i2*sw2, 0))
    buf = save_strip(strip)
    return ({"src":"data:image/png;base64,"+base64.b64encode(buf.getvalue()).decode(),
             "sw":sw2,"sh":sh2,"w":dw,"h":dh,"frames":len(frames),
             "cxs":[int(round(c*sc)) for c in bcx],"cys":[int(round(c*sc)) for c in bcy]}, sc, cw)

# ---- checkpoint statue (purple flame overlay extracted for flicker) ----
_st=Image.open(U+"0434a0b6-4844.png").convert("RGBA")
_sa=np.array(_st.split()[3])>40
_ys=np.where(_sa.any(1))[0]; _xs=np.where(_sa.any(0))[0]
_st=_st.crop((int(_xs.min()),int(_ys.min()),int(_xs.max())+1,int(_ys.max())+1))
STH=150; _sw=max(1,round(_st.width*STH/_st.height))
_st=_st.resize((_sw,STH), Image.LANCZOS)
_a=np.array(_st).astype(float); _op=_a[...,3]>40
_h,_s,_v=rgb2hsv(_a)
_fl=_op&(_h>0.66)&(_h<0.95)&(_s>0.28)&(_v>0.42)
_fl=ndimage.binary_dilation(_fl,iterations=1)
lab,_n=ndimage.label(_fl)
braz=np.zeros_like(_fl); fpts=[]
for i in range(1,_n+1):
    c=lab==i; sz=int(c.sum())
    if sz<50: continue
    ys2,xs2=np.where(c); cx2,cy2=xs2.mean(),ys2.mean()
    if cx2<_sw*0.32 or cx2>_sw*0.68:      # edge braziers only; gem/eyes stay on the statue
        braz|=c; fpts.append([int(cx2),int(cy2),sz])
fpts=sorted(fpts,key=lambda q:-q[2])[:2]
flame=np.zeros_like(_a); flame[braz]=_a[braz]
flame_img=Image.fromarray(np.clip(flame,0,255).astype("uint8"),"RGBA")
_a2=_a.copy(); _a2[...,3]=np.where(braz,0,_a2[...,3])   # dormant braziers in base
_st=Image.fromarray(np.clip(_a2,0,255).astype("uint8"),"RGBA")
_b1=save_strip(_st); _b2=save_strip(flame_img)
chkst={"src":"data:image/png;base64,"+base64.b64encode(_b1.getvalue()).decode(),
       "flame":"data:image/png;base64,"+base64.b64encode(_b2.getvalue()).decode(),
       "w":_sw,"h":STH,"fpts":[[p2[0],p2[1]] for p2 in fpts]}
print("statue", _sw,"x",STH,"| flame pts",len(fpts),fpts)

# ---- drifting cloud ----
_cl=Image.open(U+"0c6f5967-cloud.png").convert("RGBA")
_ca=np.array(_cl.split()[3])>20
_ys=np.where(_ca.any(1))[0]; _xs=np.where(_ca.any(0))[0]
_cl=_cl.crop((int(_xs.min()),int(_ys.min()),int(_xs.max())+1,int(_ys.max())+1))
_ch=96; _cw2=max(1,round(_cl.width*_ch/_cl.height))
_cl=_cl.resize((_cw2,_ch), Image.LANCZOS)
_cbuf=save_strip(_cl)
cloud={"src":"data:image/png;base64,"+base64.b64encode(_cbuf.getvalue()).decode(),"w":_cw2,"h":_ch}
print("cloud", _cw2, "x", _ch)

bat_idle, bsc_i, bcw_i = build_bat_anim(U+"3f3080c2-Blood_Ravageridle.png", 5,5, 0,21)
bat_bite, _, _ = build_bat_anim(U+"1d26e9e5-Blood_Ravagerevil_bite.png", 7,7, 0,30, sc_force=bsc_i*(bcw_i/512.0), clean=True, mirror=True)
bat = {"idle":bat_idle, "bite":bat_bite}
print("bat idle", bat_idle["w"],"x",bat_idle["h"], "| bite", bat_bite["w"],"x",bat_bite["h"], "frames", bat_bite["frames"])

STAGE1={
 "world":10800, "goal":10700,
 "seg":[[0,1080],[1200,2120],[2320,3260],[3380,4640],[4760,5640],[5880,6980],[7320,8480],[8600,9560],[9700,10800]],
 "obst":[{"x":520,"type":"grave"},{"x":860,"type":"crate"},{"x":1700,"type":"grave"},{"x":2700,"type":"crate"},
   {"x":3700,"type":"grave"},{"x":4360,"type":"crate"},{"x":4980,"type":"crate"},{"x":5300,"type":"grave"},
   {"x":6300,"type":"grave"},{"x":8820,"type":"crate"},{"x":9200,"type":"grave"},{"x":10000,"type":"grave"},{"x":10350,"type":"crate"}],
 "plats":[{"x":3500,"y":240,"w":150,"t":"s"},{"x":3760,"y":150,"w":130,"t":"s"},{"x":4020,"y":240,"w":150,"t":"s"},{"x":4260,"y":130,"w":120,"t":"s"},
   {"x":6060,"y":250,"w":140,"t":"s"},{"x":6310,"y":160,"w":130,"t":"s"},{"x":6560,"y":250,"w":140,"t":"s"},
   {"x0":7010,"y":270,"w":130,"t":"m","range":170,"spd":0.30},
   {"x":8880,"y":250,"w":120,"t":"c"},{"x":9110,"y":160,"w":120,"t":"c"},{"x":9330,"y":250,"w":120,"t":"c"}],
 "chk":[3470,6020,7430,8650],
 "souls":[[300,210],[700,210],[1140,170],[1500,210],[1950,210],[2200,160],[2240,130],[2280,160],[2900,210],
   [3575,180],[3825,90],[4095,180],[4320,70],[4320,30],[5100,210],[5500,210],
   [6130,190],[6375,100],[6375,60],[6630,190],[7075,200],[7150,200],[7225,200],
   [8940,190],[9170,100],[9390,190],[9620,160],[10150,210],[10550,210]],
 "enemies":[[1500,1260,2000],[2700,2400,3150],[4900,4800,5520],[5350,4850,5560],
   [8800,8650,9440],[9300,8700,9480],[10050,9750,10580,"zgen"],[10420,9800,10620,"zgen"],
   [820,200,1040,"gob"],[3050,2400,3220,"gob"],[4180,3420,4600,"gob"],[6650,5920,6940,"gob"],[9050,8650,9520,"gob"]],
 "bats":[[2620,2380,3200,225],[5150,4800,5600,230],[7900,7420,8420,215],[10100,9760,10640,225]]
}

SPRITES={"chars":chars,"soul":soul,"obst":obst,"trees":trees,"dirt":dirt,"gate":gate,"grass":grass,"zombie":zombie,"zgen":zgen,"gob":gob,"bat":bat,"cloud":cloud,"chkst":chkst,"order":list(VARIANTS.keys())}

import os, copy
HEAD=open("game_head.txt",encoding="utf-8").read()
JS=open("game_js.txt",encoding="utf-8").read()
TAIL="\n</script>\n</body>\n</html>\n"

# ---------- repo tree ----------
REPO="creapz"
os.makedirs(REPO+"/assets/sprites",exist_ok=True)
os.makedirs(REPO+"/src",exist_ok=True)
os.makedirs(REPO+"/levels",exist_ok=True)
os.makedirs(REPO+"/tools",exist_ok=True)
SP_EXT=copy.deepcopy(SPRITES)
def externalize(o, crumb):
    for k in list(o.keys()):
        v=o[k]
        if k in ("src","flame") and isinstance(v,str) and v.startswith("data:"):
            fname="_".join(crumb+([k] if k=="flame" else []))+".png"
            raw=base64.b64decode(v.split(",")[1])
            open(REPO+"/assets/sprites/"+fname,"wb").write(raw)
            o[k]="sprites/"+fname
        elif isinstance(v,dict):
            externalize(v,crumb+[k])
externalize(SP_EXT,[])
open(REPO+"/assets/sprites.json","w",encoding="utf-8").write(json.dumps(SP_EXT))
open(REPO+"/levels/stage1.js","w",encoding="utf-8").write("window.STAGE1="+json.dumps(STAGE1)+";\n")
open(REPO+"/src/engine.js","w",encoding="utf-8").write(JS)
repo_head=HEAD.replace("<script>",
  '<script src="./levels/stage1.js"></script>\n<script src="./src/engine.js"></script>\n</body>\n</html>')
open(REPO+"/index.html","w",encoding="utf-8").write(repo_head)
open(REPO+"/vercel.json","w",encoding="utf-8").write(json.dumps({
  "headers":[{"source":"/assets/(.*)","headers":[{"key":"Cache-Control","value":"public, max-age=86400"}]}]
},indent=2)+"\n")
n_assets=len(os.listdir(REPO+"/assets/sprites"))
print("repo emitted:",n_assets,"sprite files")

# ---------- single-file fallback ----------
inline="<script>window.STAGE1="+json.dumps(STAGE1)+";window.SPRITES_INLINE="+json.dumps(SPRITES)+";</script>\n<script>\n"
game = HEAD.replace("<script>", inline.rstrip("\n")) + "\n" + JS + TAIL
open("creaperz_game.html","w",encoding="utf-8").write(game)
print("HTML MB", round(len(game)/1048576,2), "ok", len(game)>1000)

# engine syntax check artifact
open("engine_check.js","w",encoding="utf-8").write("var window={STAGE1:"+json.dumps(STAGE1)+",SPRITES_INLINE:{}};\n"+JS)
