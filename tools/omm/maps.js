/* Omm City as separate maps joined by roads. One source for each map's painting guide and its walking graph.
   Every map is painted as ONE image, so there are no seams. Exits at map edges link to another map's entry node. */
(function () {
/* building: id, x0, width, bottom; kinds: dome, glass, tower, theater; tower:1 adds a clock tower */
var MAPS = {
  hub: { name: 'Lantern Square', sub: 'The heart of the city', W: 2400, H: 1800, aspect: '4:3',
    P: { n: [1200, 0], s: [1200, 1800], w: [0, 960], e: [2400, 960], pN: [1200, 640], pS: [1200, 1280], pW: [880, 960], pE: [1520, 960], rw: [260, 640], re: [2140, 640] },
    R: [['n', 'pN', 84], ['pS', 's', 84], ['w', 'pW', 84], ['pE', 'e', 84], ['rw', 'pN', 56], ['pN', 're', 56]],
    PLAZA: [1200, 960, 320],
    B: [{ id: 'hall', x: 560, w: 400, b: 580, tower: 1 }, { id: 'post', x: 1330, w: 290, b: 580 }, { id: 'cafe', x: 1760, w: 300, b: 580 }],
    exits: { n: ['scholars', 's'], w: ['gate', 'e'], e: ['market', 'w'], s: ['lake', 'n'] },
    extra: function (d) {
      d.stalls([[1580, 1150, 0], [1720, 1210, 1], [1640, 1320, 2], [1800, 1340, 0], [1880, 1180, 2]]);
      d.pond(560, 1300, 150, 80); d.garden(250, 1080, 260, 140); d.garden(1940, 1440, 280, 150); d.garden(250, 260, 230, 170);
      d.benches([[960, 760], [1440, 760], [960, 1160], [1440, 1160], [520, 1430], [700, 1450], [1600, 1480]]);
      d.board(1050, 760); d.statue(1360, 770); d.well(380, 1520);
    },
    desc: 'the bustling central town square of a cozy city: a big round cobbled plaza with a carved stone fountain of glowing water in the middle, a quest notice board, a small statue, benches and colorful market stalls; the grand council hall with a clock tower, a post office with a red mailbox and a small cafe with a striped awning line the street to the north' },
  scholars: { name: "Scholars' Row", sub: 'Stars, books and making things', W: 2400, H: 1350, aspect: '16:9',
    P: { s: [1200, 1350], n: [1200, 0], a: [1200, 820], w0: [150, 820], e: [2400, 820] },
    R: [['n', 'a', 64], ['a', 's', 84], ['w0', 'a', 64], ['a', 'e', 64]],
    B: [{ id: 'obs', x: 150, w: 300, b: 760, k: 'dome' }, { id: 'lib', x: 520, w: 400, b: 760 }, { id: 'green', x: 1330, w: 300, b: 760, k: 'glass' }, { id: 'ws', x: 1780, w: 320, b: 760 }],
    exits: { s: ['hub', 'n'], e: ['cliff', 'w'], n: ['forest', 's'] },
    extra: function (d) { d.arch(1200, 120); d.garden(260, 960, 300, 150); d.garden(1700, 980, 320, 150); d.pond(900, 1080, 140, 70); d.benches([[700, 920], [1500, 920], [1000, 1220], [1400, 1220]]); d.well(2150, 1150); },
    desc: 'a quiet scholarly street of a cozy town: a round stone observatory with a brass telescope, a grand library, a glass greenhouse and a tinkerer workshop, with gardens and a pond in front and a stone archway where the road leaves north into the forest' },
  cliff: { name: 'Cliffside', sub: "Lucifer's corner", W: 1600, H: 1600, aspect: '1:1',
    P: { w: [0, 1180], c1: [380, 1180], c2: [700, 1060], c3: [860, 900] },
    R: [['w', 'c1', 56, 'd'], ['c1', 'c2', 44, 'd'], ['c2', 'c3', 44, 'd']],
    B: [{ id: 'tower', x: 740, w: 240, b: 860, k: 'tower', door: 'c3' }],
    exits: { w: ['scholars', 'e'] },
    extra: function (d) { d.cliff(860, 640, 520, 380); d.rocks([[560, 700], [1200, 760], [1240, 980], [480, 900], [1100, 1240], [620, 1340], [300, 1000], [1360, 560]]); },
    desc: 'a dramatic rocky cliff top at night: a winding dirt path climbs from the left to a tall dark stone wizard tower with a red glowing window and red banners; jagged rocks, a few gnarled dead trees, red flowers, mist below the cliff edge' },
  gate: { name: 'Gate Ward', sub: 'Where guests arrive', W: 2048, H: 1536, aspect: '4:3',
    P: { gate: [70, 900], e: [2048, 900], j: [1560, 900], s: [1560, 1536] },
    R: [['gate', 'j', 84], ['j', 'e', 84], ['j', 's', 60]],
    B: [{ id: 'welcome', x: 300, w: 360, b: 830 }, { id: 'inn', x: 900, w: 400, b: 830 }],
    exits: { e: ['hub', 'w'], s: ['guest', 'n'] },
    extra: function (d) { d.wall(900); d.garden(300, 1060, 320, 160); d.pond(1000, 1200, 150, 75); d.benches([[780, 1000], [1300, 1000], [1800, 1100]]); d.well(1800, 640); d.signpost(1630, 990); },
    desc: 'the gate district of a cozy walled town: a tall old stone town wall on the left with a wrought-iron gate where the main road enters, a welcome hall with flags and a two-story tavern inn with a hanging lantern sign along the road, gardens and a pond to the south' },
  guest: { name: 'Guest Quarter', sub: 'A cottage for every guest', W: 2048, H: 1536, aspect: '4:3',
    P: { n: [1024, 0], j: [1024, 860], w0: [200, 860], e0: [1850, 860] },
    R: [['n', 'j', 60], ['w0', 'j', 56], ['j', 'e0', 56]],
    B: [{ id: 'ct1', x: 250, w: 260, b: 800 }, { id: 'ct2', x: 600, w: 260, b: 800, roof: [52, 92, 100] }, { id: 'ct3', x: 1180, w: 260, b: 800 }, { id: 'lot', x: 1520, w: 260, b: 800, k: 'lot' }],
    exits: { n: ['gate', 's'] },
    extra: function (d) { d.garden(300, 1000, 300, 160); d.garden(1300, 1020, 300, 150); d.pond(900, 1180, 160, 80); d.benches([[700, 990], [1150, 1000], [1700, 1120]]); },
    desc: 'a peaceful guest quarter of small cozy cottages with flower boxes and picket fences, one empty grassy lot with a little wooden sign, vegetable gardens and a pond' },
  market: { name: 'Market Row', sub: 'Trade and play', W: 2048, H: 1536, aspect: '4:3',
    P: { w: [0, 760], e: [2048, 760], j: [1600, 760], s: [1600, 1536] },
    R: [['w', 'j', 84], ['j', 'e', 84], ['j', 's', 60]],
    B: [{ id: 'trade', x: 300, w: 360, b: 690 }, { id: 'arcade', x: 900, w: 360, b: 690 }],
    exits: { w: ['hub', 'e'], s: ['makers', 'n'], e: ['east', null] },
    extra: function (d) { d.stalls([[280, 900, 0], [440, 900, 1], [600, 900, 2], [760, 900, 0], [920, 900, 1], [1080, 900, 2], [1240, 900, 0]]); d.garden(1750, 1000, 240, 150); d.benches([[400, 1100], [800, 1100], [1200, 1100]]); d.pond(700, 1300, 150, 70); d.fog(1900, 760); },
    desc: 'a lively market street of a cozy town: a trading post shop with barrels and crates, a retro arcade with glowing teal and violet neon, a long row of colorful market stalls, and the road on the right fading into drifting mist' },
  makers: { name: "Makers' Lane", sub: 'Art and legends', W: 2048, H: 1536, aspect: '4:3',
    P: { n: [1024, 0], j: [1024, 860], w0: [200, 860], e0: [1850, 860] },
    R: [['n', 'j', 60], ['w0', 'j', 56], ['j', 'e0', 56]],
    B: [{ id: 'gallery', x: 300, w: 380, b: 800 }, { id: 'legends', x: 1200, w: 420, b: 800 }],
    exits: { n: ['market', 's'] },
    extra: function (d) { d.statues([[500, 1080], [800, 1120], [1300, 1100], [1600, 1080]]); d.garden(1700, 1250, 240, 150); d.pond(1000, 1250, 160, 80); d.benches([[650, 1000], [1450, 1000], [400, 1300]]); },
    desc: 'an artsy lane of a cozy town: an art gallery with big glass windows showing framed paintings, a museum hall of legends with stone columns and a bat-wing crest, a sculpture garden with statues on plinths, flowers and a pond' },
  forest: { name: 'The Veilwood', sub: 'Where the old portal sleeps', W: 2400, H: 1350, aspect: '16:9',
    P: { portal: [1200, 470], f1: [1040, 640], f2: [1290, 820], f3: [1120, 1020], s: [1200, 1350] },
    R: [['portal', 'f1', 46, 'd'], ['f1', 'f2', 46, 'd'], ['f2', 'f3', 46, 'd'], ['f3', 's', 50, 'd']],
    B: [{ id: 'portal', x: 990, w: 420, b: 450, k: 'portal' }],
    exits: { s: ['scholars', 'n'] },
    extra: function (d) { d.rocks([[700, 560], [1700, 600], [620, 900], [1820, 960], [880, 1180], [1560, 1200]]); d.shrooms([[860, 700], [1500, 700], [980, 900], [1420, 1060], [760, 1080], [1620, 860], [1350, 560], [1060, 520]]); d.stones([[900, 480], [1500, 480], [820, 620], [1580, 640]]); },
    desc: 'a hidden, ancient enchanted forest at the edge of the world, haunting and magical: towering twisted trees with roots like hands, thick mist, glowing blue mushrooms, mossy carved standing stones and will-o-wisp lights; in the clearing at the top stand the crumbling ruins of an ancient abandoned stone tower, and at its foot a magnificent carved stone portal arch covered in glowing runes, filled with a swirling vortex of violet void-fire; a winding dirt path leads down from the portal through the trees to the bottom edge' },
  lake: { name: 'Lakeside', sub: 'Slow evenings by the water', W: 2400, H: 1350, aspect: '16:9', LAKE: 760,
    P: { n: [1200, 0], a: [1200, 640], w0: [160, 640], e0: [2260, 640], pier: [1200, 760], dock: [1200, 1080] },
    R: [['n', 'a', 84], ['w0', 'a', 50, 'd'], ['a', 'e0', 50, 'd'], ['a', 'pier', 50]],
    B: [{ id: 'boat', x: 380, w: 320, b: 590 }, { id: 'theater', x: 1460, w: 500, b: 600, k: 'theater' }],
    exits: { n: ['hub', 's'] },
    extra: function (d) { d.dock(1200, 760, 1110); d.benches([[880, 560], [2100, 560]]); d.reeds([[300, 800], [700, 820], [1700, 810], [2100, 800]]); },
    desc: 'a lakefront at night: a wooden boathouse with paper lanterns, an open-air amphitheater with curved stone seats and a small stage with red curtains, a dirt path along the shore, a calm dark lake with a long wooden pier and dock' },
};
var NAMES = { hall: 'the grand council hall with a clock tower', post: 'a post office with a round clock and a red mailbox', cafe: 'a small cafe with a striped awning and outdoor tables', obs: 'a round stone observatory with a domed roof and a brass telescope',
  lib: 'a grand two-story library with tall arched windows', green: 'a glass greenhouse full of glowing plants', ws: 'a tinkerer workshop with a big gear sign and barn doors', tower: 'a tall dark stone wizard tower with a red glowing window',
  welcome: 'a welcome hall with two flags and a lantern-lit entrance', inn: 'a two-story tavern inn with a hanging lantern sign', ct1: 'a small cozy guest cottage', ct2: 'a small cozy guest cottage with a teal roof', ct3: 'a small cozy guest cottage with a round door',
  lot: 'an empty grassy lot with a small wooden sign (no building)', portal: 'the crumbling ruins of an ancient abandoned stone tower, with a magnificent carved rune-covered stone portal arch at its base filled with swirling violet void-fire', trade: 'a trading post shop with barrels, crates and a scales sign', arcade: 'a retro arcade with glowing neon trim', gallery: 'an art gallery with big glass windows showing paintings',
  legends: 'a museum hall of legends with stone columns and a bat-wing crest', boat: 'a wooden boathouse with paper lanterns', theater: 'an open-air amphitheater with curved stone seats and a stage with red curtains' };
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
  rect(id === 'cliff' ? '#2c2a36' : C.grass, 0, 0, W, H);
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
    fog: function (x, y) { for (var i = 0; i < 8; i++) circ('rgba(200,195,230,.35)', x + (r() - .5) * 200, y + (r() - .5) * 220, 120, 80); block(x - 200, y - 260, 400, 520); }
  };
  /* roads */
  M.R.forEach(function (s) { line('#3a3248', P[s[0]], P[s[1]], s[2] + 8); });
  M.R.forEach(function (s) { line(s[3] === 'd' ? C.dirt : C.road, P[s[0]], P[s[1]], s[2]); block(Math.min(P[s[0]][0], P[s[1]][0]) - s[2] / 2 - 30, Math.min(P[s[0]][1], P[s[1]][1]) - s[2] / 2 - 30, Math.abs(P[s[0]][0] - P[s[1]][0]) + s[2] + 60, Math.abs(P[s[0]][1] - P[s[1]][1]) + s[2] + 60); });
  if (M.PLAZA) { var PL = M.PLAZA; circ('#3a3248', PL[0], PL[1], PL[2] + 6); circ(C.plaza, PL[0], PL[1], PL[2]); for (var i = 0; i < 3; i++) circ(i % 2 ? C.plaza : '#7e7692', PL[0], PL[1], PL[2] - 50 - i * 50); circ('#5a5470', PL[0], PL[1], 86); circ('#7a90d8', PL[0], PL[1], 64); circ('#b8c8ff', PL[0], PL[1], 22); block(PL[0] - PL[2] - 50, PL[1] - PL[2] - 50, PL[2] * 2 + 100, PL[2] * 2 + 100); }
  M.extra(D);
  M.B.forEach(function (b) { building(g, b); block(b.x - 40, b.y - (b.tower ? 210 : 50), b.w + 80, b.h + (b.tower ? 270 : 110)); });
  M.B.forEach(function (b) { if (b.spur) line(C.road, b.spur[0], b.spur[1], 34); if (b.k !== 'lot' && b.k !== 'portal') rect('#9a92aa', b.dx - 24, b.b, 48, 8); });
  /* lamps along roads and by doors; flower beds, barrels, bushes by each building */
  function lamp(x, y) { rect('#1c1a26', x - 2, y - 32, 5, 32); circ(C.lamp, x, y - 38, 9); }
  M.R.forEach(function (s) { if (s[3] === 'd') return; var A = P[s[0]], Bp = P[s[1]], L = Math.hypot(Bp[0] - A[0], Bp[1] - A[1]), n = Math.floor(L / 260); for (var i = 1; i < n; i++) { var t = i / n, x = A[0] + (Bp[0] - A[0]) * t, y = A[1] + (Bp[1] - A[1]) * t; if (Math.abs(A[1] - Bp[1]) < 2) lamp(x, y - s[2] / 2 - 8); else lamp(x + s[2] / 2 + 12, y); } });
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
  M.R.forEach(function (s) { var A = P[s[0]], Bp = P[s[1]]; if (s[3] === 'd' || Math.abs(A[1] - Bp[1]) > 2) return; var y0 = A[1] + s[2] / 2 + 22, x0 = Math.min(A[0], Bp[0]) + 60, x1 = Math.max(A[0], Bp[0]) - 60; for (var x = x0; x < x1; x += 150) { var xe = Math.min(x + 120, x1); if (M.B.some(function (b) { return b.dx > x - 50 && b.dx < xe + 50; }) || M.R.some(function (q) { var a = P[q[0]], c = P[q[1]]; return Math.abs(a[0] - c[0]) < 2 && a[0] > x - 60 && a[0] < xe + 60; })) continue; g.fillStyle = C.hedge; roundRect(g, x, y0 - 10, xe - x, 20, 10); } });
  /* trees: dense at the edges (they frame each map), scattered in open ground */
  var trees = [];
  function free(x, y, rad) { return !blocks.some(function (q) { return x + rad * .6 > q[0] && x - rad * .6 < q[0] + q[2] && y + 10 > q[1] && y - rad * 1.6 < q[1] + q[3]; }); }
  for (i = 0; i < 9000; i++) {
    var tx = Math.floor(r() * W), ty = Math.floor(r() * (M.LAKE ? M.LAKE - 40 : H)), edge = Math.min(tx, W - tx, ty, H - ty), rad = 34 + r() * 24;
    if (r() > (edge < 200 ? .95 : id === 'forest' ? .3 : .045)) continue; if (!free(tx, ty, rad)) continue;
    if (trees.some(function (t) { return Math.hypot(t[0] - tx, t[1] - ty) < (t[2] + rad) * .85; })) continue; trees.push([tx, ty, rad]);
  }
  var dead = id === 'cliff', haunted = id === 'forest';
  trees.sort(function (p, q) { return p[1] - q[1]; }).forEach(function (t) { if (dead) { rect('#3a2c2a', t[0] - 4, t[1] - t[2], 8, t[2]); line('#3a2c2a', [t[0], t[1] - t[2] * .7], [t[0] - t[2] * .5, t[1] - t[2] * 1.2], 5); line('#3a2c2a', [t[0], t[1] - t[2] * .5], [t[0] + t[2] * .5, t[1] - t[2]], 5); return; } circ('#162a1c', t[0] + 6, t[1] + 8, t[2], t[2] * .9); circ(haunted ? '#1a2e2c' : C.tree, t[0], t[1], t[2]); circ(C.treeHi, t[0] - t[2] * .25, t[1] - t[2] * .3, t[2] * .55); });
}
function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.fill(); }
function building(g, b) {
  var x = b.x, y = b.y, w = b.w, h = b.h, rc = b.roof || C.roof, R0 = 'rgb(' + rc.join(',') + ')', R1 = 'rgb(' + rc.map(function (v) { return Math.round(v * .8); }).join(',') + ')';
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
  if (b.k === 'dome') { g.fillStyle = R0; g.beginPath(); g.ellipse(x + w / 2, y + rh, w / 2 - 8, rh, 0, Math.PI, 0); g.fill(); rect('#c8a050', x + w / 2 + 30, y + 10, 80, 20); }
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
  return 'The first image is a flat-color LAYOUT SKETCH of one top-down RPG town map. Repaint it as ONE finished, richly detailed game map of ' + M.desc + '. Keep the exact composition: every street, path, building footprint, door, hedge, garden, pond, lamp, bench and tree stays in the same place at the same size, and roads run off the edges exactly where they do in the sketch. Buildings: ' + parts.join('; ') + '. Legend: lavender-grey bands are cobblestone streets, brown bands are dirt paths, dark green circles are trees, small green circles are bushes, dark rounded strips are low hedges, brown rectangles with green stripes are fenced vegetable gardens, yellow dots on black sticks are street lamps, small brown circles are barrels, tan squares are crates, dark ovals with colored dots are flower beds, short brown bars are benches, striped rectangles are market stalls. Do not add any buildings that are not in the sketch. ' + (MAPS[id].ref ? 'Match the art style, palette and lighting of the second image exactly. ' : '') + 'Style: charming cozy 16-bit pixel art in the style of a classic handheld Pokemon town map at night. Deep violet, indigo and dark teal shadows; warm golden glow around every street lamp and lit window, soft pools of lamplight on the cobblestones, gentle cast shadows. Plum shingle roofs with chimneys, timber-framed cream plaster walls, wooden shutters, flower boxes. Lush dark foliage, round bushy trees, tiny glowing flowers. Every building is drawn straight-on from the front in classic top-down RPG perspective: roof on top, front wall facing the viewer, door at the bottom; NOT isometric. Even lighting all the way to the edges, no vignette.';
}
window.WORLD = { MAPS: MAPS, graph: graph, drawGuide: drawGuide, prompt: prompt };
})();
