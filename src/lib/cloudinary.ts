import "server-only";
import { createHash } from "node:crypto";
import type { CloudinaryLibraryAsset } from "./types";

export type CloudinaryUpload = {
  publicId: string;
  assetId?: string;
  assetFolder: string;
  url: string;
  small: string;
  bytes: number;
  width: number;
  height: number;
};

export class CloudinaryError extends Error {
  constructor() {
    super("Cloudinary is not ready.");
    this.name = "CloudinaryError";
  }
}

const DEFAULT_CLOUDINARY_ASSET_FOLDER = "christhood/media";
const CHRISTHOOK_FOLDER = "christhood";

type CloudinaryFolderMode = "dynamic" | "fixed";

export function isChristhoodFolder(value: string) {
  const folder = value.trim();
  const segments = folder.split("/");
  return Boolean(
    (folder === CHRISTHOOK_FOLDER || folder.startsWith(CHRISTHOOK_FOLDER + "/")) &&
    folder.length <= 255 &&
    segments.every((segment) =>
      /^[a-zA-Z0-9_.-]+$/.test(segment) &&
      segment !== "." &&
      segment !== ".." &&
      !/^v\d+$/i.test(segment),
    )
  );
}

function assetFolder() {
  const folder = process.env.CLOUDINARY_ASSET_FOLDER?.trim() || DEFAULT_CLOUDINARY_ASSET_FOLDER;
  if (!isChristhoodFolder(folder)) throw new CloudinaryError();
  return folder;
}

export function isCloudinaryConfigured() {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  return Boolean(
    cloud &&
    /^[a-zA-Z0-9_-]+$/.test(cloud) &&
    process.env.CLOUDINARY_API_KEY?.trim() &&
    process.env.CLOUDINARY_API_SECRET?.trim(),
  );
}

function config() {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const key = process.env.CLOUDINARY_API_KEY?.trim();
  const secret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!cloud || !key || !secret || !/^[a-zA-Z0-9_-]+$/.test(cloud)) throw new CloudinaryError();
  const folderMode = (process.env.CLOUDINARY_FOLDER_MODE?.trim().toLowerCase() || "dynamic") as CloudinaryFolderMode;
  if (folderMode !== "dynamic" && folderMode !== "fixed") throw new CloudinaryError();
  return { cloud, key, secret, folder: assetFolder(), folderMode };
}

function auth(key: string, secret: string) {
  return "Basic " + Buffer.from(key + ":" + secret).toString("base64");
}

async function adminRequest(path: string, init: RequestInit = {}) {
  const { cloud, key, secret } = config();
  let response: Response;
  try {
    response = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/${path}`, {
      ...init,
      headers: {
        Authorization: auth(key, secret),
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    throw new CloudinaryError();
  }
  if (!response.ok) throw new CloudinaryError();
  return response.json() as Promise<Record<string, unknown>>;
}

function searchTerms(query: string) {
  const tokens = query
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}_-]+/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 5);
  if (!tokens.length) return "";
  const clauses = tokens.map((token) =>
    `filename:${token} OR display_name:${token} OR tags:${token} OR public_id:${token}*`,
  );
  return ` AND (${clauses.join(" OR ")})`;
}

function folderPathParam(folder: string) {
  return folder.split("/").map(encodeURIComponent).join("/");
}

function shapeAsset(asset: Record<string, unknown>, fallbackFolder: string): CloudinaryLibraryAsset | null {
  if (typeof asset.asset_id !== "string" || typeof asset.public_id !== "string") return null;
  const url = typeof asset.secure_url === "string" ? asset.secure_url : typeof asset.url === "string" ? asset.url : "";
  if (!url) return null;
  const folder = typeof asset.asset_folder === "string" ? asset.asset_folder : typeof asset.folder === "string" ? asset.folder : fallbackFolder;
  const tags = Array.isArray(asset.tags) ? asset.tags.filter((tag): tag is string => typeof tag === "string") : [];
  return {
    assetId: asset.asset_id,
    publicId: asset.public_id,
    folder,
    name: typeof asset.display_name === "string" && asset.display_name ? asset.display_name : asset.public_id.split("/").at(-1) ?? "Photo",
    url,
    small: url.replace("/image/upload/", "/image/upload/c_limit,w_520,q_auto,f_auto/"),
    bytes: typeof asset.bytes === "number" ? asset.bytes : 0,
    width: typeof asset.width === "number" ? asset.width : 0,
    height: typeof asset.height === "number" ? asset.height : 0,
    format: typeof asset.format === "string" ? asset.format : "image",
    tags,
    createdAt: typeof asset.created_at === "string" ? asset.created_at : "",
  };
}

export async function listCloudinaryFolders() {
  const params = new URLSearchParams({ expression: "path:christhood", max_results: "500", sort_by: '[{"path":"asc"}]' });
  const result = await adminRequest("folders/search?" + params.toString());
  const folders = Array.isArray(result.folders) ? result.folders : [];
  return folders
    .map((folder) => (folder && typeof folder === "object" ? (folder as Record<string, unknown>).path : null))
    .filter((path): path is string => typeof path === "string" && isChristhoodFolder(path))
    .sort((a, b) => a.localeCompare(b));
}

export async function createCloudinaryFolder(folder: string) {
  if (!isChristhoodFolder(folder) || folder === CHRISTHOOK_FOLDER) throw new CloudinaryError();
  return adminRequest("folders/" + folderPathParam(folder), { method: "POST" });
}

export async function listCloudinaryAssets(folder: string, query = "", nextCursor?: string) {
  if (!isChristhoodFolder(folder)) throw new CloudinaryError();
  const { folderMode } = config();
  const field = folderMode === "dynamic" ? "asset_folder" : "folder";
  const params = new URLSearchParams({
    expression: `${field}=\"${folder}\"${searchTerms(query)}`,
    max_results: "40",
    fields: "public_id,asset_id,asset_folder,folder,display_name,format,created_at,bytes,width,height,secure_url,tags",
  });
  if (nextCursor) params.set("next_cursor", nextCursor);
  const result = await adminRequest("resources/search?" + params.toString());
  const resources = Array.isArray(result.resources) ? result.resources : [];
  const assets = resources
    .filter((resource): resource is Record<string, unknown> => Boolean(resource) && typeof resource === "object")
    .map((resource) => shapeAsset(resource, folder))
    .filter((asset): asset is CloudinaryLibraryAsset => asset !== null && isChristhoodFolder(asset.folder));
  return {
    assets,
    totalCount: typeof result.total_count === "number" ? result.total_count : assets.length,
    nextCursor: typeof result.next_cursor === "string" ? result.next_cursor : undefined,
  };
}

