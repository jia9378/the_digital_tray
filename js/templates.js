// Jewellery templates: ring, bracelet, necklace, drawn at true size (mm).
// Each template gives back:
//   vb      the SVG viewBox {x, y, w, h}
//   guides  lines stones snap onto (arrays of [x, y] points)
//   draw    function(metal) -> SVG markup for the piece and the body

var METALS = [
  { id: 'yellow',   name: 'Yellow gold',   base: '#d9b35a', light: '#f7e3a6', dark: '#9a7225' },
  { id: 'rose',     name: 'Rose gold',     base: '#dca38a', light: '#f7d6c6', dark: '#9c604a' },
  { id: 'white',    name: 'White gold',    base: '#dad8d0', light: '#fbfaf5', dark: '#99978e' },
  { id: 'platinum', name: 'Platinum',      base: '#c8c9ca', light: '#f2f2f2', dark: '#828588' },
  { id: 'silver',   name: 'Silver',        base: '#c5c8cd', light: '#f8f9fb', dark: '#7c8189' },
  { id: 'black',    name: 'Black rhodium', base: '#4b4b50', light: '#9a9aa0', dark: '#1e1e21' }
];

var RING_SIZES = [];
for (var rs = 3; rs <= 13; rs += 0.5) RING_SIZES.push(rs);

function findMetal(id) {
  for (var i = 0; i < METALS.length; i++) if (METALS[i].id === id) return METALS[i];
  return METALS[0];
}

// Inner diameter (mm) of a US ring size.
function ringDiameter(usSize) {
  return 11.63 + 0.8128 * usSize;
}

// Metal gradients. "across" = 'x' shades left to right (a band curving away
// at its sides), 'y' shades top to bottom.
function metalGradient(metal, across) {
  var id = 'metal-' + metal.id + '-' + across;
  var dir = across === 'x' ? 'x1="0" y1="0" x2="1" y2="0"' : 'x1="0" y1="0" x2="0" y2="1"';
  return addDef(id,
    '<linearGradient id="' + id + '" ' + dir + '>' +
    stopsMarkup([
      [0, metal.dark], [0.1, metal.base], [0.32, metal.light],
      [0.5, metal.base], [0.78, metal.light], [0.92, metal.base], [1, metal.dark]
    ]) + '</linearGradient>');
}

function polyPath(pts, closed) {
  return 'M' + pts.map(function (p) { return r2(p[0]) + ' ' + r2(p[1]); }).join(' L') + (closed ? ' Z' : '');
}

function cubicPoints(p0, p1, p2, p3, steps) {
  var pts = [];
  for (var i = 0; i <= steps; i++) {
    var t = i / steps;
    var a = (1 - t) * (1 - t) * (1 - t);
    var b = 3 * (1 - t) * (1 - t) * t;
    var c = 3 * (1 - t) * t * t;
    var d = t * t * t;
    pts.push([
      a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0],
      a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]
    ]);
  }
  return pts;
}

function ellipsePoints(cx, cy, rx, ry, steps) {
  var pts = [];
  for (var i = 0; i <= steps; i++) {
    var t = i / steps * Math.PI * 2;
    pts.push([cx + rx * Math.sin(t), cy - ry * Math.cos(t)]);
  }
  return pts;
}

function dimLabel(x, y, text, anchor) {
  return '<text class="piece-label" x="' + r2(x) + '" y="' + r2(y) + '" text-anchor="' + (anchor || 'middle') + '">' + text + '</text>';
}


