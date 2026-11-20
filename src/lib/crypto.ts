import "server-only";
import { randomBytes } from "node:crypto";
import { keyFingerprint, keyFrom, sealProblem, sealWith, unsealWith, type SealProblem } from "./seal-core";
import { promises as fs } from "node:fs";
import path from "node:path";

export { sealProblem, type SealProblem };

/**
 * Children's medical and family details are sealed (AES-256-GCM) before they are saved, so the database alone never
 * holds them in readable form. The key comes from REGISTRATION_KEY on the live site, or a local key file while
 * running on a computer. Without a key, camp applications are not taken online at all (the page says so).
 */
let keysPromise: Promise<Buffer[]> | undefined;

/** The first key is the one new details are sealed with. Later ones are only tried when opening. */
async function loadKeys(): Promise<Buffer[]> {
  const fromEnv = process.env.REGISTRATION_KEY;
  if (fromEnv && fromEnv.length >= 24) {
    // A space, line break or pair of quotes pasted into the host's settings changes the key. Details sealed with the plain
    // value (for example by the import script) would then never open, so the plain forms are tried too. Nothing is rewritten.
    const forms = [fromEnv, fromEnv.trim(), fromEnv.trim().replace(/^(["'])(.*)\1$/s, "$2")].filter((f) => f.length >= 24);
    // REGISTRATION_KEY_PREVIOUS holds an older key whose records are still in the database. It is only used to open them; nothing is sealed with it.
    const older = (process.env.REGISTRATION_KEY_PREVIOUS ?? "").trim().replace(/^(["'])(.*)\1$/s, "$2");
    return [...new Set([...forms, ...(older.length >= 24 ? [older] : [])])].map(keyFrom);
  }
  if (process.env.VERCEL) return [];
  const f = path.join(process.cwd(), ".data", "registration.key");
  const read = async () => keyFrom((await fs.readFile(f, "utf8")).trim());
  try {
    return [await read()];
  } catch {
    await fs.mkdir(path.dirname(f), { recursive: true });
    try {
      await fs.writeFile(f, randomBytes(32).toString("hex"), { flag: "wx" });
    } catch {
      /* another request got there first */
    }
    return [await read()];
  }
}
const getKeys = () => (keysPromise ??= loadKeys());

export const sealingReady = async () => (await getKeys()).length > 0;

/** For the status screen: is there a key, and which one (a short fingerprint, never the key). */
export async function sealingKey(): Promise<{ ready: boolean; fingerprint?: string; alternates: number }> {
  const keys = await getKeys();
  return { ready: keys.length > 0, fingerprint: keys[0] ? keyFingerprint(keys[0]) : undefined, alternates: Math.max(0, keys.length - 1) };
}

export async function seal(value: unknown): Promise<string> {
  const [key] = await getKeys();
  if (!key) throw new Error("Registration key is not set.");
  return sealWith(key, value);
}

export async function unseal<T>(sealed: string): Promise<T> {
  const keys = await getKeys();
  if (!keys.length) throw new Error("Registration key is not set.");
  let first: unknown;
  for (const key of keys) {
    try {
      return unsealWith<T>(key, sealed);
    } catch (error) {
      first ??= error;
    }
  }
  throw first;
}
