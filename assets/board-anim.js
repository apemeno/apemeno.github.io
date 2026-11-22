// Animasi interaktif bergaya kapur untuk tutorial.
// <div data-anim="moving-load"></div>  → beban terpusat berjalan di balok sederhana
// <div data-anim="parallel-axis"></div> → teorema sumbu sejajar
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var W = '#f2efe4', Y = '#f7e27a', P = '#f59fb0', B = '#9fd3f5', G = '#a8e6b0';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function el(n, a, t) { var e = document.createElementNS(NS, n); for (var k in a) e.setAttribute(k, a[k]); if (t != null) e.textContent = t; return e; }
  function f(v, d) { return v.toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d }); }
  var uid = 0;
  function chalkDefs(svg) {
    var id = 'ca' + (++uid), d = el('defs', {});
    d.innerHTML = '<filter id="' + id + '"><feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="' + uid + '" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="1.8"/></filter>';
    svg.appendChild(d);
    return 'url(#' + id + ')';
  }
  function controls(box, onToggle, onSlide, label) {
    var c = document.createElement('div'); c.className = 'anim-ctrl';
    c.innerHTML = '<button type="button" class="anim-btn">❚❚ Jeda</button><label class="anim-range"><span>' + label + '</span><input type="range" min="0" max="1000" value="500"></label>';
    box.appendChild(c);
    var btn = c.querySelector('button'), rng = c.querySelector('input');
    btn.onclick = function () { var playing = onToggle(); btn.textContent = playing ? '❚❚ Jeda' : '▶ Putar'; };
    rng.oninput = function () { onSlide(rng.value / 1000); btn.textContent = '▶ Putar'; };
    return { set: function (v) { rng.value = Math.round(v * 1000); }, btn: btn };
  }
  function loop(step) {
    var playing = !reduce, t0 = null, phase = 0;
    function frame(ts) {
      if (playing) { if (t0 != null) phase += (ts - t0) / 1000; step(phase); }
      t0 = ts; requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    return {
      toggle: function () { playing = !playing; return playing; },
      pause: function () { playing = false; },
      setPhase: function (p) { phase = p; },
      playing: function () { return playing; }
    };
  }

  // ---------------- beban berjalan ----------------
  function movingLoad(box) {
    var L = 6, Pk = 20, X0 = 70, X1 = 570, sx = (X1 - X0) / L;
    var svg = el('svg', { viewBox: '0 0 640 450', class: 'anim-svg', role: 'img', 'aria-label': 'Animasi beban terpusat berjalan di atas balok sederhana' });
    var flt = chalkDefs(svg), g = el('g', { filter: flt, 'font-family': 'Kalam, cursive', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    svg.appendChild(g);
    var X = function (x) { return X0 + x * sx; };
    // statis: tumpuan, sumbu diagram
    g.appendChild(el('path', { d: 'M' + X0 + ' 112l-13 22h26z M' + X1 + ' 112l-13 20h26z M' + (X1 - 16) + ' 137h32', fill: 'none', stroke: W, 'stroke-width': 2 }));
    g.appendChild(el('path', { d: 'M' + X0 + ' 250H' + X1 + ' M' + X0 + ' 330H' + X1, stroke: W, 'stroke-width': 1.2, 'stroke-dasharray': '6 7', opacity: .6 }));
    g.appendChild(el('text', { x: 24, y: 238, fill: W, 'font-size': 22 }, 'V'));
    g.appendChild(el('text', { x: 24, y: 352, fill: W, 'font-size': 22 }, 'M'));
    var beam = el('path', { fill: 'none', stroke: W, 'stroke-width': 3.5 }); g.appendChild(beam);
    var ghost = el('path', { d: 'M' + X0 + ' 108H' + X1, stroke: W, 'stroke-width': 1, 'stroke-dasharray': '3 6', opacity: .45 }); g.appendChild(ghost);
    var arrow = el('path', { fill: 'none', stroke: Y, 'stroke-width': 3 }); g.appendChild(arrow);
    var pLab = el('text', { fill: Y, 'font-size': 19 }); g.appendChild(pLab);
    var ra = el('path', { fill: 'none', stroke: B, 'stroke-width': 2.6 }), rb = el('path', { fill: 'none', stroke: B, 'stroke-width': 2.6 });
    g.appendChild(ra); g.appendChild(rb);
    var raT = el('text', { fill: B, 'font-size': 17 }), rbT = el('text', { fill: B, 'font-size': 17, 'text-anchor': 'end' });
    g.appendChild(raT); g.appendChild(rbT);
    var sfd = el('path', { fill: Y, 'fill-opacity': .12, stroke: Y, 'stroke-width': 2.4 }); g.appendChild(sfd);
    var bmd = el('path', { fill: P, 'fill-opacity': .12, stroke: P, 'stroke-width': 2.6 }); g.appendChild(bmd);
    var mT = el('text', { fill: P, 'font-size': 18, 'text-anchor': 'middle' }); g.appendChild(mT);
    var env = el('path', { fill: 'none', stroke: G, 'stroke-width': 1.6, 'stroke-dasharray': '4 6', opacity: .8 }); g.appendChild(env);
    var envT = el('text', { x: 320, y: 442, fill: G, 'font-size': 16, 'text-anchor': 'middle' }, 'garis putus hijau = momen terbesar yang mungkin terjadi di tiap titik'); g.appendChild(envT);
    box.appendChild(svg);
    // garis selubung (envelope) momen maksimum: Mmax(x) = P x (L−x)/L
    var e = 'M';
    for (var i = 0; i <= 60; i++) { var xx = L * i / 60; e += (i ? 'L' : '') + X(xx).toFixed(1) + ' ' + (330 + 2.2 * Pk * xx * (L - xx) / L).toFixed(1); }
    env.setAttribute('d', e);
    var info = document.createElement('p'); info.className = 'anim-info'; box.appendChild(info);

    function draw(a) {
      var b = L - a, RA = Pk * b / L, RB = Pk * a / L, Mm = Pk * a * b / L;
      // lendutan dilebih-lebihkan
      var d = 'M', ymax = 0, pts = [];
      for (var i = 0; i <= 60; i++) {
        var x = L * i / 60, y;
        if (x <= a) y = Pk * b * x * (L * L - b * b - x * x) / (6 * L);
        else { var xr = L - x; y = Pk * a * xr * (L * L - a * a - xr * xr) / (6 * L); }
        pts.push([x, y]); ymax = Math.max(ymax, y);
      }
      var k = 30 / (Pk * L * L * L / 48); // skala tetap: 30 px saat beban di tengah
      pts.forEach(function (p, j) { d += (j ? 'L' : '') + X(p[0]).toFixed(1) + ' ' + (108 + p[1] * k).toFixed(1); });
      beam.setAttribute('d', d);
      var xa = X(a), ya = 108 + (function () { var y = Pk * b * a * (L * L - b * b - a * a) / (6 * L); return y * k; })();
      arrow.setAttribute('d', 'M' + xa + ' 26V' + (ya - 6) + 'M' + (xa - 7) + ' ' + (ya - 15) + 'L' + xa + ' ' + (ya - 4) + 'L' + (xa + 7) + ' ' + (ya - 15));
      pLab.setAttribute('x', xa + 10); pLab.setAttribute('y', 40); pLab.textContent = 'P = 20 kN';
      ra.setAttribute('d', 'M' + X0 + ' ' + (196) + 'V' + (196 - 6 - RA * 2.2) + 'M' + (X0 - 6) + ' ' + (196 - RA * 2.2 + 4) + 'L' + X0 + ' ' + (196 - 6 - RA * 2.2) + 'L' + (X0 + 6) + ' ' + (196 - RA * 2.2 + 4));
      rb.setAttribute('d', 'M' + X1 + ' ' + (196) + 'V' + (196 - 6 - RB * 2.2) + 'M' + (X1 - 6) + ' ' + (196 - RB * 2.2 + 4) + 'L' + X1 + ' ' + (196 - 6 - RB * 2.2) + 'L' + (X1 + 6) + ' ' + (196 - RB * 2.2 + 4));
      raT.setAttribute('x', X0 + 10); raT.setAttribute('y', 192); raT.innerHTML = 'R<tspan font-size="12" dy="4">A</tspan><tspan dy="-4"> = ' + f(RA, 1) + ' kN</tspan>';
      rbT.setAttribute('x', X1 - 10); rbT.setAttribute('y', 192); rbT.innerHTML = 'R<tspan font-size="12" dy="4">B</tspan><tspan dy="-4"> = ' + f(RB, 1) + ' kN</tspan>';
      var s = 2.2;
      sfd.setAttribute('d', 'M' + X0 + ' 250V' + (250 - RA * s) + 'H' + xa + 'V' + (250 + RB * s) + 'H' + X1 + 'V250Z');
      bmd.setAttribute('d', 'M' + X0 + ' 330L' + xa + ' ' + (330 + Mm * s) + 'L' + X1 + ' 330Z');
      mT.setAttribute('x', Math.min(Math.max(xa, X0 + 70), X1 - 70)); mT.setAttribute('y', 330 + Mm * s + 22); mT.textContent = 'M = ' + f(Mm, 1) + ' kN·m';
      info.innerHTML = 'Beban di <strong>a = ' + f(a, 2) + ' m</strong>. Reaksi berbagi beban sesuai jarak: R<sub>A</sub> = P·b/L, R<sub>B</sub> = P·a/L. Momen terbesar selalu tepat di bawah beban: M = P·a·b/L. Paling besar saat beban di tengah (30 kN·m).';
    }
    var lp = loop(function (t) { var a = 3 + 2.7 * Math.sin(t * 0.8); draw(a); ctl.set((a - 0.3) / 5.4); });
    var ctl = controls(box, function () { return lp.toggle(); }, function (v) { lp.pause(); draw(0.3 + 5.4 * v); }, 'Geser posisi beban');
    draw(3);
  }

  // ---------------- sumbu sejajar ----------------
  function parallelAxis(box) {
    var svg = el('svg', { viewBox: '0 0 640 300', class: 'anim-svg', role: 'img', 'aria-label': 'Animasi teorema sumbu sejajar' });
    var flt = chalkDefs(svg), g = el('g', { filter: flt, 'font-family': 'Kalam, cursive', 'stroke-linecap': 'round' });
    svg.appendChild(g);
    var AX = 220; // posisi sumbu (px)
    var bmm = 200, hmm = 50, A = bmm * hmm, I0 = bmm * Math.pow(hmm, 3) / 12, k = 0.6; // px per mm
    g.appendChild(el('path', { d: 'M30 ' + AX + 'H400', stroke: P, 'stroke-width': 2, 'stroke-dasharray': '10 7' }));
    g.appendChild(el('text', { x: 30, y: AX + 24, fill: P, 'font-size': 17 }, 'sumbu x (garis netral)'));
    var rect = el('rect', { width: bmm * k, height: hmm * k, x: 205 - bmm * k / 2, fill: 'rgba(242,239,228,.08)', stroke: W, 'stroke-width': 2.4 }); g.appendChild(rect);
    var dot = el('circle', { r: 4, cx: 205, fill: Y }); g.appendChild(dot);
    var dl = el('path', { stroke: B, 'stroke-width': 1.8, fill: 'none' }); g.appendChild(dl);
    var dT = el('text', { fill: B, 'font-size': 18 }); g.appendChild(dT);
    // grafik batang
    var BX = 520, BW = 56, BB = 285, BH = 220;
    g.appendChild(el('path', { d: 'M' + (BX - 10) + ' ' + BB + 'H' + (BX + 2 * BW + 40), stroke: W, 'stroke-width': 1.6 }));
    var b0 = el('rect', { x: BX, width: BW, fill: B, 'fill-opacity': .35, stroke: B, 'stroke-width': 1.6 }); g.appendChild(b0);
    var b1 = el('rect', { x: BX, width: BW, fill: Y, 'fill-opacity': .3, stroke: Y, 'stroke-width': 1.6 }); g.appendChild(b1);
    var tI = el('text', { x: BX + BW / 2, fill: W, 'font-size': 17, 'text-anchor': 'middle' }); g.appendChild(tI);
    g.appendChild(el('text', { x: BX + BW + 14, y: BB - 8, fill: B, 'font-size': 15 }, 'I₀'));
    var tAd = el('text', { x: BX + BW + 14, fill: Y, 'font-size': 15 }, 'A·d²'); g.appendChild(tAd);
    box.appendChild(svg);
    var info = document.createElement('p'); info.className = 'anim-info'; box.appendChild(info);
    var dMax = 150, Imax = I0 + A * dMax * dMax;

    function draw(d) {
      var cy = AX - d * k; // titik berat persegi (px)
      rect.setAttribute('y', cy - hmm * k / 2); dot.setAttribute('cy', cy);
      dl.setAttribute('d', 'M360 ' + AX + 'V' + cy + 'M354 ' + cy + 'h12M354 ' + AX + 'h12');
      dT.setAttribute('x', 372); dT.setAttribute('y', (AX + cy) / 2 + 6); dT.textContent = 'd = ' + f(d, 0) + ' mm';
      var Ad = A * d * d, I = I0 + Ad, h0 = BH * I0 / Imax, h1 = BH * Ad / Imax;
      b0.setAttribute('y', BB - h0); b0.setAttribute('height', Math.max(h0, 0.5));
      b1.setAttribute('y', BB - h0 - h1); b1.setAttribute('height', Math.max(h1, 0.01));
      tAd.setAttribute('y', BB - h0 - h1 / 2 + 5); tAd.style.opacity = h1 > 14 ? 1 : 0;
      tI.setAttribute('y', BB - h0 - h1 - 10); tI.textContent = f(I / 1e6, 1) + '×10⁶';
      info.innerHTML = 'Persegi 200 × 50 mm: I = I₀ + A·d² = ' + f(I0 / 1e6, 2) + ' + ' + f(A, 0) + '·' + f(d, 0) + '² = <strong>' + f(I / 1e6, 2) + ' × 10⁶ mm⁴</strong>. ' +
        'Luasnya tetap, tapi makin jauh dari sumbu, I naik dengan kuadrat jarak. Itu sebabnya profil I/WF menaruh sebagian besar luasnya di sayap.';
    }
    var lp = loop(function (t) { var v = (1 - Math.cos(t * 0.7)) / 2; draw(v * dMax); ctl.set(v); });
    var ctl = controls(box, function () { return lp.toggle(); }, function (v) { lp.pause(); draw(v * dMax); }, 'Geser jarak d');
    draw(dMax / 2);
  }

  document.querySelectorAll('[data-anim]').forEach(function (box) {
    if (box.dataset.anim === 'moving-load') movingLoad(box);
    if (box.dataset.anim === 'parallel-axis') parallelAxis(box);
  });
})();
