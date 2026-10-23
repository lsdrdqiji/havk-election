/* ============================================================
   GYH · 2026  —  共享交互层（editorial 版）
   ============================================================ */
(function () {
  'use strict';

  /* ---------------- 滚动进度 ---------------- */
  var bar = document.querySelector('.progress');
  function onScroll() {
    if (!bar) return;
    var h = document.documentElement.scrollHeight - window.innerHeight;
    var p = h > 0 ? Math.min(1, Math.max(0, window.scrollY / h)) : 0;
    bar.style.width = (p * 100).toFixed(2) + '%';
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------------- 栏目悬停预览 ---------------- */
  var peek = document.getElementById('peek');
  var hoverOK = window.matchMedia('(hover: hover)').matches;

  if (peek && hoverOK) {
    var peekImg = peek.querySelector('img');
    var peekTxt = peek.querySelector('span');

    var place = function (x, y) {
      var w = 196, h = 248;
      var left = Math.min(Math.max(12, x - w * 0.62), window.innerWidth - w - 12);
      var top = Math.min(Math.max(12, y - h * 0.5), window.innerHeight - h - 12);
      peek.style.transform = 'translate3d(' + left + 'px,' + top + 'px,0)';
    };

    var rows = document.querySelectorAll('.entry');
    for (var i = 0; i < rows.length; i++) {
      (function (row) {
        row.addEventListener('pointerenter', function (e) {
          if (peekImg) {
            peekImg.src = row.getAttribute('data-img') || 'assets/portrait-blue.jpg';
            peekImg.style.objectPosition = row.getAttribute('data-pos') || '50% 30%';
          }
          if (peekTxt) peekTxt.textContent = row.getAttribute('data-label') || '';
          peek.classList.add('on');
          place(e.clientX, e.clientY);
        });

        row.addEventListener('pointermove', function (e) {
          place(e.clientX, e.clientY);
        });

        row.addEventListener('pointerleave', function () {
          peek.classList.remove('on');
        });
      })(rows[i]);
    }
  }

  /* ---------------- 滚动入场 ---------------- */
  var items = document.querySelectorAll('.reveal');

  function showAll() {
    for (var i = 0; i < items.length; i++) items[i].classList.add('in');
  }

  if ('IntersectionObserver' in window && items.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });

    for (var j = 0; j < items.length; j++) io.observe(items[j]);
    setTimeout(showAll, 2600);
  } else {
    showAll();
  }
})();
