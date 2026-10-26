// Study: what a stone is made of, and how light moves through it.
//
// FIG. A  the stone from above, enlarged, with its size.
// FIG. B  a 2D cross-section with one ray traced through it using Snell's law:
//         it bends going in, bounces inside when it hits a surface at more than
//         the critical angle (total internal reflection), and leaves when it
//         doesn't. A schematic: real light paths are 3D.

var studyEl = document.getElementById('study-view');

var study = {
  stone: null,      // { gem, color, cut, w, h }
  entry: 0.35,      // where the ray enters, -1 (left) .. 1 (right)
  tilt: 0,          // angle of the incoming ray, degrees from straight down
  crown: 34.5,
  pavilion: 40.75,
  rays: 'one'       // 'one' | 'fire' | 'double'
};

var BRILLIANT_CUTS = ['round', 'oval', 'cushion', 'princess', 'pear', 'marquise', 'heart'];
var STEP_CUTS = ['emerald', 'asscher', 'baguette'];

function isFacetedCut(cut) {
  return BRILLIANT_CUTS.indexOf(cut) >= 0 || STEP_CUTS.indexOf(cut) >= 0;
}

// Good starting proportions: Tolkowsky-style for diamond, a little steeper
// for coloured stones.
function defaultAngles(gemId) {
  if (gemId === 'diamond') return { crown: 34.5, pavilion: 40.75 };
  return { crown: 35, pavilion: 42 };
}

function meanRI(data) {
  return (data.ri[0] + data.ri[1]) / 2;
}

function criticalAngle(n) {
  return Math.asin(1 / n) * 180 / Math.PI;
}


// ---------- Cross-section shapes (mm, girdle on y = 0, y down) ----------

function circlePoly(r, n, startAngle) {
  var pts = [];
  for (var i = 0; i < n; i++) {
    var t = (startAngle || 0) + i / n * Math.PI * 2;
    pts.push([r * Math.cos(t), r * Math.sin(t)]);
  }
  return pts;
}

// Returns { pts, top, bottom, kind, table } for the section across the width.
function sectionProfile(stone) {
  var cut = stone.cut;
  var w = stone.w;
  var a = w / 2;
  var rad = Math.PI / 180;

  if (cut === 'beadRound' || cut === 'pearlRound' || cut === 'pearlDrop' || cut === 'baroque') {
    return { pts: circlePoly(a, 72, 0), top: -a, bottom: a, kind: 'round', table: a * 0.9 };
  }
  if (cut === 'beadFaceted') {
    return { pts: circlePoly(a, 12, Math.PI / 12), top: -a, bottom: a, kind: 'round', table: a * 0.8 };
  }
  if (cut === 'bicone') {
    return { pts: [[0, -a], [a, 0], [0, a], [-a, 0]], top: -a, bottom: a, kind: 'round', table: a * 0.5 };
  }
  if (cut === 'cabRound' || cut === 'cabOval') {
    var hd = 0.45 * Math.min(stone.w, stone.h);
    var dome = [];
    for (var i = 0; i <= 40; i++) {
      var t = Math.PI + i / 40 * Math.PI;
      dome.push([a * Math.cos(t), hd * Math.sin(t)]);
    }
    return { pts: dome, top: -hd, bottom: 0, kind: 'cab', table: a * 0.85 };
  }

  var tbl = (stone.gem === 'diamond' ? 0.56 : 0.58) * a;        // half the table width
  var gy = 0.015 * w;                                              // half the girdle thickness
  var ch = (a - tbl) * Math.tan(study.crown * rad);
  var pd = a * Math.tan(study.pavilion * rad);

  if (STEP_CUTS.indexOf(cut) >= 0) {
    // Two crown steps, three pavilion steps down to a short keel line.
    var m = tbl + (a - tbl) * 0.5;
    var k = 0.08 * a;
    var right = [[m, -gy - ch * 0.62], [a, -gy], [a, gy], [0.68 * a, gy + 0.42 * pd], [0.36 * a, gy + 0.78 * pd], [k, gy + pd]];
    var pts = [[-tbl, -gy - ch], [tbl, -gy - ch]].concat(right);
    pts = pts.concat(right.slice().reverse().map(function (p) { return [-p[0], p[1]]; }));
    return { pts: pts, top: -gy - ch, bottom: gy + pd, kind: 'faceted', table: tbl };
  }

  return {
    pts: [[-tbl, -gy - ch], [tbl, -gy - ch], [a, -gy], [a, gy], [0, gy + pd], [-a, gy], [-a, -gy]],
    top: -gy - ch, bottom: gy + pd, kind: 'faceted', table: tbl
  };
}


