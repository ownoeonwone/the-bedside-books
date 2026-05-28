#!/usr/bin/env node
// One-off OG image builder. Run with: node scripts/build-og.mjs
// Output: public/og-image.jpg (1200x630)
//
// The cover now has title, subtitle, byline, and imprint mark baked in, so
// the OG layout just centers the cover on cream with a small "Coming 2026"
// line below. The cover does the work; we just frame it.

import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const W = 1200;
const H = 630;
const PAPER = "#FAF6EF";
const SAGE_DARK = "#5F6E55";

// cream background
const bg = sharp({
  create: { width: W, height: H, channels: 3, background: PAPER },
});

// cover — scale to height ~500 so it dominates without crowding
const coverPath = join(root, "src/assets/the-truth-about-the-puppy-cover.png");
const coverBuf = await sharp(coverPath)
  .resize({ height: 500, withoutEnlargement: true })
  .png()
  .toBuffer();
const coverMeta = await sharp(coverBuf).metadata();
const coverX = Math.round((W - coverMeta.width) / 2);
const coverY = 35;

const fontStack = "'EB Garamond','Hoefler Text','Garamond','Baskerville',serif";

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <filter id="dropshadow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="14"/>
      <feOffset dx="0" dy="10" result="offsetblur"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.32"/></feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <style>
    .coming { font-family: ${fontStack}; font-size: 28px; font-style: italic; fill: ${SAGE_DARK}; letter-spacing: 2px; }
  </style>

  <!-- shadow under cover -->
  <rect x="${coverX}" y="${coverY}" width="${coverMeta.width}" height="${coverMeta.height}"
        fill="#2A2520" opacity="0.22" filter="url(#dropshadow)"/>

  <!-- 'Coming 2026' centered below the cover -->
  <text x="${W / 2}" y="${coverY + coverMeta.height + 50}" text-anchor="middle" class="coming">Coming 2026</text>
</svg>`.trim();

const overlayBuf = await sharp(Buffer.from(svg)).png().toBuffer();

const outPath = join(root, "public/og-image.jpg");
await bg
  .composite([
    { input: overlayBuf, top: 0, left: 0 },
    { input: coverBuf, top: coverY, left: coverX },
  ])
  .jpeg({ quality: 88, progressive: true, mozjpeg: true })
  .toFile(outPath);

const buf = await readFile(outPath);
console.log(`wrote ${outPath}`);
console.log(`  ${W}x${H}, ${(buf.length / 1024).toFixed(1)} KB`);
