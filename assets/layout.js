// Header & footer bersama untuk semua halaman.
// Setiap halaman memberi <body data-root="../" data-page="tutorial"> agar link relatif benar.
(function () {
  var root = document.body.getAttribute('data-root') || '';
  var page = document.body.getAttribute('data-page') || '';
  var SITE = 'SipilBelajar';
  var links = [
    ['home', 'index.html', 'Beranda'],
    ['tutorial', 'tutorial/index.html', 'Tutorial'],
    ['kalkulator', 'kalkulator/index.html', 'Kalkulator']
  ];
  var nav = links.map(function (l) {
    return '<a href="' + root + l[1] + '"' + (l[0] === page ? ' aria-current="page"' : '') + '>' + l[2] + '</a>';
  }).join('');

  var header = document.createElement('header');
  header.className = 'site-header';
  header.innerHTML = '<div class="wrap"><a class="brand" href="' + root + 'index.html" aria-label="' + SITE + ' beranda">' +
    '<img class="brand-mark" src="' + root + 'assets/logo.svg" alt="" width="32" height="32">' +
    '<span class="brand-text">Sipil<span class="brand-accent">Belajar</span></span></a><nav class="site-nav">' + nav + '</nav></div>';
  document.body.insertBefore(header, document.body.firstChild);

  var footer = document.createElement('footer');
  footer.className = 'site-footer';
  footer.innerHTML = '<div class="wrap"><div class="footer-grid">' +
    '<div><a class="brand" href="' + root + 'index.html"><img class="brand-mark" src="' + root + 'assets/logo.svg" alt="" width="28" height="28">' +
    '<span>Sipil<span class="brand-accent">Belajar</span></span></a>' +
    '<p style="max-width:340px;margin:10px 0 0">Tutorial dan kalkulator struktur untuk mahasiswa teknik sipil. Gratis, dan semua hitungan berjalan di browser Anda.</p></div>' +
    '<div><h4>Kalkulator</h4><ul><li><a href="' + root + 'kalkulator/balok.html">Balok</a></li><li><a href="' + root + 'kalkulator/penampang.html">Properti penampang</a></li></ul></div>' +
    '<div><h4>Tutorial</h4><ul><li><a href="' + root + 'tutorial/balok-sederhana.html">Gaya dalam balok</a></li><li><a href="' + root + 'tutorial/momen-inersia.html">Momen inersia</a></li></ul></div>' +
    '</div><div class="footer-note">© ' + new Date().getFullYear() + ' ' + SITE +
    ' · Untuk belajar. Selalu periksa ulang hasil perhitungan sebelum dipakai untuk desain nyata.</div></div>';
  document.body.appendChild(footer);
})();
