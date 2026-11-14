import { NextResponse } from "next/server";
import { getFamily } from "@/lib/family";
import { campApplications, campPhotos, photoRule } from "@/lib/camp-day";
import { unseal } from "@/lib/crypto";

export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };

export async function GET(_req: Request, { params }: { params: Promise<{ photoId: string }> }) {
  const family = await getFamily();
  if (!family) return NextResponse.json({ error: "Please sign in to see family photos." }, { status: 401, headers });
  const { photoId } = await params;
  const photo = await campPhotos.get(photoId);
  const app = photo ? await campApplications.get(photo.applicationId) : null;
  if (!photo || !app || app.familyId !== family.id || app.status !== "Approved") return NextResponse.json({ error: "That photo is not available to this family." }, { status: 404, headers });
  if (await photoRule(app) !== "Yes") return NextResponse.json({ error: "Photo permission is no longer active." }, { status: 403, headers });
  try {
    const data = await unseal<{ type: "image/webp"; bytes: string }>(photo.sealed);
    return new NextResponse(Buffer.from(data.bytes, "base64"), { headers: { ...headers, "Content-Type": "image/webp" } });
  } catch {
    return NextResponse.json({ error: "That private photo could not be opened." }, { status: 500, headers });
  }
}