// ---------- Ray tracing ----------

function vAdd(a, b) { return [a[0] + b[0], a[1] + b[1]]; }
function vMul(a, k) { return [a[0] * k, a[1] * k]; }
function vDot(a, b) { return a[0] * b[0] + a[1] * b[1]; }
function vNorm(a) { var l = Math.hypot(a[0], a[1]) || 1; return [a[0] / l, a[1] / l]; }
function deg(rad) { return rad * 180 / Math.PI; }

function polyCentre(pts) {
  var c = [0, 0];
  pts.forEach(function (p) { c[0] += p[0] / pts.length; c[1] += p[1] / pts.length; });
  return c;
}

// Unit normal of edge i, pointing out of the stone.
function outwardNormal(pts, i) {
  var a = pts[i];
  var b = pts[(i + 1) % pts.length];
  var n = vNorm([b[1] - a[1], -(b[0] - a[0])]);
  var mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  var c = polyCentre(pts);
  if (vDot(n, [mid[0] - c[0], mid[1] - c[1]]) < 0) n = vMul(n, -1);
  return n;
}

// Nearest place the ray p + t·d meets the outline, skipping edge `skip`.
function firstHit(pts, p, d, skip) {
  var best = null;
  for (var i = 0; i < pts.length; i++) {
    if (i === skip) continue;
    var a = pts[i];
    var b = pts[(i + 1) % pts.length];
    var e = [b[0] - a[0], b[1] - a[1]];
    var den = d[0] * e[1] - d[1] * e[0];
    if (Math.abs(den) < 1e-12) continue;
    var ap = [a[0] - p[0], a[1] - p[1]];
    var t = (ap[0] * e[1] - ap[1] * e[0]) / den;
    var u = (ap[0] * d[1] - ap[1] * d[0]) / den;
    if (t > 1e-7 && u >= -1e-9 && u <= 1 + 1e-9 && (!best || t < best.t)) {
      best = { t: t, edge: i, p: vAdd(p, vMul(d, t)) };
    }
  }
  return best;
}

// Snell's law in vector form. `nn` is the surface normal on the side the
// light comes from. Returns null for total internal reflection.
function refract(d, nn, eta) {
  var cosi = -vDot(nn, d);
  var k = 1 - eta * eta * (1 - cosi * cosi);
  if (k < 0) return null;
  return vNorm(vAdd(vMul(d, eta), vMul(nn, eta * cosi - Math.sqrt(k))));
}

function reflect(d, nn) {
  return vNorm(vAdd(d, vMul(nn, -2 * vDot(d, nn))));
}

// Trace one ray. Returns { segs: [{a, b, kind}], events: [{type, p, inc, out}] }.
// kind: 'air' (coming in), 'inside', 'return' (leaves through the top), 'leak'.
function traceRay(prof, n, start, dir) {
  var pts = prof.pts;
  var size = prof.bottom - prof.top;
  var segs = [];
  var events = [];
  var hit = firstHit(pts, start, dir, -1);
  if (!hit) return { segs: [{ a: start, b: vAdd(start, vMul(dir, size * 3)), kind: 'air' }], events: [{ type: 'miss' }] };

  segs.push({ a: start, b: hit.p, kind: 'air' });
  var no = outwardNormal(pts, hit.edge);
  var inc = deg(Math.acos(Math.min(1, -vDot(no, dir))));
  var d = refract(dir, no, 1 / n);
  events.push({ type: 'enter', p: hit.p, inc: inc, out: deg(Math.acos(Math.min(1, -vDot(no, d)))) });

  var p = hit.p;
  var edge = hit.edge;
  for (var i = 0; i < 12; i++) {
    var h = firstHit(pts, p, d, edge);
    if (!h) break;
    segs.push({ a: p, b: h.p, kind: 'inside' });
    var no2 = outwardNormal(pts, h.edge);
    var ci = Math.min(1, vDot(no2, d));
    var inc2 = deg(Math.acos(ci));
    var t = refract(d, vMul(no2, -1), n);
    if (!t) {
      events.push({ type: 'tir', p: h.p, inc: inc2 });
      d = reflect(d, no2);
      p = h.p;
      edge = h.edge;
      continue;
    }
    // Leaving through the upper half sends light back towards the viewer.
    var mid = prof.kind === 'cab' ? -1e-6 : 0;
    var kind = h.p[1] < mid ? 'return' : 'leak';
    segs.push({ a: h.p, b: vAdd(h.p, vMul(t, size * 1.1)), kind: kind });
    events.push({ type: kind, p: h.p, inc: inc2, out: deg(Math.acos(Math.min(1, -vDot(no2, vMul(t, -1))))) });
    return { segs: segs, events: events };
  }
  events.push({ type: 'trapped' });
  return { segs: segs, events: events };
}

