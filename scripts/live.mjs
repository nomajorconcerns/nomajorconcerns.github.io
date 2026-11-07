import { chromium } from "playwright-core";
const b = await chromium.launch({ channel: "msedge" });
for (const theme of ["dark","light"]) {
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: theme })).newPage();
  const hosts = new Set(); p.on("request", r => hosts.add(new URL(r.url()).host));
  const bad = []; p.on("response", r => { if (r.status() >= 400) bad.push(r.status() + " " + r.url()); });
  await p.goto("https://nomajorconcerns.github.io/"); await p.evaluate(() => document.fonts.ready);
  console.log(theme, "hosts:", [...hosts], "errors:", bad);
  if (theme === "dark") await p.screenshot({ path: "shots/live-joint.png" });
  const links = await p.$$eval("a[href^=http]", a => [...new Set(a.map(x => x.href))]);
  if (theme === "dark") for (const u of links) { const r = await fetch(u, { method: "HEAD", redirect: "follow" }).catch(() => ({ status: "fail" })); console.log(r.status, u); }
}
await b.close();
