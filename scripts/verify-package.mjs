import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const distRoot = path.join(root, "dist", "chrome");
const manifest = JSON.parse(await readFile(path.join(distRoot, "manifest.json"), "utf8"));
const failures = [];

for (const file of [
  "assets/icon-16.png",
  "assets/icon-32.png",
  "assets/icon-48.png",
  "assets/icon-128.png",
  "store-listing/chrome-web-store/media/icon-128.png",
  "store-listing/chrome-web-store/media/promo/small-promo.png",
  "store-listing/chrome-web-store/media/promo/marquee-promo.png",
  "store-listing/chrome-web-store/media/screenshots/01-forvo-workflow.png",
  "store-listing/chrome-web-store/media/screenshots/02-options.png",
  "store-listing/chrome-web-store/media/screenshots/03-popup.png"
]) {
  assertExists(file);
}

await assertPngSize("assets/icon-128.png", 128, 128);
await assertPngSize("store-listing/chrome-web-store/media/promo/small-promo.png", 440, 280);
await assertPngSize("store-listing/chrome-web-store/media/promo/marquee-promo.png", 1400, 560);
await assertPngSize("store-listing/chrome-web-store/media/screenshots/01-forvo-workflow.png", 1280, 800);
await assertPngSize("store-listing/chrome-web-store/media/screenshots/02-options.png", 1280, 800);
await assertPngSize("store-listing/chrome-web-store/media/screenshots/03-popup.png", 1280, 800);

for (const file of await collectFiles(path.join("dist", "chrome"))) {
  if (!/\.(js|html|css)$/.test(file)) continue;
  const source = await readFile(path.join(root, file), "utf8");
  if (/\b(eval|new Function|importScripts|XMLHttpRequest|WebSocket|EventSource|navigator\.sendBeacon)\b/.test(source)) {
    failures.push(`Potential remote-code or telemetry API found in ${file}.`);
  }
}

const privacy = await readFile(path.join(root, "PRIVACY.md"), "utf8");
for (const permission of manifest.permissions || []) {
  if (!privacy.includes(`\`${permission}\``)) {
    failures.push(`PRIVACY.md does not mention permission ${permission}.`);
  }
}

const listing = await readFile(path.join(root, "store-listing/chrome-web-store/listing/en.txt"), "utf8");
if (/^\s*#/m.test(listing) || /^\s*[-*]\s/m.test(listing) || /\[[^\]]+\]\([^)]+\)/.test(listing)) {
  failures.push("Store listing must be direct-copy description text without markdown.");
}

if (/Forvo Helper/i.test(listing)) {
  failures.push("Store listing direct-copy text must not include the extension name.");
}

if (!listing.includes("Open source under the GPL-3.0 license: https://github.com/molodchyk/forvo-helper")) {
  failures.push("Store listing must include the plain source/license line.");
}

if (existsSync(path.join(root, "dist"))) {
  const entries = await readdir(path.join(root, "dist"), { withFileTypes: true });
  const zips = entries.filter((entry) => entry.isFile() && entry.name.endsWith(".zip")).map((entry) => entry.name);
  const expectedZip = `forvo-helper-${manifest.version}.zip`;
  if (zips.length > 1 || (zips.length === 1 && zips[0] !== expectedZip)) {
    failures.push(`dist should contain only ${expectedZip}; found ${zips.join(", ") || "none"}.`);
  }
}

if (failures.length > 0) {
  console.error("Package verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Package verification passed.");

function assertExists(relativePath) {
  if (!existsSync(path.join(root, relativePath))) {
    failures.push(`Missing file: ${relativePath}`);
  }
}

async function assertPngSize(relativePath, width, height) {
  const data = await readFile(path.join(root, relativePath));
  if (data.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") {
    failures.push(`${relativePath} is not a PNG.`);
    return;
  }
  const actualWidth = data.readUInt32BE(16);
  const actualHeight = data.readUInt32BE(20);
  if (actualWidth !== width || actualHeight !== height) {
    failures.push(`${relativePath} is ${actualWidth}x${actualHeight}; expected ${width}x${height}.`);
  }
}

async function collectFiles(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!existsSync(absolutePath)) return [];
  const entries = await readdir(absolutePath, { withFileTypes: true });
  const nested = [];
  for (const entry of entries) {
    const child = path.join(relativePath, entry.name);
    if (entry.isDirectory()) nested.push(...await collectFiles(child));
    if (entry.isFile()) nested.push(child.replace(/\\/g, "/"));
  }
  return nested;
}
