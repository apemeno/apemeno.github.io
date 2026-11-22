// Konten premium: tampilkan sebagian tutorial, kunci sisanya dengan ajakan berlangganan.
// Pemakaian: taruh <div class="premium-mark"></div> di artikel. Semua elemen setelahnya
// (dalam induk yang sama) disembunyikan sampai pengunjung memasukkan kode langganan.
//
// CATATAN: kunci ini berjalan di browser, jadi hanya "tirai". Isi yang dikunci tetap ada
// di kode HTML. Untuk proteksi sungguhan perlu login + server (lihat berlangganan.html).
(function () {
  var root = document.body.getAttribute('data-root') || '';
  var CONFIG = {
    // Halaman/tautan pembayaran. Ganti dengan link Lynk.id / Trakteer / Midtrans bila sudah ada.
    checkoutUrl: root + 'berlangganan.html',
    // SHA-256 dari kode langganan yang berlaku (huruf besar). Kode dibagikan ke pembeli.
    codeHashes: ['91feade6b233ca851bb165de7792ca94c5f1f84741eca7410d46205acac624a0']
  };
  var KEY = 'sb-premium';

  function store(v) { try { if (v) localStorage.setItem(KEY, v); return localStorage.getItem(KEY); } catch (e) { return null; } }
  function unlocked() { var v = store(); return !!v && CONFIG.codeHashes.indexOf(v) >= 0; }

  function sha256(s) {
    if (!window.crypto || !crypto.subtle) return Promise.reject(new Error('no-crypto'));
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
    });
  }

  // Dipakai juga oleh formulir kode di halaman berlangganan.
  window.SBPremium = {
    unlocked: unlocked,
    checkoutUrl: CONFIG.checkoutUrl,
    redeem: function (code) {
      var c = String(code || '').trim().toUpperCase();
      return sha256(c).then(function (h) {
        if (CONFIG.codeHashes.indexOf(h) < 0) return false;
        store(h); return true;
      });
    },
    reset: function () { try { localStorage.removeItem(KEY); } catch (e) {} }
  };

  var marks = document.querySelectorAll('.premium-mark');
  if (!marks.length) return;

  if (unlocked()) {
    marks.forEach(function (m) {
      m.className = 'premium-ok';
      m.textContent = '★ Konten premium terbuka. Terima kasih sudah berlangganan!';
    });
    return;
  }

  marks.forEach(function (m) {
    var hidden = [];
    var n = m.nextElementSibling;
    while (n) { hidden.push(n); n = n.nextElementSibling; }
    hidden.forEach(function (el) { el.classList.add('premium-hidden'); el.setAttribute('aria-hidden', 'true'); });

    // Judul bagian yang dikunci, supaya pembaca tahu apa yang menunggu.
    var titles = hidden.filter(function (el) { return /^H[23]$/.test(el.tagName); })
      .map(function (el) { return el.textContent.trim(); }).slice(0, 6);

    var box = document.createElement('div');
    box.className = 'paywall';
    box.innerHTML =
      '<div class="pw-fade" aria-hidden="true"></div>' +
      '<div class="pw-card">' +
        '<span class="pw-badge">★ PREMIUM</span>' +
        '<h3>Lanjutkan belajar dengan Premium</h3>' +
        '<p>Bagian berikutnya berisi pembahasan lengkap, gambar, animasi, dan rumus praktis.</p>' +
        (titles.length ? '<ul class="pw-list">' + titles.map(function (t) { return '<li>🔒 ' + t + '</li>'; }).join('') + '</ul>' : '') +
        '<div class="pw-actions"><a class="btn primary" href="' + CONFIG.checkoutUrl + '">Berlangganan sekarang</a>' +
        '<a class="btn secondary" href="' + root + 'berlangganan.html#kode">Saya punya kode</a></div>' +
        '<p class="pw-small">Kalkulator dan materi PDF tetap gratis.</p>' +
      '</div>';
    m.replaceWith(box);
  });
})();
