// Lists elements that stick out past the viewport at 360px (horizontal scroll check).
import { chromium } from "playwright-core";
import { start } from "./serve.mjs";
const site = process.argv[2] || "joint";
const server = await start(4173);
const base = site === "joint" ? "http://127.0.0.1:4173/" : "http://127.0.0.1:4173/sideeye/";
const browser = await chromium.launch({ channel: "msedge" });
const page = await browser.newPage({ viewport: { width: 360, height: 780 } });
await page.goto(base);
await page.evaluate(() => document.fonts.ready);
const r = await page.evaluate(() => {
  const vw = document.documentElement.clientWidth;
  const bad = [];
  document.querySelectorAll("body *").forEach((e) => {
    const b = e.getBoundingClientRect();
    if (b.width && b.right > vw + 1 && getComputedStyle(e).position !== "fixed") bad.push(`${e.tagName.toLowerCase()}.${(e.className && e.className.baseVal === undefined ? e.className : "").toString().split(" ")[0]} right=${Math.round(b.right)} w=${Math.round(b.width)}`);
  });
  return { vw, scrollW: document.documentElement.scrollWidth, bad: bad.slice(0, 12) };
});
console.log(JSON.stringify(r, null, 1));
await browser.close(); server.close();
