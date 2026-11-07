import { chromium } from "playwright-core"; import { start } from "./serve.mjs";
const s = await start(4173); const b = await chromium.launch({ channel: "msedge" }); let f = 0; const ck = (n, ok, x = "") => { console.log(`${ok ? "pass" : "FAIL"}  ${n} ${x}`); if (!ok) f++; };
const anim = (p, sel) => p.evaluate((sel) => { const e = document.querySelector(sel); return e ? getComputedStyle(e).animationName : "none"; }, sel);
for (const [name, url] of [["sideeye", "http://127.0.0.1:4173/sideeye/"], ["joint", "http://127.0.0.1:4173/"]]) {
  let ctx = await b.newContext({ viewport: { width: 1280, height: 900 } }); let p = await ctx.newPage(); await p.goto(url);
  const sel = (await p.locator("svg.ch").count()) ? "svg.ch" : "x";
  const tails = await p.evaluate(() => [...document.querySelectorAll(".ch-tail")].map((e) => getComputedStyle(e).animationName));
  ck(`${name}: chameleon parts animate`, tails.some((n) => n === "ch-sway"), tails[0]);
  // pixel motion: tail transform changes over time
  const t1 = await p.evaluate(() => getComputedStyle(document.querySelector(".ch-tail")).transform); await p.waitForTimeout(1500);
  const t2 = await p.evaluate(() => getComputedStyle(document.querySelector(".ch-tail")).transform); ck(`${name}: tail actually moves`, t1 !== t2, t1 + " -> " + t2);
  // reveal: a lower card starts hidden then appears on scroll
  const op = () => p.evaluate(() => { const e = document.querySelector("#limits .tbl-wrap, #limits table, #faq details, #data .tbl-wrap"); return e ? getComputedStyle(e).opacity : "na"; });
  const before = await op(); await p.evaluate(() => document.querySelector("#data, #faq").scrollIntoView()); await p.waitForTimeout(900); const after = await op();
  ck(`${name}: sections ease in on scroll`, Number(before) < 1 || before === "na", `${before}`);
  ck(`${name}: visible after scrolling to it`, await p.evaluate(() => [...document.querySelectorAll("#data .rv, #limits .rv, #faq .rv")].filter((e) => e.getBoundingClientRect().top < innerHeight).every((e) => getComputedStyle(e).opacity === "1")));
  const cur = await p.evaluate(() => document.querySelector(".topnav a[aria-current]")?.textContent); ck(`${name}: nav shows current section`, !!cur, cur);
  await ctx.close();
  ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" }); p = await ctx.newPage(); await p.goto(url);
  ck(`${name}: reduced motion: no animation, no hidden content`, await p.evaluate(() => getComputedStyle(document.querySelector(".ch-tail")).animationName === "none" && !document.documentElement.classList.contains("js-reveal")));
  await ctx.close();
}
await b.close(); s.close(); process.exit(f ? 1 : 0);