// Where the incoming ray starts, from the entry and tilt settings.
function rayStart(prof) {
  var size = prof.bottom - prof.top;
  var x = study.entry * prof.table;
  var tilt = study.tilt * Math.PI / 180;
  var dir = [Math.sin(tilt), Math.cos(tilt)];
  var back = size * 1.3;
  return { start: [x - dir[0] * back, prof.top - dir[1] * back], dir: dir };
}


// ---------- Drawing ----------

var RAY_SETS = {
  one:    function (data) { return [{ n: meanRI(data), color: '#c8402a', label: '' }]; },
  // The real spread is too small to see at this size, so it's drawn 10x larger.
  fire:   function (data) {
    var n = meanRI(data);
    var half = (data.disp || 0) / 2 * SPREAD;
    return [
      { n: n - half, color: '#d9392b', label: 'red' },
      { n: n, color: '#2f9e55', label: 'green' },
      { n: n + half, color: '#5b45d6', label: 'violet' }
    ];
  },
  double: function (data) {
    var n = meanRI(data);
    var half = (data.ri[1] - data.ri[0]) / 2 * doubleSpread(data);
    return [
      { n: n - half, color: '#2b6fd6', label: 'low' },
      { n: n + half, color: '#e08a1e', label: 'high' }
    ];
  }
};

var SPREAD = 10;

// Small double refraction is exaggerated like dispersion; big (rhodochrosite) isn't.
function doubleSpread(data) {
  var b = birefValue(data);
  return b && b < 0.05 ? SPREAD : 1;
}

function topViewSVG(s) {
  var m = Math.max(s.w, s.h) / 2;
  var pad = m * 0.55;
  var vb = [-m - pad * 0.6, -m - pad * 0.6, 2 * m + pad * 1.6, 2 * m + pad * 1.6];
  var u = m / 12; // label unit
  var dimY = s.h / 2 + pad * 0.45;
  var dimX = s.w / 2 + pad * 0.45;
  var html = '<svg class="st-top" viewBox="' + vb.join(' ') + '">' +
    '<g filter="url(#stone-shadow)">' + stoneSVG(s) + '</g>' +
    // Where FIG. B cuts through.
    '<line class="st-section" x1="' + r2(-m - pad * 0.3) + '" y1="0" x2="' + r2(m + pad * 0.3) + '" y2="0"/>' +
    '<text class="st-dimtext" x="' + r2(-m - pad * 0.45) + '" y="' + r2(u) + '" text-anchor="end" font-size="' + r2(u * 2.6) + '">B</text>' +
    // Width and length.
    '<g class="st-dim">' +
      '<line x1="' + r2(-s.w / 2) + '" y1="' + r2(dimY) + '" x2="' + r2(s.w / 2) + '" y2="' + r2(dimY) + '"/>' +
      '<line x1="' + r2(-s.w / 2) + '" y1="' + r2(dimY - u) + '" x2="' + r2(-s.w / 2) + '" y2="' + r2(dimY + u) + '"/>' +
      '<line x1="' + r2(s.w / 2) + '" y1="' + r2(dimY - u) + '" x2="' + r2(s.w / 2) + '" y2="' + r2(dimY + u) + '"/>' +
    '</g>' +
    '<text class="st-dimtext" x="0" y="' + r2(dimY + u * 3.6) + '" text-anchor="middle" font-size="' + r2(u * 2.4) + '">' + s.w + ' mm</text>';
  if (!CUTS[s.cut].lock) {
    html += '<g class="st-dim">' +
      '<line x1="' + r2(dimX) + '" y1="' + r2(-s.h / 2) + '" x2="' + r2(dimX) + '" y2="' + r2(s.h / 2) + '"/>' +
      '<line x1="' + r2(dimX - u) + '" y1="' + r2(-s.h / 2) + '" x2="' + r2(dimX + u) + '" y2="' + r2(-s.h / 2) + '"/>' +
      '<line x1="' + r2(dimX - u) + '" y1="' + r2(s.h / 2) + '" x2="' + r2(dimX + u) + '" y2="' + r2(s.h / 2) + '"/>' +
      '</g>' +
      '<text class="st-dimtext" x="' + r2(dimX + u * 1.6) + '" y="' + r2(u) + '" font-size="' + r2(u * 2.4) + '">' + s.h + ' mm</text>';
  }
  return html + '</svg>';
}

