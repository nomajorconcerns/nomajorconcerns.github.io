import { chromium } from "playwright-core"; import fs from "node:fs"; import { start } from "./serve.mjs";
const s = await start(4173); const b = await chromium.launch({ channel: "msedge" }); fs.mkdirSync("shots/joint2", { recursive: true });
for (const theme of ["dark", "light"]) for (const [n, w] of [["desktop", 1280], ["mobile", 360]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 900 }, colorScheme: theme, reducedMotion: "reduce" }); const p = await ctx.newPage();
  await p.goto("http://127.0.0.1:4173/"); await p.waitForSelector("#layers-demo .ly-stage:not([hidden])");
  await p.locator("#products").screenshot({ path: `shots/joint2/${n}-${theme}-products.png` });
  await p.check("#ly-a-variant"); await p.click(".ly-send"); for (let i = 0; i < 12; i++) { if (await p.locator(".ly-decide").isVisible()) break; await p.click(".ly-next"); }
  await p.locator("#try").screenshot({ path: `shots/joint2/${n}-${theme}-try.png` });
  await p.click(".ly-contain"); await p.locator("#try").screenshot({ path: `shots/joint2/${n}-${theme}-try-done.png` });
  for (let i = 0; i < 4; i++) await p.click(".sp-next");
  for (const id of ["split", "catches", "fit", "choose", "pricing", "limits", "roadmap"]) await p.locator("#" + id).screenshot({ path: `shots/joint2/${n}-${theme}-${id}.png` });
  await ctx.close();
}
await b.close(); s.close();
