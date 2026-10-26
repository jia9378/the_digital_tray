// Gem data for the Study tab, with a source for each gem.
//
// Sources (opened and read on 2026-10-26):
//   GIA Gem Encyclopedia, "Facts" box on each gem page, e.g. https://www.gia.edu/sapphire
//     -> formula, refractive index, birefringence, specific gravity, hardness
//   LibreTexts "Gemology" (from the Gemology Project, CC BY-NC-SA), chapter 16 gem pages
//     https://geo.libretexts.org/Bookshelves/Geology/Gemology/16%3A_Gemstones
//     -> crystal system, lustre, and values GIA doesn't list
//   LibreTexts "Gemology" 7.16 Dispersion table
//     https://geo.libretexts.org/Bookshelves/Geology/Gemology/07%3A_Optical_Properties_of_Gemstones/7.16%3A_Dispersion
//     -> dispersion
// Where GIA and LibreTexts both give a value, GIA's is used.
// `check` lists anything on an entry that isn't from these sources.
// Notes are general background, not quoted from the sources.
//
// ri      refractive index [low, high]; equal for singly refractive stones
// biref   birefringence: a number or [low, high]; 0 = singly refractive, null = not given / not detectable
// disp    dispersion (B-G interval); null = not given in the sources
// look    'transparent' | 'translucent' | 'opaque' | 'pearl'
//
// A gem can override fields per colour in `variants`, for categories that
// cover several minerals (garnets, crystal beads).

var GIA = 'https://www.gia.edu/';
var LT = 'https://geo.libretexts.org/Bookshelves/Geology/Gemology/16%3A_Gemstones/';
var LT_DISP = 'https://geo.libretexts.org/Bookshelves/Geology/Gemology/07%3A_Optical_Properties_of_Gemstones/7.16%3A_Dispersion';

function src(label, url) {
  return { label: label, url: url };
}

var QUARTZ = {
  species: 'Quartz', formula: 'SiO₂', system: 'Trigonal',
  ri: [1.544, 1.553], biref: 0.009, disp: 0.013,
  hardness: '7', sg: '2.66', lustre: 'Vitreous', look: 'transparent',
  src: [src('GIA: Amethyst', GIA + 'amethyst'), src('LibreTexts: Quartz', LT + '16.05%3A_Quartz'), src('LibreTexts: Dispersion', LT_DISP)]
};

var BERYL = {
  species: 'Beryl', formula: 'Be₃Al₂Si₆O₁₈', system: 'Hexagonal',
  ri: [1.577, 1.583], biref: [0.005, 0.009], disp: 0.014,
  hardness: '7.5–8', sg: '2.72', lustre: 'Vitreous to resinous', look: 'transparent'
};

var CORUNDUM = {
  species: 'Corundum', formula: 'Al₂O₃', system: 'Trigonal',
  ri: [1.762, 1.770], biref: [0.008, 0.010], disp: 0.018,
  hardness: '9', sg: '4.00', lustre: 'Vitreous to subadamantine', look: 'transparent'
};

var FELDSPAR_MOON = {
  species: 'Feldspar (orthoclase)', formula: 'KAlSi₃O₈', system: 'Monoclinic',
  ri: [1.518, 1.526], biref: [0.005, 0.008], disp: 0.012,
  hardness: '6–6.5', sg: '2.58', lustre: 'Vitreous', look: 'translucent',
  note: 'The floating blue glow (adularescence) is light scattered between thin layers inside the feldspar.',
  check: 'GIA\'s moonstone page prints the birefringence as "0.05 to 0.008", which looks like a typo; 0.005–0.008 is from GIA\'s sunstone page (orthoclase).',
  src: [src('GIA: Moonstone', GIA + 'moonstone'), src('GIA: Sunstone (orthoclase)', GIA + 'sunstone'), src('LibreTexts: Moonstone', LT + '16.10%3A_Feldspar/16.10.04%3A_Moonstone'), src('LibreTexts: Dispersion', LT_DISP)]
};

var ALMANDINE = {
  species: 'Garnet (almandine)', formula: 'Fe₃Al₂(SiO₄)₃', system: 'Cubic',
  ri: [1.760, 1.820], biref: 0, disp: 0.027,
  hardness: '6.5–7.5', sg: '3.47–4.15', lustre: 'Vitreous', look: 'transparent',
  check: 'Hardness and specific gravity are GIA\'s values for the whole garnet group.',
  src: [src('GIA: Garnet', GIA + 'garnet'), src('LibreTexts: Garnet', LT + '16.08%3A_Garnet'), src('LibreTexts: Dispersion', LT_DISP)]
};

