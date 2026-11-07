// Verifies every Cephalo verdict the sites show against Cephalo's real published 0.1.1 rules (shared/data/cephalo-rules-0.1.1.json).
import fs from "node:fs";
const RULES = JSON.parse(fs.readFileSync("shared/data/cephalo-rules-0.1.1.json", "utf8"));
const L = JSON.parse(fs.readFileSync("sites/joint/data/scenarios/layers.json", "utf8"));
const SP = JSON.parse(fs.readFileSync("shared/data/scenarios/split.json", "utf8"));
const evalC = (call) => { for (const r of RULES) { const re = new RegExp(r.pattern, "i");
  if (r.type === "command" && call.command !== undefined && re.test(call.command)) return r.id;
  if (r.type === "path" && call.path !== undefined) { const on = r.on ?? "any", a = call.access ?? "read"; if ((on === "any" || on === a) && re.test(call.path)) return r.id; } } return null; };
let fails = 0; const t = (n, got, want) => { const ok = got === want; if (!ok) fails++; console.log(`${ok ? "pass" : "FAIL"}  ${n}: ${got}${ok ? "" : " (wanted " + want + ")"}`); };
const IDS = ["no-drop","no-truncate","no-delete-all","no-rm-rf","no-win-recursive-delete","no-force-push","no-force-push-refspec","no-pipe-to-shell","no-hard-reset","no-secret-read","no-secret-file","protect-config"];
t("12 built-in rules, exactly these", JSON.stringify(RULES.map((r) => r.id)), JSON.stringify(IDS));
const a = Object.fromEntries(L.attacks.map((x) => [x.id, x]));
t("push: force push blocked", evalC(a.push.steps[0].call), "no-force-push");
t("envread: file-tool read of ./config/.env blocked", evalC(a.envread.steps[0].call), "no-secret-file");
t("upload: no rule matches", evalC(a.upload.steps[0].call), null);
t("variant step 1 blocked", evalC(a.variant.steps[0].call), "no-secret-read");
t("variant step 2 (archive) not matched", evalC(a.variant.steps[1].call), null);
t("variant step 3 (post) not matched", evalC(a.variant.steps[2].call), null);
t("script: not matched", evalC(a.script.steps[0].call), null);
SP.steps.forEach((s, i) => t(`split step ${i + 1}`, evalC(s.call), i === 0 ? "no-secret-read" : null));
t("table: DROP TABLE blocked", evalC({ command: 'psql -c "DROP TABLE users;"' }), "no-drop");
t("table: --force-with-lease allowed", evalC({ command: "git push --force-with-lease origin main" }), null);
t("table: .env.example allowed (shell)", evalC({ command: "cat .env.example" }), null);
t("table: .env.example allowed (file tool)", evalC({ path: "./config/.env.example", access: "read" }), null);
t("table: cp of .env not matched", evalC({ command: "cp .env /tmp/x" }), null);
t("table: tar of .env not matched", evalC({ command: "tar czf out.zip .env" }), null);
t("table: shell read via Get-Content blocked", evalC({ command: "Get-Content .env" }), "no-secret-read");
for (const x of L.attacks) for (const s of x.steps) for (const k of ["ran", "blocked"]) { const f = s.side?.[k]; if (f) t(`${x.id}/${k}: flag iff score >= ${L.flagAt}`, !!f.flag, f.score >= L.flagAt); }
console.log(fails ? `${fails} FAILED` : "all Cephalo claims match the real rules"); process.exit(fails ? 1 : 0);
