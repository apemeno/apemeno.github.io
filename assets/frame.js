// Mesin hitung struktur rangka bidang (2D frame) dengan metode kekakuan.
// Satuan konsisten: kN, m. E dalam kN/m², A dalam m², I dalam m⁴.
// Konvensi gaya dalam: N tarik (+), V positif bila resultan gaya kiri potongan ke arah +y lokal,
// M positif bila serat di sisi −y lokal tertarik (untuk balok horizontal: serat bawah, "sagging").
var Frame = (function () {

  function solve(model) {
    var nodes = model.nodes, members = model.members, nn = nodes.length, nd = 3 * nn;
    var K = zeros(nd, nd), F = new Array(nd).fill(0);

    // beban titik pada simpul
    (model.nodalLoads || []).forEach(function (l) {
      F[3 * l.node] += l.fx || 0; F[3 * l.node + 1] += l.fy || 0; F[3 * l.node + 2] += l.m || 0;
    });

    members.forEach(function (m) {
      var ni = nodes[m.i], nj = nodes[m.j];
      var dx = nj.x - ni.x, dy = nj.y - ni.y, L = Math.hypot(dx, dy), c = dx / L, s = dy / L;
      m.L = L; m.c = c; m.s = s;
      m.kl = localK(m.E, m.A, m.I, L);
      m.T = rot(c, s);
      m.loc = localLoads(m);           // beban dalam koordinat lokal
      m.eq = equivLoads(m.loc, L);     // beban nodal ekuivalen (lokal)
      var kg = mul(transpose(m.T), mul(m.kl, m.T));
      var eqg = mulv(transpose(m.T), m.eq);
      var dof = [3 * m.i, 3 * m.i + 1, 3 * m.i + 2, 3 * m.j, 3 * m.j + 1, 3 * m.j + 2];
      m.dof = dof;
      for (var a = 0; a < 6; a++) {
        F[dof[a]] += eqg[a];
        for (var b = 0; b < 6; b++) K[dof[a]][dof[b]] += kg[a][b];
      }
    });

    // derajat kebebasan tertahan
    var fixed = new Array(nd).fill(false);
    (model.supports || []).forEach(function (sp) {
      if (sp.ux) fixed[3 * sp.node] = true;
      if (sp.uy) fixed[3 * sp.node + 1] = true;
      if (sp.rz) fixed[3 * sp.node + 2] = true;
    });
    var free = [];
    for (var d = 0; d < nd; d++) if (!fixed[d]) free.push(d);

    var Kff = free.map(function (r) { return free.map(function (c) { return K[r][c]; }); });
    var Ff = free.map(function (r) { return F[r]; });
    var Uf = gauss(Kff, Ff);
    if (!Uf) return { error: 'Struktur labil (tidak stabil). Periksa jenis tumpuan.' };
    var U = new Array(nd).fill(0);
    free.forEach(function (d, k) { U[d] = Uf[k]; });

    // reaksi = K·U − F pada dof tertahan
    var reactions = (model.supports || []).map(function (sp) {
      var r = [0, 1, 2].map(function (k) {
        var d = 3 * sp.node + k, sum = -F[d];
        for (var c = 0; c < nd; c++) sum += K[d][c] * U[c];
        return fixed[d] ? sum : 0;
      });
      return { node: sp.node, rx: r[0], ry: r[1], m: r[2] };
    });

    // gaya ujung batang (lokal) dan diagram
    members.forEach(function (m) {
      var ug = m.dof.map(function (d) { return U[d]; });
      var ul = mulv(m.T, ug);
      var f = mulv(m.kl, ul).map(function (v, k) { return v - m.eq[k]; });
      m.f = f;
      m.diag = sample(m, f);
    });

    return { U: U, reactions: reactions, members: members };
  }

  // beban batang → lokal. Jenis: udl {qx,qy per panjang batang, a,b}, point {px,py,a}
  function localLoads(m) {
    var out = [];
    (m.loads || []).forEach(function (l) {
      var gx = l.type === 'udl' ? l.qx || 0 : l.px || 0, gy = l.type === 'udl' ? l.qy || 0 : l.py || 0;
      var ax = gx * m.c + gy * m.s, tr = -gx * m.s + gy * m.c;
      if (l.type === 'udl') out.push({ type: 'udl', qa: ax, qt: tr, a: l.a != null ? l.a : 0, b: l.b != null ? l.b : m.L });
      else out.push({ type: 'point', pa: ax, pt: tr, a: l.a });
    });
    return out;
  }

  function pointEq(pa, pt, a, L) {
    var b = L - a, L2 = L * L, L3 = L2 * L;
    return [pa * b / L, pt * b * b * (3 * a + b) / L3, pt * a * b * b / L2,
            pa * a / L, pt * a * a * (a + 3 * b) / L3, -pt * a * a * b / L2];
  }

  function equivLoads(loc, L) {
    var eq = [0, 0, 0, 0, 0, 0];
    loc.forEach(function (l) {
      if (l.type === 'point') add(eq, pointEq(l.pa, l.pt, l.a, L));
      else { // integrasi Simpson (eksak untuk polinomial kubik)
        var n = 20, h = (l.b - l.a) / n;
        for (var k = 0; k <= n; k++) {
          var w = (k === 0 || k === n) ? 1 : (k % 2 ? 4 : 2);
          add(eq, pointEq(l.qa * h * w / 3, l.qt * h * w / 3, l.a + k * h, L));
        }
      }
    });
    return eq;
  }

  function sample(m, f) {
    var L = m.L, xs = [], N = 80;
    for (var k = 0; k <= N; k++) xs.push({ x: L * k / N, s: 1 });
    m.loc.forEach(function (l) {
      if (l.type === 'point') xs.push({ x: l.a, s: -1 }, { x: l.a, s: 1 });
      else xs.push({ x: l.a, s: 1 }, { x: l.b, s: 1 });
    });
    xs.sort(function (p, q) { return p.x - q.x || p.s - q.s; });
    return xs.map(function (p) {
      var x = p.x, Nn = -f[0], V = f[1], M = -f[2] + f[1] * x;
      m.loc.forEach(function (l) {
        if (l.type === 'point') {
          if (l.a < x || (l.a === x && p.s > 0)) { Nn -= l.pa; V += l.pt; M += l.pt * (x - l.a); }
        } else {
          var len = Math.min(Math.max(x - l.a, 0), l.b - l.a);
          Nn -= l.qa * len; V += l.qt * len; M += l.qt * len * (x - l.a - len / 2);
        }
      });
      return { x: x, N: Nn, V: V, M: M };
    });
  }

  // ---------- aljabar ----------
  function localK(E, A, I, L) {
    var a = E * A / L, b = 12 * E * I / (L * L * L), c = 6 * E * I / (L * L), d = 4 * E * I / L, e = 2 * E * I / L;
    return [[a, 0, 0, -a, 0, 0], [0, b, c, 0, -b, c], [0, c, d, 0, -c, e],
            [-a, 0, 0, a, 0, 0], [0, -b, -c, 0, b, -c], [0, c, e, 0, -c, d]];
  }
  function rot(c, s) {
    return [[c, s, 0, 0, 0, 0], [-s, c, 0, 0, 0, 0], [0, 0, 1, 0, 0, 0],
            [0, 0, 0, c, s, 0], [0, 0, 0, -s, c, 0], [0, 0, 0, 0, 0, 1]];
  }
  function zeros(r, c) { var M = []; for (var i = 0; i < r; i++) M.push(new Array(c).fill(0)); return M; }
  function transpose(A) { return A[0].map(function (_, j) { return A.map(function (r) { return r[j]; }); }); }
  function mul(A, B) { return A.map(function (r) { return B[0].map(function (_, j) { var s = 0; for (var k = 0; k < r.length; k++) s += r[k] * B[k][j]; return s; }); }); }
  function mulv(A, v) { return A.map(function (r) { var s = 0; for (var k = 0; k < r.length; k++) s += r[k] * v[k]; return s; }); }
  function add(a, b) { for (var k = 0; k < a.length; k++) a[k] += b[k]; }
  function gauss(A, b) {
    var n = b.length, M = A.map(function (r, i) { return r.concat([b[i]]); });
    var scale = 0; A.forEach(function (r) { r.forEach(function (v) { scale = Math.max(scale, Math.abs(v)); }); });
    for (var i = 0; i < n; i++) {
      var p = i;
      for (var r = i + 1; r < n; r++) if (Math.abs(M[r][i]) > Math.abs(M[p][i])) p = r;
      if (Math.abs(M[p][i]) < scale * 1e-12) return null;
      var t = M[i]; M[i] = M[p]; M[p] = t;
      for (r = i + 1; r < n; r++) {
        var f = M[r][i] / M[i][i];
        if (f) for (var c = i; c <= n; c++) M[r][c] -= f * M[i][c];
      }
    }
    var x = new Array(n).fill(0);
    for (i = n - 1; i >= 0; i--) {
      var s = M[i][n];
      for (var c2 = i + 1; c2 < n; c2++) s -= M[i][c2] * x[c2];
      x[i] = s / M[i][i];
    }
    return x;
  }

  return { solve: solve };
})();
if (typeof module !== 'undefined') module.exports = Frame;
