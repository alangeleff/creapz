"""Witchwood I: generated layout for the cReapZ builder bench (config/bench/witch1.json).

Run:  python3 tools/stagegen/witch1.py         -> writes the stage, checks every jump, renders a map
The checker uses the engine's own physics (src/engine.js): GRAV 0.6/frame, JUMP -13.2, WALK 3.7, RUN 7.4,
player 52x88, landing needs the player's centre over the surface (platforms get +-8px)."""
import json, math, sys, os
sys.path.insert(0, os.path.dirname(__file__))
from check import check_stage, render_map

G = 620            # forest floor (top of ground)
H = 760            # stage height: the camera scrolls 320px up into the canopy
DEEP = H - G       # ground segments run to the bottom of the stage
GND = 'g:gmqb9pd3q'   # Witchwood Ground
GND2 = 'g:gmqb9zpio'  # Witchwood Ground 2

seg, plats, haz, enemies, bats, souls, chk, obst, tex = [], [], [], [], [], [], [], [], []
z = [0]
def Z():
    z[0] += 10; return z[0]

def ground(x0, x1, top=G, skin=GND, grp='Floor'):
    seg.append([x0, x1, top, H - top, Z(), grp, skin])
def plat(x, y, w, t='s', grp='Canopy', **kw):
    d = {'x': x, 'y': y, 'w': w, 't': t, 'z': Z(), 'g': grp, 'skin': 'witch'}
    d.update(kw); plats.append(d)
def mover(x0, y, w, rng, spd, t='m', grp='Movers'):
    plats.append({'x0': x0, 'x': x0, 'y': y, 'w': w, 't': t, 'range': rng, 'spd': spd, 'z': Z(), 'g': grp, 'skin': 'witch'})
def tar(x, w, y=G, d=40):
    haz.append({'t': 'tar', 'x': x, 'y': y, 'w': w, 'd': d, 'z': Z(), 'g': 'Bog'})
def spikes(x, w, y=G):
    haz.append({'t': 'spike', 'x': x, 'y': y, 'w': w, 'z': Z(), 'g': 'Thorns'})
def rocks(x, w, y=-60):
    haz.append({'t': 'rock', 'x': x, 'y': y, 'w': w, 'z': Z(), 'g': 'Falling branches'})
def shooter(x, y, dir, tx, tw, ty, th):
    haz.append({'t': 'spikeshot', 'x': x, 'y': y, 'dir': dir, 'tx': tx, 'tw': tw, 'ty': ty, 'th': th, 'z': Z(), 'g': 'Thorn traps'})
def foe(x, lo, hi, kind, y=G, face=-1):
    enemies.append([x, lo, hi, kind, y, face])
def bat(x, lo, hi, y, face=-1):
    bats.append([x, lo, hi, y, face])
def soul_line(x0, x1, y, n, val=None):
    for i in range(n):
        x = x0 + (x1 - x0) * (i / (n - 1) if n > 1 else 0.5)
        souls.append([round(x), y] + ([val] if val else []))
def soul_arc(x0, y0, x1, y1, n, h=70):
    for i in range(n):
        t = (i + 1) / (n + 1)
        souls.append([round(x0 + (x1 - x0) * t), round(y0 + (y1 - y0) * t - h * 4 * t * (1 - t))])
def check(x, y=G): chk.append([x, y])
def chest(x, gy, loot='gold'): obst.append({'x': x, 'type': 'chest', 'gy': gy, 'z': Z(), 'loot': loot, 'g': 'Secrets'})
def grave(x, gy=G): obst.append({'x': x, 'type': 'grave', 'gy': gy, 'z': Z(), 'g': 'Decor'})

# ── 1. Edge of the Wood (0-1300): safe, teaches walking, hopping and the first goblin ──
ground(0, 1300)
ground(560, 760, G - 70, GND2, 'Logs')                 # a fallen log to hop onto
soul_line(220, 480, G - 60, 4)
soul_arc(480, G - 60, 760, G - 130, 3, 50)
foe(1000, 860, 1240, 'gob'); foe(400, 260, 520, 'zombie')
plat(840, G - 120, 140, grp='Low boughs'); soul_line(860, 960, G - 180, 3)
grave(300); grave(1180)
# secret: a high bough over the start holds a chest
plat(120, G - 230, 130, grp='Secret'); plat(300, G - 340, 110, grp='Secret'); chest(355, G - 340, 'soul25')
plat(40, G - 120, 110, grp='Secret')

# ── 2. The Bog Path (1300-2600): tar slows you and halves your jump; witch platforms give a dry high road ──
ground(1300, 2600, G, GND2, 'Bog floor')
tar(1420, 380); tar(1960, 420)
plat(1400, G - 120, 130, grp='High road'); plat(1610, G - 200, 120, grp='High road')
plat(1830, G - 150, 120, grp='High road'); plat(2050, G - 220, 130, grp='High road'); plat(2290, G - 140, 120, grp='High road')
soul_line(1440, 1500, G - 180, 2); soul_line(1630, 1700, G - 260, 2); soul_line(2070, 2150, G - 280, 3)
soul_line(1460, 1760, G - 40, 4)                       # low-road souls sit in the tar: tempting but slow
foe(2450, 2380, 2580, 'witch'); foe(1600, 1330, 1410, 'gob'); foe(2090, 2060, 2170, 'gob', G - 220)
bat(1700, 1500, 1950, G - 260)
check(1340)

