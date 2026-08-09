/* ============================================================
   PRODUCT.JS — product detail page logic
   1. Reads ?id= from the URL
   2. Fetches products.json and finds the matching product
   3. Renders details, handles qty/price, WhatsApp link, copy-to-clipboard
   4. Handles order form validation + EmailJS submission
   ============================================================ */

/* ==============================================================
   EMAILJS CONFIG
   ==============================================================
   STEP 1: Sign up at https://www.emailjs.com/
   STEP 2: Create an Email Service (connect your Gmail) → copy its Service ID
   STEP 3: Create an Email Template → copy its Template ID
   STEP 4: Go to Account > General → copy your Public Key
   STEP 5: Paste all three values below.
   ============================================================== */
const EMAILJS_PUBLIC_KEY  = 'S85F4wdDbYYiOOe6z';   // <-- REPLACE THIS
const EMAILJS_SERVICE_ID  = 'service_6cd6nc5';   // <-- REPLACE THIS
const EMAILJS_TEMPLATE_ID = 'template_akflonw';  // <-- REPLACE THIS

// ============================================================
// WHATSAPP NUMBER — replace with your own (country code, no + or spaces)
// ============================================================
const WHATSAPP_NUMBER = '917223847210';

let currentProduct = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (window.emailjs && EMAILJS_PUBLIC_KEY !== 'YOUR_PUBLIC_KEY') {
    emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
  }

  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id');

  const loadingState = document.getElementById('loadingState');
  const notFoundState = document.getElementById('notFoundState');
  const detailSection = document.getElementById('detailSection');

  if (!productId) {
    loadingState.classList.add('hidden');
    notFoundState.classList.remove('hidden');
    return;
  }

  try {
    const res = await fetch(`products.json?t=${Date.now()}`);
    if (!res.ok) throw new Error(`Failed to load products.json (${res.status})`);
    const products = await res.json();

    const product = Array.isArray(products) ? products.find((p) => p.id === productId) : null;

    if (!product) {
      loadingState.classList.add('hidden');
      notFoundState.classList.remove('hidden');
      return;
    }

    currentProduct = product;
    renderProduct(product);
    updateMetaTags(product);

    loadingState.classList.add('hidden');
    detailSection.classList.remove('hidden');

    if (window.lucide) lucide.createIcons();

    initQuantityAndPricing(product);
    initOrderForm(product);
    initWhatsAppAndCopy(product);

  } catch (err) {
    console.error('Could not load product:', err);
    loadingState.classList.add('hidden');
    notFoundState.classList.remove('hidden');
  }
});

function renderProduct(product) {
  const price = Number(product.price) || 0;
  const discount = Number(product.discount) || 0;
  const finalPrice = discount > 0 ? Math.round(price - (price * discount) / 100) : price;
  const isOut = product.stock === 'out';

  document.getElementById('breadcrumbName').textContent = product.name;
  document.getElementById('productImage').src = product.image;
  document.getElementById('productImage').alt = product.name;
  document.getElementById('productName').textContent = product.name;
  document.getElementById('productDesc').textContent = product.description || '';
  document.getElementById('productNameField').value = product.name;

  document.getElementById('finalPrice').textContent = formatPrice(finalPrice);

  if (discount > 0) {
    const originalEl = document.getElementById('originalPrice');
    const saveEl = document.getElementById('saveAmount');
    originalEl.textContent = formatPrice(price);
    originalEl.classList.remove('hidden');
    saveEl.textContent = `You save ${formatPrice(price - finalPrice)}`;
    saveEl.classList.remove('hidden');

    const badge = document.getElementById('discountBadge');
    badge.textContent = `-${discount}% OFF`;
    badge.classList.remove('hidden');
  }

  const stockDot = document.getElementById('stockDot');
  const stockLabel = document.getElementById('stockLabel');
  const orderNowBtn = document.getElementById('orderNowBtn');
  const submitOrderBtn = document.getElementById('submitOrderBtn');

  if (isOut) {
    stockDot.classList.add('stock__dot--out');
    stockLabel.textContent = 'Out of Stock';
    orderNowBtn?.setAttribute('aria-disabled', 'true');
    orderNowBtn?.classList.add('hidden');
    if (submitOrderBtn) {
      submitOrderBtn.disabled = true;
      submitOrderBtn.querySelector('.btn__label').innerHTML = '<i data-lucide="ban"></i> Currently Out of Stock';
    }
  } else {
    stockLabel.textContent = 'In Stock';
  }
}

