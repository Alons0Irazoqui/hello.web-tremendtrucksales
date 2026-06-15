/* ============================================================
   TRACTO REFACCIONES — main.js
   Pure-JS animations · Paleta Ámbar Dorado
   ============================================================ */
'use strict';

function ready(fn) {
  if (document.readyState !== 'loading') fn();
  else document.addEventListener('DOMContentLoaded', fn);
}

ready(function () {
  initProgressBar();
  initNavbar();
  initMobileMenu();
  initHeroTextWow();
  initHeroCanvas();
  initHeroTilt();
  initParallax();
  initScrollReveal();
  initCounters();
  initForm();
  initSmoothScroll();
  initGalleryExpand();
  initLightbox();
});

/* ============================================================
   1. SCROLL PROGRESS BAR
   ============================================================ */
function initProgressBar() {
  var bar = document.getElementById('progress-bar');
  if (!bar) return;
  window.addEventListener('scroll', function () {
    var total = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = total > 0 ? (window.scrollY / total * 100) + '%' : '0%';
  }, { passive: true });
}

/* ============================================================
   2. NAVBAR — transparent → solid on scroll
   ============================================================ */
function initNavbar() {
  var nav = document.getElementById('navbar');
  if (!nav) return;
  function check() { nav.classList.toggle('scrolled', window.scrollY > 40); }
  window.addEventListener('scroll', check, { passive: true });
  check();
}

/* ============================================================
   3. MOBILE MENU
   ============================================================ */
function initMobileMenu() {
  var btn  = document.getElementById('hamburger');
  var menu = document.getElementById('mobile-menu');
  if (!btn || !menu) return;

  btn.addEventListener('click', function () {
    var isOpen = !menu.classList.contains('hidden');
    menu.classList.toggle('hidden', isOpen);
    btn.classList.toggle('open', !isOpen);
  });
  menu.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () {
      menu.classList.add('hidden');
      btn.classList.remove('open');
    });
  });
}

/* ============================================================
   4. HERO TITLE — word-level cascade animation
   Each WORD gets a display:inline-block; white-space:nowrap
   container so the browser NEVER breaks mid-word.
   Characters inside each word animate individually.
   ============================================================ */
function initHeroTextWow() {
  var title = document.querySelector('.hero-title');
  if (!title) return;

  /* Take ownership of visibility — disable CSS entrance animation */
  title.classList.remove('hero-anim');
  title.style.opacity   = '1';
  title.style.transform = 'none';
  title.style.animation = 'none';

  var snapshot = Array.from(title.childNodes);
  title.innerHTML = '';
  var chars = [];

  /* Wrap one word in a no-break container, push chars into `chars` */
  function makeWordSpan(word, container) {
    var wrapper = document.createElement('span');
    wrapper.style.cssText = 'display:inline-block;white-space:nowrap;';
    word.split('').forEach(function (ch) {
      var span = document.createElement('span');
      span.style.cssText =
        'display:inline-block;opacity:0;transform:translateY(44px);' +
        'will-change:transform,opacity;';
      span.textContent = ch;
      chars.push(span);
      wrapper.appendChild(span);
    });
    container.appendChild(wrapper);
  }

  /* Process a text string: words → word-spans, spaces → text nodes
     (text nodes are natural line-break opportunities). */
  function processText(text, container) {
    var parts = text.trim().split(/(\s+)/);
    parts.forEach(function (part) {
      if (!part || /^\s+$/.test(part)) {
        /* Inter-word space — use a text node so the browser can
           still wrap at word boundaries (just not mid-word). */
        if (part && part.indexOf(' ') !== -1) {
          container.appendChild(document.createTextNode(' '));
        }
        return;
      }
      makeWordSpan(part, container);
    });
  }

  snapshot.forEach(function (node) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.textContent.trim()) {
        processText(node.textContent, title);
      }
    } else if (node.nodeName === 'BR') {
      title.appendChild(document.createElement('br'));
    } else if (node.nodeName === 'SPAN') {
      /* Preserve the amber accent class wrapper */
      var outer = document.createElement('span');
      outer.className = node.className;
      title.appendChild(outer);
      node.childNodes.forEach(function (child) {
        if (child.nodeType === Node.TEXT_NODE && child.textContent.trim()) {
          processText(child.textContent, outer);
        }
      });
    }
  });

  /* Staggered spring entrance — 26 ms between each character */
  chars.forEach(function (ch, i) {
    setTimeout(function () {
      ch.style.transition = 'transform 0.6s cubic-bezier(0.22,1,0.36,1), opacity 0.4s ease';
      ch.style.transform  = 'translateY(0)';
      ch.style.opacity    = '1';
    }, 280 + i * 26);
  });
}

