// Draws stones as SVG. Every shape is centred on (0, 0) and measured in mm.
// Faceted cuts are built from real facet layouts (table, stars, kites,
// upper girdle facets, or step rows), and each facet gets its own shade.

var INK = '#1f1f1f';
var LIGHT_ANGLE = -Math.PI * 0.75; // light comes from the top left

// ---------- Colour helpers ----------

function hexToRgb(hex) {
  var n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(rgb) {
  return '#' + rgb.map(function (v) {
    var s = Math.round(Math.max(0, Math.min(255, v))).toString(16);
    return s.length === 1 ? '0' + s : s;
  }).join('');
}

// Mix two hex colours. t = 0 gives a, t = 1 gives b.
function mix(a, b, t) {
  var x = hexToRgb(a);
  var y = hexToRgb(b);
  return rgbToHex([0, 1, 2].map(function (i) { return x[i] + (y[i] - x[i]) * t; }));
}

// Brightness 0..1 to a colour. 0.5 is the base colour itself.
function shade(hex, b) {
  b = Math.max(0, Math.min(1, b));
  if (b >= 0.5) return mix(hex, '#ffffff', (b - 0.5) * 1.5);
  return mix(hex, mix(hex, '#000000', 0.6), (0.5 - b) * 2);
}

function r2(n) {
  return Math.round(n * 1000) / 1000;
}

function pointsAttr(pts) {
  return pts.map(function (p) { return r2(p[0]) + ',' + r2(p[1]); }).join(' ');
}

// ---------- Outlines ----------
// Each outline is a function of u (0..2π, starting at the top, going clockwise)
// that returns a point on the girdle. "c" is the centre the facets radiate from.

var PEAR_K = 0.7698; // largest value of sin(u)·sin(u/2), so the pear is exactly w wide

function makeOutline(cut, w, h) {
  var a = w / 2;
  var b = h / 2;

  if (cut === 'pear' || cut === 'pearlDrop') {
    return {
      c: [0, h * 0.1],
      at: function (u) {
        return [a * Math.sin(u) * Math.sin(u / 2) / PEAR_K, -b * Math.cos(u)];
      }
    };
  }

  if (cut === 'marquise') {
    // Two circular arcs meeting in points at the top and bottom.
    var R = (a * a + b * b) / (2 * a);
    return {
      c: [0, 0],
      at: function (u) {
        var y = -b * Math.cos(u);
        var x = -(R - a) + Math.sqrt(Math.max(0, R * R - y * y));
        return [Math.sin(u) >= 0 ? x : -x, y];
      }
    };
  }

  if (cut === 'heart') {
    return heartOutline(w, h);
  }

  if (cut === 'cushion' || cut === 'princess' || cut === 'asscher') {
    var p = cut === 'cushion' ? 0.55 : 0.12;   // lower = squarer corners
    return {
      c: [0, 0],
      at: function (u) {
        var s = Math.sin(u);
        var co = Math.cos(u);
        return [a * sign(s) * Math.pow(Math.abs(s), p), -b * sign(co) * Math.pow(Math.abs(co), p)];
      }
    };
  }

  if (cut === 'bicone') {
    // A rhombus: a bicone bead lying on its side.
    return {
      c: [0, 0],
      at: function (u) {
        var s = Math.sin(u);
        var co = Math.cos(u);
        var k = Math.abs(s) + Math.abs(co);
        return [a * s / k, -b * co / k];
      }
    };
  }

  if (cut === 'baroque') {
    // A lumpy circle, always the same lumps.
    return {
      c: [0, 0],
      at: function (u) {
        var r = 1 + 0.07 * Math.sin(2 * u + 1) + 0.05 * Math.sin(3 * u + 2) + 0.035 * Math.sin(5 * u + 0.5);
        return [a * 0.94 * r * Math.sin(u), -b * 0.94 * r * Math.cos(u)];
      }
    };
  }

  // Round, oval, cabochons, pearls and round beads.
  return {
    c: [0, 0],
    at: function (u) { return [a * Math.sin(u), -b * Math.cos(u)]; }
  };
}

function sign(n) {
  return n < 0 ? -1 : 1;
}

// Classic heart curve, rescaled so it is exactly w x h, cleft at the top.
var HEART_BOX = null;
function heartRaw(t) {
  return [
    16 * Math.pow(Math.sin(t), 3),
    -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))
  ];
}
function heartOutline(w, h) {
  if (!HEART_BOX) {
    var minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
    for (var i = 0; i < 720; i++) {
      var p = heartRaw(i / 720 * Math.PI * 2);
      minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]);
      minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]);
    }
    HEART_BOX = { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  }
  var box = HEART_BOX;
  function at(t) {
    var p = heartRaw(t);
    return [((p[0] - box.x) / box.w - 0.5) * w, ((p[1] - box.y) / box.h - 0.5) * h];
  }
  return { c: [0, -h * 0.04], at: at };
}

