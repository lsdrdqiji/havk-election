/* ============================================================
   GYH · 2026  —  共享交互层
   ============================================================ */
(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- 时间码 ---------------- */
  var tc = document.getElementById('tc');
  if (tc) {
    var t0 = Date.now();
    var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
    setInterval(function () {
      var ms = Date.now() - t0;
      var s = Math.floor(ms / 1000);
      var f = Math.floor((ms % 1000) / 40);
      tc.textContent = pad(Math.floor(s / 3600)) + ':' + pad(Math.floor(s / 60) % 60) + ':' + pad(s % 60) + ':' + pad(f);
    }, 90);
  }

  /* ---------------- 背景：透视网格 + 浮尘 ---------------- */
  var cvs = document.getElementById('bg');
  if (cvs && !reduce) {
    var ctx = cvs.getContext('2d');
    var W = 0, H = 0, dpr = 1, horizon = 0, cx = 0;
    var dust = [];

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = window.innerWidth;
      H = window.innerHeight;
      cvs.width = Math.floor(W * dpr);
      cvs.height = Math.floor(H * dpr);
      cvs.style.width = W + 'px';
      cvs.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      horizon = H * 0.66;
      cx = W * 0.5;
      buildDust();
    }

    function buildDust() {
      dust = [];
      var n = Math.min(70, Math.round(W * H / 26000));
      for (var i = 0; i < n; i++) {
        dust.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: Math.random() * 1.5 + .35,
          vy: -(Math.random() * .28 + .06),
          a: Math.random() * .5 + .12
        });
      }
    }

    var t = 0;
    function draw() {
      t += 0.006;
      ctx.clearRect(0, 0, W, H);

      /* 地平线冷光 */
      var glow = ctx.createRadialGradient(cx, horizon, 0, cx, horizon, Math.max(W, H) * .62);
      glow.addColorStop(0, 'rgba(95,233,218,.10)');
      glow.addColorStop(.42, 'rgba(45,120,140,.05)');
      glow.addColorStop(1, 'rgba(4,7,10,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);

      /* 纵深横线 */
      ctx.lineWidth = 1;
      for (var i = 1; i <= 26; i++) {
        var z = i - (t * 2.6 % 1);
        if (z <= 0.35) continue;
        var y = horizon + (H * 1.02) / z;
        if (y > H * 1.25) continue;
        var fade = Math.min(1, (y - horizon) / (H * .45));
        ctx.strokeStyle = 'rgba(95,233,218,' + (0.30 * fade * fade).toFixed(3) + ')';
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      /* 透视竖线 */
      var cols = 16;
      for (var j = -cols; j <= cols; j++) {
        var ratio = j / cols;
        var xb = cx + ratio * W * 1.7;
        var xt = cx + ratio * W * 0.055;
        ctx.strokeStyle = 'rgba(95,233,218,.055)';
        ctx.beginPath();
        ctx.moveTo(xt, horizon);
        ctx.lineTo(xb, H * 1.2);
        ctx.stroke();
      }

      /* 浮尘 */
      for (var k = 0; k < dust.length; k++) {
        var p = dust[k];
        p.y += p.vy;
        if (p.y < -6) { p.y = H + 6; p.x = Math.random() * W; }
        ctx.fillStyle = 'rgba(198,235,240,' + p.a.toFixed(2) + ')';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      /* 扫描光带 */
      var sweep = (Date.now() % 9000) / 9000;
      if (sweep < .28) {
        var sy = (sweep / .28) * H;
        var sg = ctx.createLinearGradient(0, sy - 90, 0, sy + 20);
        sg.addColorStop(0, 'rgba(95,233,218,0)');
        sg.addColorStop(.85, 'rgba(95,233,218,.06)');
        sg.addColorStop(1, 'rgba(95,233,218,.16)');
        ctx.fillStyle = sg;
        ctx.fillRect(0, sy - 90, W, 110);
      }

      requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize);
    requestAnimationFrame(draw);
  }

  /* ---------------- 人像视差 ---------------- */
  var subject = document.querySelector('.subject');
  var subjectInner = document.querySelector('.subject-inner');
  if (subject && subjectInner && !reduce && window.matchMedia('(hover:hover)').matches) {
    var rx = 0, ry = 0, trx = 0, tryy = 0, rafId = null;
    var running = false;

    function tick() {
      rx += (trx - rx) * .08;
      ry += (tryy - ry) * .08;
      subjectInner.style.transform = 'rotateY(' + (-6 + ry).toFixed(2) + 'deg) rotateX(' + (2 + rx).toFixed(2) + 'deg) translateZ(0)';
      if (Math.abs(trx - rx) > .01 || Math.abs(tryy - ry) > .01) {
        rafId = requestAnimationFrame(tick);
      } else {
        running = false;
      }
    }

    subject.addEventListener('pointermove', function (e) {
      var r = subject.getBoundingClientRect();
      trx = ((e.clientY - r.top) / r.height - .5) * -7;
      tryy = ((e.clientX - r.left) / r.width - .5) * 9;
      if (!running) { running = true; rafId = requestAnimationFrame(tick); }
    }, { passive: true });

    subject.addEventListener('pointerleave', function () {
      trx = 0; tryy = 0;
      if (!running) { running = true; rafId = requestAnimationFrame(tick); }
    });
  }

  /* ---------------- 滚动进度 + 顶部状态隐去 ---------------- */
  var bar = document.querySelector('.progress');
  var isScrolled = false;
  function topChrome() {
    var y = window.scrollY;
    if (y > 60 && !isScrolled) { document.body.classList.add('scrolled'); isScrolled = true; }
    else if (y <= 60 && isScrolled) { document.body.classList.remove('scrolled'); isScrolled = false; }
  }

  function onScroll() {
    if (bar) {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var p = h > 0 ? Math.min(1, Math.max(0, window.scrollY / h)) : 0;
      bar.style.width = (p * 100).toFixed(2) + '%';
    }
    topChrome();
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------------- 栏目悬停预览 ---------------- */
  var peek = document.getElementById('peek');
  var peekImg = peek ? peek.querySelector('img') : null;
  var peekTxt = peek ? peek.querySelector('span') : null;
  var hoverOK = window.matchMedia('(hover: hover)').matches;

  if (peek && hoverOK) {
    var px = 0, py = 0;
    var place = function (x, y) {
      var w = 196, h = 248;
      var left = Math.min(Math.max(12, x - w * 0.62), window.innerWidth - w - 12);
      var top = Math.min(Math.max(12, y - h * 0.5), window.innerHeight - h - 12);
      peek.style.transform = 'translate3d(' + left + 'px,' + top + 'px,0)';
    };

    document.querySelectorAll('.entry').forEach(function (row) {
      row.addEventListener('pointerenter', function (e) {
        peekImg.src = row.getAttribute('data-img') || 'assets/portrait-blue.jpg';
        peekImg.style.objectPosition = row.getAttribute('data-pos') || '50% 30%';
        peekTxt.textContent = row.getAttribute('data-label') || '';
        peek.classList.add('on');
        px = e.clientX; py = e.clientY;
        place(px, py);
      });
      row.addEventListener('pointermove', function (e) {
        px = e.clientX; py = e.clientY;
        place(px, py);
      });
      row.addEventListener('pointerleave', function () {
        peek.classList.remove('on');
      });
    });
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
    for (var i = 0; i < items.length; i++) io.observe(items[i]);
    setTimeout(showAll, 2600);
  } else {
    showAll();
  }
})();
