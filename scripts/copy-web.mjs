// Copies the web app into www/, which Capacitor packages into the Android app.
// The source files stay in the project root so GitHub Pages can serve them as-is.
import { cp, rm, mkdir } from "node:fs/promises";

const FILES = ["index.html", "styles.css", "app.js", "manifest.webmanifest", "icons", "fonts"];

await rm("www", { recursive: true, force: true });
await mkdir("www");
for (const f of FILES) await cp(f, `www/${f}`, { recursive: true });
console.log(`Copied ${FILES.length} entries to www/`);