// Points along the outline from u0 to u1 (inclusive).
function sampleOutline(outline, u0, u1, steps) {
  var pts = [];
  for (var i = 0; i <= steps; i++) {
    pts.push(outline.at(u0 + (u1 - u0) * i / steps));
  }
  return pts;
}

function outlinePath(outline, steps) {
  var pts = sampleOutline(outline, 0, Math.PI * 2, steps || 120);
  pts.pop();
  return 'M' + pointsAttr(pts).replace(/ /g, ' L') + ' Z';
}

// ---------- Facet layouts ----------

// Brilliant layout with n-fold symmetry: table, n stars, n kites,
// and 2n upper girdle facets. Works on any outline by scaling each
// point towards the centre.
function brilliantFacets(outline, n, opts) {
  var tableF = opts.table;
  var starF = opts.star;
  var off = opts.offset || 0;
  var c = outline.c;
  var step = Math.PI * 2 / n;

  function towards(u, f) {
    var p = outline.at(u);
    return [c[0] + (p[0] - c[0]) * f, c[1] + (p[1] - c[1]) * f];
  }

  var T = [], S = [], G = [], A = [], M = [];
  for (var k = 0; k < n; k++) {
    A[k] = off + k * step;            // direction of each table corner
    M[k] = A[k] + step / 2;           // direction of each star point
    T[k] = towards(A[k], tableF);
    S[k] = towards(M[k], starF);
    G[k] = outline.at(A[k]);
  }

  var facets = [{ pts: T, kind: 'table' }];

  for (k = 0; k < n; k++) {
    var next = (k + 1) % n;
    var prev = (k - 1 + n) % n;
    // Star: table edge + star point.
    facets.push({ pts: [T[k], S[k], T[next]], kind: 'star', dir: M[k] });
    // Kite (bezel): table corner, star, girdle, star.
    facets.push({ pts: [T[k], S[k], G[k], S[prev]], kind: 'kite', dir: A[k] });
    // Two upper girdle facets between this star and the girdle.
    var left = [S[k]].concat(sampleOutline(outline, A[k], M[k], 4));
    var right = [S[k]].concat(sampleOutline(outline, M[k], A[k] + step, 4));
    facets.push({ pts: left, kind: 'girdleA', dir: (A[k] + M[k]) / 2 });
    facets.push({ pts: right, kind: 'girdleB', dir: (M[k] + A[k] + step) / 2 });
  }
  return facets;
}

// Step cut (emerald, asscher, baguette): rows of facets running parallel to the edges.
function stepFacets(w, h, cornerRatio, insets) {
  var minSide = Math.min(w, h);
  var rings = insets.map(function (d) {
    var iw = w - 2 * d * minSide;
    var ih = h - 2 * d * minSide;
    return octagon(iw, ih, cornerRatio * Math.min(iw, ih));
  });

  var facets = [];
  for (var r = 0; r < rings.length - 1; r++) {
    var outer = rings[r];
    var inner = rings[r + 1];
    for (var j = 0; j < outer.length; j++) {
      var j2 = (j + 1) % outer.length;
      var mx = (outer[j][0] + outer[j2][0]) / 2;
      var my = (outer[j][1] + outer[j2][1]) / 2;
      if (Math.abs(outer[j][0] - outer[j2][0]) + Math.abs(outer[j][1] - outer[j2][1]) < 1e-6) continue;
      facets.push({
        pts: [outer[j], outer[j2], inner[j2], inner[j]],
        kind: 'step', row: r,
        dir: Math.atan2(mx, -my)
      });
    }
  }
  facets.push({ pts: rings[rings.length - 1], kind: 'table' });
  return { facets: facets, outline: rings[0] };
}

