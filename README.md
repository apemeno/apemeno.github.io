# SipilBelajar

Website statis untuk belajar teknik sipil: tutorial, contoh soal, dan kalkulator struktur.
Tanpa build step atau server. Cukup buka `index.html` di browser, atau unggah folder ini ke GitHub Pages / Netlify.

## Struktur
```
index.html                 Beranda
tutorial/                  Materi (balok-sederhana, momen-inersia)
kalkulator/balok.html      Balok sederhana & kantilever: reaksi, SFD, BMD, lendutan
kalkulator/penampang.html  Properti penampang: A, ȳ, Ix, Iy, S, r
assets/style.css           Tampilan (mode terang & gelap otomatis)
assets/layout.js           Header & footer bersama
assets/plot.js             Penggambar diagram SVG
assets/beam.js             Logika kalkulator balok
assets/section.js          Logika kalkulator penampang
```

## Menambah tutorial
Salin `tutorial/balok-sederhana.html`, ganti isinya, lalu tambahkan kartunya di `tutorial/index.html` dan `index.html`.

## Satuan
Balok: kN, m, kN/m; E dalam MPa, I dalam 10⁶ mm⁴; lendutan dalam mm.
Penampang: mm.
