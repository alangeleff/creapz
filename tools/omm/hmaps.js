/* The House as floating islands joined by bridges over the void (drawn and walked like Omm City). One source for each map's painting guide and its walking graph.
   Every map is painted as ONE image, so there are no seams. Exits at map edges link to another map's entry node. */
(function () {
/* building: id, x0, width, bottom; kinds: dome, glass, tower, theater; tower:1 adds a clock tower */
var MAPS = {
  /* ---- the main island: four districts joined by ground paths ---- */
  hearth: { name: 'The Hearth', sub: 'The heart of the House', W: 2048, H: 1536, aspect: '4:3', ISLE: [1024, 1060, 1560, 960],
    P: { w: [0, 960], e: [2048, 960], s: [1024, 1536], pW: [720, 960], pE: [1330, 960], pN: [1024, 660], pS: [1024, 1260], gl: [600, 1260], th: [1500, 1260] },
    R: [['w', 'pW', 70], ['pE', 'e', 70], ['pS', 's', 64], ['pS', 'gl', 56], ['pS', 'th', 56]],
    PLAZA: [1024, 960, 300],
    B: [{ id: 'commons', x: 770, w: 508, b: 600, k: 'hearth', door: 'pN' }, { id: 'gallery', x: 450, w: 300, b: 1210, k: 'gallery' }, { id: 'threshold', x: 1400, w: 200, b: 1210, k: 'sealed' }],
    exits: { w: ['neon', 'e'], e: ['crypt', 'w'], s: ['bloodmoon', 'n'] },
    extra: function (d) { d.benches([[760, 1100], [1290, 1100]]); d.crystals([[300, 1100], [1780, 1100], [1760, 760], [280, 760]]); d.garden(1640, 1330, 220, 110); },
    portal: [1024, 960],
    desc: 'the center of a big floating island in a starry violet void: a great round dark-stone domed hall with tall glowing amber arched windows, gold ribs on the dome and a violet crystal spire on top (the Hearth); a round flagstone plaza in front of it with a glowing violet portal ring set into its center; a small cream classical gallery pavilion with columns and a framed landscape painting on its front; a small purple stone hut with a heavy sealed door glowing faintly at its seams; lanterns, benches, violet crystals; the grassy island continues off the left, right and bottom edges, with the starry void only beyond the island rim at the top' },
  neon: { name: "Peevy's Row", sub: 'The Neon wing', W: 2048, H: 1536, aspect: '4:3', ISLE: [1500, 900, 1300, 650],
    P: { e: [2048, 960], j0: [420, 960], j1: [700, 960], rn: [420, 600], n: [420, 0], rs: [700, 1370], s: [700, 1536] },
    R: [['n', 'rn', 50, 'rope'], ['rn', 'j0', 56], ['j0', 'j1', 70], ['j1', 'e', 70], ['j1', 'rs', 56], ['rs', 's', 56, 'beam', '#ff5ab4']],
    B: [{ id: 'peevy', x: 540, w: 300, b: 880, k: 'brick' }, { id: 'peevy-h', x: 890, w: 380, b: 880, k: 'neon' }, { id: 'peevy-2', x: 1330, w: 360, b: 880, k: 'brick' }],
    exits: { e: ['hearth', 'w'], n: ['prism', 's'], s: ['archive', 'n'] },
    extra: function (d) { d.benches([[1000, 1080], [1500, 1080]]); d.garden(1100, 1160, 300, 110); d.crystals([[1780, 640]]); },
    desc: "the west end of a big floating island in a starry violet void: a cozy row of old brick townhouses along a wooden boardwalk street, with a tall brick building in the middle wearing a glowing lime-green neon sign on its roof (a blob shape, no text), green striped awnings, warm lit windows, ivy and hanging plants, string lights; a rope-and-plank bridge leaves the top edge over the void toward a floating island, and a glowing pink beam of light leaves the bottom edge over the void; the island ends in a rocky rim at the left, with starry void beyond" },
  crypt: { name: "Moro's Abbey", sub: 'The Crypt wing', W: 2048, H: 1536, aspect: '4:3', ISLE: [550, 900, 1300, 650],
    P: { w: [0, 960], j: [500, 960], k: [1420, 960], rn: [1420, 440], n: [1420, 0] },
    R: [['w', 'j', 70], ['j', 'k', 70], ['k', 'rn', 56], ['rn', 'n', 50, 'beam', '#9ad8ff']],
    B: [{ id: 'moro', x: 380, w: 280, b: 870, k: 'chapel' }, { id: 'moro-h', x: 720, w: 400, b: 880, k: 'cathedral' }, { id: 'moro-2', x: 1160, w: 220, b: 870, k: 'gothic' }],
    exits: { w: ['hearth', 'e'], n: ['sky', 's'] },
    extra: function (d) { d.graves([[460, 1120], [560, 1180], [1180, 1120], [1300, 1180], [760, 1200]]); d.crystals([[1700, 900]]); },
    desc: "the east end of a big floating island in a starry violet void: a dark gothic stone abbey with pointed spires, pointed arched windows glowing warm amber and candles by the doors; a small chapel with steps leading down into a crypt on the left, the long main hall in the middle, and a narrow gothic library wing on the right; old gravestones, dead trees, a stone path; a glowing pale-blue beam of light rises from the top right of the island up and away over the void; the island ends in a rocky rim at the right, with starry void beyond" },
  bloodmoon: { name: "Lucifer's Castle", sub: 'The Blood Moon wing', W: 2048, H: 1536, aspect: '4:3', ISLE: [1024, 380, 1560, 1020],
    P: { n: [300, 0], a: [300, 1230], gate: [1024, 1230] },
    R: [['n', 'a', 64], ['a', 'gate', 70]],
    B: [{ id: 'lucifer', x: 770, w: 508, b: 760, k: 'keep', door: 'gate', inside: true }, { id: 'lucifer-2', x: 1290, w: 270, b: 1010, k: 'vault', door: 'gate', inside: true }, { id: 'lucifer-h', x: 850, w: 348, b: 1130, k: 'gatehouse', door: 'gate' }],
    exits: { n: ['hearth', 's'] },
    extra: function (d) { d.curtain(520, 300, 1050, 830); d.towers([[560, 1010], [1490, 1010], [560, 420], [1490, 420]]); d.embers([[760, 1300], [1290, 1300]]); },
    desc: "the south end of a big floating island in a starry violet void, under a huge blood-red moon: ONE big black stone castle. A thick black curtain wall with crenellations and gold-spiked corner towers encloses a dark courtyard. At the front of the wall, a fortified gatehouse with a red-lit arched gate and a raised iron portcullis is the only way in (the Hall of Chains). Rising behind it in the middle of the courtyard is the great keep, the tallest structure, crowned with tall gold spikes and a blood-red window near the top (Lucifer's throne room). On the right side of the courtyard, joined to the wall, a squat round vault tower with lava glowing through cracks around its base (the Ember Vault). Red banners hang from the walls, braziers of red fire flank the gate, a dark red path leads from the top-left edge down and along to the gate. NO throne outside. The island ends in a crumbling rocky rim at the bottom, with starry void beyond" },
  /* ---- the floating islands ---- */
  prism: { name: "Omm's Spires", sub: 'The Prism wing', W: 2048, H: 1536, aspect: '4:3', ISLE: [1024, 820, 780, 560],
    P: { s: [1024, 1536], rs: [1024, 1340], j: [1024, 1060], wl: [670, 1060], wr: [1378, 1060] },
    R: [['j', 'rs', 60], ['rs', 's', 50, 'rope'], ['wl', 'j', 56], ['j', 'wr', 56]],
    B: [{ id: 'omm', x: 520, w: 300, b: 980, k: 'spire' }, { id: 'omm-h', x: 820, w: 408, b: 760, k: 'glassbridge' }, { id: 'omm-2', x: 1228, w: 300, b: 980, k: 'spire' }],
    exits: { s: ['neon', 'n'] },
    extra: function (d) { d.crystals([[420, 760], [1640, 760], [600, 1260], [1440, 1260]]); },
    desc: "a small floating island in a starry violet void with a rocky underside studded with glowing violet crystals: two slender purple stone towers with gold trim, each topped by a cluster of big violet crystals and a glowing orb on a spire, joined high up by an enclosed glass bridge running between them; the left tower holds Omm's observatory bedroom, the right tower a crystal garden; a rope-and-plank bridge leaves the bottom edge over the void" },
  sky: { name: "Jove's Domes", sub: 'The Sky wing', W: 2048, H: 1536, aspect: '4:3', ISLE: [1024, 800, 780, 560],
    P: { s: [1024, 1536], rs: [1024, 1320], j: [1024, 1020], wl: [730, 1020], wr: [1360, 1020] },
    R: [['j', 'rs', 60], ['rs', 's', 50, 'beam', '#9ad8ff'], ['wl', 'j', 56], ['j', 'wr', 56]],
    B: [{ id: 'jove-2', x: 560, w: 340, b: 920, k: 'dome' }, { id: 'jove', x: 1180, w: 360, b: 920, k: 'dome' }, { id: 'jove-h', x: 1140, w: 180, b: 1250, k: 'tethergate' }],
    exits: { s: ['crypt', 'n'] },
    extra: function (d) { d.crystals([[400, 760], [1660, 760]]); },
    desc: "a small floating island in a starry violet void: two round navy-blue stone observatory towers with blue domes and gold bands; the left one has an open railed wooden deck on its roof with a big brass telescope pointed at the stars (the observation deck); the right, taller one is Jove's planetarium bedroom with a small annex; a glowing pale-blue beam of light, the Sky Tether, arrives at a little brass tether gate at the bottom of the island and runs off the bottom edge over the void" },
  archive: { name: "Aevron's Archive", sub: 'The Archive wing', W: 2048, H: 1536, aspect: '4:3', ISLE: [1024, 820, 780, 560],
    P: { n: [1500, 0], rn: [1500, 420], jr: [1500, 1040], jl: [460, 1040] },
    R: [['n', 'rn', 50, 'beam', '#ff5ab4'], ['rn', 'jr', 56], ['jl', 'jr', 60]],
    B: [{ id: 'aevron-h', x: 340, w: 260, b: 960, k: 'house' }, { id: 'aevron-2', x: 660, w: 360, b: 960, k: 'rotunda' }, { id: 'aevron', x: 1100, w: 220, b: 960, k: 'tower' }],
    exits: { n: ['neon', 's'] },
    extra: function (d) { d.crystals([[400, 1240], [1640, 1200]]); },
    desc: "a small floating island in a starry violet void with glowing lights under its rocky rim: a small dark slate house with a steep roof and pink-lit windows on the left (the Index), a round purple domed rotunda in the middle with one big round window full of stars on its front (the Hall of Records), and a tall black stone tower on the right whose whole front is a glowing pink screen (the Core); neat dark paths; a glowing pink beam of light leaves the top right of the island over the void" },
};
var NAMES = { commons: 'the Hearth, a great round dark-stone domed hall with tall glowing amber arched windows and a violet crystal spire', gallery: 'a small cream classical gallery pavilion with columns and a framed painting on its front', threshold: 'a small purple stone hut with a heavy sealed door glowing at its seams', peevy: "Peevy's cozy brick townhouse with warm windows and plants", 'peevy-h': "a tall brick building with a lime-green neon blob sign on its roof", 'peevy-2': "a brick recording studio with a red ON AIR lamp and soundproofed windows", moro: 'a small gothic chapel with steps down into a crypt', 'moro-h': 'the long gothic abbey hall with spires and amber arched windows', 'moro-2': 'a narrow gothic library wing with tall windows full of books', 'lucifer-h': 'a black gatehouse tower with gold spikes and a red door', lucifer: 'the big black main keep with gold spikes and glowing red windows', 'lucifer-2': 'a squat black treasure vault with gold spikes and lava glowing around its base', omm: 'a slender purple stone tower topped with violet crystals and a glowing orb', 'omm-h': 'an enclosed glass bridge high between the two towers, with a stair up at its base', 'omm-2': 'a slender purple stone tower topped with violet crystals and a glowing orb', 'jove-2': 'a navy stone observatory tower with an open railed roof deck and a big brass telescope', jove: 'a taller navy observatory tower with a blue dome and gold bands', 'jove-h': 'a little brass gate where the light tether lands', 'aevron-h': 'a small dark slate house with pink-lit windows', 'aevron-2': 'a round purple domed rotunda with one big round star window on its front', aevron: 'a tall black tower whose front is a glowing pink screen' };
Object.keys(MAPS).forEach(function (id) {
  var M = MAPS[id]; M.id = id;
  M.B.forEach(function (b) {
    b.h = b.k === 'portal' ? 300 : b.k === 'spire' ? 560 : b.k === 'gatehouse' ? 340 : b.k === 'glassbridge' ? 300 : b.k === 'keep' ? 620 : b.k === 'vault' ? 300 : b.k === 'tower' ? 380 : b.k === 'theater' ? 230 : b.k === 'lot' ? 120 : Math.round(b.w * (b.w > 340 ? .68 : .72));
    if (b.id.slice(0, 2) === 'ct') b.h = 190;
    b.y = b.b - b.h; b.dx = b.x + b.w / 2; b.dy = b.b + 6; b.map = id;
  });
});

function rng(s) { return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

/* ---------- walking graph for one map: road nodes, plaza ring, door spurs ---------- */
function graph(id) {
  var M = MAPS[id]; if (M._g) return M._g;
  var N = {}, E = [], k, P = M.P;
  for (k in P) N[k] = P[k].slice();
  var segs = M.R.map(function (r) { return { a: r[0], b: r[1], cut: [] }; }), ring = [];
  if (M.PLAZA) {
    var PL = M.PLAZA;
    for (var i = 0; i < 8; i++) { var a = i / 8 * Math.PI * 2 - Math.PI / 2, nm = 'pr' + i; N[nm] = [Math.round(PL[0] + (PL[2] - 60) * Math.cos(a)), Math.round(PL[1] + (PL[2] - 60) * Math.sin(a))]; ring.push(nm); }
    for (i = 0; i < 8; i++) E.push([ring[i], ring[(i + 1) % 8]]);
    E.push(['pN', 'pr0'], ['pE', 'pr2'], ['pS', 'pr4'], ['pW', 'pr6']);
    N.fount = [PL[0], PL[1] + 130]; E.push(['pr4', 'fount'], ['pr3', 'fount'], ['pr5', 'fount']);
  }
  M.B.forEach(function (b) {
    if (b.k === 'lot') return;
    if (b.k === 'portal') { N.door_portal = P.portal.slice(); return; }
    var dn = 'door_' + b.id; N[dn] = b.inside && P[b.door] ? P[b.door].slice() : [b.dx, b.dy + 4];   /* inside: reached through another building's door */
    if (b.door) { E.push([dn, b.door]); b.spur = null; return; }
    var bestS = null, bestP = null, bestD = 1e9;
    segs.forEach(function (s) {
      var A = P[s.a], Bp = P[s.b], dx = Bp[0] - A[0], dy = Bp[1] - A[1], L2 = dx * dx + dy * dy, t = Math.max(0, Math.min(1, ((b.dx - A[0]) * dx + (b.dy - A[1]) * dy) / L2));
      var px = A[0] + dx * t, py = A[1] + dy * t; if (py < b.dy - 2) return; var d = Math.hypot(px - b.dx, py - b.dy); if (d < bestD) { bestD = d; bestS = s; bestP = [px, py, t]; }
    });
    var jn = 'j_' + b.id; N[jn] = [Math.round(bestP[0]), Math.round(bestP[1])]; bestS.cut.push([bestP[2], jn]);
    E.push([dn, jn]); b.spur = [[b.dx, b.dy], N[jn]];
  });
  segs.forEach(function (s) { var pts = [[0, s.a]].concat(s.cut.sort(function (p, q) { return p[0] - q[0]; })).concat([[1, s.b]]); for (var i = 0; i + 1 < pts.length; i++) E.push([pts[i][1], pts[i + 1][1]]); });
  if (id === 'lake') E.push(['pier', 'dock']);
  return (M._g = { N: N, E: E });
}

/* ---------- painting guide ---------- */
var C = { grass: '#2e3a34', road: '#78708c', dirt: '#6e5a48', plaza: '#8c84a0', water: '#3c4c8c', hedge: '#1c3424', tree: '#1e4028', treeHi: '#2a5234', bush: '#2c5a38',
  roof: [120, 46, 72], wall: '#d6c4aa', win: '#ffc85a', door: '#603828', fence: '#6e4a32', soil: '#463828', rock: '#5a5868', wall2: '#6a6478', lamp: '#ffc85a' };
function drawGuide(g, id) {
  var M = MAPS[id], W = M.W, H = M.H, P = M.P, r = rng(id.length * 977 + 13), Gr = graph(id), blocks = [];
  function rect(c, x, y, w, h) { g.fillStyle = c; g.fillRect(x, y, w, h); }
  function circ(c, x, y, rad, ry) { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, rad, ry || rad, 0, 0, 7); g.fill(); }
  function line(c, a, b, w) { g.strokeStyle = c; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
  function block(x, y, w, h) { blocks.push([x, y, w, h]); }
  var IS = M.ISLE;
  rect('#0c0a1e', 0, 0, W, H);
  for (var si = 0; si < 420; si++) { var sx = r() * W, sy = r() * H, sz = r() < .1 ? 4 : 2; rect(r() < .3 ? '#c8a0ff' : '#e8e4ff', sx, sy, sz, sz); }
  circ('#2a2238', IS[0], IS[1] + 70, IS[2] * .96, IS[3] * .98);   /* rock underside */
  circ('#1c1828', IS[0], IS[1] + 150, IS[2] * .7, IS[3] * .8);
  circ(id === 'bloodmoon' ? '#3a2a2c' : id === 'other' ? '#2c3430' : C.grass, IS[0], IS[1], IS[2], IS[3]);
  function onIsle(x, y, pad) { var dx = (x - IS[0]) / (IS[2] - pad), dy = (y - IS[1]) / (IS[3] - pad); return dx * dx + dy * dy < 1; }
  if (M.LAKE) { g.fillStyle = '#4a4656'; g.beginPath(); g.moveTo(0, H); for (var x = 0; x <= W; x += 16) g.lineTo(x, M.LAKE - 12 + 14 * Math.sin(x / 110) + 6 * Math.sin(x / 41)); g.lineTo(W, H); g.fill();
    g.fillStyle = C.water; g.beginPath(); g.moveTo(0, H); for (x = 0; x <= W; x += 16) g.lineTo(x, M.LAKE + 14 * Math.sin(x / 110) + 6 * Math.sin(x / 41)); g.lineTo(W, H); g.fill(); block(0, M.LAKE - 50, W, H); }
  var D = {
    stalls: function (list) { var cs = [['#a03c6e', '#f0d8a0'], ['#2c8c8c', '#e8e0c8'], ['#e0a040', '#7a2c4a']]; list.forEach(function (s) { var c = cs[s[2]]; for (var i = 0; i < 7; i++) rect(i % 2 ? c[0] : c[1], s[0] + i * 16, s[1], 16, 44); rect('#7a5232', s[0], s[1] + 44, 112, 26); block(s[0] - 20, s[1] - 20, 150, 110); }); },
    pond: function (x, y, rx, ry) { circ('#4a4656', x, y, rx + 10, ry + 10); circ(C.water, x, y, rx, ry); circ('#5a6aa8', x - rx * .3, y - ry * .3, rx * .35, ry * .3); block(x - rx - 50, y - ry - 50, rx * 2 + 100, ry * 2 + 100); },
    garden: function (x, y, w, h) { rect(C.soil, x, y, w, h); for (var yy = y + 14; yy < y + h - 6; yy += 18) rect('#3c6a3a', x + 10, yy, w - 20, 7); g.strokeStyle = C.fence; g.lineWidth = 5; g.strokeRect(x, y, w, h); block(x - 30, y - 30, w + 60, h + 60); },
    benches: function (list) { list.forEach(function (p) { rect('#7a5232', p[0] - 26, p[1] - 6, 52, 12); block(p[0] - 40, p[1] - 30, 80, 50); }); },
    board: function (x, y) { rect('#7a5232', x - 28, y - 18, 56, 36); rect('#e8dcb8', x - 20, y - 12, 12, 14); rect('#e8dcb8', x - 2, y - 10, 14, 12); },
    statue: function (x, y) { rect('#6a6478', x - 22, y - 10, 44, 30); circ('#c8c4d8', x, y - 20, 20); },
    statues: function (list) { list.forEach(function (p) { D.statue(p[0], p[1]); block(p[0] - 50, p[1] - 70, 100, 110); }); },
    well: function (x, y) { circ('#6a6478', x, y, 30); circ('#222034', x, y, 17); block(x - 60, y - 60, 120, 120); },
    signpost: function (x, y) { rect('#5a3a24', x - 3, y - 40, 6, 40); rect('#8a5a34', x - 26, y - 44, 52, 14); },
    arch: function (x, y) { rect('#6a6478', x - 70, y - 40, 24, 90); rect('#6a6478', x + 46, y - 40, 24, 90); rect('#6a6478', x - 70, y - 56, 140, 26); block(x - 110, y - 90, 220, 170); },
    wall: function (gy) { rect(C.wall2, 0, 0, 56, gy - 50); rect(C.wall2, 0, gy + 50, 56, H - gy - 50); for (var y = 0; y < H; y += 40) { if (Math.abs(y - gy) < 60) continue; rect('#58526a', 0, y, 56, 3); } rect('#6a6478', 38, gy - 76, 52, 44); rect('#6a6478', 38, gy + 32, 52, 44); for (var yy = gy - 32; yy < gy + 32; yy += 10) rect('#28242e', 44, yy, 40, 3); block(0, 0, 120, H); },
    cliff: function (x, y, rx, ry) { circ('#3e3c4a', x, y, rx, ry); for (var i = 0; i < 30; i++) { var a = r() * 6.3, d = .75 + r() * .3; circ(C.rock, x + Math.cos(a) * rx * d, y + Math.sin(a) * ry * d, 26 + r() * 20, 18 + r() * 14); } },
    rocks: function (list) { list.forEach(function (p) { circ(C.rock, p[0], p[1], 34, 24); circ('#6a6878', p[0] - 8, p[1] - 6, 16, 10); block(p[0] - 50, p[1] - 40, 100, 80); }); },
    dock: function (x, y0, y1) { rect('#5e3a2e', x - 40, y0, 80, y1 - y0); for (var y = y0 + 4; y < y1; y += 12) rect('#7a4c38', x - 38, y, 76, 9); rect('#5e3a2e', x - 110, y1 - 30, 220, 80); for (y = y1 - 26; y < y1 + 46; y += 12) rect('#7a4c38', x - 108, y, 216, 9); },
    reeds: function (list) { list.forEach(function (p) { for (var i = 0; i < 9; i++) rect('#3c6a3a', p[0] + (r() - .5) * 60, p[1] - 30 + r() * 20, 4, 30); }); },
    shrooms: function (list) { list.forEach(function (p) { for (var i = 0; i < 5; i++) { var x = p[0] + (r() - .5) * 50, y = p[1] + (r() - .5) * 30; rect('#e8e0f0', x - 2, y, 4, 8); circ('#4ac8ff', x, y, 8, 5); } block(p[0] - 50, p[1] - 40, 100, 80); }); },
    stones: function (list) { list.forEach(function (p) { rect('#6a7a6a', p[0] - 16, p[1] - 60, 32, 64); rect('#7ad0b0', p[0] - 6, p[1] - 44, 12, 4); rect('#7ad0b0', p[0] - 4, p[1] - 30, 8, 4); block(p[0] - 50, p[1] - 90, 100, 120); }); },
    crystals: function (list) { list.forEach(function (p) { for (var i = 0; i < 4; i++) { var x = p[0] + (i - 1.5) * 18, h = 30 + r() * 40; g.fillStyle = i % 2 ? '#a070ff' : '#7adcf0'; g.beginPath(); g.moveTo(x - 9, p[1]); g.lineTo(x, p[1] - h); g.lineTo(x + 9, p[1]); g.fill(); } block(p[0] - 60, p[1] - 90, 120, 110); }); },
    tether: function (x, y) { rect('#9ad8ff', x - 6, 0, 12, y); circ('#c8ecff', x, y, 26); block(x - 60, 0, 120, y + 40); },
    graves: function (list) { list.forEach(function (p) { rect('#6a6878', p[0] - 14, p[1] - 34, 28, 36); circ('#6a6878', p[0], p[1] - 34, 14); block(p[0] - 36, p[1] - 60, 72, 70); }); },
    embers: function (list) { list.forEach(function (p) { rect('#4a3a3a', p[0] - 20, p[1] - 10, 40, 22); circ('#ff5a2a', p[0], p[1] - 18, 18, 14); circ('#ffc040', p[0], p[1] - 22, 8); block(p[0] - 46, p[1] - 50, 92, 70); }); },
    chains: function (list) { list.forEach(function (p) { rect('#3a3440', p[0] - 8, p[1] - 90, 16, 100); for (var y = p[1] - 80; y < p[1]; y += 16) circ('#8a8494', p[0] + 22, y, 6, 8); block(p[0] - 40, p[1] - 110, 90, 130); }); },
    pillars: function (list) { list.forEach(function (p) { rect('#24202e', p[0] - 18, p[1] - 70, 36, 74); rect('#ff5ab4', p[0] - 10, p[1] - 56, 20, 6); rect('#ff5ab4', p[0] - 10, p[1] - 36, 20, 6); block(p[0] - 44, p[1] - 90, 88, 110); }); },
    curtain: function (x, y, w, h) { g.strokeStyle = '#24202a'; g.lineWidth = 46; g.strokeRect(x, y, w, h); g.strokeStyle = '#3a3440'; g.lineWidth = 10; g.strokeRect(x - 18, y - 18, w + 36, h + 36); rect('#2a2230', x + 24, y + 24, w - 48, h - 48); block(x - 40, y - 40, w + 80, h + 80); },
    towers: function (list) { list.forEach(function (p) { rect('#24202a', p[0] - 56, p[1] - 200, 112, 200); g.fillStyle = '#e0b040'; for (var q = -1; q <= 1; q++) { g.beginPath(); g.moveTo(p[0] + q * 34 - 12, p[1] - 196); g.lineTo(p[0] + q * 34, p[1] - 260); g.lineTo(p[0] + q * 34 + 12, p[1] - 196); g.fill(); } rect('#ff3a3a', p[0] - 10, p[1] - 150, 20, 34); }); },
    fogs: function (list) { list.forEach(function (p) { D.fog(p[0], p[1]); }); },
    fog: function (x, y) { for (var i = 0; i < 8; i++) circ('rgba(200,195,230,.35)', x + (r() - .5) * 200, y + (r() - .5) * 220, 120, 80); block(x - 200, y - 260, 400, 520); }
  };
  /* roads */
  M.R.forEach(function (s) { if (s[3] === 'beam') { line('#1a1030', P[s[0]], P[s[1]], s[2] + 40); line(s[4], P[s[0]], P[s[1]], s[2]); line('#ffffff', P[s[0]], P[s[1]], s[2] * .35); return; } if (s[3] !== 'rope') return; var A = P[s[0]], Bp = P[s[1]]; line('#2a2034', A, Bp, s[2] + 26); line('#6a5a48', A, Bp, s[2] + 14); line('#8a7458', A, Bp, s[2]);
    var L = Math.hypot(Bp[0] - A[0], Bp[1] - A[1]), ux = (Bp[0] - A[0]) / L, uy = (Bp[1] - A[1]) / L; for (var q = 0; q < L; q += 22) line('#5e4a38', [A[0] + ux * q - uy * s[2] / 2, A[1] + uy * q + ux * s[2] / 2], [A[0] + ux * q + uy * s[2] / 2, A[1] + uy * q - ux * s[2] / 2], 4); });
  M.R.forEach(function (s) { if (s[3] === 'rope' || s[3] === 'beam') return; line('#3a3248', P[s[0]], P[s[1]], s[2] + 8); });
  M.R.forEach(function (s) { if (s[3] !== 'rope' && s[3] !== 'beam') line(s[3] === 'd' ? C.dirt : C.road, P[s[0]], P[s[1]], s[2]); block(Math.min(P[s[0]][0], P[s[1]][0]) - s[2] / 2 - 30, Math.min(P[s[0]][1], P[s[1]][1]) - s[2] / 2 - 30, Math.abs(P[s[0]][0] - P[s[1]][0]) + s[2] + 60, Math.abs(P[s[0]][1] - P[s[1]][1]) + s[2] + 60); });
  if (M.PLAZA) { var PL = M.PLAZA; circ('#3a3248', PL[0], PL[1], PL[2] + 6); circ(C.plaza, PL[0], PL[1], PL[2]); for (var i = 0; i < 3; i++) circ(i % 2 ? C.plaza : '#7e7692', PL[0], PL[1], PL[2] - 50 - i * 50); circ('#5a5470', PL[0], PL[1], 86); circ('#7a90d8', PL[0], PL[1], 64); circ('#b8c8ff', PL[0], PL[1], 22); block(PL[0] - PL[2] - 50, PL[1] - PL[2] - 50, PL[2] * 2 + 100, PL[2] * 2 + 100); }
  M.extra(D);
  M.B.forEach(function (b) { building(g, b); block(b.x - 40, b.y - (b.tower ? 210 : 50), b.w + 80, b.h + (b.tower ? 270 : 110)); });
  M.B.forEach(function (b) { if (b.spur) line(C.road, b.spur[0], b.spur[1], 34); if (b.k !== 'lot' && b.k !== 'portal') rect('#9a92aa', b.dx - 24, b.b, 48, 8); });
  /* lamps along roads and by doors; flower beds, barrels, bushes by each building */
  function lamp(x, y) { rect('#1c1a26', x - 2, y - 32, 5, 32); circ(C.lamp, x, y - 38, 9); }
  M.R.forEach(function (s) { if (s[3] === 'd' || s[3] === 'rope' || s[3] === 'beam') return; var A = P[s[0]], Bp = P[s[1]], L = Math.hypot(Bp[0] - A[0], Bp[1] - A[1]), n = Math.floor(L / 260); for (var i = 1; i < n; i++) { var t = i / n, x = A[0] + (Bp[0] - A[0]) * t, y = A[1] + (Bp[1] - A[1]) * t; if (Math.abs(A[1] - Bp[1]) < 2) lamp(x, y - s[2] / 2 - 8); else lamp(x + s[2] / 2 + 12, y); } });
  if (M.PLAZA) for (i = 0; i < 8; i++) { var aa = i / 8 * 6.283 + .39; lamp(M.PLAZA[0] + (M.PLAZA[2] - 26) * Math.cos(aa), M.PLAZA[1] + (M.PLAZA[2] - 26) * Math.sin(aa) + 10); }
  M.B.forEach(function (b) {
    if (b.k === 'tower' || b.k === 'lot' || b.k === 'portal') return;
    if (b.k !== 'theater') lamp(b.dx + 40, b.b + 6);
    flowers(b.dx - 52, b.b + 20); flowers(b.dx + 76, b.b + 24);
    if (b.k !== 'theater') { barrel(b.x + 16, b.b + 14); barrel(b.x + 38, b.b + 22); crate(b.x + b.w - 34, b.b + 8); }
    circ(C.bush, b.x - 14, b.b - 12, 20); circ(C.bush, b.x + b.w + 14, b.b - 12, 20);
  });
  function flowers(x, y) { circ('#3c2c3c', x, y, 24, 12); var cs = ['#aa6edc', '#6e96f0', '#f0be5a', '#e47aa0']; for (var i = 0; i < 9; i++) circ(cs[i % 4], x + (r() - .5) * 36, y + (r() - .5) * 14, 4.5); }
  function barrel(x, y) { circ('#6e4630', x, y, 11); circ('#8a5a3c', x, y, 7); }
  function crate(x, y) { rect('#a07a4a', x - 11, y - 11, 22, 22); rect('#7a5a36', x - 11, y - 1, 22, 2); }
  /* hedges along the main roads, broken at crossings and doors */
  M.R.forEach(function (s) { var A = P[s[0]], Bp = P[s[1]]; if (s[3] === 'd' || s[3] === 'rope' || s[3] === 'beam' || Math.abs(A[1] - Bp[1]) > 2) return; var y0 = A[1] + s[2] / 2 + 22, x0 = Math.min(A[0], Bp[0]) + 60, x1 = Math.max(A[0], Bp[0]) - 60; for (var x = x0; x < x1; x += 150) { var xe = Math.min(x + 120, x1); if (M.B.some(function (b) { return b.dx > x - 50 && b.dx < xe + 50; }) || M.R.some(function (q) { var a = P[q[0]], c = P[q[1]]; return Math.abs(a[0] - c[0]) < 2 && a[0] > x - 60 && a[0] < xe + 60; })) continue; g.fillStyle = C.hedge; roundRect(g, x, y0 - 10, xe - x, 20, 10); } });
  /* trees: dense at the edges (they frame each map), scattered in open ground */
  var trees = [];
  function free(x, y, rad) { return !blocks.some(function (q) { return x + rad * .6 > q[0] && x - rad * .6 < q[0] + q[2] && y + 10 > q[1] && y - rad * 1.6 < q[1] + q[3]; }); }
  for (i = 0; i < 9000; i++) {
    var tx = Math.floor(r() * W), ty = Math.floor(r() * (M.LAKE ? M.LAKE - 40 : H)), edge = Math.min(tx, W - tx, ty, H - ty), rad = 34 + r() * 24;
    if (!onIsle(tx, ty, 50)) continue; var ie = (Math.pow((tx - IS[0]) / IS[2], 2) + Math.pow((ty - IS[1]) / IS[3], 2)); if (r() > (ie > .62 ? .55 : .03)) continue; if (!free(tx, ty, rad)) continue;
    if (trees.some(function (t) { return Math.hypot(t[0] - tx, t[1] - ty) < (t[2] + rad) * .85; })) continue; trees.push([tx, ty, rad]);
  }
  var dead = id === 'cliff', haunted = id === 'forest';
  trees.sort(function (p, q) { return p[1] - q[1]; }).forEach(function (t) { if (dead) { rect('#3a2c2a', t[0] - 4, t[1] - t[2], 8, t[2]); line('#3a2c2a', [t[0], t[1] - t[2] * .7], [t[0] - t[2] * .5, t[1] - t[2] * 1.2], 5); line('#3a2c2a', [t[0], t[1] - t[2] * .5], [t[0] + t[2] * .5, t[1] - t[2]], 5); return; } circ('#162a1c', t[0] + 6, t[1] + 8, t[2], t[2] * .9); circ(haunted ? '#1a2e2c' : C.tree, t[0], t[1], t[2]); circ(C.treeHi, t[0] - t[2] * .25, t[1] - t[2] * .3, t[2] * .55); });
}
function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.fill(); }
function building(g, b) {
  var KR = { dome: [40, 60, 120], keep: [26, 20, 26], brick: [140, 70, 50], chapel: [60, 50, 80], cathedral: [50, 44, 70], gothic: [60, 50, 80], gatehouse: [30, 24, 30], vault: [40, 24, 24], spire: [120, 80, 200], glassbridge: [150, 220, 240], tethergate: [200, 160, 80], house: [50, 50, 70], rotunda: [110, 60, 160], sealed: [110, 70, 170], gallery: [230, 220, 190], hearth: [90, 50, 150], neon: [70, 120, 40], spire: [120, 200, 220], crypt: [60, 50, 80], keep: [40, 30, 36], archive: [30, 28, 40], otherhouse: [70, 60, 66] };
  if (b.k === 'hearth') b.k2 = 'dome';
  var x = b.x, y = b.y, w = b.w, h = b.h, rc = b.roof || KR[b.k] || C.roof, R0 = 'rgb(' + rc.join(',') + ')', R1 = 'rgb(' + rc.map(function (v) { return Math.round(v * .8); }).join(',') + ')';
  function rect(c, a, bq, cw, ch) { g.fillStyle = c; g.fillRect(a, bq, cw, ch); }
  if (b.k === 'portal') {
    var cx = x + w / 2; rect('#3e3a4a', cx - 120, y - 60, 240, h + 60); rect('#2e2a38', cx - 150, y + h - 60, 300, 60);   /* ruined tower walls */
    rect('#4a4658', cx - 120, y - 60, 60, 40); rect('#4a4658', cx + 40, y - 90, 80, 50);   /* broken top */
    g.fillStyle = '#6a6478'; g.beginPath(); g.ellipse(cx, b.b - 110, 100, 120, 0, Math.PI, 0); g.fill(); rect('#6a6478', cx - 100, b.b - 110, 200, 110);
    g.fillStyle = '#7a3cff'; g.beginPath(); g.ellipse(cx, b.b - 100, 70, 90, 0, Math.PI, 0); g.fill(); rect('#7a3cff', cx - 70, b.b - 100, 140, 96); g.fillStyle = '#c8a0ff'; g.beginPath(); g.ellipse(cx, b.b - 70, 30, 50, 0, 0, 7); g.fill();
    for (var q = 0; q < 6; q++) rect('#9af0d0', cx - 92 + q * 34, b.b - 128 - (q % 2) * 8, 10, 6); return; }
  if (b.k === 'lot') { rect('#3a4a36', x, y, w, h); g.strokeStyle = C.fence; g.lineWidth = 4; g.setLineDash([10, 8]); g.strokeRect(x, y, w, h); g.setLineDash([]); rect('#5a3a24', x + w / 2 - 3, y + h - 50, 6, 40); rect('#8a5a34', x + w / 2 - 30, y + h - 60, 60, 22); return; }
  rect('rgba(0,0,0,.35)', x + 10, b.b - 6, w, 14);
  if (b.k === 'vault') { var vt = b.b - b.h; g.fillStyle = '#ff5a1a'; g.beginPath(); g.ellipse(x + w / 2, b.b, w / 2 + 30, 40, 0, 0, 7); g.fill(); rect('#1e1a22', x + 20, vt + 60, w - 40, b.h - 60); g.fillStyle = '#1e1a22'; g.beginPath(); g.ellipse(x + w / 2, vt + 60, w / 2 - 20, 40, 0, 0, 7); g.fill();
    g.fillStyle = '#e0b040'; for (var q2 = -1; q2 <= 1; q2++) { g.beginPath(); g.moveTo(x + w / 2 + q2 * 60 - 12, vt + 50); g.lineTo(x + w / 2 + q2 * 60, vt - 20); g.lineTo(x + w / 2 + q2 * 60 + 12, vt + 50); g.fill(); }
    rect('#ff3a3a', x + w / 2 - 14, vt + 110, 28, 40); rect('#6a1a1a', x + w / 2 - 34, b.b - 90, 68, 84); return; }
  if (b.k === 'glassbridge') { var gy = b.b - 120; rect('#2a3a4a', x, gy - 10, w, 90); rect('#9ad8f0', x + 6, gy, w - 12, 60); for (var gx2 = x + 30; gx2 < x + w; gx2 += 50) rect('#5a8aa0', gx2, gy, 4, 60); rect('#6a5a88', x + w / 2 - 40, gy + 80, 80, 120); rect('#2a1e2e', x + w / 2 - 20, gy + 150, 40, 50); return; }
  if (b.k === 'spire' || b.k === 'gatehouse' || b.k === 'keep') { var th = b.h, top = b.b - th, cc = b.k === 'spire' ? '#7a5ab8' : '#24202a';
    rect(cc, x + 30, top + 80, w - 60, th - 80); rect(b.k === 'spire' ? '#c8a050' : '#e0b040', x + 22, top + 70, w - 44, 16);
    g.fillStyle = b.k === 'spire' ? '#b48cff' : '#e0b040'; for (var q = 0; q < 3; q++) { g.beginPath(); var cx2 = x + w / 2 + (q - 1) * (w / 4); g.moveTo(cx2 - 22, top + 74); g.lineTo(cx2, top - (q === 1 ? 70 : 20)); g.lineTo(cx2 + 22, top + 74); g.fill(); }
    if (b.k === 'spire') { g.fillStyle = '#e0c8ff'; g.beginPath(); g.arc(x + w / 2, top - 110, 26, 0, 7); g.fill(); }
    for (var wy2 = top + 140; wy2 < b.b - 120; wy2 += 110) rect(b.k === 'spire' ? '#ffe090' : '#ff3a3a', x + w / 2 - 18, wy2, 36, 56);
    rect('#2a1e2e', x + w / 2 - 34, b.b - 96, 68, 90); return; }
  if (b.k === 'tower') {
    rect('#4a4658', x + 40, y + 80, w - 80, h - 80); g.fillStyle = '#5a2030'; g.beginPath(); g.moveTo(x + 20, y + 86); g.lineTo(x + w - 20, y + 86); g.lineTo(x + w / 2, y - 50); g.fill();
    rect('#ff4a3a', x + w / 2 - 16, y + 140, 32, 44); rect(C.door, x + w / 2 - 22, b.b - 64, 44, 64); rect('#c02a3a', x + w - 56, y + 96, 30, 80); rect('#c02a3a', x + 26, y + 96, 30, 80); return;
  }
  if (b.k === 'theater') {
    g.fillStyle = '#6a6478'; g.beginPath(); g.ellipse(x + w / 2, b.b, w / 2, h, 0, Math.PI, 0); g.fill();
    for (var i = 1; i < 6; i++) { g.strokeStyle = '#8a84a0'; g.lineWidth = 7; g.beginPath(); g.ellipse(x + w / 2, b.b, w / 2 - i * 26, h - i * 26, 0, Math.PI, 0); g.stroke(); }
    rect('#7a5232', x + w / 2 - 90, b.b - 80, 180, 70); rect('#a02a3a', x + w / 2 - 90, b.b - 104, 180, 28); return;
  }
  var rh = Math.round(h * .46), wh = h - rh;
  if (b.k === 'dome' || b.k2 === 'dome') { g.fillStyle = R0; g.beginPath(); g.ellipse(x + w / 2, y + rh, w / 2 - 8, rh, 0, Math.PI, 0); g.fill(); rect('#c8a050', x + w / 2 + 30, y + 10, 80, 20); }
  else if (b.k === 'glass') { g.fillStyle = '#7ab8c0'; g.beginPath(); g.ellipse(x + w / 2, y + rh, w / 2 - 4, rh, 0, Math.PI, 0); g.fill(); g.strokeStyle = '#3a6870'; g.lineWidth = 3; for (var xx = x + 30; xx < x + w; xx += 34) { g.beginPath(); g.moveTo(xx, y + rh); g.lineTo(x + w / 2, y + 6); g.stroke(); } }
  else { g.fillStyle = R0; g.beginPath(); g.moveTo(x + 10, y); g.lineTo(x + w - 10, y); g.lineTo(x + w, y + rh); g.lineTo(x, y + rh); g.fill(); for (var ry = y + 12; ry < y + rh; ry += 14) rect(R1, x + 6, ry, w - 12, 3); rect('#5a4a58', x + w * .72, y - 24, 24, 36); }
  if (b.tower) { var tx = x + w / 2 - 38; rect(C.wall, tx, y - 120, 76, 130); g.fillStyle = R0; g.beginPath(); g.moveTo(tx - 8, y - 120); g.lineTo(tx + 84, y - 120); g.lineTo(tx + 38, y - 200); g.fill(); g.fillStyle = '#faeac0'; g.beginPath(); g.arc(tx + 38, y - 80, 22, 0, 7); g.fill(); }
  rect(b.k === 'glass' ? '#4a7a80' : C.wall, x + 8, y + rh, w - 16, wh); rect('rgba(0,0,0,.25)', x + 8, y + rh, w - 16, 6);
  var n = Math.max(2, Math.floor((w - 40) / 56)); for (var i2 = 0; i2 < n; i2++) { var wx = x + 24 + i2 * (w - 48) / n + ((w - 48) / n - 26) / 2; if (Math.abs(wx + 13 - b.dx) < 34) continue; rect(C.win, wx, y + rh + 20, 26, 32); rect('#5a3a2a', wx - 4, y + rh + 52, 34, 5); }
  rect(C.door, b.dx - 20, b.b - 58, 40, 58); rect('#ffd890', b.dx + 26, b.b - 50, 9, 11);
}
function prompt(id) {
  var M = MAPS[id], parts = [];
  function where(x, y) { return (y < M.H / 3 ? 'top' : y < M.H * 2 / 3 ? 'middle' : 'bottom') + '-' + (x < M.W / 3 ? 'left' : x < M.W * 2 / 3 ? 'center' : 'right'); }
  M.B.forEach(function (b) { parts.push('at the ' + where(b.x + b.w / 2, b.y + b.h / 2) + ': ' + NAMES[b.id]); });
  return 'The first image is a flat-color LAYOUT SKETCH of one top-down RPG game map. Repaint it as ONE finished, richly detailed pixel-art game map of ' + M.desc + '. Keep the exact composition: the island outline, every path, bridge, building footprint, door, garden, lamp, bench, crystal and tree stays in the same place at the same size, and the bridges and light beams run off the edges of the image exactly where they do in the sketch. Buildings, left to right as in the sketch: ' + parts.join('; ') + '. The SECOND image is the official overview of this House: these are the very same buildings, so copy their architecture, shapes, colors, roofs, spires and details from it as closely as you can, just seen from this closer top-down three-quarter angle. Legend for the sketch: the near-black area with dots is the starry violet void (keep it deep space with stars and faint violet nebula), the dark rock under the island rim is its crumbling floating underside, the brown plank band is a rope-and-plank bridge over the void, a glowing colored band is a beam of light over the void (keep its color), lavender-grey bands are flagstone paths, dark green circles are trees, yellow dots on sticks are lamps, short brown bars are benches, violet and aqua spikes are glowing crystals. Do not add any buildings, bridges, paths or beams that are not in the sketch. No people or creatures. Do not draw any text, letters, labels, signs with writing, UI or grid lines. Match the art style of the THIRD image (the cozy cReapZ pixel-art game look) with soft magical night lighting and glowing windows. Top-down three-quarter RPG view, crisp pixel art, no blur.';
}
window.WORLD = { MAPS: MAPS, graph: graph, drawGuide: drawGuide, prompt: prompt };
})();
