import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { mediaDb } from "@/lib/media";
import { ImmichError, listImmichPhotos } from "@/lib/immich";

export const runtime = "nodejs";
export const maxDuration = 30;

const headers = { "Cache-Control": "no-store" };
const idPattern = /^[\da-f]{8}-[\da-f]{4}-[1-8][\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i;

export async function GET(req: Request) {
  const user = await getUser();
  if (!user || !can(user, "media")) return NextResponse.json({ error: "You do not have access to the photo library." }, { status: 403, headers });

  const url = new URL(req.url);
  const rawView = url.searchParams.get("view");
  const view = rawView === "favorites" || rawView === "archive" || rawView === "album" ? rawView : "all";
  const albumId = url.searchParams.get("albumId") ?? "";
  if (view === "album" && !idPattern.test(albumId)) return NextResponse.json({ error: "Choose an album first." }, { status: 400, headers });
  const cursor = url.searchParams.get("cursor") ?? "";
  if (cursor.length > 500) return NextResponse.json({ error: "That page could not be loaded." }, { status: 400, headers });
  const page = Number(url.searchParams.get("page") ?? 1);
  if (!cursor && (!Number.isInteger(page) || page < 1 || page > 1000)) return NextResponse.json({ error: "That page could not be loaded." }, { status: 400, headers });

  try {
    const [{ items, nextPage }, saved] = await Promise.all([
      listImmichPhotos({ view, albumId, page, cursor: cursor || undefined }),
      mediaDb.list().catch(() => []),
    ]);
    const imported = new Set(saved.map((item) => item.sourceAssetId).filter((id): id is string => Boolean(id)));
    return NextResponse.json({
      items: items.map((photo) => ({
        ...photo,
        thumbnail: "/api/admin/immich/thumbnail/" + encodeURIComponent(photo.id),
        imported: imported.has(photo.id),
      })),
      nextPage,
    }, { headers });
  } catch (error) {
    const message = error instanceof ImmichError && error.kind === "not_configured"
      ? "The photo archive is not connected yet. Ask the site administrator to connect it."
      : "The photo archive could not be reached. Check its address and access key.";
    const status = error instanceof ImmichError && error.kind === "not_configured" ? 503 : 502;
    return NextResponse.json({ error: message }, { status, headers });
  }
}
