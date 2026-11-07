import { chromium } from "playwright-core"; import fs from "node:fs"; import { start } from "./serve.mjs";
const s = await start(4173); const b = await chromium.launch({ channel: "msedge" }); fs.mkdirSync("shots/new", { recursive: true });
for (const theme of ["dark","light"]) for (const [n,w] of [["desktop",1280],["mobile",360]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 900 }, colorScheme: theme, reducedMotion: "reduce" }); const p = await ctx.newPage();
  await p.goto("http://127.0.0.1:4173/sideeye/"); await p.evaluate(() => document.fonts.ready);
  await p.locator("#indicators").screenshot({ path: `shots/new/${n}-${theme}-indicators.png` });
  await p.locator("#g-alerts").scrollIntoViewIfNeeded(); await p.waitForTimeout(500); await p.locator("#g-alerts").screenshot({ path: `shots/new/${n}-${theme}-guide.png` });
  await ctx.close(); }
await b.close(); s.close();