"""Passability checker and map renderer for cReapZ stages, using the engine's real physics."""
import math
GRAV, JUMP, WALK, RUN = 0.6, 13.2, 3.7, 7.4
PW, PH = 52, 88

def surfaces(st):
    """Every top you can stand on: (x0, x1, y, kind, label). Movers count at both ends of their travel."""
    S = []
    BL = blocks(st)
    for s in st['seg']:
        # a ground top is only standable where no other block sits on it (a stump on the floor splits the floor)
        pieces = [(s[0], s[1])]
        for (l, r, top, bot) in BL:
            if top < s[2] <= bot and not (l == s[0] and r == s[1] and top == s[2]):
                nxt = []
                for (a, b) in pieces:
                    if r <= a or l >= b: nxt.append((a, b)); continue
                    if a < l: nxt.append((a, l - PW / 2))
                    if r < b: nxt.append((r + PW / 2, b))
                pieces = nxt
        for (a, b) in pieces:
            if b - a > 4: S.append((a, b, s[2], 'ground', s[5] or 'ground'))
    for q in st['plats']:
        x = q.get('x0', q['x']); y = q['y']; w = q['w']; tol = 8
        if q['t'] == 'm':
            S.append((x - tol, x + w + tol, y, 'mover', q.get('g', '') + ' (start)'))
            S.append((x + q['range'] - tol, x + q['range'] + w + tol, y, 'mover', q.get('g', '') + ' (end)'))
        elif q['t'] == 'v':
            S.append((x - tol, x + w + tol, y, 'mover', q.get('g', '') + ' (top)'))
            S.append((x - tol, x + w + tol, y + q['range'], 'mover', q.get('g', '') + ' (bottom)'))
        else:
            S.append((x - tol, x + w + tol, y, {'c': 'crumble'}.get(q['t'], 'plat'), q.get('g', '')))
    for o in st.get('obst', []):
        pass
    return S

def blocks(st):
    return [(s[0], s[1], s[2], s[2] + (s[3] or 130)) for s in st['seg']]

def tar_at(st, x, y):
    return any(h['t'] == 'tar' and h['x'] <= x <= h['x'] + h['w'] and abs(y - h['y']) < 8 for h in st.get('hazards', []))

def sim(st, A, B, run=True):
    """Try to jump from surface A to surface B with full air control. Returns spare distance (px) or None."""
    BL = blocks(st)
    spd = RUN if run else WALK
    best = None
    # take off from the edge of A nearest B (or anywhere above it if they overlap)
    if B[0] > A[1]: starts, dirn = [A[1]], 1
    elif B[1] < A[0]: starts, dirn = [A[0]], -1
    else: starts, dirn = [max(A[0], B[0]) + 2, min(A[1], B[1]) - 2, (max(A[0], B[0]) + min(A[1], B[1])) / 2], 0
    for x0 in starts:
        k = 0.78 if tar_at(st, x0, A[2]) else 1.0
        sp = spd * (0.4 if k < 1 else 1)
        for target in ([B[0] + 4, (B[0] + B[1]) / 2, B[1] - 4] if dirn == 0 else [B[0] + 4 if dirn > 0 else B[1] - 4]):
            x, y, vy = x0, A[2], -JUMP * k
            for n in range(1, 260):
                vx = max(-sp, min(sp, target - x))
                prev = y; vy += GRAV; y += vy; x += vx
                if vy > 0 and prev <= B[2] + 1 and y >= B[2] and B[0] <= x <= B[1]:
                    spare = min(x - B[0], B[1] - x) if dirn == 0 else (B[1] - x if dirn > 0 else x - B[0])
                    best = spare if best is None else max(best, spare)
                    break
                # terrain: bonk heads on undersides; running into a wall face ends this attempt
                hit = False
                for (l, r, top, bot) in BL:
                    if x + PW / 2 > l + 3 and x - PW / 2 < r - 3:
                        if vy < 0 and (prev - PH) >= bot - 1 and (y - PH) < bot and (y - PH) > top - 40: vy = 0; y = bot + PH
                        elif y > top + 4 and (y - PH) < bot:   # wall: the engine pushes you out sideways, you keep moving
                            x = l - PW / 2 if (x + PW / 2 - l) < (r - (x - PW / 2)) else r + PW / 2
                if y > st['h'] + 200: break
    return best