# ── 3. Rotted Bridge (2600-3700): the first real pits, crumbling boughs and a drifting raft ──
ground(2600, 2760, G, GND, 'Bridge')
plat(2930, G - 40, 120, 'c', 'Rotten boughs'); plat(3170, G - 60, 110, 'c', 'Rotten boughs')
mover(3360, G - 40, 120, 180, 0.45)                   # drifts 3360 to 3540
ground(3760, 4200, G, GND, 'Far bank')
soul_arc(2740, G - 60, 2950, G - 100, 3); soul_arc(3040, G - 100, 3200, G - 120, 2); soul_line(3380, 3600, G - 110, 3)
bat(3100, 2900, 3400, G - 230); bat(3550, 3350, 3750, G - 260, 1)
check(3820); foe(4050, 3900, 4180, 'zombie'); bat(3950, 3800, 4150, G - 220)

# ── 4. Canopy Climb (4200-5600): split path. Low: thorns and goblins. High: climb the trees for souls and a chest ──
ground(4200, 5600)
spikes(4480, 160); spikes(4900, 120)
foe(4700, 4660, 4860, 'gob'); foe(5200, 5060, 5440, 'gob', face=1); foe(4930, 4910, 5050, 'skel', G - 410)
plat(4300, G - 120, 120, grp='Canopy'); plat(4470, G - 230, 120, grp='Canopy'); plat(4660, G - 330, 140, grp='Canopy')
plat(4900, G - 410, 160, grp='Canopy'); plat(5150, G - 340, 140, grp='Canopy'); plat(5370, G - 230, 120, grp='Canopy')
chest(4980, G - 410, 'gold')
soul_line(4320, 4400, G - 180, 2); soul_line(4680, 4780, G - 390, 3); soul_line(4920, 5040, G - 470, 4, 5); soul_line(5170, 5260, G - 400, 2)
soul_line(4540, 4640, G - 40, 2); soul_line(5000, 5100, G - 40, 2)
rocks(5000, 320)                                       # rotten branches drop on the low road

# ── 5. Witch's Hollow (5600-7000): thorn traps fire from the dark, a witch and a skeleton guard the hollow ──
ground(5600, 7000, G, GND2, 'Hollow')
check(5680)
ground(6050, 6250, G - 90, GND, 'Stump')
shooter(6600, G - 40, -1, 6200, 260, G - 160, 160)
foe(6450, 6260, 6700, 'witch'); foe(6850, 6720, 6980, 'skel'); foe(5800, 5700, 6000, 'zombie'); foe(6150, 6070, 6240, 'gob', G - 90)
plat(6280, G - 200, 130, grp='Hollow boughs'); plat(6520, G - 260, 130, grp='Hollow boughs')
soul_line(6080, 6220, G - 150, 3); soul_line(6300, 6390, G - 260, 2); soul_line(6540, 6630, G - 320, 2)
bat(6500, 6300, 6900, G - 300)

# ── 6. Sinking Mire (7000-8400): rising and falling boughs over a deadly bog ──
ground(7000, 7160, G, GND, 'Mire bank')
mover(7280, G - 20, 120, 120, 0.5, 'v')                # bobs 120px
plat(7520, G - 80, 110, 'c', 'Rotten boughs')
mover(7720, G - 60, 120, 140, 0.4, 'v')
plat(7960, G - 120, 120, grp='Mire boughs')
ground(8160, 8400, G, GND, 'Mire bank')
check(8200)
soul_line(7290, 7380, G - 90, 2); soul_line(7530, 7610, G - 140, 2); soul_line(7730, 7820, G - 130, 2); soul_line(7980, 8060, G - 180, 2)
bat(7700, 7400, 8000, G - 280, 1)

# ── 7. The Witch Gate (8400-9400): a last guarded run up to the gate ──
ground(8400, 9400)
ground(8900, 9400, G - 80, GND2, 'Gate rise')
foe(8650, 8460, 8860, 'witch'); foe(9150, 8950, 9380, 'knight', G - 80); foe(8300, 8180, 8390, 'zombie'); bat(9100, 8900, 9350, G - 280)
plat(8720, G - 150, 120, grp='Gate boughs')
soul_line(8460, 8620, G - 60, 4); soul_arc(8780, G - 210, 9000, G - 140, 3); soul_line(9050, 9300, G - 140, 4)
grave(8500); grave(9330, G - 80)

stage = {
    'name': 'Witchwood', 'act': 'I', 'music': 'mwitchwood1', 'theme': 'witch',
    'world': 9400, 'h': H, 'goal': 9300, 'goalY': G - 80, 'spawnX': 90,
    'seg': seg, 'obst': obst, 'plats': plats, 'chk': chk, 'souls': souls,
    'enemies': enemies, 'bats': bats, 'hazards': haz, 'tex': tex, 'bg': [], 'fg': [],
}

if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else 'config/bench/witch1.json'
    ok = check_stage(stage, start=(90, G), goal=(stage['goal'], stage['goalY']))
    json.dump(stage, open(out, 'w'), indent=1)
    render_map(stage, '/tmp/witch1-map.png')
    print('written', out, 'counts', {k: len(v) for k, v in stage.items() if isinstance(v, list)})
    sys.exit(0 if ok else 1)
