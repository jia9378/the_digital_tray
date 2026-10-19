// The tray: place, drag, rotate, duplicate, resize and delete stones.
// Every stone is stored in millimetres. The SVG viewBox is also in mm,
// so 1 unit on screen = 1 mm, and the browser handles the px/mm scaling.

// ---------- Tray size (mm) ----------
var TRAY_W = 200;
var TRAY_H = 100;
var GROOVE_COUNT = 6;
var GROOVE_PITCH = 16;  // distance between groove centres
var GROOVE_WIDTH = 12;
var GROOVE_START = 10;  // centre of the first groove

// ---------- State ----------
var stones = [];        // { id, gem, cut, w, h, x, y, rot }
var selectedId = null;
var nextId = 1;
var drag = null;        // the drag in progress, if any
var currentFilter = 'all';

// ---------- Page elements ----------
var svg = document.getElementById('tray');
var trayBase = document.getElementById('tray-base');
var stoneLayer = document.getElementById('stone-layer');
var inspector = document.getElementById('inspector');
var library = document.getElementById('library');
var filters = document.getElementById('filters');
var countLabel = document.getElementById('count');
var clearBtn = document.getElementById('clear-btn');


// ---------- Helpers ----------

function grooveY(i) {
  return GROOVE_START + i * GROOVE_PITCH;
}

