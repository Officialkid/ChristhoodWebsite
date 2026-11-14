import { requirePerm } from "@/lib/auth";
import { mediaDb, photoHost } from "@/lib/media";
import { store } from "@/lib/store";
import { getImmichWebUrl, isImmichConfigured } from "@/lib/immich";
import { isCloudinaryConfigured } from "@/lib/cloudinary";
import MediaLibrary from "@/components/admin/MediaLibrary";
import { Notice, PageTitle } from "@/components/admin/ui";

export const metadata = { title: "Photo library" };

export default async function MediaPage() {
  await requirePerm("media");
  const items = (await mediaDb.list().catch(() => [])).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <>
      <PageTitle title="Photo library" icon="images" lead="Browse the church photo archive, find pictures by description, and prepare the ones you need for the website." />
      <div className="mt-8 grid gap-6">
        {!store.writable && <Notice tone="warn" title="Saving is not switched on yet">Uploads need the database. Connect it in the hosting settings (see System status).</Notice>}
        <MediaLibrary
          items={items}
          host={photoHost}
          immichConfigured={isImmichConfigured()}
          immichWebUrl={getImmichWebUrl()}
          cloudinaryConfigured={isCloudinaryConfigured()}
          canSave={store.writable}
        />
      </div>
    </>
  );
}
