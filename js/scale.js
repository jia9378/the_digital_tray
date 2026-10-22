// True scale: make 1 mm on the tray measure 1 mm on the glass.
//
// How it works: we need the physical width of the screen in mm. The browser
// tells us how many CSS pixels wide the screen is (screen.width, which already
// follows the macOS "Looks like" display setting). So
//     CSS px per mm = screen long side in px / screen long side in mm.
// The physical size comes from the device the user picks (native pixels / ppi).
// A bank card check lets the user fine-tune by eye.

var CARD_W = 85.60;   // ISO/IEC 7810 ID-1 card, mm
var CARD_H = 53.98;

// px = native pixels on the long side, ppi = Apple's published pixel density.
var DEVICES = [
  { group: 'MacBook Air', items: [
    { id: 'mba13-2022', name: 'MacBook Air 13.6″ (M2 and later, 2022–)', hint: 'Notch in the screen', px: 2560, short: 1664, ppi: 224 },
    { id: 'mba15-2023', name: 'MacBook Air 15.3″ (M2 and later, 2023–)', hint: 'Notch in the screen', px: 2880, short: 1864, ppi: 224 },
    { id: 'mba13-2018', name: 'MacBook Air 13.3″ (Retina / M1, 2018–2020)', hint: 'No notch', px: 2560, short: 1600, ppi: 227 },
    { id: 'mba13-old',  name: 'MacBook Air 13.3″ (2010–2017)', hint: 'Silver bezel, not Retina', px: 1440, short: 900, ppi: 128 },
    { id: 'mba11',      name: 'MacBook Air 11.6″ (2010–2015)', px: 1366, short: 768, ppi: 135 }
  ]},
  { group: 'MacBook Pro', items: [
    { id: 'mbp14-2021', name: 'MacBook Pro 14.2″ (2021–)', hint: 'Notch in the screen', px: 3024, short: 1964, ppi: 254 },
    { id: 'mbp16-2021', name: 'MacBook Pro 16.2″ (2021–)', hint: 'Notch in the screen', px: 3456, short: 2234, ppi: 254 },
    { id: 'mbp13-2016', name: 'MacBook Pro 13.3″ (2012–2022)', px: 2560, short: 1600, ppi: 227 },
    { id: 'mbp16-2019', name: 'MacBook Pro 16″ (2019, Intel)', px: 3072, short: 1920, ppi: 226 },
    { id: 'mbp15-2012', name: 'MacBook Pro 15.4″ (2012–2019)', px: 2880, short: 1800, ppi: 220 },
    { id: 'mb12',       name: 'MacBook 12″ (2015–2017)', px: 2304, short: 1440, ppi: 226 }
  ]},
  { group: 'iMac and Apple displays', items: [
    { id: 'imac24',  name: 'iMac 24″ (2021–)', px: 4480, short: 2520, ppi: 218 },
    { id: 'imac27',  name: 'iMac 27″ 5K / Studio Display 27″', px: 5120, short: 2880, ppi: 218 },
    { id: 'xdr32',   name: 'Pro Display XDR 32″', px: 6016, short: 3384, ppi: 218 }
  ]},
  { group: 'iPad', items: [
    { id: 'ipadpro13', name: 'iPad Pro 13″ (M4 and later)', px: 2752, short: 2064, ppi: 264 },
    { id: 'ipadpro129', name: 'iPad Pro 12.9″ / iPad Air 13″', px: 2732, short: 2048, ppi: 264 },
    { id: 'ipadpro11', name: 'iPad Pro 11″ (M4 and later)', px: 2420, short: 1668, ppi: 264 },
    { id: 'ipad11',   name: 'iPad Pro 11″ (2018–2022)', px: 2388, short: 1668, ppi: 264 },
    { id: 'ipadair11', name: 'iPad Air 11″ / 10.9″, iPad 10th gen and later', px: 2360, short: 1640, ppi: 264 },
    { id: 'ipadmini', name: 'iPad mini (6th gen and later)', px: 2266, short: 1488, ppi: 326 }
  ]}
];

// Default "Looks like" widths. If the screen reports one of these, we can guess the model.
var DEFAULT_WIDTHS = {
  '1470x956': 'mba13-2022',
  '1710x1112': 'mba15-2023', '1710x1107': 'mba15-2023',
  '1512x982': 'mbp14-2021',
  '1728x1117': 'mbp16-2021',
  '1536x960': 'mbp16-2019',
  '2240x1260': 'imac24',
  '2560x1440': 'imac27'
};

