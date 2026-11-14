import { NextResponse } from "next/server";
import { can } from "@/lib/rbac";
import { getUser, log, sameOrigin } from "@/lib/auth";
import { getCloudinaryAsset, isChristhoodFolder, isCloudinaryConfigured } from "@/lib/cloudinary";
import { saveCloudinaryReference } from "@/lib/media";
import { StorageUnavailable, store } from "@/lib/store";
import { publish } from "@/lib/publish";

export const runtime = "nodejs";
export const maxDuration = 30;

const headers = { "Cache-Control": "no-store" };
const assetIdPattern = /^[a-f\d-]{32,64}$/i;

export async function POST(request: Request) {
  const user = await getUser();
  if (!user || !can(user, "media")) return NextResponse.json({ error: "You do not have access to the photo library." }, { status: 403, headers });
  if (!(await sameOrigin(request))) return NextResponse.json({ error: "That request did not come from this site." }, { status: 403, headers });
  if (!store.writable) return NextResponse.json({ error: "Photo saving is not switched on yet. Connect the database in System status." }, { status: 503, headers });
  if (!isCloudinaryConfigured()) return NextResponse.json({ error: "The website photo library is not connected yet." }, { status: 503, headers });

  try {
    const body = (await request.json()) as { assetId?: unknown };
    const assetId = typeof body.assetId === "string" ? body.assetId : "";
    if (!assetIdPattern.test(assetId)) return NextResponse.json({ error: "Choose a photo from the Christhood library." }, { status: 400, headers });
    const asset = await getCloudinaryAsset(assetId);
    if (!isChristhoodFolder(asset.folder)) return NextResponse.json({ error: "That photo is outside the Christhood library." }, { status: 404, headers });
    const item = await saveCloudinaryReference(asset, user.name);
    await log(user, "Added a photo to the website library", item.name);
    publish();
    return NextResponse.json({ item }, { headers });
  } catch (error) {
    if (error instanceof StorageUnavailable) return NextResponse.json({ error: error.message }, { status: 503, headers });
    return NextResponse.json({ error: "The photo could not be added. Try again." }, { status: 502, headers });
  }
}
