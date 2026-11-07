// Drives the SideEye demos in a real browser. Exits non-zero on any failed check.
import { chromium } from "playwright-core";
import { start } from "./serve.mjs";
const server = await start(4173);
const browser = await chromium.launch({ channel: "msedge" });
let fails = 0;
const check = (name, ok, extra = "") => { console.log(`${ok ? "pass" : "FAIL"}  ${name}${extra ? "  " + extra : ""}`); if (!ok) fails++; };
const URL = "http://127.0.0.1:4173/sideeye/";

async function open(opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, ...opts });
  const page = await ctx.newPage();
  const errors = []; page.on("console", (m) => m.type() === "error" && errors.push(m.text())); page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(URL); await page.evaluate(() => document.fonts.ready);
  await page.locator("#playground").scrollIntoViewIfNeeded();
  await page.waitForSelector("#playground .pg-stage:not([hidden])");
  return { ctx, page, errors };
}

{ // normal motion
  const { ctx, page, errors } = await open();
  const rows0 = await page.locator("#playground .lane").first().locator("li").count();
  await page.waitForTimeout(3500);
  const rows1 = await page.locator("#playground .lane").first().locator("li").count();
  check("feed streams on its own", rows1 >= rows0 && (await page.locator("#playground .feed li").count()) > 0);
  check("all lanes start inside their normal band", (await page.locator("#playground .meter[data-inside=true]").count()) === 3);
  // Pause stops it
  await page.click(".pg-pause");
  const t1 = await page.locator("#playground .feed").first().innerText(); await page.waitForTimeout(2200);
  check("Pause feed stops the stream", t1 === (await page.locator("#playground .feed").first().innerText()));
  await page.click(".pg-pause");
  // credentials on claude-code -> flagged, focus on Contain, reason text, chameleon state
  await page.getByRole("button", { name: "Read ~/.aws/credentials" }).click();
  const lane = page.locator("#playground .lane").first();
  check("lane flagged", (await lane.getAttribute("data-state")) === "flagged");
  const reason = await lane.locator("li[data-kind=flagged] .why").innerText();
  check("plain-English reason", /has never read credential files in 212 events/.test(reason), reason);
  check("chameleon FLAGGED", (await page.locator(".pg-mascot").getAttribute("data-state")) === "flagged" && /FLAGGED/.test(await page.locator(".pg-state").innerText()));
  check("focus moved to Contain", await page.evaluate(() => document.activeElement?.textContent === "Contain claude-code"));
  check("live region announces flag only", /FLAGGED: claude-code/.test(await page.locator("#playground [aria-live=polite]").innerText()));
  // keyboard activation of Contain
  await page.keyboard.press("Enter");
  check("Contain pauses the lane", (await lane.getAttribute("data-state")) === "contained" && (await page.locator(".pg-mascot").getAttribute("data-state")) === "contained");
  const frozen = await lane.locator(".feed").innerText(); await page.waitForTimeout(2500);
  check("contained lane stops streaming", frozen === (await lane.locator(".feed").innerText()));
  await page.click(".pg-reset");
  check("Reset restores", (await lane.getAttribute("data-state")) === "normal" && (await page.locator(".pg-mascot").getAttribute("data-state")) === "normal");
  // baseline-aware: hermes writing outside the project folder is normal for it
  await page.check("#pg-agent-hermes");
  await page.getByRole("button", { name: "Write outside the project folder" }).click();
  check("hermes outside-folder write NOT flagged (normal for it)", (await page.locator("#playground .lane").nth(2).getAttribute("data-state")) === "normal" && (await page.locator("#playground li[data-kind=ok]").count()) === 1);
  await page.getByRole("button", { name: "Install a new MCP server" }).click();
  check("hermes MCP install flagged as rare", (await page.locator("#playground .lane").nth(2).getAttribute("data-state")) === "flagged" && /only 4 times in 305/.test(await page.locator("#playground li[data-kind=flagged] .why").innerText()));
  // determinism: same seed -> same first rows after reset
  await page.click(".pg-reset"); const a = await page.locator("#playground .feed").first().innerText();
  await page.click(".pg-reset"); const b = await page.locator("#playground .feed").first().innerText();
  check("seeded: reset gives identical rows", a === b);

  // baseline demo
  await page.locator("#baseline-demo").scrollIntoViewIfNeeded();
  const setDays = (d) => page.evaluate((d) => { const s = document.querySelector("#bl-days"); s.value = d; s.dispatchEvent(new Event("input", { bubbles: true })); }, d);
  const stateTxt = () => page.locator(".bl-state").innerText();
  await setDays(2); check("day 2: LEARNING", /LEARNING/.test(await stateTxt()), await stateTxt());
  await setDays(8); check("day 8: past learning, event unremarkable", !/FLAGGED|LEARNING/.test(await stateTxt()) && /unremarkable/.test(await page.locator(".bl-verdict").innerText()));
  await setDays(25); check("day 25: FLAGGED", /FLAGGED/.test(await stateTxt()), await stateTxt());
  await page.check("input[value=refactor]"); check("refactor is flagged and called a false positive", /false positive/.test(await page.locator(".bl-verdict").innerText()));
  check("no console errors", errors.length === 0, errors.join(" | "));
  await ctx.close();
}
{ // reduced motion: no autoplay, Next step button
  const { ctx, page, errors } = await open({ reducedMotion: "reduce" });
  const before = await page.locator("#playground .feed").first().innerText(); await page.waitForTimeout(2500);
  check("reduced motion: no autoplay", before === (await page.locator("#playground .feed").first().innerText()));
  check("reduced motion: Next step shown, Pause hidden", (await page.locator(".pg-next").isVisible()) && !(await page.locator(".pg-pause").isVisible()));
  await page.click(".pg-next"); check("Next step advances", before !== (await page.locator("#playground .feed").first().innerText()));
  check("no console errors (reduced)", errors.length === 0, errors.join(" | "));
  await ctx.close();
}
{ // demos do not run while off screen
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } }); const page = await ctx.newPage();
  await page.goto(URL); await page.waitForSelector("#playground .pg-stage:not([hidden])", { state: "attached" });
  const a = await page.locator("#playground .feed").first().innerText(); await page.waitForTimeout(3000);
  check("off-screen demo does not run", a === (await page.locator("#playground .feed").first().innerText()));
  await ctx.close();
}
await browser.close(); server.close();
console.log(fails ? `${fails} FAILED` : "all demo checks passed"); process.exit(fails ? 1 : 0);
