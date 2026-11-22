// Kalkulator properti penampang. Dimensi dalam mm.
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var fmt = Plot.fmt, el = Plot.el;

  var SHAPES = {
    wf:     { fields: [['H', 'Tinggi H', 300], ['B', 'Lebar sayap B', 150], ['tw', 'Tebal badan tw', 6.5], ['tf', 'Tebal sayap tf', 9]] },
    rect:   { fields: [['b', 'Lebar b', 300], ['h', 'Tinggi h', 500]] },
    box:    { fields: [['B', 'Lebar B', 200], ['H', 'Tinggi H', 300], ['t', 'Tebal t', 10]] },
    circle: { fields: [['D', 'Diameter D', 400]] },
    pipe:   { fields: [['D', 'Diameter luar D', 168.3], ['t', 'Tebal t', 7.1]] },
    tee:    { fields: [['bf', 'Lebar sayap bf', 300], ['tf', 'Tebal sayap tf', 50], ['bw', 'Lebar badan bw', 50], ['hw', 'Tinggi badan hw', 250]] }
  };

  // Penampang gabungan dari persegi: {name, x, y, w, h, s} (s = +1 tambah, -1 rongga), y dari bawah.
  function rects(shape, d) {
    switch (shape) {
      case 'rect': return [{ name: 'Persegi', x: 0, y: 0, w: d.b, h: d.h, s: 1 }];
      case 'wf': {
        var hw = d.H - 2 * d.tf;
        return [
          { name: 'Sayap bawah', x: 0, y: 0, w: d.B, h: d.tf, s: 1 },
          { name: 'Badan', x: (d.B - d.tw) / 2, y: d.tf, w: d.tw, h: hw, s: 1 },
          { name: 'Sayap atas', x: 0, y: d.H - d.tf, w: d.B, h: d.tf, s: 1 }
        ];
      }
      case 'box': return [
        { name: 'Luar', x: 0, y: 0, w: d.B, h: d.H, s: 1 },
        { name: 'Rongga', x: d.t, y: d.t, w: d.B - 2 * d.t, h: d.H - 2 * d.t, s: -1 }
      ];
      case 'tee': {
        var W = Math.max(d.bf, d.bw);
        return [
          { name: 'Badan', x: (W - d.bw) / 2, y: 0, w: d.bw, h: d.hw, s: 1 },
          { name: 'Sayap', x: (W - d.bf) / 2, y: d.hw, w: d.bf, h: d.tf, s: 1 }
        ];
      }
    }
    return null;
  }

  function validate(shape, d) {
    for (var k in d) if (!(d[k] > 0)) return 'Semua dimensi harus lebih dari 0.';
    if (shape === 'wf' && (2 * d.tf >= d.H || d.tw >= d.B)) return 'Tebal sayap/badan terlalu besar dibanding H atau B.';
    if (shape === 'box' && (2 * d.t >= d.B || 2 * d.t >= d.H)) return 'Tebal dinding terlalu besar.';
    if (shape === 'pipe' && 2 * d.t >= d.D) return 'Tebal pipa harus kurang dari D/2.';
    return '';
  }

  function compute(shape, d) {
    var R = rects(shape, d), out = { parts: [] };
    if (R) {
      var A = 0, Ay = 0, Ax = 0, W = 0, H = 0;
      R.forEach(function (r) {
        var a = r.s * r.w * r.h; A += a; Ay += a * (r.y + r.h / 2); Ax += a * (r.x + r.w / 2);
        W = Math.max(W, r.x + r.w); H = Math.max(H, r.y + r.h);
      });
      var yb = Ay / A, xb = Ax / A, Ix = 0, Iy = 0;
      R.forEach(function (r) {
        var a = r.s * r.w * r.h, dy = r.y + r.h / 2 - yb, dx = r.x + r.w / 2 - xb;
        var I0 = r.s * r.w * Math.pow(r.h, 3) / 12;
        Ix += I0 + a * dy * dy;
        Iy += r.s * r.h * Math.pow(r.w, 3) / 12 + a * dx * dx;
        out.parts.push({ name: r.name, A: a, y: r.y + r.h / 2, I0: I0, d: dy, Ad2: a * dy * dy });
      });
      Object.assign(out, { A: A, yb: yb, xb: xb, Ix: Ix, Iy: Iy, W: W, H: H, rects: R });
    } else {
      var D = d.D, Di = shape === 'pipe' ? D - 2 * d.t : 0;
      var A2 = Math.PI / 4 * (D * D - Di * Di), I = Math.PI / 64 * (Math.pow(D, 4) - Math.pow(Di, 4));
      Object.assign(out, { A: A2, yb: D / 2, xb: D / 2, Ix: I, Iy: I, W: D, H: D, D: D, Di: Di });
    }
    out.Sxt = out.Ix / (out.H - out.yb);
    out.Sxb = out.Ix / out.yb;
    out.Sy = out.Iy / Math.max(out.xb, out.W - out.xb);
    out.rx = Math.sqrt(out.Ix / out.A);
    out.ry = Math.sqrt(out.Iy / out.A);
    out.mass = out.A * 7.85e-3; // kg/m untuk baja ρ = 7850 kg/m³
    return out;
  }

  function sketch(shape, P) {
    var S = 260, pad = 30, sc = (S - 2 * pad) / Math.max(P.W, P.H);
    var ox = (S - P.W * sc) / 2, oy = (S + P.H * sc) / 2;
    var X = function (x) { return ox + x * sc; }, Y = function (y) { return oy - y * sc; };
    var svg = el('svg', { viewBox: '0 0 ' + S + ' ' + S, role: 'img', 'aria-label': 'Sketsa penampang', style: 'max-width:320px;margin:0 auto' });
    var fill = 'var(--accent)';
    if (P.rects) {
      P.rects.forEach(function (r) {
        svg.appendChild(el('rect', { x: X(r.x), y: Y(r.y + r.h), width: r.w * sc, height: r.h * sc,
          fill: r.s > 0 ? fill : 'var(--surface)', 'fill-opacity': r.s > 0 ? .35 : 1, stroke: 'var(--accent)', 'stroke-width': 1.5 }));
      });
    } else {
      svg.appendChild(el('circle', { cx: X(P.D / 2), cy: Y(P.D / 2), r: P.D / 2 * sc, fill: fill, 'fill-opacity': .35, stroke: 'var(--accent)', 'stroke-width': 1.5 }));
      if (P.Di > 0) svg.appendChild(el('circle', { cx: X(P.D / 2), cy: Y(P.D / 2), r: P.Di / 2 * sc, fill: 'var(--surface)', stroke: 'var(--accent)', 'stroke-width': 1.5 }));
    }
    // sumbu netral
    svg.appendChild(el('line', { x1: 6, x2: S - 6, y1: Y(P.yb), y2: Y(P.yb), stroke: 'var(--blue)', 'stroke-dasharray': '5 4' }));
    svg.appendChild(el('text', { x: S - 6, y: Y(P.yb) - 4, 'text-anchor': 'end', 'font-size': 11, fill: 'var(--blue)' }, 'x'));
    svg.appendChild(el('line', { x1: X(P.xb), x2: X(P.xb), y1: 6, y2: S - 6, stroke: 'var(--blue)', 'stroke-dasharray': '5 4', 'stroke-opacity': .6 }));
    svg.appendChild(el('text', { x: X(P.xb) + 4, y: 14, 'font-size': 11, fill: 'var(--blue)' }, 'y'));
    svg.appendChild(el('circle', { cx: X(P.xb), cy: Y(P.yb), r: 3.5, fill: 'var(--blue)' }));
    svg.appendChild(el('text', { x: X(P.xb) + 6, y: Y(P.yb) + 14, 'font-size': 11, fill: 'var(--text)' }, 'ȳ = ' + fmt(P.yb, 1)));
    $('sketch').innerHTML = '';
    $('sketch').appendChild(svg);
  }

  function renderFields(shape, preset) {
    $('dims').innerHTML = SHAPES[shape].fields.map(function (f) {
      var v = preset && preset[f[0]] != null ? preset[f[0]] : f[2];
      return '<div><label for="d_' + f[0] + '">' + f[1] + '</label><input id="d_' + f[0] + '" data-k="' + f[0] + '" type="number" step="any" value="' + v + '"></div>';
    }).join('');
    $('dims').querySelectorAll('input').forEach(function (i) { i.addEventListener('input', update); });
  }

  function update() {
    var shape = $('shape').value, d = {};
    $('dims').querySelectorAll('input').forEach(function (i) { d[i.dataset.k] = parseFloat(i.value); });
    var e = validate(shape, d);
    $('err').textContent = e;
    if (e) return;
    var P = compute(shape, d);
    sketch(shape, P);

    var stats = [
      ['Luas A', P.A, 'mm²', 0],
      ['Titik berat ȳ (dari bawah)', P.yb, 'mm', 1],
      ['Ix', P.Ix / 1e6, '×10⁶ mm⁴', 2],
      ['Iy', P.Iy / 1e6, '×10⁶ mm⁴', 2],
      ['Sx atas', P.Sxt / 1e3, '×10³ mm³', 1],
      ['Sx bawah', P.Sxb / 1e3, '×10³ mm³', 1],
      ['Sy', P.Sy / 1e3, '×10³ mm³', 1],
      ['rx', P.rx, 'mm', 1],
      ['ry', P.ry, 'mm', 1],
      ['Berat (jika baja)', P.mass, 'kg/m', 1]
    ];
    $('results').innerHTML = stats.map(function (s) {
      return '<div class="stat"><div class="k">' + s[0] + '</div><div class="v">' + fmt(s[1], s[3]) + ' <span class="u">' + s[2] + '</span></div></div>';
    }).join('');

    if (P.parts.length) {
      $('table').innerHTML = '<tr><th>Bagian</th><th class="num">A (mm²)</th><th class="num">y (mm)</th><th class="num">I₀ (mm⁴)</th><th class="num">d (mm)</th><th class="num">A·d² (mm⁴)</th></tr>' +
        P.parts.map(function (p) {
          return '<tr><td>' + p.name + '</td><td class="num">' + fmt(p.A, 0) + '</td><td class="num">' + fmt(p.y, 2) + '</td><td class="num">' + fmt(p.I0, 0) +
            '</td><td class="num">' + fmt(p.d, 2) + '</td><td class="num">' + fmt(p.Ad2, 0) + '</td></tr>';
        }).join('') +
        '<tr><th>Total</th><th class="num">' + fmt(P.A, 0) + '</th><th class="num">ȳ = ' + fmt(P.yb, 2) + '</th><th colspan="3" class="num">Ix = ΣI₀ + ΣA·d² = ' + fmt(P.Ix, 0) + ' mm⁴</th></tr>';
    } else {
      $('table').innerHTML = '<tr><td>Rumus: A = π(D² − d²)/4, I = π(D⁴ − d⁴)/64 dengan d = diameter dalam (' + fmt(P.Di, 1) + ' mm).</td></tr>';
    }
  }

  $('shape').addEventListener('change', function () { renderFields($('shape').value); update(); });

  if (/contoh=1/.test(location.search)) {
    $('shape').value = 'tee';
    renderFields('tee', { bf: 300, tf: 50, bw: 50, hw: 250 });
  } else {
    renderFields($('shape').value);
  }
  update();
})();
