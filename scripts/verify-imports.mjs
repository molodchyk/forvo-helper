import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const failures = [];

for (const file of await collectFiles("src")) {
  if (file.endsWith(".js")) {
    const source = await readFile(path.join(root, file), "utf8");
    verifyJsImports(file, source);
  }

  if (file.endsWith(".css")) {
    const source = await readFile(path.join(root, file), "utf8");
    verifyCssImports(file, source);
  }

  if (file.endsWith(".html")) {
    const source = await readFile(path.join(root, file), "utf8");
    verifyHtmlRefs(file, source);
  }
}

if (failures.length > 0) {
  console.error("Import verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Import verification passed.");

function verifyJsImports(file, source) {
  const pattern = /import\s+(?:[^'"]+\s+from\s+)?["']([^"']+)["']/g;
  for (const match of source.matchAll(pattern)) {
    assertRelativeExists(file, match[1]);
  }
}

function verifyCssImports(file, source) {
  const pattern = /@import\s+["']([^"']+)["']/g;
  for (const match of source.matchAll(pattern)) {
    assertRelativeExists(file, match[1]);
  }
}

function verifyHtmlRefs(file, source) {
  const pattern = /<(?:script|link|img)\b[^>]+(?:src|href)=["']([^"']+)["']/gi;
  for (const match of source.matchAll(pattern)) {
    assertRelativeExists(file, match[1]);
  }
}

function assertRelativeExists(file, reference) {
  if (!reference.startsWith(".")) return;
  const target = path.normalize(path.join(path.dirname(file), reference));
  if (!existsSync(path.join(root, target))) {
    failures.push(`${file} references missing file ${reference}.`);
  }
}

async function collectFiles(relativePath) {
  const entries = await readdir(path.join(root, relativePath), { withFileTypes: true });
  const nested = [];
  for (const entry of entries) {
    const child = path.join(relativePath, entry.name);
    if (entry.isDirectory()) nested.push(...await collectFiles(child));
    if (entry.isFile()) nested.push(child.replace(/\\/g, "/"));
  }
  return nested;
}

