/* ============================================
   PRO HANDS — Main JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Navbar scroll behavior ---------- */
  const navbar = document.querySelector('.navbar');
  const handleNavScroll = () => {
    navbar?.classList.toggle('scrolled', window.scrollY > 60);
  };
  window.addEventListener('scroll', handleNavScroll, { passive: true });
  handleNavScroll();

  /* ---------- Decorative SVG accessibility ---------- */
  document.querySelectorAll('svg').forEach(svg => {
    if (!svg.getAttribute('role') && !svg.getAttribute('aria-label')) {
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');
    }
  });

  /* ---------- Mobile menu ---------- */
  const hamburger = document.querySelector('.navbar__hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');

  hamburger?.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    mobileMenu?.classList.toggle('open');
    document.body.style.overflow = mobileMenu?.classList.contains('open') ? 'hidden' : '';
  });

  mobileMenu?.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger?.classList.remove('open');
      mobileMenu?.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  /* ---------- Active nav link ---------- */
  const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
  const setActiveLink = (links) => {
    links.forEach(a => {
      const href = a.getAttribute('href');
      const linkPath = new URL(href, window.location.origin).pathname.replace(/\/$/, '') || '/';
      const hrefClean = href.replace(/\.html$/, '').replace(/\/$/, '') || '/';

      if (linkPath === currentPath || hrefClean === currentPath ||
          (currentPath.includes('/projects') && hrefClean.includes('projects') && !hrefClean.includes('puppet') && !hrefClean.includes('standup'))) {
        a.classList.add('active');
      }
    });
  };
  setActiveLink(document.querySelectorAll('.navbar__links a'));
  setActiveLink(document.querySelectorAll('.mobile-menu a'));

  /* ---------- Scroll reveal animations ---------- */
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    reveals.forEach(el => revealObserver.observe(el));
  }

  /* ---------- Progress bars (About page) ---------- */
  const progressBars = document.querySelectorAll('.progress-bar__fill');
  if (progressBars.length) {
    const progressObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = entry.target;
          target.style.width = target.dataset.width;
          progressObserver.unobserve(target);
        }
      });
    }, { threshold: 0.5 });

    progressBars.forEach(bar => progressObserver.observe(bar));
  }

  /* ---------- Counter animation (stats) ---------- */
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.dataset.count, 10);
          const suffix = el.dataset.suffix || '';
          const prefix = el.dataset.prefix || '';
          const duration = 2000;
          const step = target / (duration / 16);
          let current = 0;

          const updateCounter = () => {
            current += step;
            if (current >= target) {
              el.textContent = prefix + target.toLocaleString() + suffix;
            } else {
              el.textContent = prefix + Math.floor(current).toLocaleString() + suffix;
              requestAnimationFrame(updateCounter);
            }
          };
          updateCounter();
          counterObserver.unobserve(el);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(el => counterObserver.observe(el));
  }

  /* ---------- FAQ accordion (keyboard accessible) ---------- */
  document.querySelectorAll('.faq-item__q').forEach(q => {
    q.setAttribute('tabindex', '0');
    q.setAttribute('role', 'button');
    q.setAttribute('aria-expanded', 'false');

    const toggle = () => {
      const item = q.parentElement;
      const isOpen = item.classList.contains('open');

      document.querySelectorAll('.faq-item.open').forEach(openItem => {
        openItem.classList.remove('open');
        openItem.querySelector('.faq-item__q')?.setAttribute('aria-expanded', 'false');
      });

      if (!isOpen) {
        item.classList.add('open');
        q.setAttribute('aria-expanded', 'true');
      }
    };

    q.addEventListener('click', toggle);
    q.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle();
      }
    });
  });

  /* ---------- Project filter tabs ---------- */
  const filterTabs = document.querySelectorAll('.filter-tab');
  const projectCards = document.querySelectorAll('.project-card[data-category]');

  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      const filter = tab.dataset.filter;
      projectCards.forEach(card => {
        if (filter === 'all' || card.dataset.category === filter) {
          card.style.display = '';
          card.style.opacity = '0';
          requestAnimationFrame(() => {
            card.style.transition = 'opacity .4s ease';
            card.style.opacity = '1';
          });
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  /* ---------- Smooth scroll for anchor links ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ---------- Google Sheets Integration ---------- */
  // All form data is sent to Google Sheets via Google Apps Script

  const GOOGLE_SHEET_URL = PRO_HANDS_CONFIG.API_URL;

  /**
   * Send form data to Google Sheets
   * @param {Object} data - key/value pairs to send
   * @returns {Promise}
   */
  function sendToGoogleSheet(data) {
    const params = new URLSearchParams(data);
    const fetchPromise = fetch(GOOGLE_SHEET_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: params
    });
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 8000)
    );
    return Promise.race([fetchPromise, timeout]);
  }

  /* ---------- Form submission (Volunteer) ---------- */
  const volunteerForm = document.querySelector('#volunteer-form');
  volunteerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = volunteerForm.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = 'Sending...';
    btn.disabled = true;

    const formData = {
      name:    volunteerForm.querySelector('[name="name"]').value,
      email:   volunteerForm.querySelector('[name="email"]').value,
      phone:   volunteerForm.querySelector('[name="phone"]').value,
      role:    volunteerForm.querySelector('[name="role"]').value,
      message: volunteerForm.querySelector('[name="message"]').value
    };

    try {
      await sendToGoogleSheet(formData);
      btn.textContent = 'Submitted!';
      btn.style.background = 'var(--teal)';
      setTimeout(() => {
        btn.textContent = originalText;
        btn.disabled = false;
        btn.style.background = '';
        volunteerForm.reset();
      }, 3000);
    } catch (err) {
      console.error('Form error:', err);
      btn.textContent = 'Error – try again';
      btn.style.background = 'var(--coral)';
      setTimeout(() => {
        btn.textContent = originalText;
        btn.disabled = false;
        btn.style.background = '';
      }, 3000);
    }
  });

  /* ---------- Newsletter form ---------- */
  document.querySelectorAll('.cta-banner__form').forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button');
      const originalText = btn.textContent;
      btn.textContent = 'Sending...';
      btn.disabled = true;

      const email = form.querySelector('[name="email"]').value;

      try {
        await sendToGoogleSheet({ type: 'newsletter', email });
        btn.textContent = 'Subscribed!';
        setTimeout(() => {
          btn.textContent = originalText;
          btn.disabled = false;
          form.reset();
        }, 2500);
      } catch (err) {
        console.error('Newsletter error:', err);
        btn.textContent = 'Error – try again';
        setTimeout(() => {
          btn.textContent = originalText;
          btn.disabled = false;
        }, 2500);
      }
    });
  });

  /* ============================================
     LANGUAGE / RTL TOGGLE SYSTEM
     ============================================ */

  const navMap = {
    'index.html':     { en: 'Home',              ar: 'الرئيسية' },
    'about.html':     { en: 'About Us',          ar: 'من نحن' },
    'projects.html':  { en: 'Projects',          ar: 'المشاريع' },
    'volunteer.html': { en: 'Volunteer with us', ar: 'تطوع معنا' }
  };

  const footerTranslations = {
    followTitle:  { en: 'Follow Us to Stay & Learn', ar: 'تابعنا لتبقى وتتعلم' },
    contactTitle: { en: 'Contact Us',                ar: 'تواصل معنا' },
    desc: {
      en: 'Pro Hands for Training, Safety, and Health — empowering communities through education and environmental stewardship.',
      ar: 'أيادي المهن للتدريب والسلامة والصحة — تمكين المجتمعات من خلال التعليم والإشراف البيئي.'
    },
    copyright: {
      en: 'Copyright &copy; Pro Hands | Powered by Pro Hands',
      ar: 'حقوق النشر &copy; أيادي المهن | مدعوم من أيادي المهن'
    },
    address: {
      en: 'King Abdullah II Street (Medical City Street), Complex No. 17, Amman, Jordan',
      ar: 'شارع الملك عبدالله الثاني (شارع المدينة الطبية)، مجمع رقم 17، عمّان، الأردن'
    }
  };

  // Cache original English text ONCE before any language swap
  document.querySelectorAll('[data-ar]').forEach(el => {
    if (!el.dataset.en) el.dataset.en = el.textContent.trim();
  });
  document.querySelectorAll('[data-ar-html]').forEach(el => {
    if (!el.dataset.enHtml) el.dataset.enHtml = el.innerHTML;
  });

  function setLang(lang) {
    const html = document.documentElement;
    html.setAttribute('lang', lang);
    html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');

    // Toggle button text
    document.querySelectorAll('.lang-toggle__text').forEach(t => {
      t.textContent = lang === 'ar' ? 'EN' : 'عربي';
    });

    // Skip-link
    const skipLink = document.querySelector('.skip-link');
    if (skipLink) skipLink.textContent = lang === 'ar' ? 'تخطي إلى المحتوى الرئيسي' : 'Skip to main content';

    // Nav links (match by href)
    document.querySelectorAll('.navbar__links a, .mobile-menu a').forEach(a => {
      const href = a.getAttribute('href') || '';
      for (const [key, val] of Object.entries(navMap)) {
        if (href.endsWith(key)) {
          a.textContent = val[lang];
          break;
        }
      }
    });

    // data-ar / data-en text swap
    document.querySelectorAll('[data-ar]').forEach(el => {
      if (lang === 'ar') {
        el.textContent = el.dataset.ar;
      } else if (el.dataset.en) {
        el.textContent = el.dataset.en;
      }
    });

    // data-ar-html (for elements containing inner HTML like <strong> tags)
    document.querySelectorAll('[data-ar-html]').forEach(el => {
      if (lang === 'ar') {
        el.innerHTML = el.dataset.arHtml;
      } else if (el.dataset.enHtml) {
        el.innerHTML = el.dataset.enHtml;
      }
    });

    // Placeholder swap
    document.querySelectorAll('[data-placeholder-ar]').forEach(el => {
      if (lang === 'ar') {
        if (!el.dataset.placeholderEn) el.dataset.placeholderEn = el.placeholder;
        el.placeholder = el.dataset.placeholderAr;
      } else if (el.dataset.placeholderEn) {
        el.placeholder = el.dataset.placeholderEn;
      }
    });

    // Label swap (for form labels)
    document.querySelectorAll('label[data-ar]').forEach(el => {
      if (lang === 'ar') {
        if (!el.dataset.en) el.dataset.en = el.textContent.trim();
        el.textContent = el.dataset.ar;
      } else if (el.dataset.en) {
        el.textContent = el.dataset.en;
      }
    });

    // Option swap
    document.querySelectorAll('option[data-ar]').forEach(el => {
      if (lang === 'ar') {
        if (!el.dataset.en) el.dataset.en = el.textContent.trim();
        el.textContent = el.dataset.ar;
      } else if (el.dataset.en) {
        el.textContent = el.dataset.en;
      }
    });

    // Footer translations
    const footer = document.querySelector('.footer');
    if (footer) {
      const h5s = footer.querySelectorAll('h5');
      if (h5s[0]) h5s[0].textContent = footerTranslations.followTitle[lang];
      if (h5s[1]) h5s[1].textContent = footerTranslations.contactTitle[lang];

      const footerDesc = footer.querySelector('.footer__grid > div:first-child > p');
      if (footerDesc) footerDesc.textContent = footerTranslations.desc[lang];

      const bottom = footer.querySelector('.footer__bottom');
      if (bottom) bottom.innerHTML = footerTranslations.copyright[lang];

      // Address (last contact li text)
      const addressLi = footer.querySelector('.footer__contact li:first-child');
      if (addressLi) {
        const svg = addressLi.querySelector('svg');
        const textNode = addressLi.lastChild;
        if (textNode && textNode.nodeType === 3) {
          textNode.textContent = '\n              ' + footerTranslations.address[lang] + '\n            ';
        }
      }

      // Footer nav links
      footer.querySelectorAll('.footer__links a').forEach(a => {
        const href = a.getAttribute('href') || '';
        for (const [key, val] of Object.entries(navMap)) {
          if (href.endsWith(key)) {
            a.textContent = val[lang];
            break;
          }
        }
      });
    }

    localStorage.setItem('prohandsLang', lang);
  }

  // Init from saved preference
  const savedLang = localStorage.getItem('prohandsLang');
  if (savedLang === 'ar') {
    // Defer to ensure DOM is fully rendered before swapping
    requestAnimationFrame(() => setLang('ar'));
  }

  // Bind toggle buttons
  document.querySelectorAll('.lang-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const currentLang = document.documentElement.getAttribute('lang') || 'en';
      setLang(currentLang === 'en' ? 'ar' : 'en');
    });
  });

});
