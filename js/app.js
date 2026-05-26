/* ============================================
   ARLAN LLC — Main Application JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initHeroSlideshow();
  initScrollReveal();
  initSmoothScroll();
  initPortfolioFilters();
  initContactForm();
  initMascotWidget();
});

/* --- Hero Ken Burns Slideshow --- */
function initHeroSlideshow() {
  const slides = document.querySelectorAll('.hero__slide');
  if (slides.length === 0) return;

  let current = 0;
  const interval = 5000; // 5 seconds per slide

  setInterval(() => {
    slides[current].classList.remove('active');
    current = (current + 1) % slides.length;
    slides[current].classList.add('active');
  }, interval);
}

/* --- Navigation --- */
function initNavigation() {
  const nav = document.querySelector('.nav');
  const hamburger = document.querySelector('.nav__hamburger');
  const navLinks = document.querySelector('.nav__links');
  const links = document.querySelectorAll('.nav__link');

  // Scroll effect
  if (nav) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    });
    // Check on load
    if (window.scrollY > 50) nav.classList.add('scrolled');
  }

  // Hamburger toggle
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      navLinks.classList.toggle('open');
      document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
    });

    // Close on link click
    links.forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        navLinks.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // Active link highlighting
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  links.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
}

/* --- Scroll Reveal --- */
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .stagger');

  if (reveals.length === 0) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Once revealed, stop observing
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  reveals.forEach(el => observer.observe(el));
}

/* --- Smooth Scroll --- */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

/* --- Portfolio Filters --- */
function initPortfolioFilters() {
  const tabs = document.querySelectorAll('.filter-tab');
  const cards = document.querySelectorAll('.portfolio-card');

  if (tabs.length === 0) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Update active tab
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const category = tab.dataset.category;

      cards.forEach(card => {
        if (category === 'all' || card.dataset.category === category) {
          card.style.display = '';
          card.style.opacity = '0';
          card.style.transform = 'translateY(10px)';
          requestAnimationFrame(() => {
            card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          });
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

/* --- Contact Form --- */
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Basic validation
    const name = form.querySelector('#name');
    const email = form.querySelector('#email');
    const message = form.querySelector('#message');
    let valid = true;

    [name, email, message].forEach(field => {
      if (field && !field.value.trim()) {
        field.style.borderColor = 'var(--color-error)';
        valid = false;
      } else if (field) {
        field.style.borderColor = 'var(--color-glass-border)';
      }
    });

    if (email && email.value && !isValidEmail(email.value)) {
      email.style.borderColor = 'var(--color-error)';
      valid = false;
    }

    if (valid) {
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Message Sent!';
        submitBtn.style.background = 'var(--color-success)';
        submitBtn.disabled = true;

        setTimeout(() => {
          submitBtn.textContent = originalText;
          submitBtn.style.background = '';
          submitBtn.disabled = false;
          form.reset();
        }, 3000);
      }
    }
  });

  // Clear error on focus
  form.querySelectorAll('input, textarea, select').forEach(field => {
    field.addEventListener('focus', () => {
      field.style.borderColor = 'var(--color-secondary)';
    });
    field.addEventListener('blur', () => {
      field.style.borderColor = 'var(--color-glass-border)';
    });
  });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* --- Mascot Widget --- */
function initMascotWidget() {
  const bubble = document.getElementById('mascot-bubble');
  const panel = document.getElementById('mascot-panel');
  const closeBtn = document.getElementById('mascot-close');
  const badge = document.querySelector('.mascot-widget__badge');

  if (!bubble || !panel) return;

  let isOpen = false;
  let hasSpokenWelcome = false;

  function togglePanel() {
    isOpen = !isOpen;
    panel.classList.toggle('open', isOpen);
    // Hide notification badge on first open
    if (isOpen && badge) {
      badge.style.display = 'none';
    }
    // Speak welcome on first open
    if (isOpen && !hasSpokenWelcome && window.ArlanTTS) {
      hasSpokenWelcome = true;
      window.ArlanTTS.speak('welcome');
    }
  }

  bubble.addEventListener('click', (e) => {
    // If clicking voice badge, toggle mute instead
    if (e.target.closest('.mascot-widget__voice-badge')) {
      e.stopPropagation();
      if (window.ArlanTTS) {
        const muted = window.ArlanTTS.toggleMute();
        const voiceBadge = document.getElementById('mascot-voice-badge');
        if (voiceBadge) voiceBadge.textContent = muted ? '🔇' : '🔊';
      }
      return;
    }
    togglePanel();
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      isOpen = false;
      panel.classList.remove('open');
      if (window.ArlanTTS) window.ArlanTTS.stop();
    });
  }

  // Action buttons speak when clicked
  const actions = document.querySelectorAll('.mascot-widget__action[data-speak]');
  actions.forEach(action => {
    action.addEventListener('click', () => {
      const key = action.dataset.speak;
      if (key && window.ArlanTTS) {
        window.ArlanTTS.speak(key);
      }
    });
  });

  // Close on click outside
  document.addEventListener('click', (e) => {
    if (isOpen && !e.target.closest('.mascot-widget')) {
      isOpen = false;
      panel.classList.remove('open');
    }
  });

  // Auto-peek after 4 seconds (gentle nudge)
  setTimeout(() => {
    if (!isOpen) {
      bubble.style.transform = 'scale(1.15)';
      setTimeout(() => {
        bubble.style.transform = '';
      }, 400);
    }
  }, 4000);
}