// ---------- Ring ----------
// Top view of a finger with the band across it, plus a front view of the band.
function ringLayout(p) {
  var D = ringDiameter(p.ringSize);
  var t = 1.7;              // metal thickness
  var bw = p.ringBand;      // band width along the finger
  var cx = 32;
  var bandY = 46;
  var fw = D + 0.6;         // finger width at the band
  var cx2 = 88;             // centre of the front view
  var cy2 = 38;

  function draw(metal) {
    var html = '';
    // Finger: straight sides, rounded tip, nail, knuckle creases.
    var L = cx - fw / 2;
    var R = cx + fw / 2;
    var tipY = 8;
    html += '<path class="body-line body-fill" d="M ' + r2(L - 0.6) + ' 82 L ' + r2(L) + ' ' + (tipY + fw * 0.45) +
      ' C ' + r2(L) + ' ' + (tipY - 1) + ', ' + r2(R) + ' ' + (tipY - 1) + ', ' + r2(R) + ' ' + (tipY + fw * 0.45) +
      ' L ' + r2(R + 0.6) + ' 82"/>';
    html += '<path class="body-line" d="M ' + r2(cx - fw * 0.3) + ' ' + (tipY + 15) + ' L ' + r2(cx - fw * 0.3) + ' ' + (tipY + 6) +
      ' C ' + r2(cx - fw * 0.3) + ' ' + (tipY + 1) + ', ' + r2(cx + fw * 0.3) + ' ' + (tipY + 1) + ', ' + r2(cx + fw * 0.3) + ' ' + (tipY + 6) +
      ' L ' + r2(cx + fw * 0.3) + ' ' + (tipY + 15) + ' C ' + r2(cx + fw * 0.15) + ' ' + (tipY + 16.5) + ', ' + r2(cx - fw * 0.15) + ' ' + (tipY + 16.5) + ', ' + r2(cx - fw * 0.3) + ' ' + (tipY + 15) + '"/>';
    [30, 33, 64, 66].forEach(function (y, i) {
      var half = fw * (i % 2 ? 0.18 : 0.26);
      html += '<path class="body-line faint" d="M ' + r2(cx - half) + ' ' + y + ' Q ' + cx + ' ' + (y + 1) + ' ' + r2(cx + half) + ' ' + y + '"/>';
    });

    // Band, seen from above.
    html += '<rect class="metal-edge" x="' + r2(cx - D / 2 - t) + '" y="' + r2(bandY - bw / 2) + '" width="' + r2(D + 2 * t) + '" height="' + r2(bw) + '" rx="0.4" fill="url(#' + metalGradient(metal, 'x') + ')"/>';

    // Front view: the band as a circle.
    var ro = D / 2 + t;
    var ri = D / 2;
    html += '<path class="metal-edge" fill-rule="evenodd" fill="url(#' + metalGradient(metal, 'x') + ')" d="' +
      'M ' + r2(cx2 - ro) + ' ' + cy2 + ' a ' + r2(ro) + ' ' + r2(ro) + ' 0 1 0 ' + r2(2 * ro) + ' 0 a ' + r2(ro) + ' ' + r2(ro) + ' 0 1 0 ' + r2(-2 * ro) + ' 0 Z ' +
      'M ' + r2(cx2 - ri) + ' ' + cy2 + ' a ' + r2(ri) + ' ' + r2(ri) + ' 0 1 0 ' + r2(2 * ri) + ' 0 a ' + r2(ri) + ' ' + r2(ri) + ' 0 1 0 ' + r2(-2 * ri) + ' 0 Z"/>';
    html += '<g class="dim"><line x1="' + r2(cx2 - ri) + '" y1="' + cy2 + '" x2="' + r2(cx2 + ri) + '" y2="' + cy2 + '"/>' +
      '<line x1="' + r2(cx2 - ri) + '" y1="' + (cy2 - 1) + '" x2="' + r2(cx2 - ri) + '" y2="' + (cy2 + 1) + '"/>' +
      '<line x1="' + r2(cx2 + ri) + '" y1="' + (cy2 - 1) + '" x2="' + r2(cx2 + ri) + '" y2="' + (cy2 + 1) + '"/></g>';
    html += dimLabel(cx2, cy2 - 1.6, 'Ø ' + D.toFixed(1) + ' mm');
    html += dimLabel(cx2, cy2 + ro + 6, 'FRONT VIEW');
    html += dimLabel(cx2, cy2 + ro + 10, 'US ' + p.ringSize + ' · EU ' + Math.round(Math.PI * D));
    html += dimLabel(cx, 88, 'TOP VIEW · BAND ' + bw + ' mm');
    return html;
  }

  return {
    vb: { x: 0, y: 0, w: 112, h: 92 },
    guides: [[[cx - D / 2 - t + 0.5, bandY], [cx + D / 2 + t - 0.5, bandY]]],
    draw: draw
  };
}


// ---------- Bracelet ----------
function braceletLayout(p) {
  if (p.braceletStyle === 'bangle') return bangleLayout(p);
  if (p.braceletStyle === 'beads') return beadBraceletLayout(p);

  // A line bracelet laid out straight on the bench.
  var L = p.braceletLen;
  var bw = p.braceletBand;
  var x0 = 14;
  var cy = 22;

  function draw(metal) {
    var html = '';
    // Jump ring on the left, lobster clasp on the right.
    html += '<circle cx="' + (x0 - 2.6) + '" cy="' + cy + '" r="2.1" fill="none" stroke="' + metal.dark + '" stroke-width="0.9"/>';
    html += '<circle cx="' + (x0 - 2.6) + '" cy="' + cy + '" r="2.1" fill="none" stroke="' + metal.base + '" stroke-width="0.55"/>';
    html += '<rect class="metal-edge" x="' + x0 + '" y="' + r2(cy - bw / 2) + '" width="' + L + '" height="' + bw + '" rx="' + r2(Math.min(bw / 2, 1)) + '" fill="url(#' + metalGradient(metal, 'y') + ')"/>';
    // Link marks every 2.5 mm, so it reads as a flexible line.
    var marks = '';
    for (var x = x0 + 2.5; x < x0 + L; x += 2.5) {
      marks += 'M ' + r2(x) + ' ' + r2(cy - bw / 2) + ' L ' + r2(x) + ' ' + r2(cy + bw / 2) + ' ';
    }
    html += '<path d="' + marks + '" stroke="' + metal.dark + '" stroke-opacity="0.35" stroke-width="0.12"/>';
    html += '<ellipse class="metal-edge" cx="' + (x0 + L + 3.6) + '" cy="' + cy + '" rx="3.6" ry="2.2" fill="url(#' + metalGradient(metal, 'y') + ')"/>';
    html += '<ellipse cx="' + (x0 + L + 3.9) + '" cy="' + cy + '" rx="1.9" ry="0.9" fill="#fbf9f4" stroke="' + metal.dark + '" stroke-width="0.15"/>';
    html += dimLabel(x0 + L / 2, cy + bw / 2 + 9, 'LINE BRACELET · ' + (L / 10) + ' cm · ' + bw + ' mm WIDE · LAID FLAT');
    return html;
  }

  return {
    vb: { x: 0, y: 0, w: L + 26, h: 40 + bw },
    guides: [[[x0 + 1, cy], [x0 + L - 1, cy]]],
    draw: draw
  };
}

