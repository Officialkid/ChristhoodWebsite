import { NextResponse } from "next/server";
import { getUser, log, sameOrigin } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { mediaDb, saveUpload, MAX_UPLOAD_BYTES, photoHost } from "@/lib/media";
import { StorageUnavailable } from "@/lib/store";
import { photoNames } from "@/lib/images";
import type { EnhanceLevel } from "@/lib/enhance";

export const runtime = "nodejs";
export const maxDuration = 60;

const headers = { "Cache-Control": "no-store" };

/** The church photos and everything the team has uploaded, for the picture chooser. */
export async function GET() {
  const user = await getUser();
  if (!user || !(can(user, "images") || can(user, "media") || user.role === "admin" || user.departments.length)) return NextResponse.json({ error: "Please sign in." }, { status: 401, headers });
  const uploads = (await mediaDb.list().catch(() => [])).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return NextResponse.json({ photos: photoNames(), uploads, host: photoHost }, { headers });
}

/** Accepts one photo, cleans it up and stores it. The browser has already shrunk it to fit in a single request. */
export async function POST(req: Request) {
  const user = await getUser();
  if (!user || !can(user, "media")) return NextResponse.json({ error: "You do not have access to the photo library." }, { status: 403, headers });
  if (!(await sameOrigin(req))) return NextResponse.json({ error: "That request did not come from this site." }, { status: 403, headers });

  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "No photo was sent." }, { status: 400, headers });
    if (!/^image\/(jpeg|png|webp|heic|heif|avif)$/i.test(file.type)) return NextResponse.json({ error: "Please choose a JPG, PNG or WebP picture." }, { status: 415, headers });
    if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "That photo is too large to send. Try a smaller one." }, { status: 413, headers });
    const level = (["off", "natural", "strong"].includes(String(form.get("level"))) ? String(form.get("level")) : "natural") as EnhanceLevel;
    const item = await saveUpload(Buffer.from(await file.arrayBuffer()), file.name, level, user.name);
    await log(user, "Uploaded a photo", item.name);
    return NextResponse.json({ item }, { headers });
  } catch (error) {
    if (error instanceof StorageUnavailable) return NextResponse.json({ error: error.message }, { status: 503, headers });
    console.error("Upload failed", error);
    return NextResponse.json({ error: "That photo could not be processed. Try another one." }, { status: 500, headers });
  }
}
