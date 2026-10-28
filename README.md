# Basket — a cozy to-buy list

A small installable web app (PWA). No build step, no accounts, no costs. Data stays on the phone (localStorage).

## Run locally

```bash
python -m http.server 5173
```

Open http://localhost:5173.

## Put it on your phone (free)

1. Push this folder to a GitHub repo and enable **GitHub Pages** (Settings → Pages → deploy from branch). Netlify Drop or Cloudflare Pages work too.
2. Open the URL on your phone.
   - Android (Chrome): menu → **Install app**.
   - iPhone (Safari): Share → **Add to Home Screen**.
3. It now opens full screen like a native app and works offline.

## How it works

- **Pantry** (left): tap a chip to add it, or drag it onto the list (on touch: press and hold, then drag). `+ Add` creates your own items; the pencil lets you remove them.
- **List** (right): tap an item to tick it off, tap `×2` to lower the quantity, `×` to remove. Tap the title to rename.
- **Save** stores the list; the last saved list opens automatically next time. Unsaved changes show a yellow dot and are kept even if the app is closed.
- **Clear** empties the items but keeps the list. **Delete** removes the saved list. **Load** opens another saved list or starts a new one.

Files: `index.html`, `styles.css`, `app.js`, `sw.js` (offline cache), `manifest.webmanifest`, `icons/`.
