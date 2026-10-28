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

## Android app (APK)

The same code is packaged as a real Android app with [Capacitor](https://capacitorjs.com) (free). Everything ships inside the APK, fonts included, so it never needs the internet.

Needs Android Studio installed (it brings Java and the Android SDK). Then:

```bash
npm install
npm run apk
```

The APK lands in `android/app/build/outputs/apk/debug/app-debug.apk`. Copy it to the phone and open it (allow "install unknown apps" when Android asks).

`npm run apk` copies the web files into `www/`, syncs them into `android/`, and runs Gradle. After changing `index.html`, `styles.css` or `app.js`, just run it again.

> **Norton Antivirus note:** Norton's Web Shield re-signs HTTPS traffic, and Android Studio's Java doesn't trust it, so Gradle downloads fail with `PKIX path building failed`. Either pause Web Shield for the first build, or export Norton's root certificate into a copy of Java's `cacerts` and point `JAVA_TOOL_OPTIONS=-Djavax.net.ssl.trustStore=<that file>` at it.

## Editing the pantry items

All built-in categories and items are in **`pantry.json`**. Each item looks like this:

```json
{ "id": "eggs", "emoji": "🥚", "name": { "en": "Eggs", "pt": "Ovos" } }
```

- **Add an item:** copy a line into the right category's `items`, give it a new `id`, an emoji and its names. Mind the commas between items.
- **Remove an item:** delete its line. Saved lists that already have it keep showing it, using the name saved with it.
- **Rename an item:** change `name`, but keep the `id`. The `id` is what saved lists use, so changing it makes existing lists lose track of the item. Use lowercase, and don't reuse an old id for something else.
- **Add a category:** copy a whole category block (`id`, `emoji`, `name`, `items`).
- A missing `pt` name falls back to `en`.

Then publish the change: `git push` for the website, `npm run apk` for a new Android build.

Interface text (buttons, messages) is in `i18n.js`.

## How it works

- **Pantry** (left): tap a chip to add it, or drag it onto the list. On touch, swipe it sideways toward the list (or press and hold, then drag in any direction); swiping up/down scrolls the pantry. `+ Add` creates your own items; the pencil lets you remove them.
- **List** (right): tap an item to tick it off, tap `×2` to lower the quantity, `×` to remove. Tap the title to rename.
- **Save** stores the list; the last saved list opens automatically next time. Unsaved changes show a yellow dot and are kept even if the app is closed.
- **Settings** (gear, top right): language, English or Português (Portugal). It starts in the phone's language. Interface text lives in `i18n.js` and item names in `pantry.json`; a new language needs a block in `i18n.js` plus its names in `pantry.json`.
- **Clear** empties the items but keeps the list. **Delete** removes the saved list. **Load** opens another saved list or starts a new one.

Files: `index.html`, `styles.css`, `app.js`, `sw.js` (offline cache), `manifest.webmanifest`, `icons/`.
