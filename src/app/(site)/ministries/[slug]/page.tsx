import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageView from "@/components/PageView";
import { ministries } from "@/content/ministries";
import { getMinistries, getMinistry, getSettings } from "@/lib/content";

export const revalidate = 60;
export const generateStaticParams = () => ministries.map((m) => ({ slug: m.slug }));

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await getMinistry((await params).slug);
  if (!page) return {};
  return { title: page.title, description: page.summary, alternates: { canonical: `/ministries/${page.slug}` } };
}

export default async function MinistryPage({ params }: Props) {
  const { slug } = await params;
  const [page, all, settings] = await Promise.all([getMinistry(slug), getMinistries(), getSettings()]);
  if (!page) notFound();
  return <PageView page={page} section={{ label: "Ministries", href: "/ministries" }} siblings={all} settings={settings} />;
}
