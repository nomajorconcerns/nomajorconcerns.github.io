// Drives the joint-site demos in a real browser.
import { chromium } from "playwright-core";
import { start } from "./serve.mjs";
const server = await start(4173); const browser = await chromium.launch({ channel: "msedge" });
let fails = 0; const check = (n, ok, x = "") => { console.log(`${ok ? "pass" : "FAIL"}  ${n}${x ? "  " + x : ""}`); if (!ok) fails++; };
const URL = "http://127.0.0.1:4173/";
async function open(opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, ...opts }); const page = await ctx.newPage();
  const errors = []; page.on("console", (m) => m.type() === "error" && errors.push(m.text())); page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(URL); await page.evaluate(() => document.fonts.ready); return { ctx, page, errors };
}
{ // J1 layered defence, stepping with the Next-step button (reduced motion)
  const { ctx, page, errors } = await open({ reducedMotion: "reduce" });
  await page.locator("#layers-demo").scrollIntoViewIfNeeded(); await page.waitForSelector("#layers-demo .ly-stage:not([hidden])");
  async function run(attack, ceph, side, contain) {
    await page.click(".ly-reset"); await page.check(`#ly-a-${attack}`);
    await page.locator("#ly-ceph").setChecked(ceph); await page.locator("#ly-side").setChecked(side);
    await page.click(".ly-send");
    for (let i = 0; i < 40 && (await page.locator(".ly-outcome").isHidden()); i++) {
      if (await page.locator(".ly-decide").isVisible()) { await page.click(contain ? ".ly-contain" : ".ly-letrun"); continue; }
      if (await page.locator(".ly-next").isVisible()) await page.click(".ly-next");
    }
    return { out: (await page.locator(".ly-outcome").innerText()).replace(/\s+/g, " "), log: await page.locator("#layers-demo .ev-log").innerText() };
  }
  let r = await run("push", true, true, true); check("push, both on: STOPPED (blocked by no-force-push)", /STOPPED/.test(r.out) && /Cephalo: BLOCK/i.test(r.log) && /no-force-push/i.test(r.log), r.out.slice(0, 60));
  r = await run("push", false, true, true); check("push, SideEye only: flagged after it ran, so PARTLY STOPPED", /PARTLY STOPPED/.test(r.out) && /history on main is overwritten/.test(r.out) && /SideEye: FLAGGED/i.test(r.log));
  r = await run("push", false, false, true); check("push, both off: UNPROTECTED", /UNPROTECTED/.test(r.out));
  r = await run("envread", true, false, true); check("file-tool .env read: Cephalo alone stops it", /STOPPED/.test(r.out) && /no-secret-file/.test(r.log));
  r = await run("upload", true, false, true); check("upload, Cephalo only: NOT COVERED", /NOT COVERED/.test(r.out) && /Cephalo: ALLOW/i.test(r.log));
  r = await run("upload", true, true, true); check("upload, both: SideEye flags it, contained, but the upload ran", /PARTLY STOPPED/.test(r.out) && /SideEye: FLAGGED/i.test(r.log) && /SideEye: CONTAINED/i.test(r.log));
  r = await run("variant", true, false, true); check("blocked-then-variant, Cephalo only: variant gets through", /PARTLY STOPPED/.test(r.out) && /archived/.test(r.out) && /sent to a new domain/.test(r.out));
  r = await run("variant", false, true, true); check("blocked-then-variant, SideEye only: secret was read", /PARTLY STOPPED/.test(r.out) && /secrets file is read/.test(r.out));
  r = await run("variant", true, true, true); check("blocked-then-variant, BOTH: nothing gets through", /STOPPED/.test(r.out) && !/PARTLY/.test(r.out) && /Nothing got through/.test(r.out), r.out.slice(0, 110));
  r = await run("variant", true, true, false); check("variant, both, but you let it run: it gets through", /PARTLY STOPPED/.test(r.out));
  r = await run("script", true, true, true); check("script: NOT COVERED by either, said honestly", /NOT COVERED/.test(r.out) && /Neither layer/.test(r.out));
  // focus moves to Contain when SideEye flags
  await page.click(".ly-reset"); await page.check("#ly-a-upload"); await page.locator("#ly-ceph").setChecked(true); await page.locator("#ly-side").setChecked(true); await page.click(".ly-send");
  for (let i = 0; i < 10 && !(await page.locator(".ly-decide").isVisible()); i++) await page.click(".ly-next");
  check("focus moves to Contain after a flag", await page.evaluate(() => document.activeElement?.classList.contains("ly-contain")));
  check("live region announces FLAGGED, product named", /SideEye: FLAGGED/i.test(await page.locator("#layers-demo [aria-live=polite]").innerText()));
  check("no console errors (J1)", errors.length === 0, errors.join(" | "));
  await ctx.close();
}
{ // split view
  const { ctx, page, errors } = await open({ reducedMotion: "reduce" });
  await page.locator("#split-demo").scrollIntoViewIfNeeded(); await page.waitForSelector("#split-demo .sp-stage:not([hidden])");
  for (let i = 0; i < 4; i++) await page.click(".sp-next");
  const L = await page.locator(".sp-left").innerText(), Rt = await page.locator(".sp-right").innerText();
  check("split: step 1 blocked in both lanes by the real rule", (L.match(/Cephalo: BLOCK/ig) || []).length === 1 && /no-secret-read/.test(L) && /no-secret-read/.test(Rt));
  check("split: left lane lets the variants through (3 tool runs)", (L.match(/Tool: RAN/ig) || []).length === 3);
  check("split: right lane flags and contains at step 3", /SideEye: FLAGGED/i.test(Rt) && /SideEye: CONTAINED/i.test(Rt) && (Rt.match(/Tool: RAN/ig) || []).length === 2);
  check("split: step 4 did not happen on the right", /did not happen/i.test(Rt));
  check("split: summaries are honest about step 3", /Containing stops what comes next/.test(Rt));
  await page.click(".sp-reset"); check("split: reset clears", (await page.locator(".sp-left li").count()) === 0);
  check("no console errors (split)", errors.length === 0, errors.join(" | ")); await ctx.close();
}
{ // chooser
  const { ctx, page, errors } = await open();
  await page.locator("#chooser").scrollIntoViewIfNeeded();
  const pick = async (agents, net, known, team) => { await page.click("#chooser button[type=reset]"); for (const a of agents) await page.check(`#chooser input[name=agents][value=${a}]`); await page.check(`#chooser input[name=net][value=${net}]`); await page.check(`#chooser input[name=known][value=${known}]`); await page.check(`#chooser input[name=team][value=${team}]`); return (await page.locator(".ch-result").innerText()).replace(/\s+/g, " "); };
  let t = await pick(["claude"], "no", "yes", "one"); check("chooser: Claude, no network, known commands -> Cephalo", /Recommended: Cephalo/.test(t) && /Free tier first/.test(t), t.slice(0, 40));
  t = await pick(["claude", "hermes"], "yes", "no", "one"); check("chooser: two agents, network, unknown -> Both (free tier first, SideEye not installable)", /Recommended: Both/.test(t) && /Cephalo Free today/.test(t) && /not installable/.test(t));
  t = await pick(["other"], "yes", "no", "one"); check("chooser: only an unsupported agent -> SideEye, honestly not installable", /Recommended: SideEye/.test(t) && /not installable yet/.test(t));
  t = await pick(["claude"], "no", "yes", "team"); check("chooser: team mentions Planned team plans", /Planned and not on sale/.test(t));
  check("chooser has no email field", (await page.locator("#chooser input[type=email]").count()) === 0);
  check("no console errors (chooser)", errors.length === 0, errors.join(" | ")); await ctx.close();
}
{ // install tabs
  const { ctx, page } = await open();
  await page.locator("#install").scrollIntoViewIfNeeded();
  check("install: Cephalo tab shows steps, hides SideEye box", (await page.locator("#install .steps").isVisible()) && !(await page.locator("#install .zone-sideeye.card").isVisible()));
  await page.click('#install-products [data-tab=sideeye]');
  check("install: SideEye tab shows 'not installable', hides steps", (await page.locator("#install .zone-sideeye.card").isVisible()) && !(await page.locator("#install .steps").isVisible()) && /nothing to uninstall/.test(await page.locator("#install .zone-sideeye.card").innerText()));
  await page.click('#install-products [data-tab=both]'); check("install: Both shows both", (await page.locator("#install .steps").isVisible()) && (await page.locator("#install .zone-sideeye.card").isVisible()));
  await page.focus('#install-products [data-tab=both]'); await page.keyboard.press("ArrowLeft"); check("install: arrow keys move between tabs", (await page.getAttribute('#install-products [data-tab=sideeye]', "aria-selected")) === "true");
  await page.click('#install-products [data-tab=cephalo]'); await page.click('#install-os [data-tab=sh]'); check("install: bash tab shows bash command", await page.locator('[data-os=sh]').isVisible() && !(await page.locator('[data-os=ps]').isVisible()));
  await page.reload(); await page.locator("#install").scrollIntoViewIfNeeded();
  check("install: tab choices persist (product and shell)", (await page.getAttribute('#install-products [data-tab=cephalo]', "aria-selected")) === "true" && (await page.getAttribute('#install-os [data-tab=sh]', "aria-selected")) === "true");
  await page.click('#install-products [data-tab=cephalo]'); await page.locator("#install .steps li").first().locator("input").check();
  check("install: step progress saved", /1 of 6/.test(await page.locator("#step-count").innerText()) && (await page.evaluate(() => localStorage.getItem("nmc.install"))).includes("node"));
  await ctx.close();
}
{ // bundle calculator
  const { ctx, page, errors } = await open();
  await page.locator("#bundle-calc").scrollIntoViewIfNeeded(); await page.waitForSelector("#bundle-calc .bc-stage:not([hidden])");
  const out = async () => (await page.locator(".bc-out").innerText()).replace(/\s+/g, " ");
  let o = await out(); check("calc: Pro x5 = $75 + $60, bundle $110, saves $25", /\$75/.test(o) && /\$60/.test(o) && /\$110/.test(o) && /\$25 \/ month/.test(o), o.slice(0, 150));
  await page.check("input[name=bc-plan][value=team]"); o = await out(); check("calc: Team has no SideEye price and says so", /Not set/.test(o) && /\$125/.test(o) && /No saving can be shown/.test(o));
  await page.check("input[name=bc-plan][value=pro]"); await page.check("#bc-code"); o = await out(); check("calc: CEPHALOG applies to the Cephalo row only", /With CEPHALOG: \$60/.test(o) && /\$110/.test(o));
  await page.fill("#bc-devs", "0"); check("calc: invalid count shows an error", /whole number/.test(await page.locator(".bc-err").innerText()));
  await page.fill("#bc-devs", "1"); o = await out(); check("calc: singular developer", /1 developer \/ month/i.test(o));
  check("pricing is labelled Planned and has no payment form", /Planned\. Prices may change\. Not on sale yet\./.test(await page.locator("#pricing").innerText()) && (await page.locator("#pricing form, input[autocomplete^=cc-], input[name*=card]").count()) === 0);
  check("no console errors (calc)", errors.length === 0, errors.join(" | ")); await ctx.close();
}
{ // autoplay + pause, off-screen
  const { ctx, page } = await open();
  await page.locator("#split-demo").scrollIntoViewIfNeeded(); await page.waitForSelector("#split-demo .sp-stage:not([hidden])");
  await page.click(".sp-play"); await page.waitForTimeout(3300);
  check("split autoplays, with a visible Pause button", (await page.locator(".sp-left li").count()) > 2 && (await page.locator(".sp-play").innerText()) === "Pause");
  await page.click(".sp-play"); const n = await page.locator(".sp-left li").count(); await page.waitForTimeout(2000);
  check("Pause stops it", n === (await page.locator(".sp-left li").count()));
  await page.evaluate(() => scrollTo(0, 0)); await page.click(".sp-reset");
  await ctx.close();
}
{ // facts toggle on the joint page, light theme
  const { ctx, page, errors } = await open({ colorScheme: "light" });
  await page.click("#toggle-facts"); const v = await page.evaluate(() => [...document.querySelectorAll(".mascot")].filter((e) => e.getBoundingClientRect().width > 0).length);
  check("Just the facts hides mascots on the joint site", v === 0, String(v)); await ctx.close();
}
await browser.close(); server.close(); console.log(fails ? `${fails} FAILED` : "all joint demo checks passed"); process.exit(fails ? 1 : 0);
