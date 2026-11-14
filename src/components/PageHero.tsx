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

/** Page opening: a clear introduction beside a real photo. Text never sits on the image. */
export default async function PageHero({ title, tagline, image: imageProp, focus: focusProp, slot, badge, crumbs = [], actions = [], compact = false }: Props) {
  const chosen = slot ? await getSlot(slot, imageProp) : { src: imageProp, focus: undefined };
  const image = chosen.src;
  const focus = chosen.focus ?? focusProp;
  return (
    <header className="bg-paper">
      <div className={`wrap grid items-center gap-7 ${image ? "lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14" : ""} ${compact ? "py-6 md:py-8" : "py-8 md:py-12"}`}>
        <div className="min-w-0">
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
          {badge && <p className="label rise mt-4">{badge}</p>}
          <h1 className={`${compact ? "t-h2" : "t-h1"} rise ${badge ? "mt-2" : "mt-4"} max-w-[20ch]`} style={{ "--d": ".05s" } as CSSProperties}>{title}</h1>
          {(tagline || actions.length > 0) && (
            <div className={`rise ${compact ? "mt-3" : "mt-5"} grid gap-5`} style={{ "--d": ".15s" } as CSSProperties}>
              {tagline && <p className={compact ? "reading text-lg text-muted" : "t-lead max-w-[42ch] text-muted"}>{tagline}</p>}
              {actions.length > 0 && <div className="flex flex-wrap gap-3">{actions.map((a, i) => <Button key={a.label} href={a.href} external={a.external} variant={i === 0 ? "gold" : "outline"}>{a.label}</Button>)}</div>}
            </div>
          )}
        </div>
        {image && (
          <div className="relative aspect-[16/10] min-w-0 overflow-hidden bg-paper-2 lg:aspect-[4/3]">
            <Img cover priority src={image} alt="" sizes="(min-width:1024px) 48vw, 100vw" focus={focus} />
          </div>
        )}
      </div>
    </header>
  );
}