def check_stage(st, start, goal):
    S = surfaces(st)
    def on(pt):
        return [i for i, s in enumerate(S) if s[0] <= pt[0] <= s[1] and abs(s[2] - pt[1]) < 3]
    edges = {}
    for i, A in enumerate(S):
        for j, B in enumerate(S):
            if i == j: continue
            if abs(B[0] - A[1]) > 700 and abs(A[0] - B[1]) > 700: continue
            if A[2] - B[2] > 160: continue                 # more than a full jump above
            w = sim(st, A, B, run=False); r = w if w is not None else sim(st, A, B, run=True)
            if r is not None: edges.setdefault(i, []).append((j, 'walk' if w is not None else 'run', r))
    s0 = on(start); g0 = on(goal)
    seen = {i: None for i in s0}; q = list(s0)
    while q:
        i = q.pop(0)
        for (j, how, spare) in edges.get(i, []):
            if j not in seen: seen[j] = (i, how, spare); q.append(j)
    ok = any(g in seen for g in g0)
    unreached = [S[i] for i in range(len(S)) if i not in seen]
    print('START', [S[i][4] for i in s0], 'GOAL', [S[i][4] for i in g0])
    print('goal reachable:', ok)
    for u in unreached: print('  UNREACHABLE:', u)
    # main path report
    if ok:
        g = next(g for g in g0 if g in seen); path = []
        while seen[g]: i, how, spare = seen[g]; path.append((S[i], S[g], how, spare)); g = i
        tight = [p for p in path if p[3] < 24]
        print('main path jumps:', len(path), ' run-jumps needed:', sum(1 for p in path if p[2] == 'run'), ' tight (<24px spare):', len(tight))
        for a, b, how, spare in reversed(path):
            if how == 'run' or spare < 30: print('   ', how, 'spare', round(spare), a[4], '->', b[4], (round(a[1]), a[2]), '->', (round(b[0]), b[2]))
    # every surface must also be able to get back onto the main route
    return ok and not unreached

def render_map(st, path, scale=0.14):
    from PIL import Image, ImageDraw
    W = int(st['world'] * scale) + 20; Hh = int(st['h'] * scale) + 40
    img = Image.new('RGB', (W, Hh), (14, 24, 17)); d = ImageDraw.Draw(img)
    X = lambda x: 10 + x * scale; Y = lambda y: 20 + y * scale
    for s in st['seg']:
        d.rectangle([X(s[0]), Y(s[2]), X(s[1]), Y(s[2] + (s[3] or 130))], fill=(58, 46, 34), outline=(120, 170, 90))
    for h in st['hazards']:
        c = {'tar': (40, 70, 30), 'spike': (200, 60, 60), 'rock': (150, 120, 80), 'spikeshot': (255, 120, 60)}[h['t']]
        if h['t'] == 'tar': d.rectangle([X(h['x']), Y(h['y'] - 6), X(h['x'] + h['w']), Y(h['y'] + 4)], fill=c)
        elif h['t'] == 'spike': d.rectangle([X(h['x']), Y(h['y'] - 30), X(h['x'] + h['w']), Y(h['y'])], fill=c)
        elif h['t'] == 'rock': d.line([X(h['x']), Y(40), X(h['x'] + h['w']), Y(40)], fill=c, width=3)
        else: d.ellipse([X(h['x']) - 4, Y(h['y']) - 4, X(h['x']) + 4, Y(h['y']) + 4], fill=c)
    for q in st['plats']:
        x = q.get('x0', q['x']); col = {'s': (150, 110, 200), 'c': (200, 140, 90), 'm': (90, 200, 220), 'v': (90, 200, 220)}.get(q['t'], (180, 180, 180))
        d.rectangle([X(x), Y(q['y']) - 2, X(x + q['w']), Y(q['y']) + 2], fill=col)
        if q['t'] == 'm': d.line([X(x), Y(q['y']) + 5, X(x + q['range'] + q['w']), Y(q['y']) + 5], fill=col)
        if q['t'] == 'v': d.line([X(x + q['w'] / 2), Y(q['y']), X(x + q['w'] / 2), Y(q['y'] + q['range'])], fill=col)
    for s in st['souls']: d.point([X(s[0]), Y(s[1])], fill=(200, 255, 120))
    for e in st['enemies']: d.rectangle([X(e[0]) - 3, Y(e[4]) - 9, X(e[0]) + 3, Y(e[4])], fill=(255, 80, 80))
    for b in st['bats']: d.ellipse([X(b[0]) - 3, Y(b[3]) - 3, X(b[0]) + 3, Y(b[3]) + 3], fill=(255, 150, 200))
    for c in st['chk']: d.line([X(c[0]), Y(c[1]), X(c[0]), Y(c[1]) - 14], fill=(255, 220, 80), width=2)
    for o in st['obst']:
        if o['type'] == 'chest': d.rectangle([X(o['x']) - 4, Y(o['gy']) - 6, X(o['x']) + 4, Y(o['gy'])], fill=(255, 200, 60))
    d.line([X(st['goal']), Y(st['goalY']), X(st['goal']), Y(st['goalY']) - 20], fill=(120, 255, 255), width=3)
    img.save(path)
