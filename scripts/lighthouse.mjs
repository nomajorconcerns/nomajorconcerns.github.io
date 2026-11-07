import lighthouse from "lighthouse"; import * as chromeLauncher from "chrome-launcher"; import { start } from "./serve.mjs"; import fs from "node:fs";
const edge = ["C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Microsoft/Edge/Application/msedge.exe"].find((p) => fs.existsSync(p));
const server = await start(4173);
const chrome = await chromeLauncher.launch({ chromePath: edge, chromeFlags: ["--headless=new", "--no-sandbox"] });
const pages = { "joint /": "http://127.0.0.1:4173/", "sideeye /sideeye/": "http://127.0.0.1:4173/sideeye/" };
for (const [name, url] of Object.entries(pages)) for (const form of ["mobile", "desktop"]) {
  const r = await lighthouse(url, { port: chrome.port, output: "json", logLevel: "error", onlyCategories: ["performance", "accessibility", "best-practices", "seo"], formFactor: form, screenEmulation: form === "desktop" ? { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false } : undefined, throttlingMethod: "simulate" });
  const c = r.lhr.categories; console.log(name, form, Object.entries(c).map(([k, v]) => `${k}=${Math.round(v.score * 100)}`).join(" "), "LCP", Math.round(r.lhr.audits["largest-contentful-paint"].numericValue), "ms CLS", r.lhr.audits["cumulative-layout-shift"].numericValue.toFixed(3), "TBT", Math.round(r.lhr.audits["total-blocking-time"].numericValue));
  const bad = Object.values(r.lhr.audits).filter((a) => a.score !== null && a.score < 1 && a.scoreDisplayMode === "binary" && /accessibility|best-practices|seo/.test(JSON.stringify(Object.entries(c).filter(([k, v]) => v.auditRefs.some((x) => x.id === a.id)).map(([k]) => k)))).map((a) => a.id);
  if (bad.length) console.log("   failing audits:", bad.join(", "));
}
await chrome.kill(); server.close();
