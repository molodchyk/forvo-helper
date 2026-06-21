import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const failures = [];
const warnings = [];
const ignored = new Set(["node_modules", "dist", ".git"]);

const files = await collectFiles(".");

for (const file of files) {
  const normalized = file.replace(/\\/g, "/");
  const ext = path.extname(file);

  if (![".js", ".mjs", ".css", ".html"].includes(ext)) continue;

  const lineCount = (await readFile(path.join(root, file), "utf8")).split(/\r?\n/).length;
  const budget = budgetFor(normalized);

  if (lineCount > budget.hard) {
    failures.push(`${normalized} has ${lineCount} lines; hard limit is ${budget.hard}.`);
  } else if (lineCount > budget.soft) {
    warnings.push(`${normalized} has ${lineCount} lines; soft target is ${budget.soft}.`);
  }
}

for (const warning of warnings) {
  console.warn(`Warning: ${warning}`);
}

if (failures.length > 0) {
  console.error("File-size audit failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("File-size audit passed.");

function budgetFor(file) {
  if (/^src\/app\/.+\/index\.js$/.test(file)) return { soft: 120, hard: 150 };
  if (file.endsWith(".css")) return { soft: 350, hard: 500 };
  if (file.endsWith(".test.js")) return { soft: 350, hard: 500 };
  if (file.startsWith("scripts/")) return { soft: 450, hard: 600 };
  return { soft: 450, hard: 600 };
}

async function collectFiles(relativePath) {
  const entries = await readdir(path.join(root, relativePath), { withFileTypes: true });
  const nested = [];

  for (const entry of entries) {
    if (ignored.has(entry.name)) continue;
    const child = path.join(relativePath, entry.name);
    if (entry.isDirectory()) nested.push(...await collectFiles(child));
    if (entry.isFile()) nested.push(child);
  }

  return nested;
}

