// J1 Layered defence: Agent -> Cephalo -> tool runs -> SideEye -> outcome.
// Cephalo verdicts use Cephalo's real published 0.1.1 rules. The SideEye layer is a SIMULATION of a feature the SideEye app has.
import { reducedMotion, onMotionChange, whenVisible, loadJSON, evalCephalo, evRow, el, GLYPH } from "./engine.js";
const root = document.getElementById("layers-demo");
if (root) init(root).catch((e) => { console.error(e); root.querySelector(".ly-error")?.removeAttribute("hidden"); });

async function init(root) {
  const [D, RULES] = await Promise.all([loadJSON(root.dataset.scenario), loadJSON(root.dataset.rules)]);
  const q = (s) => root.querySelector(s);
  const log = q(".ev-log"), live = q(".ly-live"), outcomeEl = q(".ly-outcome"), decide = q(".ly-decide");
  const send = q(".ly-send"), pause = q(".ly-pause"), next = q(".ly-next"), reset = q(".ly-reset");
  const contain = q(".ly-contain"), letRun = q(".ly-letrun");
  const cephOn = q("#ly-ceph"), sideOn = q("#ly-side");
  const boxes = { agent: q('[data-box=agent]'), cephalo: q('[data-box=cephalo]'), tool: q('[data-box=tool]'), sideeye: q('[data-box=sideeye]'), outcome: q('[data-box=outcome]') };
  const atk = q(".ly-attacks");
  let attack = D.attacks[0], queue = [], stepIdx = 0, running = false, playing = true, waiting = false, timer = null, visible = false, state = null;

  const groups = [...new Set(D.attacks.map((a) => a.group))];
  for (const g of groups) {
    const fs = el("div", { class: "ly-group" }, el("p", { class: "ly-glabel", text: g }));
    D.attacks.filter((a) => a.group === g).forEach((a, i) => {
      const id = `ly-a-${a.id}`;
      const input = el("input", { type: "radio", name: "ly-attack", id, value: a.id });
      if (a === D.attacks[0]) input.checked = true;
      input.addEventListener("change", () => { attack = a; clear(); });
      fs.append(el("label", { for: id, class: "radio" }, input, el("span", {}, el("strong", { text: a.title }), el("span", { class: "small muted", text: " " + a.blurb }))));
    });
    atk.append(fs);
  }

  const setBox = (name, text, active) => {
    for (const [k, b] of Object.entries(boxes)) b.dataset.active = String(k === name && active);
    if (name && boxes[name]) boxes[name].querySelector(".bx-state").textContent = text;
  };
  const resetBoxes = () => { const t = { agent: "waiting", cephalo: "waiting", tool: "waiting", sideeye: "waiting", outcome: "" }; for (const [k, b] of Object.entries(boxes)) { b.dataset.active = "false"; b.querySelector(".bx-state").textContent = t[k]; } };

  function build(st) {
    const ev = [];
    ev.push({ box: "agent", product: "Agent", verdict: `STEP ${stepIdx + 1}`, text: `${st.say}: ${st.call.command ?? st.call.path}`, kind: "agent", state: "asks" });
    let blocked = false;
    if (cephOn.checked) {
      const hit = evalCephalo(RULES, st.call);
      if (hit) { blocked = true; ev.push({ box: "cephalo", product: "Cephalo", verdict: "BLOCK", text: `rule ${hit.id}: ${hit.description}`, kind: "block", state: "BLOCK", live: true }); }
      else ev.push({ box: "cephalo", product: "Cephalo", verdict: "ALLOW", text: "no rule matched", kind: "allow", state: "ALLOW" });
    } else ev.push({ box: "cephalo", product: "Cephalo", verdict: "OFF", text: "this layer is switched off", kind: "off", state: "off" });
    if (!blocked) ev.push({ box: "tool", product: "Tool", verdict: "RAN", text: "the call ran", kind: "ran", state: "ran", harm: st.harm });
    else ev.push({ box: "tool", product: "Tool", verdict: "SKIPPED", text: "the call never ran", kind: "off", state: "skipped", skipped: st.harm });
    if (sideOn.checked) {
      const s = blocked ? st.side?.blocked : st.side?.ran;
      if (s && s.flag && s.score >= D.flagAt) ev.push({ box: "sideeye", product: "SideEye", verdict: "FLAGGED", text: `deviation ${s.score.toFixed(2)}. ${s.text}`, kind: "flagged", state: "FLAGGED", live: true, decision: true });
      else if (s) ev.push({ box: "sideeye", product: "SideEye", verdict: "WATCHING", text: `deviation ${s.score.toFixed(2)}, below ${D.flagAt.toFixed(2)}. ${s.text}`, kind: "watching", state: "normal" });
      else ev.push({ box: "sideeye", product: "SideEye", verdict: "WATCHING", text: "nothing to flag: the call never ran", kind: "watching", state: "normal" });
    } else ev.push({ box: "sideeye", product: "SideEye", verdict: "OFF", text: "this layer is switched off", kind: "off", state: "off" });
    return ev;
  }

  function begin() {
    clear(true); running = true; state = { ran: [], skipped: [], blocked: false, flagged: false, contained: false };
    stepIdx = 0; queue = build(attack.steps[0]); [cephOn, sideOn].forEach((c) => (c.disabled = true));
    send.disabled = true; syncRun();
  }
  function show() {
    if (waiting || !running) return false;
    if (!queue.length) {
      stepIdx++;
      if (stepIdx < attack.steps.length && !state.contained) { queue = build(attack.steps[stepIdx]); }
      else { finish(); return false; }
    }
    const e = queue.shift();
    log.append(evRow(e.product, e.verdict, e.text, e.kind));
    setBox(e.box, e.state, true);
    if (e.harm) state.ran.push(e.harm);
    if (e.skipped) { state.skipped.push(e.skipped); state.blocked = true; }
    if (e.live) live.textContent = `${e.product}: ${e.verdict}. ${e.text}`;
    if (e.decision) { state.flagged = true; waiting = true; decide.hidden = false; contain.focus(); syncRun(); }
    return true;
  }
  function answer(doContain) {
    decide.hidden = true; waiting = false;
    if (doContain) {
      state.contained = true; queue = [];
      log.append(evRow("SideEye", "CONTAINED", "the agent is quarantined (simulated; the app does this through a Cephalo change that is not released)", "contained"));
      setBox("sideeye", "CONTAINED", true); live.textContent = "SideEye: CONTAINED.";
      // anything left in the script did not happen
      for (let k = stepIdx + 1; k < attack.steps.length; k++) state.skipped.push(attack.steps[k].harm);
    } else log.append(evRow("SideEye", "WATCHING", "you let it run: the agent carries on", "watching"));
    syncRun();
    if (doContain) finish(); else if (!reducedMotion()) loop();
  }
  function finish() {
    running = false; waiting = false; stop(); decide.hidden = true;
    const anyLayer = cephOn.checked || sideOn.checked, ran = state.ran, prevented = state.skipped;
    let status, glyph, text;
    if (!anyLayer) { status = "UNPROTECTED"; glyph = GLYPH.flagged; text = `Both layers were off. Everything got through: ${ran.join("; ")}.`; }
    else if (!ran.length) { status = "STOPPED"; glyph = GLYPH.contained; text = `Nothing got through.${prevented.length ? " Prevented: " + prevented.join("; ") + "." : ""}`; }
    else if (!state.blocked && !state.flagged) { status = "NOT COVERED"; glyph = GLYPH.flagged; text = `Neither layer that was on noticed it. Got through: ${ran.join("; ")}.`; }
    else { status = "PARTLY STOPPED"; glyph = GLYPH.flagged; text = `Got through: ${ran.join("; ")}.${prevented.length ? " Prevented: " + prevented.join("; ") + "." : ""} Detection acts after the call it flags; containing does not undo a call that already ran.`; }
    outcomeEl.hidden = false; outcomeEl.replaceChildren();
    outcomeEl.append(el("p", { class: "mark-line", html: `${glyph}<strong>${status}</strong>` }), el("p", { text }));
    setBox("outcome", status.toLowerCase(), true);
    send.disabled = false; [cephOn, sideOn].forEach((c) => (c.disabled = false)); syncRun();
  }
  function clear(keep) {
    stop(); log.replaceChildren(); outcomeEl.hidden = true; decide.hidden = true; waiting = false; running = false; queue = []; live.textContent = "";
    resetBoxes(); if (!keep) { send.disabled = false; [cephOn, sideOn].forEach((c) => (c.disabled = false)); syncRun(); }
  }
  function stop() { clearTimeout(timer); timer = null; }
  function loop() { stop(); if (!running || waiting || !playing || reducedMotion() || !visible) return; timer = setTimeout(() => { if (show()) loop(); }, 850); }
  function syncRun() {
    const rm = reducedMotion();
    pause.hidden = rm || !running; next.hidden = !rm || !running;
    pause.textContent = playing ? "Pause" : "Resume"; pause.setAttribute("aria-pressed", String(!playing));
    if (!rm) loop(); else stop();
  }
  send.addEventListener("click", () => { begin(); if (reducedMotion()) show(); });
  next.addEventListener("click", () => show());
  pause.addEventListener("click", () => { playing = !playing; syncRun(); });
  reset.addEventListener("click", () => { clear(); });
  contain.addEventListener("click", () => answer(true));
  letRun.addEventListener("click", () => answer(false));
  onMotionChange(syncRun);
  whenVisible(root, () => { visible = true; loop(); }, () => { visible = false; stop(); });
  q(".ly-loading")?.remove(); q(".ly-stage").hidden = false; resetBoxes(); syncRun();
}
