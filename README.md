# Your Store — Multi-Product E-Commerce Website with Admin Panel

A complete, premium, mobile-responsive **multi-product** e-commerce website
built with plain **HTML, CSS, and JavaScript**. No backend server —
deploys directly to **GitHub Pages**. Includes an **Admin Panel** where you
can add, edit, and delete products from your browser — changes go straight
to your GitHub repo and appear on the live site automatically.

---

## 📁 Project Structure

```
project/
│
├── index.html          → Store homepage (product grid)
├── product.html         → Product detail page + order form
├── admin.html            → Admin login + product management panel
├── products.json          → Product data (source of truth — admin panel edits this)
├── css/
│   └── style.css
├── js/
│   ├── common.js         → Shared: navbar, dark mode, toast, scroll-to-top
│   ├── main.js             → Homepage product grid rendering
│   ├── product.js           → Product detail page + order form + EmailJS
│   └── admin.js               → Firebase login + GitHub API product CRUD
├── images/
└── README.md
```

---

## 🧠 How It Works (read this first)

- **Product data** (name, image, price, discount, stock, description) lives
  in `products.json` in this repo — **not** in any database.
- The homepage and product pages simply `fetch()` that file and render it.
- The **Admin Panel** (`admin.html`) lets you add/edit/delete products
  through a form. When you save, it uses the **GitHub API** to commit the
  updated `products.json` directly to your repository.
- GitHub Pages automatically rebuilds your site after every commit
  (usually within 30 seconds to 2 minutes), so your changes go live
  without you ever touching the code.
- **Firebase** is used *only* to log you into the Admin Panel (email +
  password). It never stores product data.
- Your **GitHub Personal Access Token** (which allows the Admin Panel to
  commit) is entered fresh in your browser each session and stored only in
  `sessionStorage` — it is **never** saved in the code or the repo, and it
  disappears when you close the tab.

---

## 🚀 1. Deploy to GitHub Pages

