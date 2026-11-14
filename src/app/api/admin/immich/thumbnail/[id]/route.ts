import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { getImmichThumbnail, ImmichError } from "@/lib/immich";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const idPattern = /^[\da-f]{8}-[\da-f]{4}-[1-8][\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i;

export async function GET(_req: Request, ctx: RouteContext<"/api/admin/immich/thumbnail/[id]">) {
  const user = await getUser();
  if (!user || !can(user, "media")) return NextResponse.json({ error: "Please sign in." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  const { id } = await ctx.params;
  if (!idPattern.test(id)) return NextResponse.json({ error: "That photo could not be found." }, { status: 404 });

  try {
    const response = await getImmichThumbnail(id);
    const type = response.headers.get("content-type")?.split(";")[0].trim().toLowerCase() ?? "";
    if (!type.startsWith("image/") || type === "image/svg+xml") return NextResponse.json({ error: "That photo could not be previewed." }, { status: 502 });
    const data = await response.arrayBuffer();
    if (data.byteLength > 5_000_000) return NextResponse.json({ error: "That preview is too large." }, { status: 502 });
    return new Response(data, {
      headers: {
        "Content-Type": type,
        "Content-Length": data.byteLength.toString(),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const status = error instanceof ImmichError && error.kind === "not_found" ? 404 : 502;
    return NextResponse.json({ error: "That photo preview could not be loaded." }, { status, headers: { "Cache-Control": "no-store" } });
  }
}
