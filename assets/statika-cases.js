// Pembuat model untuk kasus statika: balok menerus, balok miring, portal.
// Semua beban vertikal ke bawah dimasukkan sebagai bilangan positif.
var Cases = (function () {
  var BIG = 1e5; // A = BIG·I → deformasi aksial praktis diabaikan (seperti asumsi buku teks)

  function sup(node, type) {
    if (type === 'jepit') return { node: node, ux: true, uy: true, rz: true, type: type };
    if (type === 'sendi') return { node: node, ux: true, uy: true, rz: false, type: type };
    return { node: node, ux: false, uy: true, rz: false, type: 'rol' };
  }

  // p: { spans:[L..], q:[..], P:[{P,a}|null], left:'sendi'|'jepit', right:'rol'|'jepit', E, I }
  function continuous(p) {
    var nodes = [{ x: 0, y: 0 }], x = 0;
    p.spans.forEach(function (L) { x += L; nodes.push({ x: x, y: 0 }); });
    var members = p.spans.map(function (L, k) {
      var loads = [];
      if (p.q[k]) loads.push({ type: 'udl', qx: 0, qy: -p.q[k] });
      if (p.P && p.P[k] && p.P[k].P) loads.push({ type: 'point', px: 0, py: -p.P[k].P, a: p.P[k].a });
      return { i: k, j: k + 1, E: p.E, I: p.I, A: BIG * p.I, loads: loads };
    });
    var supports = nodes.map(function (_, k) {
      if (k === 0) return sup(k, p.left);
      if (k === nodes.length - 1) return sup(k, p.right);
      return sup(k, 'rol');
    });
    return { nodes: nodes, members: members, supports: supports, nodalLoads: [] };
  }

  // p: { Lx, h, q, qMode:'horizontal'|'miring', P, aP (jarak horizontal dari A), bottom:'sendi', top:'rol'|'sendi', E, I }
  function inclined(p) {
    var nodes = [{ x: 0, y: 0 }, { x: p.Lx, y: p.h }];
    var L = Math.hypot(p.Lx, p.h), c = p.Lx / L;
    var loads = [];
    if (p.q) loads.push({ type: 'udl', qx: 0, qy: -(p.qMode === 'horizontal' ? p.q * c : p.q) });
    if (p.P) loads.push({ type: 'point', px: 0, py: -p.P, a: p.aP / c });
    return {
      nodes: nodes,
      members: [{ i: 0, j: 1, E: p.E, I: p.I, A: BIG * p.I, loads: loads }],
      supports: [sup(0, p.bottom || 'sendi'), sup(1, p.top)],
      nodalLoads: []
    };
  }

  // p: { L, H, base:'sendi-sendi'|'jepit-jepit'|'sendi-rol', q, Hx (beban horizontal di puncak kiri), P, aP, E, Ic, Ib }
  function portal(p) {
    var nodes = [{ x: 0, y: 0 }, { x: 0, y: p.H }, { x: p.L, y: p.H }, { x: p.L, y: 0 }];
    var beamLoads = [];
    if (p.q) beamLoads.push({ type: 'udl', qx: 0, qy: -p.q });
    if (p.P) beamLoads.push({ type: 'point', px: 0, py: -p.P, a: p.aP });
    var members = [
      { i: 0, j: 1, E: p.E, I: p.Ic, A: BIG * p.Ic, loads: [], name: 'Kolom kiri' },
      { i: 1, j: 2, E: p.E, I: p.Ib, A: BIG * p.Ib, loads: beamLoads, name: 'Balok' },
      { i: 2, j: 3, E: p.E, I: p.Ic, A: BIG * p.Ic, loads: [], name: 'Kolom kanan' }
    ];
    var b = p.base.split('-');
    return {
      nodes: nodes, members: members,
      supports: [sup(0, b[0]), sup(3, b[1])],
      nodalLoads: p.Hx ? [{ node: 1, fx: p.Hx }] : []
    };
  }

  return { continuous: continuous, inclined: inclined, portal: portal };
})();
if (typeof module !== 'undefined') module.exports = Cases;
