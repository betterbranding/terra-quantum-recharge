/* Terra Quantum Recharge · V4 interaction engine
   Depends on: GSAP 3 + ScrollTrigger, Lenis (all loaded via CDN, gracefully optional) */
(function () {
  var d = document, w = window;
  var reduce = w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = typeof gsap !== 'undefined';
  var fine = w.matchMedia('(hover:hover) and (pointer:fine)').matches;
  d.documentElement.classList.add('js');

  /* ---- footer year + active nav ---- */
  var yr = d.getElementById('yr'); if (yr) yr.textContent = new Date().getFullYear();
  var page = (location.pathname.split('/').pop() || 'index').replace('.html', '') || 'index';
  if (page === '') page = 'index';
  d.querySelectorAll('.tqr-nav .links a').forEach(function (a) {
    var p = a.getAttribute('data-page');
    if (p === page || (page === 'index' && p === 'index')) a.classList.add('active');
  });
  var nav = d.querySelector('.tqr-nav'), toggle = d.getElementById('navToggle');
  if (toggle) toggle.addEventListener('click', function () { nav.classList.toggle('open'); });
  d.querySelectorAll('.tqr-nav .links a').forEach(function (a) { a.addEventListener('click', function () { nav.classList.remove('open'); }); });

  /* ---- background layers ---- */
  var bgWrap = d.createElement('div');
  bgWrap.innerHTML = '<canvas id="stars"></canvas><div class="aurora" aria-hidden="true"><span class="a1"></span><span class="a2"></span><span class="a3"></span></div><div class="diag" aria-hidden="true"></div><div class="grain" aria-hidden="true"></div><div id="glow" aria-hidden="true"></div>';
  while (bgWrap.firstChild) d.body.insertBefore(bgWrap.firstChild, d.body.firstChild);

  /* ---- starfield ---- */
  var cv = d.getElementById('stars'), ctx = cv.getContext('2d'), stars = [], W, H, mx = 0, my = 0, tx = 0, ty = 0;
  function sizeStars() {
    W = cv.width = w.innerWidth; H = cv.height = w.innerHeight;
    var n = Math.min(220, Math.floor(W * H / 9000)); stars = [];
    for (var i = 0; i < n; i++) stars.push({ x: Math.random() * W, y: Math.random() * H, z: Math.random(), r: Math.random() * 1.4 + .3, p: Math.random() * Math.PI * 2, s: Math.random() * .6 + .2 });
  }
  sizeStars(); w.addEventListener('resize', sizeStars);
  var scrollY = 0;
  function drawStars(t) {
    ctx.clearRect(0, 0, W, H);
    tx += (mx - tx) * .04; ty += (my - ty) * .04;
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i], depth = .3 + s.z;
      var x = s.x + tx * 30 * depth, y = ((s.y - scrollY * .08 * depth) % H + H) % H + ty * 30 * depth;
      var a = .35 + .65 * (0.5 + 0.5 * Math.sin(t * .001 * s.s + s.p));
      ctx.beginPath(); ctx.arc(x, y, s.r * depth, 0, 6.283);
      ctx.fillStyle = s.z > .8 ? 'rgba(240,192,90,' + a * .9 + ')' : (s.z > .6 ? 'rgba(217,70,239,' + a * .8 + ')' : 'rgba(255,255,255,' + a * .7 + ')');
      ctx.fill();
    }
    if (!reduce) requestAnimationFrame(drawStars);
  }
  requestAnimationFrame(drawStars);
  if (fine) w.addEventListener('pointermove', function (e) { mx = e.clientX / W - .5; my = e.clientY / H - .5; });

  /* ---- cursor glow ---- */
  var glow = d.getElementById('glow');
  if (fine && !reduce) {
    d.body.classList.add('has-pointer');
    var gx = W / 2, gy = H / 2, cx = gx, cy = gy;
    w.addEventListener('pointermove', function (e) { gx = e.clientX; gy = e.clientY; });
    (function loopGlow() { cx += (gx - cx) * .12; cy += (gy - cy) * .12; glow.style.transform = 'translate(' + cx + 'px,' + cy + 'px)'; requestAnimationFrame(loopGlow); })();
  }

  /* ---- smooth scroll (Lenis) ---- */
  var lenis = null;
  if (!reduce && typeof Lenis !== 'undefined' && fine) {
    lenis = new Lenis({ lerp: .09, wheelMultiplier: 1, smoothWheel: true });
    if (hasGsap) {
      lenis.on('scroll', function (e) { scrollY = e.scroll; if (w.ScrollTrigger) ScrollTrigger.update(); });
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })();
      lenis.on('scroll', function (e) { scrollY = e.scroll; });
    }
    d.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) { var id = a.getAttribute('href'); if (id.length > 1 && d.querySelector(id)) { e.preventDefault(); lenis.scrollTo(id, { offset: -100 }); } });
    });
  } else {
    w.addEventListener('scroll', function () { scrollY = w.scrollY; }, { passive: true });
  }

  /* ---- nav shrink ---- */
  function onScroll() { var y = lenis ? lenis.scroll : w.scrollY; nav && nav.classList.toggle('scrolled', y > 40); }
  if (lenis) lenis.on('scroll', onScroll); else w.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- split headline (chars tumble in with perspective) ---- */
  function split(el) {
    if (el.dataset.splitDone) return [];
    el.dataset.splitDone = '1';
    var chars = [];
    function walk(node) {
      if (node.nodeType === 3) {
        var frag = d.createDocumentFragment(), words = node.textContent.split(/(\s+)/);
        words.forEach(function (wd) {
          if (!wd) return;
          if (/^\s+$/.test(wd)) { frag.appendChild(d.createTextNode(' ')); return; }
          var ws = d.createElement('span'); ws.className = 'word';
          Array.from(wd).forEach(function (ch) { var c = d.createElement('span'); c.className = 'char'; c.textContent = ch; ws.appendChild(c); chars.push(c); });
          frag.appendChild(ws);
        });
        node.parentNode.replaceChild(frag, node);
      } else if (node.nodeType === 1 && node.tagName !== 'BR') { Array.from(node.childNodes).forEach(walk); }
    }
    Array.from(el.childNodes).forEach(walk);
    return chars;
  }

  var heroH1 = d.querySelector('.hero h1');
  if (heroH1 && hasGsap && !reduce) {
    var chars = split(heroH1);
    gsap.set(chars, { opacity: 0, y: 40, rotateX: -80, rotateZ: -6, transformOrigin: '0% 100% -20px' });
    var tl = gsap.timeline({ delay: .15 });
    tl.to(chars, { opacity: 1, y: 0, rotateX: 0, rotateZ: 0, duration: 1.1, ease: 'expo.out', stagger: { each: .022, from: 'start' } })
      .from('.hero .eyebrow', { opacity: 0, y: 14, duration: .8, ease: 'power3.out' }, 0)
      .from('.hero p.lead, .hero .hero-statement, .hero .btn-row, .hero .hero-note', { opacity: 0, y: 24, filter: 'blur(8px)', duration: 1, stagger: .12, ease: 'power3.out' }, .55);
    d.querySelectorAll('.hero .reveal').forEach(function (r) { r.classList.add('visible'); });
    /* subtle idle drift on chars after entrance */
    tl.add(function () { gsap.to(chars, { y: function (i) { return Math.sin(i) * 2; }, duration: 3, yoyo: true, repeat: -1, ease: 'sine.inOut', stagger: { each: .05, repeat: -1, yoyo: true } }); });
  } else if (heroH1) {
    d.querySelectorAll('.hero .reveal').forEach(function (r) { r.classList.add('visible'); });
  }

  /* ---- section h2 split on scroll ---- */
  if (hasGsap && w.ScrollTrigger && !reduce) {
    gsap.registerPlugin(ScrollTrigger);
    d.querySelectorAll('.section h2, .cta-band h2').forEach(function (h) {
      var cs = split(h); if (!cs.length) return;
      h.style.perspective = '500px';
      gsap.set(cs, { opacity: 0, y: 30, rotateX: -60, transformOrigin: '0% 100% -10px' });
      gsap.to(cs, { opacity: 1, y: 0, rotateX: 0, duration: .9, ease: 'expo.out', stagger: .014, scrollTrigger: { trigger: h, start: 'top 88%', once: true } });
    });

    /* reveal elements */
    d.querySelectorAll('.reveal:not(.visible)').forEach(function (el) {
      ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: function () { el.classList.add('visible'); } });
    });

    /* hero image + orbs parallax */
    var hero = d.querySelector('.hero');
    if (hero) {
      gsap.to('.hero .wrap', { y: 120, opacity: .3, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
      gsap.to('.hero-fx .o1', { y: -60, x: 30, duration: 6, yoyo: true, repeat: -1, ease: 'sine.inOut' });
      gsap.to('.hero-fx .o2', { y: 50, x: -40, duration: 7, yoyo: true, repeat: -1, ease: 'sine.inOut' });
      gsap.to('.hero-fx .o3', { y: -40, x: -50, duration: 8, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    }

    /* aurora blobs drift with scroll + slow orbit */
    gsap.to('.aurora .a1', { x: 120, y: 80, duration: 18, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    gsap.to('.aurora .a2', { x: -140, y: 120, duration: 22, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    gsap.to('.aurora .a3', { x: 90, y: -100, duration: 26, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    gsap.to('.aurora', { rotate: 25, ease: 'none', scrollTrigger: { trigger: d.body, start: 'top top', end: 'bottom bottom', scrub: 1.2 } });

    /* ghost text parallax */
    d.querySelectorAll('.ghost').forEach(function (g) {
      gsap.fromTo(g, { xPercent: -60 }, { xPercent: -40, ease: 'none', scrollTrigger: { trigger: g.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    /* counters */
    d.querySelectorAll('[data-count]').forEach(function (el) {
      var end = parseFloat(el.dataset.count), suffix = el.dataset.suffix || '', prefix = el.dataset.prefix || '';
      var o = { v: 0 };
      ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: function () {
        gsap.to(o, { v: end, duration: 1.6, ease: 'power3.out', onUpdate: function () { el.textContent = prefix + Math.round(o.v) + suffix; } });
      } });
    });

    /* steps progress */
    var steps = d.querySelector('.steps');
    if (steps) {
      var line = steps.querySelector('.progress-line'), items = steps.querySelectorAll('.step');
      if (line) gsap.to(line, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: steps.querySelector('.step-list'), start: 'top 60%', end: 'bottom 60%', scrub: true } });
      items.forEach(function (s) {
        ScrollTrigger.create({ trigger: s, start: 'top 62%', end: 'bottom 62%', onEnter: function () { s.classList.add('on'); }, onLeaveBack: function () { s.classList.remove('on'); } });
      });
    }

    /* photos: gentle parallax */
    d.querySelectorAll('.photo img').forEach(function (img) {
      gsap.fromTo(img, { yPercent: -6, scale: 1.12 }, { yPercent: 6, scale: 1.12, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    /* cards & benefit cards stagger-in */
    d.querySelectorAll('.grid-2-cards, .grid-3, .benefit-grid, .photo-band').forEach(function (grid) {
      var kids = grid.children; if (!kids.length) return;
      gsap.from(kids, { y: 40, opacity: 0, duration: .9, ease: 'power3.out', stagger: .08, scrollTrigger: { trigger: grid, start: 'top 85%', once: true } });
    });
  } else {
    d.querySelectorAll('.reveal').forEach(function (r) { r.classList.add('visible'); });
    d.querySelectorAll('.step').forEach(function (s) { s.classList.add('on'); });
    d.querySelectorAll('[data-count]').forEach(function (el) { el.textContent = (el.dataset.prefix || '') + el.dataset.count + (el.dataset.suffix || ''); });
  }

  /* ---- card spotlight + tilt ---- */
  if (fine && !reduce) {
    d.querySelectorAll('.card, .quote, .benefit-card').forEach(function (c) {
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
        c.style.setProperty('--mx', x + 'px'); c.style.setProperty('--my', y + 'px');
        if (hasGsap) gsap.to(c, { rotateY: (x / r.width - .5) * 6, rotateX: (.5 - y / r.height) * 6, transformPerspective: 900, duration: .5, ease: 'power2.out', overwrite: 'auto' });
      });
      c.addEventListener('pointerleave', function () { if (hasGsap) gsap.to(c, { rotateX: 0, rotateY: 0, duration: .8, ease: 'elastic.out(1,.6)', overwrite: 'auto' }); });
    });

    /* magnetic buttons */
    d.querySelectorAll('.btn').forEach(function (b) {
      if (!b.querySelector('.sheen')) { var s = d.createElement('i'); s.className = 'sheen'; b.appendChild(s); }
      if (!hasGsap) return;
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        gsap.to(b, { x: (e.clientX - r.left - r.width / 2) * .18, y: (e.clientY - r.top - r.height / 2) * .28, duration: .4, ease: 'power2.out' });
      });
      b.addEventListener('pointerleave', function () { gsap.to(b, { x: 0, y: 0, duration: .7, ease: 'elastic.out(1,.5)' }); });
    });
  }

  /* ---- marquee duplicate for seamless loop ---- */
  d.querySelectorAll('.marquee .track').forEach(function (t) { t.innerHTML += t.innerHTML; });
})();
