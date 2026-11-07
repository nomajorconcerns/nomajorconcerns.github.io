// Favicons (svg + png 16/32/180/512) and Open Graph images (1200x630) for both sites.
// OG images are rendered by the real browser from dist/_og/<site>.html so the self-hosted fonts are used.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { chromium } from "playwright-core";
import { fileURLToPath, pathToFileURL } from "node:url";
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const octo = fs.readFileSync(path.join(root, "shared/partials/octo-symbol.svg"), "utf8");
const octoInner = octo.replace(/^<symbol[^>]*>/, "").replace(/<\/symbol>$/, "");

const icons = {
  // Joint site: Cephalo's existing pixel octopus (no new logo)
  joint: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-1 -2 18 16" shape-rendering="crispEdges">${octoInner}</svg>`,
  // SideEye: the logo mark
  sideeye: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="#a8dd48"/><circle cx="50" cy="50" r="32" fill="none" stroke="#7aa22f" stroke-width="5"/><circle cx="50" cy="50" r="19" fill="none" stroke="#7aa22f" stroke-width="5"/><circle cx="31" cy="48" r="12" fill="#141a0a"/><circle cx="27.5" cy="44.5" r="3.4" fill="#fff"/></svg>`,
};
for (const [site, svg] of Object.entries(icons)) {
  const dir = path.join(root, "sites", site, "static");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "favicon.svg"), svg);
  for (const [name, size] of [["favicon-16.png", 16], ["favicon-32.png", 32], ["apple-touch-icon.png", 180], ["icon-512.png", 512]]) {
    await sharp(Buffer.from(svg), { density: 600 }).resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(path.join(dir, name));
  }
}
const browser = await chromium.launch({ channel: "msedge" });
for (const site of ["joint", "sideeye"]) {
  const f = path.join(root, "dist", "_og", `${site}.html`);
  if (!fs.existsSync(f)) continue;
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(f).href);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(root, "sites", site, "static", "og.png") });
  await page.close();
}
await browser.close();
console.log("assets done");