// FIG. B: cross-section, rays, and numbered events. Returns { svg, events }.
function sectionSVG(s, data) {
  var prof = sectionProfile(s);
  var size = prof.bottom - prof.top;
  var a = s.w / 2;
  var vb = [-a * 1.9, prof.top - size * 1.05, a * 3.8, size * 2.35];
  var u = Math.max(s.w, size) / 60;
  var color = findColor(s.gem, s.color);
  var fill = mix(color.hex, '#ffffff', 0.55);

  var html = '<svg class="st-section-svg" viewBox="' + vb.map(r2).join(' ') + '">';
  html += '<path class="st-stone" d="M' + prof.pts.map(function (p) { return r2(p[0]) + ' ' + r2(p[1]); }).join(' L') + ' Z" fill="' + fill + '"/>';
  if (prof.kind === 'faceted') {
    html += '<line class="st-girdle" x1="' + r2(-a * 1.25) + '" y1="0" x2="' + r2(a * 1.25) + '" y2="0"/>';
    html += '<text class="st-lbl" x="' + r2(-a * 1.3) + '" y="' + r2(-u * 0.8) + '" font-size="' + r2(u * 2.2) + '" text-anchor="end">CROWN</text>';
    html += '<text class="st-lbl" x="' + r2(-a * 1.3) + '" y="' + r2(u * 2.6) + '" font-size="' + r2(u * 2.2) + '" text-anchor="end">PAVILION</text>';
  }

  var start = rayStart(prof);
  var events = [];

  if (data.look === 'opaque' || data.look === 'pearl') {
    // Light doesn't go through: show it bouncing off the surface.
    var hit = firstHit(prof.pts, start.start, start.dir, -1);
    if (data.look === 'pearl') {
      // Nacre layers around a bead nucleus.
      for (var k = 1; k <= 6; k++) {
        html += '<circle cx="0" cy="0" r="' + r2(a * (0.55 + k * 0.07)) + '" fill="none" stroke="' + mix(color.hex, '#7a6a55', 0.5) + '" stroke-opacity="0.45" stroke-width="' + r2(u * 0.25) + '"/>';
      }
      html += '<circle cx="0" cy="0" r="' + r2(a * 0.52) + '" fill="#efe6d6" stroke="#b9ad97" stroke-width="' + r2(u * 0.3) + '"/>';
      html += '<text class="st-lbl" x="0" y="' + r2(u * 0.9) + '" font-size="' + r2(u * 2) + '" text-anchor="middle">NUCLEUS</text>';
      html += '<text class="st-lbl" x="' + r2(a * 1.12) + '" y="' + r2(a * 0.75) + '" font-size="' + r2(u * 2) + '">NACRE</text>';
    }
    if (hit) {
      var no = outwardNormal(prof.pts, hit.edge);
      var refl = reflect(start.dir, no);
      html += rayPath(start.start, hit.p, '#c8402a', u, 'air');
      html += rayPath(hit.p, vAdd(hit.p, vMul(refl, size * 1.1)), '#c8402a', u, 'return');
      html += eventDot(hit.p, 1, u);
      events.push({ type: data.look === 'pearl' ? 'nacre' : 'surface', inc: deg(Math.acos(Math.min(1, -vDot(no, start.dir)))) });
    }
    return { svg: html + '</svg>', events: events, prof: prof };
  }

  var set = RAY_SETS[study.rays](data);
  var main = null;
  set.forEach(function (ray, idx) {
    var tr = traceRay(prof, ray.n, start.start, start.dir);
    var faded = data.look === 'translucent';
    tr.segs.forEach(function (sg) { html += rayPath(sg.a, sg.b, ray.color, u, sg.kind, faded); });
    if (idx === Math.floor((set.length - 1) / 2)) main = tr; // number the middle ray's steps
  });
  // Number the events of the first ray.
  var num = 0;
  main.events.forEach(function (ev) {
    if (!ev.p) return;
    num++;
    ev.num = num;
    html += eventDot(ev.p, num, u);
  });
  return { svg: html + '</svg>', events: main.events, prof: prof };
}

