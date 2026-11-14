import Link from "next/link";
import PageHero from "./PageHero";
import Blocks from "./Blocks";
import CareDesk from "./CareDesk";
import { Section } from "./ui";
import Reveal from "./Reveal";
import { site } from "@/content/site";
import type { PageDoc, SiteSettings } from "@/lib/types";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";

const CARE_PAGES = new Set(["international-faith-chapel", "counselling"]);

type Props = { page: PageDoc; section: { label: string; href: string }; siblings: PageDoc[]; settings: SiteSettings };

/** One template for every ministry and programme page. */
export default function PageView({ page, section, siblings, settings }: Props) {
  const currentIndex = Math.max(0, siblings.findIndex((s) => s.slug === page.slug));
  const previous = siblings[(currentIndex - 1 + siblings.length) % siblings.length];
  const next = siblings[(currentIndex + 1) % siblings.length];
  const sectionNoun = section.label === "Ministries" ? "ministry" : "programme";
  return (
    <>
      <PageHero title={page.title} tagline={page.tagline} image={page.hero} badge={page.audience} crumbs={[{ label: section.label, href: section.href }, { label: page.title }]} actions={page.actions} />

      {page.intro.length > 0 && (
        <Section>
          <Reveal className="ml-auto grid max-w-5xl gap-6 lg:w-7/12">
            <div className="grid gap-6">
              <p className="t-lead">{page.intro[0]}</p>
              {page.intro.slice(1).map((p) => <p key={p.slice(0, 24)} className="reading text-muted">{p}</p>)}
            </div>
          </Reveal>
        </Section>
      )}

      <Blocks blocks={page.blocks} />

      {CARE_PAGES.has(page.slug) && <CareDesk whatsapp={site.whatsapp} email={settings.contact.email} />}

      <Section tone="deep" tight>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="t-h2">Keep exploring</h2>
          <Link href={section.href} className="inline-flex min-h-11 items-center gap-2 font-semibold text-on-purple underline underline-offset-4 hover:text-gold">All {section.label.toLowerCase()} <ArrowUpRight className="size-4" aria-hidden /></Link>
        </div>
        {siblings.length > 1 && (
          <nav aria-label={`${section.label} navigation`} className="mt-5 grid border-y border-on-purple/25 sm:grid-cols-2 sm:divide-x sm:divide-on-purple/25">
            <Link href={`${section.href}/${previous.slug}`} className="group flex min-h-20 items-center justify-between gap-4 py-4 sm:pr-8">
              <span className="min-w-0"><span className="block text-sm text-on-purple-muted">Previous {sectionNoun}</span><span className="mt-1 block text-lg font-bold group-hover:underline group-hover:underline-offset-4">{previous.title}</span></span>
              <ArrowLeft className="size-5 shrink-0 text-on-purple-muted transition-transform group-hover:-translate-x-1" aria-hidden />
            </Link>
            <Link href={`${section.href}/${next.slug}`} className="group flex min-h-20 items-center justify-between gap-4 border-t border-on-purple/25 py-4 sm:border-t-0 sm:pl-8">
              <span className="min-w-0"><span className="block text-sm text-on-purple-muted">Next {sectionNoun}</span><span className="mt-1 block text-lg font-bold group-hover:underline group-hover:underline-offset-4">{next.title}</span></span>
              <ArrowRight className="size-5 shrink-0 text-on-purple-muted transition-transform group-hover:translate-x-1" aria-hidden />
            </Link>
          </nav>
        )}
        <p className="mt-5 text-on-purple-muted">Questions about {page.title}? Call <a className="font-semibold text-on-purple underline underline-offset-4" href={`tel:${settings.contact.phones[0]?.tel}`}>{settings.contact.phones[0]?.display}</a> or <Link className="font-semibold text-on-purple underline underline-offset-4" href="/#visit">plan a visit</Link>.</p>
      </Section>
    </>
  );
}
