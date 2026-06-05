/* ============================================
   VIRE STUDIOS - vire-custom.js
   ============================================ */

// CURSOR
const cur = document.getElementById('cursor');
const ring = document.getElementById('cursorRing');
if (cur && ring) {
  let mx = 0;
  let my = 0;
  let rx = 0;
  let ry = 0;
  document.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
  });
  (function anim() {
    cur.style.left = `${mx}px`;
    cur.style.top = `${my}px`;
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    ring.style.left = `${rx}px`;
    ring.style.top = `${ry}px`;
    requestAnimationFrame(anim);
  })();
}

// MOBILE MENU
const hamburgerBtn = document.getElementById('hamburger');
const mobileMenuEl = document.getElementById('mobileMenu');
const mobileCloseBtn = document.getElementById('mobileClose');
if (hamburgerBtn && mobileMenuEl) hamburgerBtn.onclick = () => mobileMenuEl.classList.add('open');
if (mobileCloseBtn && mobileMenuEl) mobileCloseBtn.onclick = () => mobileMenuEl.classList.remove('open');

// NAV SCROLL
const navbar = document.getElementById('navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.style.background =
      window.scrollY > 60 ? 'rgba(225,222,216,0.97)' : 'rgba(232,230,225,0.92)';
  });
}

// COUNTDOWN
const dropTarget = new Date('2026-06-01T00:00:00');
function tick() {
  const d = dropTarget - Date.now();
  if (d <= 0) return;
  const daysEl = document.getElementById('cd-days');
  const hoursEl = document.getElementById('cd-hours');
  const minsEl = document.getElementById('cd-mins');
  const secsEl = document.getElementById('cd-secs');
  if (daysEl) daysEl.textContent = String(Math.floor(d / 86400000)).padStart(2, '0');
  if (hoursEl) hoursEl.textContent = String(Math.floor((d % 86400000) / 3600000)).padStart(2, '0');
  if (minsEl) minsEl.textContent = String(Math.floor((d % 3600000) / 60000)).padStart(2, '0');
  if (secsEl) secsEl.textContent = String(Math.floor((d % 60000) / 1000)).padStart(2, '0');
}
tick();
setInterval(tick, 1000);

// PRODUCTS FILTER
const productPanels = document.querySelectorAll('[data-products-panel]');
document.querySelectorAll('.filter-btn').forEach((btn) => {
  btn.onclick = () => {
    document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    productPanels.forEach((panel) => {
      panel.hidden = panel.dataset.productsPanel !== btn.dataset.filter;
    });
  };
});

// TESTIMONIALS
const testimonials = [
  {
    text: 'THE QUALITY IS INSANE. YOU CAN LITERALLY FEEL THE DIFFERENCE THE MOMENT YOU TOUCH IT.',
    author: 'OMAR AHMED',
  },
  {
    text: "GOT MY HOODIE TODAY, HEAVY, PERFECTLY OVERSIZED, AND FEELS PREMIUM. WORTH EVERY POUND.",
    author: 'MARIAM SAMIR',
  },
  {
    text: "I'VE ORDERED FROM A LOT OF LOCAL BRANDS, BUT THIS IS ON ANOTHER LEVEL.",
    author: 'JOHN BOLES',
  },
  {
    text: "DIDN'T EXPECT IT TO BE THIS GOOD. THE JACKET FEELS LIKE A DESIGNER PIECE.",
    author: 'AHMED KHALED',
  },
  {
    text: 'I WORE THE JACKET ONCE, 5 PEOPLE ASKED ME WHERE I GOT IT.',
    author: 'TAREK SAID',
  },
  {
    text: 'EVERY DROP JUST GETS BETTER. THE BRAND KEEPS RAISING THE BAR.',
    author: 'REEM KAMAL',
  },
];
const td = [...testimonials, ...testimonials];
const testimonialTrack = document.getElementById('testimonialTrack');
if (testimonialTrack) {
  testimonialTrack.innerHTML = td
    .map(
      (x) => `
    <div class="testimonial-card">
      <div class="testimonial-stars">${'<div class="star"></div>'.repeat(5)}</div>
      <p class="testimonial-text">"${x.text}"</p>
      <div class="testimonial-author">${x.author}</div>
    </div>`
    )
    .join('');
}

// IG GRID
const igIds = [
  'photo-1611312449408-fcece27cdbb7',
  'photo-1581655353564-df123a1eb820',
  'photo-1588099768523-f4e6a5679d88',
  'photo-1509631179647-0177331693ae',
  'photo-1529374255404-311a2a4f1fd9',
  'photo-1603344797033-f0f4f587ab60',
];
const igGrid = document.getElementById('igGrid');
if (igGrid) {
  igGrid.innerHTML = igIds
    .map(
      (id) => `
    <div class="ig-item">
      <img src="https://images.unsplash.com/${id}?w=400&q=70" alt="Instagram" loading="lazy">
      <div class="ig-overlay"><div class="ig-icon">+</div></div>
    </div>`
    )
    .join('');
}

// SCROLL REVEAL
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        revealObserver.unobserve(e.target);
      }
    });
  },
  { threshold: 0.08 }
);
document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));