function rayPath(a, b, color, u, kind, faded) {
  var dash = kind === 'leak' ? ' stroke-dasharray="' + r2(u * 1.2) + ' ' + r2(u * 0.8) + '"' : '';
  var op = (kind === 'leak' ? 0.55 : 1) * (faded ? 0.6 : 1);
  var html = '<line x1="' + r2(a[0]) + '" y1="' + r2(a[1]) + '" x2="' + r2(b[0]) + '" y2="' + r2(b[1]) + '" stroke="' + color + '" stroke-opacity="' + op + '" stroke-width="' + r2(u * 0.45) + '" stroke-linecap="round"' + dash + '/>';
  if (kind === 'return' || kind === 'leak') {
    // Arrow head at the end.
    var d = vNorm([b[0] - a[0], b[1] - a[1]]);
    var side = [-d[1], d[0]];
    var s = u * 1.6;
    var p1 = vAdd(b, vAdd(vMul(d, -s), vMul(side, s * 0.5)));
    var p2 = vAdd(b, vAdd(vMul(d, -s), vMul(side, -s * 0.5)));
    html += '<polygon points="' + [b, p1, p2].map(function (p) { return r2(p[0]) + ',' + r2(p[1]); }).join(' ') + '" fill="' + color + '" fill-opacity="' + op + '"/>';
  }
  return html;
}

function eventDot(p, num, u) {
  return '<circle cx="' + r2(p[0]) + '" cy="' + r2(p[1]) + '" r="' + r2(u * 1.5) + '" fill="#1f1f1f"/>' +
    '<text x="' + r2(p[0]) + '" y="' + r2(p[1] + u * 0.7) + '" font-size="' + r2(u * 1.9) + '" fill="#fbf9f4" text-anchor="middle" class="st-num">' + num + '</text>';
}

function eventText(ev, n) {
  var crit = criticalAngle(n).toFixed(1);
  if (ev.type === 'enter') return 'Enters and bends: ' + ev.inc.toFixed(1) + '° outside becomes ' + ev.out.toFixed(1) + '° inside.';
  if (ev.type === 'tir') return 'Hits at ' + ev.inc.toFixed(1) + '°, more than the critical angle (' + crit + '°): <strong>reflects back inside</strong>.';
  if (ev.type === 'return') return 'Hits at ' + ev.inc.toFixed(1) + '°, less than ' + crit + '°: <strong>leaves through the top</strong>, back towards your eye.';
  if (ev.type === 'leak') return 'Hits at ' + ev.inc.toFixed(1) + '°, less than ' + crit + '°: <strong>leaks out of the bottom</strong>. This light is lost.';
  if (ev.type === 'trapped') return 'Still bouncing after 12 reflections.';
  if (ev.type === 'surface') return 'Opaque: light reflects off the surface. You see the colour of the material itself, not light through it.';
  if (ev.type === 'nacre') return 'Light reflects off the surface and off the thin nacre layers below it. Those many small reflections are the lustre.';
  if (ev.type === 'miss') return 'The ray misses the stone.';
  return '';
}


// ---------- The page ----------

function studyTitle(s) {
  // "Pearl, round" rather than "Pearl, round pearl".
  var cut = /pearl/i.test(CUTS[s.cut].name) ? CUTS[s.cut].short : CUTS[s.cut].name;
  return GEMS[s.gem].name + ', ' + cut.charAt(0).toLowerCase() + cut.slice(1);
}

