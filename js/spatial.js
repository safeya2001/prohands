/* =========================================================
   SPATIAL.JS — Pro Hands Interactive Layer
   1. Vanilla Card Tilt (no external dep)
   2. Counter Animation on scroll
   3. Step guide stagger reveal
   4. Expand/collapse project cards
   5. Stagger reveal utility
   ========================================================= */

(function () {
  'use strict';

  /* ── 1. VANILLA TILT ──────────────────────────────────── */
  function initTilt() {
    document.querySelectorAll('[data-tilt]').forEach(function (el) {
      var max = parseFloat(el.getAttribute('data-tilt-max')) || 10;
      var scale = parseFloat(el.getAttribute('data-tilt-scale')) || 1.03;

      el.addEventListener('mouseenter', function () {
        el.style.transition = 'none';
      });

      el.addEventListener('mousemove', function (e) {
        var rect = el.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width - 0.5;
        var y = (e.clientY - rect.top) / rect.height - 0.5;
        el.style.transform =
          'perspective(1000px) rotateY(' + (x * max) + 'deg) rotateX(' + (-y * max) + 'deg) scale(' + scale + ')';
      });

      el.addEventListener('mouseleave', function () {
        el.style.transition = 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        el.style.transform = 'perspective(1000px) rotateY(0) rotateX(0) scale(1)';
      });
    });
  }

  /* ── 2. COUNTER ANIMATION ─────────────────────────────── */
  function initCounters() {
    var counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;

    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var target = parseInt(el.getAttribute('data-count'), 10);
        var suffix = el.getAttribute('data-suffix') || '';
        var prefix = el.getAttribute('data-prefix') || '';
        var duration = 1600;
        var startTime = null;

        function step(timestamp) {
          if (!startTime) startTime = timestamp;
          var progress = Math.min((timestamp - startTime) / duration, 1);
          var eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = prefix + Math.floor(eased * target).toLocaleString() + suffix;
          if (progress < 1) requestAnimationFrame(step);
        }

        requestAnimationFrame(step);
        obs.unobserve(el);
      });
    }, { threshold: 0.5 });

    counters.forEach(function (el) { obs.observe(el); });
  }

  /* ── 3. STEP GUIDE STAGGER ────────────────────────────── */
  function initStepGuide() {
    var steps = document.querySelectorAll('.step-item');
    if (!steps.length) return;

    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, i) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var delay = Array.from(steps).indexOf(el) * 150;
        setTimeout(function () { el.classList.add('is-visible'); }, delay);
        obs.unobserve(el);
      });
    }, { threshold: 0.2 });

    steps.forEach(function (el) { obs.observe(el); });
  }

  /* ── 4. PROJECT CARD EXPAND ───────────────────────────── */
  function initExpandCards() {
    document.querySelectorAll('.expand-toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var card = btn.closest('.project-card');
        if (!card) return;
        card.classList.toggle('is-open');
        var isOpen = card.classList.contains('is-open');
        btn.setAttribute('aria-expanded', isOpen);
        btn.querySelector('.expand-toggle__label').textContent = isOpen ? 'Show less' : 'Learn more';
      });
    });
  }

  /* ── 5. STAGGER REVEAL ────────────────────────────────── */
  function initStaggerReveal() {
    var groups = document.querySelectorAll('.sr-stagger');
    if (!groups.length) return;

    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    groups.forEach(function (el) { obs.observe(el); });
  }

  /* ── 6. HERO MOUSE PARALLAX (MILD) ───────────────────── */
  function initHeroParallax() {
    var hero = document.querySelector('.page-hero--about');
    var pill = hero && hero.querySelector('.hero-glass-pill');
    if (!hero || !pill) return;

    document.addEventListener('mousemove', function (e) {
      var x = (e.clientX / window.innerWidth - 0.5) * 14;
      var y = (e.clientY / window.innerHeight - 0.5) * 10;
      pill.style.transform =
        'perspective(1200px) rotateX(' + (5 - y) + 'deg) rotateY(' + x + 'deg) translateY(-20px)';
    });
  }

  /* ── INIT ─────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    initTilt();
    initCounters();
    initStepGuide();
    initExpandCards();
    initStaggerReveal();
    initHeroParallax();
  });

})();
