import { NextResponse } from "next/server";
import { can } from "@/lib/rbac";
import { getUser, log, sameOrigin } from "@/lib/auth";
import { createCloudinaryFolder, isChristhoodFolder, isCloudinaryConfigured, listCloudinaryFolders } from "@/lib/cloudinary";

export const runtime = "nodejs";
export const maxDuration = 30;

const headers = { "Cache-Control": "no-store" };

export async function GET() {
  const user = await getUser();
  if (!user || !can(user, "media")) return NextResponse.json({ error: "You do not have access to the photo library." }, { status: 403, headers });
  if (!isCloudinaryConfigured()) return NextResponse.json({ error: "The website photo library is not connected yet." }, { status: 503, headers });
  try {
    return NextResponse.json({ folders: await listCloudinaryFolders() }, { headers });
  } catch {
    return NextResponse.json({ error: "The website folders could not be loaded." }, { status: 502, headers });
  }
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user || !can(user, "media")) return NextResponse.json({ error: "You do not have access to the photo library." }, { status: 403, headers });
  if (!(await sameOrigin(request))) return NextResponse.json({ error: "That request did not come from this site." }, { status: 403, headers });
  if (!isCloudinaryConfigured()) return NextResponse.json({ error: "The website photo library is not connected yet." }, { status: 503, headers });

  try {
    const body = (await request.json()) as { parent?: unknown; name?: unknown };
    const parent = typeof body.parent === "string" ? body.parent.trim() : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!isChristhoodFolder(parent) || !/^[a-zA-Z0-9][a-zA-Z0-9 _.-]{0,47}$/.test(name) || /^v\d+$/i.test(name)) {
      return NextResponse.json({ error: "Enter a short folder name using letters or numbers." }, { status: 400, headers });
    }
    const folders = await listCloudinaryFolders();
    if (!folders.includes(parent)) return NextResponse.json({ error: "Choose an existing Christhood folder first." }, { status: 400, headers });
    const path = parent + "/" + name.replace(/\s+/g, "-");
    if (folders.includes(path)) return NextResponse.json({ error: "That folder already exists." }, { status: 409, headers });
    await createCloudinaryFolder(path);
    await log(user, "Created a photo folder", path);
    return NextResponse.json({ path, folders: await listCloudinaryFolders() }, { status: 201, headers });
  } catch {
    return NextResponse.json({ error: "The folder could not be created. Try again." }, { status: 502, headers });
  }
}
