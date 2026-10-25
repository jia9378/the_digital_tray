// Gem data for the Study tab. Hand-compiled typical values from standard
// gemmology references (GIA, Gem-A textbooks). Real stones vary, so treat these
// as typical, not exact.
//
// ri      refractive index [low, high]; equal for singly refractive stones
// biref   birefringence (high - low); 0 = singly refractive, null = not measurable
// disp    dispersion (B-G interval); null = not usually quoted
// look    'transparent' | 'translucent' | 'opaque' | 'pearl'
//
// A gem can override fields per colour in `variants`, for categories that
// cover several minerals (garnets, crystal beads).

var QUARTZ = {
  species: 'Quartz', formula: 'SiO₂', system: 'Trigonal',
  ri: [1.544, 1.553], biref: 0.009, disp: 0.013,
  hardness: '7', sg: '2.65', lustre: 'Vitreous', look: 'transparent'
};

var BERYL = {
  species: 'Beryl', formula: 'Be₃Al₂Si₆O₁₈', system: 'Hexagonal',
  ri: [1.577, 1.583], biref: 0.006, disp: 0.014,
  hardness: '7.5–8', sg: '2.67–2.78', lustre: 'Vitreous', look: 'transparent'
};

var CORUNDUM = {
  species: 'Corundum', formula: 'Al₂O₃', system: 'Trigonal',
  ri: [1.762, 1.770], biref: 0.008, disp: 0.018,
  hardness: '9', sg: '3.95–4.03', lustre: 'Vitreous to sub-adamantine', look: 'transparent'
};

var FELDSPAR_MOON = {
  species: 'Feldspar (orthoclase, adularia)', formula: 'KAlSi₃O₈', system: 'Monoclinic',
  ri: [1.518, 1.526], biref: 0.006, disp: 0.012,
  hardness: '6–6.5', sg: '2.56–2.59', lustre: 'Vitreous to pearly', look: 'translucent',
  note: 'The floating blue glow (adularescence) is light scattered between thin layers inside the feldspar.'
};