function openStudy(selected) {
  if (selected) {
    study.stone = { gem: selected.gem, color: selected.color, cut: selected.cut, w: selected.w, h: selected.h };
  } else if (!study.stone) {
    var cut = GEMS[libPick.gem].cuts[0];
    study.stone = { gem: libPick.gem, color: libPick.color, cut: cut, w: CUTS[cut].w, h: CUTS[cut].h };
  }
  var ang = defaultAngles(study.stone.gem);
  study.crown = ang.crown;
  study.pavilion = ang.pavilion;
  renderStudy();
}

function renderStudy() {
  var s = study.stone;
  var data = gemData(s.gem, s.color);
  var color = findColor(s.gem, s.color);
  var cut = CUTS[s.cut];
  var ct = estimateCarat({ gem: s.gem, cut: s.cut, w: s.w, h: s.h });
  var faceted = isFacetedCut(s.cut);
  var traced = data.look === 'transparent' || data.look === 'translucent';
  if (study.rays === 'fire' && !data.disp) study.rays = 'one';
  if (study.rays === 'double' && !birefValue(data)) study.rays = 'one';

  var cutOptions = GEMS[s.gem].cuts.map(function (k) {
    return '<option value="' + k + '"' + (k === s.cut ? ' selected' : '') + '>' + CUTS[k].name + '</option>';
  }).join('');

  var html =
    '<div class="st-head">' +
      '<p class="dlg-kicker">STUDY</p>' +
      '<h2 class="st-title">' + studyTitle(s) + '</h2>' +
      '<p class="st-sub">' + color.name + ' · ' + (cut.lock ? s.w + ' mm' : s.w + ' × ' + s.h + ' mm') + (ct !== null ? ' · ≈ ' + ct.toFixed(2) + ' ct' : '') + '</p>' +
    '</div>' +

    '<div class="st-pick">' +
      '<label class="pick-row"><span class="pick-label">STONE</span>' + gemSelectHTML('st-gem', s.gem) + '</label>' +
      '<div class="pick-row"><span class="pick-label">COLOUR</span>' + swatchesHTML(s.gem, color.id, 'data-st-color') + '</div>' +
      '<label class="pick-row"><span class="pick-label">CUT</span><select id="st-cut">' + cutOptions + '</select></label>' +
      '<label class="pick-row"><span class="pick-label">' + (cut.lock ? 'DIAM.' : 'W × L') + '</span>' +
        '<input type="number" id="st-w" min="0.5" max="40" step="0.1" value="' + s.w + '">' +
        (cut.lock ? '' : '<input type="number" id="st-h" min="0.5" max="40" step="0.1" value="' + s.h + '">') + ' mm</label>' +
    '</div>' +

    '<div class="st-grid">' +
      '<div class="st-figs">' +
        '<figure class="st-fig"><div class="st-fig-box">' + topViewSVG(s) + '</div>' +
          '<figcaption>FIG. A — TOP VIEW, ENLARGED</figcaption></figure>' +
        '<figure class="st-fig st-fig-wide"><div class="st-fig-box" id="st-section"></div>' +
          '<figcaption>FIG. B — 2D LIGHT PATH THROUGH SECTION B (SCHEMATIC)</figcaption></figure>' +

        '<div class="st-controls">' +
          slider('st-entry', 'ENTRY', -1, 1, 0.01, study.entry, '') +
          slider('st-tilt', 'TILT', -45, 45, 0.5, study.tilt, '°') +
          (faceted ? slider('st-crown', 'CROWN', 20, 45, 0.25, study.crown, '°') + slider('st-pav', 'PAVILION', 30, 50, 0.25, study.pavilion, '°') : '') +
          (traced ?
            '<div class="st-rays"><span class="pick-label">RAYS</span><div class="segs">' +
              '<button class="seg' + (study.rays === 'one' ? ' active' : '') + '" data-rays="one">ONE</button>' +
              '<button class="seg' + (study.rays === 'fire' ? ' active' : '') + '" data-rays="fire"' + (data.disp ? '' : ' disabled') + ' title="Dispersion: each colour bends a different amount">FIRE</button>' +
              '<button class="seg' + (study.rays === 'double' ? ' active' : '') + '" data-rays="double"' + (birefValue(data) ? '' : ' disabled') + ' title="Birefringence: light splits into two rays">DOUBLE</button>' +
            '</div></div>' : '') +
          '<button class="link-button st-reset" data-st="reset">RESET</button>' +
        '</div>' +
        '<ol class="st-log" id="st-log"></ol>' +
        '<div id="st-rule"></div>' +
      '</div>' +

      '<aside class="st-data">' + dataTable(data) + '</aside>' +
    '</div>';

  studyEl.innerHTML = html;
  renderSection();
}

