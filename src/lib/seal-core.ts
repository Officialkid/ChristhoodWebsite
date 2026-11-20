import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/** The sealing format itself (AES-256-GCM), shared by the website and the one-off import script. */
export const keyFrom = (secret: string): Buffer => createHash("sha256").update(secret).digest();

/** Eight characters that identify a key without revealing it (a hash of a hash). The site and the import script print the same value, so two keys can be compared by eye. */
export const keyFingerprint = (key: Buffer): string => createHash("sha256").update(key).digest("hex").slice(0, 8);

export function sealWith(key: Buffer, value: unknown): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const body = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return `v1.${iv.toString("base64")}.${cipher.getAuthTag().toString("base64")}.${body.toString("base64")}`;
}

export function unsealWith<T>(key: Buffer, sealed: string): T {
  const [v, iv, tag, body] = String(sealed).split(".");
  if (v !== "v1" || !iv || !tag || !body) throw new Error("Unknown sealed format.");
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return JSON.parse(Buffer.concat([decipher.update(Buffer.from(body, "base64")), decipher.final()]).toString("utf8")) as T;
}

/** Why a record would not open, in a word the team screens can act on. Never carries any of the data. */
export type SealProblem = "no-key" | "format" | "wrong-key";
export function sealProblem(error: unknown): SealProblem {
  const m = error instanceof Error ? error.message : "";
  if (m.startsWith("Registration key")) return "no-key";
  if (m.startsWith("Unknown sealed format") || error instanceof SyntaxError) return "format";
  // AES-GCM fails its check when the key differs, or when the stored text was altered.
  return "wrong-key";
}
