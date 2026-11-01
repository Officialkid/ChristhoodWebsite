"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, Copy, Play, X } from "lucide-react";

/** One tap copies text, and says so. */
export function CopyButton({ value, label, tone = "dark" }: { value: string; label: string; tone?: "dark" | "light" }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setDone(true);
      setTimeout(() => setDone(false), 2200);
    } catch {
      window.prompt("Copy this:", value);
    }
  };
  return (
    <button type="button" onClick={copy} className={`inline-flex min-h-11 items-center gap-2 rounded-sm border px-4 text-[0.95rem] font-semibold transition-colors ${tone === "dark" ? "border-on-purple/50 text-on-purple hover:bg-on-purple hover:text-purple-deep" : "border-ink/35 text-ink hover:bg-ink hover:text-paper"}`}>
      {done ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
      <span aria-live="polite">{done ? "Copied" : label}</span>
    </button>
  );
}

/** A slow drift on the hero photo as the page scrolls. Still for anyone who prefers reduced motion. */
export function HeroMedia({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-5%", "7%"]);
  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden" aria-hidden>
      <motion.div style={reduce ? undefined : { y }} className="absolute inset-x-0 -top-[10%] h-[120%]">{children}</motion.div>
    </div>
  );
}

export type GalleryPhoto = { full: string; small: string; w: number; h: number; blur?: string };

/** A row of photos. Tap one to see it large, then move through with the arrows or keys. */
export function Gallery({ title, photos }: { title: string; photos: GalleryPhoto[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const step = (d: number) => setOpen((i) => (i === null ? i : (i + d + photos.length) % photos.length));

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open !== null && !el.open) el.showModal();
    if (open === null && el.open) el.close();
  }, [open]);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!photos.length) return null;
  return (
    <>
      <div role="list" aria-label={title} className="-mx-5 flex snap-x scroll-px-5 gap-3 overflow-x-auto px-5 pb-3 [scrollbar-width:thin]">
        {photos.map((p, i) => (
          <button key={p.full + i} type="button" role="listitem" onClick={() => setOpen(i)} aria-label={`${title}: photo ${i + 1} of ${photos.length}, open large`} className="group relative h-56 shrink-0 snap-start overflow-hidden bg-paper-2 sm:h-64" style={{ aspectRatio: `${p.w} / ${p.h}`, backgroundImage: p.blur ? `url(${p.blur})` : undefined, backgroundSize: "cover" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.small} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
          </button>
        ))}
      </div>
      <dialog ref={dialog} onClose={() => setOpen(null)} onClick={(e) => e.target === dialog.current && setOpen(null)} aria-label={`${title}, large photo`} className="m-auto max-h-[94svh] w-[min(96vw,72rem)] overflow-visible bg-transparent p-0 backdrop:bg-ink/90">
        {open !== null && (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photos[open].full} alt="" className="mx-auto max-h-[84svh] w-auto max-w-full object-contain" />
            <p className="mt-3 text-center text-sm text-on-purple-muted">{title} · {open + 1} / {photos.length}</p>
            <button type="button" onClick={() => setOpen(null)} aria-label="Close" className="absolute right-0 top-0 inline-flex size-11 items-center justify-center bg-gold text-ink"><X className="size-5" /></button>
            <button type="button" onClick={() => step(-1)} aria-label="Previous photo" className="absolute left-0 top-1/2 inline-flex size-12 -translate-y-1/2 items-center justify-center bg-ink/80 text-on-purple"><ArrowLeft className="size-5" /></button>
            <button type="button" onClick={() => step(1)} aria-label="Next photo" className="absolute right-0 top-1/2 inline-flex size-12 -translate-y-1/2 items-center justify-center bg-ink/80 text-on-purple"><ArrowRight className="size-5" /></button>
          </div>
        )}
      </dialog>
    </>
  );
}

