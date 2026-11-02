import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { Redis } from "@upstash/redis";
import { MongoClient, type Collection, type Document } from "mongodb";
import { Pool } from "pg";

/**
 * Where the team's changes are kept.
 *  - cloud: a hosted database (connected in the hosting dashboard, no code needed): MongoDB, Upstash Redis or Neon Postgres.
 *    If more than one is connected, MongoDB wins, then Redis, then Postgres.
 *  - local: plain files in .data/, used while the site runs on a computer
 *  - none:  the live site has no database yet. The site still works from its shipped content, but nothing can be saved.
 */
const mongoUrl = process.env.MONGODB_URI || process.env.MONGODB_URL || process.env.MONGO_URL;
const url = !mongoUrl ? process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL : undefined;
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

// Neon gives "sslmode=require"; say "verify-full" outright (the same check) so newer drivers do not change meaning.
const pgUrl = !mongoUrl && !(url && token) ? (process.env.POSTGRES_URL || process.env.DATABASE_URL)?.replace(/sslmode=(require|prefer|verify-ca)/, "sslmode=verify-full") : undefined;

export type StorageMode = "cloud" | "local" | "none";
export const storageMode: StorageMode = mongoUrl || (url && token) || pgUrl ? "cloud" : process.env.VERCEL ? "none" : "local";
/** Which hosted database is in use, for the status screen. */
export const storageDriver: "mongodb" | "redis" | "postgres" | "files" | "none" = mongoUrl ? "mongodb" : url && token ? "redis" : pgUrl ? "postgres" : storageMode === "local" ? "files" : "none";

export class StorageUnavailable extends Error {
  constructor() {
    super("Saving is not switched on yet. Connect the database first (see System status).");
  }
}

const redis = url && token ? new Redis({ url, token }) : null;

/* ---- MongoDB backend. Four small collections (all prefixed ch_), created on first use. ---- */
type MongoParts = { docs: Collection<Document>; records: Collection<Document>; hits: Collection<Document>; blobs: Collection<Document> };
const held = globalThis as unknown as { __christhoodMongo?: Promise<MongoParts> };
function mongo(): Promise<MongoParts> {
  if (!mongoUrl) throw new StorageUnavailable();
  held.__christhoodMongo ??= (async () => {
    const client = new MongoClient(mongoUrl, { maxPoolSize: 5, serverSelectionTimeoutMS: 8_000, ignoreUndefined: true });
    // The database named in the connection string, else MONGODB_DB, else "christhood". Our collections all start with ch_.
    const name = process.env.MONGODB_DB || /^mongodb(?:\+srv)?:\/\/[^/]+\/([^/?]+)/.exec(mongoUrl)?.[1] || "christhood";
    const db = client.db(name);
    const parts: MongoParts = { docs: db.collection("ch_docs"), records: db.collection("ch_records"), hits: db.collection("ch_hits"), blobs: db.collection("ch_blobs") };
    await Promise.all([parts.records.createIndex({ col: 1 }), parts.hits.createIndex({ until: 1 }, { expireAfterSeconds: 0 })]);
    return parts;
  })().catch((e) => {
    held.__christhoodMongo = undefined;
    throw e;
  });
  return held.__christhoodMongo;
}
const recordKey = (col: string, id: string) => `${col}/${id}`;

