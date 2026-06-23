import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";
import {
  marqueePromoHtml,
  optionsScreenshotHtml,
  popupScreenshotHtml,
  smallPromoHtml,
  workflowScreenshotHtml
} from "./store-media-pages.mjs";

const root = process.cwd();
const outputRoot = path.join(root, "store-listing", "chrome-web-store", "media");
const chromeCandidates = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  path.join(process.env.LOCALAPPDATA || "", "Google", "Chrome", "Application", "chrome.exe"),
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser"
].filter(Boolean);
const chromePath = chromeCandidates.find((candidate) => existsSync(candidate));
if (!chromePath) {
  throw new Error("Chrome executable was not found. Set CHROME_PATH to generate store media.");
}
const tempDir = path.join(os.tmpdir(), `forvo-helper-store-media-${Date.now()}`);
await mkdir(tempDir, { recursive: true });
await mkdir(path.join(outputRoot, "screenshots"), { recursive: true });
await mkdir(path.join(outputRoot, "promo"), { recursive: true });
try {
  await renderHtml(workflowScreenshotHtml(), 1280, 800, path.join(outputRoot, "screenshots", "01-forvo-workflow.png"));
  await renderHtml(optionsScreenshotHtml(), 1280, 800, path.join(outputRoot, "screenshots", "02-options.png"));
  await renderHtml(popupScreenshotHtml(), 1280, 800, path.join(outputRoot, "screenshots", "03-popup.png"));
  await renderHtml(smallPromoHtml(), 440, 280, path.join(outputRoot, "promo", "small-promo.png"));
  await renderHtml(marqueePromoHtml(), 1400, 560, path.join(outputRoot, "promo", "marquee-promo.png"));
} finally {
  await rm(tempDir, { recursive: true, force: true });
}

console.log("Generated Chrome Web Store screenshots and promo images.");

async function renderHtml(html, width, height, outputPath) {
  const htmlPath = path.join(tempDir, `${path.basename(outputPath, ".png")}.html`);

  await writeFile(htmlPath, html, "utf8");
  try {
    await runChrome([
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-extensions",
      `--user-data-dir=${path.join(tempDir, "chrome-profile")}`,
      "--force-device-scale-factor=1",
      `--window-size=${width},${height}`,
      `--screenshot=${outputPath}`,
      pathToFileUrl(htmlPath)
    ]);
  } catch (error) {
    if (await isPngSize(outputPath, width, height)) {
      return;
    }

    throw error;
  }
}
function runChrome(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(chromePath, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Chrome exited with code ${code}.${stderr ? `\n${stderr}` : ""}`));
    });
  });
}
function pathToFileUrl(filePath) {
  return `file:///${filePath.replace(/\\/g, "/").replace(/^([A-Za-z]):/u, "$1:")}`;
}
async function isPngSize(filePath, width, height) {
  try {
    const data = await readFile(filePath);

    return data.subarray(0, 8).toString("hex") === "89504e470d0a1a0a"
      && data.readUInt32BE(16) === width
      && data.readUInt32BE(20) === height;
  } catch {
    return false;
  }
}
