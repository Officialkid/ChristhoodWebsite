import { requirePerm } from "@/lib/auth";
import { mediaDb, photoHost } from "@/lib/media";
import { store } from "@/lib/store";
import MediaLibrary from "@/components/admin/MediaLibrary";
import { Notice, PageTitle } from "@/components/admin/ui";

export const metadata = { title: "Photo library" };

export default async function MediaPage() {
  await requirePerm("media");
  const items = (await mediaDb.list().catch(() => [])).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <>
      <PageTitle title="Photo library" icon="images" lead="Upload the media team's photos here. Each one is brightened, balanced and sharpened, and small ones are enlarged, so nothing looks like it came from a poor camera." />
      <div className="mt-8 grid gap-6">
        {!store.writable && <Notice tone="warn" title="Saving is not switched on yet">Uploads need the database. Connect it in the hosting settings (see System status).</Notice>}
        <MediaLibrary items={items} host={photoHost} />
      </div>
    </>
  );
}
