// Try On: put the design on a photo of your hand, wrist, neck or ear, at real size.
//
// 1. Take a webcam photo (or upload one) with a bank card in it.
// 2. Click both ends of one card edge. The card is 85.60 x 53.98 mm, so that
//    gives "photo pixels per mm" for anything at the same distance as the card.
// 3. The ring / bracelet / necklace / stud is drawn on top at that scale.
//    Drag it into place and rotate it.
//
// Everything is drawn in one SVG whose viewBox is the photo's own pixels.

var TRYON_PARTS = [
  { id: 'finger', name: 'FINGER', piece: 'ring' },
  { id: 'wrist',  name: 'WRIST',  piece: 'bracelet' },
  { id: 'neck',   name: 'NECK',   piece: 'necklace' },
  { id: 'ear',    name: 'EAR',    piece: null }
];

var tryon = {
  part: 'finger',
  photo: null,          // data URL of the snapshot
  imgW: 0,
  imgH: 0,
  side: 'long',         // which card edge was measured
  pts: [],              // the two clicked card points, in photo px
  pos: null,            // overlay centre, in photo px
  rot: 0,
  stud: { cut: 'round', size: 5 },
  live: false           // camera running
};

var toStage = document.getElementById('to-stage');
var toPanel = document.getElementById('to-panel');
var toStream = null;
var toDrag = null;
var toCountdown = null;

function cardEdgeMM() {
  return tryon.side === 'long' ? CARD_W : CARD_H;
}

// Photo pixels per mm, or null until both card points are set.
function photoPxPerMM() {
  if (tryon.pts.length < 2) return null;
  var a = tryon.pts[0];
  var b = tryon.pts[1];
  return Math.hypot(b[0] - a[0], b[1] - a[1]) / cardEdgeMM();
}


// ---------- What gets drawn on the photo (in mm, centred on 0, 0) ----------

function pieceFor(type) {
  var p = {};
  Object.keys(piece).forEach(function (k) { p[k] = piece[k]; });
  p.type = type;
  return p;
}

function shift(stones, dx, dy) {
  return stones.map(function (s) {
    var c = {};
    Object.keys(s).forEach(function (k) { c[k] = s[k]; });
    c.x = s.x + dx;
    c.y = s.y + dy;
    return c;
  });
}

function stonesMarkup(stones) {
  return '<g filter="url(#stone-shadow)">' + stones.map(function (s) {
    return '<g transform="translate(' + s.x + ' ' + s.y + ') rotate(' + s.rot + ')">' + stoneSVG(s) + '</g>';
  }).join('') + '</g>';
}

