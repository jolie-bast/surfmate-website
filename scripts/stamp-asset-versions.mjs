/**
 * Adds a version to the legacy pages' own script and stylesheet URLs, so a
 * browser never runs a cached copy from before the latest deploy. GitHub Pages
 * lets these files be cached for hours, and Safari in particular kept serving
 * an old wizard script that did not know the personal partner links.
 *
 * Rewrites, in place under public/:
 *   - src="/js/x.js" and href="/css/x.css" in every .html file
 *   - relative imports (from "./x.js") in every file under js/
 *
 * Runs only in the GitHub Pages workflow; do not run it on a working tree you
 * want to commit. The version is the commit being deployed.
 *
 * Usage: node scripts/stamp-asset-versions.mjs [version]
 */
import fs from "node:fs";
import path from "node:path";

const publicDir = path.resolve(import.meta.dirname, "..", "public");
const version = (process.argv[2] || process.env.GITHUB_SHA || "").slice(0, 10);

if (!/^[A-Za-z0-9]+$/.test(version)) {
  console.error("stamp-asset-versions: pass a version or set GITHUB_SHA.");
  process.exit(1);
}

const HTML_ASSET_RE = /\b(src|href)="(\/(?:js|css)\/[^"?#]+\.(?:js|css))"/g;
const JS_IMPORT_RE = /(\bfrom\s*|\bimport\s*\(?\s*)(["'])(\.{1,2}\/[^"'?#]+\.js)\2/g;

function walk(dir, extension, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, extension, out);
    else if (entry.name.endsWith(extension)) out.push(full);
  }
  return out;
}

function rewrite(file, pattern, replacement) {
  const before = fs.readFileSync(file, "utf8");
  const after = before.replace(pattern, replacement);
  if (after === before) return 0;
  fs.writeFileSync(file, after);
  return 1;
}

let changed = 0;

for (const file of walk(publicDir, ".html")) {
  changed += rewrite(file, HTML_ASSET_RE, (_match, attr, url) => `${attr}="${url}?v=${version}"`);
}

for (const file of walk(path.join(publicDir, "js"), ".js")) {
  changed += rewrite(
    file,
    JS_IMPORT_RE,
    (_match, lead, quote, url) => `${lead}${quote}${url}?v=${version}${quote}`,
  );
}

console.log(`stamp-asset-versions: stamped ${changed} files with v=${version}.`);
