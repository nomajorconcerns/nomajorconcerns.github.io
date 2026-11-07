import { chromium } from "playwright-core";
import fs from "node:fs";
import { createRequire } from "node:module";
import { start } from "./serve.mjs";
const axeSrc = fs.readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const server = await start(4173);
const browser = await chromium.launch({ channel: "msedge" });
const sites = { joint: "http://127.0.0.1:4173/", sideeye: "http://127.0.0.1:4173/sideeye/" };
let bad = 0;
async function settle(p){await p.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=600){scrollTo(0,y);await new Promise(r=>setTimeout(r,40))}scrollTo(0,0)});await p.waitForTimeout(800)}

for (const [name, url] of Object.entries(sites)) {
  for (const pages of ["", "404.html", "privacy.html"]) {
    for (const theme of ["dark", "light"]) {
      for (const w of [1440, 360]) {
        const ctx = await browser.newContext({ viewport: { width: w, height: 800 }, colorScheme: theme });
        const page = await ctx.newPage();
        const hosts = new Set(); page.on("request", (r) => { const u = new URL(r.url()); if (u.protocol.startsWith("http")) hosts.add(u.host); });
        await page.goto(url + pages); await page.evaluate(() => document.fonts.ready);
        await settle(page); await page.evaluate(axeSrc);
        const r = await page.evaluate(() => axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa", "best-practice"] }));
        const v = r.violations.filter((x) => x.id !== "region" || true);
        const sw = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
        const ext = [...hosts].filter((h) => h !== "127.0.0.1:4173");
        if (v.length || sw || ext.length) bad++;
        console.log(`${name}/${pages || "index"} ${theme} ${w}: axe ${v.length}${v.length ? " " + v.map((x) => x.id + "(" + x.nodes.length + ")").join(",") : ""} hscroll=${sw} external=${ext.length ? ext : "none"}`);
        await ctx.close();
      }
    }
  }
  // JS off: hero must render
  const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1200, height: 800 } });
  const page = await ctx.newPage(); await page.goto(sites[name]);
  const ok = await page.evaluate(() => { const h = document.querySelector("h1"), s = document.querySelector("svg.mascot"); return !!h && h.getBoundingClientRect().height > 20 && !!s && s.getBoundingClientRect().height > 100; });
  console.log(`${name} JS off: hero renders = ${ok}`); if (!ok) bad++; await ctx.close();
}
await browser.close(); server.close(); process.exit(bad ? 1 : 0);