function overlayMarkup() {
  var metal = findMetal(piece.metal);
  var html = '';

  if (tryon.part === 'finger') {
    // Ring band seen from above, across the finger, with its stones.
    var g = ringLayout(pieceFor('ring')).guides[0];
    var cx = (g[0][0] + g[1][0]) / 2;
    var cy = g[0][1];
    var len = g[1][0] - g[0][0] + 1;
    var bw = piece.ringBand;
    html += '<rect class="metal-edge" x="' + r2(-len / 2) + '" y="' + r2(-bw / 2) + '" width="' + r2(len) + '" height="' + bw + '" rx="0.4" fill="url(#' + metalGradient(metal, 'x') + ')"/>';
    html += stonesMarkup(shift(pieceStones.ring, -cx, -cy));
  }

  if (tryon.part === 'wrist') {
    // The part of the bracelet you see on top of the wrist: the middle 60 mm.
    var lay = braceletLayout(pieceFor('bracelet'));
    var gw = lay.guides[0];
    var bwB = piece.braceletBand;
    var show = 60;
    var mx, my, list;
    if (piece.braceletStyle === 'beads') {
      // Bead bracelet: unroll the circle and show the beads nearest the top
      // as a row across the wrist, holes along the cord.
      var bx = 0, byc = 0;
      gw.forEach(function (p) { bx += p[0]; byc += p[1]; });
      bx /= gw.length;
      byc /= gw.length;
      var R = piece.beadLen / (2 * Math.PI);
      var row = [];
      pieceStones.bracelet.forEach(function (s) {
        var arc = Math.atan2(s.x - bx, -(s.y - byc)) * R; // 0 at the top, + clockwise
        if (Math.abs(arc) > show / 2 + 2) return;
        var c = shift([s], 0, 0)[0];
        c.x = arc;
        c.y = 0;
        c.rot = 0;
        row.push(c);
      });
      html += '<line x1="' + (-show / 2) + '" y1="0" x2="' + (show / 2) + '" y2="0" stroke="#f6f3ec" stroke-width="0.55"/>';
      html += stonesMarkup(row);
      return html;
    }
    if (piece.braceletStyle === 'bangle') {
      // Stones on the top half of the oval, laid straight across the wrist.
      var sx = 0, sy = 0;
      gw.forEach(function (p) { sx += p[0]; sy += p[1]; });
      mx = sx / gw.length;
      my = Math.min.apply(null, gw.map(function (p) { return p[1]; }));
      var midY = sy / gw.length;
      list = pieceStones.bracelet.filter(function (s) { return s.y < midY; })
        .map(function (s) { var c = shift([s], 0, 0)[0]; c.y = my; return c; });
    } else {
      mx = (gw[0][0] + gw[gw.length - 1][0]) / 2;
      my = gw[0][1];
      list = pieceStones.bracelet;
    }
    list = list.filter(function (s) { return Math.abs(s.x - mx) <= show / 2 + 2; });
    html += '<rect class="metal-edge" x="' + (-show / 2) + '" y="' + r2(-bwB / 2) + '" width="' + show + '" height="' + bwB + '" rx="' + r2(Math.min(bwB / 2, 1)) + '" fill="url(#' + metalGradient(metal, 'y') + ')"/>';
    html += stonesMarkup(shift(list, -mx, -my));
  }

  if (tryon.part === 'neck') {
    // The chain and its stones, centred on the lowest point.
    var chain = necklaceLayout(pieceFor('necklace')).guides[0];
    var low = chain[0];
    chain.forEach(function (p) { if (p[1] > low[1]) low = p; });
    var pts = chain.map(function (p) { return [p[0] - low[0], p[1] - low[1]]; });
    var d = polyPath(pts, false);
    html += '<path d="' + d + '" fill="none" stroke="' + metal.dark + '" stroke-width="1.15" stroke-linecap="round"/>';
    html += '<path d="' + d + '" fill="none" stroke="' + metal.base + '" stroke-width="0.8" stroke-linecap="round"/>';
    html += '<path d="' + d + '" fill="none" stroke="' + metal.light + '" stroke-width="0.35" stroke-dasharray="0.9 0.6"/>';
    html += stonesMarkup(shift(pieceStones.necklace, -low[0], -low[1]));
  }

  if (tryon.part === 'ear') {
    // A single stud: the stone picked in the library, in a four-prong setting.
    var cut = CUTS[tryon.stud.cut];
    var w = tryon.stud.size;
    var h = cut.lock ? w : round1(w * cut.h / cut.w);
    var stone = { gem: libPick.gem, color: libPick.color, cut: tryon.stud.cut, w: w, h: h, x: 0, y: 0, rot: 0 };
    html += stonesMarkup([stone]);
    var pr = Math.max(0.3, w * 0.07);
    [45, 135, 225, 315].forEach(function (deg) {
      var t = deg * Math.PI / 180;
      html += '<circle class="metal-edge" cx="' + r2(Math.cos(t) * w * 0.4) + '" cy="' + r2(Math.sin(t) * h * 0.4) + '" r="' + r2(pr) + '" fill="url(#' + metalGradient(metal, 'x') + ')"/>';
    });
  }
  return html;
}


// ---------- Drawing the stage ----------

