/* ============================================================
   ADMIN.JS — Admin Panel logic
   1. Firebase Authentication (email/password) — login gate only.
      No product data is ever stored in Firebase.
   2. GitHub Contents API — reads and writes products.json directly
      in your GitHub repo. GitHub Pages then rebuilds automatically
      (usually within 30 seconds to 2 minutes) and the live site
      reflects your changes — no manual file editing required.
   ============================================================ */

/* ==============================================================
   FIREBASE CONFIG
   ==============================================================
   STEP 1: Go to https://console.firebase.google.com/ → Create a project
   STEP 2: Project Settings → General → "Your apps" → Add a Web app
   STEP 3: Copy the firebaseConfig object shown there and paste below
   STEP 4: In Firebase Console → Authentication → Sign-in method →
           enable "Email/Password"
   STEP 5: In Authentication → Users → Add your own admin user
           (the email/password you'll log in with on this page)
   ============================================================== */
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDnFFpt9dx5cLbT5kCi4kFy-7HHAKik-us",
  authDomain: "ecommerce-4dd6a.firebaseapp.com",
  projectId: "ecommerce-4dd6a",
  storageBucket: "ecommerce-4dd6a.firebasestorage.app",
  messagingSenderId: "64021295349",
  appId: "1:64021295349:web:ed7eacaf50d7b1eaf815bc"
  // measurementId: "G-Q7BVNNWRKD"
  
};

/* ==============================================================
   GITHUB REPO CONFIG
   ==============================================================
   Fill in your repo details so the Admin Panel knows where to
   commit updates to products.json.
   ============================================================== */
const GITHUB_OWNER = 'harshsahu4815';   // <-- REPLACE THIS
const GITHUB_REPO = 'ecommerce';          // <-- REPLACE THIS
const GITHUB_BRANCH = 'main';                  // <-- change if your default branch is different
const GITHUB_FILE_PATH = 'products.json';      // <-- keep as-is unless you moved the file

let firebaseApp = null;
let currentProducts = [];
let currentFileSha = null;
let editingProductId = null;

