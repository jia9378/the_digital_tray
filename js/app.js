// The app: two boards (the tray and the jewellery piece), the stone library,
// the inspector for the selected stone, and saving to localStorage.
// Every position and size is in mm. Each board's SVG viewBox is in mm too.

// ---------- Tray size (mm) ----------
var TRAY_W = 200;
var TRAY_H = 100;
var GROOVE_COUNT = 7;
var GROOVE_PITCH = 11;   // distance between groove centres
var GROOVE_FIRST = 9;    // centre of the first groove
var GROOVE_W = 3.4;      // width of the V at the surface
var FLAT_START = GROOVE_FIRST + (GROOVE_COUNT - 1) * GROOVE_PITCH + GROOVE_PITCH / 2; // flat area below the grooves

var SNAP_DIST = 4;       // mm: how close a stone must be to a template line to snap onto it
var STORE_KEY = 'digital-tray-v2';

// ---------- State ----------
var mode = 'tray';       // 'tray' or 'piece'
var nextId = 1;
var selectedId = null;
var drag = null;

var trayStones = [];     // { id, gem, color, cut, w, h, x, y, rot }
var pieceStones = { ring: [], bracelet: [], necklace: [] };
var piece = {
  type: 'ring',
  ringSize: 7,
  ringBand: 3,
  braceletStyle: 'line',
  beadLen: 160,
  braceletLen: 180,
  braceletBand: 4,
  bangleWidth: 62.5,
  necklaceLen: 45,
  metal: 'yellow',
  compare: false
};
var libPick = { gem: 'sapphire', color: 'royal' };
var layout = null;       // current piece layout from templates.js

// ---------- Page elements ----------
function $(id) { return document.getElementById(id); }

function makeBoard(id) {
  var svg = $(id);
  return {
    svg: svg,
    base: svg.querySelector('.base'),
    layer: svg.querySelector('.stones'),
    overlay: svg.querySelector('.overlay'),
    vb: null
  };
}

var trayBoard = makeBoard('tray');
var pieceBoard = makeBoard('piece');
var inspector = $('inspector');
var library = $('library');
var libraryPicker = $('library-picker');
var pieceBar = $('piece-bar');
var compareGrid = $('compare-grid');
var ghost = $('ghost');


// ---------- Small helpers ----------

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function round1(v) {
  return Math.round(v * 10) / 10;
}

function activeBoard() {
  return mode === 'tray' ? trayBoard : pieceBoard;
}

function activeStones() {
  return mode === 'tray' ? trayStones : pieceStones[piece.type];
}

function findStone(id) {
  var list = activeStones();
  for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
  return null;
}

function removeStone(id) {
  var list = activeStones();
  for (var i = 0; i < list.length; i++) {
    if (list[i].id === id) { list.splice(i, 1); break; }
  }
  if (selectedId === id) selectedId = null;
}

function makeStone(gem, color, cut, x, y) {
  return { id: nextId++, gem: gem, color: color, cut: cut, w: CUTS[cut].w, h: CUTS[cut].h, x: x, y: y, rot: 0 };
}

function stoneRadius(s) {
  return Math.max(s.w, s.h) / 2;
}

// Screen position -> board mm.
function pointerToMM(board, event) {
  var pt = board.svg.createSVGPoint();
  pt.x = event.clientX;
  pt.y = event.clientY;
  var p = pt.matrixTransform(board.svg.getScreenCTM().inverse());
  return { x: p.x, y: p.y };
}

function insideVB(board, p) {
  var vb = board.vb;
  return p.x >= vb.x && p.x <= vb.x + vb.w && p.y >= vb.y && p.y <= vb.y + vb.h;
}

function sizeText(s) {
  return (CUTS[s.cut].lock ? s.w + ' mm' : s.w + ' × ' + s.h + ' mm');
}

function caratText(s) {
  var ct = estimateCarat(s);
  return ct === null ? '' : ' · ≈ ' + ct.toFixed(2) + ' ct';
}

function gemLabel(s) {
  return GEMS[s.gem].name + ' · ' + CUTS[s.cut].short;
}


// ---------- Tray ----------

function grooveY(i) {
  return GROOVE_FIRST + i * GROOVE_PITCH;
}

