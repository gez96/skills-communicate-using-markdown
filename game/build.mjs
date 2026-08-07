// build.mjs — inline every js/*.js module into a single self-contained HTML file.
// Usage: node game/build.mjs  ->  writes game/dist/pixel-harvest.html
// The modular source under game/js/ stays canonical; this produces the one-file
// build used for the Artifact / easy sharing (works when opened directly).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const indexPath = resolve(here, "index.html");
let html = readFileSync(indexPath, "utf8");

// Replace each <script src="js/foo.js"></script> with the file's contents inlined.
html = html.replace(/<script src="(js\/[^"]+)"><\/script>/g, (_m, src) => {
  const code = readFileSync(resolve(here, src), "utf8");
  return "<script>\n" + code + "\n</script>";
});

const outDir = resolve(here, "dist");
mkdirSync(outDir, { recursive: true });
const outPath = resolve(outDir, "pixel-harvest.html");
writeFileSync(outPath, html, "utf8");

console.log("Built", outPath, "(" + html.length + " bytes)");
