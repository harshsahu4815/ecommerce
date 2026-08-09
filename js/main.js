/* ============================================================
   MAIN.JS — homepage product grid
   Fetches products.json (updated by the Admin Panel via GitHub API)
   and renders a card per product. No backend server involved —
   this is a plain fetch of a static JSON file in the same repo.
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('productGrid');
  const emptyState = document.getElementById('emptyState');
  if (!grid) return;

  try {
    // Cache-bust so visitors always see the latest products.json
    // right after the Admin Panel updates it (GitHub Pages can cache
    // static files briefly otherwise).
    const res = await fetch(`products.json?t=${Date.now()}`);
    if (!res.ok) throw new Error(`Failed to load products.json (${res.status})`);
    const products = await res.json();

    if (!Array.isArray(products) || products.length === 0) {
      emptyState?.classList.remove('hidden');
      return;
    }

    grid.innerHTML = products.map(renderCard).join('');

    if (window.lucide) lucide.createIcons();

    // Re-observe newly injected [data-aos] elements for scroll reveal
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12 });
      grid.querySelectorAll('[data-aos]').forEach((el) => observer.observe(el));
    } else {
      grid.querySelectorAll('[data-aos]').forEach((el) => el.classList.add('is-visible'));
    }

  } catch (err) {
    console.error('Could not load products:', err);
    emptyState?.classList.remove('hidden');
  }
});

function renderCard(product) {
  const price = Number(product.price) || 0;
  const discount = Number(product.discount) || 0;
  const finalPrice = discount > 0 ? Math.round(price - (price * discount) / 100) : price;
  const isOut = product.stock === 'out';

  return `
    <a href="product.html?id=${encodeURIComponent(product.id)}" class="product-card" data-aos>
      <div class="product-card__img-wrap">
        ${discount > 0 ? `<span class="badge badge--discount">-${discount}% OFF</span>` : ''}
        ${isOut ? `<span class="badge badge--out">Out of Stock</span>` : ''}
        <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy">
      </div>
      <div class="product-card__body">
        <h3 class="product-card__name">${escapeHtml(product.name)}</h3>
        <p class="product-card__desc">${escapeHtml(product.description || '')}</p>
        <div class="product-card__price-row">
          <span class="product-card__price">${formatPrice(finalPrice)}</span>
          ${discount > 0 ? `<span class="product-card__original">${formatPrice(price)}</span>` : ''}
        </div>
      </div>
    </a>
  `;
}

function escapeHtml(str) {
  if (str === undefined || str === null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
