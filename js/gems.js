// Gem data: categories, their colours, and which cuts each one can use.
// Every size is in millimetres. "w" is the width, "h" the length (the long side).

// ---------- Cuts ----------
// lock: true means width and length stay equal (a round stays round).
// ct: factor for the carat estimate (L x W x depth x factor x SG).
// depth: typical depth as a fraction of the width.
var CUTS = {
  // Faceted
  round:       { name: 'Round brilliant', short: 'Round',    w: 5,   h: 5,   lock: true, ct: 0.0018 },
  oval:        { name: 'Oval',            short: 'Oval',     w: 6,   h: 8,   ct: 0.0020 },
  cushion:     { name: 'Cushion',         short: 'Cushion',  w: 6,   h: 6,   ct: 0.0022 },
  princess:    { name: 'Princess',        short: 'Princess', w: 5,   h: 5,   ct: 0.0023 },
  pear:        { name: 'Pear',            short: 'Pear',     w: 5,   h: 8,   ct: 0.00175 },
  marquise:    { name: 'Marquise',        short: 'Marquise', w: 4,   h: 8,   ct: 0.0016 },
  heart:       { name: 'Heart',           short: 'Heart',    w: 6,   h: 6,   ct: 0.0017 },
  emerald:     { name: 'Emerald cut',     short: 'Emerald',  w: 6,   h: 8,   ct: 0.0025 },
  asscher:     { name: 'Asscher',         short: 'Asscher',  w: 6,   h: 6,   ct: 0.0023 },
  baguette:    { name: 'Baguette',        short: 'Baguette', w: 2.5, h: 5,   ct: 0.0026 },
  // Cabochon (smooth dome)
  cabRound:    { name: 'Cabochon, round', short: 'Cab round', w: 6,  h: 6,   lock: true, ct: 0.0026, depth: 0.45 },
  cabOval:     { name: 'Cabochon, oval',  short: 'Cab oval',  w: 6,  h: 8,   ct: 0.0026, depth: 0.45 },
  // Pearls
  pearlRound:  { name: 'Round pearl',     short: 'Round',    w: 7,   h: 7,   lock: true },
  pearlDrop:   { name: 'Drop pearl',      short: 'Drop',     w: 7,   h: 9 },
  baroque:     { name: 'Baroque pearl',   short: 'Baroque',  w: 9,   h: 11 },
  // Beads (drawn with the drill hole facing up)
  beadRound:   { name: 'Round bead',      short: 'Bead',     w: 6,   h: 6,   lock: true },
  beadFaceted: { name: 'Faceted bead',    short: 'Faceted bead', w: 6, h: 6, lock: true },
  bicone:      { name: 'Bicone bead',     short: 'Bicone',   w: 4,   h: 4 }
};

var FACETED = ['round', 'oval', 'cushion', 'princess', 'pear', 'marquise', 'heart', 'emerald', 'asscher', 'baguette'];
var CABOCHON = ['cabRound', 'cabOval'];
var PEARL_CUTS = ['pearlRound', 'pearlDrop', 'baroque'];

