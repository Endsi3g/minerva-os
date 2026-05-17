/**
 * Generate PWA icon variants from /public/favicon.png
 * Run: node scripts/generate-icons.mjs
 */
import { createCanvas, loadImage } from 'canvas';
import { writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC = join(ROOT, 'public', 'favicon.png');
const OUT = join(ROOT, 'public', 'icons');

if (!existsSync(SRC)) {
  console.error('Source favicon not found at', SRC);
  process.exit(1);
}

const img = await loadImage(SRC);

function renderIcon(size, padding = 0) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0A0D14';
  ctx.fillRect(0, 0, size, size);
  const p = Math.round(size * padding);
  ctx.drawImage(img, p, p, size - p * 2, size - p * 2);
  return canvas.toBuffer('image/png');
}

writeFileSync(join(OUT, 'icon-192.png'), renderIcon(192));
writeFileSync(join(OUT, 'icon-512.png'), renderIcon(512));
writeFileSync(join(OUT, 'icon-512-maskable.png'), renderIcon(512, 0.15));

console.log('PWA icons generated in public/icons/');
