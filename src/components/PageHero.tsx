import Link from "next/link";
import type { CSSProperties } from "react";
import Img from "./Img";
import { Button } from "./ui";
import { getSlot } from "@/lib/content";

type Props = {
  title: string;
  tagline?: string;
  /** A photo shown below the heading. Leave out for pages that mostly list things. */
  image?: string;
  focus?: string;
  /** The place on the site this picture belongs to. The team can swap it in the admin area. */
  slot?: string;
  badge?: string;
  crumbs?: { label: string; href?: string }[];
  actions?: { label: string; href: string; external?: boolean }[];
  /** For pages where the job below matters more than the heading, such as a form: tighter space and a smaller title. */
  compact?: boolean;
};

/** Page opening: words first, then a clean photo. No text sits on top of an image. */
export default async function PageHero({ title, tagline, image: imageProp, focus: focusProp, slot, badge, crumbs = [], actions = [], compact = false }: Props) {
  const chosen = slot ? await getSlot(slot, imageProp) : { src: imageProp, focus: undefined };
  const image = chosen.src;
  const focus = chosen.focus ?? focusProp;
  return (
    <header className="bg-paper">
      <div className={`wrap ${compact ? "pb-6 pt-4 md:pb-8 md:pt-6" : "pb-10 pt-10 md:pb-14 md:pt-14"}`}>
        {crumbs.length > 0 && (
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-x-2 text-[0.9rem] text-muted">
              <li><Link href="/" className="inline-flex min-h-11 items-center underline-offset-4 hover:text-purple hover:underline">Home</Link></li>
              {crumbs.map((c) => (
                <li key={c.label} className="flex items-center gap-2"><span aria-hidden>/</span>{c.href ? <Link href={c.href} className="inline-flex min-h-11 items-center underline-offset-4 hover:text-purple hover:underline">{c.label}</Link> : <span aria-current="page" className="text-ink">{c.label}</span>}</li>
              ))}
            </ol>
          </nav>
        )}
        {badge && <p className="label rise mt-8">{badge}</p>}
        <h1 className={`${compact ? "t-h2" : "t-h1"} rise ${badge ? "mt-2" : compact ? "mt-3" : "mt-8"} ${compact ? "max-w-[28ch]" : "max-w-[20ch]"}`} style={{ "--d": ".05s" } as CSSProperties}>{title}</h1>
        {(tagline || actions.length > 0) && (
          <div className={`rise ${compact ? "mt-3" : "mt-7"} grid gap-6 md:grid-cols-[minmax(0,40rem)_auto] md:items-end md:justify-start md:gap-x-16`} style={{ "--d": ".15s" } as CSSProperties}>
            {tagline ? <p className={compact ? "reading text-lg text-muted" : "t-lead text-muted"}>{tagline}</p> : <span />}
            {actions.length > 0 && <div className="flex flex-wrap gap-3">{actions.map((a, i) => <Button key={a.label} href={a.href} external={a.external} variant={i === 0 ? "gold" : "outline"}>{a.label}</Button>)}</div>}
          </div>
        )}
      </div>
      {image && (
        <div className="wrap">
          <div className="relative aspect-[4/3] overflow-hidden bg-paper-2 sm:aspect-[16/9] md:aspect-[2.35/1]"><Img cover priority src={image} alt="" sizes="(min-width:1536px) 1900px, (min-width:1280px) 1248px, 100vw" focus={focus} /></div>
        </div>
      )}
    </header>
  );
}
