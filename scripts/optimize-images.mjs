// One-time (and repeatable) photo preparation.
// Reads the original photos from legacy/image, writes web-sized copies to public/img
// and a lookup table to src/content/images.json (size + tiny blur preview for each photo).
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SRC = path.resolve("legacy/image");
const OUT = path.resolve("public/img");
const MANIFEST = path.resolve("src/content/images.json");
const SIZES = { full: 1800, small: 720 };

const slugify = (name) =>
  name
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

await fs.mkdir(OUT, { recursive: true });
await fs.mkdir(path.dirname(MANIFEST), { recursive: true });

const files = (await fs.readdir(SRC)).filter((f) => /\.(jpe?g|png)$/i.test(f)).sort();
const used = new Map();
const manifest = {};

async function one(file) {
  let slug = slugify(file);
  const n = (used.get(slug) ?? 0) + 1;
  used.set(slug, n);
  if (n > 1) slug = `${slug}-${n}`;

  const input = sharp(path.join(SRC, file), { failOn: "none" }).rotate();
  const meta = await input.clone().metadata();
  const full = await input.clone().resize({ width: SIZES.full, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer({ resolveWithObject: true });
  await fs.writeFile(path.join(OUT, `${slug}.webp`), full.data);
  await input.clone().resize({ width: SIZES.small, withoutEnlargement: true }).webp({ quality: 72 }).toFile(path.join(OUT, `${slug}-sm.webp`));
  const tiny = await input.clone().resize({ width: 16 }).webp({ quality: 40 }).toBuffer();

  manifest[slug] = {
    w: full.info.width,
    h: full.info.height,
    blur: `data:image/webp;base64,${tiny.toString("base64")}`,
    from: file,
  };
  if (!meta.width) console.warn("no size for", file);
}

const queue = [...files];
await Promise.all(
  Array.from({ length: 4 }, async () => {
    while (queue.length) await one(queue.shift());
  }),
);

await fs.writeFile(MANIFEST, JSON.stringify(manifest, null, 1));
const outSize = (await Promise.all((await fs.readdir(OUT)).map(async (f) => (await fs.stat(path.join(OUT, f))).size))).reduce((a, b) => a + b, 0);
console.log(`${files.length} photos prepared, ${(outSize / 1048576).toFixed(1)} MB in public/img`);
