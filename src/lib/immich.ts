import "server-only";

export type ImmichPhoto = {
  id: string;
  name: string;
  width: number;
  height: number;
  takenAt: string;
  isFavorite: boolean;
  isArchived: boolean;
};

export type ImmichAlbum = {
  id: string;
  name: string;
  assetCount: number;
  thumbnailAssetId: string | null;
};

export class ImmichError extends Error {
  constructor(readonly kind: "not_configured" | "unavailable" | "not_found" | "not_image") {
    super(kind);
    this.name = "ImmichError";
  }
}

type ImmichAsset = {
  id?: unknown;
  type?: unknown;
  originalFileName?: unknown;
  width?: unknown;
  height?: unknown;
  fileCreatedAt?: unknown;
  isTrashed?: unknown;
  isFavorite?: unknown;
  isArchived?: unknown;
  visibility?: unknown;
};

type ImmichSearchResponse = {
  assets?: {
    items?: ImmichAsset[];
    nextPage?: string | null;
    nextCursor?: string | null;
  };
};

export function isImmichConfigured() {
  const rawUrl = process.env.IMMICH_SERVER_URL?.trim();
  if (!rawUrl || !process.env.IMMICH_API_KEY?.trim()) return false;
  try {
    const base = new URL(rawUrl);
    return ["http:", "https:"].includes(base.protocol) &&
      !(process.env.VERCEL && base.protocol !== "https:") &&
      !base.username && !base.password && !base.search && !base.hash;
  } catch {
    return false;
  }
}

/** Public Immich origin used by the full web app embedded in the team media page. */
export function getImmichWebUrl() {
  const rawUrl = process.env.IMMICH_WEB_URL?.trim() || process.env.IMMICH_SERVER_URL?.trim();
  if (!rawUrl) return null;
  try {
    const address = new URL(rawUrl);
    const rootPath = address.pathname === "/" || address.pathname.replace(/\/+$/, "").toLowerCase() === "/api";
    if (
      !["http:", "https:"].includes(address.protocol) ||
      (process.env.VERCEL && address.protocol !== "https:") ||
      !rootPath || address.username || address.password || address.search || address.hash
    ) return null;
    return address.origin;
  } catch {
    return null;
  }
}

function config() {
  const rawUrl = process.env.IMMICH_SERVER_URL?.trim();
  const apiKey = process.env.IMMICH_API_KEY?.trim();
  if (!rawUrl || !apiKey) throw new ImmichError("not_configured");

  let base: URL;
  try {
    base = new URL(rawUrl);
  } catch {
    throw new ImmichError("not_configured");
  }
  if (!["http:", "https:"].includes(base.protocol) || base.username || base.password || base.search || base.hash) {
    throw new ImmichError("not_configured");
  }
  if (process.env.VERCEL && base.protocol !== "https:") throw new ImmichError("not_configured");
  base.pathname = base.pathname.replace(/\/+$/, "").replace(/\/api$/i, "");

  return { base: base.toString().replace(/\/$/, ""), apiKey };
}

async function request(path: string, init: RequestInit = {}) {
  const { base, apiKey } = config();
  let response: Response;
  try {
    response = await fetch(base + "/api/" + path, {
      ...init,
      headers: { "x-api-key": apiKey, ...init.headers },
      cache: "no-store",
      signal: AbortSignal.timeout(25_000),
    });
  } catch {
    throw new ImmichError("unavailable");
  }
  if (response.status === 404) throw new ImmichError("not_found");
  if (!response.ok) throw new ImmichError("unavailable");
  return response;
}

function safeName(value: unknown) {
  if (typeof value !== "string") return "Photo";
  const name = value.split(/[\\/]/).pop()?.replace(/[\u0000-\u001f]/g, "").trim();
  return (name || "Photo").slice(0, 120);
}

function dimension(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
}

