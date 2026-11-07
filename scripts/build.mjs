// Builds dist/joint and dist/sideeye from sites/* + shared/*. No framework: string templates and file copies.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { tokensCss } from "./palette.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (...p) => fs.readFileSync(path.join(root, ...p), "utf8");
const exists = (...p) => fs.existsSync(path.join(root, ...p));
const mkdir = (p) => fs.mkdirSync(p, { recursive: true });

const chInner = read("shared/partials/chameleon-inner.svg").trim();
// Inline version: every part gets an id (#eye, #pupil, #crest, #body, #tail, #branch...). Sprite version: classes only (ids must be unique per page).
const chWithIds = chInner.replace(/data-part="([a-z]+)"/g, 'id="$1" data-part="$1"');
const chPlain = chInner;
const octo = read("shared/partials/octo-symbol.svg").trim();

const sprite = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>${octo}<symbol id="ch-art" viewBox="0 0 300 230">${chPlain}</symbol></defs></svg>`;

const stateInfo = {
  learning: "Learning", normal: "Normal", flagged: "Flagged", contained: "Contained",
};
const chInline = (state = "normal", label) =>
  `<svg class="ch mascot" id="chameleon" data-state="${state}" viewBox="0 0 300 230" role="img" aria-label="${label || `SideEye chameleon on a branch, looking sideways. State: ${stateInfo[state]}`}">${chWithIds}</svg>`;
const chUse = (state = "normal") => `<svg class="ch mascot" data-state="${state}" viewBox="0 0 300 230" aria-hidden="true" focusable="false"><use href="#ch-art"/></svg>`;

// The scene: chameleon on its branch above the water, Cephalo's octopus below. Both deadpan.
const scene = (state = "normal") => `<svg class="scene mascot ch" data-state="${state}" viewBox="0 0 640 480" role="img" aria-label="Illustration: a chameleon on a branch above the water, giving the side-eye. Below the surface, an octopus looks back at it. Both have flat expressions.">
<g transform="translate(150 6) scale(1.62)"><use href="#ch-art" width="300" height="230"/></g>
<rect class="water" x="0" y="326" width="640" height="154" rx="12"/>
<path class="wave" d="M10 328 q20 -9 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0"/>
<use href="#octo" x="372" y="334" width="168" height="126"/>
</svg>`;

function render(tpl, site, cfg, file) {
  let out = tpl;
  // conditionals
  out = out.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, k, body) => (cfg[k] ? body : ""));
  out = out.replace(/\{\{#unless (\w+)\}\}([\s\S]*?)\{\{\/unless\}\}/g, (_, k, body) => (cfg[k] ? "" : body));
  // includes (site-local first, then shared)
  out = out.replace(/\{\{include:([\w-]+)\}\}/g, (_, n) => {
    const local = `sites/${site}/partials/${n}.html`, shared = `shared/partials/${n}.html`;
    return render(exists(local) ? read(local) : read(shared), site, cfg, file);
  });
  out = out.replace(/<div class="code">/g, '<div class="code" tabindex="0" role="group" aria-label="Command">');
  out = out.replace(/\{\{sprite\}\}/g, sprite);
  out = out.replace(/\{\{chameleon:inline:(\w+)\}\}/g, (_, s) => chInline(s));
  out = out.replace(/\{\{chameleon:use:(\w+)\}\}/g, (_, s) => chUse(s));
  out = out.replace(/\{\{scene:(\w+)\}\}/g, (_, s) => scene(s));
  out = out.replace(/\{\{cfg:(\w+)\}\}/g, (_, k) => String(cfg[k] ?? ""));
  const left = out.match(/\{\{[^}]+\}\}/g);
  if (left) throw new Error(`${site}/${file}: unresolved template tags ${[...new Set(left)].join(", ")}`);
  return out;
}

function copyDir(src, dst) {
  mkdir(dst);
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) copyDir(s, d); else fs.copyFileSync(s, d);
  }
}

const only = process.argv[2];
for (const site of ["joint", "sideeye"].filter((x) => !only || x === only)) {
  const cfg = JSON.parse(read(`sites/${site}/site.config.json`));
  const out = path.join(root, "dist", site);
  mkdir(out);
  // CSS: tokens + components in one file, no minifier needed at this size
  mkdir(path.join(out, "css"));
  fs.writeFileSync(path.join(out, "css/site.css"), tokensCss() + read("shared/css/components.css") + read("shared/css/demo.css") + (exists(`sites/${site}/site.css`) ? read(`sites/${site}/site.css`) : ""));
  copyDir(path.join(root, "shared/js"), path.join(out, "js"));
  if (exists(`sites/${site}/js`)) copyDir(path.join(root, "sites", site, "js"), path.join(out, "js"));
  if (exists(`sites/${site}/data`)) copyDir(path.join(root, "sites", site, "data"), path.join(out, "data"));
  copyDir(path.join(root, "shared/fonts"), path.join(out, "fonts"));
  // pages
  for (const f of fs.readdirSync(path.join(root, "sites", site))) {
    if (!/\.(html|md|txt|json)$/.test(f) || f === "site.config.json") continue;
    const html = render(read("sites", site, f), site, cfg, f);
    if (f.startsWith("_")) { mkdir(path.join(root, "dist", "_og")); fs.writeFileSync(path.join(root, "dist", "_og", `${site}.html`), html); continue; } // helper pages are never deployed
    fs.writeFileSync(path.join(out, f), html);
  }
  // static assets owned by the site (favicons, og image) live in sites/<site>/static
  if (exists(`sites/${site}/static`)) copyDir(path.join(root, "sites", site, "static"), out);
  fs.writeFileSync(path.join(out, ".nojekyll"), "");
  console.log(`built dist/${site}: ${fs.readdirSync(out).length} entries`);
}
