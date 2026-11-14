import manifest from "@/content/images.json";

export type PhotoInfo = { w: number; h: number; blur: string; from: string };
const images = manifest as Record<string, PhotoInfo>;

export const photoInfo = (name: string): PhotoInfo | undefined => images[name];

/** All photos named like prefix1, prefix2, prefix-3 … in number order. */
export function photoSet(prefix: string): string[] {
  const re = new RegExp(`^${prefix.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}-?(\\d+)$`);
  return Object.keys(images)
    .map((k) => ({ k, n: Number(re.exec(k)?.[1]) }))
    .filter((x) => Number.isFinite(x.n))
    .sort((a, b) => a.n - b.n)
    .map((x) => x.k);
}

/** Resolve a photo name or full address into what the page needs to draw it. */
export function resolvePhoto(src: string) {
  // Cloudinary imports use on-demand sizes instead of separate "-sm" and "-md" files.
  if (src.startsWith("https://res.cloudinary.com/") && src.includes("/image/upload/")) {
    const marker = "/image/upload/";
    const full = new URL(src);
    const rawWidth = Number(full.searchParams.get("ch_w"));
    const rawHeight = Number(full.searchParams.get("ch_h"));
    const w = Number.isInteger(rawWidth) && rawWidth > 0 && rawWidth <= 10_000 ? rawWidth : 1800;
    const h = Number.isInteger(rawHeight) && rawHeight > 0 && rawHeight <= 10_000 ? rawHeight : 1200;
    full.searchParams.delete("ch_w");
    full.searchParams.delete("ch_h");
    const address = full.toString();
    const small = address.replace(marker, marker + "c_limit,w_720,q_auto,f_auto/");
    const medium = address.replace(marker, marker + "c_limit,w_1200,q_auto,f_auto/");
    return { full: address, medium, small, w, h, blur: undefined as string | undefined };
  }
  // A picture the team uploaded: a small copy sits beside the full one with "-sm" before the extension.
  if (/^https?:\/\//.test(src) || src.startsWith("/media/")) {
    const small = src.replace(/\.webp$/, "-sm.webp");
    const medium = src.replace(/\.webp$/, "-md.webp");
    return { full: src, medium, small, w: 1800, h: 1200, blur: undefined as string | undefined };
  }
  if (src.startsWith("/")) return { full: src, medium: src, small: src, w: 1600, h: 1000, blur: undefined as string | undefined };
  const info = images[src];
  return {
    full: `/img/${src}.webp`,
    medium: `/img/${src}-md.webp`,
    small: `/img/${src}-sm.webp`,
    w: info?.w ?? 1600,
    h: info?.h ?? 1000,
    blur: info?.blur,
  };
}

/** Names of every prepared church photo, for pickers. */
export const photoNames = (): string[] => Object.keys(images).sort();
