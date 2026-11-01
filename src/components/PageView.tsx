import Link from "next/link";
import PageHero from "./PageHero";
import Blocks from "./Blocks";
import CareDesk from "./CareDesk";
import { Section } from "./ui";
import Reveal from "./Reveal";
import { site } from "@/content/site";
import type { PageDoc, SiteSettings } from "@/lib/types";

const CARE_PAGES = new Set(["international-faith-chapel", "counselling"]);

type Props = { page: PageDoc; section: { label: string; href: string }; siblings: PageDoc[]; settings: SiteSettings };

/** One template for every ministry and programme page. */
export default function PageView({ page, section, siblings, settings }: Props) {
  const others = siblings.filter((s) => s.slug !== page.slug);
  return (
    <>
      <PageHero title={page.title} tagline={page.tagline} image={page.hero} badge={page.audience} crumbs={[{ label: section.label, href: section.href }, { label: page.title }]} actions={page.actions} />

      {page.intro.length > 0 && (
        <Section>
          <Reveal className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
            <div />
            <div className="grid gap-6">
              <p className="t-lead">{page.intro[0]}</p>
              {page.intro.slice(1).map((p) => <p key={p.slice(0, 24)} className="reading text-muted">{p}</p>)}
            </div>
          </Reveal>
        </Section>
      )}

      <Blocks blocks={page.blocks} />

      {CARE_PAGES.has(page.slug) && <CareDesk whatsapp={site.whatsapp} email={settings.contact.email} />}

      <Section tone="deep">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
          <header><h2 className="t-h2">More {section.label.toLowerCase()}</h2><Link href={section.href} className="mt-4 inline-flex min-h-11 items-center font-semibold text-gold underline underline-offset-[6px]">See all {section.label.toLowerCase()}</Link></header>
          <ul className="border-t border-on-purple/25">
            {others.map((o) => (
              <li key={o.slug} className="border-b border-on-purple/25">
                <Link href={`${section.href}/${o.slug}`} className="group flex items-baseline justify-between gap-6 py-4">
                  <span className="text-xl font-bold group-hover:underline group-hover:underline-offset-4">{o.title}</span>
                  {o.audience && <span className="hidden text-right text-[0.95rem] text-on-purple-muted sm:block">{o.audience}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-12 text-on-purple-muted">Questions about {page.title}? Call <a className="font-semibold text-on-purple underline underline-offset-4" href={`tel:${settings.contact.phones[0]?.tel}`}>{settings.contact.phones[0]?.display}</a> or <Link className="font-semibold text-on-purple underline underline-offset-4" href="/#visit">plan a visit</Link>.</p>
      </Section>
    </>
  );
}
