/* Animaciones del sitio (sin librerías). Se carga con `defer` al final del body.
   - ?captura=1 o prefers-reduced-motion: no hace nada (todo visible, sin animar).
   - Si algo falla, se revierte y el contenido queda completo. */
(function () {
  'use strict';

  var root = document.documentElement;
  var params = new URLSearchParams(location.search);

  if (params.get('captura') === '1') {
    root.classList.add('captura');
    return;
  }
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window)) return;

  var STEP = 100;          // escalonado entre tarjetas (ms)
  var REVEAL_MS = 700;
  var HERO_MS = 800;

  function all(sel, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(sel));
  }

  function prepare(el, kind) {
    if (el.hasAttribute('data-anim')) return;
    el.setAttribute('data-anim', kind);
  }

  function show(el, delay, dur) {
    el.style.setProperty('--anim-delay', delay + 'ms');
    el.style.setProperty('--anim-dur', dur + 'ms');
    el.classList.add('is-in');
    // Al terminar se quita data-anim: el elemento vuelve a sus estilos originales
    setTimeout(function () {
      el.removeAttribute('data-anim');
      el.style.removeProperty('--anim-delay');
      el.style.removeProperty('--anim-dur');
    }, delay + dur + 120);
  }

  function abort() {
    root.classList.remove('anim-on');
    all('[data-anim]').forEach(function (el) { el.removeAttribute('data-anim'); });
  }

  try {
    var isDesktop = window.matchMedia('(min-width: 768px)').matches;
    var view = document.getElementById(isDesktop ? 'view-d' : 'view-m');
    if (!view) return;
    var $ = function (sel) { return all(sel, view); };

    /* ---- Hero: texto primero, imagen después ---- */
    var heroText, heroImage;
    if (isDesktop) {
      heroText = $('#inicio .grid > div:first-child > *');
      heroImage = $('#inicio .grid > div:last-child');
    } else {
      var hero = 'main > div > section:first-child > ';
      heroText = $(hero + 'div:nth-child(2)')
        .concat($(hero + 'h1'), $(hero + 'p'), $(hero + 'div:last-child'));
      heroImage = $(hero + 'div:nth-child(3)');
    }

    /* ---- Secciones que se revelan al hacer scroll ---- */
    var revealSel = isDesktop ? [
      '#sobre-mi > div > div',
      '#servicios > div > div:first-child',
      '#servicios .grid > div',
      '#servicios > div > div:last-child',
      '#por-que-elegirnos > div > div:first-child',
      '#por-que-elegirnos .grid > div',
      '#horarios-y-ubicacion > div > div:first-child',
      '#horarios-y-ubicacion .grid > div > div',
      'footer .grid > div'
    ] : [
      'main > div > section:nth-child(2) > div',
      '#m-servicios > div:first-child',
      '#m-servicios .grid > div',
      'main > div > section:nth-child(4) > div > div:first-child',
      'main > div > section:nth-child(4) > div > div:last-child > div',
      '#m-horarios > div',
      'main > div > section:nth-child(6) > div'
    ];
    var reveal = [];
    revealSel.forEach(function (s) { reveal = reveal.concat($(s)); });

    /* ---- Hover: botones, tarjetas y foto ---- */
    var ctas = $('a[href^="https://wa.me/"], a[href^="tel:"]').filter(function (a) {
      return !a.closest('nav') && getComputedStyle(a).display !== 'inline';
    });
    ctas.forEach(function (a) { a.setAttribute('data-cta', ''); });

    if (isDesktop) {
      $('#por-que-elegirnos .grid > div, #horarios-y-ubicacion .grid > div > div, #sobre-mi > div > div')
        .forEach(function (c) { c.setAttribute('data-hover', ''); });
      var img = view.querySelector('#inicio img');
      if (img && img.parentElement) img.parentElement.setAttribute('data-photo', '');
    }

    /* ---- Activar: marcar elementos y luego añadir la clase global ---- */
    heroText.forEach(function (el) { prepare(el, 'hero'); });
    heroImage.forEach(function (el) { prepare(el, 'hero'); });
    reveal.forEach(function (el) { prepare(el, 'reveal'); });
    root.classList.add('anim-on');

    // Hero al cargar (tras pintar el estado inicial)
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        root.style.setProperty('--anim-rise', '18px');
        heroText.forEach(function (el, i) { show(el, 80 + i * 110, HERO_MS); });
        heroImage.forEach(function (el) { show(el, 80 + heroText.length * 110 + 60, HERO_MS); });
        setTimeout(function () { root.style.removeProperty('--anim-rise'); }, 2200);
      });
    });

    // Scroll: aparece una sola vez; los que entran juntos se escalonan
    var io = new IntersectionObserver(function (entries) {
      var n = 0;
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        show(e.target, Math.min(n, 4) * STEP, REVEAL_MS);
        n++;
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    reveal.forEach(function (el) { io.observe(el); });
  } catch (err) {
    abort();
    if (window.console) console.warn('animations.js desactivado:', err);
  }
})();
