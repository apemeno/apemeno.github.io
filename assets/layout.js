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
  header.innerHTML = '<div class="wrap"><a class="brand" href="' + root + 'index.html">' +
    '<span class="brand-mark">SB</span>' + SITE + '</a><nav class="site-nav">' + nav + '</nav></div>';
  document.body.insertBefore(header, document.body.firstChild);

  var footer = document.createElement('footer');
  footer.className = 'site-footer';
  footer.innerHTML = '<div class="wrap">© ' + new Date().getFullYear() + ' ' + SITE +
    ' · Materi dan kalkulator untuk belajar. Selalu periksa ulang hasil perhitungan sebelum dipakai untuk desain nyata.</div>';
  document.body.appendChild(footer);
})();