function renderTryOnStage() {
  if (tryon.live) return; // the camera <video> is showing

  if (!tryon.photo) {
    toStage.innerHTML =
      '<div class="to-empty">' +
        '<p class="to-big">Take a photo with a bank card in it.</p>' +
        '<p>Lay the card flat beside your hand (or hold it under your chin for a necklace), the same distance from the camera.</p>' +
      '</div>';
    return;
  }

  var W = tryon.imgW;
  var H = tryon.imgH;
  var ppm = photoPxPerMM();
  var u = Math.max(W, H) / 400; // a "screen-ish" unit for markers, so they stay visible on big photos

  var html = '<svg id="to-svg" viewBox="0 0 ' + W + ' ' + H + '" class="' + (ppm ? 'placing' : 'calibrating') + '">' +
    '<image href="' + tryon.photo + '" x="0" y="0" width="' + W + '" height="' + H + '"/>';

  if (ppm) {
    html += '<g id="to-overlay" transform="translate(' + r2(tryon.pos[0]) + ' ' + r2(tryon.pos[1]) + ') rotate(' + tryon.rot + ') scale(' + r2(ppm) + ')">' +
      overlayMarkup() + '</g>';
  }

  // Card measurement: the line and its two draggable ends.
  if (tryon.pts.length) {
    var a = tryon.pts[0];
    var b = tryon.pts[1];
    html += '<g class="to-card">';
    if (b) {
      html += '<line x1="' + a[0] + '" y1="' + a[1] + '" x2="' + b[0] + '" y2="' + b[1] + '"/>';
      html += '<text x="' + r2((a[0] + b[0]) / 2) + '" y="' + r2((a[1] + b[1]) / 2 - 3 * u) + '" font-size="' + r2(4.5 * u) + '">' + cardEdgeMM().toFixed(2) + ' mm</text>';
    }
    tryon.pts.forEach(function (p, i) {
      html += '<circle class="to-pt" data-pt="' + i + '" cx="' + p[0] + '" cy="' + p[1] + '" r="' + r2(3.2 * u) + '"/>';
      html += '<line class="to-tick" x1="' + p[0] + '" y1="' + r2(p[1] - 5 * u) + '" x2="' + p[0] + '" y2="' + r2(p[1] + 5 * u) + '"/>';
    });
    html += '</g>';
  }

  toStage.innerHTML = html + '</svg>';
}

// Update just the overlay's transform while dragging (no full redraw).
function moveOverlayEl() {
  var el = $('to-overlay');
  var ppm = photoPxPerMM();
  if (el && ppm) {
    el.setAttribute('transform', 'translate(' + r2(tryon.pos[0]) + ' ' + r2(tryon.pos[1]) + ') rotate(' + tryon.rot + ') scale(' + r2(ppm) + ')');
  }
}


// ---------- The side panel ----------

