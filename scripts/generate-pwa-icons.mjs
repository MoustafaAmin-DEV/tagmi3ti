/**
 * Regenerates PWA / favicon PNGs from public/logo.svg.
 * Run: npm run icons:generate
 */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'public', 'logo.svg');
const outDir = path.join(root, 'public', 'icons');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

await mkdir(outDir, { recursive: true });

for (const size of sizes) {
  const dest = path.join(outDir, `icon-${size}x${size}.png`);
  await sharp(src)
    .resize(size, size, { fit: 'contain', background: { r: 15, g: 23, b: 42, alpha: 1 } })
    .png()
    .toFile(dest);
  console.log('wrote', path.relative(root, dest));
}

await sharp(src)
  .resize(32, 32, { fit: 'contain', background: { r: 15, g: 23, b: 42, alpha: 1 } })
  .png()
  .toFile(path.join(root, 'public', 'favicon.png'));

console.log('Done — icons from public/logo.svg');
