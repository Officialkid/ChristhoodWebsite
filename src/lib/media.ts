import "server-only";
import { put, del } from "@vercel/blob";
import { preparePhoto, type EnhanceLevel } from "./enhance";
import { deleteFromCloudinary, isCloudinaryConfigured, uploadToCloudinary } from "./cloudinary";
import { collection, store, StorageUnavailable } from "./store";
import { newId } from "./auth";
import type { CloudinaryLibraryAsset, MediaItem } from "./types";

export const mediaDb = collection<MediaItem>("media");

export type PhotoHost = "cloudinary" | "blob" | "database" | "files";
export const photoHost: PhotoHost = isCloudinaryConfigured() ? "cloudinary" : process.env.BLOB_READ_WRITE_TOKEN ? "blob" : store.mode === "cloud" ? "database" : "files";

export const MAX_UPLOAD_BYTES = 4_000_000;

/**
 * Cleans up an uploaded photo and keeps two sizes of it.
 * With a file host connected they go there; otherwise they are kept beside the other saved content.
 */
export async function saveUpload(input: Buffer, name: string, level: EnhanceLevel, by: string, folder?: string): Promise<MediaItem> {
  if (!store.writable) throw new StorageUnavailable();
  const id = newId();
  // Pictures kept in the database must fit comfortably in one request.
  const p = await preparePhoto(input, level, { maxBytes: photoHost === "database" ? 380_000 : 900_000 });
  let url: string;
  let small: string;
  let cloudinary: Awaited<ReturnType<typeof uploadToCloudinary>> | undefined;
  if (photoHost === "cloudinary") {
    cloudinary = await uploadToCloudinary(p.full, id, folder);
    url = cloudinary.url + "?ch_w=" + (cloudinary.width || p.w) + "&ch_h=" + (cloudinary.height || p.h);
    small = cloudinary.small;
  } else if (photoHost === "blob") {
    const [a, b] = await Promise.all([
      put(`photos/${id}.webp`, p.full, { access: "public", contentType: "image/webp", addRandomSuffix: false }),
      put(`photos/${id}-sm.webp`, p.small, { access: "public", contentType: "image/webp", addRandomSuffix: false }),
      put(`photos/${id}-md.webp`, p.medium, { access: "public", contentType: "image/webp", addRandomSuffix: false }),
    ]);
    url = a.url;
    small = b.url;
  } else {
    await Promise.all([store.putBlob(`${id}.webp`, p.full.toString("base64")), store.putBlob(`${id}-md.webp`, p.medium.toString("base64")), store.putBlob(`${id}-sm.webp`, p.small.toString("base64"))]);
    url = `/media/${id}.webp`;
    small = `/media/${id}-sm.webp`;
  }
  const item: MediaItem = {
    id,
    ...(cloudinary ? { storage: "cloudinary" as const, providerId: cloudinary.publicId, providerAssetId: cloudinary.assetId, assetFolder: cloudinary.assetFolder } : {}),
    url,
    small,
    w: p.w,
    h: p.h,
    name: name.replace(/\.[^.]+$/, "").slice(0, 80) || "Photo",
    note: p.note,
    bytes: p.full.length,
    createdAt: new Date().toISOString(),
    by,
  };
  try {
    return await mediaDb.put(item);
  } catch (error) {
    if (cloudinary) await deleteFromCloudinary(cloudinary.publicId).catch(() => undefined);
    throw error;
  }
}

/** Imports a selected Immich image into Cloudinary for reliable public delivery by the website. */
export async function saveImmichUpload(input: Buffer, name: string, sourceAssetId: string, by: string, folder?: string): Promise<MediaItem> {
  if (!store.writable) throw new StorageUnavailable();
  const id = newId();
  const prepared = await preparePhoto(input, "natural", { maxBytes: 900_000 });
  const uploaded = await uploadToCloudinary(prepared.full, id, folder);
  const item: MediaItem = {
    id,
    storage: "cloudinary",
    providerId: uploaded.publicId,
    providerAssetId: uploaded.assetId,
    assetFolder: uploaded.assetFolder,
    sourceAssetId,
    url: uploaded.url + "?ch_w=" + (uploaded.width || prepared.w) + "&ch_h=" + (uploaded.height || prepared.h),
    small: uploaded.small,
    w: uploaded.width || prepared.w,
    h: uploaded.height || prepared.h,
    name: name.replace(/\.[^.]+$/, "").slice(0, 80) || "Photo",
    note: prepared.note,
    bytes: uploaded.bytes,
    createdAt: new Date().toISOString(),
    by,
  };
  try {
    return await mediaDb.put(item);
  } catch (error) {
    await deleteFromCloudinary(uploaded.publicId).catch(() => undefined);
    throw error;
  }
}

/** Adds an existing Christhood Cloudinary asset to the site photo chooser without copying the file. */
export async function saveCloudinaryReference(asset: CloudinaryLibraryAsset, by: string): Promise<MediaItem> {
  if (!store.writable) throw new StorageUnavailable();
  const existing = (await mediaDb.list().catch(() => [])).find((item) =>
    item.providerAssetId === asset.assetId || item.providerId === asset.publicId,
  );
  if (existing) return existing;
  const item: MediaItem = {
    id: newId(),
    storage: "cloudinary",
    providerId: asset.publicId,
    providerAssetId: asset.assetId,
    assetFolder: asset.folder,
    url: asset.url + "?ch_w=" + (asset.width || 1600) + "&ch_h=" + (asset.height || 1200),
    small: asset.small,
    w: asset.width,
    h: asset.height,
    name: asset.name.slice(0, 80) || "Photo",
    note: "Cloudinary photo",
    bytes: asset.bytes,
    createdAt: new Date().toISOString(),
    by,
  };
  return mediaDb.put(item);
}

export async function deleteUpload(id: string) {
  const item = await mediaDb.get(id);
  if (!item) return;
  if (item.storage === "cloudinary") {
    if (!item.providerId) throw new Error("The photo host details are missing for this image.");
    await deleteFromCloudinary(item.providerId);
  } else if (photoHost === "blob" && item.url.startsWith("http")) await del([item.url, item.small, item.url.replace(/.webp$/, "-md.webp")]).catch(() => undefined);
  else await Promise.all([store.deleteBlob(`${id}.webp`), store.deleteBlob(`${id}-md.webp`), store.deleteBlob(`${id}-sm.webp`)]);
  await mediaDb.remove(id);
}