function renderTryOnPanel() {
  var ppm = photoPxPerMM();
  var hasPhoto = !!tryon.photo;

  // Step 1: photo.
  var html = '<div class="to-step' + (hasPhoto ? ' done' : ' current') + '">' +
    '<p class="to-step-title">1 · PHOTO</p>';
  if (tryon.live) {
    html += '<div class="to-btns"><button class="primary" data-to="snap">TAKE PHOTO</button>' +
      '<button data-to="timer">5 s TIMER</button><button data-to="stop">CANCEL</button></div>' +
      (toCountdown !== null ? '<p class="to-count">' + toCountdown + '</p>' : '');
  } else {
    html += '<div class="to-btns"><button class="' + (hasPhoto ? '' : 'primary') + '" data-to="camera">' + (hasPhoto ? 'RETAKE' : 'START CAMERA') + '</button>' +
      '<label class="to-upload">UPLOAD PHOTO<input type="file" id="to-file" accept="image/*"></label></div>';
  }
  html += '<p class="hint">Card and body at the same distance from the camera, card flat and facing it. A tilted card makes everything come out too small.</p></div>';

  // Step 2: card.
  html += '<div class="to-step' + (!hasPhoto ? ' waiting' : (ppm ? ' done' : ' current')) + '">' +
    '<p class="to-step-title">2 · CALIBRATE WITH THE CARD</p>' +
    '<label class="to-row">EDGE <select id="to-side">' +
      '<option value="long"' + (tryon.side === 'long' ? ' selected' : '') + '>Long edge · 85.60 mm</option>' +
      '<option value="short"' + (tryon.side === 'short' ? ' selected' : '') + '>Short edge · 53.98 mm</option>' +
    '</select></label>';
  if (hasPhoto && !ppm) {
    html += '<p class="to-do">Click ' + (tryon.pts.length === 0 ? 'one end' : 'the other end') + ' of the card\'s ' + tryon.side + ' edge on the photo.</p>';
  }
  if (ppm) {
    var a = tryon.pts[0];
    var b = tryon.pts[1];
    html += '<p class="to-result">' + Math.round(Math.hypot(b[0] - a[0], b[1] - a[1])) + ' px = ' + cardEdgeMM().toFixed(2) + ' mm<br><strong>' + ppm.toFixed(2) + ' px per mm</strong></p>' +
      '<p class="hint">Drag the red dots to fine-tune.</p>' +
      '<div class="to-btns"><button data-to="recal">CLICK AGAIN</button></div>';
  }
  html += '</div>';

  // Step 3: place the piece.
  var parts = TRYON_PARTS.map(function (p) {
    return '<button class="seg' + (tryon.part === p.id ? ' active' : '') + '" data-part="' + p.id + '">' + p.name + '</button>';
  }).join('');
  html += '<div class="to-step' + (ppm ? ' current' : ' waiting') + '">' +
    '<p class="to-step-title">3 · TRY ON</p>' +
    '<div class="segs to-parts">' + parts + '</div>' + partNote();

  if (tryon.part === 'ear') {
    var color = findColor(libPick.gem, libPick.color);
    html += '<label class="to-row">CUT <select id="to-stud-cut">' + GEMS[libPick.gem].cuts.map(function (c) {
      return '<option value="' + c + '"' + (c === tryon.stud.cut ? ' selected' : '') + '>' + CUTS[c].name + '</option>';
    }).join('') + '</select></label>' +
      '<label class="to-row">SIZE <input type="number" id="to-stud-size" min="1" max="20" step="0.5" value="' + tryon.stud.size + '"> mm</label>' +
      '<p class="hint">Stone: ' + GEMS[libPick.gem].name + ', ' + color.name + ' (change it in the library on the Tray tab).</p>';
  }

  html += '<p class="to-sub">METAL</p><div class="metals to-metals">' + METALS.map(function (m) {
    return '<button class="metal-chip' + (piece.metal === m.id ? ' active' : '') + '" data-to-metal="' + m.id + '" title="' + m.name + '">' +
      '<i style="background:linear-gradient(135deg,' + m.dark + ',' + m.light + ' 45%,' + m.base + ' 70%,' + m.dark + ')"></i></button>';
  }).join('') + '</div>' +
    '<label class="to-row">ROTATE <input type="range" id="to-rot" min="-180" max="180" step="1" value="' + tryon.rot + '"><output id="to-rot-out">' + tryon.rot + '°</output></label>' +
    '<p class="hint">Drag the piece on the photo to move it. R rotates 5° (⇧R back).</p>' +
    '</div>';

  // Step 4: save.
  html += '<div class="to-step' + (ppm ? '' : ' waiting') + '">' +
    '<p class="to-step-title">4 · SAVE</p>' +
    '<div class="to-btns"><button data-to="save"' + (ppm ? '' : ' disabled') + '>SAVE IMAGE (PNG)</button></div></div>';

  toPanel.innerHTML = html;
}

function partNote() {
  if (tryon.part === 'ear') return '';
  var p = TRYON_PARTS.filter(function (x) { return x.id === tryon.part; })[0];
  var n = pieceStones[p.piece].length;
  var size = p.piece === 'ring' ? 'US ' + piece.ringSize + ', ' + piece.ringBand + ' mm band'
    : p.piece === 'bracelet' ? (piece.braceletStyle === 'beads' ? 'bead bracelet ' + (piece.beadLen / 10) + ' cm' : piece.braceletBand + ' mm wide') + ', middle 60 mm shown'
    : piece.necklaceLen + ' cm chain';
  return '<p class="hint">Your ' + p.piece + ' from the Piece tab: ' + size + ', ' + n + (n === 1 ? ' stone' : ' stones') + '.' +
    (n === 0 ? ' <strong>Add stones on the Piece tab first.</strong>' : '') + '</p>';
}