/* ---- Postgres backend (Neon). Four small tables, created on first use. ---- */
const pool = pgUrl ? new Pool({ connectionString: pgUrl, max: 3, idleTimeoutMillis: 10_000, connectionTimeoutMillis: 8_000 }) : null;
let ready: Promise<void> | undefined;
async function sql<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T[]> {
  if (!pool) throw new StorageUnavailable();
  ready ??= (async () => {
    await pool.query(`
      create table if not exists ch_docs (key text primary key, value jsonb not null);
      create table if not exists ch_records (col text not null, id text not null, value jsonb not null, primary key (col, id));
      create table if not exists ch_hits (key text primary key, n int not null, until timestamptz not null);
      create table if not exists ch_blobs (id text primary key, data bytea not null);`);
  })().catch((e) => {
    ready = undefined;
    throw e;
  });
  await ready;
  return (await pool.query(text, params)).rows as T[];
}
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
    if (mongoUrl) return ((await (await mongo()).docs.findOne({ _id: key as never }))?.value as T | undefined) ?? null;
    if (redis) return (await redis.get<T>(`doc:${key}`)) ?? null;
    if (pool) return (await sql<{ value: T }>("select value from ch_docs where key = $1", [key]))[0]?.value ?? null;
    if (storageMode === "none") return null;
    return (await readJson<Record<string, T>>("docs", {}))[key] ?? null;
  },
  async setDoc<T>(key: string, value: T): Promise<void> {
    if (mongoUrl) {
      await (await mongo()).docs.replaceOne({ _id: key as never }, { value }, { upsert: true });
      return;
    }
    if (redis) {
      await redis.set(`doc:${key}`, value);
      return;
    }
    if (pool) {
      await sql("insert into ch_docs (key, value) values ($1, $2) on conflict (key) do update set value = excluded.value", [key, JSON.stringify(value)]);
      return;
    }
    if (storageMode === "none") throw new StorageUnavailable();
    await locked(async () => writeJson("docs", { ...(await readJson<Record<string, unknown>>("docs", {})), [key]: value }));
  },

  /** A collection of records, each with its own id. */
  async records<T>(col: string): Promise<Record<string, T>> {
    if (mongoUrl) return Object.fromEntries((await (await mongo()).records.find({ col }).toArray()).map((r) => [r.id as string, r.value as T]));
    if (redis) return ((await redis.hgetall<Record<string, T>>(`col:${col}`)) ?? {}) as Record<string, T>;
    if (pool) return Object.fromEntries((await sql<{ id: string; value: T }>("select id, value from ch_records where col = $1", [col])).map((r) => [r.id, r.value]));
    if (storageMode === "none") return {};
    return readJson<Record<string, T>>(`col-${col}`, {});
  },
  async getRecord<T>(col: string, id: string): Promise<T | null> {
    if (mongoUrl) return ((await (await mongo()).records.findOne({ _id: recordKey(col, id) as never }))?.value as T | undefined) ?? null;
    if (redis) return (await redis.hget<T>(`col:${col}`, id)) ?? null;
    if (pool) return (await sql<{ value: T }>("select value from ch_records where col = $1 and id = $2", [col, id]))[0]?.value ?? null;
    if (storageMode === "none") return null;
    return (await readJson<Record<string, T>>(`col-${col}`, {}))[id] ?? null;
  },
  async putRecord<T>(col: string, id: string, value: T): Promise<void> {
    if (mongoUrl) {
      await (await mongo()).records.replaceOne({ _id: recordKey(col, id) as never }, { col, id, value }, { upsert: true });
      return;
    }
    if (redis) {
      await redis.hset(`col:${col}`, { [id]: value as unknown as string });
      return;
    }
    if (pool) {
      await sql("insert into ch_records (col, id, value) values ($1, $2, $3) on conflict (col, id) do update set value = excluded.value", [col, id, JSON.stringify(value)]);
      return;
    }
    if (storageMode === "none") throw new StorageUnavailable();
    await locked(async () => writeJson(`col-${col}`, { ...(await readJson<Record<string, unknown>>(`col-${col}`, {})), [id]: value }));
  },
  async removeRecord(col: string, id: string): Promise<void> {
    if (mongoUrl) {
      await (await mongo()).records.deleteOne({ _id: recordKey(col, id) as never });
      return;
    }
    if (redis) {
      await redis.hdel(`col:${col}`, id);
      return;
    }
    if (pool) {
      await sql("delete from ch_records where col = $1 and id = $2", [col, id]);
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
    if (mongoUrl) {
      const { hits: col } = await mongo();
      const expired = { $lt: [{ $ifNull: ["$until", new Date(0)] }, "$$NOW"] };
      const bump = () =>
        col.findOneAndUpdate(
          { _id: key as never },
          [{ $set: { n: { $cond: [expired, 1, { $add: ["$n", 1] }] }, until: { $cond: [expired, new Date(Date.now() + windowSeconds * 1000), "$until"] } } }],
          { upsert: true, returnDocument: "after" },
        );
      // Two first-ever visits at the same instant can collide on the new row. The second try then finds it.
      const row = await bump().catch(() => bump());
      return Number(row?.n ?? 1);
    }
    if (redis) {
      const k = `hit:${key}`;
      const n = await redis.incr(k);
      if (n === 1) await redis.expire(k, windowSeconds);
      return n;
    }
    if (pool) {
      const rows = await sql<{ n: number }>(
        `insert into ch_hits (key, n, until) values ($1, 1, now() + make_interval(secs => $2))
         on conflict (key) do update set n = case when ch_hits.until < now() then 1 else ch_hits.n + 1 end,
           until = case when ch_hits.until < now() then excluded.until else ch_hits.until end
         returning n`,
        [key, windowSeconds],
      );
      return Number(rows[0]?.n ?? 1);
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
    if (mongoUrl) {
      await (await mongo()).blobs.replaceOne({ _id: id as never }, { data: Buffer.from(base64, "base64") }, { upsert: true });
      return;
    }
    if (redis) {
      await redis.set(`blob:${id}`, base64);
      return;
    }
    if (pool) {
      await sql("insert into ch_blobs (id, data) values ($1, decode($2, 'base64')) on conflict (id) do update set data = excluded.data", [id, base64]);
      return;
    }
    if (storageMode === "none") throw new StorageUnavailable();
    await fs.mkdir(path.join(DIR, "uploads"), { recursive: true });
    await fs.writeFile(path.join(DIR, "uploads", id), Buffer.from(base64, "base64"));
  },
  async getBlob(id: string): Promise<Buffer | null> {
    if (mongoUrl) {
      const bin = (await (await mongo()).blobs.findOne({ _id: id as never }))?.data as { buffer: Uint8Array; length(): number } | undefined;
      return bin ? Buffer.from(bin.buffer.subarray(0, bin.length())) : null;
    }
    if (redis) {
      const v = await redis.get<string>(`blob:${id}`);
      return v ? Buffer.from(v, "base64") : null;
    }
    if (pool) return (await sql<{ data: Buffer }>("select data from ch_blobs where id = $1", [id]))[0]?.data ?? null;
    if (storageMode === "none") return null;
    try {
      return await fs.readFile(path.join(DIR, "uploads", id.replace(/[^a-z0-9._-]/gi, "_")));
    } catch {
      return null;
    }
  },
  async deleteBlob(id: string): Promise<void> {
    if (mongoUrl) {
      await (await mongo()).blobs.deleteOne({ _id: id as never });
      return;
    }
    if (redis) {
      await redis.del(`blob:${id}`);
      return;
    }
    if (pool) {
      await sql("delete from ch_blobs where id = $1", [id]);
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