### Step 1 — Create a GitHub repository
1. Go to [github.com/new](https://github.com/new)
2. Name your repository (e.g. `my-store`)
3. Set it to **Public** (GitHub Pages on the free plan requires a public repo)
4. Click **Create repository**

### Step 2 — Upload your files
**Option A — via GitHub web UI:**
1. Click **"uploading an existing file"** on your new repo page
2. Drag and drop everything inside the `project/` folder (`index.html`, `product.html`, `admin.html`, `products.json`, `css/`, `js/`, `README.md`)
3. Commit the changes

**Option B — via Git command line:**
```bash
cd project
git init
git add .
git commit -m "Initial commit — store setup"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git push -u origin main
```

### Step 3 — Enable GitHub Pages
1. Go to **Settings → Pages**
2. Under **Source**, select branch `main` and folder `/ (root)`
3. Click **Save**
4. Your site will be live at: `https://YOUR-USERNAME.github.io/YOUR-REPO/`

---

## 🔑 2. Create a GitHub Personal Access Token (for the Admin Panel)

This token lets the Admin Panel commit product updates to your repo on
your behalf. Treat it like a password — don't share it or paste it into
any other website.

1. Go to [github.com/settings/tokens](https://github.com/settings/tokens)
2. Click **Generate new token → Generate new token (classic)**
3. Give it a name (e.g. "Store Admin Panel")
4. Set an expiration (e.g. 90 days — you'll just generate a new one after)
5. Under **Scopes**, check **`repo`** (this gives it permission to read/write your repository contents)
6. Click **Generate token** and **copy it immediately** (GitHub won't show it again)
7. Paste it into the **Admin Panel's "GitHub Token" field** each time you use it — it's only kept for your current browser session

> 🔒 If your repo is public, anyone can *read* `products.json`, but only
> someone with a valid token (i.e. you) can *write* to it. Never commit
> your token into any file.

---

## 🔥 3. Set Up Firebase (for Admin Login)

Firebase Authentication is only used to gate access to the Admin Panel —
it does not touch your product data.

### Step 1 — Create a Firebase project
1. Go to [console.firebase.google.com](https://console.firebase.google.com/)
2. Click **Add project**, give it a name, and finish the setup wizard

### Step 2 — Register a Web App
1. In your project, click the **Web (`</>`)** icon to add a web app
2. Give it a nickname and click **Register app**
3. Firebase will show you a `firebaseConfig` object like:
   ```js
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "my-store.firebaseapp.com",
     projectId: "my-store",
     storageBucket: "my-store.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef"
   };
   ```
4. Copy these values

### Step 3 — Enable Email/Password sign-in
1. In the Firebase Console, go to **Authentication → Sign-in method**
2. Enable **Email/Password**

### Step 4 — Create your admin user
1. Go to **Authentication → Users → Add user**
2. Enter the email and password you want to log into the Admin Panel with

### Step 5 — Paste your config into the code
Open `js/admin.js` and find this block near the top:

```js
const FIREBASE_CONFIG = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

Replace the placeholder values with your real `firebaseConfig` values from Step 2.

Then find this block just below it and fill in your repo details:

```js
const GITHUB_OWNER = 'YOUR_GITHUB_USERNAME';   // <-- your GitHub username
const GITHUB_REPO = 'YOUR_REPO_NAME';          // <-- your repo name
const GITHUB_BRANCH = 'main';                  // <-- change if different
const GITHUB_FILE_PATH = 'products.json';      // <-- keep as-is
```

Save, commit, and push.

---

## ✏️ 4. Customize Store Branding

Search for these across the HTML files and replace with your own:

| What | Where |
|---|---|
| Store name ("Your Store") | Navbar + footer in all 3 HTML files |
| WhatsApp number (`91XXXXXXXXXX`) | `js/product.js` (`WHATSAPP_NUMBER`), `index.html` contact section, footer links |
| Contact email / phone | `index.html` contact section |
| Social media links | Footer `.footer__social-icons` in `index.html` / `product.html` |
| SEO title/description/OG image | `<head>` of `index.html` |

---

## 📧 5. Set Up EmailJS (so orders land in your Gmail inbox)

### Step 1 — Create an EmailJS account
Go to [emailjs.com](https://www.emailjs.com/) and sign up (free tier: ~200 emails/month)

### Step 2 — Connect Gmail
1. **Email Services → Add New Service → Gmail**
2. Connect your Gmail account
3. Copy the **Service ID**

### Step 3 — Create a template
1. **Email Templates → Create New Template**
2. Use these variables in your template body:
   ```
   New Order Received!

   Customer Name: {{customer_name}}
   Phone: {{customer_phone}}
   Email: {{customer_email}}
   Delivery Address: {{delivery_address}}

   Product: {{product_name}}
   Quantity: {{quantity}}
   Order Total: {{order_total}}

   Additional Notes: {{additional_notes}}
   ```
3. Set the template's **"To Email"** to your own Gmail address
4. Copy the **Template ID**

### Step 4 — Get your Public Key
**Account → General → Public Key**

### Step 5 — Paste into the code
Open `js/product.js` and update:

```js
const EMAILJS_PUBLIC_KEY  = 'YOUR_PUBLIC_KEY';   // <-- REPLACE THIS
const EMAILJS_SERVICE_ID  = 'YOUR_SERVICE_ID';   // <-- REPLACE THIS
const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID';  // <-- REPLACE THIS
```

Save, commit, push.

---

## ✅ 6. Test Everything

**Storefront:**
1. Visit your live GitHub Pages URL — you should see the sample products
2. Click a product → detail page should load with image, price, description
3. Submit a test order → loading spinner → success message → check your Gmail inbox

**Admin Panel:**
1. Visit `https://YOUR-USERNAME.github.io/YOUR-REPO/admin.html`
2. Log in with the email/password you created in Firebase
3. Paste your GitHub token and click **"Save for this session"**
4. Add a new product (name, image link, price, discount, description)
5. Wait ~30–90 seconds, then refresh your homepage — the new product should appear
6. Try editing and deleting a product to confirm both work
7. Close the tab and reopen the Admin Panel — you should need to log in and paste your token again (this is expected and intentional for security)

---

## 🎨 Customization Notes

- **Colors / theme**: all design tokens live in `css/style.css` under `:root`
- **Dark/Light mode**: toggled via the moon/sun icon in the navbar
- **Product fields**: to add more fields (e.g. category), update the shape
  of objects in `products.json`, the form in `admin.html`/`admin.js`, and
  the rendering in `main.js`/`product.js`
- **Multiple images per product**: the current setup supports one image
  per product; this can be extended to a gallery later if needed

---

## 🧩 Tech Used

- Semantic HTML5, vanilla CSS (Grid, Flexbox, glassmorphism), vanilla JS
- [Firebase Authentication](https://firebase.google.com/docs/auth) — admin login only
- [GitHub REST API](https://docs.github.com/en/rest) — product data commits
- [EmailJS](https://www.emailjs.com/) — order emails
- [Lucide Icons](https://lucide.dev/), Google Fonts (Fraunces, Manrope, JetBrains Mono)

No build step, no `npm install`, no backend server — just static files plus two free third-party services (Firebase for login, EmailJS for order emails).
