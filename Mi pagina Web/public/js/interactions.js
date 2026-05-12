// ── Custom cursor (desktop only) ─────────
const cursor     = document.querySelector('.cursor');
const cursorRing = document.querySelector('.cursor-ring');

if (cursor && cursorRing && window.matchMedia('(hover: hover)').matches) {
  let rx = 0, ry = 0;

  document.addEventListener('mousemove', e => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top  = e.clientY + 'px';
    // Ring follows with slight lag via RAF
    rx += (e.clientX - rx) * 0.14;
    ry += (e.clientY - ry) * 0.14;
  });

  // Smooth ring with rAF
  function trackRing() {
    if (cursor.style.left) {
      const tx = parseFloat(cursor.style.left);
      const ty = parseFloat(cursor.style.top);
      rx += (tx - rx) * 0.1;
      ry += (ty - ry) * 0.1;
      cursorRing.style.left = rx + 'px';
      cursorRing.style.top  = ry + 'px';
    }
    requestAnimationFrame(trackRing);
  }
  trackRing();

  document.querySelectorAll('a, button, .l-card').forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.classList.add('grow');
      cursorRing.classList.add('grow');
    });
    el.addEventListener('mouseleave', () => {
      cursor.classList.remove('grow');
      cursorRing.classList.remove('grow');
    });
  });
}

// ── Sticky header scroll effect ──────────
const header = document.querySelector('.l-header');
if (header) {
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// ── Reveal on scroll ─────────────────────
const revealEls = document.querySelectorAll('.reveal');
if (revealEls.length) {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });
  revealEls.forEach(el => io.observe(el));
}

// ── 3D card tilt (desktop) ───────────────
if (window.matchMedia('(hover: hover)').matches) {
  document.querySelectorAll('.tilt').forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.transition = 'border-color 0.25s, background 0.25s';
    });
    card.addEventListener('mousemove', e => {
      const r  = card.getBoundingClientRect();
      const x  = e.clientX - r.left;
      const y  = e.clientY - r.top;
      const rx = ((y - r.height / 2) / r.height) * -10;
      const ry = ((x - r.width  / 2) / r.width ) *  10;
      card.style.transform  = `perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.015)`;
      card.style.transition = 'none';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform  = 'perspective(700px) rotateX(0) rotateY(0) scale(1)';
      card.style.transition = 'transform 0.5s ease, border-color 0.25s, background 0.25s';
    });
  });

  // ── Magnetic buttons ─────────────────────
  document.querySelectorAll('.magnetic').forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      btn.style.transition = 'box-shadow 0.2s, background 0.2s';
    });
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width  / 2) * 0.22;
      const y = (e.clientY - r.top  - r.height / 2) * 0.22;
      btn.style.transform  = `translate(${x}px, ${y}px)`;
      btn.style.transition = 'box-shadow 0.2s, background 0.2s';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform  = 'translate(0, 0)';
      btn.style.transition = 'transform 0.45s ease, box-shadow 0.2s, background 0.2s';
    });
  });
}
