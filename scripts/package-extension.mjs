import { mkdir, readdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { crc32 } from "./crc32.mjs";

const root = process.cwd();
const manifest = JSON.parse(await readFile(path.join(root, "dist", "chrome", "manifest.json"), "utf8"));
const outDir = path.join(root, "dist");
const zipName = `forvo-helper-${manifest.version}.zip`;
const zipPath = path.join(outDir, zipName);
const packageRoot = path.join(root, "dist", "chrome");

await mkdir(outDir, { recursive: true });
await removeStaleZips();

const entries = (await collect(packageRoot, "")).sort();
const locals = [];
const centrals = [];
let offset = 0;

for (const name of entries) {
  const absolutePath = path.join(packageRoot, name);
  const data = await readFile(absolutePath);
  const date = (await stat(absolutePath)).mtime;
  const local = localHeader(name, data, date);
  const central = centralHeader(name, data, date, offset);

  locals.push(local);
  centrals.push(central);
  offset += local.length;
}

const central = Buffer.concat(centrals);
const output = Buffer.concat([...locals, central, endRecord(entries.length, central.length, offset)]);
await writeFile(zipPath, output);
console.log(`Created ${path.relative(root, zipPath)} with ${entries.length} files.`);

async function collect(absolutePath, relativePath) {
  if (!existsSync(absolutePath)) return [];
  const info = await stat(absolutePath);
  if (info.isFile()) return [relativePath.replace(/\\/g, "/")];
  const entries = await readdir(absolutePath);
  const nested = await Promise.all(entries.map((entry) => collect(path.join(absolutePath, entry), path.join(relativePath, entry))));
  return nested.flat();
}

async function removeStaleZips() {
  const entries = await readdir(outDir, { withFileTypes: true }).catch(() => []);
  await Promise.all(entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".zip") && entry.name !== zipName)
    .map((entry) => unlink(path.join(outDir, entry.name))));
}

function dosTime(date) {
  const year = Math.max(date.getFullYear(), 1980);
  return {
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
    day: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()
  };
}

function localHeader(name, data, date) {
  const nameBuffer = Buffer.from(name);
  const header = Buffer.alloc(30);
  const { time, day } = dosTime(date);

  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(0, 6);
  header.writeUInt16LE(0, 8);
  header.writeUInt16LE(time, 10);
  header.writeUInt16LE(day, 12);
  header.writeUInt32LE(crc32(data), 14);
  header.writeUInt32LE(data.length, 18);
  header.writeUInt32LE(data.length, 22);
  header.writeUInt16LE(nameBuffer.length, 26);
  return Buffer.concat([header, nameBuffer, data]);
}

function centralHeader(name, data, date, localOffset) {
  const nameBuffer = Buffer.from(name);
  const header = Buffer.alloc(46);
  const { time, day } = dosTime(date);

  header.writeUInt32LE(0x02014b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(20, 6);
  header.writeUInt16LE(0, 8);
  header.writeUInt16LE(0, 10);
  header.writeUInt16LE(time, 12);
  header.writeUInt16LE(day, 14);
  header.writeUInt32LE(crc32(data), 16);
  header.writeUInt32LE(data.length, 20);
  header.writeUInt32LE(data.length, 24);
  header.writeUInt16LE(nameBuffer.length, 28);
  header.writeUInt32LE(localOffset, 42);
  return Buffer.concat([header, nameBuffer]);
}

function endRecord(entryCount, centralSize, centralOffset) {
  const record = Buffer.alloc(22);
  record.writeUInt32LE(0x06054b50, 0);
  record.writeUInt16LE(entryCount, 8);
  record.writeUInt16LE(entryCount, 10);
  record.writeUInt32LE(centralSize, 12);
  record.writeUInt32LE(centralOffset, 16);
  return record;
}

