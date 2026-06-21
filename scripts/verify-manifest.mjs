import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const distRoot = path.join(root, "dist", "chrome");
const manifest = JSON.parse(await readFile(path.join(distRoot, "manifest.json"), "utf8"));
const packageMetadata = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
const locale = JSON.parse(await readFile(path.join(distRoot, "_locales", "en", "messages.json"), "utf8"));
const failures = [];

assert(manifest.manifest_version === 3, "manifest_version must be 3.");
assert(manifest.version === packageMetadata.version, "Manifest and package versions must match.");
assert(manifest.default_locale === "en", "default_locale must be en.");
assertMessage(manifest.name, "name");
assertMessage(manifest.short_name, "short_name");
assertMessage(manifest.description, "description");
assertMessage(manifest.action?.default_title, "action.default_title");

for (const permission of ["storage", "tabs"]) {
  assert(manifest.permissions?.includes(permission), `Missing permission: ${permission}.`);
}

for (const host of [
  "https://forvo.com/*",
  "https://*.forvo.com/*",
  "https://goroh.pp.ua/*",
  "https://www.goroh.pp.ua/*",
  "https://chatgpt.com/*",
  "https://chat.openai.com/*"
]) {
  assert(manifest.host_permissions?.includes(host), `Missing host permission: ${host}.`);
}

for (const file of [
  manifest.background?.service_worker,
  manifest.action?.default_popup,
  manifest.options_page,
  ...Object.values(manifest.icons || {}),
  ...Object.values(manifest.action?.default_icon || {}),
  ...manifest.content_scripts.flatMap((script) => [...(script.js || []), ...(script.css || [])])
]) {
  assertExists(file);
}

for (const script of manifest.content_scripts) {
  assert(Array.isArray(script.matches) && script.matches.length > 0, "Each content script needs matches.");
  assert(script.run_at === "document_idle", "Content scripts should run at document_idle.");
}

if (failures.length > 0) {
  console.error("Manifest verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Manifest verification passed.");

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function assertExists(relativePath) {
  assert(relativePath && existsSync(path.join(distRoot, relativePath)), `Missing manifest file: ${relativePath}`);
}

function assertMessage(value, field) {
  const match = /^__MSG_([A-Za-z0-9_]+)__$/.exec(value || "");
  assert(Boolean(match), `Manifest ${field} must use a locale message.`);
  if (match) assert(Boolean(locale[match[1]]?.message), `Missing locale message for manifest ${field}: ${match[1]}.`);
}

