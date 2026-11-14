import { NextResponse } from "next/server";
import { getUser, sameOrigin } from "@/lib/auth";
import { campApplications, campAssignments, campPhotos, mayOpenCare, photoRule } from "@/lib/camp-day";
import { unseal } from "@/lib/crypto";
import { mayOpenCamp, mayRunCampDay } from "@/lib/rbac";

export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };

export async function GET(_req: Request, { params }: { params: Promise<{ photoId: string }> }) {
  const user = await getUser();
  if (!user || !mayRunCampDay(user)) return NextResponse.json({ error: "Please sign in with camp access." }, { status: 403, headers });
  const { photoId } = await params;
  const photo = await campPhotos.get(photoId);
  const app = photo ? await campApplications.get(photo.applicationId) : null;
  if (!photo || !app || !mayOpenCamp(user, app) || !mayOpenCare(user, app, await campAssignments.get(app.id))) return NextResponse.json({ error: "That photo is not available." }, { status: 404, headers });
  if (await photoRule(app) !== "Yes") return NextResponse.json({ error: "Photo permission is not active." }, { status: 403, headers });
  try {
    const data = await unseal<{ type: "image/webp"; bytes: string }>(photo.sealed);
    return new NextResponse(Buffer.from(data.bytes, "base64"), { headers: { ...headers, "Content-Type": "image/webp" } });
  } catch {
    return NextResponse.json({ error: "That private photo could not be opened." }, { status: 500, headers });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ photoId: string }> }) {
  const user = await getUser();
  if (!user || !mayRunCampDay(user)) return NextResponse.json({ error: "Please sign in with camp access." }, { status: 403, headers });
  if (!(await sameOrigin(req))) return NextResponse.json({ error: "That request did not come from this site." }, { status: 403, headers });
  const { photoId } = await params;
  const photo = await campPhotos.get(photoId);
  const app = photo ? await campApplications.get(photo.applicationId) : null;
  if (!photo || !app || !mayOpenCamp(user, app) || !mayOpenCare(user, app, await campAssignments.get(app.id))) return NextResponse.json({ error: "That photo is not available." }, { status: 404, headers });
  await campPhotos.remove(photo.id);
  return NextResponse.json({ ok: true }, { headers });
}