export async function getCloudinaryAsset(assetId: string) {
  if (!/^[a-f\d-]{32,64}$/i.test(assetId)) throw new CloudinaryError();
  const result = await adminRequest("resources/" + encodeURIComponent(assetId) + "?fields=public_id,asset_id,asset_folder,folder,display_name,format,created_at,bytes,width,height,secure_url,tags");
  const asset = shapeAsset(result, "");
  if (!asset || !isChristhoodFolder(asset.folder)) throw new CloudinaryError();
  return asset;
}

export async function updateCloudinaryAsset(assetId: string, update: { folder?: string; name?: string; tags?: string[] }) {
  if (!/^[a-f\d-]{32,64}$/i.test(assetId)) throw new CloudinaryError();
  const current = await getCloudinaryAsset(assetId);
  const { folderMode } = config();
  const body: Record<string, string> = {};
  if (update.folder && update.folder !== current.folder) {
    if (folderMode !== "dynamic" || !isChristhoodFolder(update.folder) || update.folder === CHRISTHOOK_FOLDER) throw new CloudinaryError();
    body.asset_folder = update.folder;
  }
  if (typeof update.name === "string") {
    const name = update.name.trim().slice(0, 120);
    if (!name || name.includes("/")) throw new CloudinaryError();
    body.display_name = name;
  }
  if (update.tags) {
    if (update.tags.length > 20 || update.tags.some((tag) => !/^[\p{L}\p{N}_-]{1,48}$/u.test(tag))) throw new CloudinaryError();
    body.tags = update.tags.join(",");
  }
  if (!Object.keys(body).length) return current;
  await adminRequest("resources/" + encodeURIComponent(assetId), { method: "PUT", body: JSON.stringify(body) });
  return getCloudinaryAsset(assetId);
}

export async function uploadToCloudinary(image: Buffer, id: string, destinationFolder?: string): Promise<CloudinaryUpload> {
  const { cloud, key, secret, folder, folderMode } = config();
  const assetFolder = destinationFolder?.trim() || folder;
  if (!isChristhoodFolder(assetFolder)) throw new CloudinaryError();
  const form = new FormData();
  form.set("file", new Blob([new Uint8Array(image)], { type: "image/webp" }), id + ".webp");
  if (folderMode === "dynamic") {
    form.set("asset_folder", assetFolder);
    form.set("public_id", assetFolder + "/" + id);
  } else {
    form.set("folder", assetFolder);
    form.set("public_id", id);
  }
  let response: Response;
  try {
    response = await fetch("https://api.cloudinary.com/v1_1/" + cloud + "/image/upload", {
      method: "POST",
      headers: { Authorization: auth(key, secret) },
      body: form,
      signal: AbortSignal.timeout(45_000),
    });
  } catch {
    throw new CloudinaryError();
  }
  if (!response.ok) throw new CloudinaryError();
  const result = (await response.json()) as {
    public_id?: unknown;
    asset_id?: unknown;
    asset_folder?: unknown;
    folder?: unknown;
    secure_url?: unknown;
    bytes?: unknown;
    width?: unknown;
    height?: unknown;
  };
  if (typeof result.public_id !== "string" || typeof result.secure_url !== "string") throw new CloudinaryError();
  return {
    publicId: result.public_id,
    assetId: typeof result.asset_id === "string" ? result.asset_id : undefined,
    assetFolder: typeof result.asset_folder === "string" ? result.asset_folder : typeof result.folder === "string" ? result.folder : assetFolder,
    url: result.secure_url,
    small: result.secure_url.replace("/image/upload/", "/image/upload/c_limit,w_720,q_auto,f_auto/"),
    bytes: typeof result.bytes === "number" ? result.bytes : image.length,
    width: typeof result.width === "number" ? result.width : 0,
    height: typeof result.height === "number" ? result.height : 0,
  };
}

export async function deleteFromCloudinary(publicId: string) {
  const { cloud, key, secret } = config();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const parameters = "invalidate=true&public_id=" + publicId + "&timestamp=" + timestamp;
  const signature = createHash("sha1").update(parameters + secret).digest("hex");
  const form = new FormData();
  form.set("public_id", publicId);
  form.set("timestamp", timestamp);
  form.set("invalidate", "true");
  form.set("api_key", key);
  form.set("signature", signature);

  let response: Response;
  try {
    response = await fetch("https://api.cloudinary.com/v1_1/" + cloud + "/image/destroy", {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(25_000),
    });
  } catch {
    throw new CloudinaryError();
  }
  if (!response.ok) throw new CloudinaryError();
  const result = (await response.json()) as { result?: unknown };
  if (result.result !== "ok" && result.result !== "not found") throw new CloudinaryError();
}
