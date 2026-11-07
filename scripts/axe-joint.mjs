import { chromium } from "playwright-core"; import fs from "node:fs"; import { createRequire } from "node:module"; import { start } from "./serve.mjs";
const axeSrc = fs.readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const s = await start(4173); const b = await chromium.launch({ channel: "msedge" }); let bad = 0;
for (const theme of ["dark", "light"]) for (const w of [1280, 360]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 900 }, colorScheme: theme, reducedMotion: "reduce" }); const p = await ctx.newPage();
  await p.goto("http://127.0.0.1:4173/"); await p.waitForSelector("#layers-demo .ly-stage:not([hidden])"); await p.waitForSelector("#bundle-calc .bc-stage:not([hidden])");
  // put demos in their richest states
  await p.check("#ly-a-variant"); await p.click(".ly-send"); for (let i = 0; i < 12; i++) { if (await p.locator(".ly-decide").isVisible()) break; await p.click(".ly-next"); }
  for (let i = 0; i < 4; i++) await p.click(".sp-next");
  await p.check("#chooser input[value=claude]"); await p.check("#chooser input[name=net][value=yes]"); await p.check("#chooser input[name=known][value=no]"); await p.check("#chooser input[name=team][value=one]");
  await p.evaluate(axeSrc);
  const r = await p.evaluate(() => axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa", "best-practice"] }));
  const sw = await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  console.log(theme, w, "axe:", r.violations.map((v) => v.id + "(" + v.nodes.length + ")" + v.nodes.slice(0, 2).map((n) => n.target.join(" ")).join("|")).join(", ") || 0, "hscroll:", sw); if (r.violations.length || sw) bad++;
  // open the FAQ and every install tab too
  await p.click('#install-products [data-tab=both]'); for (const d of await p.locator("details.faq").all()) await d.locator("summary").click();
  const r2 = await p.evaluate(() => axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa", "best-practice"] })); console.log("  expanded:", r2.violations.map((v) => v.id).join(",") || 0); if (r2.violations.length) bad++;
  await ctx.close();
}
await b.close(); s.close(); process.exit(bad ? 1 : 0);