function updateMetaTags(product) {
  document.getElementById('pageTitle').textContent = `${product.name} | Your Store`;
  document.getElementById('pageDescription').setAttribute('content', product.description || '');

  const ogTitle = document.createElement('meta');
  ogTitle.setAttribute('property', 'og:title');
  ogTitle.setAttribute('content', product.name);
  document.head.appendChild(ogTitle);

  const ogDesc = document.createElement('meta');
  ogDesc.setAttribute('property', 'og:description');
  ogDesc.setAttribute('content', product.description || '');
  document.head.appendChild(ogDesc);

  const ogImage = document.createElement('meta');
  ogImage.setAttribute('property', 'og:image');
  ogImage.setAttribute('content', product.image);
  document.head.appendChild(ogImage);
}

/* ==============================================================
   QUANTITY + LIVE PRICING (syncs hero selector with form selector)
   ============================================================== */
function initQuantityAndPricing(product) {
  const price = Number(product.price) || 0;
  const discount = Number(product.discount) || 0;
  const unitPrice = discount > 0 ? Math.round(price - (price * discount) / 100) : price;

  const qtyInput = document.getElementById('qtyInput');
  const qtyMinus = document.getElementById('qtyMinus');
  const qtyPlus = document.getElementById('qtyPlus');
  const livePriceHero = document.getElementById('livePriceHero');

  const formQty = document.getElementById('formQty');
  const formQtyMinus = document.getElementById('formQtyMinus');
  const formQtyPlus = document.getElementById('formQtyPlus');
  const orderTotal = document.getElementById('orderTotal');

  const MIN_QTY = 1;
  const MAX_QTY = 20;

  function clampQty(val) {
    val = parseInt(val, 10);
    if (isNaN(val)) val = MIN_QTY;
    return Math.min(MAX_QTY, Math.max(MIN_QTY, val));
  }

  function updateAllPricing(qty) {
    qty = clampQty(qty);
    const total = unitPrice * qty;
    if (qtyInput) qtyInput.value = qty;
    if (formQty) formQty.value = qty;
    if (livePriceHero) livePriceHero.textContent = formatPrice(total);
    if (orderTotal) orderTotal.textContent = formatPrice(total);
    updateWhatsAppLink();
  }

  qtyMinus?.addEventListener('click', () => updateAllPricing(clampQty(qtyInput.value) - 1));
  qtyPlus?.addEventListener('click', () => updateAllPricing(clampQty(qtyInput.value) + 1));
  qtyInput?.addEventListener('change', () => updateAllPricing(qtyInput.value));

  formQtyMinus?.addEventListener('click', () => updateAllPricing(clampQty(formQty.value) - 1));
  formQtyPlus?.addEventListener('click', () => updateAllPricing(clampQty(formQty.value) + 1));
  formQty?.addEventListener('change', () => updateAllPricing(formQty.value));

  updateAllPricing(1);
}

/* ==============================================================
   ORDER FORM — validation + EmailJS submission
   ============================================================== */