// Rectangle with cut corners. c = 0 gives a plain rectangle.
function octagon(w, h, c) {
  var x = w / 2;
  var y = h / 2;
  if (c <= 0.0001) return [[-x, -y], [x, -y], [x, y], [-x, y]];
  return [
    [-x + c, -y], [x - c, -y], [x, -y + c], [x, y - c],
    [x - c, y], [-x + c, y], [-x, y - c], [-x, -y + c]
  ];
}

// How bright each facet is, from its type and which way it faces.
function facetBrightness(f) {
  var d = f.dir === undefined ? 0 : f.dir;
  // Angle of the facet in screen space (0 = up, clockwise) vs the light.
  var facing = Math.cos(d - (LIGHT_ANGLE + Math.PI / 2));
  switch (f.kind) {
    case 'table':   return 0.6;
    case 'star':    return 0.52 - 0.2 * facing;
    case 'kite':    return 0.5 + 0.3 * facing;
    case 'girdleA': return 0.6 + 0.22 * facing;
    case 'girdleB': return 0.36 - 0.18 * facing;
    case 'step':    return f.row % 2 === 0 ? 0.5 + 0.3 * facing : 0.48 - 0.25 * facing;
  }
  return 0.5;
}

// ---------- Shared gradients ----------
// Gradients live in one hidden <svg id="shared-defs">, so every SVG on the page can use them.

var madeGradients = {};

function defsEl() {
  return document.getElementById('shared-defs');
}

function addDef(id, markup) {
  if (madeGradients[id]) return id;
  madeGradients[id] = true;
  defsEl().insertAdjacentHTML('beforeend', markup);
  return id;
}

function stopsMarkup(stops) {
  return stops.map(function (s) {
    return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"' +
      (s[2] !== undefined ? ' stop-opacity="' + s[2] + '"' : '') + '/>';
  }).join('');
}

function pearlGradient(color) {
  var over = color.over || color.hex;
  var id = 'pearl-' + color.hex.slice(1) + over.slice(1);
  return addDef(id,
    '<radialGradient id="' + id + '" cx="0.5" cy="0.5" r="0.56" fx="0.36" fy="0.3">' +
    stopsMarkup([
      [0, mix(color.hex, '#ffffff', 0.92)],
      [0.2, mix(color.hex, '#ffffff', 0.5)],
      [0.55, color.hex],
      [0.84, mix(color.hex, over, 0.6)],
      [1, mix(color.hex, '#000000', 0.38)]
    ]) + '</radialGradient>');
}

function domeGradient(hex) {
  var id = 'dome-' + hex.slice(1);
  return addDef(id,
    '<radialGradient id="' + id + '" cx="0.5" cy="0.5" r="0.56" fx="0.38" fy="0.32">' +
    stopsMarkup([
      [0, mix(hex, '#ffffff', 0.65)],
      [0.3, mix(hex, '#ffffff', 0.18)],
      [0.78, hex],
      [1, mix(hex, '#000000', 0.42)]
    ]) + '</radialGradient>');
}

function sheenGradient(hex) {
  var id = 'sheen-' + hex.slice(1);
  return addDef(id,
    '<radialGradient id="' + id + '" cx="0.5" cy="0.5" r="0.5">' +
    stopsMarkup([[0, hex, 0.85], [0.6, hex, 0.35], [1, hex, 0]]) + '</radialGradient>');
}

function finishGradients() {
  addDef('ab-coat',
    '<linearGradient id="ab-coat" x1="0" y1="0" x2="1" y2="1">' +
    stopsMarkup([[0, '#ff9ad5'], [0.3, '#8fe3ff'], [0.55, '#c9ff9a'], [0.8, '#ffe08a'], [1, '#c79aff']]) +
    '</linearGradient>');
  addDef('opal-a',
    '<linearGradient id="opal-a" x1="0" y1="0" x2="1" y2="1">' +
    stopsMarkup([[0, '#5be0ff'], [0.25, '#7cff9a'], [0.5, '#ff7ad9'], [0.75, '#ffd36b'], [1, '#6b8bff']]) +
    '</linearGradient>');
  addDef('opal-b',
    '<linearGradient id="opal-b" x1="1" y1="0" x2="0" y2="1">' +
    stopsMarkup([[0, '#ff8a5b', 0], [0.3, '#57ffcf'], [0.6, '#5b7bff', 0], [0.85, '#ff5bd1'], [1, '#ffe35b', 0]]) +
    '</linearGradient>');
}