function drawTray() {
  trayBoard.vb = { x: -6, y: -6, w: TRAY_W + 12, h: TRAY_H + 26 };

  var html =
    '<defs>' +
      '<linearGradient id="groove-grad" x1="0" y1="0" x2="0" y2="1">' +
        stopsMarkup([[0, '#d9d5ca'], [0.2, '#cdc8bb'], [0.48, '#aea898'], [0.5, '#8f8a7d'], [0.53, '#f4f1ea'], [0.85, '#ebe8df'], [1, '#e2ded3']]) +
      '</linearGradient>' +
      '<linearGradient id="tray-grad" x1="0" y1="0" x2="0" y2="1">' +
        stopsMarkup([[0, '#ffffff'], [1, '#f6f4ee']]) +
      '</linearGradient>' +
      '<filter id="tray-shadow" x="-5%" y="-5%" width="110%" height="115%"><feGaussianBlur stdDeviation="1.2"/></filter>' +
    '</defs>';

  // Soft shadow, then the acrylic body.
  html += '<rect x="0.6" y="1.4" width="' + TRAY_W + '" height="' + TRAY_H + '" rx="1.2" fill="#000" fill-opacity="0.16" filter="url(#tray-shadow)"/>';
  html += '<rect class="tray-body" x="0" y="0" width="' + TRAY_W + '" height="' + TRAY_H + '" rx="1.2" fill="url(#tray-grad)"/>';

  // V-grooves run the full length, edge to edge, like a real grooved tray.
  for (var i = 0; i < GROOVE_COUNT; i++) {
    var top = grooveY(i) - GROOVE_W / 2;
    html += '<rect x="0" y="' + top + '" width="' + TRAY_W + '" height="' + GROOVE_W + '" fill="url(#groove-grad)"/>';
    html += '<line class="groove-edge" x1="0" y1="' + top + '" x2="' + TRAY_W + '" y2="' + top + '"/>';
    html += '<line class="groove-edge light" x1="0" y1="' + (top + GROOVE_W) + '" x2="' + TRAY_W + '" y2="' + (top + GROOVE_W) + '"/>';
  }
  // Outline on top, so the grooves look cut through the ends.
  html += '<rect class="tray-outline" x="0" y="0" width="' + TRAY_W + '" height="' + TRAY_H + '" rx="1.2"/>';

  // A millimetre ruler under the tray.
  var y0 = TRAY_H + 6;
  html += '<g class="ruler"><line x1="0" y1="' + y0 + '" x2="' + TRAY_W + '" y2="' + y0 + '"/>';
  for (var mm = 0; mm <= TRAY_W; mm++) {
    var len = mm % 10 === 0 ? 2.6 : (mm % 5 === 0 ? 1.7 : 1);
    html += '<line x1="' + mm + '" y1="' + y0 + '" x2="' + mm + '" y2="' + (y0 + len) + '"/>';
    if (mm % 10 === 0) html += '<text x="' + mm + '" y="' + (y0 + 5.6) + '" text-anchor="middle">' + (mm / 10) + '</text>';
  }
  html += '<text x="' + TRAY_W + '" y="' + (y0 + 10.5) + '" text-anchor="end" class="ruler-unit">cm · tray ' + TRAY_W + ' × ' + TRAY_H + ' mm</text>';
  html += '</g>';

  trayBoard.base.innerHTML = html;
  setViewBox(trayBoard);
}

function setViewBox(board) {
  var vb = board.vb;
  board.svg.setAttribute('viewBox', vb.x + ' ' + vb.y + ' ' + vb.w + ' ' + vb.h);
}

// Keep a stone on the board. If `snap`, drop it into a groove / onto a template line.
function settle(s, snap) {
  var r = stoneRadius(s);
  if (mode === 'tray') {
    s.x = clamp(s.x, r * 0.6, TRAY_W - r * 0.6);
    if (s.y < FLAT_START) {
      if (snap) {
        var i = clamp(Math.round((s.y - GROOVE_FIRST) / GROOVE_PITCH), 0, GROOVE_COUNT - 1);
        s.y = grooveY(i);
      } else {
        s.y = clamp(s.y, 0, TRAY_H);
      }
    } else {
      s.y = clamp(s.y, FLAT_START, TRAY_H - r * 0.6);
    }
  } else {
    var vb = pieceBoard.vb;
    s.x = clamp(s.x, vb.x, vb.x + vb.w);
    s.y = clamp(s.y, vb.y, vb.y + vb.h);
    if (snap) {
      var near = nearestOnGuides(layout.guides, s.x, s.y);
      if (near && near.dist < SNAP_DIST) {
        s.x = near.x;
        s.y = near.y;
        if (isBead(s)) s.rot = guideAngle(near);
      }
    }
  }
  s.x = Math.round(s.x * 100) / 100;
  s.y = Math.round(s.y * 100) / 100;
}

// Rough overlap test, treating each stone as a circle of its average size.
// Drilled beads: their hole runs along their x axis, so they turn to follow the cord.
function isBead(s) {
  return s.cut === 'beadRound' || s.cut === 'beadFaceted';
}

// Direction (degrees) of the template line at a nearestOnGuides() result.
function guideAngle(near) {
  var g = layout.guides[near.guide];
  var a = g[near.seg];
  var b = g[near.seg + 1];
  return Math.round(Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI);
}

function overlaps(x, y, r, except) {
  return activeStones().some(function (o) {
    return o !== except && Math.hypot(o.x - x, o.y - y) < r + (o.w + o.h) / 4 - 0.05;
  });
}

// Where a stone added by clicking goes.
function nextFreeSpot(s) {
  var r = stoneRadius(s);
  if (mode === 'tray') {
    for (var i = 0; i < GROOVE_COUNT; i++) {
      var y = grooveY(i);
      var right = 2;
      trayStones.forEach(function (o) {
        if (Math.abs(o.y - y) < 0.01) right = Math.max(right, o.x + stoneRadius(o));
      });
      if (right + 2 + 2 * r <= TRAY_W - 2) return { x: right + 2 + r, y: y };
    }
    return { x: TRAY_W / 2, y: (FLAT_START + TRAY_H) / 2 };
  }
  // On a piece: the middle of the main line, else the next free place along it.
  r = (s.w + s.h) / 4;
  var guide = layout.guides[0];
  var anchor = guideAnchor();
  if (!overlaps(anchor.x, anchor.y, r)) return anchor;
  var pts = pointsAlongGuide(guide, anchor.x, anchor.y, 0.25);
  pts.sort(function (a, b) {
    return Math.hypot(a[0] - anchor.x, a[1] - anchor.y) - Math.hypot(b[0] - anchor.x, b[1] - anchor.y);
  });
  for (var k = 0; k < pts.length; k++) {
    if (!overlaps(pts[k][0], pts[k][1], r)) return { x: pts[k][0], y: pts[k][1] };
  }
  return anchor;
}

