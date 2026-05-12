// ============================================
// MISS MB — UI/UX Pro Max Edition
// ============================================

// Reemplaza con el número real de WhatsApp (código país + número, sin + ni espacios)
const WHATSAPP_NUMBER = "50600000000";

// ============================================
// CUSTOM CURSOR
// ============================================
const cursor = document.getElementById('cursor');

if (cursor && window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
  document.addEventListener('mousemove', e => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top  = e.clientY + 'px';
  });
  document.addEventListener('mousedown', () => cursor.classList.add('clicking'));
  document.addEventListener('mouseup',   () => cursor.classList.remove('clicking'));

  document.querySelectorAll('a, button, .portfolio__item, input, textarea, select').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
  });
}

// ============================================
// NAVIGATION
// ============================================
const nav       = document.getElementById('nav');
const navToggle = document.getElementById('navToggle');
const navLinks  = document.getElementById('navLinks');

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

navToggle.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  navToggle.classList.toggle('open', open);
  navToggle.setAttribute('aria-expanded', open);
});

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

// ============================================
// WHATSAPP HELPERS
// ============================================
function buildWaUrl(msg) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}

const DEFAULT_MSG = 'Hola Miss MB! 👋 Vi tu trabajo en Instagram y me gustaría agendar una cita para un tatuaje de realismo. ¿Podemos hablar?';

document.getElementById('waDirectBtn').href = buildWaUrl(DEFAULT_MSG);
document.getElementById('waFloat').href     = buildWaUrl(DEFAULT_MSG);

// ============================================
// BOOKING FORM → WHATSAPP
// ============================================
const form = document.getElementById('bookingForm');

form.addEventListener('submit', e => {
  e.preventDefault();

  const required = form.querySelectorAll('[required]');
  let valid = true;
  required.forEach(f => {
    f.classList.remove('error');
    if (!f.value.trim()) { f.classList.add('error'); valid = false; }
  });
  if (!valid) return;

  const nombre   = document.getElementById('nombre').value.trim();
  const telefono = document.getElementById('telefono').value.trim();
  const idea     = document.getElementById('idea').value.trim();
  const tamano   = document.getElementById('tamano').value;
  const zona     = document.getElementById('zona').value.trim();
  const fecha    = document.getElementById('fecha').value;
  const ref      = document.getElementById('referencia').value;

  const fechaStr = fecha
    ? `\n• Fecha preferida: ${new Date(fecha + 'T00:00:00').toLocaleDateString('es-CR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`
    : '';

  const msg =
`Hola Miss MB! 🌟 Quiero agendar una cita para un tatuaje.

*Mis datos:*
• Nombre: ${nombre}
• Teléfono/WhatsApp: ${telefono}

*Detalles del tatuaje:*
• Descripción: ${idea}
• Tamaño: ${tamano}
• Zona del cuerpo: ${zona}${fechaStr}
• Referencia: ${ref}

¡Quedo pendiente de tu respuesta! 😊`;

  window.open(buildWaUrl(msg), '_blank');
});

form.querySelectorAll('[required]').forEach(f => {
  f.addEventListener('input', () => f.classList.remove('error'));
});

// ============================================
// LIGHTBOX
// ============================================
const lightboxEl = document.getElementById('lightbox');
const lbImg      = document.getElementById('lightboxImg');
const lbCounter  = document.getElementById('lightboxCounter');
const lbClose    = document.getElementById('lightboxClose');
const lbPrev     = document.getElementById('lightboxPrev');
const lbNext     = document.getElementById('lightboxNext');
const lbBackdrop = document.getElementById('lightboxBackdrop');

// Collect only items with real images (not placeholders)
const lbImages = [];
document.querySelectorAll('.portfolio__item').forEach(item => {
  const img = item.querySelector('img');
  if (!img) return;
  item.dataset.lbIdx = lbImages.length;
  lbImages.push({ src: img.src, alt: img.alt });
});

let currentLb = 0;

function lbShow(idx) {
  currentLb = (idx + lbImages.length) % lbImages.length;
  lbImg.src = lbImages[currentLb].src;
  lbImg.alt = lbImages[currentLb].alt;
  lbCounter.innerHTML = `<em>${currentLb + 1}</em> / ${lbImages.length}`;
}

function lbOpen(idx) {
  lbShow(idx);
  lightboxEl.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function lbClose_() {
  lightboxEl.classList.remove('open');
  document.body.style.overflow = '';
}

document.querySelectorAll('.portfolio__item[data-lb-idx]').forEach(item => {
  item.addEventListener('click', () => lbOpen(parseInt(item.dataset.lbIdx)));
});

lbClose.addEventListener('click', lbClose_);
lbBackdrop.addEventListener('click', lbClose_);
lbNext.addEventListener('click', e => { e.stopPropagation(); lbShow(currentLb + 1); });
lbPrev.addEventListener('click', e => { e.stopPropagation(); lbShow(currentLb - 1); });

document.addEventListener('keydown', e => {
  if (!lightboxEl.classList.contains('open')) return;
  if (e.key === 'Escape')     lbClose_();
  if (e.key === 'ArrowRight') lbShow(currentLb + 1);
  if (e.key === 'ArrowLeft')  lbShow(currentLb - 1);
});

// Swipe on mobile
let touchX = 0;
lightboxEl.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
lightboxEl.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 48) dx < 0 ? lbShow(currentLb + 1) : lbShow(currentLb - 1);
});

// ============================================
// STAT COUNTER ANIMATION
// ============================================
function animateCount(el) {
  const target   = parseInt(el.dataset.count, 10);
  const prefix   = el.dataset.prefix || '';
  const suffix   = el.dataset.suffix || '';
  const duration = 1600;
  const start    = performance.now();

  const tick = now => {
    const p = Math.min((now - start) / duration, 1);
    const v = 1 - Math.pow(1 - p, 3); // ease-out cubic
    el.textContent = prefix + Math.round(v * target) + suffix;
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

const statsObs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.querySelectorAll('[data-count]').forEach(animateCount);
    statsObs.unobserve(entry.target);
  });
}, { threshold: 0.5 });

const statsSection = document.querySelector('.about__stats');
if (statsSection) statsObs.observe(statsSection);

// ============================================
// SCROLL REVEAL
// ============================================
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('visible');
    revealObs.unobserve(entry.target);
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.about__image-wrap, .about__text, .booking__form-wrap, .wa-card').forEach(el => {
  el.classList.add('reveal');
  revealObs.observe(el);
});

const portfolioObs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('visible');
    portfolioObs.unobserve(entry.target);
  });
}, { threshold: 0.06, rootMargin: '0px 0px -30px 0px' });

document.querySelectorAll('.portfolio__item').forEach(item => portfolioObs.observe(item));