// ---------- The stone ----------

// Returns SVG markup for one stone: { gem, color, cut, w, h }.
function stoneSVG(stone) {
  var cut = stone.cut;
  var w = stone.w;
  var h = stone.h;
  var color = findColor(stone.gem, stone.color);
  var hex = color.hex;

  // Line widths scale with the stone, so a stone looks the same at any zoom.
  var sw = Math.max(0.03, 0.022 * Math.min(w, h));
  var outlineAttrs = ' fill="none" stroke="' + INK + '" stroke-width="' + r2(sw) + '" stroke-linejoin="round"';
  var facetStroke = ' stroke="' + INK + '" stroke-opacity="0.45" stroke-width="' + r2(sw * 0.5) + '" stroke-linejoin="round"';

  var html = '';
  var outline, d;

  // --- Pearls ---
  if (cut === 'pearlRound' || cut === 'pearlDrop' || cut === 'baroque') {
    outline = makeOutline(cut, w, h);
    d = outlinePath(outline);
    html += '<path d="' + d + '" fill="url(#' + pearlGradient(color) + ')"/>';
    html += '<ellipse cx="' + r2(-w * 0.17) + '" cy="' + r2(-h * 0.2) + '" rx="' + r2(w * 0.09) + '" ry="' + r2(h * 0.06) + '" fill="#ffffff" fill-opacity="0.85" transform="rotate(-35 ' + r2(-w * 0.17) + ' ' + r2(-h * 0.2) + ')"/>';
    html += '<path d="' + d + '"' + outlineAttrs + ' stroke-opacity="0.7"/>';
    return html;
  }

  // --- Round beads: polished spheres, drilled through ---
  if (cut === 'beadRound') {
    return beadSphereSVG(stone, color, sw);
  }

  // --- Smooth domes: cabochons ---
  if (cut === 'cabRound' || cut === 'cabOval') {
    outline = makeOutline(cut, w, h);
    d = outlinePath(outline);
    html += '<path d="' + d + '" fill="url(#' + domeGradient(hex) + ')"/>';
    html += extras(color, d, w, h);
    html += '<ellipse cx="' + r2(-w * 0.16) + '" cy="' + r2(-h * 0.2) + '" rx="' + r2(w * 0.12) + '" ry="' + r2(h * 0.07) + '" fill="#ffffff" fill-opacity="0.6" transform="rotate(-35 ' + r2(-w * 0.16) + ' ' + r2(-h * 0.2) + ')"/>';
    html += '<path d="' + d + '"' + outlineAttrs + '/>';
    return html;
  }

  // --- Faceted ---
  var facets;
  if (cut === 'emerald' || cut === 'asscher' || cut === 'baguette') {
    var step = cut === 'emerald' ? stepFacets(w, h, 0.2, [0, 0.1, 0.19, 0.26])
             : cut === 'asscher' ? stepFacets(w, h, 0.28, [0, 0.08, 0.15, 0.22, 0.28])
             : stepFacets(w, h, 0, [0, 0.16, 0.3]);
    facets = step.facets;
    d = 'M' + pointsAttr(step.outline).replace(/ /g, ' L') + ' Z';
  } else {
    outline = makeOutline(cut, w, h);
    d = outlinePath(outline);
    if (cut === 'princess') {
      facets = brilliantFacets(outline, 8, { table: 0.6, star: 0.8, offset: 0 });
    } else if (cut === 'beadFaceted') {
      facets = brilliantFacets(outline, 12, { table: 0.22, star: 0.62, offset: 0 });
    } else if (cut === 'bicone') {
      facets = brilliantFacets(outline, 4, { table: 0.18, star: 0.55, offset: 0 });
    } else if (cut === 'round' || cut === 'oval') {
      facets = brilliantFacets(outline, 8, { table: 0.54, star: 0.76, offset: Math.PI / 8 });
    } else {
      // Pear, marquise, heart, cushion: a kite points into each tip.
      facets = brilliantFacets(outline, 8, { table: 0.5, star: 0.74, offset: 0 });
    }
  }

  facets.forEach(function (f) {
    var base = hex;
    // Bi-colour stones: outer facets take the rim colour.
    if (color.rim && (f.kind === 'girdleA' || f.kind === 'girdleB' || (f.kind === 'step' && f.row === 0))) base = color.rim;
    if (color.rim && f.kind === 'kite') base = mix(hex, color.rim, 0.5);
    html += '<polygon points="' + pointsAttr(f.pts) + '" fill="' + shade(base, facetBrightness(f)) + '"' + facetStroke + '/>';
  });

  html += extras(color, d, w, h);
  if (cut === 'beadFaceted') html += drillHole(w, sw);
  html += '<path d="' + d + '"' + outlineAttrs + '/>';
  return html;
}