function withNote(base, extra) {
  var o = {};
  Object.keys(base).forEach(function (k) { o[k] = base[k]; });
  Object.keys(extra).forEach(function (k) { o[k] = extra[k]; });
  return o;
}

var GEM_DATA = {
  diamond: {
    species: 'Diamond', formula: 'C', system: 'Cubic',
    ri: [2.417, 2.417], biref: 0, disp: 0.044,
    hardness: '10', sg: '3.52', lustre: 'Adamantine', look: 'transparent',
    note: 'Hardest natural material. Its high refractive index and dispersion give brilliance and fire.',
    src: [src('GIA: Diamond', GIA + 'diamond'), src('LibreTexts: Diamond', LT + '16.02%3A_Diamond')]
  },
  sapphire: withNote(CORUNDUM, {
    note: 'Every colour of corundum except red is called sapphire. Most are heated to improve colour.',
    src: [src('GIA: Sapphire', GIA + 'sapphire'), src('LibreTexts: Corundum', LT + '16.03%3A_Corundum')]
  }),
  ruby: withNote(CORUNDUM, {
    note: 'Red corundum. Chromium gives the colour and a red glow under UV light.',
    src: [src('GIA: Ruby', GIA + 'ruby'), src('LibreTexts: Corundum', LT + '16.03%3A_Corundum')]
  }),
  emerald: withNote(BERYL, {
    note: 'Green beryl coloured by chromium or vanadium. Most contain inclusions ("jardin") and are oiled to hide fractures.',
    src: [src('GIA: Emerald', GIA + 'emerald'), src('LibreTexts: Beryl', LT + '16.04%3A_Beryl')]
  }),
  aquamarine: withNote(BERYL, {
    note: 'Blue beryl coloured by iron. Usually very clean.',
    src: [src('GIA: Aquamarine', GIA + 'aquamarine'), src('LibreTexts: Beryl', LT + '16.04%3A_Beryl')]
  }),
  morganite: withNote(BERYL, {
    ri: [1.583, 1.590], biref: [0.007, 0.008], sg: '2.80–2.91',
    note: 'Pink to orange-pink beryl, coloured by manganese.',
    src: [src('GIA: Morganite', GIA + 'morganite'), src('LibreTexts: Beryl', LT + '16.04%3A_Beryl'), src('LibreTexts: Dispersion (beryl)', LT_DISP)]
  }),
  spinel: {
    species: 'Spinel', formula: 'MgAl₂O₄', system: 'Cubic',
    ri: [1.718, 1.718], biref: 0, disp: 0.020,
    hardness: '8', sg: '3.60', lustre: 'Vitreous', look: 'transparent',
    note: 'Singly refractive. Long mistaken for ruby: the "Black Prince\'s Ruby" in the British crown is a spinel.',
    check: 'Dispersion: the LibreTexts dispersion table gives 0.020, its spinel page 0.026.',
    src: [src('GIA: Spinel', GIA + 'spinel'), src('LibreTexts: Spinel', LT + '16.13%3A_Spinel'), src('LibreTexts: Dispersion', LT_DISP)]
  },
  tanzanite: {
    species: 'Zoisite (tanzanite)', formula: 'Ca₂Al₃(SiO₄)₃(OH)', system: 'Orthorhombic',
    ri: [1.691, 1.700], biref: [0.008, 0.013], disp: null,
    hardness: '6–7', sg: '3.35', lustre: 'Vitreous', look: 'transparent',
    note: 'Strongly pleochroic: blue, violet and brownish from different directions. Almost all is heat-treated.',
    check: 'Dispersion left out: sources disagree (LibreTexts 0.012, GemSelect 0.030).',
    src: [src('GIA: Tanzanite', GIA + 'tanzanite'), src('LibreTexts: Tanzanite', LT + '16.07%3A_Zoisite/16.7.01%3A_Tanzanite')]
  },
  topaz: {
    species: 'Topaz', formula: 'Al₂(F,OH)₂SiO₄', system: 'Orthorhombic',
    ri: [1.619, 1.627], biref: [0.008, 0.010], disp: 0.014,
    hardness: '8', sg: '3.53', lustre: 'Vitreous', look: 'transparent',
    note: 'Most blue topaz is colourless topaz that has been irradiated and heated. Splits easily along one direction (perfect cleavage).',
    src: [src('GIA: Topaz', GIA + 'topaz'), src('LibreTexts: Topaz', LT + '16.68%3A_Topaz'), src('LibreTexts: Dispersion', LT_DISP)]
  },
  tourmaline: {
    species: 'Tourmaline (elbaite)', formula: 'Na(Li₁.₅,Al₁.₅)Al₆Si₆O₁₈(BO₃)₃(OH)₄', system: 'Trigonal',
    ri: [1.624, 1.644], biref: [0.018, 0.040], disp: 0.017,
    hardness: '7–7.5', sg: '3.06', lustre: 'Vitreous', look: 'transparent',
    note: 'Strong double refraction: facet edges can look doubled through the table.',
    src: [src('GIA: Tourmaline', GIA + 'tourmaline'), src('LibreTexts: Tourmaline', LT + '16.14%3A_Tourmaline'), src('LibreTexts: Dispersion', LT_DISP)],
    variants: {
      paraiba: { note: 'Copper gives Paraíba tourmaline its neon blue-green.' },
      watermelon: { note: 'Colour zoned: pink core, green rim, grown in one crystal.' }
    }
  },
  garnet: {
    species: 'Garnet group', formula: 'X₃Y₂(SiO₄)₃', system: 'Cubic',
    ri: [1.714, 1.888], biref: 0, disp: null,
    hardness: '6.5–7.5', sg: '3.47–4.15', lustre: 'Vitreous', look: 'transparent',
    src: [src('GIA: Garnet', GIA + 'garnet'), src('LibreTexts: Garnet', LT + '16.08%3A_Garnet'), src('LibreTexts: Dispersion', LT_DISP)],
    variants: {
      almandine: withNote(ALMANDINE, { note: 'Iron-rich garnet, deep red.' }),
      rhodolite: withNote(ALMANDINE, {
        species: 'Garnet (rhodolite, pyrope-almandine)', formula: '(Mg,Fe)₃Al₂(SiO₄)₃', ri: [1.720, 1.820], disp: 0.026,
        note: 'A mix of pyrope and almandine: raspberry red.',
        check: 'Refractive index is the span of pyrope (1.720–1.770) and almandine (1.760–1.820); neither source lists rhodolite on its own. Hardness and specific gravity are for the whole garnet group.'
      }),
      spessartite: withNote(ALMANDINE, { species: 'Garnet (spessartine)', formula: 'Mn₃Al₂(SiO₄)₃', ri: [1.790, 1.814], disp: 0.027, note: 'Manganese garnet; the brightest are called mandarin.' }),
      tsavorite: withNote(ALMANDINE, { species: 'Garnet (grossular, tsavorite)', formula: 'Ca₃Al₂(SiO₄)₃', ri: [1.730, 1.760], disp: 0.027, note: 'Green grossular coloured by vanadium.' }),
      demantoid: withNote(ALMANDINE, { species: 'Garnet (andradite, demantoid)', formula: 'Ca₃Fe₂(SiO₄)₃', ri: [1.855, 1.895], disp: 0.057, note: 'Dispersion higher than diamond, so lots of fire.' })
    }
  },
  amethyst: withNote(QUARTZ, { note: 'Purple quartz, coloured by iron and natural radiation. Heating can turn it yellow (citrine).' }),
  citrine: withNote(QUARTZ, {
    note: 'Yellow to orange quartz. Much of it is heated amethyst.',
    src: [src('GIA: Citrine', GIA + 'citrine'), src('LibreTexts: Quartz', LT + '16.05%3A_Quartz'), src('LibreTexts: Dispersion', LT_DISP)]
  }),
  peridot: {
    species: 'Olivine', formula: '(Mg,Fe)₂SiO₄', system: 'Orthorhombic',
    ri: [1.65, 1.69], biref: [0.035, 0.038], disp: 0.020,
    hardness: '6.5–7', sg: '3.34', lustre: 'Vitreous', look: 'transparent',
    note: 'Very strong double refraction. Coloured by iron, so it only comes in greens.',
    src: [src('GIA: Peridot', GIA + 'peridot'), src('LibreTexts: Peridot', LT + '16.53%3A_Peridot'), src('LibreTexts: Dispersion', LT_DISP)]
  },
  opal: {
    species: 'Opal (hydrated silica)', formula: 'SiO₂·nH₂O', system: 'Amorphous',
    ri: [1.37, 1.47], biref: 0, disp: null,
    hardness: '5–6.5', sg: '2.15', lustre: 'Vitreous to waxy', look: 'opaque',
    note: 'Play of colour comes from diffraction by tiny stacked silica spheres, not from refraction. Contains water, so it can crack if it dries out.',
    check: 'Crystal system and lustre are not from these sources.',
    src: [src('GIA: Opal', GIA + 'opal')],
    variants: {
      fire: { look: 'transparent', note: 'Transparent orange opal, often faceted. Usually no play of colour.' }
    }
  },
  moonstone: FELDSPAR_MOON,
  turquoise: {
    species: 'Turquoise', formula: 'CuAl₆(PO₄)₄(OH)₈·5H₂O', system: 'Triclinic',
    ri: [1.610, 1.650], biref: null, disp: null,
    hardness: '5–6', sg: '2.76', lustre: 'Waxy', look: 'opaque',
    note: 'Porous; much of it is stabilised with resin. The dark web in spiderweb turquoise is the host rock (matrix).',
    src: [src('GIA: Turquoise', GIA + 'turquoise'), src('LibreTexts: Turquoise', LT + '16.69%3A_Turquoise')]
  },
  jade: {
    species: 'Jadeite', formula: 'NaAlSi₂O₆', system: 'Monoclinic',
    ri: [1.666, 1.680], biref: null, disp: null,
    hardness: '6.5–7', sg: '3.34', lustre: 'Greasy to vitreous', look: 'opaque',
    note: 'A mass of interlocking crystals, which makes it very tough. Nephrite is the other mineral sold as jade.',
    src: [src('GIA: Jade', GIA + 'jade'), src('LibreTexts: Jadeite', LT + '16.42%3A_Jade/16.42.01%3A_Jadeite')]
  },
  lapis: {
    species: 'Lapis lazuli (a rock)', formula: 'Lazurite, hauyne, calcite and pyrite', system: 'Rock (several minerals)',
    ri: [1.500, 1.500], biref: 0, disp: null,
    hardness: '5.5', sg: '2.75', lustre: 'Resinous to vitreous', look: 'opaque',
    note: 'Blue lazurite with white calcite and brassy pyrite flecks.',
    src: [src('GIA: Lapis lazuli', GIA + 'lapis-lazuli'), src('LibreTexts: Lapis lazuli', LT + '16.46%3A_Lapis_Lazuli')]
  },
  onyx: {
    species: 'Chalcedony (onyx)', formula: 'SiO₂', system: 'Trigonal (microcrystalline)',
    ri: [1.535, 1.539], biref: null, disp: null,
    hardness: '6.5–7', sg: '2.60', lustre: 'Vitreous to waxy', look: 'opaque',
    note: 'Black onyx sold today is almost always dyed chalcedony.',
    check: 'Lustre and the note about dyeing are not from these sources.',
    src: [src('LibreTexts: Chalcedony', LT + '16.06%3A_Quartz_-_Polycrystalline/16.6.01%3A_Chalcedony')]
  },
  pearl: {
    species: 'Pearl (organic)', formula: 'CaCO₃ + conchiolin + water', system: 'Amorphous (organic)',
    ri: [1.52, 1.69], biref: null, disp: null,
    hardness: '2.5–3', sg: '2.60–2.85', lustre: 'Pearly', look: 'pearl',
    note: 'Grown by molluscs. Lustre and overtone come from light reflecting off thin, stacked layers of nacre. Cultured pearls have a bead nucleus.',
    src: [src('GIA: Pearl', GIA + 'pearl'), src('LibreTexts: Pearl', LT + '16.51%3A_Pearl')]
  },
  crystal: {
    species: 'Quartz (rock crystal)', formula: 'SiO₂', system: 'Trigonal',
    ri: QUARTZ.ri, biref: QUARTZ.biref, disp: QUARTZ.disp,
    hardness: QUARTZ.hardness, sg: QUARTZ.sg, lustre: 'Vitreous', look: 'transparent',
    note: 'Colourless quartz.',
    src: QUARTZ.src,
    variants: {
      amethyst: { species: 'Quartz (amethyst)', note: 'Purple quartz, coloured by iron and natural radiation.' },
      citrine: { species: 'Quartz (citrine)', note: 'Yellow quartz; much of it is heated amethyst.' },
      rose: { species: 'Quartz (rose)', look: 'translucent', note: 'Pink and milky from tiny fibre-like inclusions.' },
      smoky: { species: 'Quartz (smoky)', note: 'Brown to grey, from natural radiation.' },
      goldrutile: { species: 'Quartz with rutile', note: 'The golden hairs are rutile (TiO₂) crystals grown inside the quartz.' },
      blackrutile: { species: 'Quartz with black needles', note: 'Despite the name, the black needles are usually tourmaline (schorl), not rutile.', check: 'The note about tourmaline needles is not from these sources.' },
      phantom: { species: 'Quartz with chlorite', note: 'The green "phantom" is chlorite that settled on the crystal while it grew.' },
      strawberry: { species: 'Quartz with iron oxide', note: 'The red specks are iron oxide inclusions.' },
      garnet: withNote(ALMANDINE, { note: 'Garnet beads are usually almandine: deep wine red.' }),
      aquamarine: withNote(BERYL, {
        look: 'translucent', note: 'Blue beryl. Bead grade is usually cloudy.',
        src: [src('GIA: Aquamarine', GIA + 'aquamarine'), src('LibreTexts: Beryl', LT + '16.04%3A_Beryl')]
      }),
      moonstone: FELDSPAR_MOON,
      sunstone: {
        species: 'Feldspar (oligoclase sunstone)', formula: 'NaAlSi₃O₈–CaAl₂Si₂O₈ (solid solution)', system: 'Triclinic',
        ri: [1.537, 1.547], biref: [0.007, 0.010], disp: null, hardness: '6–7.2', sg: '2.65', lustre: 'Vitreous', look: 'translucent',
        note: 'The glitter (aventurescence) is light reflecting off flat, metallic-looking inclusions.',
        check: 'Crystal system and lustre are not from these sources.',
        src: [src('GIA: Sunstone', GIA + 'sunstone'), src('LibreTexts: Sunstone', LT + '16.10%3A_Feldspar/16.10.06%3A_Sunstone')]
      },
      tigereye: {
        species: "Quartz (tiger's eye)", ri: [1.55, 1.55], biref: null, disp: null, hardness: '6.5–7', sg: '2.60',
        look: 'opaque', lustre: 'Vitreous',
        note: 'Fibrous quartz. The parallel fibres make the moving silky band (chatoyancy).',
        src: [src("LibreTexts: Tiger's eye", LT + '16.06%3A_Quartz_-_Polycrystalline/16.6.01%3A_Chalcedony/16.6.1.10%3A_Tigereye')]
      },
      rhodochrosite: {
        species: 'Rhodochrosite', formula: 'MnCO₃', system: 'Trigonal (hexagonal family)',
        ri: [1.60, 1.83], biref: [0.208, 0.220], disp: null, hardness: '3.5–4', sg: '3.40–3.70', lustre: 'Vitreous to pearly', look: 'opaque',
        note: 'Soft, with one of the strongest double refractions of any gem. Banded bead material is a massive (many-crystal) form.',
        check: 'Lustre is not from these sources. LibreTexts gives the system as hexagonal; trigonal is the subdivision used for carbonates like it.',
        src: [src('LibreTexts: Rhodochrosite', LT + '16.58%3A_Rhodochrosite')]
      },
      larimar: {
        species: 'Pectolite (larimar)', formula: 'NaCa₂Si₃O₈(OH)', system: 'Triclinic',
        ri: [1.59, 1.63], biref: null, disp: null, hardness: '5', sg: '2.62–2.87', lustre: 'Silky', look: 'opaque',
        note: 'Blue pectolite, found only in the Dominican Republic.',
        src: [src('LibreTexts: Larimar', LT + '16.52%3A_Pectolite/16.52.01%3A_Larimar')]
      },
      obsidian: {
        species: 'Obsidian', formula: 'Volcanic glass', system: 'Amorphous',
        ri: [1.45, 1.55], biref: 0, disp: null, hardness: '5–5.5', sg: '2.35–2.60', lustre: 'Vitreous', look: 'opaque',
        note: 'Natural glass from fast-cooled lava. Breaks with sharp curved (conchoidal) fractures.',
        check: 'Lustre is not from these sources.',
        src: [src('LibreTexts: Obsidian', LT + '16.37%3A_Obsidian')]
      }
    }
  },
  glass: {
    species: 'Lead crystal glass (approximate)', formula: 'SiO₂ + PbO (+ K₂O)', system: 'Amorphous',
    ri: [1.56, 1.56], biref: 0, disp: 0.020,
    hardness: '5.5–6', sg: '2.9–3.1', lustre: 'Vitreous', look: 'transparent',
    note: 'Man-made. Lead raises the refractive index and dispersion; a thin metal-oxide coating makes the aurora borealis rainbow. Values vary by maker.',
    check: 'No source: these are rough estimates for lead crystal glass.',
    src: []
  }
};

// Data for one stone: the gem's values with its colour's overrides on top.
function gemData(gemId, colorId) {
  var base = GEM_DATA[gemId];
  var v = base.variants && base.variants[colorId];
  return v ? withNote(base, v) : base;
}

// Birefringence as one number (the middle of a range), or null.
function birefValue(d) {
  if (d.biref === null || d.biref === undefined) return null;
  return Array.isArray(d.biref) ? (d.biref[0] + d.biref[1]) / 2 : d.biref;
}
