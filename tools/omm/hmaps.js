/* The House as floating islands joined by bridges over the void (drawn and walked like Omm City). One source for each map's painting guide and its walking graph.
   Every map is painted as ONE image, so there are no seams. Exits at map edges link to another map's entry node. */
(function () {
/* building: id, x0, width, bottom; kinds: dome, glass, tower, theater; tower:1 adds a clock tower */
var MAPS = {
  hearth: { name: 'The Hearth', sub: 'The heart of the House', W: 2048, H: 1536, aspect: '4:3', ISLE: [1024, 800, 820, 600],
    P: { w: [0, 900], rw: [230, 900], e: [2048, 900], re: [1818, 900], n: [1400, 0], rn: [1400, 330], pNE: [1400, 700], pW: [720, 900], pE: [1330, 900], pN: [1024, 640], pS: [1024, 1180], gl: [1500, 1180] },
    R: [['w', 'rw', 70, 'b'], ['rw', 'pW', 70], ['re', 'e', 70, 'b'], ['pE', 're', 70], ['n', 'rn', 60, 'b'], ['rn', 'pNE', 60], ['pNE', 'pE', 56], ['pS', 'gl', 56]],
    PLAZA: [1024, 900, 300],
    B: [{ id: 'commons', x: 790, w: 470, b: 560, k: 'hearth', door: 'pN' }, { id: 'gallery', x: 1360, w: 300, b: 1140, k: 'glass' }],
    exits: { w: ['neon', 'e'], e: ['crypt', 'w'], n: ['other', 's'] },
    extra: function (d) { d.benches([[780, 1080], [1270, 1080], [700, 760], [1350, 760]]); d.crystals([[560, 1160], [1700, 760], [420, 720], [1640, 1280]]); d.garden(520, 1240, 260, 130); },
    portal: [1024, 900],
    desc: 'the floating heart island of an otherworldly mansion drifting in a starry violet void: a great domed stone hall with a glowing violet void-fire hearth seen through its arched doorway (the Hearth), a round flagstone plaza in front with a glowing violet portal ring set into its center (the way to Omm City), a small glass-fronted art gallery, lanterns, benches, violet crystals, and stone bridges leading off the island edges into the void' },
  neon: { name: 'The Neon Wing', sub: "Peevy's corner", W: 2048, H: 1536, aspect: '4:3', ISLE: [1024, 780, 760, 560],
    P: { e: [2048, 900], re: [1740, 900], n: [1300, 0], rn: [1300, 260], s: [1300, 1536], rs: [1300, 1300], j: [1300, 900], pw: [680, 900] },
    R: [['re', 'e', 70, 'b'], ['j', 're', 70], ['n', 'rn', 60, 'b'], ['rn', 'j', 60], ['j', 'rs', 60], ['rs', 's', 60, 'b'], ['pw', 'j', 60]],
    B: [{ id: 'peevy-h', x: 420, w: 520, b: 760, k: 'neon' }],
    exits: { e: ['hearth', 'w'], n: ['prism', 's'], s: ['archive', 'n'] },
    extra: function (d) { d.benches([[1000, 1020], [1560, 1020]]); d.crystals([[400, 1000], [1600, 640]]); d.garden(500, 1060, 260, 120); },
    desc: "a small floating island in a starry violet void with a tall narrow lime-green neon-lit studio townhouse (Peevy's wing: a studio flat, a recording studio and a neon hall with glowing signs and a support desk), potted plants, a little lime neon sign, string lights, and stone bridges leading off into the void" },
  prism: { name: 'The Prism Wing', sub: "Omm's corner", W: 2048, H: 1536, aspect: '4:3', ISLE: [1024, 800, 760, 560],
    P: { s: [1024, 1536], rs: [1024, 1330], j: [1024, 1000] },
    R: [['j', 'rs', 60], ['rs', 's', 60, 'b']],
    B: [{ id: 'omm-h', x: 800, w: 420, b: 900, k: 'spire' }],
    exits: { s: ['neon', 'n'] },
    extra: function (d) { d.garden(500, 1050, 300, 160); d.garden(1300, 1050, 300, 160); d.crystals([[420, 700], [1600, 720], [1500, 1260], [600, 1300]]); },
    desc: "a floating island in a starry void with a slender glass observatory spire full of rainbow light and prism crystals (Omm's wing: an observatory, a prism garden and a glass bridge), crystal gardens refracting rainbows, soft violet and aqua glow, and a stone bridge leading off into the void" },
  sky: { name: 'The Sky Wing', sub: "Jove's corner", W: 2048, H: 1536, aspect: '4:3', ISLE: [1024, 800, 760, 560],
    P: { s: [750, 1536], rs: [750, 1300], j: [750, 1000], pe: [1220, 1000] },
    R: [['j', 'rs', 60], ['rs', 's', 60, 'b'], ['j', 'pe', 60]],
    B: [{ id: 'jove-h', x: 1020, w: 400, b: 900, k: 'dome' }],
    exits: { s: ['crypt', 'n'] },
    extra: function (d) { d.crystals([[420, 760], [1620, 1120]]); d.benches([[1000, 1120], [1400, 1120]]); d.tether(1220, 420); },
    desc: "a floating island in a starry void with a round stone observatory dome and a big brass telescope pointed at the stars (Jove's wing: a planetarium, an observation deck and a glowing rope of light, the Sky Tether, rising from the island up into the sky), star charts, sky-blue lanterns, and a stone bridge leading off into the void" },
  crypt: { name: 'The Crypt Wing', sub: "Moro's corner", W: 2048, H: 1536, aspect: '4:3', ISLE: [1024, 780, 780, 580],
    P: { w: [0, 900], rw: [290, 900], n: [750, 0], rn: [750, 260], s: [750, 1536], rs: [750, 1300], j: [750, 900], pe: [1360, 900] },
    R: [['w', 'rw', 70, 'b'], ['rw', 'j', 70], ['n', 'rn', 60, 'b'], ['rn', 'j', 60], ['j', 'rs', 60], ['rs', 's', 60, 'b'], ['j', 'pe', 60]],
    B: [{ id: 'moro-h', x: 1100, w: 520, b: 760, k: 'crypt' }],
    exits: { w: ['hearth', 'e'], n: ['sky', 's'], s: ['bloodmoon', 'n'] },
    extra: function (d) { d.graves([[1000, 1080], [1120, 1150], [1460, 1080], [1580, 1160], [400, 1100], [1660, 1260]]); d.crystals([[1700, 700]]); },
    desc: "a floating island in a starry void with a gothic stone mausoleum-crypt with a bat-wing crest and purple stained glass (Moro's wing: his crypt, a library and a bat gallery), old gravestones, dead trees with bats, violet candles, and stone bridges leading off into the void" },
  bloodmoon: { name: 'The Blood Moon Wing', sub: "Lucifer's corner", W: 2048, H: 1536, aspect: '4:3', ISLE: [1024, 820, 760, 560],
    P: { n: [750, 0], rn: [750, 340], j: [750, 1000], pe: [1260, 1000] },
    R: [['n', 'rn', 60, 'b'], ['rn', 'j', 60], ['j', 'pe', 60]],
    B: [{ id: 'lucifer-h', x: 1010, w: 500, b: 880, k: 'keep' }],
    exits: { n: ['crypt', 's'] },
    extra: function (d) { d.embers([[960, 1120], [1560, 1100], [500, 1100], [1340, 1300]]); d.chains([[960, 760], [1620, 760]]); },
    desc: "a floating island in a starry void under a huge blood-red moon, with a dark spiked obsidian keep with red glowing windows and banners (Lucifer's wing: a throne room, an ember vault and a hall of chains), braziers of red fire, hanging chains, cracked red-veined rock, and a stone bridge leading off into the void" },
  archive: { name: 'The Archive Wing', sub: "Aevron's corner", W: 2048, H: 1536, aspect: '4:3', ISLE: [1024, 820, 760, 560],
    P: { n: [1300, 0], rn: [1300, 340], j: [1300, 1000], pw: [790, 1000] },
    R: [['n', 'rn', 60, 'b'], ['rn', 'j', 60], ['pw', 'j', 60]],
    B: [{ id: 'aevron-h', x: 560, w: 460, b: 880, k: 'archive' }],
    exits: { n: ['neon', 's'] },
    extra: function (d) { d.pillars([[480, 1100], [1560, 980], [700, 1260], [1580, 1240]]); },
    desc: "a floating island in a starry void with a sleek dark archive tower of black stone and glowing magenta-pink glyph panels and a big glowing screen (Aevron's wing: the Index, the Hall of Records and the Core), floating data pillars with pink light, neat hedges, and a stone bridge leading off into the void" },
  other: { name: 'The Other House', sub: 'Beyond the sealed door', W: 2048, H: 1536, aspect: '4:3', ISLE: [1024, 760, 800, 600],
    P: { s: [1400, 1536], rs: [1400, 1250], j: [1400, 1000], pw: [920, 1000] },
    R: [['j', 'rs', 60], ['rs', 's', 60, 'b'], ['pw', 'j', 60]],
    B: [{ id: 'threshold', x: 640, w: 560, b: 900, k: 'otherhouse' }],
    exits: { s: ['hearth', 'n'] },
    extra: function (d) { d.graves([[420, 1100], [1000, 1150]]); d.fogs([[460, 700], [1600, 700], [700, 1250]]); },
    desc: 'a forgotten floating island in a starry void, older and stranger than the rest: a crooked, overgrown Victorian manor with too many windows, one of them faintly lit, ivy and dead vines, a broken fountain, old lanterns, thick drifting fog, and a stone bridge leading off into the void' },
};
var NAMES = { commons: 'the Hearth, a great domed stone hall with a violet void-fire hearth glowing through its arched doorway', gallery: 'a small glass-fronted art gallery', 'peevy-h': "Peevy's tall lime-green neon-lit studio townhouse", 'omm-h': "Omm's slender glass observatory spire full of prism light", 'jove-h': "Jove's round stone observatory dome with a big brass telescope", 'moro-h': "Moro's gothic stone mausoleum-crypt with a bat-wing crest", 'lucifer-h': "Lucifer's dark spiked obsidian keep with red windows", 'aevron-h': "Aevron's sleek black archive tower with glowing magenta glyph panels", threshold: 'a crooked, overgrown Victorian manor with too many windows, the Other House' };
Object.keys(MAPS).forEach(function (id) {
  var M = MAPS[id]; M.id = id;
  M.B.forEach(function (b) {
    b.h = b.k === 'portal' ? 300 : b.k === 'tower' ? 380 : b.k === 'theater' ? 230 : b.k === 'lot' ? 120 : Math.round(b.w * (b.w > 340 ? .68 : .72));
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
    var dn = 'door_' + b.id; N[dn] = [b.dx, b.dy + 4];
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
    fogs: function (list) { list.forEach(function (p) { D.fog(p[0], p[1]); }); },
    fog: function (x, y) { for (var i = 0; i < 8; i++) circ('rgba(200,195,230,.35)', x + (r() - .5) * 200, y + (r() - .5) * 220, 120, 80); block(x - 200, y - 260, 400, 520); }
  };
  /* roads */
  M.R.forEach(function (s) { if (s[3] !== 'b') return; var A = P[s[0]], Bp = P[s[1]]; line('#2a2034', A, Bp, s[2] + 26); line('#6a5a48', A, Bp, s[2] + 14); line('#8a7458', A, Bp, s[2]);
    var L = Math.hypot(Bp[0] - A[0], Bp[1] - A[1]), ux = (Bp[0] - A[0]) / L, uy = (Bp[1] - A[1]) / L; for (var q = 0; q < L; q += 22) line('#5e4a38', [A[0] + ux * q - uy * s[2] / 2, A[1] + uy * q + ux * s[2] / 2], [A[0] + ux * q + uy * s[2] / 2, A[1] + uy * q - ux * s[2] / 2], 4); });
  M.R.forEach(function (s) { if (s[3] === 'b') return; line('#3a3248', P[s[0]], P[s[1]], s[2] + 8); });
  M.R.forEach(function (s) { if (s[3] !== 'b') line(s[3] === 'd' ? C.dirt : C.road, P[s[0]], P[s[1]], s[2]); block(Math.min(P[s[0]][0], P[s[1]][0]) - s[2] / 2 - 30, Math.min(P[s[0]][1], P[s[1]][1]) - s[2] / 2 - 30, Math.abs(P[s[0]][0] - P[s[1]][0]) + s[2] + 60, Math.abs(P[s[0]][1] - P[s[1]][1]) + s[2] + 60); });
  if (M.PLAZA) { var PL = M.PLAZA; circ('#3a3248', PL[0], PL[1], PL[2] + 6); circ(C.plaza, PL[0], PL[1], PL[2]); for (var i = 0; i < 3; i++) circ(i % 2 ? C.plaza : '#7e7692', PL[0], PL[1], PL[2] - 50 - i * 50); circ('#5a5470', PL[0], PL[1], 86); circ('#7a90d8', PL[0], PL[1], 64); circ('#b8c8ff', PL[0], PL[1], 22); block(PL[0] - PL[2] - 50, PL[1] - PL[2] - 50, PL[2] * 2 + 100, PL[2] * 2 + 100); }
  M.extra(D);
  M.B.forEach(function (b) { building(g, b); block(b.x - 40, b.y - (b.tower ? 210 : 50), b.w + 80, b.h + (b.tower ? 270 : 110)); });
  M.B.forEach(function (b) { if (b.spur) line(C.road, b.spur[0], b.spur[1], 34); if (b.k !== 'lot' && b.k !== 'portal') rect('#9a92aa', b.dx - 24, b.b, 48, 8); });
  /* lamps along roads and by doors; flower beds, barrels, bushes by each building */
  function lamp(x, y) { rect('#1c1a26', x - 2, y - 32, 5, 32); circ(C.lamp, x, y - 38, 9); }
  M.R.forEach(function (s) { if (s[3] === 'd' || s[3] === 'b') return; var A = P[s[0]], Bp = P[s[1]], L = Math.hypot(Bp[0] - A[0], Bp[1] - A[1]), n = Math.floor(L / 260); for (var i = 1; i < n; i++) { var t = i / n, x = A[0] + (Bp[0] - A[0]) * t, y = A[1] + (Bp[1] - A[1]) * t; if (Math.abs(A[1] - Bp[1]) < 2) lamp(x, y - s[2] / 2 - 8); else lamp(x + s[2] / 2 + 12, y); } });
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
  M.R.forEach(function (s) { var A = P[s[0]], Bp = P[s[1]]; if (s[3] === 'd' || s[3] === 'b' || Math.abs(A[1] - Bp[1]) > 2) return; var y0 = A[1] + s[2] / 2 + 22, x0 = Math.min(A[0], Bp[0]) + 60, x1 = Math.max(A[0], Bp[0]) - 60; for (var x = x0; x < x1; x += 150) { var xe = Math.min(x + 120, x1); if (M.B.some(function (b) { return b.dx > x - 50 && b.dx < xe + 50; }) || M.R.some(function (q) { var a = P[q[0]], c = P[q[1]]; return Math.abs(a[0] - c[0]) < 2 && a[0] > x - 60 && a[0] < xe + 60; })) continue; g.fillStyle = C.hedge; roundRect(g, x, y0 - 10, xe - x, 20, 10); } });
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
  var KR = { hearth: [90, 50, 150], neon: [70, 120, 40], spire: [120, 200, 220], crypt: [60, 50, 80], keep: [40, 30, 36], archive: [30, 28, 40], otherhouse: [70, 60, 66] };
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
  return 'The first image is a flat-color LAYOUT SKETCH of one top-down RPG game map. Repaint it as ONE finished, richly detailed pixel-art game map of ' + M.desc + '. Keep the exact composition: the island outline, every path, bridge, building footprint, door, garden, lamp, bench, crystal and tree stays in the same place at the same size, and the bridges run off the edges of the image exactly where they do in the sketch. Buildings: ' + parts.join('; ') + '. Legend: the near-black area with dots is the starry violet void the island floats in (keep it as deep space with stars and faint violet nebula), the dark rock rim under the island is its crumbling floating underside, wide brown plank bands are wooden-and-stone bridges with railings spanning the void, lavender-grey bands are flagstone paths, dark green circles are trees, yellow dots on black sticks are lamps, short brown bars are benches, small violet and aqua spikes are glowing crystals. Do not add any buildings, bridges or paths that are not in the sketch. Do not draw any text, letters, labels, signs with writing, UI or grid lines. Match the style of the second image (the cozy cReapZ pixel-art game look) with soft magical lighting, night-time, glowing windows. Top-down three-quarter RPG view, crisp pixel art, no blur.';
}
window.WORLD = { MAPS: MAPS, graph: graph, drawGuide: drawGuide, prompt: prompt };
})();
