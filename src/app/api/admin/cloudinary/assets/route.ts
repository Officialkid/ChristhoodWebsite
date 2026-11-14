import { NextResponse } from "next/server";
import { can } from "@/lib/rbac";
import { getUser } from "@/lib/auth";
import { isChristhoodFolder, isCloudinaryConfigured, listCloudinaryAssets } from "@/lib/cloudinary";

export const runtime = "nodejs";
export const maxDuration = 30;

const headers = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  const user = await getUser();
  if (!user || !can(user, "media")) return NextResponse.json({ error: "You do not have access to the photo library." }, { status: 403, headers });
  if (!isCloudinaryConfigured()) return NextResponse.json({ error: "The website photo library is not connected yet." }, { status: 503, headers });

  const params = new URL(request.url).searchParams;
  const folder = params.get("folder")?.trim() || process.env.CLOUDINARY_ASSET_FOLDER?.trim() || "christhood/media";
  const query = params.get("q")?.trim().slice(0, 100) || "";
  const cursor = params.get("cursor") || undefined;
  if (!isChristhoodFolder(folder)) return NextResponse.json({ error: "Choose a Christhood photo folder." }, { status: 400, headers });
  if (cursor && cursor.length > 512) return NextResponse.json({ error: "That photo page could not be opened." }, { status: 400, headers });

  try {
    return NextResponse.json(await listCloudinaryAssets(folder, query, cursor), { headers });
  } catch {
    return NextResponse.json({ error: "Photos could not be loaded. Check the folder and try again." }, { status: 502, headers });
  }
}
