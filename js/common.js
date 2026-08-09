/* ============================================================
   COMMON.JS — shared across index.html, product.html, admin.html
   Handles: icons, footer year, dark mode, mobile nav, scroll-to-top, toast
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  if (window.lucide) lucide.createIcons();

  const footerYear = document.getElementById('footerYear');
  if (footerYear) footerYear.textContent = new Date().getFullYear();

  /* ---------------- Dark / Light mode ---------------- */
  const darkModeToggle = document.getElementById('darkModeToggle');
  const htmlEl = document.documentElement;

  function applyTheme(theme) {
    htmlEl.setAttribute('data-theme', theme);
    const icon = darkModeToggle?.querySelector('i');
    if (icon) {
      icon.setAttribute('data-lucide', theme === 'light' ? 'sun' : 'moon');
      if (window.lucide) lucide.createIcons();
    }
    try { localStorage.setItem('store-theme', theme); } catch (e) { /* ignore */ }
  }

  let savedTheme = 'dark';
  try { savedTheme = localStorage.getItem('store-theme') || 'dark'; } catch (e) { /* ignore */ }
  applyTheme(savedTheme);

  darkModeToggle?.addEventListener('click', () => {
    const current = htmlEl.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    applyTheme(current === 'light' ? 'dark' : 'light');
  });

  /* ---------------- Mobile nav ---------------- */
  const navBurger = document.getElementById('navBurger');
  const navLinks = document.getElementById('navLinks');

  navBurger?.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('is-open');
    navBurger.setAttribute('aria-expanded', String(isOpen));
    const icon = navBurger.querySelector('i');
    if (icon) {
      icon.setAttribute('data-lucide', isOpen ? 'x' : 'menu');
      if (window.lucide) lucide.createIcons();
    }
  });

  /* ---------------- Scroll to top ---------------- */
  const scrollTopBtn = document.getElementById('scrollTopBtn');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 500) scrollTopBtn?.classList.add('is-visible');
    else scrollTopBtn?.classList.remove('is-visible');
  });
  scrollTopBtn?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* ---------------- Scroll reveal ---------------- */
  const revealEls = document.querySelectorAll('[data-aos]');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach((el) => observer.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }
});

/* ---------------- Toast (used by product.js / admin.js too) ---------------- */
function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2800);
}

/* ---------------- Currency formatter (shared) ---------------- */
function formatPrice(n) {
  return `₹${Number(n).toLocaleString('en-IN')}`;
}
