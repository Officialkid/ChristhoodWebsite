import "server-only";
import { randomBytes } from "node:crypto";
import { keyFrom, sealWith, unsealWith } from "./seal-core";
import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Children's medical and family details are sealed (AES-256-GCM) before they are saved, so the database alone never
 * holds them in readable form. The key comes from REGISTRATION_KEY on the live site, or a local key file while
 * running on a computer. Without a key, camp applications are not taken online at all (the page says so).
 */
let keyPromise: Promise<Buffer | null> | undefined;

async function loadKey(): Promise<Buffer | null> {
  const fromEnv = process.env.REGISTRATION_KEY;
  if (fromEnv && fromEnv.length >= 24) return keyFrom(fromEnv);
  if (process.env.VERCEL) return null;
  const f = path.join(process.cwd(), ".data", "registration.key");
  const read = async () => keyFrom((await fs.readFile(f, "utf8")).trim());
  try {
    return await read();
  } catch {
    await fs.mkdir(path.dirname(f), { recursive: true });
    try {
      await fs.writeFile(f, randomBytes(32).toString("hex"), { flag: "wx" });
    } catch {
      /* another request got there first */
    }
    return read();
  }
}
const getKey = () => (keyPromise ??= loadKey());

export const sealingReady = async () => Boolean(await getKey());

export async function seal(value: unknown): Promise<string> {
  const key = await getKey();
  if (!key) throw new Error("Registration key is not set.");
  return sealWith(key, value);
}

export async function unseal<T>(sealed: string): Promise<T> {
  const key = await getKey();
  if (!key) throw new Error("Registration key is not set.");
  return unsealWith<T>(key, sealed);
}
