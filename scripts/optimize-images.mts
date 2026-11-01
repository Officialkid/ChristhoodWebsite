// Prepares the church's own photos for the website (repeatable).
// Reads the originals from legacy/image, brightens and sharpens them, enlarges small ones,
// writes web-sized copies to public/img and a lookup table to src/content/images.json.
import fs from "node:fs/promises";
import path from "node:path";
import { preparePhoto } from "../src/lib/enhance";

const SOURCES = [path.resolve("legacy/image"), path.resolve("assets/photos")];
const OUT = path.resolve("public/img");
const MANIFEST = path.resolve("src/content/images.json");

const slugify = (name: string) =>
  name
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Flyers, posters, logos and icons: sharpen and enlarge only, never change the tones. */
const isGraphic = (file: string) => /\.png$/i.test(file) || /(program|breakfast|theme|mantra|poster|flyer|apologetics|iact|impact|give|logo|signature|bio|ifc)/i.test(file);

await fs.mkdir(OUT, { recursive: true });
await fs.mkdir(path.dirname(MANIFEST), { recursive: true });

const only = process.env.ONLY_NEW === "1";
const existing: Record<string, { w: number; h: number; blur: string; from: string }> = only ? JSON.parse(await fs.readFile(MANIFEST, "utf8").catch(() => "{}")) : {};
const found: { file: string; dir: string }[] = [];
for (const dir of SOURCES) for (const f of await fs.readdir(dir).catch(() => [])) if (/\.(jpe?g|png|webp)$/i.test(f)) found.push({ file: f, dir });
found.sort((a, b) => a.file.localeCompare(b.file));
const files = found.map((f) => f.file);
const dirOf = new Map(found.map((f) => [f.file, f.dir]));
const used = new Map<string, number>();
const manifest: Record<string, { w: number; h: number; blur: string; from: string }> = { ...existing };
const level = (process.env.LEVEL as "off" | "natural" | "strong") || "natural";

async function one(file: string) {
  let slug = slugify(file);
  const n = (used.get(slug) ?? 0) + 1;
  used.set(slug, n);
  if (n > 1) slug = `${slug}-${n}`;

  if (only && manifest[slug]) return;
  const p = await preparePhoto(path.join(dirOf.get(file)!, file), level, { graphic: isGraphic(file), maxBytes: 400_000 });
  await fs.writeFile(path.join(OUT, `${slug}.webp`), p.full);
  await fs.writeFile(path.join(OUT, `${slug}-md.webp`), p.medium);
  await fs.writeFile(path.join(OUT, `${slug}-sm.webp`), p.small);
  manifest[slug] = { w: p.w, h: p.h, blur: p.blur, from: file };
  console.log(`${slug}: ${p.note}`);
}

const queue = [...files];
await Promise.all(
  Array.from({ length: 3 }, async () => {
    while (queue.length) await one(queue.shift()!);
  }),
);

const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
await fs.writeFile(MANIFEST, JSON.stringify(sorted, null, 1));
const outSize = (await Promise.all((await fs.readdir(OUT)).map(async (f) => (await fs.stat(path.join(OUT, f))).size))).reduce((a, b) => a + b, 0);
console.log(`${files.length} photos prepared, ${(outSize / 1048576).toFixed(1)} MB in public/img`);
