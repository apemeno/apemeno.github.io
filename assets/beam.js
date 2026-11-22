// Kalkulator balok: sendi–rol atau kantilever, beban terpusat & merata.
// Satuan: kN, m, kN/m. E dalam MPa, I dalam 10^6 mm^4, lendutan dalam mm.
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var fmt = Plot.fmt, el = Plot.el;
  var loads = [];

  // ---------- analisis ----------
  function analyze(support, L, EI, loads) {
    var total = 0, momentA = 0;
    loads.forEach(function (ld) {
      if (ld.type === 'point') { total += ld.P; momentA += ld.P * ld.a; }
      else { var W = ld.w * (ld.b - ld.a); total += W; momentA += W * (ld.a + ld.b) / 2; }
    });
    var RA, RB = 0, M0 = 0;
    if (support === 'simple') { RB = momentA / L; RA = total - RB; }
    else { RA = total; M0 = -momentA; }

    function VM(x, side) {
      // side: -1 = tepat di kiri titik x, +1 = tepat di kanan
      var V = RA, M = M0 + RA * x;
      loads.forEach(function (ld) {
        if (ld.type === 'point') {
          if (ld.a < x || (ld.a === x && side > 0)) {
            V -= ld.P; M -= ld.P * (x - ld.a);
          }
        } else {
          var len = Math.min(Math.max(x - ld.a, 0), ld.b - ld.a);
          V -= ld.w * len; M -= ld.w * len * (x - ld.a - len / 2);
        }
      });
      return { V: V, M: M };
    }

    // titik sampel: seragam + titik kritis (kiri/kanan beban terpusat)
    var N = 600, pts = [];
    for (var i = 0; i <= N; i++) pts.push({ x: L * i / N, s: 1 });
    var crit = [0, L];
    loads.forEach(function (ld) {
      if (ld.type === 'point') { crit.push(ld.a); pts.push({ x: ld.a, s: -1 }, { x: ld.a, s: 1 }); }
      else { crit.push(ld.a, ld.b); pts.push({ x: ld.a, s: 1 }, { x: ld.b, s: 1 }); }
    });
    pts.sort(function (p, q) { return p.x - q.x || p.s - q.s; });
    var xs = [], V = [], M = [];
    // tambahkan titik V = 0 di kedua ujung agar diagram tertutup
    pts.forEach(function (p) {
      var r = VM(p.x, p.s);
      xs.push(p.x); V.push(r.V); M.push(r.M);
    });
    xs.unshift(0); V.unshift(0); M.unshift(M0);
    xs.push(L); V.push(0); M.push(M[M.length - 1]);

    // lendutan: EI·y'' = M, integrasi trapesium dua kali
    var th = [0], y = [0];
    for (i = 1; i < xs.length; i++) {
      var dx = xs[i] - xs[i - 1];
      th.push(th[i - 1] + 0.5 * (M[i] + M[i - 1]) * dx);
      y.push(y[i - 1] + 0.5 * (th[i] + th[i - 1]) * dx);
    }
    var yL = y[y.length - 1];
    var defl = y.map(function (yy, k) {
      var corr = support === 'simple' ? yy - yL * xs[k] / L : yy; // syarat batas y(0)=y(L)=0
      return EI > 0 ? corr / EI * 1000 : NaN; // m → mm
    });

    crit = crit.filter(function (v, k, a) { return a.indexOf(v) === k; }).sort(function (a, b) { return a - b; });
    var table = crit.map(function (x) {
      var l = VM(x, -1), r = VM(x, 1);
      var k = nearest(xs, x);
      return { x: x, Vl: x === 0 ? 0 : l.V, Vr: x === L ? 0 : r.V, M: r.M, d: defl[k] };
    });
    // koreksi momen di ujung kantilever: M(0) = M0
    if (support === 'cantilever') table[0].M = M0;

    return { RA: RA, RB: RB, M0: M0, total: total, xs: xs, V: V, M: M, defl: defl, table: table };
  }

  function nearest(arr, x) {
    var best = 0;
    for (var i = 1; i < arr.length; i++) if (Math.abs(arr[i] - x) < Math.abs(arr[best] - x)) best = i;
    return best;
  }

  function ext(arr, xs, fn) {
    var k = 0;
    for (var i = 1; i < arr.length; i++) if (fn(arr[i], arr[k])) k = i;
    return { v: arr[k], x: xs[k] };
  }

  // ---------- UI beban ----------
  function renderLoads() {
    var box = $('loads');
    box.innerHTML = '';
    loads.forEach(function (ld, i) {
      var d = document.createElement('div');
      d.className = 'load-item';
      if (ld.type === 'point') {
        d.innerHTML = '<div class="title">Beban terpusat ' + (i + 1) + '</div><div class="row">' +
          field('P (kN)', 'P', ld.P, i) + field('a dari kiri (m)', 'a', ld.a, i) + '</div>';
      } else {
        d.innerHTML = '<div class="title">Beban merata ' + (i + 1) + '</div><div class="row">' +
          field('q (kN/m)', 'w', ld.w, i) + field('dari (m)', 'a', ld.a, i) + field('sampai (m)', 'b', ld.b, i) + '</div>';
      }
      var rm = document.createElement('button');
      rm.type = 'button'; rm.className = 'remove'; rm.title = 'Hapus beban'; rm.textContent = '×';
      rm.onclick = function () { loads.splice(i, 1); renderLoads(); update(); };
      d.appendChild(rm);
      box.appendChild(d);
    });
    if (!loads.length) box.innerHTML = '<p class="muted" style="margin:4px 0">Belum ada beban.</p>';
    box.querySelectorAll('input').forEach(function (inp) {
      inp.addEventListener('input', function () {
        loads[+inp.dataset.i][inp.dataset.k] = parseFloat(inp.value);
        update();
      });
    });
  }
  function field(lbl, k, v, i) {
    return '<div><label>' + lbl + '</label><input type="number" step="any" data-i="' + i + '" data-k="' + k + '" value="' + v + '"></div>';
  }

  // ---------- skema ----------
  function drawSchema(support, L, R) {
    var W = 640, H = 150, pl = 40, pr = 40, by = 90;
    var sx = function (x) { return pl + x / L * (W - pl - pr); };
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': 'Skema balok' });
    var defs = el('defs', {});
    var mk = el('marker', { id: 'arr', viewBox: '0 0 10 10', refX: 5, refY: 9, markerWidth: 7, markerHeight: 7, orient: 'auto' });
    mk.appendChild(el('path', { d: 'M0 0 L5 10 L10 0 Z', fill: 'var(--red)' }));
    defs.appendChild(mk);
    var mk2 = el('marker', { id: 'arrUp', viewBox: '0 0 10 10', refX: 5, refY: 1, markerWidth: 7, markerHeight: 7, orient: 'auto' });
    mk2.appendChild(el('path', { d: 'M0 10 L5 0 L10 10 Z', fill: 'var(--green)' }));
    defs.appendChild(mk2);
    svg.appendChild(defs);

    // beban merata
    var maxW = Math.max.apply(null, loads.filter(function (l) { return l.type === 'udl'; }).map(function (l) { return Math.abs(l.w); }).concat([1e-9]));
    loads.forEach(function (ld) {
      if (ld.type !== 'udl') return;
      var h = 14 + 22 * Math.abs(ld.w) / maxW, x1 = sx(ld.a), x2 = sx(ld.b);
      svg.appendChild(el('rect', { x: x1, y: by - 6 - h, width: Math.max(x2 - x1, 1), height: h, fill: 'var(--red)', 'fill-opacity': .12, stroke: 'var(--red)', 'stroke-width': 1 }));
      var n = Math.max(2, Math.round((x2 - x1) / 30));
      for (var i = 0; i <= n; i++) {
        var xx = x1 + (x2 - x1) * i / n;
        svg.appendChild(el('line', { x1: xx, x2: xx, y1: by - 6 - h, y2: by - 9, stroke: 'var(--red)', 'marker-end': 'url(#arr)' }));
      }
      svg.appendChild(el('text', { x: (x1 + x2) / 2, y: by - 10 - h, 'text-anchor': 'middle', 'font-size': 12, fill: 'var(--red)' }, fmt(ld.w, 2) + ' kN/m'));
    });
    // beban terpusat
    loads.forEach(function (ld) {
      if (ld.type !== 'point') return;
      var x = sx(ld.a);
      svg.appendChild(el('line', { x1: x, x2: x, y1: 14, y2: by - 9, stroke: 'var(--red)', 'stroke-width': 2, 'marker-end': 'url(#arr)' }));
      svg.appendChild(el('text', { x: x + 5, y: 22, 'font-size': 12, 'font-weight': 700, fill: 'var(--red)' }, fmt(ld.P, 2) + ' kN'));
    });
    // balok
    svg.appendChild(el('rect', { x: sx(0), y: by - 5, width: sx(L) - sx(0), height: 10, fill: 'var(--text)', rx: 2 }));
    // tumpuan
    if (support === 'simple') {
      svg.appendChild(el('path', { d: 'M' + sx(0) + ' ' + (by + 5) + ' l-10 16 h20 Z', fill: 'none', stroke: 'var(--text)', 'stroke-width': 1.5 }));
      svg.appendChild(el('path', { d: 'M' + sx(L) + ' ' + (by + 5) + ' l-10 14 h20 Z', fill: 'none', stroke: 'var(--text)', 'stroke-width': 1.5 }));
      svg.appendChild(el('line', { x1: sx(L) - 12, x2: sx(L) + 12, y1: by + 23, y2: by + 23, stroke: 'var(--text)', 'stroke-width': 1.5 }));
      label(svg, sx(0), 'R_A = ' + fmt(R.RA, 2) + ' kN', 'start');
      label(svg, sx(L), 'R_B = ' + fmt(R.RB, 2) + ' kN', 'end');
    } else {
      svg.appendChild(el('rect', { x: sx(0) - 10, y: by - 30, width: 10, height: 60, fill: 'var(--muted)', 'fill-opacity': .4, stroke: 'var(--text)' }));
      label(svg, sx(0), 'R_A = ' + fmt(R.RA, 2) + ' kN · M_A = ' + fmt(R.M0, 2) + ' kN·m', 'start');
    }
    svg.appendChild(el('text', { x: (sx(0) + sx(L)) / 2, y: H - 4, 'text-anchor': 'middle', 'font-size': 11, fill: 'var(--muted)' }, 'L = ' + fmt(L, 2) + ' m'));
    $('schema').innerHTML = '';
    $('schema').appendChild(svg);

    function label(svg, x, t, anchor) {
      svg.appendChild(el('text', { x: x + (anchor === 'start' ? -10 : 10), y: by + 40, 'text-anchor': anchor, 'font-size': 12, fill: 'var(--green)', 'font-weight': 600 }, t));
    }
  }

  // ---------- update ----------
  function update() {
    var support = $('support').value, L = parseFloat($('L').value);
    var E = parseFloat($('E').value), I = parseFloat($('I').value);
    var err = [];
    if (!(L > 0)) err.push('Panjang bentang harus lebih dari 0.');
    loads.forEach(function (ld, i) {
      var n = 'Beban ' + (i + 1) + ': ';
      if (ld.type === 'point') {
        if (!isFinite(ld.P) || !isFinite(ld.a)) err.push(n + 'isi semua nilai.');
        else if (ld.a < 0 || ld.a > L) err.push(n + 'posisi a harus di antara 0 dan L.');
      } else {
        if (!isFinite(ld.w) || !isFinite(ld.a) || !isFinite(ld.b)) err.push(n + 'isi semua nilai.');
        else if (ld.a < 0 || ld.b > L || ld.b <= ld.a) err.push(n + 'rentang harus 0 ≤ dari < sampai ≤ L.');
      }
    });
    $('err').textContent = err.join(' ');
    if (err.length) return;

    var EI = E * I * 1e-3; // kN·m²
    var R = analyze(support, L, EI, loads);
    drawSchema(support, L, R);

    var mMax = ext(R.M, R.xs, function (a, b) { return a > b; });
    var mMin = ext(R.M, R.xs, function (a, b) { return a < b; });
    var vAbs = ext(R.V, R.xs, function (a, b) { return Math.abs(a) > Math.abs(b); });
    var dAbs = ext(R.defl, R.xs, function (a, b) { return Math.abs(a) > Math.abs(b); });

    var stats = support === 'simple'
      ? [['R_A', R.RA, 'kN'], ['R_B', R.RB, 'kN']]
      : [['R_A', R.RA, 'kN'], ['M_A (jepit)', R.M0, 'kN·m']];
    stats.push(['M maks (+)', mMax.v, 'kN·m', mMax.v > 1e-9 ? 'x = ' + fmt(mMax.x, 2) + ' m' : '']);
    stats.push(['M min (−)', mMin.v, 'kN·m', mMin.v < -1e-9 ? 'x = ' + fmt(mMin.x, 2) + ' m' : '']);
    stats.push(['|V| maks', Math.abs(vAbs.v), 'kN']);
    stats.push(['δ maks', Math.abs(dAbs.v), 'mm', isFinite(dAbs.v) ? 'x = ' + fmt(dAbs.x, 2) + ' m · L/' + (Math.abs(dAbs.v) > 1e-9 ? Math.round(L * 1000 / Math.abs(dAbs.v)) : '∞') : '']);
    $('results').innerHTML = stats.map(function (s) {
      return '<div class="stat"><div class="k">' + s[0] + '</div><div class="v">' + fmt(s[1], 2) + ' <span class="u">' + s[2] + '</span></div>' +
        (s[3] ? '<div class="k">' + s[3] + '</div>' : '') + '</div>';
    }).join('');

    Plot.diagram($('sfd'), R.xs, R.V, { color: 'var(--blue)', unit: 'kN', short: 'kN', label: 'Diagram gaya geser' });
    Plot.diagram($('bmd'), R.xs, R.M, { color: 'var(--accent)', unit: 'kN·m', short: 'kN·m', invert: true, label: 'Diagram momen lentur' });
    Plot.diagram($('defl'), R.xs, R.defl, { color: 'var(--green)', unit: 'mm', short: 'mm', label: 'Diagram lendutan' });

    $('table').innerHTML = '<tr><th class="num">x (m)</th><th class="num">V kiri (kN)</th><th class="num">V kanan (kN)</th><th class="num">M (kN·m)</th><th class="num">δ (mm)</th></tr>' +
      R.table.map(function (r) {
        return '<tr><td class="num">' + fmt(r.x, 2) + '</td><td class="num">' + fmt(r.Vl, 2) + '</td><td class="num">' + fmt(r.Vr, 2) +
          '</td><td class="num">' + fmt(r.M, 2) + '</td><td class="num">' + fmt(r.d, 2) + '</td></tr>';
      }).join('');
  }

  // ---------- init ----------
  $('addPoint').onclick = function () {
    var L = parseFloat($('L').value) || 1;
    loads.push({ type: 'point', P: 10, a: +(L / 2).toFixed(2) }); renderLoads(); update();
  };
  $('addUdl').onclick = function () {
    var L = parseFloat($('L').value) || 1;
    loads.push({ type: 'udl', w: 5, a: 0, b: L }); renderLoads(); update();
  };
  ['support', 'L', 'E', 'I'].forEach(function (id) { $(id).addEventListener('input', update); });

  // contoh dari tutorial (default)
  loads = [{ type: 'point', P: 20, a: 2 }, { type: 'udl', w: 5, a: 0, b: 6 }];
  renderLoads();
  update();
})();
