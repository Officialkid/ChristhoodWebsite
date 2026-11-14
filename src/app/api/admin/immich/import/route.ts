import { NextResponse } from "next/server";
import { getUser, log, sameOrigin } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { isChristhoodFolder, isCloudinaryConfigured } from "@/lib/cloudinary";
import { ImmichError, getImmichOriginal, getImmichPhoto } from "@/lib/immich";
import { mediaDb, saveImmichUpload } from "@/lib/media";
import { StorageUnavailable, store } from "@/lib/store";
import { publish } from "@/lib/publish";

export const runtime = "nodejs";
export const maxDuration = 60;

const headers = { "Cache-Control": "no-store" };
const idPattern = /^[\da-f]{8}-[\da-f]{4}-[1-8][\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i;
const maxOriginalBytes = 25_000_000;
const imageTypes = new Set([
  "image/jpeg", "image/png", "image/webp", "image/heic", "image/heif",
  "image/avif", "image/tiff", "image/gif", "image/bmp",
]);

async function readLimitedImage(response: Response) {
  const headerLength = Number(response.headers.get("content-length") ?? 0);
  if (headerLength > maxOriginalBytes) throw new Error("too_large");
  if (!response.body) throw new Error("empty");

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > maxOriginalBytes) {
      await reader.cancel();
      throw new Error("too_large");
    }
    chunks.push(value);
  }
  if (!length) throw new Error("empty");
  return Buffer.concat(chunks, length);
}

export async function POST(req: Request) {
  const user = await getUser();
  if (!user || !can(user, "media")) return NextResponse.json({ error: "You do not have access to the photo library." }, { status: 403, headers });
  if (!(await sameOrigin(req))) return NextResponse.json({ error: "That request did not come from this site." }, { status: 403, headers });
  if (!store.writable) return NextResponse.json({ error: "Photo saving is not switched on yet. Connect the database in System status." }, { status: 503, headers });
  if (!isCloudinaryConfigured()) return NextResponse.json({ error: "The website photo host is not set up yet." }, { status: 503, headers });

  try {
    const body = (await req.json()) as { assetId?: unknown; folder?: unknown };
    const assetId = typeof body.assetId === "string" ? body.assetId : "";
    const folder = typeof body.folder === "string" ? body.folder.trim() : undefined;
    if (!idPattern.test(assetId)) return NextResponse.json({ error: "Choose a photo from the search results." }, { status: 400, headers });
    if (folder && !isChristhoodFolder(folder)) return NextResponse.json({ error: "Choose a Christhood photo folder." }, { status: 400, headers });
    const existing = (await mediaDb.list().catch(() => [])).find((item) => item.sourceAssetId === assetId);
    if (existing) return NextResponse.json({ error: "That photo is already in the website library.", item: existing }, { status: 409, headers });

    const photo = await getImmichPhoto(assetId);
    const original = await getImmichOriginal(assetId);
    const contentType = original.headers.get("content-type")?.split(";")[0].trim().toLowerCase() ?? "";
    if (!imageTypes.has(contentType)) return NextResponse.json({ error: "This file is not a supported photo." }, { status: 415, headers });
    const image = await readLimitedImage(original);
    const item = await saveImmichUpload(image, photo.name, assetId, user.name, folder);
    await log(user, "Imported a photo from Immich");
    publish();
    return NextResponse.json({ item }, { headers });
  } catch (error) {
    if (error instanceof ImmichError && error.kind === "not_configured") {
      return NextResponse.json({ error: "The photo search connection is not set up yet." }, { status: 503, headers });
    }
    if (error instanceof ImmichError && error.kind === "not_image") {
      return NextResponse.json({ error: "Choose a photo rather than a video." }, { status: 415, headers });
    }
    if (error instanceof ImmichError && error.kind === "not_found") {
      return NextResponse.json({ error: "That photo is no longer available in Immich." }, { status: 404, headers });
    }
    if (error instanceof StorageUnavailable) {
      return NextResponse.json({ error: error.message }, { status: 503, headers });
    }
    if (error instanceof Error && error.message === "too_large") {
      return NextResponse.json({ error: "That original is too large to import here. Choose a smaller version in Immich." }, { status: 413, headers });
    }
    if (error instanceof Error && error.message === "empty") {
      return NextResponse.json({ error: "Immich returned an empty photo. Try another one." }, { status: 502, headers });
    }
    return NextResponse.json({ error: "The photo could not be copied. Check both photo connections and try again." }, { status: 502, headers });
  }
}