// The "front and centre" point of the piece: top of a ring, middle of a
// bracelet, bottom of a necklace.
function guideAnchor() {
  var g = layout.guides[0];
  if (piece.type === 'necklace') {
    var low = g[0];
    g.forEach(function (p) { if (p[1] > low[1]) low = p; });
    return { x: low[0], y: low[1] };
  }
  if (piece.type === 'bracelet' && piece.braceletStyle !== 'line') {
    var top = g[0];
    g.forEach(function (p) { if (p[1] < top[1]) top = p; });
    return { x: top[0], y: top[1] };
  }
  return { x: (g[0][0] + g[g.length - 1][0]) / 2, y: (g[0][1] + g[g.length - 1][1]) / 2 };
}


// ---------- Drawing stones ----------

function stoneGroup(s) {
  return '<g class="stone" data-id="' + s.id + '" transform="' + stoneTransform(s) + '">' + stoneSVG(s) + '</g>';
}

function stoneTransform(s) {
  return 'translate(' + s.x + ' ' + s.y + ') rotate(' + s.rot + ')';
}

function renderStones() {
  var board = activeBoard();
  board.layer.innerHTML = activeStones().map(stoneGroup).join('');
  renderSelection();
  renderCount();
  if (mode === 'piece' && piece.compare) renderCompare();
}

// The red ring and label around the selected stone.
function renderSelection() {
  var board = activeBoard();
  var s = findStone(selectedId);
  if (!s) {
    board.overlay.innerHTML = '';
    return;
  }
  var r = stoneRadius(s) + 0.9;
  board.overlay.innerHTML =
    '<circle class="select-ring" cx="' + s.x + '" cy="' + s.y + '" r="' + r + '"/>' +
    '<line class="select-lead" x1="' + (s.x + r * 0.7) + '" y1="' + (s.y - r * 0.7) + '" x2="' + (s.x + r + 3) + '" y2="' + (s.y - r - 3) + '"/>' +
    '<text class="select-label" x="' + (s.x + r + 3.6) + '" y="' + (s.y - r - 3.4) + '">' + gemLabel(s).toUpperCase() + '</text>' +
    '<text class="select-label sub" x="' + (s.x + r + 3.6) + '" y="' + (s.y - r - 0.6) + '">' + sizeText(s) + '</text>';
}

function renderCount() {
  var list = activeStones();
  var total = 0;
  var any = false;
  list.forEach(function (s) {
    var ct = estimateCarat(s);
    if (ct !== null) { total += ct; any = true; }
  });
  var where = mode === 'tray' ? 'on tray' : 'on ' + piece.type;
  $('count').textContent = list.length + (list.length === 1 ? ' stone ' : ' stones ') + where +
    (any ? ' · ≈ ' + total.toFixed(2) + ' ct total (estimate)' : '');
}


// ---------- Gem / colour pickers (used by the library and the inspector) ----------

function gemSelectHTML(id, gemId) {
  var html = '<select id="' + id + '" class="gem-select">';
  GEM_GROUPS.forEach(function (g) {
    html += '<optgroup label="' + g.name + '">';
    g.gems.forEach(function (key) {
      html += '<option value="' + key + '"' + (key === gemId ? ' selected' : '') + '>' + GEMS[key].name + '</option>';
    });
    html += '</optgroup>';
  });
  return html + '</select>';
}

function swatchesHTML(gemId, colorId, attr) {
  return '<div class="swatches">' + GEMS[gemId].colors.map(function (c) {
    return '<button type="button" class="swatch' + (c.id === colorId ? ' active' : '') + '" ' + attr + '="' + c.id + '" title="' + c.name + '" style="background:' + swatchCSS(c) + '"></button>';
  }).join('') + '</div>';
}


// ---------- Library ----------

function renderLibrary() {
  var color = findColor(libPick.gem, libPick.color);
  libraryPicker.innerHTML =
    '<label class="pick-row"><span class="pick-label">1 · STONE</span>' + gemSelectHTML('lib-gem', libPick.gem) + '</label>' +
    '<div class="pick-row"><span class="pick-label">2 · COLOUR</span>' + swatchesHTML(libPick.gem, color.id, 'data-lib-color') +
      '<span class="pick-name">' + color.name + '</span></div>';

  // All thumbnails share one 14 mm viewBox, so they show their true relative size.
  library.innerHTML = GEMS[libPick.gem].cuts.map(function (cut) {
    var c = CUTS[cut];
    var s = { gem: libPick.gem, color: color.id, cut: cut, w: c.w, h: c.h };
    return '<button class="lib-item" data-cut="' + cut + '" title="' + c.name + '">' +
      '<svg viewBox="-7 -7 14 14" class="lib-svg"><g class="shadowed">' + stoneSVG(s) + '</g></svg>' +
      '<span>' + c.short + '</span>' +
      '<span class="lib-size">' + (c.lock ? c.w + ' mm' : c.w + '×' + c.h) + '</span>' +
      '</button>';
  }).join('');
}

libraryPicker.addEventListener('change', function (e) {
  if (e.target.id !== 'lib-gem') return;
  libPick.gem = e.target.value;
  libPick.color = GEMS[libPick.gem].colors[0].id;
  renderLibrary();
  save();
});