// A bead bracelet (手串) laid flat: a circle of beads on an elastic cord.
// The length is measured round the bead centres, which is the cord length.
function beadBraceletLayout(p) {
  var L = p.beadLen;
  var R = L / (2 * Math.PI);
  var m = 14;                       // room for beads up to ~20 mm
  var cx = R + m;
  var cy = R + m;
  var circle = ellipsePoints(cx, cy, R, R, 240);

  function draw() {
    var d = polyPath(circle, true);
    var html = '<path d="' + d + '" fill="none" stroke="#9c9586" stroke-opacity="0.45" stroke-width="0.9"/>';
    html += '<path d="' + d + '" fill="none" stroke="#f6f3ec" stroke-width="0.55"/>';
    html += dimLabel(cx, cy - 2, 'BEAD BRACELET 手串');
    html += dimLabel(cx, cy + 2.5, (L / 10) + ' cm CORD');
    return html;
  }

  return {
    vb: { x: 0, y: 0, w: 2 * cx, h: 2 * cy },
    guides: [circle],
    draw: draw
  };
}

function bangleLayout(p) {
  var rx = p.bangleWidth / 2;      // inner half-width
  var ry = rx * 0.86;              // bangles are slightly oval
  var bw = p.braceletBand;
  var cx = rx + bw + 8;
  var cy = ry + bw + 8;

  function draw(metal) {
    var html = '';
    var outer = ellipsePoints(cx, cy, rx + bw, ry + bw, 120);
    var inner = ellipsePoints(cx, cy, rx, ry, 120);
    html += '<path class="metal-edge" fill-rule="evenodd" fill="' + metal.base + '" d="' + polyPath(outer, true) + ' ' + polyPath(inner, true) + '"/>';
    // A soft highlight running round the top of the band.
    html += '<path d="' + polyPath(ellipsePoints(cx, cy, rx + bw * 0.42, ry + bw * 0.42, 120), true) + '" fill="none" stroke="' + metal.light + '" stroke-width="' + r2(bw * 0.38) + '" stroke-opacity="0.8"/>';
    html += '<path d="' + polyPath(ellipsePoints(cx, cy, rx + bw * 0.85, ry + bw * 0.85, 120), true) + '" fill="none" stroke="' + metal.dark + '" stroke-width="' + r2(bw * 0.12) + '" stroke-opacity="0.5"/>';
    html += dimLabel(cx, cy - 2, 'BANGLE');
    html += dimLabel(cx, cy + 3, 'INSIDE ' + (2 * rx) + ' × ' + Math.round(2 * ry) + ' mm');
    html += dimLabel(cx, cy + 7, bw + ' mm WIDE · TOP VIEW');
    return html;
  }

  return {
    vb: { x: 0, y: 0, w: 2 * cx, h: 2 * cy },
    guides: [ellipsePoints(cx, cy, rx + bw / 2, ry + bw / 2, 240)],
    draw: draw
  };
}


