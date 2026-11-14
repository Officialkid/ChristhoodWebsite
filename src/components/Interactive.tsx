"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ArrowUpRight, Check, Copy, Play } from "lucide-react";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Counter from "yet-another-react-lightbox/plugins/counter";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import "yet-another-react-lightbox/plugins/counter.css";

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

/** A row of photos. Tap one to see it large, then swipe, zoom or move through with the arrows or keys. */
export function Gallery({ title, photos }: { title: string; photos: GalleryPhoto[] }) {
  const [open, setOpen] = useState(-1);
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
      <Lightbox
        open={open >= 0}
        index={open}
        close={() => setOpen(-1)}
        slides={photos.map((p) => ({ src: p.full, width: p.w, height: p.h, alt: "" }))}
        plugins={[Zoom, Thumbnails, Counter]}
        carousel={{ finite: false }}
        controller={{ closeOnBackdropClick: true }}
        styles={{ container: { backgroundColor: "rgba(20, 8, 40, 0.94)" } }}
        labels={{ Close: "Close", Previous: "Previous photo", Next: "Next photo" }}
      />
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

export type DirItem = { href: string; title: string; meta?: string; summary: string; photo: GalleryPhoto; icon?: string };

/** Every department stays visible as a clear row, with its own photo at every screen size. */
export function DirectoryView({ items }: { items: DirItem[] }) {
  return (
    <ul className="border-t border-rule">
        {items.map((it, i) => (
          <li key={it.href} className="border-b border-rule">
            <Link href={it.href} className="group grid min-h-24 grid-cols-[minmax(0,1fr)_5.25rem_1.25rem] items-center gap-3 py-4 sm:grid-cols-[2.5rem_minmax(0,1fr)_7.5rem_1.5rem] sm:gap-5 sm:py-5">
              <span aria-hidden="true" className="hidden text-[0.9rem] font-semibold tabular-nums text-purple sm:block">{String(i + 1).padStart(2, "0")}</span>
              <span className="min-w-0">
                {it.meta && <span className="mb-1 block text-[0.9rem] font-semibold text-muted">{it.meta}</span>}
                <span className="block text-[1.2rem] font-extrabold leading-tight [font-variation-settings:'wdth'_86] group-hover:text-purple group-hover:underline group-hover:underline-offset-4 sm:text-[1.45rem]">{it.title}</span>
                <span className="reading mt-1 block text-[0.98rem] text-muted">{it.summary}</span>
              </span>
              <span className="relative block aspect-[4/3] overflow-hidden bg-paper-2">
                <Image src={it.photo.small} alt="" fill sizes="(min-width:640px) 120px, 84px" className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
              </span>
              <ArrowUpRight aria-hidden className="size-5 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-purple" />
            </Link>
          </li>
        ))}
    </ul>
  );
}

export type Quote = { name: string; role: string; quote: string; photo?: string };

/** One story at a time, large, with the names to choose from beside it. */
export function QuoteSwitcher({ stories }: { stories: Quote[] }) {
  const [i, setI] = useState(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  if (!stories.length) return <p className="reading text-muted">No stories are available right now.</p>;
  const s = stories[i];
  const onTabKeyDown = (event: React.KeyboardEvent<HTMLDivElement>, current: number) => {
    let next: number | undefined;
    if (event.key === "ArrowDown" || event.key === "ArrowRight") next = (current + 1) % stories.length;
    if (event.key === "ArrowUp" || event.key === "ArrowLeft") next = (current - 1 + stories.length) % stories.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = stories.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    setI(next);
    tabRefs.current[next]?.focus();
  };
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] lg:gap-20">
      <figure id="story-panel" role="tabpanel" aria-labelledby={`story-tab-${i}`} aria-live="polite" tabIndex={0}>
        <blockquote className="font-serif text-[clamp(1.3rem,2.1vw,1.7rem)] leading-[1.5]">“{s.quote}”</blockquote>
        <figcaption className="mt-6"><span className="font-bold">{s.name}</span><span className="text-muted">, {s.role}</span></figcaption>
      </figure>
      <div role="tablist" aria-label="Choose a story" aria-orientation="vertical" onKeyDown={(event) => onTabKeyDown(event, i)} className="border-t border-rule">
        {stories.map((x, n) => (
          <button key={x.name} ref={(el) => { tabRefs.current[n] = el; }} id={`story-tab-${n}`} type="button" role="tab" aria-selected={n === i} aria-controls="story-panel" tabIndex={n === i ? 0 : -1} onClick={() => setI(n)} className={`flex min-h-14 w-full items-center gap-3 border-b border-rule py-2 text-left transition-colors ${n === i ? "text-purple" : "text-muted hover:text-ink"}`}>
            {x.photo ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={x.photo} alt="" loading="lazy" className="size-10 shrink-0 rounded-sm object-cover" /> : <span className="size-10 shrink-0 bg-paper-2" />}
            <span><span className="block font-semibold leading-tight">{x.name}</span><span className="block text-[0.85rem] leading-tight">{x.role}</span></span>
          </button>
        ))}
      </div>
    </div>
  );
}
