import lighthouse from "lighthouse"; import * as cl from "chrome-launcher"; import { start } from "./serve.mjs"; import fs from "node:fs";
const edge = ["C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Microsoft/Edge/Application/msedge.exe"].find((p) => fs.existsSync(p));
const s = await start(4173); const c = await cl.launch({ chromePath: edge, chromeFlags: ["--headless=new"] });
for (const u of ["http://127.0.0.1:4173/sideeye/"]) {
  const r = await lighthouse(u, { port: c.port, output: "json", logLevel: "error", onlyCategories: ["performance"], formFactor: "desktop", screenEmulation: { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false } });
  const a = r.lhr.audits["layout-shifts"]; console.log(u, a.numericValue?.toFixed?.(3) ?? a.displayValue);
  for (const i of a.details?.items ?? []) console.log("  ", i.score?.toFixed(3), i.node?.selector, "|", (i.node?.nodeLabel || "").slice(0, 50));
}
await c.kill(); s.close();