document.addEventListener('DOMContentLoaded', () => {

  /* ---------------- Firebase init ---------------- */
  if (window.firebase && FIREBASE_CONFIG.apiKey !== 'YOUR_FIREBASE_API_KEY') {
    firebaseApp = firebase.initializeApp(FIREBASE_CONFIG);
  }

  const loginView = document.getElementById('loginView');
  const panelView = document.getElementById('panelView');
  const loginForm = document.getElementById('loginForm');
  const loginStatus = document.getElementById('loginStatus');
  const loggedInAs = document.getElementById('loggedInAs');

  function setLoginStatus(message, type) {
    loginStatus.textContent = message;
    loginStatus.className = 'admin-status' + (type ? ` is-${type}` : '');
  }

  /* ---------------- Auth state ---------------- */
  if (firebaseApp) {
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        loginView.classList.add('hidden');
        panelView.classList.remove('hidden');
        loggedInAs.textContent = user.email;
        restoreTokenFromSession();
        loadProducts();
      } else {
        loginView.classList.remove('hidden');
        panelView.classList.add('hidden');
      }
    });
  }

  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!firebaseApp) {
      setLoginStatus('Firebase is not configured yet. Add your FIREBASE_CONFIG in js/admin.js.', 'error');
      return;
    }
    const email = document.getElementById('adminEmail').value.trim();
    const password = document.getElementById('adminPassword').value;
    const loginBtn = document.getElementById('loginBtn');

    setLoginStatus('', null);
    loginBtn.disabled = true;

    try {
      await firebase.auth().signInWithEmailAndPassword(email, password);
      // onAuthStateChanged handles the view switch
    } catch (err) {
      console.error('Login failed:', err);
      setLoginStatus('Invalid email or password. Please try again.', 'error');
    } finally {
      loginBtn.disabled = false;
    }
  });

  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    firebase.auth().signOut();
    sessionStorage.removeItem('gh_admin_token');
  });

  /* ---------------- GitHub token (session-only) ---------------- */
  const githubTokenInput = document.getElementById('githubToken');
  const saveTokenBtn = document.getElementById('saveTokenBtn');

  function restoreTokenFromSession() {
    const saved = sessionStorage.getItem('gh_admin_token');
    if (saved) githubTokenInput.value = saved;
  }

  saveTokenBtn?.addEventListener('click', () => {
    const token = githubTokenInput.value.trim();
    if (!token) { showToast('Please paste a token first.'); return; }
    sessionStorage.setItem('gh_admin_token', token);
    showToast('Token saved for this session.');
  });

  function getToken() {
    return sessionStorage.getItem('gh_admin_token') || githubTokenInput.value.trim();
  }

  /* ==============================================================
     LOAD PRODUCTS via GitHub Contents API (gives us content + sha,
     which we need for committing updates back)
     ============================================================== */
  async function loadProducts() {
    const listEl = document.getElementById('adminProductList');
    listEl.innerHTML = '<p style="color:var(--text-muted);">Loading products…</p>';

    try {
      const res = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}?ref=${GITHUB_BRANCH}&t=${Date.now()}`,
        { headers: { Accept: 'application/vnd.github+json' } }
      );

      if (!res.ok) throw new Error(`GitHub API error (${res.status}). Check GITHUB_OWNER/GITHUB_REPO in js/admin.js.`);

      const data = await res.json();
      currentFileSha = data.sha;
      const decoded = decodeURIComponent(escape(atob(data.content)));
      currentProducts = JSON.parse(decoded);

      renderProductList();
    } catch (err) {
      console.error('Failed to load products:', err);
      listEl.innerHTML = `<p style="color:var(--accent-danger);">Could not load products: ${err.message}</p>`;
    }
  }

  function renderProductList() {
    const listEl = document.getElementById('adminProductList');
    if (!currentProducts.length) {
      listEl.innerHTML = '<p style="color:var(--text-muted);">No products yet. Add your first one above.</p>';
      return;
    }

    listEl.innerHTML = currentProducts.map((p) => `
      <div class="admin-list-item">
        <div class="admin-list-item__thumb"><img src="${escapeHtml(p.image)}" alt=""></div>
        <div class="admin-list-item__info">
          <div class="admin-list-item__name">${escapeHtml(p.name)}</div>
          <div class="admin-list-item__meta">₹${p.price} · ${p.discount || 0}% off · ${p.stock === 'out' ? 'Out of stock' : 'In stock'}</div>
        </div>
        <div class="admin-list-item__actions">
          <button class="icon-btn" title="Edit" data-edit-id="${escapeHtml(p.id)}"><i data-lucide="pencil"></i></button>
          <button class="icon-btn" title="Delete" data-delete-id="${escapeHtml(p.id)}"><i data-lucide="trash-2"></i></button>
        </div>
      </div>
    `).join('');

    if (window.lucide) lucide.createIcons();

    listEl.querySelectorAll('[data-edit-id]').forEach((btn) => {
      btn.addEventListener('click', () => startEditProduct(btn.dataset.editId));
    });
    listEl.querySelectorAll('[data-delete-id]').forEach((btn) => {
      btn.addEventListener('click', () => deleteProduct(btn.dataset.deleteId));
    });
  }

  /* ==============================================================
     ADD / EDIT PRODUCT FORM
     ============================================================== */
  const productForm = document.getElementById('productForm');
  const formHeading = document.getElementById('formHeading');
  const saveProductBtnLabel = document.getElementById('saveProductBtnLabel');
  const cancelEditBtn = document.getElementById('cancelEditBtn');
  const productFormStatus = document.getElementById('productFormStatus');

  function setProductFormStatus(message, type) {
    productFormStatus.textContent = message;
    productFormStatus.className = 'admin-status' + (type ? ` is-${type}` : '');
  }

  function resetForm() {
    productForm.reset();
    document.getElementById('productId').value = '';
    editingProductId = null;
    formHeading.textContent = 'Add New Product';
    saveProductBtnLabel.textContent = 'Add Product';
    cancelEditBtn.classList.add('hidden');
  }

  function startEditProduct(id) {
    const product = currentProducts.find((p) => p.id === id);
    if (!product) return;
    editingProductId = id;
    document.getElementById('productId').value = id;
    document.getElementById('pName').value = product.name;
    document.getElementById('pImage').value = product.image;
    document.getElementById('pPrice').value = product.price;
    document.getElementById('pDiscount').value = product.discount || 0;
    document.getElementById('pStock').value = product.stock || 'in';
    document.getElementById('pDescription').value = product.description || '';
    formHeading.textContent = 'Edit Product';
    saveProductBtnLabel.textContent = 'Save Changes';
    cancelEditBtn.classList.remove('hidden');
    window.scrollTo({ top: document.getElementById('productForm').offsetTop - 100, behavior: 'smooth' });
  }

  cancelEditBtn?.addEventListener('click', resetForm);

  function slugify(name) {
    return name.toLowerCase().trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36).slice(-4);
  }

  productForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const token = getToken();
    if (!token) {
      setProductFormStatus('Please paste and save your GitHub token above first.', 'error');
      return;
    }

    const name = document.getElementById('pName').value.trim();
    const image = document.getElementById('pImage').value.trim();
    const price = Number(document.getElementById('pPrice').value);
    const discount = Number(document.getElementById('pDiscount').value) || 0;
    const stock = document.getElementById('pStock').value;
    const description = document.getElementById('pDescription').value.trim();

    if (!name || !image || !price) {
      setProductFormStatus('Please fill in all required fields.', 'error');
      return;
    }

    const saveBtn = document.getElementById('saveProductBtn');
    saveBtn.disabled = true;
    setProductFormStatus('Saving to GitHub…', 'info');

    try {
      if (editingProductId) {
        const idx = currentProducts.findIndex((p) => p.id === editingProductId);
        if (idx > -1) {
          currentProducts[idx] = { ...currentProducts[idx], name, image, price, discount, stock, description };
        }
      } else {
        const newProduct = { id: slugify(name), name, image, price, discount, stock, description };
        currentProducts.push(newProduct);
      }

      await commitProductsToGitHub(token, editingProductId ? `Update product: ${name}` : `Add product: ${name}`);

      setProductFormStatus('✅ Saved! Your live site will update within a minute or two.', 'success');
      resetForm();
      renderProductList();
    } catch (err) {
      console.error('Save failed:', err);
      setProductFormStatus(`Failed to save: ${err.message}`, 'error');
    } finally {
      saveBtn.disabled = false;
    }
  });

  async function deleteProduct(id) {
    const token = getToken();
    if (!token) { showToast('Please paste and save your GitHub token first.'); return; }

    const product = currentProducts.find((p) => p.id === id);
    if (!product) return;
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;

    try {
      currentProducts = currentProducts.filter((p) => p.id !== id);
      await commitProductsToGitHub(token, `Delete product: ${product.name}`);
      showToast('Product deleted.');
      renderProductList();
    } catch (err) {
      console.error('Delete failed:', err);
      showToast(`Failed to delete: ${err.message}`);
    }
  }

  /* ==============================================================
     COMMIT products.json BACK TO GITHUB
     ============================================================== */
  async function commitProductsToGitHub(token, commitMessage) {
    const content = JSON.stringify(currentProducts, null, 2);
    const encodedContent = btoa(unescape(encodeURIComponent(content)));

    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: commitMessage,
          content: encodedContent,
          sha: currentFileSha,
          branch: GITHUB_BRANCH,
        }),
      }
    );

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.message || `GitHub API error (${res.status}). Check your token permissions.`);
    }

    const data = await res.json();
    currentFileSha = data.content.sha; // update sha for next commit
  }

});

function escapeHtml(str) {
  if (str === undefined || str === null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