/* ============================================================
   5. HERO CANVAS — bokeh orbs · spark embers · mouse spotlight

   SIZING STRATEGY
   ─────────────────────────────────────────────────────────────
   • Seed immediately with window.innerWidth/innerHeight (always
     correct, no layout dependency at DOMContentLoaded).
   • Re-measure via hero.offsetWidth/offsetHeight at:
       – first rAF (after browser processes one frame)
       – 150 ms (catches Tailwind CDN style injection)
       – 600 ms (catches font-load / image-load reflows)
   • scatter() redistributes ALL particles across the new W × H.
   ============================================================ */
function initHeroCanvas() {
  var canvas = document.getElementById('hero-canvas');
  var hero   = document.querySelector('.hero-section');
  if (!canvas || !hero) return;

  var ctx = canvas.getContext('2d');
  var W = 0, H = 0;

  var mouse = { x: -9999, y: -9999, sx: -9999, sy: -9999 };

  /* ── Bokeh orbs ─────────────────────────────────────── */
  var NUM_BOKEH = 10;
  var bokeh = [];

  function makeBokeh(spread) {
    return {
      x:  Math.random() * W,
      y:  spread ? Math.random() * H : H + 130,
      r:  80 + Math.random() * 170,
      vx: (Math.random() - 0.5) * 0.14,
      vy: -(0.03 + Math.random() * 0.09),
      a:  0.028 + Math.random() * 0.055,
      ph: Math.random() * Math.PI * 2,
      ps: 0.006 + Math.random() * 0.006,
    };
  }

  /* ── Spark embers ───────────────────────────────────── */
  var NUM_SPARKS = 72;
  var sparks = [];

  function makeSpark(spread) {
    return {
      x:    Math.random() * W,
      y:    spread ? Math.random() * H : H + 8,
      sz:   0.6 + Math.random() * 2.6,
      vx:   (Math.random() - 0.5) * 0.4,
      vy:   -(0.25 + Math.random() * 0.55),
      a:    0.35 + Math.random() * 0.6,
      life: spread ? Math.random() : 0,
      dec:  0.0012 + Math.random() * 0.0024,
    };
  }

  /* ── Sizing helpers ─────────────────────────────────── */
  function resize() {
    W = canvas.width  = hero.offsetWidth  || window.innerWidth;
    H = canvas.height = hero.offsetHeight || window.innerHeight;
  }

  /* Redistribute every existing particle across the full W × H */
  function scatter() {
    bokeh.forEach(function (b) {
      b.x = Math.random() * W;
      b.y = Math.random() * H;
    });
    sparks.forEach(function (s) {
      s.x    = Math.random() * W;
      s.y    = Math.random() * H;
      s.life = Math.random();
    });
  }

  /* ── Init ───────────────────────────────────────────── */
  function init() {
    /* Immediate seed with window size — guaranteed correct */
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;

    for (var i = 0; i < NUM_BOKEH;  i++) bokeh.push(makeBokeh(true));
    for (var j = 0; j < NUM_SPARKS; j++) sparks.push(makeSpark(true));

    /* Re-measure with hero element dimensions + redistribute */
    requestAnimationFrame(function () { resize(); scatter(); });
    setTimeout(function ()            { resize(); scatter(); }, 150);
    setTimeout(function ()            { resize(); scatter(); }, 600);
  }

  /* ── Draw loop ──────────────────────────────────────── */
  var SPARK_COLORS = ['245,158,11', '251,191,36', '252,211,77', '255,245,200'];

  function draw() {
    ctx.clearRect(0, 0, W, H);

    mouse.sx += (mouse.x - mouse.sx) * 0.055;
    mouse.sy += (mouse.y - mouse.sy) * 0.055;

    /* Spotlight */
    if (mouse.x > -5000) {
      var sg = ctx.createRadialGradient(mouse.sx, mouse.sy, 0, mouse.sx, mouse.sy, 380);
      sg.addColorStop(0,    'rgba(245,158,11,0.10)');
      sg.addColorStop(0.45, 'rgba(245,158,11,0.035)');
      sg.addColorStop(1,    'rgba(245,158,11,0)');
      ctx.fillStyle = sg;
      ctx.fillRect(0, 0, W, H);
    }

    /* Bokeh */
    for (var bi = 0; bi < bokeh.length; bi++) {
      var b = bokeh[bi];
      b.ph += b.ps;
      b.x  += b.vx;
      b.y  += b.vy;

      if (b.y + b.r < -20)     { bokeh[bi] = makeBokeh(false); continue; }
      if (b.x < -(b.r + 20))   b.x = W + b.r;
      if (b.x >  W + b.r + 20) b.x = -b.r;

      var pa = b.a * (0.6 + 0.4 * Math.sin(b.ph));
      var bg = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
      bg.addColorStop(0,   'rgba(251,191,36,' + Math.min(pa * 2.2, 0.22).toFixed(3) + ')');
      bg.addColorStop(0.4, 'rgba(245,158,11,' + pa.toFixed(3) + ')');
      bg.addColorStop(1,   'rgba(245,158,11,0)');
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = bg;
      ctx.fill();
    }

    /* Sparks */
    for (var si = 0; si < sparks.length; si++) {
      var s = sparks[si];
      s.life += s.dec;
      s.x    += s.vx;
      s.y    += s.vy;
      s.vx   += (Math.random() - 0.5) * 0.018;

      if (s.life >= 1 || s.y < -15) {
        sparks[si] = makeSpark(false);
        continue;
      }

      var p    = s.life;
      var fade = p < 0.12 ? p / 0.12 : p > 0.78 ? (1 - p) / 0.22 : 1;
      var a    = (s.a * fade).toFixed(3);
      var ci   = Math.min(Math.floor(s.sz / 0.8), SPARK_COLORS.length - 1);

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.sz, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + SPARK_COLORS[ci] + ',' + a + ')';
      ctx.fill();

      if (s.sz > 1.6) {
        var hr = s.sz * 4;
        var hg = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, hr);
        hg.addColorStop(0, 'rgba(245,158,11,' + (parseFloat(a) * 0.3).toFixed(3) + ')');
        hg.addColorStop(1, 'rgba(245,158,11,0)');
        ctx.beginPath();
        ctx.arc(s.x, s.y, hr, 0, Math.PI * 2);
        ctx.fillStyle = hg;
        ctx.fill();
      }
    }

    requestAnimationFrame(draw);
  }

  /* ── Events ─────────────────────────────────────────── */
  hero.addEventListener('mousemove', function (e) {
    var r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
  });
  hero.addEventListener('mouseleave', function () {
    mouse.x = -9999; mouse.y = -9999;
  });
  hero.addEventListener('touchmove', function (e) {
    var r = canvas.getBoundingClientRect();
    mouse.x = e.touches[0].clientX - r.left;
    mouse.y = e.touches[0].clientY - r.top;
  }, { passive: true });

  window.addEventListener('resize', function () { resize(); scatter(); }, { passive: true });
  new ResizeObserver(function () { resize(); scatter(); }).observe(hero);

  init();
  requestAnimationFrame(draw);
}

