import { NextResponse } from "next/server";
import { getUser, log, sameOrigin } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { ImmichError, setImmichPhotoArchived } from "@/lib/immich";

export const runtime = "nodejs";
export const maxDuration = 30;

const headers = { "Cache-Control": "no-store" };
const idPattern = /^[\da-f]{8}-[\da-f]{4}-[1-8][\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i;

export async function POST(req: Request) {
  const user = await getUser();
  if (!user || !can(user, "media")) return NextResponse.json({ error: "You do not have access to the photo library." }, { status: 403, headers });
  if (!(await sameOrigin(req))) return NextResponse.json({ error: "That request did not come from this site." }, { status: 403, headers });
  try {
    const body = (await req.json()) as { id?: unknown; isArchived?: unknown };
    const id = typeof body.id === "string" ? body.id : "";
    if (!idPattern.test(id) || typeof body.isArchived !== "boolean") {
      return NextResponse.json({ error: "Choose a photo and an archive setting." }, { status: 400, headers });
    }
    await setImmichPhotoArchived(id, body.isArchived);
    await log(user, body.isArchived ? "Archived a photo" : "Returned a photo to the library");
    return NextResponse.json({ ok: true }, { headers });
  } catch (error) {
    const message = error instanceof ImmichError && error.kind === "not_configured"
      ? "The photo archive is not connected yet. Ask the site administrator to connect it."
      : "That change could not be saved. Check that the archive key allows photo updates.";
    const status = error instanceof ImmichError && error.kind === "not_configured" ? 503 : 502;
    return NextResponse.json({ error: message }, { status, headers });
  }
}