// Coatings, play of colour, sheen and inclusions, drawn over the body.
function extras(color, d, w, h) {
  var html = '';
  if (color.finish === 'ab') {
    finishGradients();
    html += '<path d="' + d + '" fill="url(#ab-coat)" fill-opacity="0.5"/>';
  }
  if (color.finish === 'opal') {
    finishGradients();
    html += '<path d="' + d + '" fill="url(#opal-a)" fill-opacity="0.42"/>';
    html += '<path d="' + d + '" fill="url(#opal-b)" fill-opacity="0.5"/>';
  }
  if (color.sheen) {
    html += '<ellipse cx="' + r2(w * 0.08) + '" cy="' + r2(-h * 0.05) + '" rx="' + r2(w * 0.36) + '" ry="' + r2(h * 0.3) + '" fill="url(#' + sheenGradient(color.sheen) + ')"/>';
  }
  if (color.flecks) {
    // Fixed positions inside the middle of the stone.
    var spots = [[-0.22, 0.1, 0.05], [0.18, -0.2, 0.035], [0.05, 0.28, 0.04], [0.28, 0.12, 0.03], [-0.1, -0.3, 0.03], [-0.3, -0.05, 0.025]];
    spots.forEach(function (s) {
      html += '<circle cx="' + r2(s[0] * w) + '" cy="' + r2(s[1] * h) + '" r="' + r2(s[2] * Math.min(w, h)) + '" fill="' + color.flecks + '" fill-opacity="0.85"/>';
    });
  }
  return html;
}

// ---------- Round beads ----------
// A bead lies on its side with the drill hole along its x axis, so when the
// bead is turned to follow the cord, the hole and the inclusions turn with it.
// The light doesn't turn: the shading layers are rotated back by -rot.

var beadClipCount = 0;

// Fixed pseudo-random numbers, so a bead looks the same on every redraw.
function seededRandom(seed) {
  var x = seed;
  return function () {
    x = (x * 16807) % 2147483647;
    return (x - 1) / 2147483646;
  };
}

function glassGradient(hex) {
  var id = 'glass-' + hex.slice(1);
  // Transparent sphere: works like a lens, so light gathers low on the far side.
  return addDef(id,
    '<radialGradient id="' + id + '" cx="0.5" cy="0.5" r="0.5" fx="0.6" fy="0.68">' +
    stopsMarkup([
      [0, mix(hex, '#ffffff', 0.65)],
      [0.45, mix(hex, '#ffffff', 0.12)],
      [0.8, mix(hex, '#000000', 0.15)],
      [1, mix(hex, '#000000', 0.45)]
    ]) + '</radialGradient>');
}

