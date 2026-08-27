// One-off: generates PWA icons from an inline SVG mark. Run: node scripts/make-icons.mjs
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';

const svg = (size, pad) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#2a6b4f"/>
  <text x="256" y="${pad ? 330 : 345}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-weight="700" font-size="${pad ? 240 : 300}" fill="#ffffff">F</text>
</svg>`;

const out = [
  ['public/icon-192.png', 192, false],
  ['public/icon-512.png', 512, false],
  ['public/icon-maskable-512.png', 512, true],
  ['public/apple-touch-icon.png', 180, false],
];
for (const [file, size, pad] of out) {
  await sharp(Buffer.from(svg(size, pad))).resize(size, size).png().toFile(file);
  console.log('wrote', file);
}
writeFileSync('public/icon.svg', svg(512, false).trim());
