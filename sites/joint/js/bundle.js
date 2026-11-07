// J4 Bundle price calculator. Pure arithmetic on PLANNED prices (data/prices.json). No checkout, nothing is sent.
import { loadJSON } from "./engine.js";
const root = document.getElementById("bundle-calc");
if (root) loadJSON(root.dataset.prices).then(init).catch((e) => { console.error(e); root.querySelector(".bc-error")?.removeAttribute("hidden"); });

function init(P) {
  const devs = root.querySelector("#bc-devs"), code = root.querySelector("#bc-code"), out = root.querySelector(".bc-out");
  const plan = () => root.querySelector("input[name=bc-plan]:checked").value;
  const usd = (n) => `$${n.toLocaleString("en-US", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
  const row = (label, per, total, note) => `<tr><th scope="row">${label}</th><td>${per === null ? "Not set" : usd(per)}</td><td>${total === null ? "Not set" : usd(total)}</td><td>${note}</td></tr>`;

  function render() {
    let n = Math.floor(Number(devs.value)); const bad = !Number.isFinite(n) || n < 1 || n > 1000;
    root.querySelector(".bc-err").textContent = bad ? "Enter a whole number of developers from 1 to 1000." : "";
    if (bad) { out.innerHTML = ""; return; }
    const pl = plan(), c = P.cephalo[pl], s = P.sideeye[pl], b = P.bundle[pl];
    const cTotal = c * n, sTotal = s === null ? null : s * n, bTotal = b === null ? null : b * n;
    const discount = code.checked && c > 0;
    let rows = row("Cephalo only", c, cTotal, discount ? `With CEPHALOG: ${usd(cTotal * 0.8)} / month for the first year, as Cephalo's site describes it` : "Price from Cephalo's site");
    rows += row("SideEye only", s, sTotal, s === null ? "Price not set" : "Planned, about");
    rows += row("Cephalo + SideEye bundle", b, bTotal, b === null ? "Price not set" : "Planned, about");
    let saving = "";
    if (s !== null && b !== null && cTotal + sTotal > bTotal) {
      const d = cTotal + sTotal - bTotal; saving = `<p><strong>Bundle saving:</strong> ${usd(d)} / month (${Math.round((d / (cTotal + sTotal)) * 100)}%) against buying both separately, at these Planned prices.</p>`;
    } else if (s === null) saving = "<p class=\"muted\">No saving can be shown: this plan has no SideEye price yet.</p>";
    else if (b === 0) saving = "<p class=\"muted\">Both are free at this plan.</p>";
    out.innerHTML = `<div class="tbl-wrap" tabindex="0" role="region" aria-label="Calculated monthly cost, scrolls sideways on small screens"><table class="tbl"><thead><tr><th scope="col">Option</th><th scope="col">Per developer / month</th><th scope="col">${n} developer${n === 1 ? "" : "s"} / month</th><th scope="col">Note</th></tr></thead><tbody>${rows}</tbody></table></div>${saving}`;
  }
  root.addEventListener("input", render); root.addEventListener("change", render);
  root.querySelector(".bc-stage").hidden = false; root.querySelector(".bc-loading")?.remove(); render();
}
