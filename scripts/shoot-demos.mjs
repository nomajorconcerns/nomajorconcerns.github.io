import { chromium } from "playwright-core";
import fs from "node:fs"; import { start } from "./serve.mjs";
const server = await start(4173); const b = await chromium.launch({ channel: "msedge" });
fs.mkdirSync("shots/demos", { recursive: true });
for (const theme of ["dark", "light"]) for (const [n, w] of [["desktop", 1280], ["mobile", 360]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 900 }, colorScheme: theme, reducedMotion: "reduce" }); const p = await ctx.newPage();
  await p.goto("http://127.0.0.1:4173/sideeye/"); await p.evaluate(() => document.fonts.ready);
  await p.waitForSelector("#playground .pg-stage:not([hidden])");
  for (let i = 0; i < 3; i++) await p.click(".pg-next");
  await p.getByRole("button", { name: "Read ~/.aws/credentials" }).click();
  await p.locator("#try").screenshot({ path: `shots/demos/${n}-${theme}-try.png` });
  await p.evaluate(() => { const s = document.querySelector("#bl-days"); s.value = 25; s.dispatchEvent(new Event("input", { bubbles: true })); });
  await p.locator("#baseline").screenshot({ path: `shots/demos/${n}-${theme}-baseline.png` });
  await p.locator("#how").screenshot({ path: `shots/demos/${n}-${theme}-how.png` });
  await ctx.close();
}
await b.close(); server.close();
