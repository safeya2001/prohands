/* ============================================================
   PRO HANDS — Animation & Interaction Engine
   animations.js  |  Animation Agent Deliverable
   ============================================================
   All vanilla JS. No external dependencies.
   Organized in clearly labelled sections:
     §1  Scroll-reveal  (IntersectionObserver)
     §2  Staggered children
     §3  3D card tilt   (mousemove + lerp + RAF)
     §4  Parallax hero  (scroll + RAF)
     §5  Counter animation
     §6  Sticky nav     (.nav-scrolled class)
     §7  Cursor glow    (CSS variable tracker)
     §8  Navbar mobile toggle
     §9  Button ripple  (click position)
    §10  Section eyebrow observer (active link sync)
    §11  Init & feature detection
   ============================================================ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

  /* ----------------------------------------------------------
     §1  SCROLL-REVEAL — IntersectionObserver
     Watches every .reveal* element and adds .is-visible when
     it crosses the threshold. Unobserves after triggering so
     the transition only fires once.
  ---------------------------------------------------------- */
  const revealObserver = createRevealObserver();

  function createRevealObserver() {
    if (!('IntersectionObserver' in window)) {
      // Graceful fallback: show all reveal elements immediately
      document.querySelectorAll(
        '.reveal, .reveal--left, .reveal--right, .reveal--scale, .reveal--slide-bottom'
      ).forEach(el => el.classList.add('is-visible'));
      return null;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    // Observe all reveal variants
    const selectors = [
      '.reveal',
      '.reveal--left',
      '.reveal--right',
      '.reveal--scale',
      '.reveal--slide-bottom',
    ];

    document.querySelectorAll(selectors.join(', ')).forEach(el => {
      observer.observe(el);
    });

    return observer;
  }


  /* ----------------------------------------------------------
     §2  STAGGERED CHILDREN
     For any container with class .reveal-children, the observer
     adds .is-visible to the container, and each direct child
     receives a computed transition-delay based on its index.
     This means authors never have to hand-write delay classes.
  ---------------------------------------------------------- */
  const STAGGER_MS = 100; // ms per child step

  function applyStaggerDelays(container) {
    Array.from(container.children).forEach((child, index) => {
      child.style.transitionDelay = `${index * STAGGER_MS}ms`;
    });
  }

  if ('IntersectionObserver' in window) {
    const staggerObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            staggerObserver.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.10,
        rootMargin: '0px 0px -40px 0px'
      }
    );

    document.querySelectorAll('.reveal-children').forEach(container => {
      applyStaggerDelays(container);
      staggerObserver.observe(container);
    });
  } else {
    // Fallback
    document.querySelectorAll('.reveal-children').forEach(container => {
      container.classList.add('is-visible');
    });
  }


  /* ----------------------------------------------------------
     §3  3D CARD TILT
     Applies perspective-based rotate3d() on .card-3d elements
     using linear interpolation (lerp) so the motion is smooth
     even when the mouse moves quickly.

     Math:
       normX = (mouseX - cardCenterX) / (cardWidth / 2)   → [-1, +1]
       normY = (mouseY - cardCenterY) / (cardHeight / 2)  → [-1, +1]
       tiltX =  normY * MAX_TILT  (vertical lean)
       tiltY = -normX * MAX_TILT  (horizontal lean)
  ---------------------------------------------------------- */
  const MAX_TILT    = 15;   // degrees
  const LERP_FACTOR = 0.12; // 0 = no movement, 1 = instant snap

  class CardTilt {
    constructor(card) {
      this.card    = card;
      this.inner   = card.querySelector('.card-3d__inner') || card;
      this.targetX = 0;
      this.targetY = 0;
      this.currentX = 0;
      this.currentY = 0;
      this.rafId    = null;
      this.active   = false;

      this._onMouseEnter = this._onMouseEnter.bind(this);
      this._onMouseMove  = this._onMouseMove.bind(this);
      this._onMouseLeave = this._onMouseLeave.bind(this);

      card.addEventListener('mouseenter', this._onMouseEnter);
      card.addEventListener('mousemove',  this._onMouseMove);
      card.addEventListener('mouseleave', this._onMouseLeave);
    }

    _onMouseEnter() {
      this.active = true;
      this._tick();
    }

    _onMouseMove(e) {
      const rect   = this.card.getBoundingClientRect();
      const normX  = ((e.clientX - rect.left) / rect.width)  * 2 - 1;
      const normY  = ((e.clientY - rect.top)  / rect.height) * 2 - 1;
      this.targetX =  normY * MAX_TILT;   // tilt around X axis (up/down)
      this.targetY = -normX * MAX_TILT;   // tilt around Y axis (left/right)
    }

    _onMouseLeave() {
      this.targetX = 0;
      this.targetY = 0;
      // Let lerp smoothly return to flat — keep ticking briefly
      setTimeout(() => {
        this.active = false;
        cancelAnimationFrame(this.rafId);
        this.inner.style.transform = '';
        this.inner.style.boxShadow = '';
      }, 400);
    }

    _lerp(a, b, t) {
      return a + (b - a) * t;
    }

    _tick() {
      if (!this.active) return;

      this.currentX = this._lerp(this.currentX, this.targetX, LERP_FACTOR);
      this.currentY = this._lerp(this.currentY, this.targetY, LERP_FACTOR);

      const depth  = Math.abs(this.currentX) + Math.abs(this.currentY);
      const lift   = depth * 0.5;   // up to ~15px elevation
      const shadow = depth * 1.8;   // dynamic shadow spread

      this.inner.style.transform = [
        `rotateX(${this.currentX.toFixed(2)}deg)`,
        `rotateY(${this.currentY.toFixed(2)}deg)`,
        `translateY(-${lift.toFixed(1)}px)`,
        'translateZ(0)',             // force GPU layer
      ].join(' ');

      this.inner.style.boxShadow =
        `0 ${(shadow + 8).toFixed(0)}px ${(shadow * 3 + 20).toFixed(0)}px ` +
        `rgba(45,59,85,${(0.08 + depth * 0.006).toFixed(3)})`;

      this.rafId = requestAnimationFrame(() => this._tick());
    }
  }

  // Touch devices: skip tilt (no hover)
  if (window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.card-3d').forEach(card => new CardTilt(card));
  }


  /* ----------------------------------------------------------
     §4  PARALLAX HERO
     Translates the hero background at a fraction of scroll
     speed to create depth. Uses requestAnimationFrame to batch
     DOM writes and avoid layout thrash.
  ---------------------------------------------------------- */
  const heroBg     = document.querySelector('.hero__bg');
  const aboutImg   = document.querySelector('.split__image');
  const bgFloaters = document.querySelector('.bg-floaters');
  const heroSection = document.querySelector('#hero');

  if (heroBg || aboutImg || bgFloaters) {
    const ROOT = document.documentElement;
    let ticking = false;

    function updateParallax() {
      const sy = window.scrollY;

      // Hero background: moves at 38% scroll speed
      if (heroBg) {
        const offset = sy * 0.38;
        heroBg.style.transform = `translateY(${offset.toFixed(1)}px)`;
        ROOT.style.setProperty('--hero-parallax', `${(sy * 0.25).toFixed(1)}px`);
      }

      // Background floaters: subtle upward drift
      if (bgFloaters) {
        ROOT.style.setProperty('--parallax-offset', `-${(sy * 0.08).toFixed(1)}px`);
      }

      // About section image: parallax when section is near viewport
      if (aboutImg) {
        const rect = aboutImg.getBoundingClientRect();
        const viewH = window.innerHeight;
        if (rect.top < viewH && rect.bottom > 0) {
          const progress = (viewH - rect.top) / (viewH + rect.height);
          const offset = (progress - 0.5) * 60; // ±30px range
          ROOT.style.setProperty('--about-parallax', `${offset.toFixed(1)}px`);
        }
      }

      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
      }
    }, { passive: true });

    // Run once on load to set initial state
    updateParallax();
  }


  /* ----------------------------------------------------------
     §5  COUNTER ANIMATION
     Counts from 0 to data-count value when element enters
     viewport. Supports:
       data-count="2500"       → plain number
       data-prefix="+"         → prepended string
       data-suffix="K"         → appended string
       data-duration="2000"    → ms override (default 2000)
     Formats output with locale commas (1,000,000 style).
  ---------------------------------------------------------- */
  function animateCounter(el) {
    const target    = parseInt(el.dataset.count, 10);
    const prefix    = el.dataset.prefix   || '';
    const suffix    = el.dataset.suffix   || '';
    const duration  = parseInt(el.dataset.duration || '2000', 10);
    const startTime = performance.now();

    // Easing — ease out quart
    function easeOutQuart(t) {
      return 1 - Math.pow(1 - t, 4);
    }

    function tick(now) {
      const elapsed  = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = easeOutQuart(progress);
      const current  = Math.round(eased * target);

      el.textContent = prefix + current.toLocaleString() + suffix;

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        // Guarantee exact final value
        el.textContent = prefix + target.toLocaleString() + suffix;
        // Add a subtle scale pop on completion
        el.style.transform = 'scale(1.12)';
        el.style.transition = 'transform 200ms cubic-bezier(0.34,1.56,0.64,1)';
        setTimeout(() => {
          el.style.transform = '';
        }, 200);
      }
    }

    requestAnimationFrame(tick);
  }

  if ('IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    document.querySelectorAll('[data-count]').forEach(el => {
      counterObserver.observe(el);
    });
  } else {
    // No IntersectionObserver: show final values immediately
    document.querySelectorAll('[data-count]').forEach(el => {
      const target = parseInt(el.dataset.count, 10);
      const prefix = el.dataset.prefix || '';
      const suffix = el.dataset.suffix || '';
      el.textContent = prefix + target.toLocaleString() + suffix;
    });
  }


  /* ----------------------------------------------------------
     §6  STICKY NAV — .nav-scrolled CLASS
     Adds .nav-scrolled at 80px scroll; CSS handles the visual
     transformation (padding reduction, blur backdrop, shadow).
  ---------------------------------------------------------- */
  const navbar       = document.querySelector('.navbar');
  const NAV_THRESHOLD = 80;

  if (navbar) {
    function handleNavScroll() {
      const scrolled = window.scrollY > NAV_THRESHOLD;
      navbar.classList.toggle('nav-scrolled', scrolled);
      // .scrolled is the existing class from main.js — keep both for compat
      navbar.classList.toggle('scrolled', scrolled);
    }

    window.addEventListener('scroll', handleNavScroll, { passive: true });
    handleNavScroll(); // run immediately in case page loads mid-scroll
  }


  /* ----------------------------------------------------------
     §7  CURSOR GLOW
     Tracks mouse position and updates CSS custom properties
     --mouse-x and --mouse-y on <html>. The .cursor-glow div
     (injected below) uses these to render a radial gradient.
     Touch devices are excluded.
  ---------------------------------------------------------- */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    // Inject the glow overlay div
    const glowEl = document.createElement('div');
    glowEl.className = 'cursor-glow';
    glowEl.setAttribute('aria-hidden', 'true');
    document.body.appendChild(glowEl);

    let glowX      = 0;
    let glowY      = 0;
    let targetGlowX = window.innerWidth  / 2;
    let targetGlowY = window.innerHeight / 2;
    let glowTicking = false;

    document.addEventListener('mousemove', (e) => {
      targetGlowX = e.clientX;
      targetGlowY = e.clientY;

      if (!glowTicking) {
        requestAnimationFrame(updateGlow);
        glowTicking = true;
      }
    });

    function updateGlow() {
      // Smooth lerp so the gradient trails the cursor softly
      glowX += (targetGlowX - glowX) * 0.08;
      glowY += (targetGlowY - glowY) * 0.08;

      const root = document.documentElement;
      root.style.setProperty('--mouse-x', `${glowX.toFixed(1)}px`);
      root.style.setProperty('--mouse-y', `${glowY.toFixed(1)}px`);

      glowTicking = false;
    }
  }


  /* ----------------------------------------------------------
     §8  NAVBAR MOBILE TOGGLE
     Augments the existing hamburger/mobile-menu from main.js
     with additional animation polish: menu items stagger in
     and the hamburger bars morph into an X using CSS classes.
     (main.js handles the core toggle; this adds the entrance
      animation reset so items re-animate on each open.)
  ---------------------------------------------------------- */
  const hamburger  = document.querySelector('.navbar__hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const isOpen = hamburger.classList.contains('open');

      if (isOpen) {
        // Re-trigger stagger animation for menu links when opening
        const links = mobileMenu.querySelectorAll('a');
        links.forEach(link => {
          // Reset animation so it replays on next open
          link.style.animation = 'none';
          // Force reflow
          void link.offsetWidth;
          link.style.animation = '';
        });
      }
    });

    // Close menu on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
        hamburger.focus();
      }
    });
  }


  /* ----------------------------------------------------------
     §9  BUTTON RIPPLE EFFECT
     On click, calculates the click position relative to the
     button, sets CSS variables --ripple-x / --ripple-y, then
     adds .ripple-active. The CSS ::after pseudo-element uses
     those variables to animate from the exact click point.
  ---------------------------------------------------------- */
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', function (e) {
      const rect = this.getBoundingClientRect();
      const x    = e.clientX - rect.left;
      const y    = e.clientY - rect.top;

      this.style.setProperty('--ripple-x', `${x}px`);
      this.style.setProperty('--ripple-y', `${y}px`);

      // Remove then re-add so the animation restarts on rapid clicks
      this.classList.remove('ripple-active');
      void this.offsetWidth; // force reflow
      this.classList.add('ripple-active');

      // Clean up class after animation completes
      const onEnd = () => {
        this.classList.remove('ripple-active');
        this.removeEventListener('animationend', onEnd);
      };
      this.addEventListener('animationend', onEnd);
    });
  });


  /* ----------------------------------------------------------
     §10  ACTIVE SECTION SYNC (scrollspy)
     As the user scrolls, observes section headings / landmark
     elements and highlights the matching nav link. Provides
     a subtle, non-jumpy update using IntersectionObserver.
  ---------------------------------------------------------- */
  if ('IntersectionObserver' in window) {
    const sections  = document.querySelectorAll('section[id], [data-section]');
    const navLinks  = document.querySelectorAll('.navbar__links a[href]');

    if (sections.length && navLinks.length) {
      const activeLinkMap = new Map();

      navLinks.forEach(link => {
        const hash = link.getAttribute('href').replace(/^.*#/, '#');
        if (hash.startsWith('#')) {
          activeLinkMap.set(hash, link);
        }
      });

      const sectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            const id   = '#' + entry.target.id;
            const link = activeLinkMap.get(id);
            if (!link) return;

            if (entry.isIntersecting) {
              // Remove active from all, set on current
              navLinks.forEach(l => l.classList.remove('active'));
              link.classList.add('active');
            }
          });
        },
        {
          threshold: 0.4,
          rootMargin: '-80px 0px -40% 0px'
        }
      );

      sections.forEach(sec => sectionObserver.observe(sec));
    }
  }


  /* ----------------------------------------------------------
     §11  INIT — Feature detection summary
     Console output is stripped in production; kept here for
     development visibility.
  ---------------------------------------------------------- */
  const features = {
    intersectionObserver: 'IntersectionObserver' in window,
    reducedMotion:
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    hoverCapable:
      window.matchMedia('(hover: hover)').matches,
    finePointer:
      window.matchMedia('(pointer: fine)').matches,
    touchDevice:
      'ontouchstart' in window || navigator.maxTouchPoints > 0,
  };

  // If reduced motion preference is set, ensure all reveal elements
  // are immediately visible so no content is hidden.
  if (features.reducedMotion) {
    const allReveal = document.querySelectorAll(
      '.reveal, .reveal--left, .reveal--right, ' +
      '.reveal--scale, .reveal--slide-bottom, ' +
      '.reveal-children > *'
    );
    allReveal.forEach(el => {
      el.classList.add('is-visible');
      el.style.opacity   = '1';
      el.style.transform = 'none';
    });
  }

  // Expose feature flags on window for other scripts (e.g., conditional init)
  window.proHandsFeatures = features;

}); // end DOMContentLoaded
