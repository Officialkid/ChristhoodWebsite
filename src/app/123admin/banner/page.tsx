import { requirePerm } from "@/lib/auth";
import { store } from "@/lib/store";
import type { BannerDoc } from "@/lib/content";
import { BannerForm } from "@/components/admin/ContentForms";
import { PageTitle } from "@/components/admin/ui";

export const metadata = { title: "Announcement bar" };

export default async function BannerPage() {
  await requirePerm("banner");
  const banner = await store.getDoc<BannerDoc>("banner").catch(() => null);
  return (
    <>
      <PageTitle title="Announcement bar" icon="megaphone" lead="A short message across the top of every page. Good for registration opening, a special service or a change of venue." />
      <div className="mt-8"><BannerForm banner={banner} /></div>
    </>
  );
}
