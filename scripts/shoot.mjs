// Screenshots: node scripts/shoot.mjs <site> [outDir]   -> desktop 1440 and mobile 360, dark and light, full page.
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";
import { start } from "./serve.mjs";
const site = process.argv[2] || "joint";
const out = path.resolve(process.argv[3] || `shots/${site}`);
fs.mkdirSync(out, { recursive: true });
const server = await start(4173);
const base = site === "joint" ? "http://127.0.0.1:4173/" : "http://127.0.0.1:4173/sideeye/";
const browser = await chromium.launch({ channel: "msedge" });
for (const theme of ["dark", "light"]) {
  for (const [name, w, h] of [["desktop", 1440, 900], ["mobile", 360, 780]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: theme, reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await page.goto(base);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(150);
    await page.screenshot({ path: path.join(out, `${name}-${theme}.png`), fullPage: true });
    await ctx.close();
  }
}
await browser.close(); server.close();
console.log("shots in", out);
