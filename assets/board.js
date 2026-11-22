// Efek "ditulis di papan": paragraf muncul bertahap, garis diagram tergambar saat terlihat.
(function () {
  var board = document.querySelector('.board');
  if (!board || !('IntersectionObserver' in window)) return;
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.documentElement.classList.add('js-board');

  var items = board.querySelectorAll('.article > *:not(.chalk-svg)');
  items.forEach(function (el) { el.classList.add('reveal'); });

  var svgs = board.querySelectorAll('.chalk-svg');
  svgs.forEach(function (svg) {
    svg.querySelectorAll('.draw').forEach(function (p) {
      var len = p.getTotalLength ? Math.ceil(p.getTotalLength()) : 0;
      p.style.strokeDasharray = p.getAttribute('stroke-dasharray') ? '' : len + ' ' + len;
      if (!p.getAttribute('stroke-dasharray')) p.style.strokeDashoffset = len;
      p.dataset.len = len;
    });
  });

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target;
      io.unobserve(el);
      if (el.classList.contains('chalk-svg')) {
        el.classList.add('on');
        var paths = el.querySelectorAll('.draw'), t = 0;
        paths.forEach(function (p) {
          if (p.getAttribute('stroke-dasharray')) { p.style.opacity = 0; p.style.transition = 'opacity .4s ease ' + t + 's'; requestAnimationFrame(function () { p.style.opacity = 1; }); t += 0.05; return; }
          var d = Math.min(1.1, 0.25 + p.dataset.len / 900);
          p.style.transition = 'stroke-dashoffset ' + d + 's ease-out ' + t + 's';
          requestAnimationFrame(function () { p.style.strokeDashoffset = 0; });
          t += Math.min(d * 0.55, 0.35);
        });
      } else {
        el.classList.add('on');
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  items.forEach(function (el) { io.observe(el); });
  svgs.forEach(function (el) { io.observe(el); });
})();