function beadInclusions(color, r) {
  var html = '';
  var rnd;
  if (color.needles) {
    // Rutile hairs: long, thin, criss-crossing.
    rnd = seededRandom(7);
    for (var i = 0; i < 11; i++) {
      var a = rnd() * Math.PI;
      var ox = (rnd() - 0.5) * r * 1.2;
      var oy = (rnd() - 0.5) * r * 1.2;
      var len = r * (0.8 + rnd() * 0.9);
      html += '<line x1="' + r2(ox - Math.cos(a) * len) + '" y1="' + r2(oy - Math.sin(a) * len) +
        '" x2="' + r2(ox + Math.cos(a) * len) + '" y2="' + r2(oy + Math.sin(a) * len) +
        '" stroke="' + color.needles + '" stroke-width="' + r2(r * (0.02 + rnd() * 0.025)) + '" stroke-opacity="0.85" stroke-linecap="round"/>';
    }
  }
  if (color.dots) {
    // Specks: strawberry quartz's red dots, sunstone's glitter.
    rnd = seededRandom(11);
    for (var j = 0; j < 46; j++) {
      var t = rnd() * Math.PI * 2;
      var dist = Math.sqrt(rnd()) * r * 0.95;
      html += '<circle cx="' + r2(Math.cos(t) * dist) + '" cy="' + r2(Math.sin(t) * dist) + '" r="' + r2(r * (0.025 + rnd() * 0.035)) + '" fill="' + color.dots + '" fill-opacity="0.85"/>';
    }
  }
  if (color.bands) {
    // Stripes across the bead: tiger's eye, rhodochrosite.
    rnd = seededRandom(5);
    for (var k = -4; k <= 4; k++) {
      var y = k * r * 0.24 + (rnd() - 0.5) * r * 0.08;
      var bend = (rnd() - 0.5) * r * 1.1;
      html += '<path d="M ' + r2(-r * 1.1) + ' ' + r2(y) + ' Q 0 ' + r2(y + bend) + ' ' + r2(r * 1.1) + ' ' + r2(y - bend * 0.3) +
        '" fill="none" stroke="' + color.bands + '" stroke-width="' + r2(r * (0.05 + rnd() * 0.08)) + '" stroke-opacity="0.5"/>';
    }
  }
  if (color.phantom) {
    // Green phantom: a mossy cloud in the lower part of the bead.
    html += '<path d="M ' + r2(-r * 1.1) + ' ' + r2(r * 0.1) +
      ' Q ' + r2(-r * 0.6) + ' ' + r2(-r * 0.25) + ' ' + r2(-r * 0.2) + ' ' + r2(r * 0.12) +
      ' T ' + r2(r * 0.5) + ' ' + r2(r * 0.05) + ' T ' + r2(r * 1.1) + ' ' + r2(r * 0.2) +
      ' L ' + r2(r * 1.1) + ' ' + r2(r * 1.1) + ' L ' + r2(-r * 1.1) + ' ' + r2(r * 1.1) + ' Z" fill="' + color.phantom + '" fill-opacity="0.55"/>';
    rnd = seededRandom(3);
    for (var m = 0; m < 30; m++) {
      html += '<circle cx="' + r2((rnd() - 0.5) * r * 1.9) + '" cy="' + r2(r * (0.05 + rnd() * 0.85)) + '" r="' + r2(r * (0.03 + rnd() * 0.05)) + '" fill="' + mix(color.phantom, '#000000', 0.3) + '" fill-opacity="0.6"/>';
    }
  }
  if (color.web) {
    // Larimar: pale lacy lines.
    rnd = seededRandom(13);
    for (var n = 0; n < 9; n++) {
      var x0 = (rnd() - 0.5) * r * 2;
      var y0 = (rnd() - 0.5) * r * 2;
      html += '<path d="M ' + r2(x0) + ' ' + r2(y0) + ' q ' + r2((rnd() - 0.5) * r) + ' ' + r2((rnd() - 0.5) * r) + ' ' + r2((rnd() - 0.5) * r * 1.4) + ' ' + r2((rnd() - 0.5) * r * 1.4) +
        '" fill="none" stroke="' + color.web + '" stroke-width="' + r2(r * 0.05) + '" stroke-opacity="0.75" stroke-linecap="round"/>';
    }
  }
  return html;
}

