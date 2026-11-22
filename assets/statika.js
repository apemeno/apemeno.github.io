// UI kalkulator statika multi-kasus.
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var fmt = Plot.fmt, el = Plot.el;
  var E = 2e8; // kN/m² (nilai mutlak tidak memengaruhi gaya dalam; yang berpengaruh rasio I)
  var current = 'menerus';
  var FS = 12; // ukuran huruf diagram, diperbesar di layar sempit

  var state = {
    menerus: { n: 3, spans: [5, 6, 5, 5, 5], q: [10, 10, 10, 10, 10], P: [0, 20, 0, 0, 0], a: [2.5, 3, 2.5, 2.5, 2.5], left: 'sendi', right: 'rol' },
    miring: { Lx: 4, h: 3, q: 10, qMode: 'horizontal', P: 0, aP: 2, top: 'rol' },
    portal: { L: 6, H: 4, base: 'sendi-sendi', q: 10, P: 0, aP: 3, Hx: 10, Ic: 100, Ib: 200 }
  };

  // ---------- form ----------
  function num(id, label, v, extra) {
    return '<div><label for="' + id + '">' + label + '</label><input id="' + id + '" data-k="' + id + '" type="number" step="any" value="' + v + '"' + (extra || '') + '></div>';
  }
  function sel(id, label, opts, v) {
    return '<div><label for="' + id + '">' + label + '</label><select id="' + id + '" data-k="' + id + '">' +
      opts.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === v ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></div>';
  }

  function renderForm() {
    var s = state[current], h = '';
    if (current === 'menerus') {
      h += '<fieldset><legend>Tumpuan</legend><div class="row">' +
        sel('n', 'Jumlah bentang', [[1, '1'], [2, '2'], [3, '3'], [4, '4'], [5, '5']].map(function (o) { return [String(o[0]), o[1]]; }), String(s.n)) +
        sel('left', 'Ujung kiri', [['sendi', 'Sendi'], ['jepit', 'Jepit']], s.left) +
        sel('right', 'Ujung kanan', [['rol', 'Rol'], ['jepit', 'Jepit']], s.right) + '</div>' +
        '<p class="hint">Tumpuan tengah berupa rol. EI dianggap sama di semua bentang.</p></fieldset>';
      for (var k = 0; k < s.n; k++) {
        h += '<fieldset><legend>Bentang ' + (k + 1) + '</legend><div class="row">' +
          num('L' + k, 'L (m)', s.spans[k]) + num('q' + k, 'q (kN/m)', s.q[k]) + '</div><div class="row">' +
          num('P' + k, 'P (kN)', s.P[k]) + num('a' + k, 'a dari kiri bentang (m)', s.a[k]) + '</div></fieldset>';
      }
    } else if (current === 'miring') {
      h += '<fieldset><legend>Geometri</legend><div class="row">' +
        num('Lx', 'Bentang horizontal Lx (m)', s.Lx) + num('h', 'Beda tinggi h (m)', s.h) + '</div>' +
        '<p class="hint" id="geo"></p>' +
        sel('top', 'Tumpuan atas (B)', [['rol', 'Rol (reaksi vertikal)'], ['sendi', 'Sendi']], s.top) +
        '<p class="hint">Tumpuan bawah (A) berupa sendi.</p></fieldset>' +
        '<fieldset><legend>Beban</legend><div class="row">' + num('q', 'q (kN/m)', s.q) + '</div>' +
        sel('qMode', 'q bekerja per', [['horizontal', 'panjang horizontal (mis. beban hidup tangga)'], ['miring', 'panjang miring (mis. berat sendiri)']], s.qMode) +
        '<div class="row">' + num('P', 'P vertikal (kN)', s.P) + num('aP', 'jarak horizontal dari A (m)', s.aP) + '</div></fieldset>';
    } else {
      h += '<fieldset><legend>Geometri &amp; tumpuan</legend><div class="row">' +
        num('L', 'Lebar L (m)', s.L) + num('H', 'Tinggi H (m)', s.H) + '</div>' +
        sel('base', 'Tumpuan kaki', [['sendi-rol', 'Sendi – rol'], ['sendi-sendi', 'Sendi – sendi'], ['jepit-jepit', 'Jepit – jepit']], s.base) +
        '</fieldset><fieldset><legend>Beban</legend><div class="row">' +
        num('q', 'q pada balok (kN/m)', s.q) + num('Hx', 'Beban horizontal di puncak kiri (kN)', s.Hx) + '</div><div class="row">' +
        num('P', 'P pada balok (kN)', s.P) + num('aP', 'a dari kiri (m)', s.aP) + '</div></fieldset>' +
        '<fieldset><legend>Kekakuan relatif</legend><div class="row">' +
        num('Ic', 'I kolom (×10⁶ mm⁴)', s.Ic) + num('Ib', 'I balok (×10⁶ mm⁴)', s.Ib) + '</div>' +
        '<p class="hint">Hanya berpengaruh pada portal statis tak tentu (sendi–sendi, jepit–jepit).</p></fieldset>';
    }
    h += '<div class="error" id="err"></div>';
    $('form').innerHTML = h;
    $('form').querySelectorAll('input,select').forEach(function (i) {
      i.addEventListener(i.tagName === 'SELECT' ? 'change' : 'input', function () {
        read();
        if (i.dataset.k === 'n') renderForm();
        update();
      });
    });
  }

  function read() {
    var s = state[current];
    $('form').querySelectorAll('input,select').forEach(function (i) {
      var k = i.dataset.k, v = i.tagName === 'SELECT' ? i.value : parseFloat(i.value);
      var m = /^([LqPa])(\d)$/.exec(k);
      if (current === 'menerus' && m) {
        var arr = { L: 'spans', q: 'q', P: 'P', a: 'a' }[m[1]];
        s[arr][+m[2]] = v;
      } else if (k === 'n') s.n = +v;
      else s[k] = v;
    });
  }

  // ---------- model ----------
  function build() {
    var s = state[current], err = [];
    var bad = function (v) { return !isFinite(v); };
    if (current === 'menerus') {
      var spans = s.spans.slice(0, s.n), P = [];
      for (var k = 0; k < s.n; k++) {
        if (!(spans[k] > 0)) err.push('Panjang bentang ' + (k + 1) + ' harus > 0.');
        if (bad(s.q[k]) || bad(s.P[k]) || bad(s.a[k])) err.push('Lengkapi data bentang ' + (k + 1) + '.');
        else if (s.P[k] && (s.a[k] < 0 || s.a[k] > spans[k])) err.push('Posisi P di bentang ' + (k + 1) + ' harus di antara 0 dan L.');
        P.push(s.P[k] ? { P: s.P[k], a: s.a[k] } : null);
      }
      if (s.n === 1 && s.left === 'sendi' && s.right === 'rol') { /* balok sederhana, tetap stabil */ }
      return { err: err, model: Cases.continuous({ spans: spans, q: s.q.slice(0, s.n), P: P, left: s.left, right: s.right, E: E, I: 1e-4 }) };
    }
    if (current === 'miring') {
      if (!(s.Lx > 0)) err.push('Lx harus > 0.');
      if (bad(s.h) || s.h < 0) err.push('h harus ≥ 0.');
      if (bad(s.q) || bad(s.P) || bad(s.aP)) err.push('Lengkapi data beban.');
      else if (s.P && (s.aP < 0 || s.aP > s.Lx)) err.push('Posisi P harus di antara 0 dan Lx.');
      var Lm = Math.hypot(s.Lx, s.h);
      var g = $('geo'); if (g && Lm > 0) g.textContent = 'Panjang miring = ' + fmt(Lm, 2) + ' m · sudut α = ' + fmt(Math.atan2(s.h, s.Lx) * 180 / Math.PI, 1) + '°';
      return { err: err, model: Cases.inclined({ Lx: s.Lx, h: s.h, q: s.q, qMode: s.qMode, P: s.P, aP: s.aP, bottom: 'sendi', top: s.top, E: E, I: 1e-4 }) };
    }
    if (!(s.L > 0) || !(s.H > 0)) err.push('L dan H harus > 0.');
    if (!(s.Ic > 0) || !(s.Ib > 0)) err.push('I kolom dan I balok harus > 0.');
    if (bad(s.q) || bad(s.P) || bad(s.aP) || bad(s.Hx)) err.push('Lengkapi data beban.');
    else if (s.P && (s.aP < 0 || s.aP > s.L)) err.push('Posisi P harus di antara 0 dan L.');
    return { err: err, model: Cases.portal({ L: s.L, H: s.H, base: s.base, q: s.q, Hx: s.Hx, P: s.P, aP: s.aP, E: E, Ic: s.Ic * 1e-6, Ib: s.Ib * 1e-6 }) };
  }

  // ---------- gambar ----------
  function view(model, opts) {
    var xs = model.nodes.map(function (n) { return n.x; }), ys = model.nodes.map(function (n) { return n.y; });
    var minx = Math.min.apply(null, xs), maxx = Math.max.apply(null, xs), miny = Math.min.apply(null, ys), maxy = Math.max.apply(null, ys);
    var sx = maxx - minx, sy = maxy - miny, size = Math.max(sx, sy, 1);
    var D = (opts.D != null ? opts.D : 0.2) * size;   // tinggi maksimum diagram (satuan model)
    var W = 680, padX = 56, padTop = opts.padTop, padBot = opts.padBot, maxH = 400;
    var s = Math.min((W - 2 * padX) / (sx + 2 * D), (maxH - padTop - padBot) / (sy + 2 * D));
    var H = Math.max(140, (sy + 2 * D) * s + padTop + padBot);
    var ox = (W - (sx + 2 * D) * s) / 2 + D * s - minx * s, oy = H - padBot - D * s + miny * s;
    return { W: W, H: H, D: D, s: s, X: function (x) { return ox + x * s; }, Y: function (y) { return oy - y * s; } };
  }

  function drawSupports(g, v, model, res, showR) {
    model.supports.forEach(function (sp) {
      var n = model.nodes[sp.node], x = v.X(n.x), y = v.Y(n.y), st = { fill: 'none', stroke: 'var(--text)', 'stroke-width': 1.6 };
      if (sp.type === 'jepit') {
        g.appendChild(el('path', { d: 'M' + (x - 16) + ' ' + (y + 2) + 'H' + (x + 16), stroke: 'var(--text)', 'stroke-width': 3 }));
        for (var k = -16; k < 16; k += 6) g.appendChild(el('path', { d: 'M' + (x + k) + ' ' + (y + 4) + 'l6 8', stroke: 'var(--muted)', 'stroke-width': 1.2 }));
      } else {
        g.appendChild(el('path', Object.assign({ d: 'M' + x + ' ' + y + 'l-10 16h20z' }, st)));
        if (sp.type === 'rol') g.appendChild(el('path', { d: 'M' + (x - 13) + ' ' + (y + 21) + 'h26', stroke: 'var(--text)', 'stroke-width': 1.6 }));
        else for (var j = -12; j < 12; j += 6) g.appendChild(el('path', { d: 'M' + (x + j) + ' ' + (y + 18) + 'l5 6', stroke: 'var(--muted)', 'stroke-width': 1.2 }));
      }
      if (showR) {
        var r = res.reactions.filter(function (q) { return q.node === sp.node; })[0], lines = [];
        if (sp.ux && Math.abs(r.rx) > 1e-6) lines.push('H = ' + fmt(r.rx, 2));
        if (sp.uy) lines.push('V = ' + fmt(r.ry, 2));
        if (sp.rz) lines.push('M = ' + fmt(r.m, 2));
        lines.forEach(function (t, k) {
          g.appendChild(el('text', { x: x, y: y + 26 + FS + k * FS * 1.2, 'text-anchor': 'middle', 'font-size': FS, 'font-weight': 600, fill: 'var(--green)' }, t));
        });
      }
    });
  }

  function arrowHead(x, y, dx, dy, color) {
    var L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, s = 7;
    return el('path', { d: 'M' + x + ' ' + y + 'L' + (x - ux * s - uy * s * .6) + ' ' + (y - uy * s + ux * s * .6) + 'L' + (x - ux * s + uy * s * .6) + ' ' + (y - uy * s - ux * s * .6) + 'Z', fill: color });
  }

  function drawStruct(model, res) {
    var v = view(model, { padTop: 70, padBot: 76, D: 0.04 });
    var svg = el('svg', { viewBox: '0 0 ' + v.W + ' ' + v.H, role: 'img', 'aria-label': 'Gambar struktur dan beban' });
    var col = 'var(--accent)';
    // beban batang
    var maxq = 0;
    model.members.forEach(function (m) { (m.loads || []).forEach(function (l) { if (l.type === 'udl') maxq = Math.max(maxq, Math.abs(l.qy) / (current === 'miring' && state.miring.qMode === 'horizontal' ? m.c : 1)); }); });
    model.members.forEach(function (m) {
      var ni = model.nodes[m.i], nj = model.nodes[m.j];
      (m.loads || []).forEach(function (l) {
        if (l.type === 'udl') {
          var qShow = Math.abs(l.qy) / (current === 'miring' && state.miring.qMode === 'horizontal' ? m.c : 1);
          var hgt = 14 + 18 * qShow / (maxq || 1), n = Math.max(3, Math.round(Math.hypot(v.X(nj.x) - v.X(ni.x), v.Y(nj.y) - v.Y(ni.y)) / 28));
          var top = [];
          for (var k = 0; k <= n; k++) {
            var t = k / n, x = v.X(ni.x + (nj.x - ni.x) * t), y = v.Y(ni.y + (nj.y - ni.y) * t) - 4;
            top.push([x, y - hgt]);
            svg.appendChild(el('path', { d: 'M' + x + ' ' + (y - hgt) + 'V' + (y - 5), stroke: col, 'stroke-width': 1.2 }));
            svg.appendChild(arrowHead(x, y, 0, 1, col));
          }
          svg.appendChild(el('path', { d: 'M' + top.map(function (p) { return p.join(' '); }).join('L'), fill: 'none', stroke: col, 'stroke-width': 1.4 }));
          var mid = top[Math.floor(top.length / 4)];
          svg.appendChild(el('text', { x: mid[0], y: mid[1] - 6, 'text-anchor': 'middle', 'font-size': FS, fill: col, 'font-weight': 600 }, fmt(qShow, 1) + ' kN/m'));
        } else {
          var px = v.X(ni.x + (nj.x - ni.x) * l.a / m.L), py = v.Y(ni.y + (nj.y - ni.y) * l.a / m.L) - 4;
          svg.appendChild(el('path', { d: 'M' + px + ' ' + (py - 44) + 'V' + (py - 5), stroke: 'var(--cyan)', 'stroke-width': 2 }));
          svg.appendChild(arrowHead(px, py, 0, 1, 'var(--cyan)'));
          svg.appendChild(el('text', { x: px + 6, y: py - 34, 'font-size': FS, fill: 'var(--cyan)', 'font-weight': 700 }, fmt(-l.py, 1) + ' kN'));
        }
      });
    });
    (model.nodalLoads || []).forEach(function (l) {
      if (!l.fx) return;
      var n = model.nodes[l.node], x = v.X(n.x), y = v.Y(n.y), d = l.fx > 0 ? 1 : -1;
      svg.appendChild(el('path', { d: 'M' + (x - d * 52) + ' ' + y + 'H' + (x - d * 6), stroke: 'var(--cyan)', 'stroke-width': 2 }));
      svg.appendChild(arrowHead(x - d * 2, y, d, 0, 'var(--cyan)'));
      svg.appendChild(el('text', { x: x - d * 56, y: y - 8, 'text-anchor': d > 0 ? 'start' : 'end', 'font-size': FS, fill: 'var(--cyan)', 'font-weight': 700 }, fmt(Math.abs(l.fx), 1) + ' kN'));
    });
    // batang
    model.members.forEach(function (m) {
      var a = model.nodes[m.i], b = model.nodes[m.j];
      svg.appendChild(el('line', { x1: v.X(a.x), y1: v.Y(a.y), x2: v.X(b.x), y2: v.Y(b.y), stroke: 'var(--text)', 'stroke-width': 5, 'stroke-linecap': 'round' }));
    });
    // dimensi bentang (balok menerus)
    if (current === 'menerus') {
      var y0 = v.Y(0) + 64;
      model.members.forEach(function (m) {
        var a = model.nodes[m.i], b = model.nodes[m.j];
        svg.appendChild(el('text', { x: (v.X(a.x) + v.X(b.x)) / 2, y: v.Y(0) + 16, 'text-anchor': 'middle', 'font-size': FS * 0.92, fill: 'var(--muted)' }, fmt(m.L, 2) + ' m'));
      });
    }
    drawSupports(svg, v, model, res, true);
    return svg;
  }

  function drawDiagram(model, res, key, color) {
    var v = view(model, { padTop: 20, padBot: 30 });
    var svg = el('svg', { viewBox: '0 0 ' + v.W + ' ' + v.H, role: 'img', 'aria-label': 'Diagram ' + key });
    var vmax = 0;
    res.members.forEach(function (m) { m.diag.forEach(function (p) { vmax = Math.max(vmax, Math.abs(p[key])); }); });
    var labels = [];
    res.members.forEach(function (m) {
      var a = model.nodes[m.i], nx = -m.s, ny = m.c, sign = key === 'M' ? -1 : 1;
      var pt = function (p) {
        var off = vmax > 1e-9 ? sign * p[key] / vmax * v.D : 0;
        return [v.X(a.x + m.c * p.x + nx * off), v.Y(a.y + m.s * p.x + ny * off), off];
      };
      var d = 'M' + v.X(a.x) + ' ' + v.Y(a.y);
      m.diag.forEach(function (p) { var q = pt(p); d += 'L' + q[0].toFixed(1) + ' ' + q[1].toFixed(1); });
      var b = model.nodes[m.j];
      d += 'L' + v.X(b.x) + ' ' + v.Y(b.y) + 'Z';
      svg.appendChild(el('path', { d: d, fill: color, 'fill-opacity': .16, stroke: color, 'stroke-width': 1.8, 'stroke-linejoin': 'round' }));
      // label: ujung + ekstrem interior
      var pts = m.diag, cand = [pts[0], pts[pts.length - 1]], iMax = 0, iMin = 0;
      pts.forEach(function (p, k) { if (p[key] > pts[iMax][key]) iMax = k; if (p[key] < pts[iMin][key]) iMin = k; });
      [iMax, iMin].forEach(function (k) { if (k > 0 && k < pts.length - 1) cand.push(pts[k]); });
      // lompatan pada beban terpusat (V, N)
      for (var k = 1; k < pts.length; k++) if (pts[k].x === pts[k - 1].x && Math.abs(pts[k][key] - pts[k - 1][key]) > 1e-6) cand.push(pts[k - 1], pts[k]);
      cand.forEach(function (p) {
        if (Math.abs(p[key]) < Math.max(0.01, vmax * 0.02)) return;
        var q = pt(p), dir = q[2] >= 0 ? 1 : -1;
        var lx = q[0] + nx * dir * 12 * (key === 'M' ? 1 : 1), ly = q[1] - ny * dir * 12;
        if (labels.some(function (o) { return Math.hypot(o[0] - lx, o[1] - ly) < 26 && Math.abs(o[2] - p[key]) < 0.02 * vmax + 0.01; })) return;
        if (labels.some(function (o) { return Math.hypot(o[0] - lx, o[1] - ly) < 14; })) return;
        labels.push([lx, ly, p[key]]);
        svg.appendChild(el('text', { x: lx, y: ly + 4, 'text-anchor': Math.abs(nx) > 0.5 ? (nx * dir > 0 ? 'start' : 'end') : 'middle', 'font-size': FS, 'font-weight': 700, fill: 'var(--text)' }, fmt(p[key], 2)));
      });
    });
    model.members.forEach(function (m) {
      var a = model.nodes[m.i], b = model.nodes[m.j];
      svg.appendChild(el('line', { x1: v.X(a.x), y1: v.Y(a.y), x2: v.X(b.x), y2: v.Y(b.y), stroke: 'var(--muted)', 'stroke-width': 2 }));
    });
    drawSupports(svg, v, model, res, false);
    if (vmax < 1e-6) svg.appendChild(el('text', { x: v.W / 2, y: 18, 'text-anchor': 'middle', 'font-size': FS, fill: 'var(--muted)' }, 'Nol di seluruh batang'));
    return svg;
  }

  // ---------- update ----------
  function update() {
    read();
    var b = build();
    $('err').textContent = b.err.join(' ');
    if (b.err.length) return;
    var cw = $('d-struct').clientWidth || 680;
    FS = Math.min(22, 12 * Math.max(1, 0.7 * 680 / cw));
    var res = Frame.solve(b.model);
    if (res.error) { $('err').textContent = res.error; return; }

    var all = [];
    res.members.forEach(function (m) { all = all.concat(m.diag); });
    var ext = function (k, f) { return all.reduce(function (a, p) { return f(p[k], a) ? p[k] : a; }, 0); };
    var stats = [
      ['M maks (+)', ext('M', function (x, a) { return x > a; }), 'kN·m'],
      ['M min (−)', ext('M', function (x, a) { return x < a; }), 'kN·m'],
      ['|V| maks', Math.abs(ext('V', function (x, a) { return Math.abs(x) > Math.abs(a); })), 'kN'],
      ['N terbesar', ext('N', function (x, a) { return Math.abs(x) > Math.abs(a); }), 'kN']
    ];
    $('results').innerHTML = stats.map(function (s) {
      return '<div class="stat"><div class="k">' + s[0] + '</div><div class="v">' + fmt(s[1], 2) + ' <span class="u">' + s[2] + '</span></div></div>';
    }).join('');

    put('d-struct', drawStruct(b.model, res));
    put('d-M', drawDiagram(b.model, res, 'M', 'var(--accent)'));
    put('d-V', drawDiagram(b.model, res, 'V', 'var(--cyan)'));
    put('d-N', drawDiagram(b.model, res, 'N', 'var(--green)'));
    $('wrap-N').style.display = current === 'menerus' ? 'none' : '';

    var names = current === 'portal' ? ['A (kiri)', '', '', 'D (kanan)'] : null;
    $('t-react').innerHTML = '<tr><th>Tumpuan</th><th>Jenis</th><th class="num">H (kN) →</th><th class="num">V (kN) ↑</th><th class="num">M (kN·m) ↺</th></tr>' +
      res.reactions.map(function (r) {
        var sp = b.model.supports.filter(function (s) { return s.node === r.node; })[0];
        var nm = names ? names[r.node] : String.fromCharCode(65 + r.node);
        return '<tr><td>' + nm + '</td><td>' + sp.type + '</td><td class="num">' + (sp.ux ? fmt(r.rx, 2) : '–') + '</td><td class="num">' + fmt(r.ry, 2) +
          '</td><td class="num">' + (sp.rz ? fmt(r.m, 2) : '–') + '</td></tr>';
      }).join('');

    $('t-member').innerHTML = '<tr><th>Batang</th><th class="num">L (m)</th><th class="num">M maks</th><th class="num">M min</th><th class="num">|V| maks</th><th class="num">N</th></tr>' +
      res.members.map(function (m, k) {
        var mx = -Infinity, mn = Infinity, vm = 0, nm = 0;
        m.diag.forEach(function (p) { mx = Math.max(mx, p.M); mn = Math.min(mn, p.M); vm = Math.max(vm, Math.abs(p.V)); if (Math.abs(p.N) > Math.abs(nm)) nm = p.N; });
        var nmz = m.name || (current === 'menerus' ? 'Bentang ' + (k + 1) : 'Balok A–B');
        return '<tr><td>' + nmz + '</td><td class="num">' + fmt(m.L, 2) + '</td><td class="num">' + fmt(mx, 2) + '</td><td class="num">' + fmt(mn, 2) +
          '</td><td class="num">' + fmt(vm, 2) + '</td><td class="num">' + fmt(nm, 2) + '</td></tr>';
      }).join('');

    var notes = {
      menerus: 'Dihitung dengan metode kekakuan (setara metode Cross / tiga momen). Momen negatif di atas tumpuan tengah menandakan serat atas tertarik.',
      miring: 'Gaya normal muncul karena beban vertikal tidak tegak lurus batang. Komponen tegak lurus menghasilkan geser dan momen.',
      portal: 'Tanda momen: positif bila serat sisi dalam portal tertarik. Diagram digambar di sisi serat yang tertarik.'
    };
    $('note').textContent = notes[current];
  }
  function put(id, svg) { $(id).innerHTML = ''; $(id).appendChild(svg); }

  // ---------- tab ----------
  $('tabs').querySelectorAll('button').forEach(function (bt) {
    bt.addEventListener('click', function () {
      current = bt.dataset.case;
      $('tabs').querySelectorAll('button').forEach(function (o) { o.setAttribute('aria-selected', o === bt ? 'true' : 'false'); });
      try { history.replaceState(null, '', '#' + current); } catch (e) {}
      renderForm(); update();
    });
  });
  var hash = (location.hash || '').slice(1);
  if (state[hash]) { current = hash; $('tabs').querySelectorAll('button').forEach(function (o) { o.setAttribute('aria-selected', o.dataset.case === hash ? 'true' : 'false'); }); }
  renderForm(); update();
})();