/* ============================================================
   6. HERO 3-D TILT
   ============================================================ */
function initHeroTilt() {
  var hero    = document.querySelector('.hero-section');
  var content = document.querySelector('.hero-content');
  if (!hero || !content) return;

  var tRX = 0, tRY = 0, cRX = 0, cRY = 0;
  content.style.willChange     = 'transform';
  content.style.transformStyle = 'preserve-3d';

  hero.addEventListener('mousemove', function (e) {
    var r  = hero.getBoundingClientRect();
    var dx = (e.clientX - r.left  - r.width  / 2) / (r.width  / 2);
    var dy = (e.clientY - r.top   - r.height / 2) / (r.height / 2);
    tRY =  dx * 3.5;
    tRX = -dy * 1.8;
  });
  hero.addEventListener('mouseleave', function () { tRX = 0; tRY = 0; });

  (function tick() {
    cRX += (tRX - cRX) * 0.07;
    cRY += (tRY - cRY) * 0.07;
    content.style.transform =
      'perspective(1100px) rotateX(' + cRX.toFixed(3) + 'deg) rotateY(' + cRY.toFixed(3) + 'deg)';
    requestAnimationFrame(tick);
  }());
}

/* ============================================================
   7. PARALLAX — hero background on scroll
   ============================================================ */
function initParallax() {
  var bg = document.querySelector('.hero-bg');
  if (!bg) return;
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (!ticking) {
      requestAnimationFrame(function () {
        bg.style.transform = 'scale(1.05) translateY(' + (window.scrollY * 0.24) + 'px)';
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

/* ============================================================
   8. SCROLL REVEAL
   ============================================================ */
function initScrollReveal() {
  var rOpts = { threshold: 0.12, rootMargin: '0px 0px -40px 0px' };
  var sOpts = { threshold: 0.08, rootMargin: '0px 0px -30px 0px' };

  var revObs = new IntersectionObserver(function (entries, obs) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
    });
  }, rOpts);
  document.querySelectorAll('.reveal').forEach(function (el) { revObs.observe(el); });

  var stgObs = new IntersectionObserver(function (entries, obs) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('triggered'); obs.unobserve(e.target); }
    });
  }, sOpts);
  document.querySelectorAll('.stagger-parent').forEach(function (el) { stgObs.observe(el); });
}

