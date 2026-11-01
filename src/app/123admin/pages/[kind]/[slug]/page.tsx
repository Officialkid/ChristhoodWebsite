import { notFound } from "next/navigation";
import { requirePerm } from "@/lib/auth";
import { getMinistry, getProgramme } from "@/lib/content";
import { store } from "@/lib/store";
import { pageIcon } from "@/components/icons";
import PageForm from "@/components/admin/PageForm";
import { Notice, PageTitle } from "@/components/admin/ui";

export const metadata = { title: "Edit page" };

export default async function PageEditor({ params }: { params: Promise<{ kind: string; slug: string }> }) {
  const { kind, slug } = await params;
  if (kind !== "ministry" && kind !== "programme") notFound();
  await requirePerm(`page:${kind}/${slug}`);
  const page = kind === "ministry" ? await getMinistry(slug) : await getProgramme(slug);
  if (!page) notFound();
  const base = kind === "ministry" ? "ministries" : "programmes";
  return (
    <>
      <PageTitle title={page.title} icon={pageIcon[slug] ?? "church"} crumbs={[{ label: "Pages", href: "/123admin/pages" }, { label: page.title }]} />
      <div className="mt-8 grid gap-6">
        {!store.writable && <Notice tone="warn" title="Saving is not switched on yet">You can look around, but changes cannot be saved until the database is connected.</Notice>}
        <PageForm key={`${kind}/${slug}`} page={page} publicHref={`/${base}/${slug}`} />
      </div>
    </>
  );
}