function slider(id, label, min, max, step, value, unit) {
  return '<label class="st-slider"><span class="pick-label">' + label + '</span>' +
    '<input type="range" id="' + id + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + value + '">' +
    '<output id="' + id + '-out">' + (unit ? Number(value).toFixed(unit === '°' ? 1 : 2) + unit : Math.round(value * 100) + '%') + '</output></label>';
}

// FIG. B, the event list and the rule of thumb (redrawn while sliders move).
function renderSection() {
  var s = study.stone;
  var data = gemData(s.gem, s.color);
  var n = meanRI(data);
  var fig = sectionSVG(s, data);
  document.getElementById('st-section').innerHTML = fig.svg;

  var spreadNote = '';
  if (study.rays === 'fire') {
    spreadNote = '<li class="st-small st-plain">FIRE: red, green and violet light bend by slightly different amounts (dispersion ' + data.disp.toFixed(3) + '). The spread is drawn ' + SPREAD + '× larger so you can see it.</li>';
  }
  if (study.rays === 'double') {
    spreadNote = '<li class="st-small st-plain">DOUBLE: the stone splits light into two rays with refractive indices ' + data.ri[0] + ' and ' + data.ri[1] + '.' +
      (doubleSpread(data) > 1 ? ' The split is drawn ' + SPREAD + '× larger so you can see it.' : ' Drawn at true strength.') + '</li>';
  }
  document.getElementById('st-log').innerHTML = fig.events.map(function (ev) {
    return '<li' + (ev.type === 'leak' ? ' class="leak"' : ev.type === 'return' ? ' class="ok"' : '') + '>' + eventText(ev, n) + '</li>';
  }).join('') + spreadNote;

  var rule = '';
  if (isFacetedCut(s.cut) && (data.look === 'transparent' || data.look === 'translucent')) {
    // For a ray straight down through the table, the first pavilion hit is at
    // the pavilion angle P and the second at 180 - 3P. Both must be more than
    // the critical angle: too shallow leaks at the first, too deep at the second.
    var crit = criticalAngle(n);
    var P = study.pavilion;
    var second = 180 - 3 * P;
    var ok1 = P > crit;
    var ok2 = second > crit;
    rule = '<div class="st-rule"><p class="pick-label">RULE OF THUMB · RAY STRAIGHT DOWN</p>' +
      '<p>Critical angle: <strong>' + crit.toFixed(1) + '°</strong> (sin⁻¹ 1/' + n.toFixed(3) + ')</p>' +
      '<p class="' + (ok1 ? 'ok' : 'leak') + '">' + (ok1 ? '✓' : '✗') + ' 1st bounce at the pavilion angle, ' + P.toFixed(1) + '°</p>' +
      '<p class="' + (ok2 ? 'ok' : 'leak') + '">' + (ok2 ? '✓' : '✗') + ' 2nd bounce at 180° − 3 × ' + P.toFixed(1) + '° = ' + second.toFixed(1) + '°</p>' +
      '<p class="st-small">Both bounces stay inside for pavilion angles between ' + crit.toFixed(1) + '° and ' + ((180 - crit) / 3).toFixed(1) + '°. The trace above also checks where it leaves.</p>' +
      '<p class="st-small">' + (ok1 && ok2 ? 'Both bounces stay inside, so the light comes back up through the crown.'
        : (ok1 ? 'Too deep: the second bounce leaks out of the far side.' : 'Too shallow: light leaks straight through the pavilion, which shows as a see-through "window".')) + '</p></div>';
  }
  document.getElementById('st-rule').innerHTML = rule;
}