/* ============================================================
   9. COUNTER ANIMATION
   ============================================================ */
function initCounters() {
  var nums = document.querySelectorAll('.stat-number[data-count]');
  if (!nums.length) return;

  function run(el, target, dur) {
    var t0 = performance.now();
    (function step(now) {
      var p = Math.min((now - t0) / dur, 1);
      el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * target);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target;
    }(performance.now()));
  }

  var obs = new IntersectionObserver(function (entries, obs) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        run(e.target, parseInt(e.target.dataset.count, 10), 1800);
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });
  nums.forEach(function (el) { obs.observe(el); });
}

/* ============================================================
   10. CONTACT FORM
   ============================================================ */
function initForm() {
  var form    = document.getElementById('contact-form');
  var success = document.getElementById('form-success');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var valid = true;
    form.querySelectorAll('[required]').forEach(function (f) {
      f.style.borderColor = '';
      if (!f.value.trim()) { valid = false; f.style.borderColor = '#F59E0B'; }
    });
    if (!valid) return;

    var btn = form.querySelector('[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Enviando…';

    setTimeout(function () {
      btn.style.display = 'none';
      if (success) {
        success.classList.remove('hidden');
        success.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      form.reset();
    }, 1400);
  });

  form.querySelectorAll('.form-input').forEach(function (f) {
    f.addEventListener('input', function () { this.style.borderColor = ''; });
  });
}

/* ============================================================
   12. GALLERY — expand + lightbox
   ============================================================ */
function initGalleryExpand() {
  var btn    = document.getElementById('gallery-more-btn');
  var extras = document.querySelectorAll('.gallery-extra');
  if (!btn || !extras.length) return;

  var expanded = false;

  btn.addEventListener('click', function () {
    expanded = !expanded;
    extras.forEach(function (el, i) {
      if (expanded) {
        el.style.display = 'block';
        el.style.animation = 'none';
        void el.offsetWidth; /* force reflow so animation restarts */
        el.style.animation =
          'galleryItemIn 0.45s cubic-bezier(0.22,1,0.36,1) ' + (i * 65) + 'ms both';
      } else {
        el.style.animation = 'none';
        el.style.display   = 'none';
      }
    });
    var span = btn.querySelector('span');
    var icon = btn.querySelector('i');
    if (span) span.textContent = expanded ? 'Ver menos' : 'Ver más fotos';
    if (icon) icon.className   = expanded
      ? 'fa-solid fa-chevron-up mr-2'
      : 'fa-solid fa-images mr-2';
  });
}

function initLightbox() {
  var lb      = document.getElementById('lightbox');
  var lbImg   = document.getElementById('lb-img');
  var lbClose = document.getElementById('lb-close');
  var lbPrev  = document.getElementById('lb-prev');
  var lbNext  = document.getElementById('lb-next');
  var lbCur   = document.getElementById('lb-current');
  var lbTot   = document.getElementById('lb-total');
  if (!lb || !lbImg) return;

  var images = [];
  var idx    = 0;

  document.querySelectorAll('.gallery-item img').forEach(function (img) {
    images.push({ src: img.src, alt: img.alt });
  });
  if (lbTot) lbTot.textContent = images.length;

  function show(i) {
    idx = (i + images.length) % images.length;
    lbImg.style.opacity = '0';
    setTimeout(function () {
      lbImg.src           = images[idx].src;
      lbImg.alt           = images[idx].alt;
      lbImg.style.opacity = '1';
    }, 130);
    if (lbCur) lbCur.textContent = idx + 1;
  }

  function open(i) {
    show(i);
    lb.classList.add('active');
    lb.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    lb.classList.remove('active');
    lb.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.gallery-item').forEach(function (item, i) {
    item.style.cursor = 'pointer';
    item.addEventListener('click', function () { open(i); });
  });

  lbClose.addEventListener('click', close);
  lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
  lbPrev.addEventListener('click', function (e) { e.stopPropagation(); show(idx - 1); });
  lbNext.addEventListener('click', function (e) { e.stopPropagation(); show(idx + 1); });

  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('active')) return;
    if (e.key === 'Escape')     close();
    if (e.key === 'ArrowLeft')  show(idx - 1);
    if (e.key === 'ArrowRight') show(idx + 1);
  });
}

/* ============================================================
   11. SMOOTH ANCHOR SCROLL
   ============================================================ */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = this.getAttribute('href');
      if (id === '#') return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var offset = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--nav-h') || '72', 10
      );
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY - offset,
        behavior: 'smooth',
      });
    });
  });
}