libraryPicker.addEventListener('click', function (e) {
  var id = e.target.getAttribute('data-lib-color');
  if (!id) return;
  libPick.color = id;
  renderLibrary();
  save();
});


// ---------- Inspector ----------

function renderInspector() {
  var s = findStone(selectedId);

  if (!s) {
    inspector.innerHTML =
      '<p class="insp-title">' + (mode === 'tray' ? 'TRAY' : piece.type.toUpperCase()) + '</p>' +
      '<p class="hint">Pick a stone and colour in the library below, then drag a shape ' +
      (mode === 'tray' ? 'into a groove. The flat strip at the bottom holds stones anywhere.' : 'onto the piece. Stones snap onto the metal line.') + '</p>' +
      '<p class="hint">Click a stone to select it: change its stone, colour, cut and size, or rotate, duplicate and delete it.</p>' +
      '<p class="hint keys">R rotate · ⇧R back<br>D duplicate · Delete remove<br>Arrows nudge 0.5 mm (⇧ 0.1)<br>Esc deselect</p>';
    return;
  }

  var cut = CUTS[s.cut];
  var color = findColor(s.gem, s.color);
  var cutOptions = GEMS[s.gem].cuts.map(function (k) {
    return '<option value="' + k + '"' + (k === s.cut ? ' selected' : '') + '>' + CUTS[k].name + '</option>';
  }).join('');
  var preview = Math.max(s.w, s.h) / 2 + 0.6;

  inspector.innerHTML =
    '<p class="insp-title">' + gemLabel(s).toUpperCase() + '</p>' +
    '<p class="insp-sub" id="insp-sub">' + sizeText(s) + ' · ' + s.rot + '°' + caratText(s) + '</p>' +
    '<div class="insp-preview"><svg id="insp-preview" viewBox="' + (-preview) + ' ' + (-preview) + ' ' + (2 * preview) + ' ' + (2 * preview) + '">' +
      '<g transform="rotate(' + s.rot + ')">' + stoneSVG(s) + '</g></svg><span>enlarged</span></div>' +

    '<label class="field"><span>STONE</span>' + gemSelectHTML('in-gem', s.gem) + '</label>' +
    '<div class="field"><span>COLOUR · <em>' + color.name + '</em></span>' + swatchesHTML(s.gem, color.id, 'data-color') + '</div>' +
    '<label class="field"><span>CUT</span><select id="in-cut">' + cutOptions + '</select></label>' +

    '<div class="size-rows">' +
      '<label class="size-row"><span>' + (cut.lock ? 'DIAM.' : 'WIDTH') + '</span>' +
        '<input type="number" id="in-w" min="0.5" max="40" step="0.1" value="' + s.w + '"> mm</label>' +
      (cut.lock ? '' :
      '<label class="size-row"><span>LENGTH</span>' +
        '<input type="number" id="in-h" min="0.5" max="40" step="0.1" value="' + s.h + '"> mm</label>') +
    '</div>' +

    '<div class="actions">' +
      '<button data-action="duplicate">DUPLICATE</button>' +
      '<button data-action="rotate">ROTATE 15°</button>' +
      (mode === 'piece' ? '<button data-action="fill" class="wide" title="Copies this stone all along the metal line">FILL ALONG LINE</button>' : '') +
      '<button data-action="delete">DELETE</button>' +
      '<button data-action="deselect">DONE</button>' +
    '</div>';
}

// Update the parts of the inspector that change while typing, without
// rebuilding it (so the input keeps focus).
function refreshInspectorBits() {
  var s = findStone(selectedId);
  if (!s) return;
  var sub = $('insp-sub');
  if (sub) sub.textContent = sizeText(s) + ' · ' + s.rot + '°' + caratText(s);
  var pv = $('insp-preview');
  if (pv) {
    var p = Math.max(s.w, s.h) / 2 + 0.6;
    pv.setAttribute('viewBox', (-p) + ' ' + (-p) + ' ' + (2 * p) + ' ' + (2 * p));
    pv.innerHTML = '<g transform="rotate(' + s.rot + ')">' + stoneSVG(s) + '</g>';
  }
}

function updateStoneEl(s) {
  var el = activeBoard().layer.querySelector('.stone[data-id="' + s.id + '"]');
  if (el) el.outerHTML = stoneGroup(s);
  renderSelection();
  renderCount();
  if (mode === 'piece' && piece.compare) renderCompare();
}

inspector.addEventListener('click', function (e) {
  var s = findStone(selectedId);
  var colorId = e.target.getAttribute('data-color');
  if (s && colorId) {
    s.color = colorId;
    updateStoneEl(s);
    renderInspector();
    save();
    return;
  }
  var action = e.target.getAttribute('data-action');
  if (action === 'duplicate') duplicateSelected();
  if (action === 'rotate') rotateSelected(15);
  if (action === 'fill') fillAlongLine();
  if (action === 'delete') deleteSelected();
  if (action === 'deselect') select(null);
});

inspector.addEventListener('change', function (e) {
  var s = findStone(selectedId);
  if (!s) return;
  if (e.target.id === 'in-gem') {
    s.gem = e.target.value;
    s.color = GEMS[s.gem].colors[0].id;
    if (GEMS[s.gem].cuts.indexOf(s.cut) < 0) changeCut(s, GEMS[s.gem].cuts[0]);
  }
  if (e.target.id === 'in-cut') changeCut(s, e.target.value);
  if (e.target.id === 'in-gem' || e.target.id === 'in-cut') {
    updateStoneEl(s);
    renderInspector();
    save();
  }
});