// Snap a y position to the centre of the nearest groove.
function snapToGroove(y) {
  var i = Math.round((y - GROOVE_START) / GROOVE_PITCH);
  i = Math.max(0, Math.min(GROOVE_COUNT - 1, i));
  return grooveY(i);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// Convert a mouse/touch position into tray millimetres.
function pointerToMM(event) {
  var pt = svg.createSVGPoint();
  pt.x = event.clientX;
  pt.y = event.clientY;
  var p = pt.matrixTransform(svg.getScreenCTM().inverse());
  return { x: p.x, y: p.y };
}

function isOnTray(p) {
  return p.x >= 0 && p.x <= TRAY_W && p.y >= 0 && p.y <= TRAY_H;
}

function findStone(id) {
  for (var i = 0; i < stones.length; i++) {
    if (stones[i].id === id) return stones[i];
  }
  return null;
}

function removeStone(id) {
  stones = stones.filter(function (s) { return s.id !== id; });
  if (selectedId === id) selectedId = null;
}

function makeStone(gem, cut, x, y) {
  return {
    id: nextId++,
    gem: gem,
    cut: cut,
    w: CUTS[cut].w,
    h: CUTS[cut].h,
    x: x,
    y: y,
    rot: 0
  };
}

// Keep a stone inside the tray and sitting in a groove.
function settle(stone) {
  var r = Math.max(stone.w, stone.h) / 2;
  stone.x = clamp(Math.round(stone.x * 10) / 10, r, TRAY_W - r); // 0.1 mm steps
  stone.y = snapToGroove(stone.y);
}

// Find a spot for a stone added by clicking (not dragging).
function nextFreeSpot() {
  var n = stones.length;
  var perRow = 14;
  var row = Math.floor(n / perRow) % GROOVE_COUNT;
  var col = n % perRow;
  return { x: 10 + col * 13, y: grooveY(row) };
}

function sizeText(stone) {
  return stone.w + ' × ' + stone.h + ' mm';
}


// ---------- Drawing ----------

// Draw the tray body, the grooves and a mm ruler. Done once.
function drawTray() {
  var html = '<rect class="tray-body" x="0" y="0" width="' + TRAY_W + '" height="' + TRAY_H + '" rx="1"/>';

  for (var i = 0; i < GROOVE_COUNT; i++) {
    var top = grooveY(i) - GROOVE_WIDTH / 2;
    html += '<rect class="groove" x="3" y="' + top + '" width="' + (TRAY_W - 6) + '" height="' + GROOVE_WIDTH + '" rx="1"/>';
    html += '<line class="groove-shadow" x1="3.5" y1="' + (top + 0.6) + '" x2="' + (TRAY_W - 3.5) + '" y2="' + (top + 0.6) + '"/>';
  }

  // Ruler under the tray: small tick every 5 mm, big tick every 10 mm.
  html += '<g class="ruler">';
  html += '<line x1="0" y1="106" x2="' + TRAY_W + '" y2="106"/>';
  for (var mm = 0; mm <= TRAY_W; mm += 5) {
    var len = (mm % 10 === 0) ? 2.5 : 1.2;
    html += '<line x1="' + mm + '" y1="106" x2="' + mm + '" y2="' + (106 - len) + '"/>';
  }
  html += '<text x="' + (TRAY_W / 2) + '" y="112" text-anchor="middle">' + TRAY_W + ' mm</text>';
  html += '</g>';

  trayBase.innerHTML = html;
}

// Draw all stones. Called after every change.
function renderStones() {
  var html = '';

  stones.forEach(function (s) {
    var selected = s.id === selectedId;
    html += '<g class="stone" data-id="' + s.id + '" transform="translate(' + s.x + ' ' + s.y + ') rotate(' + s.rot + ')">';
    html += stoneShape(s.cut, s.w, s.h, GEMS[s.gem].color);
    if (selected) {
      html += '<circle class="select-ring" r="' + (Math.max(s.w, s.h) / 2 + 1.5) + '"/>';
    }
    html += '</g>';
  });

  stoneLayer.innerHTML = html;
  countLabel.textContent = stones.length + (stones.length === 1 ? ' stone' : ' stones') + ' on tray';
}

// The panel on the right that edits the selected stone.
function renderInspector() {
  var s = findStone(selectedId);

  if (!s) {
    inspector.innerHTML =
      '<p class="hint">Drag a stone from the library into a groove.</p>' +
      '<p class="hint">Click a stone on the tray to select it, then rotate, duplicate, resize or delete it.</p>' +
      '<p class="hint">Keys: R = rotate, Delete = remove.</p>';
    return;
  }

  var isRound = s.cut === 'round';
  inspector.innerHTML =
    '<p class="insp-title">' + GEMS[s.gem].name.toUpperCase() + ' · ' + CUTS[s.cut].name.toUpperCase() + '</p>' +
    '<p class="insp-sub" id="insp-sub">' + sizeText(s) + ' · ' + s.rot + '°</p>' +
    '<label class="size-row"><span>' + (isRound ? 'DIAM.' : 'WIDTH') + '</span>' +
      '<input type="number" id="in-w" min="1" max="30" step="0.5" value="' + s.w + '"> mm</label>' +
    (isRound ? '' :
    '<label class="size-row"><span>HEIGHT</span>' +
      '<input type="number" id="in-h" min="1" max="30" step="0.5" value="' + s.h + '"> mm</label>') +
    '<div class="actions">' +
      '<button data-action="duplicate">DUPLICATE</button>' +
      '<button data-action="rotate">ROTATE 15°</button>' +
      '<button data-action="delete">DELETE</button>' +
      '<button data-action="deselect">DONE</button>' +
    '</div>';
}

// Update only the size/rotation line, so typing in an input keeps focus.
function updateInspectorText() {
  var s = findStone(selectedId);
  var sub = document.getElementById('insp-sub');
  if (s && sub) sub.textContent = sizeText(s) + ' · ' + s.rot + '°';
}

// Thumbnails in the stone library, filtered by gem.
function renderLibrary() {
  var html = '';

  Object.keys(GEMS).forEach(function (gem) {
    if (currentFilter !== 'all' && currentFilter !== gem) return;

    Object.keys(CUTS).forEach(function (cut) {
      var c = CUTS[cut];
      html += '<button class="lib-item" data-gem="' + gem + '" data-cut="' + cut + '">' +
        // Same viewBox for all thumbnails, so they show their true relative size.
        '<svg viewBox="-5 -5 10 10">' + stoneShape(cut, c.w, c.h, GEMS[gem].color) + '</svg>' +
        '<span>' + GEMS[gem].name + '</span>' +
        '<span>' + c.name + ' ' + c.w + '×' + c.h + '</span>' +
        '</button>';
    });
  });

  library.innerHTML = html;

  // Give the thumbnail shapes a stroke (they sit outside #tray, so add it here).
  library.querySelectorAll('svg circle, svg ellipse, svg path, svg polygon').forEach(function (el) {
    el.setAttribute('stroke', '#1f1f1f');
    el.setAttribute('stroke-width', el.classList.contains('facet') ? '0.6' : '1');
    if (el.classList.contains('facet')) el.setAttribute('fill', 'none');
  });
}

function renderAll() {
  renderStones();
  renderInspector();
}


// ---------- Actions on the selected stone ----------

function duplicateSelected() {
  var s = findStone(selectedId);
  if (!s) return;
  var copy = makeStone(s.gem, s.cut, s.x + Math.max(s.w, s.h) + 2, s.y);
  copy.w = s.w;
  copy.h = s.h;
  copy.rot = s.rot;
  settle(copy);
  stones.push(copy);
  selectedId = copy.id;
  renderAll();
}

function rotateSelected() {
  var s = findStone(selectedId);
  if (!s) return;
  s.rot = (s.rot + 15) % 360;
  renderStones();
  updateInspectorText();
}

function deleteSelected() {
  if (selectedId === null) return;
  removeStone(selectedId);
  renderAll();
}


// ---------- Dragging ----------

// Start dragging a stone that is already on the tray.
stoneLayer.addEventListener('pointerdown', function (event) {
  var g = event.target.closest('.stone');
  if (!g) return;
  event.preventDefault();

  var s = findStone(Number(g.getAttribute('data-id')));
  var p = pointerToMM(event);
  selectedId = s.id;
  drag = {
    stone: s,
    offsetX: s.x - p.x,
    offsetY: s.y - p.y,
    isNew: false,
    startX: event.clientX,
    startY: event.clientY
  };
  document.body.classList.add('dragging');
  renderAll();
});

// Clicking empty tray space clears the selection.
svg.addEventListener('pointerdown', function (event) {
  if (event.target.closest('.stone')) return;
  selectedId = null;
  renderAll();
});

// Start dragging a new stone out of the library.
library.addEventListener('pointerdown', function (event) {
  var item = event.target.closest('.lib-item');
  if (!item) return;
  event.preventDefault();

  var p = pointerToMM(event);
  var s = makeStone(item.getAttribute('data-gem'), item.getAttribute('data-cut'), p.x, p.y);
  stones.push(s);
  selectedId = s.id;
  drag = {
    stone: s,
    offsetX: 0,
    offsetY: 0,
    isNew: true,
    startX: event.clientX,
    startY: event.clientY
  };
  document.body.classList.add('dragging');
  renderStones();
});

window.addEventListener('pointermove', function (event) {
  if (!drag) return;
  var p = pointerToMM(event);
  drag.stone.x = p.x + drag.offsetX;
  drag.stone.y = p.y + drag.offsetY;
  renderStones();
});

window.addEventListener('pointerup', function (event) {
  if (!drag) return;
  var s = drag.stone;
  var moved = Math.abs(event.clientX - drag.startX) + Math.abs(event.clientY - drag.startY);

  if (drag.isNew && !isOnTray({ x: s.x, y: s.y })) {
    if (moved < 5) {
      // A plain click on a library stone: put it in the next free spot.
      var spot = nextFreeSpot();
      s.x = spot.x;
      s.y = spot.y;
      settle(s);
    } else {
      // Dragged but dropped outside the tray: throw it away.
      removeStone(s.id);
    }
  } else {
    settle(s);
  }

  drag = null;
  document.body.classList.remove('dragging');
  renderAll();
});


// ---------- Inspector, filters, keys ----------

inspector.addEventListener('click', function (event) {
  var action = event.target.getAttribute('data-action');
  if (action === 'duplicate') duplicateSelected();
  if (action === 'rotate') rotateSelected();
  if (action === 'delete') deleteSelected();
  if (action === 'deselect') {
    selectedId = null;
    renderAll();
  }
});

inspector.addEventListener('input', function (event) {
  var s = findStone(selectedId);
  var value = parseFloat(event.target.value);
  if (!s || !(value > 0)) return;

  if (event.target.id === 'in-w') {
    s.w = value;
    if (s.cut === 'round') s.h = value; // round stones stay round
  }
  if (event.target.id === 'in-h') {
    s.h = value;
  }
  renderStones();
  updateInspectorText();
});

filters.addEventListener('click', function (event) {
  var btn = event.target.closest('.filter');
  if (!btn) return;
  currentFilter = btn.getAttribute('data-gem');
  filters.querySelectorAll('.filter').forEach(function (b) {
    b.classList.toggle('active', b === btn);
  });
  renderLibrary();
});

document.addEventListener('keydown', function (event) {
  if (event.target.tagName === 'INPUT') return; // don't steal keys while typing
  if (event.key === 'Delete' || event.key === 'Backspace') deleteSelected();
  if (event.key === 'r' || event.key === 'R') rotateSelected();
  if (event.key === 'Escape') {
    selectedId = null;
    renderAll();
  }
});

clearBtn.addEventListener('click', function () {
  stones = [];
  selectedId = null;
  renderAll();
});


// ---------- Start ----------
drawTray();
renderLibrary();
renderAll();
