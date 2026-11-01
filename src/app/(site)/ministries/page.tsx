import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import Directory from "@/components/Directory";
import { Button, Section } from "@/components/ui";
import { getMinistries } from "@/lib/content";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Ministries & departments",
  description: "Worship, missions, counselling, media, men's and ladies' ministries, and the teams that make every gathering possible. Find where you fit at Christhood.",
  alternates: { canonical: "/ministries" },
};

export default async function MinistriesPage() {
  const ministries = await getMinistries();
  return (
    <>
      <PageHero slot="ministries.hero" title="Ministries & departments" tagline="At Christhood, we believe in the power of mentorship. Join us and let us walk with you as your spirituality grows and flourishes." crumbs={[{ label: "Ministries" }]} />
      <Section tone="alt"><Directory pages={ministries} base="/ministries" showAudience /></Section>
      <Section tone="purple" tight>
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div><h2 className="t-h2">Not sure where to start?</h2><p className="t-lead mt-3 text-on-purple-muted">Come on Saturday. Our team will help you find the right place to grow and serve.</p></div>
          <Button href="/#visit">Plan your visit</Button>
        </div>
      </Section>
    </>
  );
}
