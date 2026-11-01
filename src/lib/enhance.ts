import sharp from "sharp";

/**
 * Photo clean-up shared by the upload screen and the one-off script that prepares the church's own photos.
 *
 * What it does, in order: straightens phone photos, stretches the tones so dull pictures get depth, lifts dark pictures,
 * adds a little colour, enlarges small pictures with a sharp, careful resize and finishes with gentle sharpening.
 * It is classic image processing, not artificial intelligence, so it never invents faces or details.
 * Posters and flyers are left alone apart from the sharper enlargement (pass `graphic: true`).
 */
export type EnhanceLevel = "off" | "natural" | "strong";

export type PreparedPhoto = {
  full: Buffer;
  small: Buffer;
  w: number;
  h: number;
  /** Tiny blurred preview, ready to use as a CSS background while the real photo loads. */
  blur: string;
  note: string;
};

type Options = {
  fullWidth?: number;
  smallWidth?: number;
  maxBytes?: number;
  /** A flyer, poster or logo: only the sharper enlargement is applied, never tone changes. */
  graphic?: boolean;
};

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export async function preparePhoto(source: Buffer | string, level: EnhanceLevel = "natural", options: Options = {}): Promise<PreparedPhoto> {
  const fullWidth = options.fullWidth ?? 1800;
  const smallWidth = options.smallWidth ?? 720;

  const base = sharp(source, { failOn: "none" }).rotate();
  const meta = await base.clone().metadata();
  const flipped = (meta.orientation ?? 1) >= 5;
  const srcW = (flipped ? meta.height : meta.width) ?? fullWidth;

  const graphic = Boolean(options.graphic);
  const lum = await (async () => {
    const st = await base.clone().resize(256, 256, { fit: "inside" }).removeAlpha().stats();
    const [r, g, b] = st.channels;
    return 0.2126 * r.mean + 0.7152 * g.mean + 0.0722 * b.mean;
  })();

  // Enlarge pictures that would look soft on a big screen. Never go past 2x or past the full size.
  const target = level === "off" ? srcW : srcW < fullWidth ? Math.min(srcW * 2, fullWidth) : fullWidth;
  const enlarge = target > srcW * 1.02;

  let img = base.clone();
  const notes: string[] = [];

  if (level !== "off" && !graphic) {
    const strong = level === "strong";
    // How much darker than a well-exposed picture (about 125 of 255) this one is, 0 to 1.
    const dark = clamp((125 - lum) / 125, 0, 1);
    if (srcW < 1100 && strong) img = img.median(3);
    img = img.normalise({ lower: strong ? 2 : 1, upper: strong ? 98 : 99 });
    const lift = dark * (strong ? 0.5 : 0.32);
    if (lift > 0.03) {
      img = img.gamma(1 + lift * 1.1).modulate({ brightness: 1 + lift * 0.55 });
      notes.push("brightened");
    }
    img = img.modulate({ saturation: strong ? 1.1 : 1.05 });
    if (strong) {
      img = img.clahe({ width: Math.max(16, Math.round(srcW / 8)), height: Math.max(16, Math.round(((meta.height ?? srcW) * (srcW / (meta.width ?? srcW))) / 8)), maxSlope: 2 });
      notes.push("added depth");
    }
    notes.unshift("balanced tones");
  }

  img = img.resize({ width: target, withoutEnlargement: false, kernel: "lanczos3" });
  if (enlarge) notes.push(`enlarged ${(target / srcW).toFixed(1)}x`);
  if (level !== "off") img = img.sharpen(enlarge ? { sigma: 1.1, m1: 0.6, m2: 2.4 } : { sigma: 0.7, m1: 0.5, m2: 1.8 });

  // Keep every stored picture small enough to send in one request.
  const maxBytes = options.maxBytes;
  let quality = 80;
  let full = await img.clone().webp({ quality, effort: 5 }).toBuffer({ resolveWithObject: true });
  while (maxBytes && full.data.length > maxBytes && quality > 52) {
    quality -= 8;
    full = await img.clone().webp({ quality, effort: 5 }).toBuffer({ resolveWithObject: true });
  }
  const small = await sharp(full.data).resize({ width: smallWidth, withoutEnlargement: true }).webp({ quality: 74 }).toBuffer();
  const tiny = await sharp(full.data).resize({ width: 16 }).webp({ quality: 40 }).toBuffer();

  return {
    full: full.data,
    small,
    w: full.info.width,
    h: full.info.height,
    blur: `data:image/webp;base64,${tiny.toString("base64")}`,
    note: graphic ? (enlarge ? "poster, sharpened" : "poster, kept as is") : notes.join(", ") || "kept as is",
  };
}