// ---------- Gem categories ----------
// sg = specific gravity, used for the carat estimate.
// Colour extras:
//   rim    second colour on the outer facets (bi-colour stones)
//   over   overtone colour (pearls)
//   sheen  floating glow (moonstone)
//   flecks small inclusions (lapis pyrite, turquoise matrix)
//   finish 'ab' = aurora borealis coating, 'opal' = play of colour
var GEMS = {
  diamond: {
    name: 'Diamond', sg: 3.52, cuts: FACETED,
    colors: [
      { id: 'colorless', name: 'Colourless D–F',   hex: '#eef2f6' },
      { id: 'near',      name: 'Near colourless G–J', hex: '#f4efdc' },
      { id: 'champagne', name: 'Champagne',        hex: '#e0c393' },
      { id: 'yellow',    name: 'Fancy yellow',     hex: '#f5d94a' },
      { id: 'pink',      name: 'Fancy pink',       hex: '#f2b6c6' },
      { id: 'blue',      name: 'Fancy blue',       hex: '#9cc3ea' },
      { id: 'grey',      name: 'Salt and pepper',  hex: '#a3a3a0' },
      { id: 'black',     name: 'Black',            hex: '#2b2b2f' }
    ]
  },
  sapphire: {
    name: 'Sapphire', sg: 4.00, cuts: FACETED.concat(CABOCHON),
    colors: [
      { id: 'royal',      name: 'Royal blue',    hex: '#1f3fa6' },
      { id: 'cornflower', name: 'Cornflower',    hex: '#5b7fd6' },
      { id: 'ceylon',     name: 'Ceylon blue',   hex: '#93b2ec' },
      { id: 'teal',       name: 'Teal',          hex: '#2f8a8a' },
      { id: 'pink',       name: 'Pink',          hex: '#e46aa0' },
      { id: 'padparadscha', name: 'Padparadscha', hex: '#f29a7e' },
      { id: 'yellow',     name: 'Yellow',        hex: '#f2c84b' },
      { id: 'purple',     name: 'Purple',        hex: '#7a4fb0' },
      { id: 'white',      name: 'White',         hex: '#f1f3f6' }
    ]
  },
  ruby: {
    name: 'Ruby', sg: 4.00, cuts: FACETED.concat(CABOCHON),
    colors: [
      { id: 'pigeon',  name: "Pigeon's blood", hex: '#b5122e' },
      { id: 'cherry',  name: 'Cherry red',     hex: '#d1263f' },
      { id: 'pinkish', name: 'Pinkish red',    hex: '#dc4a6b' },
      { id: 'purplish', name: 'Purplish red',  hex: '#9e1e4f' }
    ]
  },
  emerald: {
    name: 'Emerald', sg: 2.72, cuts: FACETED.concat(CABOCHON),
    colors: [
      { id: 'colombian', name: 'Colombian green', hex: '#0f8a55' },
      { id: 'zambian',   name: 'Zambian bluish green', hex: '#127466' },
      { id: 'light',     name: 'Light green',     hex: '#6cc49a' }
    ]
  },
  spinel: {
    name: 'Spinel', sg: 3.60, cuts: FACETED.concat(CABOCHON),
    colors: [
      { id: 'red',      name: 'Red',       hex: '#c4243a' },
      { id: 'hotpink',  name: 'Hot pink',  hex: '#ee3f8c' },
      { id: 'lavender', name: 'Lavender',  hex: '#b8a6d9' },
      { id: 'cobalt',   name: 'Cobalt blue', hex: '#2448c9' },
      { id: 'grey',     name: 'Grey',      hex: '#8d93a1' }
    ]
  },
  tanzanite: {
    name: 'Tanzanite', sg: 3.35, cuts: FACETED.concat(CABOCHON),
    colors: [
      { id: 'violetblue', name: 'Violet blue', hex: '#4b4bc0' },
      { id: 'lilac',      name: 'Lilac',       hex: '#9b8fe0' }
    ]
  },
  aquamarine: {
    name: 'Aquamarine', sg: 2.70, cuts: FACETED.concat(CABOCHON),
    colors: [
      { id: 'santamaria', name: 'Santa Maria blue', hex: '#3e9cd6' },
      { id: 'light',      name: 'Light aqua',       hex: '#a8d8ea' }
    ]
  },
  topaz: {
    name: 'Topaz', sg: 3.53, cuts: FACETED.concat(CABOCHON),
    colors: [
      { id: 'london',   name: 'London blue', hex: '#285b78' },
      { id: 'swiss',    name: 'Swiss blue',  hex: '#3fa7d6' },
      { id: 'sky',      name: 'Sky blue',    hex: '#9bd0ea' },
      { id: 'imperial', name: 'Imperial',    hex: '#f0a35a' },
      { id: 'white',    name: 'White',       hex: '#f0f2f4' }
    ]
  },
  tourmaline: {
    name: 'Tourmaline', sg: 3.06, cuts: FACETED.concat(CABOCHON),
    colors: [
      { id: 'pink',       name: 'Pink',       hex: '#e870a3' },
      { id: 'green',      name: 'Green',      hex: '#3c8a4f' },
      { id: 'paraiba',    name: 'Paraíba',    hex: '#2fd4d0' },
      { id: 'indicolite', name: 'Indicolite', hex: '#2e6a8f' },
      { id: 'watermelon', name: 'Watermelon', hex: '#e8709a', rim: '#4f9a5a' }
    ]
  },
  garnet: {
    name: 'Garnet', sg: 3.90, cuts: FACETED.concat(CABOCHON),
    colors: [
      { id: 'almandine',   name: 'Almandine red', hex: '#7a1325' },
      { id: 'rhodolite',   name: 'Rhodolite',     hex: '#b0305f' },
      { id: 'spessartite', name: 'Mandarin',      hex: '#f07a1e' },
      { id: 'tsavorite',   name: 'Tsavorite',     hex: '#1fa34a' },
      { id: 'demantoid',   name: 'Demantoid',     hex: '#6cc43c' }
    ]
  },
  amethyst: {
    name: 'Amethyst', sg: 2.65, cuts: FACETED.concat(CABOCHON, ['beadRound']),
    colors: [
      { id: 'siberian', name: 'Deep Siberian', hex: '#6a2a9a' },
      { id: 'medium',   name: 'Medium purple', hex: '#9a62c8' },
      { id: 'rose',     name: 'Rose de France', hex: '#c9a7e0' }
    ]
  },
  citrine: {
    name: 'Citrine', sg: 2.65, cuts: FACETED.concat(CABOCHON),
    colors: [
      { id: 'golden',  name: 'Golden',  hex: '#f0b030' },
      { id: 'madeira', name: 'Madeira', hex: '#c8641e' },
      { id: 'lemon',   name: 'Lemon',   hex: '#ecdf5a' }
    ]
  },
  peridot: {
    name: 'Peridot', sg: 3.34, cuts: FACETED.concat(CABOCHON),
    colors: [
      { id: 'lime',  name: 'Lime green',  hex: '#9ccc3c' },
      { id: 'olive', name: 'Olive green', hex: '#879f2e' }
    ]
  },
  morganite: {
    name: 'Morganite', sg: 2.80, cuts: FACETED.concat(CABOCHON),
    colors: [
      { id: 'peach', name: 'Peach', hex: '#f3c1b0' },
      { id: 'pink',  name: 'Pink',  hex: '#f0b2c3' }
    ]
  },
  opal: {
    name: 'Opal', sg: 2.10, cuts: CABOCHON.concat(['oval', 'pear', 'round']),
    colors: [
      { id: 'white',   name: 'White opal',   hex: '#eef0ee', finish: 'opal' },
      { id: 'black',   name: 'Black opal',   hex: '#1f2a44', finish: 'opal' },
      { id: 'boulder', name: 'Boulder opal', hex: '#5a4632', finish: 'opal' },
      { id: 'fire',    name: 'Fire opal',    hex: '#f26a2a' }
    ]
  },
  moonstone: {
    name: 'Moonstone', sg: 2.57, cuts: CABOCHON.concat(['beadRound']),
    colors: [
      { id: 'rainbow', name: 'Rainbow', hex: '#eef1f3', sheen: '#7fa8ff' },
      { id: 'peach',   name: 'Peach',   hex: '#f1d3bd', sheen: '#ffffff' },
      { id: 'grey',    name: 'Grey',    hex: '#a7a8aa', sheen: '#c7d8ff' }
    ]
  },
  turquoise: {
    name: 'Turquoise', sg: 2.70, cuts: CABOCHON.concat(['beadRound']),
    colors: [
      { id: 'robin',      name: "Robin's egg", hex: '#4fc4c2' },
      { id: 'green',      name: 'Green',       hex: '#6aae8e' },
      { id: 'spiderweb',  name: 'Spiderweb',   hex: '#58b8bf', flecks: '#4b3a2a' }
    ]
  },
  jade: {
    name: 'Jade', sg: 3.30, cuts: CABOCHON.concat(['beadRound']),
    colors: [
      { id: 'imperial', name: 'Imperial green', hex: '#1c8a4a' },
      { id: 'apple',    name: 'Apple green',    hex: '#8cc63f' },
      { id: 'lavender', name: 'Lavender',       hex: '#c7b3dc' },
      { id: 'white',    name: 'White',          hex: '#e8ebe0' }
    ]
  },
  lapis: {
    name: 'Lapis lazuli', sg: 2.80, cuts: CABOCHON.concat(['beadRound']),
    colors: [
      { id: 'royal', name: 'Royal blue', hex: '#1d3c8f', flecks: '#d8b450' }
    ]
  },
  onyx: {
    name: 'Onyx', sg: 2.65, cuts: FACETED.concat(CABOCHON, ['beadRound', 'beadFaceted']),
    colors: [
      { id: 'black', name: 'Black', hex: '#18181a' }
    ]
  },
  pearl: {
    name: 'Pearl', sg: 0, cuts: PEARL_CUTS,
    colors: [
      { id: 'akoya',     name: 'Akoya white',       hex: '#f5f3ee', over: '#f1d3dc' },
      { id: 'freshwater', name: 'Freshwater white', hex: '#f2efe8', over: '#e4ddf0' },
      { id: 'cream',     name: 'Cream',             hex: '#f1e4c6', over: '#f3d6c3' },
      { id: 'golden',    name: 'Golden South Sea',  hex: '#e2bd6c', over: '#f6dfa4' },
      { id: 'tahitian',  name: 'Tahitian black',    hex: '#3a3d42', over: '#6a8c7a' },
      { id: 'peacock',   name: 'Peacock',           hex: '#3b4a3f', over: '#9a6a8c' },
      { id: 'pink',      name: 'Pink',              hex: '#f3d2d4', over: '#f7e6e7' },
      { id: 'lavender',  name: 'Lavender',          hex: '#d9cde6', over: '#efe6f5' },
      { id: 'silver',    name: 'Silver grey',       hex: '#b9bcc0', over: '#d9e3ea' }
    ]
  },
  crystal: {
    name: 'Crystal bead', sg: 0, cuts: ['beadFaceted', 'bicone', 'round'],
    colors: [
      { id: 'clear',   name: 'Clear crystal',    hex: '#f4f7fa' },
      { id: 'ab',      name: 'Aurora borealis',  hex: '#f1f5f8', finish: 'ab' },
      { id: 'jet',     name: 'Jet',              hex: '#151517' },
      { id: 'siam',    name: 'Siam red',         hex: '#a3122a' },
      { id: 'sapphire', name: 'Sapphire blue',   hex: '#1e48a8' },
      { id: 'emerald', name: 'Emerald green',    hex: '#11845a' },
      { id: 'rose',    name: 'Rose',             hex: '#f0a5b8' },
      { id: 'topaz',   name: 'Light topaz',      hex: '#e6a64a' },
      { id: 'golden',  name: 'Golden shadow',    hex: '#d9b66a' }
    ]
  }
};

// How the category list is grouped in the drop-down.
var GEM_GROUPS = [
  { name: 'Precious',            gems: ['diamond', 'sapphire', 'ruby', 'emerald'] },
  { name: 'Coloured stones',     gems: ['spinel', 'tanzanite', 'aquamarine', 'topaz', 'tourmaline', 'garnet', 'amethyst', 'citrine', 'peridot', 'morganite'] },
  { name: 'Opaque and phenomenal', gems: ['opal', 'moonstone', 'turquoise', 'jade', 'lapis', 'onyx'] },
  { name: 'Pearls and beads',    gems: ['pearl', 'crystal'] }
];

function findColor(gemId, colorId) {
  var colors = GEMS[gemId].colors;
  for (var i = 0; i < colors.length; i++) {
    if (colors[i].id === colorId) return colors[i];
  }
  return colors[0];
}

// Rough carat weight from size, cut and specific gravity. Null for pearls and beads.
function estimateCarat(stone) {
  var cut = CUTS[stone.cut];
  var gem = GEMS[stone.gem];
  if (!cut.ct || !gem.sg) return null;
  var depth = Math.min(stone.w, stone.h) * (cut.depth || 0.62);
  return stone.w * stone.h * depth * cut.ct * gem.sg;
}
