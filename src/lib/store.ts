import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { Redis } from "@upstash/redis";

/**
 * Where the team's changes are kept.
 *  - cloud: a free hosted database (connected in the hosting dashboard, no code needed)
 *  - local: plain files in .data/, used while the site runs on a computer
 *  - none:  the live site has no database yet. The site still works from its shipped content, but nothing can be saved.
 */
const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

export type StorageMode = "cloud" | "local" | "none";
export const storageMode: StorageMode = url && token ? "cloud" : process.env.VERCEL ? "none" : "local";

export class StorageUnavailable extends Error {
  constructor() {
    super("Saving is not switched on yet. Connect the database first (see System status).");
  }
}

const redis = storageMode === "cloud" ? new Redis({ url: url!, token: token! }) : null;
const DIR = path.join(process.cwd(), ".data");
const file = (name: string) => path.join(DIR, `${name.replace(/[^a-z0-9_-]/gi, "_")}.json`);

/* ---- file backend: one writer at a time so two saves never overwrite each other ---- */
let chain: Promise<unknown> = Promise.resolve();
function locked<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn, fn);
  chain = run.catch(() => undefined);
  return run;
}
async function readJson<T>(name: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(file(name), "utf8")) as T;
  } catch {
    return fallback;
  }
}
async function writeJson(name: string, data: unknown) {
  await fs.mkdir(DIR, { recursive: true });
  const tmp = `${file(name)}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2));
  await fs.rename(tmp, file(name));
}

const hits = new Map<string, { n: number; until: number }>();

export const store = {
  mode: storageMode,
  writable: storageMode !== "none",

  /** One document under a key (settings, banner, …). */
  async getDoc<T>(key: string): Promise<T | null> {
    if (redis) return (await redis.get<T>(`doc:${key}`)) ?? null;
    if (storageMode === "none") return null;
    return (await readJson<Record<string, T>>("docs", {}))[key] ?? null;
  },
  async setDoc<T>(key: string, value: T): Promise<void> {
    if (redis) {
      await redis.set(`doc:${key}`, value);
      return;
    }
    if (storageMode === "none") throw new StorageUnavailable();
    await locked(async () => writeJson("docs", { ...(await readJson<Record<string, unknown>>("docs", {})), [key]: value }));
  },

  /** A collection of records, each with its own id. */
  async records<T>(col: string): Promise<Record<string, T>> {
    if (redis) return ((await redis.hgetall<Record<string, T>>(`col:${col}`)) ?? {}) as Record<string, T>;
    if (storageMode === "none") return {};
    return readJson<Record<string, T>>(`col-${col}`, {});
  },
  async getRecord<T>(col: string, id: string): Promise<T | null> {
    if (redis) return (await redis.hget<T>(`col:${col}`, id)) ?? null;
    if (storageMode === "none") return null;
    return (await readJson<Record<string, T>>(`col-${col}`, {}))[id] ?? null;
  },
  async putRecord<T>(col: string, id: string, value: T): Promise<void> {
    if (redis) {
      await redis.hset(`col:${col}`, { [id]: value as unknown as string });
      return;
    }
    if (storageMode === "none") throw new StorageUnavailable();
    await locked(async () => writeJson(`col-${col}`, { ...(await readJson<Record<string, unknown>>(`col-${col}`, {})), [id]: value }));
  },
  async removeRecord(col: string, id: string): Promise<void> {
    if (redis) {
      await redis.hdel(`col:${col}`, id);
      return;
    }
    if (storageMode === "none") throw new StorageUnavailable();
    await locked(async () => {
      const all = await readJson<Record<string, unknown>>(`col-${col}`, {});
      delete all[id];
      await writeJson(`col-${col}`, all);
    });
  },

  /** Counts a visit to `key` inside a time window. Used to slow down guessing and spam. */
  async hit(key: string, windowSeconds: number): Promise<number> {
    if (redis) {
      const k = `hit:${key}`;
      const n = await redis.incr(k);
      if (n === 1) await redis.expire(k, windowSeconds);
      return n;
    }
    const now = Date.now();
    const cur = hits.get(key);
    if (!cur || cur.until < now) {
      hits.set(key, { n: 1, until: now + windowSeconds * 1000 });
      return 1;
    }
    cur.n += 1;
    return cur.n;
  },

  /** Raw files (uploaded pictures) when no file host is connected. */
  async putBlob(id: string, base64: string): Promise<void> {
    if (redis) {
      await redis.set(`blob:${id}`, base64);
      return;
    }
    if (storageMode === "none") throw new StorageUnavailable();
    await fs.mkdir(path.join(DIR, "uploads"), { recursive: true });
    await fs.writeFile(path.join(DIR, "uploads", id), Buffer.from(base64, "base64"));
  },
  async getBlob(id: string): Promise<Buffer | null> {
    if (redis) {
      const v = await redis.get<string>(`blob:${id}`);
      return v ? Buffer.from(v, "base64") : null;
    }
    if (storageMode === "none") return null;
    try {
      return await fs.readFile(path.join(DIR, "uploads", id.replace(/[^a-z0-9._-]/gi, "_")));
    } catch {
      return null;
    }
  },
  async deleteBlob(id: string): Promise<void> {
    if (redis) {
      await redis.del(`blob:${id}`);
      return;
    }
    try {
      await fs.unlink(path.join(DIR, "uploads", id.replace(/[^a-z0-9._-]/gi, "_")));
    } catch {
      /* already gone */
    }
  },
};

/** A typed collection on top of the store. */
export function collection<T extends { id: string }>(name: string) {
  return {
    async list(): Promise<T[]> {
      return Object.values(await store.records<T>(name));
    },
    async get(id: string): Promise<T | null> {
      return store.getRecord<T>(name, id);
    },
    async put(item: T): Promise<T> {
      await store.putRecord(name, item.id, item);
      return item;
    },
    async remove(id: string): Promise<void> {
      await store.removeRecord(name, id);
    },
  };
}