inspector.addEventListener('input', function (e) {
  var s = findStone(selectedId);
  var v = parseFloat(e.target.value);
  if (!s || !(v > 0)) return;
  if (e.target.id === 'in-w') {
    s.w = v;
    if (CUTS[s.cut].lock) s.h = v;
  } else if (e.target.id === 'in-h') {
    s.h = v;
  } else {
    return;
  }
  updateStoneEl(s);
  refreshInspectorBits();
  save();
});

// Switch cut, keeping the stone about the same size.
function changeCut(s, cutId) {
  var oldCut = CUTS[s.cut];
  var newCut = CUTS[cutId];
  var factor = s.w / oldCut.w;
  s.cut = cutId;
  s.w = round1(newCut.w * factor);
  s.h = newCut.lock ? s.w : round1(newCut.h * factor);
}


// ---------- Actions on the selected stone ----------

function select(id) {
  selectedId = id;
  renderSelection();
  renderInspector();
}

function duplicateSelected() {
  var s = findStone(selectedId);
  if (!s) return;
  var copy = makeStone(s.gem, s.color, s.cut, s.x + 2 * stoneRadius(s) + 1, s.y);
  copy.w = s.w;
  copy.h = s.h;
  copy.rot = s.rot;
  settle(copy, true);
  activeStones().push(copy);
  selectedId = copy.id;
  renderStones();
  renderInspector();
  save();
}

function rotateSelected(deg) {
  var s = findStone(selectedId);
  if (!s) return;
  s.rot = ((s.rot + deg) % 360 + 360) % 360;
  updateStoneEl(s);
  refreshInspectorBits();
  save();
}

function deleteSelected() {
  if (selectedId === null) return;
  removeStone(selectedId);
  renderStones();
  renderInspector();
  save();
}

function nudgeSelected(dx, dy) {
  var s = findStone(selectedId);
  if (!s) return;
  if (mode === 'tray' && dy !== 0 && s.y < FLAT_START) {
    // Up/down on the tray jumps between grooves.
    s.y += dy > 0 ? GROOVE_PITCH : -GROOVE_PITCH;
    settle(s, true);
  } else {
    s.x += dx;
    s.y += dy;
    settle(s, false);
  }
  updateStoneEl(s);
  save();
}

// Copy the selected stone all along the template line it sits on.
function fillAlongLine() {
  var s = findStone(selectedId);
  if (!s || mode !== 'piece') return;
  var near = nearestOnGuides(layout.guides, s.x, s.y);
  if (!near || near.dist > SNAP_DIST) {
    alert('Move the stone onto the metal line first.');
    return;
  }
  s.x = near.x;
  s.y = near.y;
  var bead = isBead(s);
  if (bead) s.rot = guideAngle(near);
  // Stones side by side, 0.3 mm apart; beads touch, like on a real strand.
  // A rotated stone takes up more or less room along the line.
  var t = s.rot * Math.PI / 180;
  var along = bead ? s.w : Math.abs(s.w * Math.cos(t)) + Math.abs(s.h * Math.sin(t));
  var spacing = along + (bead ? 0 : 0.3);
  var pts = pointsAlongGuide(layout.guides[near.guide], s.x, s.y, spacing);
  var added = 0;
  pts.forEach(function (p) {
    if (added >= 400 || overlaps(p[0], p[1], along / 2 - 0.1)) return;
    var copy = makeStone(s.gem, s.color, s.cut, Math.round(p[0] * 100) / 100, Math.round(p[1] * 100) / 100);
    copy.w = s.w;
    copy.h = s.h;
    copy.rot = bead ? guideAngle(nearestOnGuides(layout.guides, p[0], p[1])) : s.rot;
    activeStones().push(copy);
    added++;
  });
  renderStones();
  save();
}


// ---------- Dragging ----------

function startDragOnBoard(board, e) {
  var g = e.target.closest('.stone');
  if (!g) {
    select(null);
    return;
  }
  e.preventDefault();
  var s = findStone(Number(g.getAttribute('data-id')));
  if (!s) return;
  var p = pointerToMM(board, e);
  drag = { stone: s, el: g, board: board, offX: s.x - p.x, offY: s.y - p.y, startX: e.clientX, startY: e.clientY };
  document.body.classList.add('dragging');
  if (selectedId !== s.id) select(s.id);
}

trayBoard.svg.addEventListener('pointerdown', function (e) { startDragOnBoard(trayBoard, e); });
pieceBoard.svg.addEventListener('pointerdown', function (e) { startDragOnBoard(pieceBoard, e); });

// Dragging a new stone out of the library shows a "ghost" at true size.
library.addEventListener('pointerdown', function (e) {
  var item = e.target.closest('.lib-item');
  if (!item) return;
  e.preventDefault();
  var cut = item.getAttribute('data-cut');
  var s = makeStone(libPick.gem, libPick.color, cut, 0, 0);
  nextId--; // only keep the id if the stone is actually added
  drag = { fromLibrary: true, stone: s, startX: e.clientX, startY: e.clientY, moved: false };

  var board = activeBoard();
  var ppm = board.svg.getScreenCTM().a; // screen px per mm on the board
  var r = stoneRadius(s) + 0.5;
  ghost.innerHTML = '<svg viewBox="' + (-r) + ' ' + (-r) + ' ' + (2 * r) + ' ' + (2 * r) + '" width="' + (2 * r * ppm) + '" height="' + (2 * r * ppm) + '">' + stoneSVG(s) + '</svg>';
  moveGhost(e);
  document.body.classList.add('dragging');
});

