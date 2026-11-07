// Tiny static server that mirrors the real URLs: / -> dist/joint, /sideeye/ -> dist/sideeye. Logs every request host for the "no third-party requests" check.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "dist");
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".png": "image/png", ".woff2": "font/woff2", ".md": "text/markdown; charset=utf-8", ".json": "application/json", ".txt": "text/plain" };

export function start(port = 4173) {
  const server = http.createServer((req, res) => {
    let url = decodeURIComponent((req.url || "/").split("?")[0]);
    let site = "joint";
    if (url === "/sideeye" ) { res.writeHead(301, { location: "/sideeye/" }); return res.end(); }
    if (url.startsWith("/sideeye/")) { site = "sideeye"; url = url.slice("/sideeye".length); }
    if (url.endsWith("/")) url += "index.html";
    const file = path.join(root, site, url);
    if (!file.startsWith(path.join(root, site))) { res.writeHead(403); return res.end(); }
    fs.readFile(file, (err, data) => {
      if (err) { // GitHub Pages serves 404.html for anything missing
        const nf = path.join(root, site, "404.html");
        if (fs.existsSync(nf)) { res.writeHead(404, { "content-type": types[".html"] }); return res.end(fs.readFileSync(nf)); }
        res.writeHead(404); return res.end("not found");
      }
      res.writeHead(200, { "content-type": types[path.extname(file)] || "application/octet-stream" });
      res.end(data);
    });
  });
  return new Promise((resolve) => server.listen(port, "127.0.0.1", () => resolve(server)));
}
if (process.argv[1] && process.argv[1].endsWith("serve.mjs")) { await start(Number(process.argv[2]) || 4173); console.log("serving dist on http://127.0.0.1:4173 (/ = joint, /sideeye/ = sideeye)"); }
