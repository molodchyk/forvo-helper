import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { deflateSync } from "node:zlib";
import { crc32 } from "./crc32.mjs";

const root = process.cwd();

function chunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  const crc = Buffer.alloc(4);

  length.writeUInt32BE(data.length, 0);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);

  return Buffer.concat([length, typeBuffer, data, crc]);
}

function encodePng(width, height, drawPixel) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  const scanlines = Buffer.alloc(height * (1 + width * 4));

  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;

  for (let y = 0; y < height; y += 1) {
    const row = y * (1 + width * 4);
    scanlines[row] = 0;
    for (let x = 0; x < width; x += 1) {
      const pixel = drawPixel(x, y, width, height);
      const offset = row + 1 + x * 4;
      scanlines[offset] = pixel[0];
      scanlines[offset + 1] = pixel[1];
      scanlines[offset + 2] = pixel[2];
      scanlines[offset + 3] = pixel[3];
    }
  }

  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(scanlines)),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

function iconPixel(x, y, width, height) {
  const radius = width * 0.19;
  const insideRoundedSquare = x > radius && y > radius && x < width - radius && y < height - radius
    || Math.hypot(x - radius, y - radius) < radius
    || Math.hypot(x - (width - radius), y - radius) < radius
    || Math.hypot(x - radius, y - (height - radius)) < radius
    || Math.hypot(x - (width - radius), y - (height - radius)) < radius;

  if (!insideRoundedSquare) return [0, 0, 0, 0];

  const fStem = x > width * 0.27 && x < width * 0.38 && y > height * 0.22 && y < height * 0.78;
  const fTop = x > width * 0.27 && x < width * 0.72 && y > height * 0.22 && y < height * 0.34;
  const fMid = x > width * 0.27 && x < width * 0.62 && y > height * 0.45 && y < height * 0.56;
  const hStem = x > width * 0.64 && x < width * 0.75 && y > height * 0.38 && y < height * 0.78;
  const hCross = x > width * 0.52 && x < width * 0.75 && y > height * 0.52 && y < height * 0.63;

  if (fStem || fTop || fMid || hStem || hCross) {
    return [255, 255, 255, 255];
  }

  return [37, 99, 235, 255];
}

async function writePng(relativePath, width, height, drawPixel) {
  const absolutePath = path.join(root, relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, encodePng(width, height, drawPixel));
}

for (const size of [16, 32, 48, 128]) {
  await writePng(`assets/icon-${size}.png`, size, size, iconPixel);
}

await writePng("store-listing/chrome-web-store/media/icon-128.png", 128, 128, iconPixel);

console.log("Generated extension icons.");
