#!/usr/bin/env node
// One-off OG image builder. Run with: node scripts/build-og.mjs
// Output: public/og-image.jpg (1200x630)

import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const W = 1200;
const H = 630;
const PAPER = "#FAF6EF";
const INK = "#2A2520";
const SAGE_DARK = "#5F6E55";

// 1. cream background
const bg = sharp({
  create: { width: W, height: H, channels: 3, background: PAPER },
});

// 2. cover image: target ~440 wide, sized to keep aspect
const coverPath = join(root, "src/assets/the-truth-about-the-puppy-cover.png");
const coverBuf = await sharp(coverPath)
  .resize({ width: 460, withoutEnlargement: true })
  .png()
  .toBuffer();
const coverMeta = await sharp(coverBuf).metadata();
const coverX = 90;
const coverY = Math.round((H - coverMeta.height) / 2);

// 3. text + ornaments as SVG (drawn at canvas size so we can position precisely)
const textCol = coverX + coverMeta.width + 70; // start of text column
const textW = W - textCol - 80;

// build SVG using EB Garamond (will fall back if not available locally; that's OK
// for an OG image — sharp/librsvg uses system fonts. Use a serif stack.)
const fontStack = "'EB Garamond','Hoefler Text','Garamond','Baskerville',serif";

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <filter id="dropshadow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="14"/>
      <feOffset dx="0" dy="8" result="offsetblur"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.32"/></feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <style>
    .eyebrow { font-family: ${fontStack}; font-size: 16px; fill: ${INK}; opacity: 0.62; letter-spacing: 4px; }
    .title   { font-family: ${fontStack}; font-size: 62px; fill: ${INK}; }
    .sub     { font-family: ${fontStack}; font-size: 22px; font-style: italic; fill: ${INK}; opacity: 0.78; }
    .by      { font-family: ${fontStack}; font-size: 22px; fill: ${INK}; }
    .coming  { font-family: ${fontStack}; font-size: 22px; font-style: italic; fill: ${SAGE_DARK}; letter-spacing: 1px; }
    .rule    { stroke: ${INK}; stroke-opacity: 0.45; stroke-width: 1; }
  </style>

  <!-- shadow rect at the cover position; filter blurs alpha into a soft drop shadow -->
  <rect x="${coverX}" y="${coverY}" width="${coverMeta.width}" height="${coverMeta.height}"
        fill="${INK}" opacity="0.22" filter="url(#dropshadow)"/>

  <!-- eyebrow: imprint -->
  <text x="${textCol}" y="180" class="eyebrow">THE BEDSIDE BOOKS</text>
  <line x1="${textCol}" y1="200" x2="${textCol + 60}" y2="200" class="rule"/>

  <!-- title (wraps to two lines manually) -->
  <text x="${textCol}" y="270" class="title">The Truth</text>
  <text x="${textCol}" y="332" class="title">About the Puppy</text>

  <!-- subtitle italic -->
  <text x="${textCol}" y="380" class="sub">an honest picture book</text>
  <text x="${textCol}" y="408" class="sub">for begging children</text>
  <text x="${textCol}" y="436" class="sub">and tired parents</text>

  <!-- byline + coming -->
  <text x="${textCol}" y="495" class="by">by Dr. Jay</text>
  <text x="${textCol}" y="528" class="coming">Coming 2026</text>
</svg>`.trim();

await writeFile("/tmp/og-overlay.svg", svg);
const overlayBuf = await sharp(Buffer.from(svg)).png().toBuffer();

// 4. compose: overlay (shadow + text via SVG filter) under cover, cover on top
//    The SVG overlay renders the shadow rect with a Gaussian-blurred drop shadow filter.
//    We composite the SVG first (shadow + text), then the cover image on top of the
//    shadow position. That way the cover sits cleanly on its own shadow.
const outPath = join(root, "public/og-image.jpg");
await bg
  .composite([
    { input: overlayBuf, top: 0, left: 0 },
    { input: coverBuf, top: coverY, left: coverX },
  ])
  .jpeg({ quality: 88, progressive: true, mozjpeg: true })
  .toFile(outPath);

const stats = await sharp(outPath).metadata();
const buf = await readFile(outPath);
console.log(`wrote ${outPath}`);
console.log(`  ${stats.width}x${stats.height}, ${(buf.length / 1024).toFixed(1)} KB`);