function renderTryOn() {
  renderTryOnPanel();
  renderTryOnStage();
}


// ---------- Camera and photos ----------

function startCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert('This browser can\'t use the camera here. Try Chrome or Safari on localhost, or upload a photo instead.');
    return;
  }
  navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1920 }, height: { ideal: 1080 }, facingMode: 'user' }, audio: false })
    .then(function (stream) {
      toStream = stream;
      tryon.live = true;
      toStage.innerHTML = '<video id="to-video" autoplay playsinline muted></video>';
      $('to-video').srcObject = stream;
      renderTryOnPanel();
    })
    .catch(function (err) {
      alert('Couldn\'t start the camera (' + err.name + '). Check the browser\'s camera permission, or upload a photo instead.');
    });
}

function stopCamera() {
  if (toStream) toStream.getTracks().forEach(function (t) { t.stop(); });
  toStream = null;
  tryon.live = false;
  toCountdown = null;
}

// Grab the current video frame, mirrored like the preview.
function snapPhoto() {
  var video = $('to-video');
  if (!video || !video.videoWidth) return;
  var c = document.createElement('canvas');
  c.width = video.videoWidth;
  c.height = video.videoHeight;
  var ctx = c.getContext('2d');
  ctx.translate(c.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0);
  stopCamera();
  setPhoto(c.toDataURL('image/jpeg', 0.92), c.width, c.height);
}

function timerSnap() {
  toCountdown = 5;
  renderTryOnPanel();
  var tick = setInterval(function () {
    if (!tryon.live) { clearInterval(tick); return; }
    toCountdown--;
    if (toCountdown <= 0) {
      clearInterval(tick);
      toCountdown = null;
      snapPhoto();
    } else {
      renderTryOnPanel();
    }
  }, 1000);
}

function setPhoto(url, w, h) {
  tryon.photo = url;
  tryon.imgW = w;
  tryon.imgH = h;
  tryon.pts = [];
  tryon.pos = [w / 2, h / 2];
  renderTryOn();
}