function mapPhoto(asset: ImmichAsset): ImmichPhoto | null {
  if (asset.type !== "IMAGE" || typeof asset.id !== "string" || asset.isTrashed) return null;
  return {
    id: asset.id,
    name: safeName(asset.originalFileName),
    width: dimension(asset.width),
    height: dimension(asset.height),
    takenAt: typeof asset.fileCreatedAt === "string" ? asset.fileCreatedAt : "",
    isFavorite: asset.isFavorite === true,
    isArchived: asset.isArchived === true || asset.visibility === "archive",
  };
}

export async function listImmichPhotos(options: {
  view?: "all" | "favorites" | "archive" | "album";
  albumId?: string;
  page?: number;
  cursor?: string;
}): Promise<{ items: ImmichPhoto[]; nextPage: string | null }> {
  const page = Math.max(1, Math.min(1000, Math.floor(options.page ?? 1)));
  const body: Record<string, unknown> = { size: 60, type: "IMAGE" };
  if (options.cursor) body.cursor = options.cursor;
  else body.page = page;
  if (options.view === "favorites") body.isFavorite = true;
  if (options.view === "archive") body.visibility = "archive";
  if (options.view === "album" && options.albumId) body.albumIds = [options.albumId];

  const response = await request("search/metadata", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await response.json()) as ImmichSearchResponse;
  const assets = Array.isArray(data.assets?.items) ? data.assets.items : [];
  return {
    items: assets.map(mapPhoto).filter((photo): photo is ImmichPhoto => Boolean(photo)),
    nextPage: data.assets?.nextCursor ? `cursor:${data.assets.nextCursor}` : data.assets?.nextPage ?? null,
  };
}

export async function listImmichAlbums(): Promise<ImmichAlbum[]> {
  const response = await request("albums");
  const data = (await response.json()) as Array<Record<string, unknown>>;
  if (!Array.isArray(data)) return [];
  return data.flatMap((album) => {
    if (typeof album.id !== "string" || typeof album.albumName !== "string") return [];
    return [{
      id: album.id,
      name: album.albumName.slice(0, 120),
      assetCount: dimension(album.assetCount),
      thumbnailAssetId: typeof album.albumThumbnailAssetId === "string" ? album.albumThumbnailAssetId : null,
    }];
  });
}

export async function createImmichAlbum(name: string) {
  const response = await request("albums", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ albumName: name }),
  });
  const album = (await response.json()) as Record<string, unknown>;
  if (typeof album.id !== "string" || typeof album.albumName !== "string") throw new ImmichError("unavailable");
  return { id: album.id, name: album.albumName };
}

export async function changeImmichAlbumPhotos(albumId: string, assetIds: string[], action: "add" | "remove") {
  await request("albums/" + encodeURIComponent(albumId) + "/assets", {
    method: action === "add" ? "PUT" : "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids: assetIds }),
  });
}

export async function setImmichPhotoFavorite(id: string, isFavorite: boolean) {
  await request("assets", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids: [id], isFavorite }),
  });
}

export async function setImmichPhotoArchived(id: string, isArchived: boolean) {
  await request("assets", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids: [id], visibility: isArchived ? "archive" : "timeline" }),
  });
}

export async function searchImmichPhotos(query: string): Promise<ImmichPhoto[]> {
  const response = await request("search/smart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, size: 48, page: 1 }),
  });
  const data = (await response.json()) as { assets?: { items?: ImmichAsset[] } };
  return (Array.isArray(data.assets?.items) ? data.assets.items : [])
    .map(mapPhoto)
    .filter((photo): photo is ImmichPhoto => Boolean(photo));
}

export async function getImmichPhoto(id: string) {
  const response = await request("assets/" + encodeURIComponent(id));
  const asset = (await response.json()) as ImmichAsset;
  if (asset.type !== "IMAGE" || asset.isTrashed) throw new ImmichError("not_image");
  return {
    name: safeName(asset.originalFileName),
    width: dimension(asset.width),
    height: dimension(asset.height),
  };
}

export function getImmichThumbnail(id: string) {
  return request("assets/" + encodeURIComponent(id) + "/thumbnail?size=thumbnail");
}

export function getImmichOriginal(id: string) {
  return request("assets/" + encodeURIComponent(id) + "/original");
}
