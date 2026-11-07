import { chromium } from "playwright-core"; import fs from "node:fs"; import { createRequire } from "node:module"; import { start } from "./serve.mjs";
const axeSrc = fs.readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const s = await start(4173); const b = await chromium.launch({ channel: "msedge" });
for (const theme of ["dark", "light"]) {
  const p = await (await b.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: theme })).newPage();
  await p.goto("http://127.0.0.1:4173/sideeye/"); await p.locator("#playground").scrollIntoViewIfNeeded(); await p.waitForSelector("#playground .pg-stage:not([hidden])");
  let outside = 0, n = 0;
  for (let i = 0; i < 40; i++) { await p.waitForTimeout(500); n++; outside += 3 - (await p.locator("#playground .meter[data-inside=true]").count()); }
  console.log(theme, "streamed 20s; samples with a lane outside its band:", outside, "of", n * 3);
  await p.getByRole("button", { name: "Spawn 40 processes" }).click();
  await p.evaluate(axeSrc);
  for (const [label, sel] of [["flagged playground", "#try"], ["baseline", "#baseline"], ["data+limits", "#data"], ["how", "#how"]]) {
    const r = await p.evaluate((sel) => axe.run(document.querySelector(sel), { runOnly: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa", "best-practice"] }), sel);
    console.log(theme, label, "axe violations:", r.violations.map((v) => v.id + "(" + v.nodes.length + ")").join(",") || 0);
  }
}
await b.close(); s.close();