// Uploaded photos are scaled down to 2400 px on the long side, which is plenty.
function loadFile(file) {
  var reader = new FileReader();
  reader.onload = function () {
    var img = new Image();
    img.onload = function () {
      var k = Math.min(1, 2400 / Math.max(img.width, img.height));
      var c = document.createElement('canvas');
      c.width = Math.round(img.width * k);
      c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      stopCamera();
      setPhoto(c.toDataURL('image/jpeg', 0.92), c.width, c.height);
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}


// ---------- Saving the result ----------

function saveTryOn() {
  var ppm = photoPxPerMM();
  if (!ppm) return;
  var W = tryon.imgW;
  var H = tryon.imgH;
  // Overlay only, with the shared gradients copied in. The photo is drawn
  // onto the canvas separately, which keeps the canvas exportable.
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '">' +
    '<defs>' + $('shared-defs').innerHTML + '</defs>' +
    '<style>.metal-edge{stroke:rgba(0,0,0,.45);stroke-width:' + r2(0.8 / ppm) + '}</style>' +
    '<g transform="translate(' + tryon.pos[0] + ' ' + tryon.pos[1] + ') rotate(' + tryon.rot + ') scale(' + ppm + ')">' + overlayMarkup() + '</g></svg>';

  var photo = new Image();
  photo.onload = function () {
    var over = new Image();
    var url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    over.onload = function () {
      var c = document.createElement('canvas');
      c.width = W;
      c.height = H;
      var ctx = c.getContext('2d');
      ctx.drawImage(photo, 0, 0);
      ctx.drawImage(over, 0, 0);
      URL.revokeObjectURL(url);
      c.toBlob(function (blob) {
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'try-on-' + tryon.part + '.png';
        a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
      }, 'image/png');
    };
    over.src = url;
  };
  photo.src = tryon.photo;
}


// ---------- Events ----------

toPanel.addEventListener('click', function (e) {
  var btn = e.target.closest('button');
  if (!btn) return;
  var act = btn.getAttribute('data-to');
  if (act === 'camera') startCamera();
  if (act === 'snap') snapPhoto();
  if (act === 'timer') timerSnap();
  if (act === 'stop') { stopCamera(); renderTryOn(); }
  if (act === 'recal') { tryon.pts = []; renderTryOn(); }
  if (act === 'save') saveTryOn();
  if (btn.hasAttribute('data-part')) {
    tryon.part = btn.getAttribute('data-part');
    if (tryon.part === 'ear' && GEMS[libPick.gem].cuts.indexOf(tryon.stud.cut) < 0) tryon.stud.cut = GEMS[libPick.gem].cuts[0];
    renderTryOn();
    save();
  }
  if (btn.hasAttribute('data-to-metal')) {
    piece.metal = btn.getAttribute('data-to-metal');
    renderTryOn();
    save();
  }
});

toPanel.addEventListener('change', function (e) {
  if (e.target.id === 'to-file' && e.target.files[0]) loadFile(e.target.files[0]);
  if (e.target.id === 'to-side') { tryon.side = e.target.value; renderTryOn(); }
  if (e.target.id === 'to-stud-cut') { tryon.stud.cut = e.target.value; renderTryOn(); }
});

toPanel.addEventListener('input', function (e) {
  if (e.target.id === 'to-rot') {
    tryon.rot = parseFloat(e.target.value);
    $('to-rot-out').textContent = tryon.rot + '°';
    moveOverlayEl();
  }
  if (e.target.id === 'to-stud-size') {
    var v = parseFloat(e.target.value);
    if (v > 0) { tryon.stud.size = v; renderTryOnStage(); }
  }
});

function photoPoint(e) {
  var svg = $('to-svg');
  var pt = svg.createSVGPoint();
  pt.x = e.clientX;
  pt.y = e.clientY;
  var p = pt.matrixTransform(svg.getScreenCTM().inverse());
  return [p.x, p.y];
}

toStage.addEventListener('pointerdown', function (e) {
  if (!$('to-svg')) return;
  e.preventDefault();
  var p = photoPoint(e);

  // Drag a card point.
  var dot = e.target.closest('.to-pt');
  if (dot) {
    toDrag = { kind: 'pt', i: Number(dot.getAttribute('data-pt')) };
    return;
  }
  // Still calibrating: each click sets the next card point.
  if (tryon.pts.length < 2) {
    tryon.pts.push(p);
    renderTryOn();
    return;
  }
  // Otherwise drag the piece from wherever you grab it.
  toDrag = { kind: 'piece', off: [tryon.pos[0] - p[0], tryon.pos[1] - p[1]] };
  document.body.classList.add('dragging');
});

window.addEventListener('pointermove', function (e) {
  if (!toDrag || !$('to-svg')) return;
  var p = photoPoint(e);
  if (toDrag.kind === 'pt') {
    tryon.pts[toDrag.i] = p;
    renderTryOnStage();
  } else {
    tryon.pos = [p[0] + toDrag.off[0], p[1] + toDrag.off[1]];
    moveOverlayEl();
  }
});

window.addEventListener('pointerup', function () {
  if (!toDrag) return;
  var wasPt = toDrag.kind === 'pt';
  toDrag = null;
  document.body.classList.remove('dragging');
  if (wasPt) renderTryOnPanel();
});

document.addEventListener('keydown', function (e) {
  if (mode !== 'tryon' || !photoPxPerMM()) return;
  var tag = e.target.tagName;
  if (tag === 'INPUT' || tag === 'SELECT' || e.metaKey || e.ctrlKey) return;
  if (e.key === 'r' || e.key === 'R') {
    tryon.rot = Math.max(-180, Math.min(180, tryon.rot + (e.shiftKey ? -5 : 5)));
    var slider = $('to-rot');
    if (slider) slider.value = tryon.rot;
    var out = $('to-rot-out');
    if (out) out.textContent = tryon.rot + '°';
    moveOverlayEl();
  }
});

// Leaving the Try On tab turns the camera off.
function leaveTryOn() {
  if (tryon.live) stopCamera();
}