var ALMANDINE = {
  species: 'Garnet (almandine)', formula: 'Fe₃Al₂(SiO₄)₃', system: 'Cubic',
  ri: [1.79, 1.79], biref: 0, disp: 0.024,
  hardness: '7–7.5', sg: '3.93–4.30', lustre: 'Vitreous', look: 'transparent'
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
    ri: [2.417, 2.419], biref: 0, disp: 0.044,
    hardness: '10', sg: '3.52', lustre: 'Adamantine', look: 'transparent',
    note: 'Hardest natural material. Its high refractive index and dispersion give brilliance and fire.'
  },
  sapphire: withNote(CORUNDUM, { note: 'Every colour of corundum except red is called sapphire. Most are heated to improve colour.' }),
  ruby: withNote(CORUNDUM, { note: 'Red corundum. Chromium gives the colour and a red glow under UV light.' }),
  emerald: withNote(BERYL, { note: 'Green beryl coloured by chromium or vanadium. Most contain inclusions ("jardin") and are oiled to hide fractures.' }),
  aquamarine: withNote(BERYL, { sg: '2.68–2.74', note: 'Blue beryl coloured by iron. Usually very clean.' }),
  morganite: withNote(BERYL, { sg: '2.71–2.90', note: 'Pink beryl coloured by manganese. Values are typical for beryl.' }),
  spinel: {
    species: 'Spinel', formula: 'MgAl₂O₄', system: 'Cubic',
    ri: [1.718, 1.718], biref: 0, disp: 0.020,
    hardness: '8', sg: '3.58–3.61', lustre: 'Vitreous', look: 'transparent',
    note: 'Singly refractive. Long mistaken for ruby: the "Black Prince\'s Ruby" in the British crown is a spinel.'
  },
  tanzanite: {
    species: 'Zoisite (tanzanite)', formula: 'Ca₂Al₃(SiO₄)(Si₂O₇)O(OH)', system: 'Orthorhombic',
    ri: [1.691, 1.700], biref: 0.009, disp: 0.019,
    hardness: '6–7', sg: '3.35', lustre: 'Vitreous', look: 'transparent',
    note: 'Strongly pleochroic: blue, violet and brownish from different directions. Almost all is heat-treated.'
  },
  topaz: {
    species: 'Topaz', formula: 'Al₂SiO₄(F,OH)₂', system: 'Orthorhombic',
    ri: [1.609, 1.643], biref: 0.009, disp: 0.014,
    hardness: '8', sg: '3.49–3.57', lustre: 'Vitreous', look: 'transparent',
    note: 'Most blue topaz is colourless topaz that has been irradiated and heated. Splits easily along one direction (perfect cleavage).'
  },
  tourmaline: {
    species: 'Tourmaline (elbaite)', formula: 'Na(Li,Al)₃Al₆(BO₃)₃Si₆O₁₈(OH)₄', system: 'Trigonal',
    ri: [1.624, 1.644], biref: 0.018, disp: 0.017,
    hardness: '7–7.5', sg: '3.02–3.26', lustre: 'Vitreous', look: 'transparent',
    note: 'Strong double refraction: facet edges can look doubled through the table.',
    variants: {
      paraiba: { note: 'Copper gives Paraíba tourmaline its neon blue-green.' },
      watermelon: { note: 'Colour zoned: pink core, green rim, grown in one crystal.' }
    }
  },
  garnet: {
    species: 'Garnet', formula: 'X₃Y₂(SiO₄)₃', system: 'Cubic',
    ri: [1.79, 1.79], biref: 0, disp: 0.024,
    hardness: '7–7.5', sg: '3.5–4.3', lustre: 'Vitreous', look: 'transparent',
    variants: {
      almandine: withNote(ALMANDINE, { note: 'Iron-rich garnet, deep red.' }),
      rhodolite: { species: 'Garnet (pyrope-almandine)', formula: '(Mg,Fe)₃Al₂(SiO₄)₃', ri: [1.76, 1.76], disp: 0.026, sg: '3.74–3.94', note: 'A mix of pyrope and almandine: raspberry red.' },
      spessartite: { species: 'Garnet (spessartine)', formula: 'Mn₃Al₂(SiO₄)₃', ri: [1.80, 1.80], disp: 0.027, sg: '4.12–4.20', note: 'Manganese garnet; the brightest are called mandarin.' },
      tsavorite: { species: 'Garnet (grossular, tsavorite)', formula: 'Ca₃Al₂(SiO₄)₃', ri: [1.74, 1.74], disp: 0.028, sg: '3.57–3.73', note: 'Green grossular coloured by vanadium.' },
      demantoid: { species: 'Garnet (andradite, demantoid)', formula: 'Ca₃Fe₂(SiO₄)₃', ri: [1.888, 1.888], disp: 0.057, hardness: '6.5–7', sg: '3.81–3.87', note: 'Dispersion higher than diamond, so lots of fire. Often has curved "horsetail" inclusions.' }
    }
  },
  amethyst: withNote(QUARTZ, { note: 'Purple quartz, coloured by iron and natural radiation. Heating can turn it yellow (citrine).' }),
  citrine: withNote(QUARTZ, { note: 'Yellow to orange quartz. Much of it is heated amethyst.' }),
  peridot: {
    species: 'Olivine (forsterite)', formula: '(Mg,Fe)₂SiO₄', system: 'Orthorhombic',
    ri: [1.654, 1.690], biref: 0.036, disp: 0.020,
    hardness: '6.5–7', sg: '3.27–3.37', lustre: 'Vitreous', look: 'transparent',
    note: 'Very strong double refraction. Coloured by iron, so it only comes in greens.'
  },
  opal: {
    species: 'Opal', formula: 'SiO₂·nH₂O', system: 'Amorphous',
    ri: [1.45, 1.45], biref: 0, disp: null,
    hardness: '5.5–6.5', sg: '1.98–2.20', lustre: 'Vitreous to waxy', look: 'opaque',
    note: 'Play of colour comes from diffraction by tiny stacked silica spheres, not from refraction. Contains water, so it can crack if it dries out.',
    variants: {
      fire: { ri: [1.43, 1.43], look: 'transparent', note: 'Transparent orange opal, often faceted. Usually no play of colour.' }
    }
  },
  moonstone: FELDSPAR_MOON,
  turquoise: {
    species: 'Turquoise', formula: 'CuAl₆(PO₄)₄(OH)₈·4H₂O', system: 'Triclinic',
    ri: [1.61, 1.65], biref: null, disp: null,
    hardness: '5–6', sg: '2.6–2.9', lustre: 'Waxy to sub-vitreous', look: 'opaque',
    note: 'Porous; much of it is stabilised with resin. The dark web in spiderweb turquoise is the host rock (matrix).'
  },
  jade: {
    species: 'Jadeite', formula: 'NaAlSi₂O₆', system: 'Monoclinic',
    ri: [1.66, 1.68], biref: null, disp: null,
    hardness: '6.5–7', sg: '3.30–3.38', lustre: 'Vitreous to greasy', look: 'opaque',
    note: 'A mass of interlocking crystals, which makes it very tough. Nephrite is the other mineral sold as jade.'
  },
  lapis: {
    species: 'Lapis lazuli (a rock)', formula: 'Mainly lazurite, (Na,Ca)₈(AlSiO₄)₆(S,SO₄,Cl)₂', system: 'Rock (several minerals)',
    ri: [1.50, 1.50], biref: null, disp: null,
    hardness: '5–6', sg: '2.7–2.9', lustre: 'Dull to vitreous', look: 'opaque',
    note: 'Blue lazurite with white calcite and brassy pyrite flecks.'
  },
  onyx: {
    species: 'Chalcedony (onyx)', formula: 'SiO₂', system: 'Trigonal (microcrystalline)',
    ri: [1.53, 1.54], biref: null, disp: null,
    hardness: '6.5–7', sg: '2.60', lustre: 'Vitreous to waxy', look: 'opaque',
    note: 'Black onyx sold today is almost always dyed chalcedony.'
  },
  pearl: {
    species: 'Pearl (organic)', formula: 'CaCO₃ (aragonite) + conchiolin', system: 'Orthorhombic (aragonite platelets)',
    ri: [1.53, 1.69], biref: null, disp: null,
    hardness: '2.5–4.5', sg: '2.60–2.85', lustre: 'Pearly', look: 'pearl',
    note: 'Grown by molluscs. Lustre and overtone come from light reflecting off thin, stacked layers of nacre. Cultured pearls have a bead nucleus.'
  },
  crystal: {
    species: 'Quartz (rock crystal)', formula: 'SiO₂', system: 'Trigonal',
    ri: QUARTZ.ri, biref: QUARTZ.biref, disp: QUARTZ.disp,
    hardness: QUARTZ.hardness, sg: QUARTZ.sg, lustre: 'Vitreous', look: 'transparent',
    note: 'Colourless quartz.',
    variants: {
      amethyst: { species: 'Quartz (amethyst)', note: 'Purple quartz, coloured by iron and natural radiation.' },
      citrine: { species: 'Quartz (citrine)', note: 'Yellow quartz; much of it is heated amethyst.' },
      rose: { species: 'Quartz (rose)', look: 'translucent', note: 'Pink and milky from tiny fibre-like inclusions.' },
      smoky: { species: 'Quartz (smoky)', note: 'Brown to grey, from natural radiation.' },
      goldrutile: { species: 'Quartz with rutile', note: 'The golden hairs are rutile (TiO₂) crystals grown inside the quartz.' },
      blackrutile: { species: 'Quartz with black needles', note: 'Despite the name, the black needles are usually tourmaline (schorl), not rutile.' },
      phantom: { species: 'Quartz with chlorite', note: 'The green "phantom" is chlorite that settled on the crystal while it grew.' },
      strawberry: { species: 'Quartz with iron oxide', note: 'The red specks are iron oxide inclusions (hematite or lepidocrocite).' },
      garnet: withNote(ALMANDINE, { note: 'Garnet beads are usually almandine: deep wine red.' }),
      aquamarine: withNote(BERYL, { sg: '2.68–2.74', look: 'translucent', note: 'Blue beryl. Bead grade is usually cloudy.' }),
      moonstone: FELDSPAR_MOON,
      sunstone: {
        species: 'Feldspar (oligoclase sunstone)', formula: '(Na,Ca)Al(Al,Si)Si₂O₈', system: 'Triclinic',
        ri: [1.537, 1.547], biref: 0.008, disp: 0.012, hardness: '6–6.5', sg: '2.62–2.65', lustre: 'Vitreous', look: 'translucent',
        note: 'The glitter (aventurescence) is light reflecting off tiny hematite platelets.'
      },
      tigereye: {
        species: "Quartz (tiger's eye)", look: 'opaque', lustre: 'Silky', sg: '2.64–2.71',
        note: 'Quartz that replaced fibrous crocidolite. The fibres make the moving silky band (chatoyancy).'
      },
      rhodochrosite: {
        species: 'Rhodochrosite', formula: 'MnCO₃', system: 'Trigonal',
        ri: [1.597, 1.817], biref: 0.220, disp: 0.015, hardness: '3.5–4', sg: '3.45–3.70', lustre: 'Vitreous to pearly', look: 'opaque',
        note: 'Soft, with one of the strongest double refractions of any gem. Banded bead material is a massive (many-crystal) form.'
      },
      larimar: {
        species: 'Pectolite (larimar)', formula: 'NaCa₂Si₃O₈(OH)', system: 'Triclinic',
        ri: [1.599, 1.628], biref: null, disp: null, hardness: '4.5–5', sg: '2.74–2.88', lustre: 'Silky to vitreous', look: 'opaque',
        note: 'Blue pectolite, found only in the Dominican Republic.'
      },
      obsidian: {
        species: 'Obsidian (volcanic glass)', formula: 'Mostly SiO₂ (70–75%)', system: 'Amorphous',
        ri: [1.48, 1.51], biref: 0, disp: null, hardness: '5–5.5', sg: '2.33–2.60', lustre: 'Vitreous', look: 'opaque',
        note: 'Natural glass from fast-cooled lava. Breaks with sharp curved (conchoidal) fractures.'
      }
    }
  },
  glass: {
    species: 'Lead crystal glass (approximate)', formula: 'SiO₂ + PbO (+ K₂O)', system: 'Amorphous',
    ri: [1.56, 1.56], biref: 0, disp: 0.020,
    hardness: '5.5–6', sg: '2.9–3.1', lustre: 'Vitreous', look: 'transparent',
    note: 'Man-made. Lead raises the refractive index and dispersion; a thin metal-oxide coating makes the aurora borealis rainbow. Values vary by maker.'
  }
};

// Data for one stone: the gem's values with its colour's overrides on top.
function gemData(gemId, colorId) {
  var base = GEM_DATA[gemId];
  var v = base.variants && base.variants[colorId];
  return v ? withNote(base, v) : base;
}
