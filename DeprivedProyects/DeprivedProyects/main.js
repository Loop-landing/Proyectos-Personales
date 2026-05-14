// ============================================
// DeprivedProyects — main.js
// ============================================

// ---- NAV HAMBURGER ----
const hamburger = document.getElementById('hamburger');
const navLinks = document.querySelector('.nav-links');

if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });

  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
    });
  });
}

// ---- NAV SCROLL EFFECT ----
const nav = document.querySelector('nav');
window.addEventListener('scroll', () => {
  if (window.scrollY > 40) {
    nav.style.borderBottomColor = 'rgba(255,68,34,0.2)';
  } else {
    nav.style.borderBottomColor = 'var(--border)';
  }
});

// ---- CONTACT FORM (Formspree) ----
// PASO 1: Crea cuenta en https://formspree.io
// PASO 2: Crea un nuevo form → copia tu Form ID
// PASO 3: En index.html cambia TU_ID_AQUI por ese ID
// PASO 4: En index.html cambia TU_DOMINIO.com por tu dominio real

const form = document.getElementById('contact-form');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const btn = form.querySelector('button[type="submit"]');
    const original = btn.textContent;
    const data = new FormData(form);

    btn.textContent = 'ENVIANDO...';
    btn.style.opacity = '0.6';
    btn.disabled = true;

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: data,
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        btn.textContent = '✓ MENSAJE ENVIADO';
        btn.style.background = '#22c55e';
        btn.style.opacity = '1';
        form.reset();

        setTimeout(() => {
          btn.textContent = original;
          btn.style.background = 'var(--orange)';
          btn.disabled = false;
        }, 5000);

      } else {
        throw new Error('Error');
      }

    } catch (err) {
      btn.textContent = 'ERROR — INTENTA DE NUEVO';
      btn.style.background = '#ef4444';
      btn.style.opacity = '1';
      btn.disabled = false;

      setTimeout(() => {
        btn.textContent = original;
        btn.style.background = 'var(--orange)';
      }, 4000);
    }
  });
}

// ---- SCROLL REVEAL ----
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }, i * 80);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.service-card, .step, .price-card, .portfolio-card').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(24px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  revealObserver.observe(el);
});