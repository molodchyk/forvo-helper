import { readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const ignored = new Set(["node_modules", "dist", ".git"]);
const failures = [];

await auditDirectory(".");

if (failures.length > 0) {
  console.error("Folder-density audit failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Folder-density audit passed.");

async function auditDirectory(relativePath) {
  const entries = await readdir(path.join(root, relativePath), { withFileTypes: true });
  const visibleEntries = entries.filter((entry) => !ignored.has(entry.name));
  const files = visibleEntries.filter((entry) => entry.isFile());
  const normalized = relativePath.replace(/\\/g, "/");
  const limit = normalized === "." ? 12 : 15;

  if (files.length > limit) {
    failures.push(`${normalized} has ${files.length} direct files; limit is ${limit}.`);
  }

  for (const entry of visibleEntries) {
    if (entry.isDirectory()) {
      await auditDirectory(path.join(relativePath, entry.name));
    }
  }
}

