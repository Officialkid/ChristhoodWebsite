import "server-only";
import { put, del } from "@vercel/blob";
import { preparePhoto, type EnhanceLevel } from "./enhance";
import { collection, store, StorageUnavailable } from "./store";
import { newId } from "./auth";
import type { MediaItem } from "./types";

export const mediaDb = collection<MediaItem>("media");

export type PhotoHost = "blob" | "database" | "files";
export const photoHost: PhotoHost = process.env.BLOB_READ_WRITE_TOKEN ? "blob" : store.mode === "cloud" ? "database" : "files";

export const MAX_UPLOAD_BYTES = 4_000_000;

/**
 * Cleans up an uploaded photo and keeps two sizes of it.
 * With a file host connected they go there; otherwise they are kept beside the other saved content.
 */
export async function saveUpload(input: Buffer, name: string, level: EnhanceLevel, by: string): Promise<MediaItem> {
  if (!store.writable) throw new StorageUnavailable();
  const id = newId();
  // Pictures kept in the database must fit comfortably in one request.
  const p = await preparePhoto(input, level, { maxBytes: photoHost === "database" ? 380_000 : 900_000 });
  let url: string;
  let small: string;
  if (photoHost === "blob") {
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
  return mediaDb.put(item);
}

export async function deleteUpload(id: string) {
  const item = await mediaDb.get(id);
  if (!item) return;
  if (photoHost === "blob" && item.url.startsWith("http")) await del([item.url, item.small, item.url.replace(/.webp$/, "-md.webp")]).catch(() => undefined);
  else await Promise.all([store.deleteBlob(`${id}.webp`), store.deleteBlob(`${id}-md.webp`), store.deleteBlob(`${id}-sm.webp`)]);
  await mediaDb.remove(id);
}