/** Shows a thumbnail first, and only loads the video when someone presses play. */
export function VideoCard({ id, title }: { id: string; title: string }) {
  const [play, setPlay] = useState(false);
  return (
    <div className="relative aspect-video overflow-hidden bg-ink">
      {play ? (
        <iframe className="absolute inset-0 size-full" src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`} title={title} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
      ) : (
        <button type="button" onClick={() => setPlay(true)} aria-label={`Play: ${title}`} className="group absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" className="size-full object-cover" />
          <span className="absolute inset-0 grid place-items-center bg-ink/25 transition-colors group-hover:bg-ink/10"><span className="grid size-16 place-items-center rounded-sm bg-gold text-ink"><Play className="size-7 translate-x-0.5 fill-current" aria-hidden /></span></span>
        </button>
      )}
    </div>
  );
}

export type DirItem = { href: string; title: string; meta?: string; summary: string; photo: GalleryPhoto };

/** A list of links where hovering or focusing a row shows its photo beside it. On phones the photo is left out. */
export function DirectoryView({ items }: { items: DirItem[] }) {
  const [active, setActive] = useState(0);
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-20">
      <ul className="border-t border-rule">
        {items.map((it, i) => (
          <li key={it.href} className="border-b border-rule">
            <Link href={it.href} onMouseEnter={() => setActive(i)} onFocus={() => setActive(i)} className="group grid grid-cols-[1fr_auto] items-start gap-x-6 py-6">
              <span>
                {it.meta && <span className="mb-1 block text-[0.9rem] font-semibold text-muted">{it.meta}</span>}
                <span className={`block text-[clamp(1.5rem,2.7vw,2.25rem)] font-extrabold leading-[1.08] [font-variation-settings:'wdth'_86] transition-colors ${active === i ? "text-purple" : ""}`}>{it.title}</span>
                <span className="reading mt-2 block text-muted">{it.summary}</span>
              </span>
              <ArrowUpRight aria-hidden className={`mt-1 size-7 transition-all ${active === i ? "text-purple" : "text-muted"} group-hover:translate-x-0.5 group-hover:-translate-y-0.5`} />
            </Link>
          </li>
        ))}
      </ul>
      <div className="relative hidden lg:block" aria-hidden>
        <div className="sticky top-28 aspect-[4/5] overflow-hidden bg-paper-2">
          {items.map((it, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={it.href} src={it.photo.small} alt="" loading={i < 2 ? "eager" : "lazy"} decoding="async" className={`absolute inset-0 size-full object-cover transition-opacity duration-300 ${active === i ? "opacity-100" : "opacity-0"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

export type Quote = { name: string; role: string; quote: string; photo?: string };

/** One story at a time, large, with the names to choose from beside it. */
export function QuoteSwitcher({ stories }: { stories: Quote[] }) {
  const [i, setI] = useState(0);
  const s = stories[i];
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] lg:gap-20">
      <figure id="story-panel" role="tabpanel" aria-live="polite">
        <blockquote className="font-serif text-[clamp(1.3rem,2.1vw,1.7rem)] leading-[1.5]">“{s.quote}”</blockquote>
        <figcaption className="mt-6"><span className="font-bold">{s.name}</span><span className="text-muted">, {s.role}</span></figcaption>
      </figure>
      <div role="tablist" aria-label="Choose a story" aria-orientation="vertical" className="border-t border-rule">
        {stories.map((x, n) => (
          <button key={x.name} type="button" role="tab" aria-selected={n === i} aria-controls="story-panel" onClick={() => setI(n)} className={`flex min-h-14 w-full items-center gap-3 border-b border-rule py-2 text-left transition-colors ${n === i ? "text-purple" : "text-muted hover:text-ink"}`}>
            {x.photo ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={x.photo} alt="" loading="lazy" className="size-10 shrink-0 rounded-sm object-cover" /> : <span className="size-10 shrink-0 bg-paper-2" />}
            <span><span className="block font-semibold leading-tight">{x.name}</span><span className="block text-[0.85rem] leading-tight">{x.role}</span></span>
          </button>
        ))}
      </div>
    </div>
  );
}
