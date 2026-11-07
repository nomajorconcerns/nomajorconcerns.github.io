// J2 "Which do I need?": four questions, a recommendation, a reason, a link. No email capture, nothing is sent anywhere.
const root = document.getElementById("chooser");
if (root) {
  const form = root.querySelector("form");
  const out = root.querySelector(".ch-result");
  const val = (n) => form.querySelector(`input[name=${n}]:checked`)?.value;
  const agents = () => [...form.querySelectorAll("input[name=agents]:checked")].map((i) => i.value);

  function decide() {
    const a = agents(), net = val("net"), known = val("known"), team = val("team");
    if (!a.length || !net || !known || !team) return null;
    const hooked = a.includes("claude") || a.includes("hermes");
    const unverified = a.includes("codexcursor");
    if (!hooked && !unverified) {
      return { pick: "SideEye", reason: "Cephalo has no hook for the agents you listed, and SideEye is designed to watch any agent. But SideEye is not installable yet.",
        today: "Nothing installable fits today. Watch SideEye on GitHub.", links: [["Watch SideEye on GitHub", "https://github.com/nomajorconcerns/sideeye"], ["What SideEye is", "https://nomajorconcerns.github.io/sideeye/"]] };
    }
    const watch = (net === "yes" ? 2 : net === "unsure" ? 1 : 0) + (a.length >= 2 ? 1 : 0) + (known === "no" ? 1 : 0);
    const both = watch >= 2;
    const caveat = !hooked && unverified ? " Cephalo's Codex and Cursor adapters are tested against the vendors' documented formats but not run inside the real apps." : "";
    const teamNote = team === "team" ? " For a team, Cephalo Team and SideEye Team are both Planned and not on sale yet." : "";
    if (both) {
      return { pick: "Both", reason: `Rules cover what you can name, and your setup (${net === "no" ? "several agents" : "agents with network access"}${known === "no" ? ", and commands you can't list in advance" : ""}) leaves things rules can't predict.${caveat}${teamNote}`,
        today: "Install Cephalo Free today ($0). SideEye is not installable yet, so it is Planned for you.", links: [["Install Cephalo", "#install"], ["How they fit together", "#fit"]] };
    }
    return { pick: "Cephalo", reason: `You know what you want blocked and your agents have little reach, which is what rules do well.${caveat}${teamNote}`,
      today: "Install Cephalo Free today ($0). SideEye adds little for you yet.", links: [["Install Cephalo", "#install"], ["Cephalo's own site", "https://nomajorconcerns.github.io/cephalo/"]] };
  }
  function render() {
    const r = decide();
    out.replaceChildren();
    if (!r) { out.append(Object.assign(document.createElement("p"), { className: "muted", textContent: "Answer all four questions to see a recommendation." })); return; }
    const h = document.createElement("p"); h.className = "ch-pick"; h.innerHTML = `Recommended: <strong></strong>`; h.querySelector("strong").textContent = r.pick;
    const p1 = document.createElement("p"); p1.textContent = r.reason;
    const p2 = document.createElement("p"); p2.innerHTML = "<strong>Free tier first:</strong> "; p2.append(document.createTextNode(r.today));
    const ul = document.createElement("div"); ul.className = "btn-row";
    r.links.forEach(([t, href], i) => { const a = document.createElement("a"); a.className = "btn" + (i === 0 ? " btn-primary" : ""); a.href = href; a.textContent = t; ul.append(a); });
    out.append(h, p1, p2, ul);
  }
  form.addEventListener("change", render);
  form.addEventListener("submit", (e) => e.preventDefault());
  form.addEventListener("reset", () => setTimeout(render));
  render();
}