// ---------- Necklace ----------
// Front view on a neck and collarbones. Longer chains hang lower.
function necklaceLayout(p) {
  var L = p.necklaceLen;
  var cx = 100;
  var depth = 60 + (L - 40) * 5.75;   // 40 cm sits on the collarbone notch
  var h = Math.max(110, depth + 30);

  // The chain comes round from behind the neck, at the sides where the neck meets the shoulders.
  var left = cubicPoints([cx - 53, 14], [cx - 62, depth * 0.66], [cx - 28, depth], [cx, depth], 60);
  var right = cubicPoints([cx, depth], [cx + 28, depth], [cx + 62, depth * 0.66], [cx + 53, 14], 60);
  var chain = left.concat(right.slice(1));

  function draw(metal) {
    var html = '';
    // Neck and shoulders.
    html += '<path class="body-line body-fill" d="M -2 ' + 58 + ' C 30 50, ' + (cx - 52) + ' 42, ' + (cx - 54) + ' 18 L ' + (cx - 51) + ' -4 ' +
      'L ' + (cx + 51) + ' -4 L ' + (cx + 54) + ' 18 C ' + (cx + 52) + ' 42, 170 50, 202 58 L 202 ' + (h + 2) + ' L -2 ' + (h + 2) + ' Z"/>';
    // Collarbones and the notch between them.
    html += '<path class="body-line faint" d="M ' + (cx - 9) + ' 64 C ' + (cx - 28) + ' 56, ' + (cx - 52) + ' 62, ' + (cx - 84) + ' 52"/>';
    html += '<path class="body-line faint" d="M ' + (cx + 9) + ' 64 C ' + (cx + 28) + ' 56, ' + (cx + 52) + ' 62, ' + (cx + 84) + ' 52"/>';
    html += '<path class="body-line faint" d="M ' + (cx - 7) + ' 61 Q ' + cx + ' 68 ' + (cx + 7) + ' 61"/>';

    // Chain: dark edge, metal, then a dashed highlight to suggest links.
    var d = polyPath(chain, false);
    html += '<path d="' + d + '" fill="none" stroke="' + metal.dark + '" stroke-width="1.15" stroke-linecap="round"/>';
    html += '<path d="' + d + '" fill="none" stroke="' + metal.base + '" stroke-width="0.8" stroke-linecap="round"/>';
    html += '<path d="' + d + '" fill="none" stroke="' + metal.light + '" stroke-width="0.35" stroke-dasharray="0.9 0.6"/>';
    html += dimLabel(cx, h - 3, L + ' cm CHAIN · FRONT VIEW, WORN');
    return html;
  }

  return {
    vb: { x: 0, y: 0, w: 200, h: h },
    guides: [chain],
    draw: draw
  };
}

function pieceLayout(p) {
  if (p.type === 'bracelet') return braceletLayout(p);
  if (p.type === 'necklace') return necklaceLayout(p);
  return ringLayout(p);
}

// Nearest point on any guide line. Returns {x, y, dist, guide, seg, t} or null.
function nearestOnGuides(guides, x, y) {
  var best = null;
  guides.forEach(function (g, gi) {
    for (var i = 0; i < g.length - 1; i++) {
      var a = g[i];
      var b = g[i + 1];
      var dx = b[0] - a[0];
      var dy = b[1] - a[1];
      var len2 = dx * dx + dy * dy || 1e-9;
      var t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / len2));
      var px = a[0] + dx * t;
      var py = a[1] + dy * t;
      var dist = Math.hypot(x - px, y - py);
      if (!best || dist < best.dist) best = { x: px, y: py, dist: dist, guide: gi, seg: i, t: t };
    }
  });
  return best;
}

// Turn a guide into points every `spacing` mm along its length,
// starting from the point nearest (x, y) and going both ways.
function pointsAlongGuide(guide, x, y, spacing) {
  // Distance along the guide for each vertex.
  var acc = [0];
  for (var i = 1; i < guide.length; i++) {
    acc.push(acc[i - 1] + Math.hypot(guide[i][0] - guide[i - 1][0], guide[i][1] - guide[i - 1][1]));
  }
  var total = acc[acc.length - 1];
  var near = nearestOnGuides([guide], x, y);
  var start = acc[near.seg] + (acc[near.seg + 1] - acc[near.seg]) * near.t;
  var closed = Math.hypot(guide[0][0] - guide[guide.length - 1][0], guide[0][1] - guide[guide.length - 1][1]) < 0.01;

  function pointAt(s) {
    if (closed) s = ((s % total) + total) % total;
    for (var j = 1; j < acc.length; j++) {
      if (acc[j] >= s) {
        var f = (s - acc[j - 1]) / ((acc[j] - acc[j - 1]) || 1e-9);
        return [guide[j - 1][0] + (guide[j][0] - guide[j - 1][0]) * f, guide[j - 1][1] + (guide[j][1] - guide[j - 1][1]) * f];
      }
    }
    return guide[guide.length - 1];
  }

  var pts = [];
  if (closed) {
    // A drawn circle is a polygon, a hair shorter than the real one, so allow a little slack.
    var n = Math.max(1, Math.floor(total / spacing + 0.02));
    var even = total / n;
    for (var k = 1; k < n; k++) pts.push(pointAt(start + k * even));
    return pts;
  }
  for (var s = start + spacing; s <= total + 0.001; s += spacing) pts.push(pointAt(s));
  for (s = start - spacing; s >= -0.001; s -= spacing) pts.push(pointAt(s));
  return pts;
}
