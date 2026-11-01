import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import Directory from "@/components/Directory";
import { Button, Section } from "@/components/ui";
import { getProgrammes } from "@/lib/content";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Programmes",
  description: "Jewels for ages 7–12, Teen Life for ages 13–19, Branch for high school leavers, Impact for university students, and iAct and Apologetics for believers.",
  alternates: { canonical: "/programmes" },
};

export default async function ProgrammesPage() {
  const programmes = await getProgrammes();
  return (
    <>
      <PageHero title="Programmes" tagline="Mentorship for every age. Each one is rooted in the Word and built around relationships, because mentoring is not another meeting. It is a relationship." crumbs={[{ label: "Programmes" }]} actions={[{ label: "See camps and events", href: "/events" }]} />
      <Section tone="alt"><Directory pages={programmes} base="/programmes" showAudience /></Section>
      <Section tone="purple" tight>
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div><h2 className="t-h2">Camps are open for registration</h2><p className="t-lead mt-3 text-on-purple-muted">Register a child, volunteer as a facilitator, or sponsor a camper.</p></div>
          <Button href="/events/register">Register now</Button>
        </div>
      </Section>
    </>
  );
}
