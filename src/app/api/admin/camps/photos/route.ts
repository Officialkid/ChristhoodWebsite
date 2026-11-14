import { NextResponse } from "next/server";
import sharp from "sharp";
import { getUser, newId, sameOrigin } from "@/lib/auth";
import { campApplications, campAssignments, campPhotos, mayOpenCare, photoRule } from "@/lib/camp-day";
import { seal } from "@/lib/crypto";
import { mayOpenCamp, mayRunCampDay } from "@/lib/rbac";
import { store, StorageUnavailable } from "@/lib/store";

export const runtime = "nodejs";
export const maxDuration = 30;
const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
const MAX_CAMP_PHOTOS_PER_CHILD = 100;
const text = (value: FormDataEntryValue | null, max = 200) => typeof value === "string" ? value.replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max) : "";

async function canManage(user: NonNullable<Awaited<ReturnType<typeof getUser>>>, appId: string) {
  if (!mayRunCampDay(user)) return null;
  const app = await campApplications.get(appId);
  if (!app || app.status !== "Approved" || !mayOpenCamp(user, app)) return null;
  if (!mayOpenCare(user, app, await campAssignments.get(app.id))) return null;
  return app;
}

export async function GET(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401, headers });
  const appId = new URL(req.url).searchParams.get("applicationId")?.slice(0, 80) ?? "";
  const app = await canManage(user, appId);
  if (!app) return NextResponse.json({ error: "You cannot open this camper's photo area." }, { status: 403, headers });
  if (!app.familyId) return NextResponse.json({ error: "The parent's family page has not been linked yet. The camp office must verify the parent and link the application first." }, { status: 409, headers });
  if (await photoRule(app) !== "Yes") return NextResponse.json({ error: "The parent has not allowed photos for this child." }, { status: 403, headers });
  const photos = (await campPhotos.list()).filter((photo) => photo.applicationId === app.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return NextResponse.json({ photos: photos.map(({ id, caption, createdAt, by }) => ({ id, caption, createdAt, by, src: `/api/admin/camps/photos/${encodeURIComponent(id)}` })) }, { headers });
}

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401, headers });
  if (!(await sameOrigin(req))) return NextResponse.json({ error: "That request did not come from this site." }, { status: 403, headers });
  if (!store.writable) return NextResponse.json({ error: "Photo saving is not switched on yet." }, { status: 503, headers });

  try {
    const form = await req.formData();
    const app = await canManage(user, text(form.get("applicationId"), 80));
    if (!app) return NextResponse.json({ error: "You cannot add photos to this camper's area." }, { status: 403, headers });
    if (!app.familyId) return NextResponse.json({ error: "The parent's family page has not been linked yet. The camp office must verify the parent and link the application first." }, { status: 409, headers });
    if (await photoRule(app) !== "Yes") return NextResponse.json({ error: "The parent has not allowed photos for this child." }, { status: 403, headers });
    if ((await campPhotos.list()).filter((photo) => photo.applicationId === app.id).length >= MAX_CAMP_PHOTOS_PER_CHILD) return NextResponse.json({ error: "This family photo collection is full. Remove an old photo before adding another." }, { status: 409, headers });
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Choose a photo first." }, { status: 400, headers });
    if (!/^image\/(jpeg|png|webp|avif)$/i.test(file.type)) return NextResponse.json({ error: "Choose a JPG, PNG, WebP or AVIF photo." }, { status: 415, headers });
    if (file.size > 3_800_000) return NextResponse.json({ error: "Choose a photo smaller than 3.8 MB." }, { status: 413, headers });

    const input = Buffer.from(await file.arrayBuffer());
    const result = await sharp(input, { limitInputPixels: 40_000_000 }).rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 80, effort: 4 }).toBuffer();
    if (result.length > 3_500_000) return NextResponse.json({ error: "That photo could not be made small enough. Choose a smaller image." }, { status: 413, headers });
    const id = newId();
    const photo = {
      id,
      applicationId: app.id,
      eventId: app.eventId,
      caption: text(form.get("caption"), 160) || undefined,
      createdAt: new Date().toISOString(),
      by: user.name,
      sealed: await seal({ type: "image/webp", bytes: result.toString("base64") }),
    };
    await campPhotos.put(photo);
    return NextResponse.json({ photo: { id, caption: photo.caption, createdAt: photo.createdAt, by: photo.by, src: `/api/admin/camps/photos/${encodeURIComponent(id)}` } }, { headers });
  } catch (error) {
    if (error instanceof StorageUnavailable) return NextResponse.json({ error: error.message }, { status: 503, headers });
    console.error("Private camp photo could not be saved", error instanceof Error ? error.name : "unknown error");
    return NextResponse.json({ error: "That photo could not be saved. Please try another one." }, { status: 400, headers });
  }
}
