"use client";

import Link from "next/link";
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
import { Icon } from "./icons";

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
                <span className={`flex items-center gap-3 text-[clamp(1.5rem,2.7vw,2.25rem)] font-extrabold leading-[1.08] [font-variation-settings:'wdth'_86] transition-colors ${active === i ? "text-purple" : ""}`}><Icon name={it.icon} className="size-[0.8em] shrink-0 text-purple" /><span>{it.title}</span></span>
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

/** One story at a time, large, with an auto-rotating carousel and a member count badge popup. */
export function QuoteSwitcher({ stories }: { stories: Quote[] }) {
  const [i, setI] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-rotate every 8 seconds unless hovered/interacted with
  useEffect(() => {
    if (stories.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setI((prev) => (prev + 1) % stories.length);
    }, 8000);

    return () => clearInterval(timer);
  }, [stories.length, isPaused]);

  const s = stories[i];

  return (
    <div 
      className="grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] lg:gap-20"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <figure id="story-panel" role="tabpanel" aria-live="polite">
        <blockquote className="font-serif text-[clamp(1.3rem,2.1vw,1.7rem)] leading-[1.5] transition-all duration-300">
          “{s.quote}”
        </blockquote>
        <figcaption className="mt-6 flex items-center justify-between">
          <div>
            <span className="font-bold">{s.name}</span>
            <span className="text-muted">, {s.role}</span>
          </div>
          {/* Popup / Badge showing total member stories */}
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-purple/10 px-3 py-1 text-xs font-semibold text-purple">
            <span className="size-1.5 rounded-full bg-purple animate-pulse" />
            {stories.length} Member Testimonies
          </span>
        </figcaption>
      </figure>
      
      <div className="flex flex-col">
        {/* Mobile / general counter badge */}
        <div className="mb-3 flex items-center justify-between sm:hidden">
          <span className="text-sm font-semibold text-muted">Testimony List</span>
          <span className="rounded-full bg-purple/10 px-2.5 py-0.5 text-xs font-semibold text-purple">
            {stories.length} stories
          </span>
        </div>

        <div role="tablist" aria-label="Choose a story" aria-orientation="vertical" className="border-t border-rule">
          {stories.map((x, n) => (
            <button
              key={x.name}
              type="button"
              role="tab"
              aria-selected={n === i}
              aria-controls="story-panel"
              onClick={() => {
                setI(n);
                setIsPaused(true);
              }}
              className={`flex min-h-14 w-full items-center gap-3 border-b border-rule py-2 text-left transition-colors ${
                n === i ? "text-purple font-medium" : "text-muted hover:text-ink"
              }`}
            >
              {x.photo ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={x.photo} alt="" loading="lazy" className="size-10 shrink-0 rounded-sm object-cover" />
              ) : (
                <span className="size-10 shrink-0 bg-paper-2 flex items-center justify-center font-bold text-purple">
                  {x.name[0]}
                </span>
              )}
              <span className="min-w-0">
                <span className={`block leading-tight truncate ${n === i ? "font-bold text-purple" : "font-semibold"}`}>
                  {x.name}
                </span>
                <span className="block text-[0.85rem] leading-tight truncate text-muted">{x.role}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}