function moveGhost(e) {
  ghost.style.transform = 'translate(' + e.clientX + 'px, ' + e.clientY + 'px) translate(-50%, -50%)';
}

window.addEventListener('pointermove', function (e) {
  if (!drag) return;
  if (drag.fromLibrary) {
    if (Math.abs(e.clientX - drag.startX) + Math.abs(e.clientY - drag.startY) > 4) {
      drag.moved = true;
      ghost.classList.add('show');
    }
    moveGhost(e);
    return;
  }
  var p = pointerToMM(drag.board, e);
  drag.stone.x = p.x + drag.offX;
  drag.stone.y = p.y + drag.offY;
  drag.el.setAttribute('transform', stoneTransform(drag.stone));
  renderSelection();
});

window.addEventListener('pointerup', function (e) {
  if (!drag) return;
  var d = drag;
  drag = null;
  document.body.classList.remove('dragging');
  ghost.classList.remove('show');
  ghost.innerHTML = '';

  if (d.fromLibrary) {
    var board = activeBoard();
    var s = d.stone;
    s.id = nextId++;
    if (!d.moved) {
      // A click on a library stone: put it in the next free spot.
      var spot = nextFreeSpot(s);
      s.x = spot.x;
      s.y = spot.y;
    } else {
      var p = pointerToMM(board, e);
      var hit = document.elementFromPoint(e.clientX, e.clientY);
      if (!insideVB(board, p) || !hit || !board.svg.contains(hit)) return; // dropped off the board
      s.x = p.x;
      s.y = p.y;
    }
    settle(s, true);
    activeStones().push(s);
    selectedId = s.id;
    renderStones();
    renderInspector();
    save();
    return;
  }

  settle(d.stone, true);
  d.el.setAttribute('transform', stoneTransform(d.stone));
  renderSelection();
  refreshInspectorBits();
  if (mode === 'piece' && piece.compare) renderCompare();
  save();
});


// ---------- Piece (jewellery template) ----------

function option(value, label, current) {
  return '<option value="' + value + '"' + (String(value) === String(current) ? ' selected' : '') + '>' + label + '</option>';
}

function renderPieceBar() {
  var types = ['ring', 'bracelet', 'necklace'].map(function (t) {
    return '<button class="seg' + (piece.type === t ? ' active' : '') + '" data-type="' + t + '">' + t.toUpperCase() + '</button>';
  }).join('');

  var opts = '';
  if (piece.type === 'ring') {
    opts += '<label>SIZE <select data-opt="ringSize">' + RING_SIZES.map(function (n) {
      return option(n, 'US ' + n + ' · Ø ' + ringDiameter(n).toFixed(1) + ' mm', piece.ringSize);
    }).join('') + '</select></label>';
    opts += '<label>BAND <select data-opt="ringBand">' + [1.5, 2, 2.5, 3, 4, 5, 6, 8].map(function (n) {
      return option(n, n + ' mm', piece.ringBand);
    }).join('') + '</select></label>';
  }
  if (piece.type === 'bracelet') {
    opts += '<label>STYLE <select data-opt="braceletStyle">' + option('line', 'Line, laid flat', piece.braceletStyle) +
      option('beads', 'Bead bracelet 手串', piece.braceletStyle) + option('bangle', 'Bangle', piece.braceletStyle) + '</select></label>';
    if (piece.braceletStyle === 'beads') {
      opts += '<label>LENGTH <select data-opt="beadLen">' + [140, 150, 160, 170, 180, 190, 200].map(function (n) {
        return option(n, (n / 10) + ' cm', piece.beadLen);
      }).join('') + '</select></label>';
    } else if (piece.braceletStyle === 'line') {
      opts += '<label>LENGTH <select data-opt="braceletLen">' + [150, 160, 170, 180, 190, 200].map(function (n) {
        return option(n, (n / 10) + ' cm', piece.braceletLen);
      }).join('') + '</select></label>';
    } else {
      opts += '<label>INSIDE <select data-opt="bangleWidth">' + [55, 57.5, 60, 62.5, 65, 67.5, 70].map(function (n) {
        return option(n, n + ' mm', piece.bangleWidth);
      }).join('') + '</select></label>';
    }
    if (piece.braceletStyle !== 'beads') {
      opts += '<label>WIDTH <select data-opt="braceletBand">' + [2, 3, 4, 5, 6, 8, 10].map(function (n) {
        return option(n, n + ' mm', piece.braceletBand);
      }).join('') + '</select></label>';
    }
  }
  if (piece.type === 'necklace') {
    opts += '<label>LENGTH <select data-opt="necklaceLen">' + [40, 42, 45, 50, 55, 60].map(function (n) {
      return option(n, n + ' cm', piece.necklaceLen);
    }).join('') + '</select></label>';
  }

  var metals = METALS.map(function (m) {
    return '<button class="metal-chip' + (piece.metal === m.id ? ' active' : '') + '" data-metal="' + m.id + '" title="' + m.name + '">' +
      '<i style="background:linear-gradient(135deg,' + m.dark + ',' + m.light + ' 45%,' + m.base + ' 70%,' + m.dark + ')"></i>' + m.name + '</button>';
  }).join('');

  pieceBar.innerHTML =
    '<div class="pb-row"><span class="pb-label">TEMPLATE</span><div class="segs">' + types + '</div><div class="pb-opts">' + opts + '</div></div>' +
    '<div class="pb-row"><span class="pb-label">METAL</span><div class="metals">' + metals + '</div>' +
      '<button class="seg compare-btn' + (piece.compare ? ' active' : '') + '" data-compare="1">' + (piece.compare ? 'BACK TO TRUE SIZE' : 'COMPARE ALL METALS') + '</button></div>';
}

