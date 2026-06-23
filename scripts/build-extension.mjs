import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import * as esbuild from "esbuild";

const root = process.cwd();
const outDir = path.join(root, "dist", "chrome");

const entries = [
  ["src/app/background/index.js", "app/background/index.js", "esm"],
  ["src/app/content/forvo.js", "app/content/forvo.js", "iife"],
  ["src/app/content/forvoProfile.js", "app/content/forvoProfile.js", "iife"],
  ["src/app/content/goroh.js", "app/content/goroh.js", "iife"],
  ["src/app/content/chatgpt.js", "app/content/chatgpt.js", "iife"],
  ["src/app/options/index.js", "app/options/index.js", "esm"],
  ["src/app/popup/index.js", "app/popup/index.js", "esm"]
];

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

for (const [source, output, format] of entries) {
  await esbuild.build({
    entryPoints: [path.join(root, source)],
    outfile: path.join(outDir, output),
    bundle: true,
    format,
    target: ["chrome120"],
    legalComments: "none",
    sourcemap: false
  });
}

await copyFile("manifest.json");
await copyDirectory("_locales");
await copyDirectory("assets");
await copyDirectory("src/styles", "styles");
await copyFile("src/app/content/forvo.css", "app/content/forvo.css");
await copyFile("src/app/options/options.html", "app/options/options.html");
await copyFile("src/app/options/options.css", "app/options/options.css");
await copyFile("src/app/popup/popup.html", "app/popup/popup.html");
await copyFile("src/app/popup/popup.css", "app/popup/popup.css");

const manifest = JSON.parse(await readFile(path.join(outDir, "manifest.json"), "utf8"));
manifest.version_name = `Forvo Helper ${manifest.version}`;
await writeFile(path.join(outDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`Built ${path.relative(root, outDir)}.`);

async function copyFile(from, to = from) {
  const target = path.join(outDir, to);
  await mkdir(path.dirname(target), { recursive: true });
  await cp(path.join(root, from), target);
}

async function copyDirectory(from, to = from) {
  await cp(path.join(root, from), path.join(outDir, to), { recursive: true });
}
