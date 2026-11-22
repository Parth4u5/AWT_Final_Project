/**
 * Workspace manifest contract check: every @jsflow/* import in an app's source
 * must be declared in that app's manifest. Prevents resolution that only works
 * through Vite/TS path aliases from silently breaking on publish or audit.
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));

function sourceFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      out.push(...sourceFiles(path));
    } else if (/\.tsx?$/.test(entry)) {
      out.push(path);
    }
  }
  return out;
}

for (const app of ["apps/web", "apps/api"]) {
  const base = join(root, app);
  const pkg = JSON.parse(readFileSync(join(base, "package.json"), "utf8"));
  const declared = new Set([
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.devDependencies ?? {}),
  ]);
  const imports = new Set();
  for (const file of sourceFiles(join(base, "src"))) {
    const text = readFileSync(file, "utf8");
    for (const match of text.matchAll(/from\s+["'](@jsflow\/[a-z-]+)["']/g)) {
      imports.add(match[1]);
    }
  }
  for (const name of imports) {
    assert.ok(
      declared.has(name),
      `${app} imports ${name} but does not declare it in package.json`,
    );
  }
}

console.log("PASS: every workspace import is declared in its app manifest.");