function drawPiece() {
  layout = pieceLayout(piece);
  pieceBoard.vb = layout.vb;
  pieceBoard.base.innerHTML = layout.draw(findMetal(piece.metal));
  setViewBox(pieceBoard);
  applyScale();
}

// Side-by-side copies of the piece in every metal (scaled to fit).
function renderCompare() {
  var stones = activeStones().map(stoneGroup).join('');
  var vb = compareViewBox();
  compareGrid.innerHTML =
    '<p class="compare-note">Scaled to fit, not true size. Click a metal to use it.</p>' +
    '<div class="compare-cells">' + METALS.map(function (m) {
      return '<button class="cmp-cell' + (m.id === piece.metal ? ' active' : '') + '" data-metal="' + m.id + '">' +
        '<svg viewBox="' + vb.x + ' ' + vb.y + ' ' + vb.w + ' ' + vb.h + '">' + layout.draw(m) + '<g class="shadowed">' + stones + '</g></svg>' +
        '<span>' + m.name.toUpperCase() + '</span></button>';
    }).join('') + '</div>';
}

// Crop the comparison to the metal line and the stones, so they're big enough to judge.
function compareViewBox() {
  var minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
  function add(x, y, r) {
    minX = Math.min(minX, x - r); maxX = Math.max(maxX, x + r);
    minY = Math.min(minY, y - r); maxY = Math.max(maxY, y + r);
  }
  layout.guides.forEach(function (g) { g.forEach(function (p) { add(p[0], p[1], 0); }); });
  activeStones().forEach(function (st) { add(st.x, st.y, stoneRadius(st)); });
  var pad = Math.max(5, (maxX - minX) * 0.12);
  var box = { x: minX - pad, y: minY - pad, w: maxX - minX + 2 * pad, h: maxY - minY + 2 * pad };
  // Not too thin: keep at least a 2:1 shape.
  if (box.h < box.w / 2) {
    box.y -= (box.w / 2 - box.h) / 2;
    box.h = box.w / 2;
  }
  return box;
}

function showCompare() {
  $('piece-scroll').hidden = piece.compare;
  compareGrid.hidden = !piece.compare;
  if (piece.compare) renderCompare();
}

pieceBar.addEventListener('click', function (e) {
  var btn = e.target.closest('button');
  if (!btn) return;
  if (btn.hasAttribute('data-type')) {
    piece.type = btn.getAttribute('data-type');
    selectedId = null;
    refreshPiece();
  } else if (btn.hasAttribute('data-metal')) {
    piece.metal = btn.getAttribute('data-metal');
    refreshPiece();
  } else if (btn.hasAttribute('data-compare')) {
    piece.compare = !piece.compare;
    refreshPiece();
  }
});

pieceBar.addEventListener('change', function (e) {
  var key = e.target.getAttribute('data-opt');
  if (!key) return;
  var v = e.target.value;
  piece[key] = isNaN(parseFloat(v)) ? v : parseFloat(v);
  refreshPiece();
});

compareGrid.addEventListener('click', function (e) {
  var cell = e.target.closest('.cmp-cell');
  if (!cell) return;
  piece.metal = cell.getAttribute('data-metal');
  piece.compare = false;
  refreshPiece();
});

function refreshPiece() {
  renderPieceBar();
  drawPiece();
  renderStones();
  renderInspector();
  showCompare();
  save();
}


// ---------- Modes ----------

function setMode(m) {
  if (mode === 'tryon' && m !== 'tryon') leaveTryOn();
  mode = m;
  selectedId = null;
  document.body.classList.toggle('mode-tryon', m === 'tryon');
  document.querySelectorAll('.mode[data-mode]').forEach(function (b) {
    b.classList.toggle('active', b.getAttribute('data-mode') === m);
  });
  $('tray-view').hidden = m !== 'tray';
  $('piece-view').hidden = m !== 'piece';
  $('tryon-view').hidden = m !== 'tryon';
  if (m === 'tryon') renderTryOn();
  if (m === 'piece') {
    renderPieceBar();
    drawPiece();
    showCompare();
  }
  renderStones();
  renderInspector();
  save();
}

$('modes').addEventListener('click', function (e) {
  var b = e.target.closest('.mode[data-mode]');
  if (b) setMode(b.getAttribute('data-mode'));
});


// ---------- True scale ----------

function applyScale() {
  var ppm = currentPxPerMM();
  [trayBoard, pieceBoard].forEach(function (b) {
    if (!b.vb) return;
    if (ppm) {
      b.svg.style.width = (b.vb.w * ppm) + 'px';
      b.svg.style.height = (b.vb.h * ppm) + 'px';
      b.svg.classList.add('true-size');
    } else {
      b.svg.style.width = '';
      b.svg.style.height = '';
      b.svg.classList.remove('true-size');
    }
  });
  var chip = $('scale-chip');
  chip.textContent = scaleLabel();
  chip.classList.toggle('is-true', !!ppm);

  var warn = $('scale-warning');
  if (screenMismatch()) {
    warn.hidden = false;
    warn.innerHTML = 'This window seems to be on a different screen than the one you picked, so sizes may be off. <button class="link-button" id="warn-fix">SET UP SCREEN</button>';
  } else {
    warn.hidden = true;
  }
}

