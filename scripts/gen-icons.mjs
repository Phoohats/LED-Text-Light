// Rasterize the SVG icons to PNG for PWA / iOS home-screen. Run: node scripts/gen-icons.mjs
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
const any = join(root, "icon.svg");
const maskable = join(root, "icon-maskable.svg");

const jobs = [
  [any, "pwa-192x192.png", 192],
  [any, "pwa-512x512.png", 512],
  [any, "apple-touch-icon-180x180.png", 180],
  [maskable, "maskable-512x512.png", 512],
];

for (const [src, out, size] of jobs) {
  await sharp(src, { density: 384 }).resize(size, size).png().toFile(join(root, out));
  console.log("✓", out, `${size}x${size}`);
}
console.log("done");
