// Stone library: gem materials, cuts, and how to draw each cut.
// Every size is in millimetres. Shapes are drawn centred on (0, 0).

var GEMS = {
  sapphire: { name: 'Sapphire', color: '#b9c6e6' },
  ruby:     { name: 'Ruby',     color: '#ecbcc3' },
  emerald:  { name: 'Emerald',  color: '#bcd9c6' },
  diamond:  { name: 'Diamond',  color: '#fdfcf8' }
};

// Default size for each cut: w = width, h = height (mm).
var CUTS = {
  round:   { name: 'Round',   w: 5, h: 5 },
  oval:    { name: 'Oval',    w: 6, h: 8 },
  pear:    { name: 'Pear',    w: 5, h: 8 },
  emerald: { name: 'Emerald cut', w: 6, h: 8 }
};

// Returns SVG markup for one stone outline plus a simple "table" facet.
function stoneShape(cut, w, h, color) {
  var fill = 'fill="' + color + '"';

  if (cut === 'round') {
    return '<circle r="' + (w / 2) + '" ' + fill + '/>' +
           '<circle class="facet" r="' + (w * 0.28) + '"/>';
  }

  if (cut === 'oval') {
    return '<ellipse rx="' + (w / 2) + '" ry="' + (h / 2) + '" ' + fill + '/>' +
           '<ellipse class="facet" rx="' + (w * 0.28) + '" ry="' + (h * 0.28) + '"/>';
  }

  if (cut === 'pear') {
    return '<path d="' + pearPath(w, h) + '" ' + fill + '/>' +
           '<path class="facet" d="' + pearPath(w * 0.55, h * 0.55) + '"/>';
  }

  if (cut === 'emerald') {
    return '<polygon points="' + octagonPoints(w, h) + '" ' + fill + '/>' +
           '<polygon class="facet" points="' + octagonPoints(w * 0.75, h * 0.8) + '"/>' +
           '<polygon class="facet" points="' + octagonPoints(w * 0.5, h * 0.6) + '"/>';
  }

  return '';
}

// Pear: pointed at the top, round at the bottom.
function pearPath(w, h) {
  var cx = w * 0.667; // control point that makes the widest part = w
  return 'M 0 ' + (-h / 2) +
         ' C ' + cx + ' ' + (-h * 0.05) + ', ' + cx + ' ' + (h / 2) + ', 0 ' + (h / 2) +
         ' C ' + (-cx) + ' ' + (h / 2) + ', ' + (-cx) + ' ' + (-h * 0.05) + ', 0 ' + (-h / 2) +
         ' Z';
}

// Emerald cut: a rectangle with the corners cut off.
function octagonPoints(w, h) {
  var c = Math.min(w, h) * 0.22;
  var x = w / 2;
  var y = h / 2;
  var pts = [
    [-x + c, -y], [x - c, -y],
    [x, -y + c],  [x, y - c],
    [x - c, y],   [-x + c, y],
    [-x, y - c],  [-x, -y + c]
  ];
  return pts.map(function (p) { return p[0] + ',' + p[1]; }).join(' ');
}