function dataTable(d) {
  var ri = d.ri[0] === d.ri[1] ? d.ri[0].toFixed(3) : d.ri[0].toFixed(3) + '–' + d.ri[1].toFixed(3);
  var rows = [
    ['SPECIES', d.species],
    ['FORMULA', d.formula],
    ['SYSTEM', d.system],
    ['REFRACTIVE INDEX', ri],
    ['DOUBLE REFRACTION', d.biref === 0 ? 'None (singly refractive)' : d.biref === null || d.biref === undefined ? 'Not detectable / not given'
      : Array.isArray(d.biref) ? d.biref[0].toFixed(3) + '–' + d.biref[1].toFixed(3) : d.biref.toFixed(3)],
    ['DISPERSION', d.disp ? d.disp.toFixed(3) : 'Not given'],
    ['CRITICAL ANGLE', d.look === 'opaque' || d.look === 'pearl' ? '— (light doesn\'t pass through)' : criticalAngle(meanRI(d)).toFixed(1) + '°'],
    ['HARDNESS', d.hardness + ' Mohs'],
    ['SPECIFIC GRAVITY', d.sg],
    ['LUSTRE', d.lustre],
    ['LIGHT', d.look === 'pearl' ? 'Opaque, nacreous' : d.look.charAt(0).toUpperCase() + d.look.slice(1)]
  ];
  return '<table class="st-table">' + rows.map(function (r) {
    return '<tr><th>' + r[0] + '</th><td>' + r[1] + '</td></tr>';
  }).join('') + '</table>' +
    (d.note ? '<p class="st-note">' + d.note + '</p>' : '') +
    '<p class="pick-label st-src-title">SOURCES</p>' +
    (d.src && d.src.length
      ? '<ul class="st-src">' + d.src.map(function (x) { return '<li><a href="' + x.url + '" target="_blank" rel="noopener">' + x.label + '</a></li>'; }).join('') + '</ul>'
      : '<p class="st-source">No source for this entry.</p>') +
    (d.check ? '<p class="st-source">Note: ' + d.check + '</p>' : '') +
    '<p class="st-source">Typical values; individual stones vary.</p>';
}


// ---------- Events ----------

studyEl.addEventListener('change', function (e) {
  var s = study.stone;
  if (!s) return;
  if (e.target.id === 'st-gem') {
    s.gem = e.target.value;
    s.color = GEMS[s.gem].colors[0].id;
    if (GEMS[s.gem].cuts.indexOf(s.cut) < 0) changeCut(s, GEMS[s.gem].cuts[0]);
    var ang = defaultAngles(s.gem);
    study.crown = ang.crown;
    study.pavilion = ang.pavilion;
    renderStudy();
  }
  if (e.target.id === 'st-cut') {
    changeCut(s, e.target.value);
    renderStudy();
  }
  if (e.target.id === 'st-w' || e.target.id === 'st-h') {
    var v = parseFloat(e.target.value);
    if (!(v > 0)) return;
    if (e.target.id === 'st-w') {
      s.w = v;
      if (CUTS[s.cut].lock) s.h = v;
    } else {
      s.h = v;
    }
    renderStudy();
  }
});

studyEl.addEventListener('input', function (e) {
  var id = e.target.id;
  var v = parseFloat(e.target.value);
  if (id === 'st-entry') study.entry = v;
  else if (id === 'st-tilt') study.tilt = v;
  else if (id === 'st-crown') study.crown = v;
  else if (id === 'st-pav') study.pavilion = v;
  else return;
  var out = document.getElementById(id + '-out');
  if (out) out.textContent = id === 'st-entry' ? Math.round(v * 100) + '%' : v.toFixed(1) + '°';
  renderSection();
});

studyEl.addEventListener('click', function (e) {
  var btn = e.target.closest('button');
  if (!btn || !study.stone) return;
  var colorId = btn.getAttribute('data-st-color');
  if (colorId) {
    study.stone.color = colorId;
    renderStudy();
  }
  if (btn.hasAttribute('data-rays')) {
    study.rays = btn.getAttribute('data-rays');
    renderStudy();
  }
  if (btn.getAttribute('data-st') === 'reset') {
    var ang = defaultAngles(study.stone.gem);
    study.crown = ang.crown;
    study.pavilion = ang.pavilion;
    study.entry = 0.35;
    study.tilt = 0;
    study.rays = 'one';
    renderStudy();
  }
});
