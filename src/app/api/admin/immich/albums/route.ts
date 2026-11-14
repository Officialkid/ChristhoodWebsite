import { NextResponse } from "next/server";
import { getUser, log, sameOrigin } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { ImmichError, createImmichAlbum, listImmichAlbums } from "@/lib/immich";

export const runtime = "nodejs";
export const maxDuration = 30;

const headers = { "Cache-Control": "no-store" };

export async function GET() {
  const user = await getUser();
  if (!user || !can(user, "media")) return NextResponse.json({ error: "You do not have access to the photo library." }, { status: 403, headers });
  try {
    const albums = await listImmichAlbums();
    return NextResponse.json({ albums: albums.map((album) => ({
      ...album,
      thumbnail: album.thumbnailAssetId ? "/api/admin/immich/thumbnail/" + encodeURIComponent(album.thumbnailAssetId) : null,
    })) }, { headers });
  } catch (error) {
    const message = error instanceof ImmichError && error.kind === "not_configured"
      ? "The photo archive is not connected yet. Ask the site administrator to connect it."
      : "Albums could not be loaded. Check the photo archive connection.";
    const status = error instanceof ImmichError && error.kind === "not_configured" ? 503 : 502;
    return NextResponse.json({ error: message }, { status, headers });
  }
}

export async function POST(req: Request) {
  const user = await getUser();
  if (!user || !can(user, "media")) return NextResponse.json({ error: "You do not have access to the photo library." }, { status: 403, headers });
  if (!(await sameOrigin(req))) return NextResponse.json({ error: "That request did not come from this site." }, { status: 403, headers });
  try {
    const body = (await req.json()) as { name?: unknown };
    const name = typeof body.name === "string" ? body.name.trim().slice(0, 120) : "";
    if (!name) return NextResponse.json({ error: "Give the album a name." }, { status: 400, headers });
    const album = await createImmichAlbum(name);
    await log(user, "Created a photo album", album.name);
    return NextResponse.json({ album }, { status: 201, headers });
  } catch (error) {
    const message = error instanceof ImmichError && error.kind === "not_configured"
      ? "The photo archive is not connected yet. Ask the site administrator to connect it."
      : "The album could not be created. Check that the archive key allows album changes.";
    const status = error instanceof ImmichError && error.kind === "not_configured" ? 503 : 502;
    return NextResponse.json({ error: message }, { status, headers });
  }
}
