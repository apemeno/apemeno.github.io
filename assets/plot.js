// Penggambar diagram SVG sederhana (SFD, BMD, lendutan, dan sketsa penampang).
var Plot = (function () {
  var NS = 'http://www.w3.org/2000/svg';

  function el(name, attrs, text) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    return e;
  }

  function fmt(v, d) {
    if (d == null) d = 2;
    if (!isFinite(v)) return '–';
    if (Math.abs(v) < 1e-9) v = 0;
    return v.toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d });
  }

  // Diagram garis berisi area: xs (m), ys, opsi {color, unit, invert}
  function diagram(container, xs, ys, opt) {
    opt = opt || {};
    var W = 640, H = 200, padL = 44, padR = 16, padT = 22, padB = 28;
    var L = xs[xs.length - 1];
    var ymax = Math.max.apply(null, ys), ymin = Math.min.apply(null, ys);
    if (ymax < 0) ymax = 0; if (ymin > 0) ymin = 0;
    if (ymax - ymin < 1e-12) { ymax = 1; ymin = -1; }
    var span = ymax - ymin; ymax += span * 0.08; ymin -= span * 0.08;
    var sx = function (x) { return padL + (x / L) * (W - padL - padR); };
    // Jika invert = true, nilai positif digambar ke bawah (konvensi BMD sisi tarik)
    var sy = function (y) {
      var t = (y - ymin) / (ymax - ymin);
      return opt.invert ? padT + t * (H - padT - padB) : H - padB - t * (H - padT - padB);
    };

    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': opt.label || 'diagram' });
    var color = opt.color || 'var(--blue)';

    // area
    var d = 'M' + sx(xs[0]) + ' ' + sy(0);
    for (var i = 0; i < xs.length; i++) d += ' L' + sx(xs[i]).toFixed(2) + ' ' + sy(ys[i]).toFixed(2);
    d += ' L' + sx(L) + ' ' + sy(0) + ' Z';
    svg.appendChild(el('path', { d: d, fill: color, 'fill-opacity': '0.15', stroke: 'none' }));
    var line = 'M' + sx(xs[0]).toFixed(2) + ' ' + sy(ys[0]).toFixed(2);
    for (i = 1; i < xs.length; i++) line += ' L' + sx(xs[i]).toFixed(2) + ' ' + sy(ys[i]).toFixed(2);
    svg.appendChild(el('path', { d: line, fill: 'none', stroke: color, 'stroke-width': 2 }));

    // sumbu nol
    svg.appendChild(el('line', { x1: sx(0), x2: sx(L), y1: sy(0), y2: sy(0), stroke: 'var(--muted)', 'stroke-width': 1 }));

    // tick x
    var step = niceStep(L / 6);
    for (var x = 0; x <= L + 1e-9; x += step) {
      svg.appendChild(el('line', { x1: sx(x), x2: sx(x), y1: H - padB, y2: H - padB + 4, stroke: 'var(--muted)' }));
      svg.appendChild(el('text', { x: sx(x), y: H - 8, 'text-anchor': 'middle', 'font-size': 11, fill: 'var(--muted)' }, fmt(x, step < 1 ? 1 : 0)));
    }
    svg.appendChild(el('text', { x: W - padR, y: 14, 'text-anchor': 'end', 'font-size': 11, fill: 'var(--muted)' }, 'x (m)'));
    svg.appendChild(el('text', { x: 4, y: 14, 'font-size': 11, fill: 'var(--muted)' }, opt.unit || ''));

    // label ekstrem
    var iMax = 0, iMin = 0;
    for (i = 1; i < ys.length; i++) { if (ys[i] > ys[iMax]) iMax = i; if (ys[i] < ys[iMin]) iMin = i; }
    [[iMax, ys[iMax] > 1e-9], [iMin, ys[iMin] < -1e-9]].forEach(function (p) {
      if (!p[1]) return;
      var j = p[0], px = sx(xs[j]), py = sy(ys[j]);
      var below = (py < H / 2);
      svg.appendChild(el('circle', { cx: px, cy: py, r: 3, fill: color }));
      var anchor = px < padL + 60 ? 'start' : (px > W - padR - 60 ? 'end' : 'middle');
      svg.appendChild(el('text', { x: px, y: below ? py - 6 : py + 14, 'text-anchor': anchor, 'font-size': 12, 'font-weight': 700, fill: 'var(--text)' },
        fmt(ys[j], opt.decimals) + (opt.short ? ' ' + opt.short : '')));
    });

    container.innerHTML = '';
    container.appendChild(svg);
  }

  function niceStep(raw) {
    var p = Math.pow(10, Math.floor(Math.log10(raw)));
    var n = raw / p;
    return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * p;
  }

  return { el: el, fmt: fmt, diagram: diagram, NS: NS };
})();