function beadSphereSVG(stone, color, sw) {
  var r = stone.w / 2;
  var hex = color.hex;
  var unrotate = ' transform="rotate(' + (-(stone.rot || 0)) + ')"';
  var clip = 'bead-clip-' + (++beadClipCount);
  var html = '<defs><clipPath id="' + clip + '"><circle r="' + r2(r) + '"/></clipPath></defs>';

  // Body, lit from the top left whatever the bead's rotation.
  var fill = color.clear ? glassGradient(hex) : domeGradient(hex);
  html += '<circle r="' + r2(r) + '" fill="url(#' + fill + ')"' + unrotate + '/>';

  html += '<g clip-path="url(#' + clip + ')">';
  html += beadInclusions(color, r);
  // The cord shows faintly through a transparent bead.
  if (color.clear) {
    html += '<line x1="' + r2(-r) + '" y1="0" x2="' + r2(r) + '" y2="0" stroke="#ffffff" stroke-opacity="0.22" stroke-width="' + r2(r * 0.07) + '"/>';
  }
  html += '</g>';
  if (color.sheen) {
    html += '<ellipse cx="' + r2(r * 0.1) + '" cy="' + r2(-r * 0.05) + '" rx="' + r2(r * 0.7) + '" ry="' + r2(r * 0.55) + '" fill="url(#' + sheenGradient(color.sheen) + ')"' + unrotate + '/>';
  }

  // Drill hole openings at both ends of the x axis.
  [-1, 1].forEach(function (side) {
    html += '<ellipse cx="' + r2(side * r * 0.95) + '" cy="0" rx="' + r2(r * 0.05) + '" ry="' + r2(r * 0.13) + '" fill="#000000" fill-opacity="0.35"/>';
  });

  // Highlights: a window reflection and a soft glow, both fixed to the light.
  html += '<g' + unrotate + '>' +
    '<ellipse cx="' + r2(-r * 0.36) + '" cy="' + r2(-r * 0.42) + '" rx="' + r2(r * 0.24) + '" ry="' + r2(r * 0.13) + '" fill="#ffffff" fill-opacity="0.85" transform="rotate(-38 ' + r2(-r * 0.36) + ' ' + r2(-r * 0.42) + ')"/>' +
    (color.clear ? '<ellipse cx="' + r2(r * 0.22) + '" cy="' + r2(r * 0.42) + '" rx="' + r2(r * 0.42) + '" ry="' + r2(r * 0.24) + '" fill="#ffffff" fill-opacity="0.18"/>' : '') +
    '</g>';

  html += '<circle r="' + r2(r) + '" fill="none" stroke="' + INK + '" stroke-opacity="0.55" stroke-width="' + r2(sw) + '"/>';
  return html;
}

function drillHole(w, sw) {
  return '<circle r="' + r2(w * 0.1) + '" fill="#2a2622" fill-opacity="0.75" stroke="' + INK + '" stroke-width="' + r2(sw * 0.5) + '"/>';
}

// CSS background for a colour swatch button.
function swatchCSS(color) {
  if (color.finish === 'ab') return 'linear-gradient(135deg, #ffc7e8, #c4f1ff 40%, #e6ffc9 70%, #fff0bf)';
  if (color.finish === 'opal') return 'linear-gradient(135deg, ' + color.hex + ' 20%, #5be0ff, #7cff9a, #ff7ad9, ' + color.hex + ' 85%)';
  if (color.needles) return 'repeating-linear-gradient(62deg, ' + color.hex + ' 0 4px, ' + color.needles + ' 4px 5px), ' + color.hex;
  if (color.dots) return 'radial-gradient(' + color.dots + ' 1.5px, transparent 2px) 0 0 / 6px 6px, ' + color.hex;
  if (color.bands) return 'repeating-linear-gradient(170deg, ' + color.hex + ' 0 3px, ' + color.bands + ' 3px 5px)';
  if (color.phantom) return 'linear-gradient(' + color.hex + ' 45%, ' + color.phantom + ' 55%)';
  if (color.web) return 'radial-gradient(circle at 30% 40%, ' + color.web + ' 10%, transparent 25%), radial-gradient(circle at 70% 70%, ' + color.web + ' 8%, transparent 22%), ' + color.hex;
  if (color.rim) return 'radial-gradient(circle, ' + color.hex + ' 45%, ' + color.rim + ' 50%)';
  if (color.over) return 'radial-gradient(circle at 35% 30%, #ffffff, ' + color.hex + ' 55%, ' + color.over + ')';
  if (color.sheen) return 'radial-gradient(circle at 55% 45%, ' + color.sheen + ', ' + color.hex + ' 65%)';
  return color.hex;
}
