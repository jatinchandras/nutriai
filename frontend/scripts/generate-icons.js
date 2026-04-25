#!/usr/bin/env node
// scripts/generate-icons.js
// Run: node scripts/generate-icons.js
// Requires: npm install sharp  (one-time, not in app bundle)
//
// This generates all required PWA icon sizes from a single SVG source.
// Place your logo SVG at public/icons/logo.svg before running.

import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '../public/icons');

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// Embedded SVG icon — green circle with N, matches the app logo
const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="115" fill="#0e0f11"/>
  <circle cx="256" cy="256" r="200" fill="#00e676" opacity="0.15"/>
  <circle cx="256" cy="256" r="12" fill="#00e676"/>
  <text x="256" y="310" font-family="system-ui,sans-serif" font-weight="700"
    font-size="220" fill="#00e676" text-anchor="middle">N</text>
</svg>`;

const svgBuffer = Buffer.from(SVG);

async function generate() {
  console.log('Generating PWA icons…');
  for (const size of SIZES) {
    const outPath = join(iconsDir, `icon-${size}.png`);
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outPath);
    console.log(`  ✓ icon-${size}.png`);
  }

  // Also generate a simple placeholder screenshot (solid bg with text)
  const screenshotSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 390 844">
    <rect width="390" height="844" fill="#0e0f11"/>
    <text x="195" y="422" font-family="system-ui" font-size="48" fill="#00e676" text-anchor="middle" font-weight="700">NutriAI</text>
    <text x="195" y="480" font-family="system-ui" font-size="20" fill="#8b8f9a" text-anchor="middle">AI-powered calorie tracker</text>
  </svg>`;

  await sharp(Buffer.from(screenshotSvg))
    .resize(390, 844)
    .png()
    .toFile(join(iconsDir, 'screenshot-mobile.png'));

  console.log('  ✓ screenshot-mobile.png');
  console.log('\nAll icons generated! ✓');
  console.log('Replace public/icons/icon-*.png with your own branding if desired.');
}

generate().catch(console.error);