var scale = {
  mode: 'fit',        // 'fit' or 'true'
  deviceId: null,     // a DEVICES id, or 'custom'
  diagonal: null,     // inches, for 'custom'
  tune: 1,            // fine-tune factor from the card check
  asked: false        // true once the user has answered the set-up dialog
};

function findDevice(id) {
  for (var g = 0; g < DEVICES.length; g++) {
    for (var i = 0; i < DEVICES[g].items.length; i++) {
      if (DEVICES[g].items[i].id === id) return DEVICES[g].items[i];
    }
  }
  return null;
}

function screenLong() {
  return Math.max(window.screen.width, window.screen.height);
}

function screenShort() {
  return Math.min(window.screen.width, window.screen.height);
}

// Physical long side of the screen in mm, before fine-tuning.
function panelLongMM(s) {
  if (s.deviceId === 'custom') {
    if (!(s.diagonal > 0)) return null;
    var L = screenLong();
    var S = screenShort();
    return s.diagonal * 25.4 * L / Math.sqrt(L * L + S * S);
  }
  var d = findDevice(s.deviceId);
  return d ? d.px / d.ppi * 25.4 : null;
}

// CSS pixels per millimetre for settings s, or null if not set up.
function pxPerMMFor(s) {
  var mm = panelLongMM(s);
  if (!mm) return null;
  return screenLong() / mm * (s.tune || 1);
}

// The scale the boards use right now. Null means "fit to window".
function currentPxPerMM() {
  if (scale.mode !== 'true') return null;
  return pxPerMMFor(scale);
}

function guessDevice() {
  var key = window.screen.width + 'x' + window.screen.height;
  return DEFAULT_WIDTHS[key] || null;
}

// True if the screen shape doesn't match the chosen device
// (for example, the window is on an external monitor).
function screenMismatch() {
  if (scale.mode !== 'true') return false;
  var d = findDevice(scale.deviceId);
  if (!d) return false;
  var want = d.px / d.short;
  var have = screenLong() / screenShort();
  return Math.abs(want - have) / want > 0.025;
}

function scaleLabel() {
  if (scale.mode !== 'true') return 'FIT TO WINDOW · NOT TO SCALE';
  var d = findDevice(scale.deviceId);
  var name = d ? d.name.replace(/ \(.*\)/, '') : 'Custom ' + scale.diagonal + '″ screen';
  return 'TRUE SCALE 1:1 · ' + name;
}


// ---------- The set-up dialog ----------

var scaleDialog = document.getElementById('scale-dialog');
var draft = null;          // settings being edited in the dialog
var onScaleChange = null;  // set by app.js

function openScaleDialog() {
  draft = {
    mode: 'true',
    deviceId: scale.deviceId || guessDevice() || 'mba13-2022',
    diagonal: scale.diagonal || 24,
    tune: scale.tune || 1
  };
  renderScaleDialog();
  if (scaleDialog.showModal) scaleDialog.showModal();
  else scaleDialog.setAttribute('open', '');
}

function closeScaleDialog() {
  if (scaleDialog.close) scaleDialog.close();
  else scaleDialog.removeAttribute('open');
}