function initOrderForm(product) {
  const orderForm = document.getElementById('orderForm');
  const submitBtn = document.getElementById('submitOrderBtn');
  const formStatus = document.getElementById('formStatus');

  let isSubmitting = false;

  const validators = {
    customerName: (v) => v.trim().length >= 2 || 'Please enter your full name.',
    customerPhone: (v) => /^[0-9+\s-]{7,15}$/.test(v.trim()) || 'Please enter a valid phone number.',
    customerEmail: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || 'Please enter a valid email address.',
    deliveryAddress: (v) => v.trim().length >= 10 || 'Please enter your complete delivery address.',
  };

  function showFieldError(fieldName, message) {
    const input = document.getElementById(fieldName);
    const errorEl = document.querySelector(`[data-error-for="${fieldName}"]`);
    if (input) input.classList.toggle('is-invalid', Boolean(message));
    if (errorEl) errorEl.textContent = message || '';
  }

  function validateForm() {
    let isValid = true;
    for (const [fieldName, validate] of Object.entries(validators)) {
      const input = document.getElementById(fieldName);
      if (!input) continue;
      const result = validate(input.value);
      if (result !== true) { showFieldError(fieldName, result); isValid = false; }
      else showFieldError(fieldName, '');
    }
    return isValid;
  }

  function setFormStatus(message, type) {
    if (!formStatus) return;
    formStatus.textContent = message;
    formStatus.className = 'form-status' + (type ? ` is-${type}` : '');
  }

  function setLoadingState(isLoading) {
    if (!submitBtn) return;
    submitBtn.classList.toggle('is-loading', isLoading);
    submitBtn.disabled = isLoading;
  }

  orderForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // prevent duplicate submissions

    setFormStatus('', null);
    if (!validateForm()) {
      setFormStatus('Please fix the highlighted fields above.', 'error');
      return;
    }

    isSubmitting = true;
    setLoadingState(true);

    const templateParams = {
      customer_name: document.getElementById('customerName').value.trim(),
      customer_phone: document.getElementById('customerPhone').value.trim(),
      customer_email: document.getElementById('customerEmail').value.trim(),
      delivery_address: document.getElementById('deliveryAddress').value.trim(),
      product_name: product.name,
      quantity: document.getElementById('formQty').value,
      order_total: document.getElementById('orderTotal').textContent,
      additional_notes: document.getElementById('additionalNotes').value.trim() || 'None',
    };

    try {
      if (!window.emailjs || EMAILJS_PUBLIC_KEY === 'YOUR_PUBLIC_KEY') {
        throw new Error('EmailJS is not configured yet. Add your PUBLIC_KEY, SERVICE_ID and TEMPLATE_ID in js/product.js.');
      }
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);
      setFormStatus('🎉 Order placed successfully! We will contact you shortly to confirm.', 'success');
      orderForm.reset();
      document.getElementById('productNameField').value = product.name;
      document.getElementById('formQty').value = 1;
      document.getElementById('qtyInput').value = 1;
      document.getElementById('formQty').dispatchEvent(new Event('change'));
    } catch (err) {
      console.error('Order submission failed:', err);
      setFormStatus('Something went wrong while sending your order. Please try again or order via WhatsApp.', 'error');
    } finally {
      isSubmitting = false;
      setLoadingState(false);
    }
  });
}

/* ==============================================================
   WHATSAPP LINK + COPY TO CLIPBOARD
   ============================================================== */
function updateWhatsAppLink() {
  const whatsappBtn = document.getElementById('whatsappBtn');
  if (!whatsappBtn || !currentProduct) return;
  const qty = document.getElementById('qtyInput')?.value || 1;
  const total = document.getElementById('livePriceHero')?.textContent || '';
  const message = `Hi! I'd like to order: ${currentProduct.name}%0AQuantity: ${qty}%0ATotal: ${total}`;
  whatsappBtn.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
}

function initWhatsAppAndCopy(product) {
  updateWhatsAppLink();

  const copyDetailsBtn = document.getElementById('copyDetailsBtn');
  copyDetailsBtn?.addEventListener('click', async () => {
    const qty = document.getElementById('formQty')?.value || 1;
    const total = document.getElementById('orderTotal')?.textContent || '';
    const details = `Order Details\n----------------\nProduct: ${product.name}\nQuantity: ${qty}\nTotal: ${total}`;
    try {
      await navigator.clipboard.writeText(details);
      showToast('Order details copied to clipboard!');
    } catch (err) {
      console.error('Clipboard copy failed:', err);
      showToast('Could not copy automatically — please copy manually.');
    }
  });
}
