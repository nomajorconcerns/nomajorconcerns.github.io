import { zones, textPairs, extraPairs } from "./palette.mjs";
const lum = (h) => { const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
let fail = 0;
for (const [zone, themes] of Object.entries(zones)) {
  for (const [theme, t] of Object.entries(themes)) {
    for (const [f, b] of [...textPairs, ...(extraPairs[zone] ?? [])]) {
      if (!t[f] || !t[b]) continue;
      const r = ratio(t[f], t[b]);
      const ok = r >= 4.5;
      if (!ok) fail++;
      if (!ok || process.argv.includes("-v")) console.log(`${ok ? "pass" : "FAIL"}  ${zone.padEnd(8)} ${theme.padEnd(5)} ${f.padEnd(11)} on ${b.padEnd(8)} ${r.toFixed(2)}`);
    }
  }
}
console.log(fail ? `${fail} text pairs below 4.5:1` : "all text pairs pass WCAG AA (4.5:1) in both themes");
process.exit(fail ? 1 : 0);
