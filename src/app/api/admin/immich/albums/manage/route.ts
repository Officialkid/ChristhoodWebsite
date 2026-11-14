import { NextResponse } from "next/server";
import { getUser, log, sameOrigin } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { changeImmichAlbumPhotos, ImmichError } from "@/lib/immich";

export const runtime = "nodejs";
export const maxDuration = 30;

const headers = { "Cache-Control": "no-store" };
const idPattern = /^[\da-f]{8}-[\da-f]{4}-[1-8][\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i;

export async function POST(req: Request) {
  const user = await getUser();
  if (!user || !can(user, "media")) return NextResponse.json({ error: "You do not have access to the photo library." }, { status: 403, headers });
  if (!(await sameOrigin(req))) return NextResponse.json({ error: "That request did not come from this site." }, { status: 403, headers });
  try {
    const body = (await req.json()) as { albumId?: unknown; assetIds?: unknown; action?: unknown };
    const albumId = typeof body.albumId === "string" ? body.albumId : "";
    const assetIds = Array.isArray(body.assetIds) ? body.assetIds.filter((id): id is string => typeof id === "string") : [];
    const action = body.action === "remove" ? "remove" : body.action === "add" ? "add" : null;
    if (!idPattern.test(albumId) || !action || !assetIds.length || assetIds.length > 100 || assetIds.some((id) => !idPattern.test(id))) {
      return NextResponse.json({ error: "Choose an album and one or more photos." }, { status: 400, headers });
    }
    await changeImmichAlbumPhotos(albumId, assetIds, action);
    await log(user, action === "add" ? "Added photos to an album" : "Removed photos from an album");
    return NextResponse.json({ ok: true }, { headers });
  } catch (error) {
    const message = error instanceof ImmichError && error.kind === "not_configured"
      ? "The photo archive is not connected yet. Ask the site administrator to connect it."
      : "The album could not be updated. Check the archive key's album permissions.";
    const status = error instanceof ImmichError && error.kind === "not_configured" ? 503 : 502;
    return NextResponse.json({ error: message }, { status, headers });
  }
}
