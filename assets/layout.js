// Header & footer bersama untuk semua halaman.
// Setiap halaman memberi <body data-root="../" data-page="tutorial"> agar link relatif benar.
(function () {
  var root = document.body.getAttribute('data-root') || '';
  var page = document.body.getAttribute('data-page') || '';
  var SITE = 'SipilBelajar';
  var R = function (u) { return root + u; };
  var MENU = [
    { id: 'home', t: 'Beranda', u: 'index.html' },
    { id: 'materi', t: 'Materi', u: 'materi/index.html', sub: [
      ['Semua materi unduhan', 'materi/index.html'],
      ['Ringkasan rumus statika balok (PDF)', 'materi/pdf/ringkasan-rumus-statika-balok.pdf'],
      ['Tabel properti penampang (PDF)', 'materi/pdf/tabel-properti-penampang.pdf'],
      ['Contoh soal gaya dalam balok (PDF)', 'materi/pdf/contoh-soal-gaya-dalam-balok.pdf'],
      ['Contoh soal balok menerus, miring & portal (PDF)', 'materi/pdf/contoh-soal-menerus-miring-portal.pdf'],
      ['Tabel satuan & berat material (PDF)', 'materi/pdf/tabel-satuan-dan-berat-material.pdf']] },
    { id: 'tutorial', t: 'Tutorial', u: 'tutorial/index.html', sub: [
      ['Semua tutorial', 'tutorial/index.html'],
      ['Gaya dalam pada balok sederhana', 'tutorial/balok-sederhana.html'],
      ['Momen inersia penampang', 'tutorial/momen-inersia.html']] },
    { id: 'kalkulator', t: 'Kalkulator', u: 'kalkulator/index.html', sub: [
      ['Semua kalkulator', 'kalkulator/index.html'],
      ['Balok: geser, momen & lendutan', 'kalkulator/balok.html'],
      ['Statika: balok menerus', 'kalkulator/statika.html#menerus'],
      ['Statika: balok miring', 'kalkulator/statika.html#miring'],
      ['Statika: portal', 'kalkulator/statika.html#portal'],
      ['Properti penampang', 'kalkulator/penampang.html'],
      ['SortirSAP: rekap output SAP2000', 'kalkulator/sortir-sap/']] },
    { id: 'sortirsap', t: 'SortirSAP', u: 'kalkulator/sortir-sap/' },
    { id: 'peraturan', t: 'Peraturan', u: 'peraturan.html' },
    { id: 'berlangganan', t: '★ Premium', u: 'berlangganan.html', cls: 'pro' }
  ];
  var SEARCH = [];
  MENU.forEach(function (m) { SEARCH.push([m.t, m.u]); (m.sub || []).forEach(function (s) { SEARCH.push(s); }); });
  SEARCH.push(['SAP2000 Mu Pu Vu tulangan, sortir output', 'kalkulator/sortir-sap/'], ['Berlangganan Premium, harga paket', 'berlangganan.html'], ['Reaksi tumpuan, SFD, BMD', 'tutorial/balok-sederhana.html'], ['Teorema sumbu sejajar', 'tutorial/momen-inersia.html'],
    ['Cek kontrol keseimbangan statika', 'kalkulator/statika.html'], ['Lendutan balok', 'kalkulator/balok.html'],
    ['Profil WF / I, pipa, T', 'kalkulator/penampang.html'], ['SNI beton, baja, gempa, pembebanan', 'peraturan.html']);

  var caret = '<svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true"><path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
  var items = MENU.map(function (m) {
    var cur = ' class="' + (m.id === page ? 'current ' : '') + (m.cls || '') + '"';
    if (!m.sub) return '<li' + cur + '><a href="' + R(m.u) + '">' + m.t + '</a></li>';
    return '<li class="has-sub' + (m.id === page ? ' current' : '') + '"><a href="' + R(m.u) + '">' + m.t + '</a>' +
      '<button class="sub-toggle" aria-expanded="false" aria-label="Buka submenu ' + m.t + '">' + caret + '</button>' +
      '<ul class="sub">' + m.sub.map(function (s) {
        var pdf = /\.pdf$/.test(s[1]);
        return '<li><a href="' + R(s[1]) + '"' + (pdf ? ' download' : '') + '>' + (pdf ? '<span class="pdf-tag">PDF</span>' : '') + s[0].replace(' (PDF)', '') + '</a></li>';
      }).join('') + '</ul></li>';
  }).join('');

  var today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  var top = document.createElement('div');
  top.className = 'topbar';
  top.innerHTML = '<div class="wrap"><span>' + today.toUpperCase() + '</span><a href="' + R('materi/index.html') + '">MATERI GRATIS</a><a href="' + R('kalkulator/index.html') + '">KALKULATOR</a></div>';

  var brand = document.createElement('div');
  brand.className = 'brandbar';
  brand.innerHTML = '<div class="wrap"><a class="brand-big" href="' + R('index.html') + '" aria-label="' + SITE + ' beranda">' +
    '<img src="' + R('assets/logo.svg') + '" alt="" width="60" height="60">' +
    '<span><span class="bb-name">Sipil<span class="brand-accent">Belajar</span></span><span class="bb-tag">Belajar teknik sipil · langkah demi langkah</span></span></a></div>';

  var nav = document.createElement('nav');
  nav.className = 'mainnav';
  nav.setAttribute('aria-label', 'Menu utama');
  nav.innerHTML = '<div class="wrap"><button class="nav-toggle" aria-expanded="false"><span class="burger"></span>MENU</button>' +
    '<a class="nav-mini" href="' + R('index.html') + '" aria-hidden="true" tabindex="-1"><img src="' + R('assets/logo.svg') + '" alt="" width="26" height="26"></a>' +
    '<ul class="menu">' + items + '</ul>' +
    '<div class="nav-search"><button class="search-btn" aria-expanded="false"><svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><circle cx="10" cy="10" r="6.5" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M15 15l6 6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg><span>CARI</span></button>' +
    '<div class="search-panel"><input type="search" placeholder="Cari materi, tutorial, kalkulator…" aria-label="Cari"><ul class="search-res"></ul></div></div></div>';

  document.body.insertBefore(nav, document.body.firstChild);
  document.body.insertBefore(brand, nav);
  document.body.insertBefore(top, brand);

  // interaksi: menu HP, submenu, pencarian
  var toggle = nav.querySelector('.nav-toggle'), menu = nav.querySelector('.menu');
  toggle.addEventListener('click', function () {
    var open = nav.classList.toggle('open'); toggle.setAttribute('aria-expanded', open);
  });
  nav.querySelectorAll('.sub-toggle').forEach(function (b) {
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      var li = b.parentNode, open = !li.classList.contains('sub-open');
      nav.querySelectorAll('.has-sub.sub-open').forEach(function (o) { if (o !== li) { o.classList.remove('sub-open'); o.querySelector('.sub-toggle').setAttribute('aria-expanded', 'false'); } });
      li.classList.toggle('sub-open', open); b.setAttribute('aria-expanded', open);
    });
  });
  var sBtn = nav.querySelector('.search-btn'), sBox = nav.querySelector('.nav-search'), sIn = nav.querySelector('.search-panel input'), sRes = nav.querySelector('.search-res');
  sBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    var open = sBox.classList.toggle('open'); sBtn.setAttribute('aria-expanded', open);
    if (open) { sIn.focus(); run(); }
  });
  function run() {
    var q = sIn.value.toLowerCase().trim().split(/\s+/).filter(Boolean), seen = {};
    var hits = SEARCH.filter(function (s) {
      if (seen[s[0]]) return false;
      var t = (s[0] + ' ' + s[1]).toLowerCase(), ok = q.every(function (w) { return t.indexOf(w) >= 0; });
      if (ok) seen[s[0]] = 1; return ok;
    }).slice(0, 8);
    sRes.innerHTML = hits.length ? hits.map(function (s) { return '<li><a href="' + R(s[1]) + '">' + s[0] + '</a></li>'; }).join('') : '<li class="none">Tidak ditemukan.</li>';
  }
  sIn.addEventListener('input', run);
  sIn.addEventListener('keydown', function (e) { if (e.key === 'Enter') { var a = sRes.querySelector('a'); if (a) location.href = a.href; } if (e.key === 'Escape') sBtn.click(); });
  document.addEventListener('click', function (e) {
    if (!nav.contains(e.target)) {
      sBox.classList.remove('open');
      nav.querySelectorAll('.has-sub.sub-open').forEach(function (o) { o.classList.remove('sub-open'); });
    }
  });
  // logo kecil muncul di bar saat bar menempel di atas
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { nav.classList.toggle('stuck', !en[0].isIntersecting); }, { threshold: 0 }).observe(brand);
  }

  var footer = document.createElement('footer');
  footer.className = 'site-footer';
  footer.innerHTML = '<div class="wrap"><div class="footer-grid">' +
    '<div><a class="brand" href="' + root + 'index.html"><img class="brand-mark" src="' + root + 'assets/logo.svg" alt="" width="28" height="28">' +
    '<span>Sipil<span class="brand-accent">Belajar</span></span></a>' +
    '<p style="max-width:340px;margin:10px 0 0">Tutorial dan kalkulator struktur untuk mahasiswa teknik sipil. Gratis, dan semua hitungan berjalan di browser Anda.</p></div>' +
    '<div><h4>Kalkulator</h4><ul><li><a href="' + root + 'kalkulator/balok.html">Balok</a></li><li><a href="' + root + 'kalkulator/statika.html">Statika (menerus, miring, portal)</a></li><li><a href="' + root + 'kalkulator/penampang.html">Properti penampang</a></li><li><a href="' + root + 'kalkulator/sortir-sap/">SortirSAP (SAP2000)</a></li></ul></div>' +
    '<div><h4>Materi</h4><ul><li><a href="' + root + 'materi/index.html">Unduhan PDF</a></li><li><a href="' + root + 'peraturan.html">Peraturan (SNI)</a></li></ul></div>' +
    '<div><h4>Tutorial</h4><ul><li><a href="' + root + 'tutorial/balok-sederhana.html">Gaya dalam balok</a></li><li><a href="' + root + 'tutorial/momen-inersia.html">Momen inersia</a></li></ul></div>' +
    '</div><div class="footer-note">© ' + (new Date().getFullYear() > 2026 ? '2026–' + new Date().getFullYear() : '2026') + ' <b>Jauhari</b> · ' + SITE + '. Hak cipta dilindungi undang-undang.' +
    ' Untuk belajar. Selalu periksa ulang hasil perhitungan sebelum dipakai untuk desain nyata.</div></div>';
  document.body.appendChild(footer);
})();