onScaleChange = function () {
  applyScale();
  save();
};

$('scale-chip').addEventListener('click', openScaleDialog);
$('scale-warning').addEventListener('click', function (e) {
  if (e.target.id === 'warn-fix') openScaleDialog();
});
window.addEventListener('resize', applyScale);

// Full screen gives the tray the most room. It doesn't change the scale.
$('fs-btn').addEventListener('click', function () {
  var el = document.documentElement;
  var isFull = document.fullscreenElement || document.webkitFullscreenElement;
  if (isFull) {
    (document.exitFullscreen || document.webkitExitFullscreen).call(document);
  } else {
    var req = el.requestFullscreen || el.webkitRequestFullscreen;
    if (req) req.call(el);
  }
});

function onFullscreenChange() {
  var isFull = document.fullscreenElement || document.webkitFullscreenElement;
  $('fs-btn').textContent = isFull ? 'EXIT FULL SCREEN' : 'FULL SCREEN';
}
document.addEventListener('fullscreenchange', onFullscreenChange);
document.addEventListener('webkitfullscreenchange', onFullscreenChange);


// ---------- Keys, clear ----------

document.addEventListener('keydown', function (e) {
  var tag = e.target.tagName;
  if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if ($('scale-dialog').open) return;
  var step = e.shiftKey ? 0.1 : 0.5;
  var k = e.key;
  if (k === 'Delete' || k === 'Backspace') { deleteSelected(); e.preventDefault(); }
  else if (k === 'r' || k === 'R') rotateSelected(e.shiftKey ? -15 : 15);
  else if (k === 'd' || k === 'D') duplicateSelected();
  else if (k === 'Escape') select(null);
  else if (k === 'ArrowLeft' && selectedId !== null) { nudgeSelected(-step, 0); e.preventDefault(); }
  else if (k === 'ArrowRight' && selectedId !== null) { nudgeSelected(step, 0); e.preventDefault(); }
  else if (k === 'ArrowUp' && selectedId !== null) { nudgeSelected(0, -step); e.preventDefault(); }
  else if (k === 'ArrowDown' && selectedId !== null) { nudgeSelected(0, step); e.preventDefault(); }
});

$('clear-btn').addEventListener('click', function () {
  var list = activeStones();
  if (list.length > 3 && !confirm('Remove all ' + list.length + ' stones from the ' + (mode === 'tray' ? 'tray' : piece.type) + '?')) return;
  list.length = 0;
  selectedId = null;
  renderStones();
  renderInspector();
  save();
});


// ---------- Saving ----------

function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      nextId: nextId, mode: mode, trayStones: trayStones, pieceStones: pieceStones,
      piece: piece, libPick: libPick, scale: scale,
      tryon: { part: tryon.part, side: tryon.side, stud: tryon.stud }  // the photo itself isn't saved
    }));
  } catch (err) { /* private mode etc.: the app still works, it just won't remember */ }
}

// Drop anything that refers to a gem, colour or cut that no longer exists.
function validStone(s) {
  return s && GEMS[s.gem] && CUTS[s.cut] && s.w > 0 && s.h > 0 && isFinite(s.x) && isFinite(s.y);
}

function load() {
  var data = null;
  try { data = JSON.parse(localStorage.getItem(STORE_KEY)); } catch (err) { data = null; }
  if (!data) return false;
  trayStones = (data.trayStones || []).filter(validStone);
  ['ring', 'bracelet', 'necklace'].forEach(function (t) {
    pieceStones[t] = ((data.pieceStones || {})[t] || []).filter(validStone);
  });
  if (data.piece) Object.keys(piece).forEach(function (k) { if (data.piece[k] !== undefined) piece[k] = data.piece[k]; });
  if (data.libPick && GEMS[data.libPick.gem]) libPick = data.libPick;
  if (data.scale) Object.keys(scale).forEach(function (k) { if (data.scale[k] !== undefined) scale[k] = data.scale[k]; });
  nextId = data.nextId || 1;
  trayStones.concat(pieceStones.ring, pieceStones.bracelet, pieceStones.necklace).forEach(function (s) {
    nextId = Math.max(nextId, s.id + 1);
  });
  if (data.mode === 'piece' || data.mode === 'tryon') mode = data.mode;
  if (data.tryon) {
    if (data.tryon.part) tryon.part = data.tryon.part;
    if (data.tryon.side) tryon.side = data.tryon.side;
    if (data.tryon.stud && CUTS[data.tryon.stud.cut]) tryon.stud = data.tryon.stud;
  }
  return scale.asked;
}


// ---------- Start ----------
addDef('stone-shadow-filter',
  '<filter id="stone-shadow" x="-30%" y="-30%" width="160%" height="160%">' +
  '<feDropShadow dx="0.18" dy="0.3" stdDeviation="0.22" flood-color="#000" flood-opacity="0.28"/></filter>');

var scaleWasSetUp = load();
drawTray();
renderLibrary();
setMode(mode);
applyScale();
// First visit: ask which screen this is, so stones can show at real size.
if (!scaleWasSetUp) openScaleDialog();
