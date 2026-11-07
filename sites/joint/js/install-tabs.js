// J3 Install both: product tabs (Cephalo only / SideEye only / Both) and OS tabs (PowerShell / bash-zsh), with the choice remembered.
// Step ticks are handled by the shared ui.js (saved in localStorage); this file only switches what is shown.
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* ignore */ } },
};
function tabs(root, key, apply) {
  const list = root.querySelector('[role=tablist]');
  if (!list) return;
  const btns = [...list.querySelectorAll('[role=tab]')];
  const select = (id, focus) => {
    btns.forEach((b) => { const on = b.dataset.tab === id; b.setAttribute("aria-selected", String(on)); b.tabIndex = on ? 0 : -1; if (on && focus) b.focus(); });
    apply(id); store.set(key, id);
  };
  btns.forEach((b, i) => {
    b.addEventListener("click", () => select(b.dataset.tab));
    b.addEventListener("keydown", (e) => {
      const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (k) { e.preventDefault(); select(btns[(i + k + btns.length) % btns.length].dataset.tab, true); }
      if (e.key === "Home") { e.preventDefault(); select(btns[0].dataset.tab, true); }
      if (e.key === "End") { e.preventDefault(); select(btns[btns.length - 1].dataset.tab, true); }
    });
  });
  const saved = store.get(key);
  select(btns.some((b) => b.dataset.tab === saved) ? saved : btns[0].dataset.tab);
}
const prod = document.getElementById("install-products");
if (prod) tabs(prod, "nmc.install.product", (id) => {
  document.querySelectorAll("[data-show]").forEach((n) => { n.hidden = !n.dataset.show.split(" ").includes(id); });
});
const os = document.getElementById("install-os");
if (os) tabs(os, "nmc.install.os", (id) => {
  document.querySelectorAll("[data-os]").forEach((n) => { n.hidden = n.dataset.os !== id; });
});
