/* Omm City rooms: top-down interior layouts (1024 x 1024). One source for the painted room guide and the walkable floor. */
(function () {
var S = 1024, WALL = 210, SIDE = 40;
/* item: [type, x, y, w, h, extra]  (top-left corner, map pixels) */
var ROOMS = {
  inn: { name: 'The Lantern Inn', floor: 'wood', desc: 'a cozy tavern inn', up: 'inn2',
    items: [['fireplace', 432, 120, 160, 120], ['counter', 70, 250, 80, 330], ['counter', 70, 250, 300, 70], ['shelf', 60, 60, 300, 150], ['window', 680, 70, 90, 100], ['window', 820, 70, 90, 100],
      ['stool', 190, 340], ['stool', 190, 420], ['stool', 190, 500], ['stool', 220, 340],
      ['rug', 380, 420, 300, 200], ['table', 470, 470, 90], ['table', 690, 360, 90], ['table', 690, 620, 90], ['table', 330, 680, 90], ['stairs', 830, 240, 150, 220], ['barrel', 80, 640], ['barrel', 80, 700], ['plant', 900, 860], ['plant', 80, 880], ['mat', 452, 960, 120, 40]] },
  inn2: { name: 'The Lantern Inn, upstairs', floor: 'wood', desc: 'the upstairs guest rooms of an inn: a hallway with three small bedrooms divided by low wooden walls', down: 'inn',
    items: [['stairs', 830, 240, 150, 220], ['partition', 340, 220, 20, 360], ['partition', 640, 220, 20, 360], ['bed', 80, 260, 130, 190], ['bed', 400, 260, 130, 190], ['bed', 690, 600, 130, 190], ['rug', 120, 480, 180, 90], ['rug', 420, 480, 180, 90],
      ['wardrobe', 230, 230, 90, 60], ['wardrobe', 550, 230, 70, 60], ['window', 120, 70, 90, 100], ['window', 440, 70, 90, 100], ['window', 760, 70, 90, 100], ['table', 880, 720, 70], ['plant', 80, 860], ['rug', 120, 700, 520, 120]] },
  lib: { name: 'Library & Hall of Records', floor: 'wood', desc: 'a grand library', up: 'lib2',
    items: [['shelf', 60, 50, 380, 160], ['shelf', 584, 50, 380, 160], ['window', 462, 60, 100, 120], ['bookrow', 90, 330, 260, 60], ['bookrow', 90, 520, 260, 60], ['bookrow', 674, 330, 200, 60], ['bookrow', 674, 520, 200, 60],
      ['rtable', 420, 400, 190, 110], ['chair', 440, 360], ['chair', 540, 360], ['chair', 440, 520], ['chair', 540, 520], ['globe', 900, 300, 60], ['armchair', 820, 760], ['armchair', 120, 760], ['rug', 360, 660, 300, 160], ['stairs', 880, 420, 110, 200], ['plant', 60, 880], ['mat', 452, 960, 120, 40]] },
  lib2: { name: 'The Hall of Records', floor: 'stone', desc: 'an archive room: rows of tall filing cabinets and scroll racks, a big central lectern holding an open ledger, and a glowing pink projector pad on the floor', down: 'lib',
    items: [['shelf', 60, 50, 904, 160], ['stairs', 880, 420, 110, 200], ['cabinetrow', 80, 300, 200, 60], ['cabinetrow', 80, 480, 200, 60], ['cabinetrow', 80, 660, 200, 60], ['cabinetrow', 620, 300, 200, 60], ['cabinetrow', 620, 660, 200, 60],
      ['lectern', 452, 420, 120, 90], ['pad', 470, 640, 90, 90], ['rug', 360, 560, 300, 260], ['plant', 60, 880]] },
  hall: { name: 'Council Hall', floor: 'stone', desc: 'a council chamber',
    items: [['banner', 200, 40, 70, 150], ['banner', 754, 40, 70, 150], ['window', 360, 50, 90, 140], ['window', 574, 50, 90, 140], ['dais', 362, 220, 300, 90], ['throne', 482, 210, 60, 70], ['rug', 452, 300, 120, 680],
      ['roundtable', 382, 420, 260], ['benchrow', 70, 330, 60, 420], ['benchrow', 894, 330, 60, 420], ['plant', 70, 230], ['plant', 900, 230], ['plant', 70, 880], ['plant', 900, 880], ['mat', 452, 960, 120, 40]] },
  obs: { name: "Jove's Observatory", floor: 'stone', desc: 'an observatory with the dome open to the stars',
    items: [['window', 380, 40, 260, 150], ['platform', 362, 330, 300, 300], ['telescope', 452, 380, 120, 160], ['desk', 80, 260, 200, 90], ['desk', 744, 260, 200, 90], ['chart', 60, 50, 280, 150], ['chart', 684, 50, 280, 150], ['globe', 120, 700, 70],
      ['shelf', 800, 600, 160, 70], ['rug', 360, 700, 300, 180], ['chair', 160, 370], ['chair', 820, 370], ['plant', 60, 880], ['mat', 452, 960, 120, 40]] },
  ws: { name: 'The Workshop', floor: 'stone', desc: "a tinkerer's workshop",
    items: [['toolwall', 60, 50, 904, 160], ['bench', 70, 240, 320, 90], ['bench', 634, 240, 320, 90], ['machine', 392, 430, 240, 200], ['anvil', 140, 560, 90, 60], ['crate', 820, 520, 70], ['crate', 890, 590, 70], ['barrel', 840, 700], ['bench', 70, 760, 90, 180], ['rug', 360, 700, 300, 160], ['mat', 452, 960, 120, 40]] },
  tower: { name: "Lucifer's Tower", floor: 'dark', desc: "a villain's tower chamber in red and black",
    items: [['window', 440, 40, 144, 150], ['banner', 250, 40, 80, 150], ['banner', 694, 40, 80, 150], ['dais', 362, 220, 300, 110], ['throne', 467, 200, 90, 110], ['rug', 452, 330, 120, 650], ['shelf', 60, 230, 90, 400], ['shelf', 874, 230, 90, 400],
      ['crystal', 230, 560, 90], ['cauldron', 720, 560, 100], ['candles', 300, 300, 40], ['candles', 690, 300, 40], ['mat', 452, 960, 120, 40]] },
  welcome: { name: 'Welcome Hall', floor: 'wood', desc: 'a welcome hall',
    items: [['wallmap', 340, 40, 344, 150], ['window', 120, 60, 120, 120], ['window', 784, 60, 120, 120], ['desk', 362, 300, 300, 100], ['lectern', 160, 470, 90, 70], ['benchrow', 700, 520, 260, 60], ['benchrow', 700, 680, 260, 60], ['coatrack', 80, 260, 60], ['plant', 80, 860], ['plant', 900, 860], ['rug', 382, 500, 260, 400], ['mat', 452, 960, 120, 40]] },
  post: { name: "Peevy's Post Office", floor: 'wood', desc: 'a post office',
    items: [['pigeonholes', 60, 40, 904, 170], ['counter', 70, 330, 884, 80], ['sorttable', 160, 240, 200, 70], ['parcels', 700, 240, 140, 70], ['sacks', 70, 520, 120], ['sacks', 834, 520, 120], ['benchrow', 330, 640, 360, 60], ['plant', 80, 860], ['plant', 900, 860], ['rug', 382, 720, 260, 200], ['mat', 452, 960, 120, 40]] },
  cafe: { name: 'Moonbean Café', floor: 'wood', desc: 'a small cafe',
    items: [['chalkboard', 120, 50, 260, 140], ['window', 500, 60, 140, 120], ['window', 720, 60, 140, 120], ['counter', 620, 250, 330, 90], ['espresso', 820, 220, 90, 60], ['cake', 660, 250, 120, 60], ['table', 140, 320, 80], ['table', 360, 330, 80], ['table', 160, 560, 80], ['table', 420, 560, 80], ['table', 760, 560, 80], ['table', 300, 780, 80], ['table', 740, 780, 80], ['plant', 60, 880], ['plant', 910, 420], ['mat', 452, 960, 120, 40]] },
  trade: { name: "Dingbat's Trading Post", floor: 'wood', desc: 'a trading post shop',
    items: [['shelf', 60, 50, 904, 160], ['counter', 600, 300, 340, 90], ['scales', 740, 270, 70, 50], ['display', 100, 320, 200, 120], ['display', 100, 560, 200, 120], ['display', 400, 560, 200, 120], ['crate', 820, 560, 70], ['crate', 880, 630, 70], ['barrel', 820, 760], ['barrel', 880, 800], ['rug', 382, 760, 260, 160], ['mat', 452, 960, 120, 40]] },
  arcade: { name: 'The Arcade', floor: 'neon', desc: 'a retro arcade with a dark checkered floor',
    items: [['cabrow', 60, 120, 904, 110], ['cabrow', 150, 400, 300, 90], ['cabrow', 574, 400, 300, 90], ['claw', 80, 620, 120, 140], ['prizes', 700, 620, 250, 90], ['neon', 300, 30, 424, 60], ['benchrow', 330, 700, 300, 50], ['plant', 60, 880], ['mat', 452, 960, 120, 40]] },
  gallery: { name: 'The Gallery', floor: 'wood', desc: 'an art gallery with empty golden picture frames waiting for art',
    items: [['frames', 60, 50, 904, 150], ['pedestal', 250, 380, 80], ['pedestal', 700, 380, 80], ['pedestal', 470, 560, 80], ['benchrow', 360, 380, 300, 60], ['benchrow', 120, 640, 60, 220], ['benchrow', 844, 640, 60, 220], ['spot', 200, 220, 60], ['spot', 760, 220, 60], ['plant', 80, 880], ['plant', 900, 880], ['mat', 452, 960, 120, 40]] },
  legends: { name: 'Hall of Legends', floor: 'stone', desc: 'a museum hall with a huge bat-wing crest on the back wall',
    items: [['crest', 362, 40, 300, 160], ['banner', 150, 40, 80, 150], ['banner', 794, 40, 80, 150], ['case', 100, 300, 180, 90], ['case', 744, 300, 180, 90], ['case', 100, 560, 180, 90], ['case', 744, 560, 180, 90], ['statue', 452, 300, 120], ['statue', 452, 560, 120], ['rug', 452, 680, 120, 300], ['plant', 60, 880], ['plant', 910, 880], ['mat', 452, 960, 120, 40]] },
  cottage: { name: 'Guest Cottage', floor: 'wood', desc: 'a cozy one-room guest cottage',
    items: [['fireplace', 432, 120, 160, 120], ['window', 140, 70, 110, 110], ['window', 774, 70, 110, 110], ['bed', 90, 260, 160, 220], ['wardrobe', 780, 240, 150, 70], ['rtable', 640, 520, 180, 110], ['chair', 600, 560], ['chair', 840, 560], ['rug', 330, 420, 280, 200], ['armchair', 160, 640], ['plant', 80, 880], ['plant', 900, 880], ['mat', 452, 960, 120, 40]] },
  green: { name: 'The Greenhouse', floor: 'stone', desc: 'a glass greenhouse full of softly glowing plants',
    items: [['window', 60, 40, 904, 160], ['planter', 90, 280, 300, 80], ['planter', 634, 280, 300, 80], ['planter', 90, 480, 300, 80], ['planter', 634, 480, 300, 80], ['pond', 432, 600, 160, 110], ['potbench', 90, 700, 220, 80], ['plant', 840, 700], ['plant', 900, 780], ['plant', 70, 880], ['mat', 452, 960, 120, 40]] },
  boat: { name: 'The Boathouse', floor: 'wood', desc: 'a boathouse with paper lanterns hanging from the rafters',
    items: [['window', 380, 40, 264, 150], ['canoes', 60, 230, 180, 520], ['canoes', 784, 230, 180, 520], ['lanterntable', 382, 300, 260, 110], ['nets', 300, 560, 90, 90], ['crate', 640, 560, 70], ['barrel', 700, 650], ['rug', 382, 680, 260, 160], ['mat', 452, 960, 120, 40]] },
  theater: { name: 'The Amphitheater', floor: 'wood', desc: 'a small theater seen from above: a raised wooden stage with red curtains at the top and rows of wooden benches below, an aisle down the middle',
    items: [['curtain', 60, 30, 904, 170], ['stage', 160, 200, 704, 230], ['footlights', 160, 410, 704, 20], ['seatrow', 90, 520, 360, 50], ['seatrow', 574, 520, 360, 50], ['seatrow', 90, 640, 360, 50], ['seatrow', 574, 640, 360, 50], ['seatrow', 90, 760, 360, 50], ['seatrow', 574, 760, 360, 50], ['mat', 452, 960, 120, 40]] }
};
var WALKABLE = { rug: 1, mat: 1, stage: 1, platform: 1, pad: 1, footlights: 0, dais: 0 };
var FLOORS = { wood: '#7a5236', stone: '#5e5a6e', dark: '#2e2232', neon: '#2a2440' };
var COL = { fireplace: '#6a6478', counter: '#5a3420', shelf: '#4a2c1c', window: '#8ab0e0', stool: '#a06a40', rug: '#8a2c3a', table: '#9a6a40', rtable: '#9a6a40', stairs: '#9a92a8', barrel: '#6e4630', plant: '#3c8a4a', mat: '#a08a5a',
  partition: '#5a3a24', bed: '#c8b8a0', wardrobe: '#5a3420', bookrow: '#4a2c1c', globe: '#4a7ab0', armchair: '#7a3a5a', chair: '#8a5a34', cabinetrow: '#6a6478', lectern: '#6a4028', pad: '#ff4aa0', banner: '#7a2c4a', dais: '#8a84a0',
  throne: '#c8a050', roundtable: '#8a5a34', benchrow: '#7a5232', platform: '#7a7490', telescope: '#c8a050', desk: '#6a4028', chart: '#3a4a7a', toolwall: '#4a3a30', bench: '#6a4a30', machine: '#7a8a9a', anvil: '#3a3a44', crate: '#a07a4a',
  crystal: '#9a6aff', cauldron: '#2a2a30', candles: '#ffd890', wallmap: '#c8b080', coatrack: '#5a3420', pigeonholes: '#5a3420', sorttable: '#8a5a34', parcels: '#c8a070', sacks: '#b8a07a', chalkboard: '#2a3a30', espresso: '#8a8a9a', cake: '#e8c8d0',
  scales: '#c8a050', display: '#8a5a34', cabrow: '#2a2a3a', claw: '#e05a8a', prizes: '#c8a050', neon: '#40e0e0', frames: '#c8a050', pedestal: '#c8c4d8', spot: '#fff0b0', crest: '#5a4a6a', case: '#a8d0e8', statue: '#b8b4c8',
  planter: '#4a3a28', pond: '#4a6ab0', potbench: '#6a4a30', canoes: '#8a5a34', lanterntable: '#8a5a34', nets: '#8a8a7a', curtain: '#a02a3a', stage: '#a87a4a', footlights: '#ffd890', seatrow: '#7a5232' };
var LEGEND = { fireplace: 'a stone fireplace with a crackling fire', counter: 'a long wooden bar counter', shelf: 'tall shelves full of bottles, books and jars', window: 'a tall window with moonlight', stool: 'a bar stool', rug: 'a patterned rug', table: 'a round wooden table with chairs and a candle',
  rtable: 'a rectangular wooden table', stairs: 'a wooden staircase', barrel: 'a barrel', plant: 'a potted plant', mat: 'the entrance doormat at the bottom wall opening', partition: 'a low wooden dividing wall', bed: 'a cozy bed with a quilt', wardrobe: 'a wardrobe', bookrow: 'a freestanding double-sided bookcase',
  globe: 'a globe on a stand', armchair: 'a plush armchair with a reading lamp', chair: 'a wooden chair', cabinetrow: 'a row of tall archive filing cabinets', lectern: 'a lectern with an open book', pad: 'a glowing pink circular projector pad on the floor', banner: 'a hanging banner', dais: 'a raised stone dais with steps',
  throne: 'a carved high-backed chair', roundtable: 'a big round council table ringed with seven chairs', benchrow: 'a wooden bench', platform: 'a round raised platform', telescope: 'a huge brass telescope', desk: 'a desk covered in papers and instruments', chart: 'star charts pinned to the wall',
  toolwall: 'a wall of hanging tools', bench: 'a cluttered workbench', machine: 'a half-built brass contraption with gears', anvil: 'an anvil', crate: 'a wooden crate', crystal: 'a table with a glowing crystal ball', cauldron: 'a black bubbling cauldron', candles: 'a cluster of candles',
  wallmap: 'a big painted map of the town on the wall', coatrack: 'a coat rack', pigeonholes: 'a wall of pigeonhole mail slots', sorttable: 'a mail sorting table', parcels: 'stacked parcels', sacks: 'mail sacks', chalkboard: 'a chalkboard menu', espresso: 'a coffee machine', cake: 'a glass case of pastries',
  scales: 'brass scales', display: 'a display table of curious trinkets', cabrow: 'a row of glowing arcade cabinets', claw: 'a claw machine full of plushies', prizes: 'a prize counter', neon: 'a neon sign', frames: 'empty golden picture frames on the wall', pedestal: 'a sculpture on a white pedestal', spot: 'a spotlight',
  crest: 'a huge carved bat-wing crest', case: 'a glass display case with relics', statue: 'a stone statue on a plinth', planter: 'a raised planter bed of glowing plants', pond: 'a small indoor pond', potbench: 'a potting bench with pots and a watering can', canoes: 'canoes stacked on racks',
  lanterntable: 'a table covered in paper lanterns being made', nets: 'fishing nets', curtain: 'red velvet stage curtains', stage: 'a raised wooden stage', footlights: 'a row of footlights', seatrow: 'a row of theater benches' };

function drawRoom(g, id) {
  var R = ROOMS[id];
  g.fillStyle = '#1a1420'; g.fillRect(0, 0, S, S);
  g.fillStyle = FLOORS[R.floor]; g.fillRect(SIDE, WALL, S - SIDE * 2, S - WALL - SIDE);
  if (R.floor === 'wood') { g.fillStyle = 'rgba(0,0,0,.18)'; for (var y = WALL; y < S - SIDE; y += 34) g.fillRect(SIDE, y, S - SIDE * 2, 3); }
  if (R.floor === 'stone' || R.floor === 'dark') { g.fillStyle = 'rgba(0,0,0,.18)'; for (var y2 = WALL; y2 < S - SIDE; y2 += 64) g.fillRect(SIDE, y2, S - SIDE * 2, 3); for (var x2 = SIDE; x2 < S; x2 += 64) g.fillRect(x2, WALL, 3, S - WALL - SIDE); }
  if (R.floor === 'neon') { for (var cy = WALL; cy < S - SIDE; cy += 64) for (var cx = SIDE; cx < S - SIDE; cx += 64) if (((cx + cy) / 64) % 2 < 1) { g.fillStyle = '#3a3256'; g.fillRect(cx, cy, 64, 64); } }
  g.fillStyle = R.floor === 'dark' ? '#3a2430' : '#b89a78'; g.fillRect(SIDE, 0, S - SIDE * 2, WALL);   /* back wall face */
  g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(SIDE, WALL - 14, S - SIDE * 2, 14);
  g.fillStyle = '#2a1e24'; g.fillRect(0, 0, SIDE, S); g.fillRect(S - SIDE, 0, SIDE, S); g.fillRect(0, S - SIDE, S, SIDE); g.fillRect(0, 0, S, 12);
  g.fillStyle = FLOORS[R.floor]; g.fillRect(452, S - SIDE, 120, SIDE);   /* doorway */
  R.items.forEach(function (it) {
    var t = it[0], x = it[1], y = it[2], w = it[3] || 50, h = it[4] || w, c = COL[t] || '#888';
    g.fillStyle = c;
    if (t === 'table' || t === 'globe' || t === 'plant' || t === 'barrel' || t === 'roundtable' || t === 'crystal' || t === 'cauldron' || t === 'pedestal' || t === 'statue' || t === 'spot' || t === 'sacks' || t === 'candles') {
      if (t === 'plant' || t === 'barrel') { w = h = 56; }
      g.beginPath(); g.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, 7); g.fill();
      if (t === 'table' || t === 'roundtable') { var n = t === 'roundtable' ? 7 : 4, rr = w / 2 + 18; g.fillStyle = COL.chair; for (var i = 0; i < n; i++) { var a = i / n * 6.283 + .4; g.fillRect(x + w / 2 + Math.cos(a) * rr - 12, y + h / 2 + Math.sin(a) * rr - 12, 24, 24); } g.fillStyle = '#ffd890'; g.beginPath(); g.arc(x + w / 2, y + h / 2, 7, 0, 7); g.fill(); }
      return;
    }
    if (t === 'stool' || t === 'chair' || t === 'armchair') { var s = t === 'armchair' ? 70 : 36; g.fillRect(x, y, s, s); return; }
    if (t === 'crate') { g.fillRect(x, y, w, w); g.fillStyle = '#7a5a36'; g.fillRect(x, y + w / 2 - 2, w, 4); return; }
    g.fillRect(x, y, w, h);
    if (t === 'stairs') { g.fillStyle = '#6a6478'; for (var sy = y + 10; sy < y + h; sy += 22) g.fillRect(x, sy, w, 6); }
    if (t === 'shelf' || t === 'bookrow' || t === 'pigeonholes') { var cs = ['#a03c4a', '#3c6aa0', '#c8a050', '#4a8a5a']; for (var sx = x + 8, k = 0; sx < x + w - 10; sx += 16, k++) { g.fillStyle = cs[k % 4]; g.fillRect(sx, y + 12, 10, h - 24); } }
    if (t === 'cabrow') { g.fillStyle = '#40e0e0'; for (var ax = x + 20; ax < x + w - 40; ax += 80) g.fillRect(ax, y + 14, 40, 30); }
    if (t === 'fireplace') { g.fillStyle = '#ff8a30'; g.fillRect(x + w / 2 - 30, y + h - 50, 60, 40); }
    if (t === 'bed') { g.fillStyle = '#f0ece0'; g.fillRect(x + 10, y + 10, w - 20, 40); g.fillStyle = '#6a4a8a'; g.fillRect(x, y + 60, w, h - 60); }
    if (t === 'rug') { g.strokeStyle = '#c8a050'; g.lineWidth = 6; g.strokeRect(x + 12, y + 12, w - 24, h - 24); }
    if (t === 'frames') { g.fillStyle = '#b89a78'; for (var fx = x + 40; fx < x + w - 140; fx += 170) { g.fillStyle = '#c8a050'; g.fillRect(fx, y + 20, 120, 100); g.fillStyle = '#e8e0d0'; g.fillRect(fx + 10, y + 30, 100, 80); } }
    if (t === 'planter') { g.fillStyle = '#5ad08a'; for (var px = x + 20; px < x + w - 20; px += 40) { g.beginPath(); g.arc(px, y + h / 2, 14, 0, 7); g.fill(); } }
    if (t === 'seatrow' || t === 'benchrow') { g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x, y + h - 8, w, 8); }
  });
}
/* the walkable floor: a 32px grid; 1 = free */
function grid(id) {
  var R = ROOMS[id], n = S / 32, G = [];
  for (var j = 0; j < n; j++) { G.push([]); for (var i = 0; i < n; i++) G[j].push(j * 32 >= WALL && j * 32 < S - SIDE - 16 && i * 32 >= SIDE + 8 && i * 32 < S - SIDE - 24 ? 1 : 0); }
  R.items.forEach(function (it) {
    var t = it[0]; if (WALKABLE[t] === 1 || t === 'window' || t === 'banner' || t === 'chart' || t === 'frames' || t === 'neon' || t === 'crest' || t === 'wallmap' || t === 'chalkboard' || t === 'toolwall' || t === 'curtain') return;
    var x = it[1], y = it[2], w = it[3] || 50, h = it[4] || w, pad = 6;
    if (t === 'plant' || t === 'barrel') w = h = 56; if (t === 'stool' || t === 'chair') w = h = 36; if (t === 'armchair') w = h = 70;
    if (t === 'table' || t === 'roundtable') { x -= 26; y -= 26; w += 52; h += 52; }
    if (t === 'stairs') return;   /* stairs are walkable: they lead somewhere */
    for (var j = Math.floor((y - pad) / 32); j <= Math.floor((y + h + pad) / 32); j++) for (var i = Math.floor((x - pad) / 32); i <= Math.floor((x + w + pad) / 32); i++) if (G[j] && G[j][i] !== undefined) G[j][i] = 0;
  });
  for (var di = 14; di <= 17; di++) for (var dj = 28; dj < 32; dj++) G[dj][di] = 1;   /* the doorway */
  return G;
}
function prompt(id) {
  var R = ROOMS[id], by = {}, order = [], parts = [];
  function where(x, y) { return (y < 330 ? 'upper' : y < 660 ? 'middle' : 'lower') + ' ' + (x < 340 ? 'left' : x < 680 ? 'center' : 'right'); }
  R.items.forEach(function (it) { var t = it[0], w = it[3] || 50, h = it[4] || w; if (!by[t]) { by[t] = []; order.push(t); } by[t].push(where(it[1] + w / 2, it[2] + h / 2)); });
  order.forEach(function (t) { parts.push(LEGEND[t] + (t === 'stairs' ? (R.up ? ' going UP to the next floor' : ' going DOWN to the floor below') : '') + ' (' + by[t].filter(function (v, i, a) { return a.indexOf(v) === i; }).join(', ') + ')'); });
  return 'This is a flat-color LAYOUT SKETCH of a top-down RPG interior room (there is no magenta anywhere; ignore any instruction about magenta or backgrounds). Repaint it as a finished, richly detailed interior map of ' + R.desc + ', seen from directly above like a classic handheld Pokemon indoor room. Keep the exact composition: the back wall band across the top, the thin dark side walls, the floor, the doorway gap at the bottom center, and every piece of furniture stays in the same place at the same size. Do not add any furniture where the sketch shows open floor, and add no staircases besides the ones in the sketch. What is where: ' + parts.join('; ') + '. No people or characters. Style: charming cozy 16-bit pixel art at night, warm lamplight and candle glow, deep violet shadows, rich textures on wood, stone and fabric.';
}
window.ROOMS = { S: S, R: ROOMS, drawRoom: drawRoom, grid: grid, prompt: prompt };
})();
