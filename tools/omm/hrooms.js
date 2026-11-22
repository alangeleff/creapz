/* The House rooms, redone top-down (1024 x 1024) in the Omm City interior format.
   One source for each room's painting guide, its walkable floor, its doors and its anchor points.
   item: [type, x, y, w, h]  (top-left corner, room pixels)
   A: anchor points where the crew stand, sit or lie for each act: bed (sleep), notebook (write), workbench (build),
      game (the RPG), window, shelf, special (their own thing), desk (Peevy's support desk), plus named idle spots.
   seats: the council seats (the Hearth).
   doors: { bottom|left|right|top: room id } — bottom is the way out to the island unless it names a room. */
(function () {
var S = 1024, WALL = 210, SIDE = 40;
var ROOMS = {
  /* ---------- the Hearth island ---------- */
  commons: { name: 'The Hearth', floor: 'stone', desc: 'the round great hall at the heart of a magical floating house: a big hearth of cold violet void-fire against the back wall, a long council table with eight chairs in the middle, two mismatched couches, tall windows onto the starry void',
    items: [['hearthfire', 412, 70, 200, 150], ['void', 120, 50, 160, 140], ['void', 744, 50, 160, 140], ['longtable', 312, 470, 400, 140], ['couch', 70, 300, 90, 220], ['couch', 864, 300, 90, 220], ['rug', 280, 260, 464, 150],
      ['shelf', 60, 640, 90, 220], ['plant', 900, 860], ['plant', 70, 900], ['endtable', 880, 640, 70], ['mat', 452, 960, 120, 40]],
    seats: [[372, 440], [472, 440], [552, 440], [652, 440], [372, 640], [472, 640], [552, 640], [652, 640]],
    A: { hearth: [512, 300], table: [512, 700], couch: [190, 410], chair: [834, 410], winL: [200, 240], winR: [824, 240], door: [512, 900] },
    doors: { bottom: null } },
  gallery: { name: 'The Gallery', floor: 'wood', desc: "a quiet art gallery with warm plaster walls, softly lit empty golden frames waiting for Alan's art, and a pale oak floor",
    items: [['frames', 60, 50, 904, 150], ['panel', 60, 300, 40, 400], ['panel', 924, 300, 40, 400], ['benchrow', 362, 470, 300, 60], ['pedestal', 200, 640, 80], ['pedestal', 744, 640, 80], ['spot', 230, 230, 40], ['spot', 492, 230, 40], ['spot', 754, 230, 40], ['plant', 80, 880], ['plant', 900, 880], ['mat', 452, 960, 120, 40]],
    A: { left: [260, 330], mid: [512, 360], right: [764, 330], bench: [512, 450] },
    doors: { bottom: null } },

  /* ---------- Peevy, the Neon wing ---------- */
  'peevy-h': { name: 'The Neon Hall', floor: 'neon', desc: 'a hallway lit by buzzing lime-green neon tubes and taped-up flyers, with a little support desk with a computer and a bell, doors on the left and right walls',
    items: [['backdoor', 110, 30, 180, 180], ['backdoor', 734, 30, 180, 180], ['neon', 342, 40, 340, 60], ['poster', 362, 110, 120, 90], ['poster', 542, 110, 120, 90], ['helpdesk', 382, 400, 260, 90], ['chair', 494, 350], ['plant', 60, 260], ['plant', 910, 260], ['benchrow', 90, 720, 220, 50], ['benchrow', 714, 720, 220, 50], ['rug', 452, 520, 120, 420], ['mat', 452, 960, 120, 40]],
    A: { desk: [512, 380], left: [200, 300], right: [824, 300], mid: [512, 600] },
    doors: { bottom: null, left: 'peevy', right: 'peevy-2' } },
  peevy: { name: "Peevy's Studio Flat", floor: 'wood', desc: "Peevy's cozy, cluttered little bedroom: an unmade bed with a lime blanket, a desk with a laptop and sticky notes, a beanbag in front of a TV with a game console, a workbench of half-finished crafts, a shelf of toys and lime fairy lights",
    items: [['window', 420, 50, 184, 140], ['bed', 70, 240, 180, 240], ['desk', 760, 240, 200, 90], ['chair', 840, 340], ['shelf', 300, 50, 100, 150], ['tv', 620, 60, 140, 120], ['beanbag', 640, 330, 80], ['bench', 70, 700, 260, 90], ['rug', 362, 470, 300, 220], ['plant', 900, 880], ['lamp', 280, 260, 40], ['mat', 452, 960, 120, 40]],
    A: { bed: [184, 358], notebook: [858, 380], workbench: [200, 680], game: [880, 566], window: [512, 250], shelf: [350, 250], special: [512, 580] },
    doors: { bottom: 'peevy-h' } },
  'peevy-2': { name: 'The Studio', floor: 'neon', desc: 'a recording studio: a podcast desk with two microphones on arms, a ring light, a lumpy couch, an equalizer screen and band posters everywhere, foam panels on the walls',
    items: [['foam', 60, 50, 904, 150], ['micdesk', 342, 330, 340, 110], ['chair', 420, 460], ['chair', 570, 460], ['ringlight', 760, 300, 70], ['couch', 70, 560, 90, 240], ['screen', 400, 60, 224, 120], ['poster', 120, 70, 120, 120], ['poster', 784, 70, 120, 120], ['amp', 860, 640, 90, 90], ['rug', 362, 640, 300, 200], ['mat', 452, 960, 120, 40]],
    A: { mic: [440, 500], guest: [590, 500], couch: [190, 680], light: [760, 420], special: [512, 740], notebook: [440, 500] },
    doors: { bottom: 'peevy-h' } },

  /* ---------- Omm, the Prism wing ---------- */
  'omm-h': { name: 'The Glass Bridge', floor: 'glass', desc: "a see-through glass-floored corridor into Omm's wing with the starry void drifting by underneath, prism crystals catching rainbows along the walls, doors on the left and right walls",
    items: [['backdoor', 110, 30, 180, 180], ['backdoor', 734, 30, 180, 180], ['void', 330, 40, 364, 150], ['crystals', 60, 300, 80, 120], ['crystals', 884, 300, 80, 120], ['crystals', 60, 700, 80, 120], ['crystals', 884, 700, 80, 120], ['rug', 452, 260, 120, 680], ['mat', 452, 960, 120, 40]],
    A: { left: [200, 300], mid: [512, 560], right: [824, 300], view: [512, 300] },
    doors: { bottom: null, left: 'omm', right: 'omm-2' } },
  omm: { name: "Omm's Observatory", floor: 'stone', desc: "Omm's bedroom, a round glass observatory full of stars: a big round bed under a star-map dome, a little brass telescope at the window, a writing desk with a journal, a crafting table of prisms and lenses, a cushion seat with a game screen, shelves of crystals and star charts",
    items: [['starwin', 362, 30, 300, 170], ['bed', 400, 300, 224, 200], ['telescope', 760, 230, 100, 130], ['desk', 70, 250, 200, 90], ['chair', 150, 350], ['bench', 70, 700, 240, 90], ['shelf', 864, 420, 90, 240], ['cushion', 700, 680, 90], ['tv', 820, 820, 120, 90], ['crystals', 300, 60, 60, 110], ['rug', 362, 560, 300, 200], ['mat', 452, 960, 120, 40]],
    A: { bed: [512, 480], notebook: [160, 440], workbench: [200, 750], game: [805, 770], window: [700, 400], shelf: [830, 540], special: [512, 800] },
    doors: { bottom: 'omm-h' } },
  'omm-2': { name: 'The Prism Garden', floor: 'glass', desc: 'a garden of slow-growing light crystals and floating petals under a glass dome: crystal flower beds, a little reflecting pool, stepping stones and a bench',
    items: [['dome', 60, 40, 904, 160], ['crystalbed', 90, 280, 260, 120], ['crystalbed', 674, 280, 260, 120], ['crystalbed', 90, 600, 220, 110], ['crystalbed', 714, 600, 220, 110], ['pond', 422, 420, 180, 130], ['benchrow', 412, 780, 200, 50], ['petals', 400, 260, 220, 100], ['mat', 452, 960, 120, 40]],
    A: { pool: [512, 600], bench: [512, 760], left: [220, 520], right: [804, 520], special: [512, 600] },
    doors: { bottom: 'omm-h' } },

  /* ---------- Jove, the Sky wing ---------- */
  'jove-h': { name: 'The Sky Tether', floor: 'glass', desc: "a walkway of glowing blue light running up to Jove's floating tower, open sky and stars on every side, a light-rope rail along both edges, doors on the left and right",
    items: [['backdoor', 110, 30, 180, 180], ['backdoor', 734, 30, 180, 180], ['void', 330, 40, 364, 150], ['lightrail', 50, 230, 24, 740], ['lightrail', 950, 230, 24, 740], ['rug', 412, 230, 200, 720], ['mat', 452, 960, 120, 40]],
    A: { left: [200, 300], mid: [512, 560], right: [824, 300], view: [512, 300] },
    doors: { bottom: null, left: 'jove', right: 'jove-2' } },
  jove: { name: "Jove's Planetarium", floor: 'stone', desc: "Jove's bedroom, a small round planetarium: a star projector in the middle casting constellations, a big cozy bed with a sky-blue quilt, a desk with star charts and a notebook, a workbench of brass orrery parts, a beanbag by a game screen, shelves of globes",
    items: [['chart', 60, 50, 280, 150], ['chart', 684, 50, 280, 150], ['window', 420, 50, 184, 140], ['bed', 760, 260, 190, 240], ['projector', 452, 440, 120, 120], ['desk', 70, 250, 200, 90], ['chair', 150, 350], ['bench', 70, 700, 240, 90], ['beanbag', 760, 700, 80], ['tv', 860, 820, 100, 90], ['shelf', 864, 560, 90, 110], ['globe', 360, 280, 60], ['rug', 362, 380, 300, 240], ['mat', 452, 960, 120, 40]],
    A: { bed: [855, 380], notebook: [168, 390], workbench: [190, 670], game: [800, 740], window: [512, 250], shelf: [820, 610], special: [512, 600] },
    doors: { bottom: 'jove-h' } },
  'jove-2': { name: 'The Observation Deck', floor: 'wood', desc: 'an open wooden deck on a tower floating above the house: a huge brass telescope on a round platform pointed at the void, a railing all around, star charts pinned to a table, open starry sky beyond',
    items: [['void', 60, 40, 904, 160], ['platform', 362, 330, 300, 300], ['telescope', 452, 360, 120, 160], ['railing', 40, 210, 30, 760], ['railing', 954, 210, 30, 760], ['desk', 90, 300, 200, 90], ['chair', 160, 400], ['crate', 820, 700, 70], ['lantern', 820, 300, 50], ['rug', 362, 700, 300, 160], ['mat', 452, 960, 120, 40]],
    A: { scope: [620, 560], table: [190, 440], rail: [512, 250], special: [620, 560], notebook: [178, 440] },
    doors: { bottom: 'jove-h' } },

  /* ---------- Moro, the Crypt wing ---------- */
  'moro-h': { name: 'The Bat Gallery', floor: 'stone', desc: "a long stone gallery of old gilded portraits where bats roost in the rafters, candle sconces, a red runner rug, doors on the left and right walls",
    items: [['backdoor', 110, 30, 180, 180], ['backdoor', 734, 30, 180, 180], ['portraits', 330, 40, 364, 160], ['candles', 340, 260, 40], ['candles', 644, 260, 40], ['portraits', 40, 300, 30, 500], ['portraits', 954, 300, 30, 500], ['rug', 452, 230, 120, 720], ['benchrow', 120, 760, 220, 50], ['benchrow', 684, 760, 220, 50], ['mat', 452, 960, 120, 40]],
    A: { left: [200, 300], mid: [512, 560], right: [824, 300], portraits: [512, 290] },
    doors: { bottom: null, left: 'moro', right: 'moro-2' } },
  moro: { name: "Moro's Crypt", floor: 'dark', desc: "Moro's bedroom, a candlelit gothic crypt: a carved black coffin bed with violet velvet lining, a writing desk with a quill and skull, a workbench of bones and trinkets, a gothic armchair by a little game screen, shelves of candles and curios, a stained-glass window",
    items: [['stainedglass', 412, 40, 200, 160], ['coffin', 400, 300, 224, 110], ['desk', 70, 250, 200, 90], ['chair', 150, 350], ['bench', 70, 700, 240, 90], ['armchair', 760, 680], ['tv', 860, 820, 100, 90], ['shelf', 864, 300, 90, 280], ['candles', 300, 300, 40], ['candles', 680, 300, 40], ['rug', 362, 500, 300, 240], ['mat', 452, 960, 120, 40]],
    A: { bed: [512, 345], notebook: [168, 390], workbench: [190, 670], game: [790, 715], window: [370, 270], shelf: [830, 440], special: [512, 620] },
    doors: { bottom: 'moro-h' } },
  'moro-2': { name: 'The Library', floor: 'wood', desc: 'a tall gothic library: towering bookshelves on every wall, a rolling ladder, a deep red reading chair with a lamp, candles, a big reading table and a black cReaper banner',
    items: [['shelf', 60, 50, 380, 160], ['shelf', 584, 50, 380, 160], ['banner', 472, 40, 80, 150], ['bookrow', 60, 260, 60, 500], ['bookrow', 904, 260, 60, 500], ['rtable', 400, 420, 224, 120], ['chair', 420, 380], ['chair', 560, 380], ['armchair', 200, 700], ['ladder', 300, 220, 40, 150], ['candles', 750, 700, 40], ['rug', 362, 620, 300, 200], ['mat', 452, 960, 120, 40]],
    A: { chair: [205, 795], shelves: [512, 260], candles: [860, 800], center: [512, 770], notebook: [370, 650], special: [205, 795] },
    doors: { bottom: 'moro-h' } },

  /* ---------- Lucifer, the Blood Moon wing ---------- */
  'lucifer-h': { name: 'The Hall of Chains', floor: 'dark', desc: "the great hall inside the gatehouse of Lucifer's black castle: you come in through a raised iron portcullis at the bottom; a long blood-red carpet runs up the middle to a grand black stone staircase climbing the back wall up into the keep; heavy chains hang from the dark rafters; crimson banners and braziers of red fire flank the stairs; a row of black suits of armor stands along the left wall; on the right side of the floor an open stairwell with stone steps leads down, lit from below by orange lava glow, toward the vault",
    items: [['banner', 100, 40, 80, 150], ['banner', 844, 40, 80, 150], ['chains', 200, 40, 140, 150], ['chains', 684, 40, 140, 150], ['grandstair', 362, 30, 300, 290], ['brazier', 280, 250, 70], ['brazier', 674, 250, 70], ['rug', 452, 320, 120, 630], ['armor', 70, 330, 60, 90], ['armor', 70, 530, 60, 90], ['armor', 70, 730, 60, 90], ['stairdown', 740, 560, 210, 230], ['brazier', 800, 380, 60], ['portcullis', 422, 950, 180, 50]],
    A: { left: [210, 620], mid: [512, 640], right: [690, 460], stairs: [512, 360] },
    doors: { bottom: null, top: 'lucifer', right: 'lucifer-2' }, doorAt: { top: [512, 240], right: [850, 680] } },
  lucifer: { name: "Lucifer's Throne Room", floor: 'dark', desc: "Lucifer's bedroom at the top of the keep of his black castle: a black spiked throne on a raised dais under a huge round window filled by the blood-red moon; a huge canopy bed with heavy red curtains on the right; a war desk covered in maps on the left; a forge-like workbench with an anvil; a dark armchair by a small game screen; shelves of trophies; braziers of red fire; a red carpet from the top of the stairs (you arrive up a stairwell at the bottom of the room) to the throne",
    items: [['moonwin', 382, 30, 260, 180], ['dais', 362, 220, 300, 110], ['throne', 467, 200, 90, 110], ['bed', 760, 240, 190, 250], ['desk', 70, 250, 200, 90], ['chair', 150, 350], ['bench', 70, 700, 240, 90], ['armchair', 760, 680], ['tv', 860, 820, 100, 90], ['shelf', 864, 520, 90, 140], ['brazier', 320, 400, 60], ['brazier', 640, 400, 60], ['rug', 452, 330, 120, 560], ['stairtop', 422, 890, 180, 110]],
    A: { bed: [855, 365], notebook: [168, 390], workbench: [190, 670], game: [795, 720], window: [390, 440], shelf: [830, 590], special: [512, 300] },
    doors: { bottom: 'lucifer-h' }, doorAt: { bottom: [512, 960] } },
  'lucifer-2': { name: 'The Ember Vault', floor: 'lava', desc: 'a treasure vault on cracked black obsidian with lava glowing through the cracks: heaps of gold and war spoils, weapon racks, braziers, an iron chest on a pedestal',
    items: [['treasure', 80, 240, 260, 160], ['treasure', 684, 240, 260, 160], ['weapons', 60, 50, 904, 150], ['chest', 452, 420, 120, 90], ['brazier', 140, 620, 70], ['brazier', 814, 620, 70], ['treasure', 380, 700, 120, 100], ['rug', 452, 520, 120, 420], ['mat', 452, 960, 120, 40]],
    A: { gold: [512, 560], left: [220, 480], right: [804, 480], center: [512, 840], special: [512, 560] },
    doors: { bottom: 'lucifer-h' } },

  /* ---------- Aevron, the Archive wing ---------- */
  'aevron-h': { name: 'The Index', floor: 'stone', desc: 'a long hallway lined with card-catalog drawers and little glowing magenta intercom panels, doors on the left and right walls',
    items: [['backdoor', 110, 30, 180, 180], ['backdoor', 734, 30, 180, 180], ['catalog', 330, 40, 364, 150], ['intercom', 340, 230, 50], ['intercom', 634, 230, 50], ['catalog', 60, 400, 120, 70], ['catalog', 844, 400, 120, 70], ['rug', 452, 230, 120, 720], ['plant', 80, 880], ['plant', 900, 880], ['mat', 452, 960, 120, 40]],
    A: { rack: [200, 300], book: [512, 300], door: [824, 300], mid: [512, 600] },
    doors: { bottom: null, left: 'aevron-2', right: 'aevron' } },
  'aevron-2': { name: 'The Hall of Records', floor: 'wood', desc: "a domed reading room where the House keeps its records: a great round window full of stars, a notice board, framed certificates on the walls and a giant ledger open on a lectern",
    items: [['starwin', 362, 30, 300, 170], ['noticeboard', 90, 60, 220, 130], ['certs', 714, 60, 220, 130], ['rug', 362, 580, 300, 160], ['orbplinth', 432, 360, 160, 160], ['lectern', 452, 610, 120, 80], ['shelf', 60, 300, 90, 360], ['shelf', 874, 300, 90, 360], ['rtable', 200, 780, 200, 90], ['rtable', 624, 780, 200, 90], ['mat', 452, 960, 120, 40]],
    A: { ledger: [512, 740], orb: [512, 560], board: [200, 260], window: [512, 260], left: [330, 560], right: [694, 560] },
    doors: { bottom: 'aevron-h' } },
  aevron: { name: 'The Core', floor: 'tech', desc: "Aevron's own room, the Core of the House: a huge wall screen where a pink-violet nebula glows, curved consoles of blinking lights, cables across the floor and a soft hum",
    items: [['blankscreen', 160, 30, 704, 180], ['consoles', 160, 280, 704, 70], ['server', 60, 300, 80, 400], ['server', 884, 300, 80, 400], ['pad', 452, 560, 120, 120], ['cables', 180, 420, 120, 300], ['cables', 724, 420, 120, 300], ['rug', 362, 740, 300, 160], ['mat', 452, 960, 120, 40]],
    A: { screen: [512, 400], pad: [512, 620], left: [220, 760], right: [804, 760] },
    doors: { bottom: 'aevron-h' } },

  /* ---------- the Other House ---------- */
  threshold: { name: 'The Threshold', floor: 'glass', desc: 'a narrow bridge of black glass running through thick fog toward an old door, faint lanterns on posts, nothing but grey mist on either side',
    items: [['fogwall', 40, 210, 300, 760], ['fogwall', 684, 210, 300, 760], ['olddoor', 432, 40, 160, 170], ['lantern', 360, 400, 40], ['lantern', 624, 400, 40], ['lantern', 360, 700, 40], ['lantern', 624, 700, 40], ['rug', 412, 210, 200, 750], ['mat', 452, 960, 120, 40]],
    A: { near: [512, 840], mid: [512, 600], far: [512, 300] },
    doors: { bottom: null, top: 'other-1' } },
  'other-1': { name: 'The Vestibule', floor: 'wood', desc: 'the dusty entrance hall of a forgotten old house: a coat rack with old coats, a guest book on a stand, a worn mat by the door, cobwebs, a grandfather portrait, a dim chandelier',
    items: [['olddoor', 432, 40, 160, 170], ['coatrack', 120, 260, 70], ['guestbook', 452, 440, 120, 80], ['portrait', 700, 60, 180, 130], ['umbrella', 860, 260, 60], ['cobweb', 40, 210, 120, 120], ['cobweb', 864, 210, 120, 120], ['rug', 362, 560, 300, 220], ['mat', 452, 960, 120, 40]],
    A: { rack: [200, 400], book: [512, 560], door: [512, 280] },
    doors: { bottom: 'threshold', top: 'other-2' } },
  'other-2': { name: 'The Gallery of Masks', floor: 'stone', desc: 'a long dim gallery of carved masks hung on the walls, all faces turned toward one old portrait at the far end',
    items: [['olddoor', 432, 40, 160, 170], ['masks', 60, 50, 340, 150], ['masks', 624, 50, 340, 150], ['masks', 40, 260, 40, 600], ['masks', 944, 260, 40, 600], ['portrait', 412, 240, 200, 100], ['rug', 452, 360, 120, 590], ['candles', 200, 600, 40], ['candles', 784, 600, 40], ['mat', 452, 960, 120, 40]],
    A: { left: [200, 520], mid: [512, 560], right: [824, 520] },
    doors: { bottom: 'other-1', top: 'other-3' } },
  'other-3': { name: 'The Clock Room', floor: 'wood', desc: 'a room crowded with ticking clocks of every size on every wall, a slow brass pendulum swinging over a strange inscription carved into the floor',
    items: [['olddoor', 432, 40, 160, 170], ['clocks', 60, 50, 340, 150], ['clocks', 624, 50, 340, 150], ['clocks', 40, 260, 60, 600], ['clocks', 924, 260, 60, 600], ['inscription', 362, 420, 300, 200], ['pendulum', 492, 300, 40, 300], ['mat', 452, 960, 120, 40]],
    A: { left: [200, 560], pendulum: [512, 700], right: [824, 560] },
    doors: { bottom: 'other-2', top: 'other-4' } },
  'other-4': { name: 'The Drowned Library', floor: 'water', desc: 'a library ankle-deep in still black water, tall bookshelves rising out of it, books drifting on the surface, a few stepping stones and a drowned reading table',
    items: [['olddoor', 432, 40, 160, 170], ['shelf', 60, 50, 340, 150], ['shelf', 624, 50, 340, 150], ['bookrow', 60, 280, 60, 560], ['bookrow', 904, 280, 60, 560], ['drifting', 200, 400, 620, 300], ['rtable', 412, 480, 200, 100], ['rug', 452, 600, 120, 350], ['mat', 452, 960, 120, 40]],
    A: { left: [240, 760], mid: [512, 760], right: [784, 760] },
    doors: { bottom: 'other-3', top: 'other-5' } },
  'other-5': { name: 'The Heart', floor: 'dark', desc: 'a round chamber at the very center of the old house with a great glowing heart of light pulsing slowly on a stone plinth, veins of soft light running across the floor to the walls',
    items: [['veins', 100, 260, 824, 600], ['heart', 392, 300, 240, 240], ['candles', 200, 300, 40], ['candles', 784, 300, 40], ['candles', 200, 760, 40], ['candles', 784, 760, 40], ['mat', 452, 960, 120, 40]],
    A: { left: [240, 640], mid: [512, 680], right: [784, 640] },
    doors: { bottom: 'other-4' } },
};
var WALKABLE = { grandstair: 1, stairdown: 1, stairtop: 1, portcullis: 1, orbplinth: 0, rug: 1, mat: 1, platform: 1, pad: 1, cables: 1, veins: 1, inscription: 1, petals: 1, drifting: 1, doorL: 1, doorR: 1 };
var WALLITEM = { backdoor: 1, blankscreen: 1, window: 1, void: 1, banner: 1, chart: 1, frames: 1, neon: 1, poster: 1, foam: 1, screen: 1, starwin: 1, stainedglass: 1, moonwin: 1, portraits: 1, chains: 1, weapons: 1, catalog: 1, noticeboard: 1, certs: 1, olddoor: 1, masks: 1, clocks: 1, portrait: 1, dome: 1, cobweb: 1, fogwall: 0 };
var FLOORS = { wood: '#7a5236', stone: '#5e5a6e', dark: '#2e2232', neon: '#2a2440', glass: '#1a2240', lava: '#241818', tech: '#1c1a2c', water: '#14202a' };
var COL = { counter: '#5a3420', shelf: '#4a2c1c', window: '#8ab0e0', rug: '#8a2c3a', table: '#9a6a40', rtable: '#9a6a40', plant: '#3c8a4a', mat: '#a08a5a', bed: '#c8b8a0', bookrow: '#4a2c1c', globe: '#4a7ab0', armchair: '#7a3a5a', chair: '#8a5a34',
  lectern: '#6a4028', pad: '#ff4aa0', banner: '#7a2c4a', dais: '#8a84a0', throne: '#c8a050', benchrow: '#7a5232', platform: '#7a7490', telescope: '#c8a050', desk: '#6a4028', chart: '#3a4a7a', bench: '#6a4a30', crate: '#a07a4a', candles: '#ffd890',
  coatrack: '#5a3420', frames: '#c8a050', pedestal: '#c8c4d8', spot: '#fff0b0', pond: '#4a6ab0', neon: '#a3ff47', screen: '#5a2a8a', ladder: '#8a5a34',
  hearthfire: '#7a3cff', void: '#2a1e5a', longtable: '#6a4028', couch: '#6a4a7a', endtable: '#8a5a34', panel: '#f0e0b0', poster: '#e05a8a', helpdesk: '#3a5a2a', tv: '#2a2a3a', beanbag: '#a3ff47', lamp: '#ffe080',
  foam: '#3a3448', micdesk: '#4a3a5a', ringlight: '#ffffff', amp: '#2a2a2a', crystals: '#a070ff', starwin: '#3a3a8a', cushion: '#a070ff', dome: '#7ab8c0', crystalbed: '#7adcf0', petals: '#f0a0d0',
  lightrail: '#9ad8ff', projector: '#c8a050', railing: '#6a4a30', lantern: '#ffc85a', portraits: '#c8a050', stainedglass: '#8a5ac8', coffin: '#1e1a22', moonwin: '#c02a3a', brazier: '#ff5a2a', chains: '#8a8494',
  treasure: '#e0b040', weapons: '#7a7a8a', chest: '#5a3a24', catalog: '#7a5a3a', intercom: '#ff5ab4', noticeboard: '#a07a4a', certs: '#e8dcb8', consoles: '#3a2a5a', cables: '#2a2a3a', server: '#24202e',
  fogwall: '#9a96aa', olddoor: '#4a3428', guestbook: '#6a4028', portrait: '#8a6a3a', umbrella: '#3a3a4a', cobweb: '#d8d8e0', masks: '#d8c8a8', clocks: '#c8a050', inscription: '#5a5468', pendulum: '#e0c060', drifting: '#a89a7a', heart: '#ff7ab0', veins: '#c84a8a',
  doorL: '#3a2418', doorR: '#3a2418', backdoor: '#120e16', grandstair: '#3a3440', stairdown: '#140a0a', armor: '#5a5868', portcullis: '#4a4652', stairtop: '#2a2228', orbplinth: '#6a6478', blankscreen: '#06060c' };
var LEGEND = { shelf: 'tall shelves full of books and curios', window: 'a tall window', rug: 'a patterned rug', table: 'a small round table', rtable: 'a rectangular wooden table', plant: 'a potted plant', mat: 'the entrance doormat at the bottom wall opening',
  bed: 'a cozy bed with pillows and a quilt', bookrow: 'a low bookcase', globe: 'a globe on a stand', armchair: 'a plush armchair', chair: 'a wooden chair', lectern: 'a lectern holding a giant open ledger', pad: 'a glowing pink circular projector pad on the floor',
  banner: 'a hanging banner', dais: 'a raised stone dais', throne: 'a black spiked throne', benchrow: 'a cushioned bench', platform: 'a round raised platform', telescope: 'a big brass telescope', desk: 'a writing desk with a journal, papers and a lamp',
  chart: 'framed star charts', bench: 'a cluttered workbench with tools and half-built things', crate: 'a wooden crate', candles: 'a cluster of lit candles', coatrack: 'a coat rack with old coats', frames: 'empty golden picture frames lit from above',
  pedestal: 'an empty white display pedestal', spot: 'a soft spotlight pool on the floor', pond: 'a small reflecting pool', neon: 'a buzzing lime-green neon sign shaped like a little blob with no text', screen: 'a huge glowing wall screen', ladder: 'a rolling library ladder',
  hearthfire: 'a big stone hearth burning with cold violet void-fire', void: 'a tall window looking out onto the starry violet void', longtable: 'a long council table with eight high-backed chairs, four on each side', couch: 'a mismatched comfy couch',
  endtable: 'a little side table with a lamp', panel: 'a tall softly lit wall panel', poster: 'a colorful poster with no readable text', helpdesk: 'a small support desk with a computer and a service bell', tv: 'a small TV with a game console and controller',
  beanbag: 'a squishy lime beanbag', lamp: 'a little lamp', foam: 'acoustic foam panels', micdesk: 'a podcast desk with two microphones on boom arms and headphones', ringlight: 'a ring light on a tripod', amp: 'a speaker amp',
  crystals: 'a cluster of glowing prism crystals', starwin: 'a great round window full of stars', cushion: 'a big round floor cushion', dome: 'the curved glass dome wall', crystalbed: 'a flower bed of glowing crystal flowers', petals: 'softly floating glowing petals',
  lightrail: 'a glowing rope-of-light rail', projector: 'a brass star projector casting constellations', railing: 'a wooden deck railing', lantern: 'a hanging lantern on a post', portraits: 'a row of old gilded portraits with roosting bats above',
  stainedglass: 'a gothic violet stained-glass window', coffin: 'a carved black coffin bed with violet velvet lining, open', moonwin: 'a round window showing a huge blood-red moon', brazier: 'an iron brazier of red fire', chains: 'heavy hanging chains',
  treasure: 'a heap of gold coins and war spoils', weapons: 'racks of old weapons and shields', chest: 'an iron-bound chest on a pedestal', catalog: 'tall card-catalog drawers', intercom: 'a small glowing magenta intercom panel',
  noticeboard: 'a cork notice board with pinned notes', certs: 'framed certificates', consoles: 'a curved console of blinking lights and dials', cables: 'thick cables snaking across the floor', server: 'a tall humming machine cabinet with pink lights',
  fogwall: 'thick grey fog with nothing below', olddoor: 'an old carved wooden door in the back wall', guestbook: 'a guest book on a stand', portrait: 'an old portrait in a heavy frame', umbrella: 'an umbrella stand', cobweb: 'cobwebs in the corner',
  masks: 'carved masks hanging on the wall', clocks: 'many old clocks of every size', inscription: 'a strange circular inscription carved into the floor', pendulum: 'a long brass pendulum swinging from the ceiling',
  drifting: 'books drifting on still black water', heart: 'a great glowing heart of soft pink light on a stone plinth', veins: 'veins of soft pink light running across the floor', doorL: 'a doorway in the left wall', doorR: 'a doorway in the right wall', grandstair: 'a grand wide black stone staircase climbing up the back wall', stairdown: 'an open stairwell in the floor with stone steps going down, glowing orange from lava light below', armor: 'a black suit of armor on a stand', portcullis: 'a raised iron portcullis over the entrance at the bottom wall', stairtop: 'the top of a stairwell coming up into the room from below, at the bottom of the room', backdoor: 'an open arched doorway set into the back wall, leading into the next room (dark inside, clearly a passage)', orbplinth: 'an EMPTY round stone plinth with a glowing rune ring on top and NOTHING standing on it (a floating sphere will be added later)', blankscreen: 'a huge switched-off glass wall screen, plain black and empty' };
var ROUND = { orbplinth: 1, table: 1, globe: 1, plant: 1, candles: 1, pedestal: 1, spot: 1, crystals: 0, beanbag: 1, cushion: 1, projector: 1, ringlight: 1, brazier: 1, lantern: 1, lamp: 1, intercom: 1, endtable: 1, umbrella: 1, heart: 1, coatrack: 1 };
function drawRoom(g, id) {
  var R = ROOMS[id];
  g.fillStyle = '#1a1420'; g.fillRect(0, 0, S, S);
  g.fillStyle = FLOORS[R.floor]; g.fillRect(SIDE, WALL, S - SIDE * 2, S - WALL - SIDE);
  if (R.floor === 'wood') { g.fillStyle = 'rgba(0,0,0,.18)'; for (var y = WALL; y < S - SIDE; y += 34) g.fillRect(SIDE, y, S - SIDE * 2, 3); }
  if (R.floor === 'stone' || R.floor === 'dark' || R.floor === 'tech') { g.fillStyle = 'rgba(0,0,0,.18)'; for (var y2 = WALL; y2 < S - SIDE; y2 += 64) g.fillRect(SIDE, y2, S - SIDE * 2, 3); for (var x2 = SIDE; x2 < S; x2 += 64) g.fillRect(x2, WALL, 3, S - WALL - SIDE); }
  if (R.floor === 'neon') { for (var cy = WALL; cy < S - SIDE; cy += 64) for (var cx = SIDE; cx < S - SIDE; cx += 64) if (((cx + cy) / 64) % 2 < 1) { g.fillStyle = '#3a3256'; g.fillRect(cx, cy, 64, 64); } }
  if (R.floor === 'glass') { g.fillStyle = '#e8e4ff'; for (var k = 0; k < 140; k++) g.fillRect(SIDE + (k * 397) % (S - SIDE * 2), WALL + (k * 241) % (S - WALL - SIDE), 3, 3); g.strokeStyle = 'rgba(160,200,255,.35)'; g.lineWidth = 3; for (var gx = SIDE; gx < S; gx += 128) { g.beginPath(); g.moveTo(gx, WALL); g.lineTo(gx, S - SIDE); g.stroke(); } }
  if (R.floor === 'lava') { g.strokeStyle = '#ff5a1a'; g.lineWidth = 5; for (var l = 0; l < 14; l++) { g.beginPath(); var lx = 80 + (l * 263) % 860, ly = 240 + (l * 157) % 700; g.moveTo(lx, ly); g.lineTo(lx + 60, ly + 30); g.lineTo(lx + 40, ly + 90); g.stroke(); } }
  if (R.floor === 'water') { g.fillStyle = 'rgba(120,160,200,.25)'; for (var wv = WALL + 30; wv < S - SIDE; wv += 60) g.fillRect(SIDE + 40, wv, S - SIDE * 2 - 80, 3); }
  var wallC = { dark: '#3a2430', lava: '#2a1414', tech: '#24203a', glass: '#141a34', neon: '#2a2440', water: '#1e2a34' }[R.floor] || '#b89a78';
  g.fillStyle = wallC; g.fillRect(SIDE, 0, S - SIDE * 2, WALL);   /* back wall face */
  g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(SIDE, WALL - 14, S - SIDE * 2, 14);
  g.fillStyle = '#2a1e24'; g.fillRect(0, 0, SIDE, S); g.fillRect(S - SIDE, 0, SIDE, S); g.fillRect(0, S - SIDE, S, SIDE); g.fillRect(0, 0, S, 12);
  g.fillStyle = FLOORS[R.floor]; g.fillRect(452, S - SIDE, 120, SIDE);   /* doorway */
  R.items.forEach(function (it) {
    var t = it[0], x = it[1], y = it[2], w = it[3] || 50, h = it[4] || w, c = COL[t] || '#888';
    g.fillStyle = c;
    if (ROUND[t]) { if (t === 'plant') w = h = 56; g.beginPath(); g.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, 7); g.fill(); if (t === 'orbplinth') { g.strokeStyle = '#c8a0ff'; g.lineWidth = 8; g.beginPath(); g.ellipse(x + w / 2, y + h / 2, w / 2 - 22, h / 2 - 22, 0, 0, 7); g.stroke(); } if (t === 'table') { g.fillStyle = COL.chair; for (var i = 0; i < 4; i++) { var a = i / 4 * 6.283 + .4; g.fillRect(x + w / 2 + Math.cos(a) * (w / 2 + 18) - 12, y + h / 2 + Math.sin(a) * (h / 2 + 18) - 12, 24, 24); } } return; }
    if (t === 'chair' || t === 'armchair') { var s = t === 'armchair' ? 70 : 36; g.fillRect(x, y, s, s); return; }
    if (t === 'crate') { g.fillRect(x, y, w, w); return; }
    if (t === 'veins') { g.strokeStyle = c; g.lineWidth = 6; for (var v = 0; v < 12; v++) { var va = v / 12 * 6.283; g.beginPath(); g.moveTo(512, 420); g.lineTo(512 + Math.cos(va) * 260, 420 + Math.sin(va) * 220); g.lineTo(512 + Math.cos(va + .3) * 420, 420 + Math.sin(va + .3) * 380); g.stroke(); } return; }
    g.fillRect(x, y, w, h);
    if (t === 'longtable') { g.fillStyle = COL.chair; for (var q = 0; q < 4; q++) { var sx = x + 40 + q * (w - 80) / 3 - 18; g.fillRect(sx, y - 46, 36, 36); g.fillRect(sx, y + h + 10, 36, 36); } }
    if (t === 'shelf' || t === 'bookrow' || t === 'catalog') { var cs = ['#a03c4a', '#3c6aa0', '#c8a050', '#4a8a5a']; for (var bx = x + 8, n = 0; bx < x + w - 10; bx += 16, n++) { g.fillStyle = cs[n % 4]; g.fillRect(bx, y + 12, 10, h - 24); } }
    if (t === 'hearthfire') { g.fillStyle = '#c8a0ff'; g.fillRect(x + w / 2 - 50, y + h - 70, 100, 60); }
    if (t === 'bed') { g.fillStyle = '#f0ece0'; g.fillRect(x + 10, y + 10, w - 20, 40); g.fillStyle = '#6a4a8a'; g.fillRect(x, y + 60, w, h - 60); }
    if (t === 'coffin') { g.fillStyle = '#6a3a9a'; g.fillRect(x + 14, y + 14, w - 28, h - 28); }
    if (t === 'rug') { g.strokeStyle = '#c8a050'; g.lineWidth = 6; g.strokeRect(x + 12, y + 12, w - 24, h - 24); }
    if (t === 'frames') { for (var fx = x + 40; fx < x + w - 140; fx += 170) { g.fillStyle = '#c8a050'; g.fillRect(fx, y + 20, 120, 100); g.fillStyle = '#e8e0d0'; g.fillRect(fx + 10, y + 30, 100, 80); } }
    if (t === 'crystalbed') { g.fillStyle = '#c8a0ff'; for (var px = x + 20; px < x + w - 20; px += 40) { g.beginPath(); g.arc(px, y + h / 2, 14, 0, 7); g.fill(); } }
    if (t === 'grandstair') { g.fillStyle = '#5a5468'; for (var st2 = 0; st2 < 8; st2++) g.fillRect(x, y + st2 * (h / 8), w, 6); }
    if (t === 'stairdown' || t === 'stairtop') { g.fillStyle = '#ff7a2a'; for (var sd = 0; sd < 5; sd++) g.fillRect(x + 10, y + 20 + sd * (h - 30) / 5, w - 20, 5); }
    if (t === 'backdoor') { g.fillStyle = '#5a4a3a'; g.fillRect(x - 10, y - 10, w + 20, h + 10); g.fillStyle = '#120e16'; g.fillRect(x, y, w, h); g.fillStyle = FLOORS[R.floor]; g.fillRect(x + 20, y + h - 30, w - 40, 30); }
    if (t === 'orbplinth') { g.fillStyle = '#c8a0ff'; g.beginPath(); g.ellipse(x + w / 2, y + h / 2, w / 2 - 20, h / 2 - 20, 0, 0, 7); g.fill(); g.fillStyle = c; g.beginPath(); g.ellipse(x + w / 2, y + h / 2, w / 2 - 34, h / 2 - 34, 0, 0, 7); g.fill(); }
  });
}
/* the walkable floor: a 32px grid; 1 = free */
function grid(id) {
  var R = ROOMS[id], n = S / 32, G = [];
  for (var j = 0; j < n; j++) { G.push([]); for (var i = 0; i < n; i++) G[j].push(j * 32 >= WALL && j * 32 < S - SIDE - 16 && i * 32 >= SIDE + 8 && i * 32 < S - SIDE - 24 ? 1 : 0); }
  R.items.forEach(function (it) {
    var t = it[0]; if (WALKABLE[t] || WALLITEM[t]) return;
    var x = it[1], y = it[2], w = it[3] || 50, h = it[4] || w, pad = 6;
    if (t === 'plant') w = h = 56; if (t === 'chair') w = h = 36; if (t === 'armchair') w = h = 70;
    if (t === 'table') { x -= 26; y -= 26; w += 52; h += 52; }
    if (t === 'longtable') { y -= 46; h += 92; }
    for (var j = Math.floor((y - pad) / 32); j <= Math.floor((y + h + pad) / 32); j++) for (var i = Math.floor((x - pad) / 32); i <= Math.floor((x + w + pad) / 32); i++) if (G[j] && G[j][i] !== undefined) G[j][i] = 0;
  });
  for (var di = 14; di <= 17; di++) for (var dj = 28; dj < 32; dj++) G[dj][di] = 1;   /* the doorway */
  var D = R.doors || {};
  if (D.left) for (var a = 5; a <= 7; a++) for (var b = 5; b <= 7; b++) G[a][b] = 1;
  if (D.right) for (a = 5; a <= 7; a++) for (b = 24; b <= 26; b++) G[a][b] = 1;
  if (D.top) for (a = 5; a < 8; a++) for (b = 14; b <= 17; b++) G[a][b] = 1;
  if (R.doorAt) for (var ds in R.doorAt) { var dp = R.doorAt[ds], dc = Math.floor(dp[0] / 32), dr = Math.floor(dp[1] / 32); for (var aa = -1; aa <= 1; aa++) for (var bb = -1; bb <= 1; bb++) if (G[dr + aa] && G[dr + aa][dc + bb] !== undefined) G[dr + aa][dc + bb] = 1; }
  /* every anchor and seat stays reachable: clear its own cell */
  var pts = []; for (var k in R.A) pts.push(R.A[k]); (R.seats || []).forEach(function (p) { pts.push(p); });
  pts.forEach(function (p) { var ci = Math.floor(p[0] / 32), cj = Math.floor(p[1] / 32); if (G[cj] && G[cj][ci] !== undefined) G[cj][ci] = 1; });
  return G;
}
function prompt(id) {
  var R = ROOMS[id], by = {}, order = [], parts = [];
  function where(x, y) { return (y < 330 ? 'upper' : y < 660 ? 'middle' : 'lower') + ' ' + (x < 340 ? 'left' : x < 680 ? 'center' : 'right'); }
  R.items.forEach(function (it) { var t = it[0], w = it[3] || 50, h = it[4] || w; if (!by[t]) { by[t] = []; order.push(t); } by[t].push(where(it[1] + w / 2, it[2] + h / 2)); });
  order.forEach(function (t) { parts.push(LEGEND[t] + ' (' + by[t].filter(function (v, i, a) { return a.indexOf(v) === i; }).join(', ') + ')'); });
  return 'This is a flat-color LAYOUT SKETCH of a top-down RPG interior room. Repaint it as a finished, richly detailed pixel-art interior map of ' + R.desc + ', seen from above in a cozy three-quarter top-down RPG view with the back wall visible at the top. Keep the exact layout: every piece of furniture stays in the same place at the same size, the walls and the doorway gap in the bottom wall stay where they are' + (R.doorAt ? ', and every staircase, stairwell and the entrance stay exactly where they are in the sketch (they are the ways in and out of this room); there are no other doors anywhere' : R.doors && (R.doors.left || R.doors.right) ? ', and the TWO open doorways in the back wall (one upper left, one upper right) stay clearly open passages into the next rooms; there are no other doors, no doors in the side walls, and no inner walls or partitions anywhere in the room' : R.doors && R.doors.top ? ', and the doorway in the middle of the back wall stays open' : '') + '. Contents: ' + parts.join('; ') + '. Leave the open floor clear so characters can walk and the room can be decorated later. No people, no creatures, no characters. Do not draw any text, letters, labels or UI. Match the style of the second image (the cozy cReapZ pixel-art game look): crisp pixel art, rich magical lighting, warm glow, no blur.';
}
window.HROOMS = { S: S, R: ROOMS, drawRoom: drawRoom, grid: grid, prompt: prompt };
})();
