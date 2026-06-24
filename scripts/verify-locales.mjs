import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const localeRoot = path.join(root, "_locales");
const listingRoot = path.join(root, "store-listing", "chrome-web-store", "listing");
const english = JSON.parse(await readFile(path.join(localeRoot, "en", "messages.json"), "utf8"));
const englishKeys = Object.keys(english).sort();
const failures = [];

for (const locale of await readdir(localeRoot)) {
  const messages = JSON.parse(await readFile(path.join(localeRoot, locale, "messages.json"), "utf8"));
  const keys = Object.keys(messages).sort();
  if (keys.join("\n") !== englishKeys.join("\n")) {
    failures.push(`${locale} locale keys do not match English.`);
  }

  await verifyStoreListing(locale, messages.extensionName?.message || english.extensionName.message);
}

await verifyMessageReferences("manifest.json", await readFile(path.join(root, "manifest.json"), "utf8"));

for (const file of await collectFiles("src")) {
  if (!file.endsWith(".html")) continue;
  await verifyMessageReferences(file, await readFile(path.join(root, file), "utf8"));
}

if (failures.length > 0) {
  console.error("Locale verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Locale verification passed.");

async function verifyMessageReferences(file, source) {
  for (const match of source.matchAll(/__MSG_([A-Za-z0-9_]+)__/g)) {
    assertLocaleKey(file, match[1]);
  }

  for (const match of source.matchAll(/data-i18n(?:-[a-z]+)?=["']([^"']+)["']/g)) {
    assertLocaleKey(file, match[1]);
  }
}

function assertLocaleKey(file, key) {
  if (!english[key]?.message) {
    failures.push(`${file} references missing locale key ${key}.`);
  }
}

async function verifyStoreListing(locale, extensionName) {
  const listingPath = path.join(listingRoot, `${locale}.txt`);
  let listing = "";

  try {
    listing = await readFile(listingPath, "utf8");
  } catch {
    failures.push(`${locale} locale is missing Chrome Web Store listing text.`);
    return;
  }

  const firstLine = listing.split(/\r?\n/).find((line) => line.trim());
  if (!firstLine) {
    failures.push(`${locale} Chrome Web Store listing is empty.`);
    return;
  }

  if (firstLine.trim().startsWith("#") || firstLine.includes(extensionName)) {
    failures.push(`${locale} Chrome Web Store listing must start with body text, not a title or extension name.`);
  }

  if (/\[[^\]]+\]\([^)]+\)/.test(listing)) {
    failures.push(`${locale} Chrome Web Store listing must be plain text, not Markdown.`);
  }

  if (!listing.includes("GPL-3.0") || !listing.includes("https://github.com/molodchyk/forvo-helper")) {
    failures.push(`${locale} Chrome Web Store listing must include the GPL-3.0 and GitHub footer.`);
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
