import { NextResponse } from "next/server";
import { can } from "@/lib/rbac";
import { getUser, log, sameOrigin } from "@/lib/auth";
import { deleteFromCloudinary, getCloudinaryAsset, isChristhoodFolder, isCloudinaryConfigured } from "@/lib/cloudinary";
import { mediaDb } from "@/lib/media";
import { store } from "@/lib/store";
import { publish } from "@/lib/publish";

export const runtime = "nodejs";
export const maxDuration = 30;

const headers = { "Cache-Control": "no-store" };
const assetIdPattern = /^[a-f\d-]{32,64}$/i;

export async function POST(request: Request) {
  const user = await getUser();
  if (!user || !can(user, "media")) return NextResponse.json({ error: "You do not have access to the photo library." }, { status: 403, headers });
  if (!(await sameOrigin(request))) return NextResponse.json({ error: "That request did not come from this site." }, { status: 403, headers });
  if (!store.writable) return NextResponse.json({ error: "Connect the database before removing a photo." }, { status: 503, headers });
  if (!isCloudinaryConfigured()) return NextResponse.json({ error: "The website photo library is not connected yet." }, { status: 503, headers });

  try {
    const body = (await request.json()) as { assetId?: unknown };
    const assetId = typeof body.assetId === "string" ? body.assetId : "";
    if (!assetIdPattern.test(assetId)) return NextResponse.json({ error: "Choose a photo from the Christhood library." }, { status: 400, headers });
    const asset = await getCloudinaryAsset(assetId);
    if (!isChristhoodFolder(asset.folder)) return NextResponse.json({ error: "That photo is outside the Christhood library." }, { status: 404, headers });
    await deleteFromCloudinary(asset.publicId);
    const siteItems = await mediaDb.list().catch(() => []);
    await Promise.all(siteItems
      .filter((item) => item.providerAssetId === assetId || item.providerId === asset.publicId)
      .map((item) => mediaDb.remove(item.id)));
    await log(user, "Removed a photo from the website library", asset.name);
    publish();
    return NextResponse.json({ deleted: true }, { headers });
  } catch {
    return NextResponse.json({ error: "The photo could not be removed. Try again." }, { status: 502, headers });
  }
}
