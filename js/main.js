/* =====================================================================
   Chirantha Ekanayake | Portfolio interactions
   Works without GSAP/Lenis (falls back to CSS + IntersectionObserver),
   and turns all motion off for people who prefer reduced motion.
   ===================================================================== */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var $ = function (sel, ctx) { return (ctx || doc).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); };

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var gsap = window.gsap;
  var ST = window.ScrollTrigger;
  var hasGSAP = !!(gsap && ST) && !reduceMotion;
  if (hasGSAP) gsap.registerPlugin(ST);

  /* ---------------------------------------------------------------
     Footer year
     --------------------------------------------------------------- */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------------------------------------------------------------
     Text splitting (characters for the hero name, words for headings)
     --------------------------------------------------------------- */
  function splitChars(el) {
    var text = el.textContent;
    el.textContent = '';
    var mask = doc.createElement('span');
    mask.className = 'char-mask';
    for (var i = 0; i < text.length; i++) {
      var c = doc.createElement('span');
      c.className = 'char';
      c.textContent = text[i];
      mask.appendChild(c);
    }
    el.appendChild(mask);
    return $$('.char', el);
  }
  function splitWords(el) {
    var words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', el.textContent.trim());
    el.textContent = '';
    words.forEach(function (w, i) {
      var m = doc.createElement('span');
      m.className = 'word-mask';
      m.setAttribute('aria-hidden', 'true');
      var s = doc.createElement('span');
      s.className = 'word';
      s.textContent = w;
      m.appendChild(s);
      el.appendChild(m);
      if (i < words.length - 1) el.appendChild(doc.createTextNode(' '));
    });
    return $$('.word', el);
  }

  var heroChars = [];
  if (hasGSAP) {
    $$('[data-split]').forEach(function (line) {
      var chars = splitChars(line);
      heroChars = heroChars.concat(chars);
      /* keep the gradient continuous across split characters */
      if (line.classList.contains('title-line-2')) {
        var w = line.getBoundingClientRect().width;
        var left = line.getBoundingClientRect().left;
        line.style.setProperty('--line-w', w + 'px');
        chars.forEach(function (c) { c.style.setProperty('--char-x', (c.getBoundingClientRect().left - left) + 'px'); });
      }
    });
  }

  /* ---------------------------------------------------------------
     Smooth scrolling (Lenis), synced with ScrollTrigger
     --------------------------------------------------------------- */
  var lenis = null;
  if (hasGSAP && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true });
    lenis.on('scroll', ST.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  function scrollToTarget(target, focus) {
    var el = typeof target === 'string' ? $(target) : target;
    if (lenis) {
      var top = el ? Math.max(0, el.getBoundingClientRect().top + window.scrollY - 8) : 0;
      lenis.scrollTo(top, { duration: 1.3, easing: function (t) { return 1 - Math.pow(1 - t, 4); } });
    } else if (el) {
      el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    }
    if (focus && el) {
      var heading = el.querySelector('h1, h2') || el;
      if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
    }
  }

  doc.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var hash = a.getAttribute('href');
    if (hash === '#' || hash.length < 2) return;
    var target = $(hash);
    if (!target) return;
    e.preventDefault();
    closeMenu(false);
    var isTop = hash === '#top';
    scrollToTarget(isTop ? null : target, !isTop && hash !== '#main');
    if (hash === '#main') { var m = $('#main'); m.setAttribute('tabindex', '-1'); m.focus({ preventScroll: true }); }
    if (history.replaceState) history.replaceState(null, '', isTop ? location.pathname : hash);
  });

  /* ---------------------------------------------------------------
     Navigation: scrolled state, active section, sliding indicator
     --------------------------------------------------------------- */
  var header = $('.site-header');
  var navLinks = $$('.nav-links a');
  var mobileLinks = $$('.mobile-links a');
  var indicator = $('.nav-indicator');
  var sections = navLinks.map(function (a) { return $(a.getAttribute('href')); }).filter(Boolean);

  function onScrollState() {
    header.classList.toggle('is-scrolled', window.scrollY > 40);
  }
  onScrollState();
  window.addEventListener('scroll', onScrollState, { passive: true });

  function setActive(id) {
    var activeLink = null;
    navLinks.concat(mobileLinks).forEach(function (a) {
      var on = a.getAttribute('href') === '#' + id;
      a.classList.toggle('is-active', on);
      if (on) { a.setAttribute('aria-current', 'location'); if (navLinks.indexOf(a) > -1) activeLink = a; }
      else a.removeAttribute('aria-current');
    });
    if (!indicator) return;
    if (activeLink) {
      indicator.style.width = activeLink.offsetWidth + 'px';
      indicator.style.transform = 'translateX(' + activeLink.offsetLeft + 'px)';
      indicator.style.opacity = '1';
    } else {
      indicator.style.opacity = '0';
    }
  }
  if ('IntersectionObserver' in window) {
    var navIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) setActive(en.target.id); });
    }, { rootMargin: '-42% 0px -52% 0px' });
    sections.forEach(function (s) { navIO.observe(s); });
    navIO.observe($('#top'));
  }
  window.addEventListener('resize', function () {
    var a = $('.nav-links a.is-active');
    if (a) setActive(a.getAttribute('href').slice(1));
  });

  /* ---------------------------------------------------------------
     Mobile menu (keyboard accessible, focus trapped while open)
     --------------------------------------------------------------- */
  var toggle = $('.menu-toggle');
  var menu = $('#mobile-menu');
  var menuOpen = false;

  function openMenu() {
    if (menuOpen) return;
    menuOpen = true;
    menu.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    toggle.querySelector('.sr-only').textContent = 'Close menu';
    if (lenis) lenis.stop(); else doc.body.style.overflow = 'hidden';
    if (hasGSAP) {
      gsap.fromTo(menu, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power2.out' });
      gsap.fromTo($$('.mobile-links li, .mobile-foot', menu), { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out', stagger: 0.05, delay: 0.05 });
    }
    var first = $('a', menu);
    if (first) first.focus();
  }
  function closeMenu(returnFocus) {
    if (!menuOpen) return;
    menuOpen = false;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.querySelector('.sr-only').textContent = 'Open menu';
    if (lenis) lenis.start(); else doc.body.style.overflow = '';
    var done = function () { menu.hidden = true; };
    if (hasGSAP) gsap.to(menu, { opacity: 0, duration: 0.25, ease: 'power2.in', onComplete: done });
    else done();
    if (returnFocus) toggle.focus();
  }
  if (toggle && menu) {
    toggle.addEventListener('click', function () { menuOpen ? closeMenu(true) : openMenu(); });
    doc.addEventListener('keydown', function (e) {
      if (!menuOpen) return;
      if (e.key === 'Escape') { e.preventDefault(); closeMenu(true); return; }
      if (e.key === 'Tab') {
        var items = [toggle].concat($$('a, button', menu));
        var i = items.indexOf(doc.activeElement);
        if (e.shiftKey && (i <= 0)) { e.preventDefault(); items[items.length - 1].focus(); }
        else if (!e.shiftKey && i === items.length - 1) { e.preventDefault(); items[0].focus(); }
      }
    });
    window.matchMedia('(min-width: 1024px)').addEventListener('change', function (m) { if (m.matches) closeMenu(false); });
  }

  /* ---------------------------------------------------------------
     Hero: data terrain, 3D portrait tilt, cycling role
     --------------------------------------------------------------- */
  var hero = $('.hero');
  var canvas = $('.terrain');
  var stage = $('[data-stage]');
  var stageInner = stage && $('.stage-inner', stage);
  var terrain = null;
  var terrainIntro = { v: reduceMotion ? 1 : 0 };

  try {
    if (canvas && window.Terrain && canvas.getContext && canvas.getContext('2d')) {
      terrain = new window.Terrain(canvas, { reduced: reduceMotion });
      terrain.setIntro(terrainIntro.v);
    }
  } catch (err) { terrain = null; }

  if (terrain) {
    var resizeTimer;
    var onResize = function () { clearTimeout(resizeTimer); resizeTimer = setTimeout(function () { terrain.resize(); }, 120); };
    if ('ResizeObserver' in window) new ResizeObserver(onResize).observe(hero); else window.addEventListener('resize', onResize);
  }

  /* Pause expensive work when the hero is off screen or the tab is hidden */
  var orbitSvgs = $$('svg.orbits');
  if ('IntersectionObserver' in window && hero) {
    new IntersectionObserver(function (entries) {
      var vis = entries[0].isIntersecting;
      if (terrain) terrain.visible = vis && !doc.hidden;
      orbitSvgs.forEach(function (s) { if (!s.pauseAnimations) return; (vis && !reduceMotion) ? s.unpauseAnimations() : s.pauseAnimations(); });
    }, { threshold: 0 }).observe(hero);
  }
  doc.addEventListener('visibilitychange', function () { if (terrain) terrain.visible = !doc.hidden; });
  if (reduceMotion) orbitSvgs.forEach(function (s) { if (s.pauseAnimations) s.pauseAnimations(); });

  /* Pointer-driven tilt (desktop) or gentle idle sway (touch) */
  var tilt = { x: 0, y: 0, tx: 0, ty: 0, gx: 30, gy: 20 };
  if (!reduceMotion && stageInner) {
    if (finePointer) {
      window.addEventListener('pointermove', function (e) {
        var nx = (e.clientX / window.innerWidth) * 2 - 1;
        var ny = (e.clientY / window.innerHeight) * 2 - 1;
        tilt.tx = nx; tilt.ty = ny;
        if (terrain) terrain.setPointer(nx, ny);
      }, { passive: true });
      doc.addEventListener('pointerleave', function () { tilt.tx = 0; tilt.ty = 0; if (terrain) terrain.setPointer(0, 0); });
    }
    var start = performance.now();
    var tickTilt = function () {
      var t = (performance.now() - start) / 1000;
      var tx = tilt.tx, ty = tilt.ty;
      if (!finePointer) { tx = Math.sin(t * 0.55) * 0.45; ty = Math.cos(t * 0.42) * 0.3; }
      tilt.x += (tx - tilt.x) * 0.07;
      tilt.y += (ty - tilt.y) * 0.07;
      stage.style.setProperty('--ry', (tilt.x * 13).toFixed(2) + 'deg');
      stage.style.setProperty('--rx', (-tilt.y * 9).toFixed(2) + 'deg');
      stage.style.setProperty('--gx', (32 + tilt.x * 26).toFixed(1) + '%');
      stage.style.setProperty('--gy', (22 + tilt.y * 20).toFixed(1) + '%');
      requestAnimationFrame(tickTilt);
    };
    requestAnimationFrame(tickTilt);
  }

  /* Cycling role titles */
  var roleEl = $('.role-text');
  var roles = ['Data Analyst', 'BI Analyst', 'Demand & Supply Planning Analyst'];
  function startRoles() {
    if (!roleEl || reduceMotion) return;
    var i = 0;
    setInterval(function () {
      if (doc.hidden) return;
      roleEl.classList.add('is-out');
      setTimeout(function () {
        i = (i + 1) % roles.length;
        roleEl.textContent = roles[i];
        roleEl.classList.remove('is-out');
        roleEl.classList.add('is-in');
        void roleEl.offsetWidth;
        roleEl.classList.remove('is-in');
      }, 500);
    }, 3000);
  }

  /* ---------------------------------------------------------------
     Intro overlay + hero entrance
     --------------------------------------------------------------- */
  var heroBits = $$('[data-hero]');
  var stageLayers = stage ? {
    glow: $('.stage-glow', stage),
    portal: $('.portal', stage),
    portrait: $('.portrait-wrap', stage),
    lines: $$('.orbit-line', stage),
    sats: $$('.satellite', stage),
    chips: $$('.chip-float', stage)
  } : null;

  function heroEntrance() {
    if (!hasGSAP) {
      root.classList.remove('hero-pending');
      if (terrain) { terrain.setIntro(1); terrain.start(); }
      startRoles();
      return;
    }
    gsap.set(heroChars, { yPercent: 115 });
    gsap.set(heroBits, { opacity: 0, y: 24 });
    if (stageLayers) {
      gsap.set(stageLayers.glow, { opacity: 0 });
      gsap.set(stageLayers.portal, { opacity: 0, scale: 0.86 });
      gsap.set(stageLayers.portrait, { opacity: 0, y: 50 });
      gsap.set(stageLayers.lines, { strokeDashoffset: 1 });
      gsap.set(stageLayers.sats, { opacity: 0 });
      gsap.set(stageLayers.chips, { opacity: 0, scale: 0.6 });
    }
    root.classList.remove('hero-pending');
    if (terrain) terrain.start();

    var tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.to(terrainIntro, { v: 1, duration: 2.4, ease: 'power3.out', onUpdate: function () { if (terrain) terrain.setIntro(terrainIntro.v); } }, 0)
      .to(heroBits[0], { opacity: 1, y: 0, duration: 1 }, 0.1)
      .to(heroChars, { yPercent: 0, duration: 1.25, stagger: 0.028 }, 0.15)
      .to(heroBits.slice(1), { opacity: 1, y: 0, duration: 1.1, stagger: 0.08 }, 0.55);
    if (stageLayers) {
      tl.to(stageLayers.glow, { opacity: 1, duration: 1.6, ease: 'power2.out' }, 0.2)
        .to(stageLayers.portal, { opacity: 1, scale: 1, duration: 1.6 }, 0.25)
        .to(stageLayers.portrait, { opacity: 1, y: 0, duration: 1.5 }, 0.45)
        .to(stageLayers.lines, { strokeDashoffset: 0, duration: 2, ease: 'power3.inOut', stagger: 0.1 }, 0.5)
        .to(stageLayers.sats, { opacity: 1, duration: 0.8 }, 1.4)
        .to(stageLayers.chips, { opacity: 1, scale: 1, duration: 1.1, ease: 'back.out(1.6)', stagger: 0.09 }, 1.0);
    }
    tl.add(startRoles, 1.6);
  }

  function whenReady(cb) {
    var portrait = $('.portrait');
    var imgReady = new Promise(function (res) {
      if (!portrait || portrait.complete) return res();
      portrait.addEventListener('load', res, { once: true });
      portrait.addEventListener('error', res, { once: true });
    });
    var fontsReady = doc.fonts && doc.fonts.ready ? doc.fonts.ready : Promise.resolve();
    var timeout = new Promise(function (res) { setTimeout(res, 1800); });
    Promise.race([Promise.all([imgReady, fontsReady]), timeout]).then(cb);
  }

  var introEl = $('.intro');
  var showIntro = root.classList.contains('show-intro') && introEl && hasGSAP;
  var t0 = performance.now();

  whenReady(function () {
    if (showIntro) {
      var wait = Math.max(0, 1250 - (performance.now() - t0));
      setTimeout(function () {
        try { sessionStorage.setItem('ce-intro', '1'); } catch (e) {}
        gsap.to(introEl, {
          clipPath: 'inset(0 0 100% 0)', duration: 1, ease: 'expo.inOut',
          onComplete: function () { root.classList.remove('show-intro'); introEl.remove(); }
        });
        gsap.delayedCall(0.35, heroEntrance);
      }, wait);
    } else {
      root.classList.remove('show-intro');
      if (introEl) introEl.remove();
      heroEntrance();
    }
  });

  /* Hero parallax as it scrolls away */
  if (hasGSAP && hero) {
    ST.create({
      trigger: hero, start: 'top top', end: 'bottom top', scrub: true,
      onUpdate: function (self) { if (terrain) terrain.setScroll(self.progress); }
    });
    gsap.to('.stage', { yPercent: -14, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero-copy', { yPercent: -10, opacity: 0.25, ease: 'none', scrollTrigger: { trigger: hero, start: 'center top', end: 'bottom top', scrub: true } });
  }

  /* ---------------------------------------------------------------
     Pointer effects: cursor light, spotlight borders, card tilt, magnetic buttons
     --------------------------------------------------------------- */
  if (finePointer && !reduceMotion) {
    var light = $('.cursor-light');
    var lp = { x: window.innerWidth / 2, y: window.innerHeight / 2, tx: 0, ty: 0, on: false };
    var spotEl = null, spotEvt = null, ticking = false;

    window.addEventListener('pointermove', function (e) {
      lp.tx = e.clientX; lp.ty = e.clientY;
      if (!lp.on) { lp.on = true; root.classList.add('has-pointer'); lp.x = lp.tx; lp.y = lp.ty; }
      spotEvt = e;
      if (!ticking) { ticking = true; requestAnimationFrame(updateSpot); }
    }, { passive: true });

    var updateSpot = function () {
      ticking = false;
      var e = spotEvt;
      if (!e) return;
      var el = e.target.closest ? e.target.closest('.spot') : null;
      if (el) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      }
      var prev = e.target.closest ? e.target.closest('.project-preview') : null;
      if (prev) {
        var pr = prev.getBoundingClientRect();
        var px = (e.clientX - pr.left) / pr.width, py = (e.clientY - pr.top) / pr.height;
        prev.style.setProperty('--mx', (px * 100) + '%');
        prev.style.setProperty('--my', (py * 100) + '%');
        prev.style.setProperty('--ty', ((px - 0.5) * 10).toFixed(2) + 'deg');
        prev.style.setProperty('--tx', (-(py - 0.5) * 8).toFixed(2) + 'deg');
      }
      if (spotEl && spotEl !== prev) { spotEl.style.setProperty('--tx', '0deg'); spotEl.style.setProperty('--ty', '0deg'); }
      spotEl = prev;
    };

    var tickLight = function () {
      lp.x += (lp.tx - lp.x) * 0.12;
      lp.y += (lp.ty - lp.y) * 0.12;
      if (light) light.style.transform = 'translate3d(' + lp.x.toFixed(1) + 'px,' + lp.y.toFixed(1) + 'px,0)';
      requestAnimationFrame(tickLight);
    };
    requestAnimationFrame(tickLight);

    if (hasGSAP) {
      $$('[data-magnetic]').forEach(function (btn) {
        var xTo = gsap.quickTo(btn, 'x', { duration: 0.5, ease: 'power3.out' });
        var yTo = gsap.quickTo(btn, 'y', { duration: 0.5, ease: 'power3.out' });
        btn.addEventListener('pointermove', function (e) {
          var r = btn.getBoundingClientRect();
          xTo((e.clientX - (r.left + r.width / 2)) * 0.28);
          yTo((e.clientY - (r.top + r.height / 2)) * 0.38);
        });
        btn.addEventListener('pointerleave', function () {
          gsap.to(btn, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.45)' });
        });
      });
    }
  }

  /* ---------------------------------------------------------------
     Scroll reveals
     --------------------------------------------------------------- */
  var revealEls = $$('.reveal');
  function markDrawn(el) {
    var card = el.classList.contains('project-card') ? el : null;
    if (card) setTimeout(function () { card.classList.add('is-drawn'); }, reduceMotion ? 0 : 250);
  }
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); markDrawn(el); });
  } else {
    root.classList.add('reveal-ready');
    var revealIO = new IntersectionObserver(function (entries) {
      var batch = entries.filter(function (en) { return en.isIntersecting; }).map(function (en) { return en.target; });
      batch.sort(function (a, b) { return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1; });
      batch.forEach(function (el, i) {
        el.style.setProperty('--d', Math.min(i * 0.08, 0.4) + 's');
        el.classList.add('is-visible');
        markDrawn(el);
        revealIO.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) { revealIO.observe(el); });
  }

  /* Heading word reveals */
  if (hasGSAP) {
    $$('[data-split-words]').forEach(function (h) {
      var words = splitWords(h);
      gsap.set(words, { yPercent: 110 });
      ST.create({
        trigger: h, start: 'top 88%', once: true,
        onEnter: function () { gsap.to(words, { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: 0.06 }); }
      });
    });
  }

  /* Timeline progress line */
  var timeline = $('.timeline');
  if (timeline && hasGSAP) {
    timeline.style.setProperty('--progress', 0);
    ST.create({
      trigger: timeline, start: 'top 72%', end: 'bottom 60%', scrub: true,
      onUpdate: function (self) { timeline.style.setProperty('--progress', self.progress.toFixed(3)); }
    });
  }

  /* Count-up metrics */
  var counters = $$('[data-count]');
  function runCount(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var dec = parseInt(el.getAttribute('data-decimals') || '0', 10);
    if (reduceMotion) { el.textContent = target.toFixed(dec); return; }
    var dur = 1600, t0c = performance.now();
    var step = function (now) {
      var p = Math.min(1, (now - t0c) / dur);
      var eased = 1 - Math.pow(1 - p, 4);
      el.textContent = (target * eased).toFixed(dec);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window) {
    var countIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { runCount(en.target); countIO.unobserve(en.target); } });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { if (!reduceMotion) c.textContent = (0).toFixed(parseInt(c.getAttribute('data-decimals') || '0', 10)); countIO.observe(c); });
  }

  /* ---------------------------------------------------------------
     Project filters
     --------------------------------------------------------------- */
  var filterBtns = $$('.filter');
  var projects = $$('.project');
  var filterStatus = $('#filter-status');
  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var f = btn.getAttribute('data-filter');
      var shown = [];
      filterBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
      projects.forEach(function (p) {
        var match = f === 'all' || p.getAttribute('data-category') === f;
        p.hidden = !match;
        if (match) {
          shown.push(p);
          var card = $('.project-card', p);
          card.classList.add('is-visible');
          card.classList.add('is-drawn');
        }
      });
      if (hasGSAP) {
        gsap.fromTo(shown, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.06, clearProps: 'transform,opacity' });
        ST.refresh();
      }
      filterStatus.textContent = 'Showing ' + shown.length + (shown.length === 1 ? ' project' : ' projects');
    });
  });

  /* ---------------------------------------------------------------
     Copy email
     --------------------------------------------------------------- */
  var copyStatus = $('.copy-status');
  $$('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var value = btn.getAttribute('data-copy');
      var done = function () { copyStatus.textContent = 'Email address copied.'; setTimeout(function () { copyStatus.textContent = ''; }, 3000); };
      var fallback = function () {
        var ta = doc.createElement('textarea');
        ta.value = value; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
        doc.body.appendChild(ta); ta.select();
        var ok = false;
        try { ok = doc.execCommand('copy'); } catch (e) {}
        doc.body.removeChild(ta);
        copyStatus.textContent = ok ? 'Email address copied.' : 'Copy failed. The address is ' + value;
      };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(value).then(done, fallback);
      else fallback();
    });
  });

  /* ---------------------------------------------------------------
     Contact form: validation, then Formspree (if configured) or email app
     --------------------------------------------------------------- */
  var form = $('.contact-form');
  if (form) {
    var status = $('.form-status', form);
    var submitBtn = $('button[type="submit"]', form);
    var label = $('.btn-label', submitBtn);
    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    var rules = {
      name: function (v) { return v.trim().length >= 2 ? '' : 'Please enter your name.'; },
      email: function (v) { return !v.trim() ? 'Please enter your email address.' : (EMAIL_RE.test(v.trim()) ? '' : 'Please enter a valid email address, like name@company.com.'); },
      message: function (v) { return v.trim().length >= 20 ? '' : 'Please write at least 20 characters so I know how I can help.'; }
    };
    var touched = false;

    function check(field) {
      var rule = rules[field.name];
      if (!rule) return true;
      var msg = rule(field.value);
      var err = $('#' + field.id + '-err');
      field.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (err) err.textContent = msg;
      return !msg;
    }
    $$('input, textarea', form).forEach(function (f) {
      f.addEventListener('blur', function () { if (touched || f.value) check(f); });
      f.addEventListener('input', function () { if (f.getAttribute('aria-invalid') === 'true') check(f); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      touched = true;
      status.textContent = '';
      status.classList.remove('is-error');
      var fields = [form.name, form.email, form.message];
      var firstBad = null;
      fields.forEach(function (f) { if (!check(f) && !firstBad) firstBad = f; });
      if (firstBad) { firstBad.focus(); status.textContent = 'Please fix the highlighted fields.'; status.classList.add('is-error'); return; }
      if (form._gotcha && form._gotcha.value) { form.reset(); status.textContent = 'Thanks, your message has been sent.'; return; }

      var data = { name: form.name.value.trim(), email: form.email.value.trim(), company: form.company.value.trim(), message: form.message.value.trim() };
      var endpoint = (form.getAttribute('data-endpoint') || '').trim();

      if (endpoint) {
        submitBtn.disabled = true; label.textContent = 'Sending…';
        fetch(endpoint, { method: 'POST', headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
          .then(function (r) { if (!r.ok) throw new Error('Request failed'); })
          .then(function () { form.reset(); touched = false; status.textContent = 'Thanks, your message has been sent. I\'ll reply by email.'; })
          .catch(function () { status.textContent = 'Your message could not be sent. Please email chiranthag20@gmail.com instead.'; status.classList.add('is-error'); })
          .then(function () { submitBtn.disabled = false; label.textContent = 'Send message'; });
      } else {
        var to = form.getAttribute('data-mailto');
        var subject = 'Portfolio enquiry from ' + data.name + (data.company ? ' (' + data.company + ')' : '');
        var body = data.message + '\n\n' + data.name + '\n' + data.email + (data.company ? '\n' + data.company : '');
        window.location.href = 'mailto:' + to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
        status.textContent = 'Your email app should open with the message ready to send. If it doesn\'t, email ' + to + '.';
      }
    });
  }

  /* ---------------------------------------------------------------
     Back to top
     --------------------------------------------------------------- */
  $$('.to-top').forEach(function (b) {
    b.addEventListener('click', function () {
      scrollToTarget(null, false);
      var brand = $('.nav .brand');
      if (brand) brand.focus({ preventScroll: true });
    });
  });

  /* Recalculate scroll positions once fonts and images settle */
  window.addEventListener('load', function () { if (hasGSAP) ST.refresh(); });
})();
