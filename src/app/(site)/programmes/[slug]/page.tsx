import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageView from "@/components/PageView";
import { programmes } from "@/content/programmes";
import { getProgramme, getProgrammes, getSettings } from "@/lib/content";

export const revalidate = 60;
export const generateStaticParams = () => programmes.map((p) => ({ slug: p.slug }));

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await getProgramme((await params).slug);
  if (!page) return {};
  return { title: page.title, description: page.summary, alternates: { canonical: `/programmes/${page.slug}` } };
}

export default async function ProgrammePage({ params }: Props) {
  const { slug } = await params;
  const [page, all, settings] = await Promise.all([getProgramme(slug), getProgrammes(), getSettings()]);
  if (!page) notFound();
  return <PageView page={page} section={{ label: "Programmes", href: "/programmes" }} siblings={all} settings={settings} />;
}
