import { NextResponse } from "next/server";
import { getUser, sameOrigin } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { mediaDb } from "@/lib/media";
import { ImmichError, searchImmichPhotos } from "@/lib/immich";

export const runtime = "nodejs";
export const maxDuration = 30;

const headers = { "Cache-Control": "no-store" };

export async function POST(req: Request) {
  const user = await getUser();
  if (!user || !can(user, "media")) return NextResponse.json({ error: "You do not have access to the photo library." }, { status: 403, headers });
  if (!(await sameOrigin(req))) return NextResponse.json({ error: "That request did not come from this site." }, { status: 403, headers });
  try {
    const body = (await req.json()) as { query?: unknown };
    const query = typeof body.query === "string" ? body.query.trim().slice(0, 160) : "";
    if (query.length < 2) return NextResponse.json({ error: "Describe the photo you are looking for." }, { status: 400, headers });

    const [photos, saved] = await Promise.all([
      searchImmichPhotos(query),
      mediaDb.list().catch(() => []),
    ]);
    const imported = new Set(saved.map((item) => item.sourceAssetId).filter((id): id is string => Boolean(id)));
    return NextResponse.json({
      items: photos.map((photo) => ({
        ...photo,
        thumbnail: "/api/admin/immich/thumbnail/" + encodeURIComponent(photo.id),
        imported: imported.has(photo.id),
      })),
    }, { headers });
  } catch (error) {
    const message = error instanceof ImmichError && error.kind === "not_configured"
      ? "The photo search connection is not set up yet."
      : "Immich could not be reached. Check the server address and access key.";
    const status = error instanceof ImmichError && error.kind === "not_configured" ? 503 : 502;
    return NextResponse.json({ error: message }, { status, headers });
  }
}
