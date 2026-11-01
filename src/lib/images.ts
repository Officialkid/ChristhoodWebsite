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
  if (/^https?:\/\//.test(src)) {
    const sized = (w: number) => (src.includes("cdn.sanity.io") ? `${src}?w=${w}&auto=format&q=80` : src);
    return { full: sized(1800), small: sized(720), w: 1600, h: 1000, blur: undefined as string | undefined };
  }
  if (src.startsWith("/")) return { full: src, small: src, w: 1600, h: 1000, blur: undefined as string | undefined };
  const info = images[src];
  return {
    full: `/img/${src}.webp`,
    small: `/img/${src}-sm.webp`,
    w: info?.w ?? 1600,
    h: info?.h ?? 1000,
    blur: info?.blur,
  };
}