function renderScaleDialog() {
  var guess = guessDevice();
  var options = '';
  DEVICES.forEach(function (g) {
    options += '<optgroup label="' + g.group + '">';
    g.items.forEach(function (d) {
      options += '<option value="' + d.id + '"' + (d.id === draft.deviceId ? ' selected' : '') + '>' +
        d.name + (d.id === guess ? '  ← looks like this screen' : '') + '</option>';
    });
    options += '</optgroup>';
  });
  options += '<optgroup label="Other"><option value="custom"' + (draft.deviceId === 'custom' ? ' selected' : '') + '>Other screen — I know its size</option></optgroup>';

  var d = findDevice(draft.deviceId);
  scaleDialog.innerHTML =
    '<form method="dialog" class="scale-form">' +
      '<p class="dlg-kicker">SCREEN SET-UP</p>' +
      '<h2>Show stones at their real size</h2>' +
      '<p class="dlg-text">Pick your screen. Then 1 mm on the tray is 1 mm on the glass: a ruler held against the screen will match.</p>' +

      '<label class="dlg-row"><span>DEVICE</span><select id="dev-select">' + options + '</select></label>' +
      (d && d.hint ? '<p class="dlg-hint">' + d.hint + '. Not sure? Apple menu → About This Mac.</p>' : '') +
      (draft.deviceId === 'custom' ?
        '<label class="dlg-row"><span>DIAGONAL</span><input type="number" id="dev-diag" min="5" max="100" step="0.1" value="' + draft.diagonal + '"> inches</label>' : '') +

      '<p class="dlg-kicker dlg-gap">CHECK WITH A CARD</p>' +
      '<p class="dlg-text">Hold a bank card flat against the screen, on the outline. If it doesn\'t line up, nudge the slider.</p>' +
      '<div class="card-check" id="card-check"></div>' +
      '<label class="dlg-row"><span>FINE-TUNE</span>' +
        '<button type="button" class="nudge" data-nudge="-0.002">−</button>' +
        '<input type="range" id="dev-tune" min="0.94" max="1.06" step="0.001" value="' + draft.tune + '">' +
        '<button type="button" class="nudge" data-nudge="0.002">+</button>' +
        '<output id="tune-out"></output>' +
      '</label>' +
      '<p class="dlg-hint">Keep browser zoom at 100% (⌘0). If you move this window to another screen, set this up again.</p>' +

      '<div class="dlg-actions">' +
        '<button type="button" class="secondary" id="dlg-fit">FIT TO WINDOW INSTEAD</button>' +
        '<button type="button" class="primary" id="dlg-use">USE TRUE SCALE</button>' +
      '</div>' +
    '</form>';

  renderCardCheck();

  document.getElementById('dev-select').addEventListener('change', function (e) {
    draft.deviceId = e.target.value;
    draft.tune = 1;
    renderScaleDialog();
  });
  var diag = document.getElementById('dev-diag');
  if (diag) diag.addEventListener('input', function (e) {
    draft.diagonal = parseFloat(e.target.value);
    renderCardCheck();
  });
  document.getElementById('dev-tune').addEventListener('input', function (e) {
    draft.tune = parseFloat(e.target.value);
    renderCardCheck();
  });
  scaleDialog.querySelectorAll('.nudge').forEach(function (b) {
    b.addEventListener('click', function () {
      draft.tune = Math.round((draft.tune + parseFloat(b.getAttribute('data-nudge'))) * 1000) / 1000;
      document.getElementById('dev-tune').value = draft.tune;
      renderCardCheck();
    });
  });
  document.getElementById('dlg-fit').addEventListener('click', function () {
    scale.mode = 'fit';
    scale.asked = true;
    closeScaleDialog();
    if (onScaleChange) onScaleChange();
  });
  document.getElementById('dlg-use').addEventListener('click', function () {
    if (!pxPerMMFor(draft)) return;
    scale.mode = 'true';
    scale.deviceId = draft.deviceId;
    scale.diagonal = draft.diagonal;
    scale.tune = draft.tune;
    scale.asked = true;
    closeScaleDialog();
    if (onScaleChange) onScaleChange();
  });
}

// A card outline and a 50 mm ruler, drawn at the draft scale.
function renderCardCheck() {
  var box = document.getElementById('card-check');
  var out = document.getElementById('tune-out');
  var ppm = pxPerMMFor(draft);
  if (out) out.textContent = ((draft.tune - 1) * 100).toFixed(1) + '%';
  if (!ppm) {
    box.innerHTML = '<p class="dlg-hint">Enter the screen diagonal to see the card.</p>';
    return;
  }
  var vbW = CARD_W + 4;
  var vbH = CARD_H + 14;
  var ticks = '';
  for (var mm = 0; mm <= 50; mm++) {
    var len = mm % 10 === 0 ? 3 : (mm % 5 === 0 ? 2 : 1.2);
    ticks += '<line x1="' + (2 + mm) + '" y1="' + (CARD_H + 6) + '" x2="' + (2 + mm) + '" y2="' + (CARD_H + 6 + len) + '"/>';
  }
  box.innerHTML =
    '<svg viewBox="0 0 ' + vbW + ' ' + vbH + '" style="width:' + (vbW * ppm) + 'px;height:' + (vbH * ppm) + 'px">' +
      '<rect x="2" y="2" width="' + CARD_W + '" height="' + CARD_H + '" rx="3.18" class="card-outline"/>' +
      '<text x="' + (2 + CARD_W / 2) + '" y="' + (2 + CARD_H / 2) + '" class="card-label">BANK CARD · 85.60 × 53.98 mm</text>' +
      '<g class="card-ruler">' + ticks +
        '<line x1="2" y1="' + (CARD_H + 6) + '" x2="52" y2="' + (CARD_H + 6) + '"/>' +
        '<text x="54" y="' + (CARD_H + 9) + '">50 mm</text>' +
      '</g>' +
    '</svg>' +
    '<p class="dlg-hint">' + ppm.toFixed(2) + ' px per mm on this screen.</p>';
}
