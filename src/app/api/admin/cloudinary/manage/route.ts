import { NextResponse } from "next/server";
import { can } from "@/lib/rbac";
import { getUser, log, sameOrigin } from "@/lib/auth";
import { getCloudinaryAsset, isChristhoodFolder, isCloudinaryConfigured, listCloudinaryFolders, updateCloudinaryAsset } from "@/lib/cloudinary";
import { mediaDb } from "@/lib/media";

export const runtime = "nodejs";
export const maxDuration = 30;

const headers = { "Cache-Control": "no-store" };
const assetIdPattern = /^[a-f\d-]{32,64}$/i;

export async function POST(request: Request) {
  const user = await getUser();
  if (!user || !can(user, "media")) return NextResponse.json({ error: "You do not have access to the photo library." }, { status: 403, headers });
  if (!(await sameOrigin(request))) return NextResponse.json({ error: "That request did not come from this site." }, { status: 403, headers });
  if (!isCloudinaryConfigured()) return NextResponse.json({ error: "The website photo library is not connected yet." }, { status: 503, headers });

  try {
    const body = (await request.json()) as { assetId?: unknown; folder?: unknown; name?: unknown; tags?: unknown };
    const assetId = typeof body.assetId === "string" ? body.assetId : "";
    if (!assetIdPattern.test(assetId)) return NextResponse.json({ error: "Choose a photo from the Christhood library." }, { status: 400, headers });
    const current = await getCloudinaryAsset(assetId);
    if (!isChristhoodFolder(current.folder)) return NextResponse.json({ error: "That photo is outside the Christhood library." }, { status: 404, headers });

    const update: { folder?: string; name?: string; tags?: string[] } = {};
    if (typeof body.folder === "string") {
      const folder = body.folder.trim();
      if (!isChristhoodFolder(folder) || !(await listCloudinaryFolders()).includes(folder)) {
        return NextResponse.json({ error: "Choose an existing Christhood folder." }, { status: 400, headers });
      }
      update.folder = folder;
    }
    if (typeof body.name === "string") update.name = body.name;
    if (typeof body.tags === "string") {
      const tags = body.tags.split(",").map((tag) => tag.trim()).filter(Boolean);
      if (tags.some((tag) => !/^[\p{L}\p{N}_-]{1,48}$/u.test(tag)) || tags.length > 20) {
        return NextResponse.json({ error: "Tags can use letters, numbers, dashes and underscores." }, { status: 400, headers });
      }
      update.tags = tags;
    }
    if (!Object.keys(update).length) return NextResponse.json({ error: "Choose a change to save." }, { status: 400, headers });

    const updated = await updateCloudinaryAsset(assetId, update);
    const siteItems = await mediaDb.list().catch(() => []);
    await Promise.all(siteItems
      .filter((item) => item.providerAssetId === assetId || item.providerId === updated.publicId)
      .map((item) => mediaDb.put({ ...item, name: updated.name.slice(0, 80), assetFolder: updated.folder })));
    await log(user, "Updated a photo in the website library", updated.name);
    return NextResponse.json({ asset: updated }, { headers });
  } catch {
    return NextResponse.json({ error: "The photo could not be updated. Try again." }, { status: 502, headers });
  }
}
