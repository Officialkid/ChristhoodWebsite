import { requireUser } from "@/lib/auth";
import { editablePages } from "@/lib/rbac";
import { pageIcon } from "@/components/icons";
import { Empty, PageTitle, Row } from "@/components/admin/ui";

export const metadata = { title: "Pages" };

export default async function PagesIndex() {
  const user = await requireUser();
  const pages = editablePages(user);
  const group = (kind: "ministry" | "programme") => pages.filter((p) => p.kind === kind);
  return (
    <>
      <PageTitle title={user.role === "admin" ? "Ministry and programme pages" : "My pages"} icon="church" lead="Change the wording, the main picture and the sections of a page. Changes show on the website straight away." />
      <div className="mt-8 grid gap-12">
        {pages.length === 0 && <Empty icon="church" title="No pages yet">Your administrator can give you a department to look after.</Empty>}
        {(["ministry", "programme"] as const).map((k) =>
          group(k).length ? (
            <section key={k} aria-labelledby={k}>
              <h2 id={k} className="text-2xl">{k === "ministry" ? "Ministries" : "Programmes"}</h2>
              <div className="mt-3 border-t border-rule">
                {group(k).map((p) => <Row key={p.slug} href={`/123admin/pages/${p.kind}/${p.slug}`} icon={pageIcon[p.slug] ?? "church"} title={p.title} meta={`/${k === "ministry" ? "ministries" : "programmes"}/${p.slug}`} />)}
              </div>
            </section>
          ) : null,
        )}
      </div>
    </>
  );
}
