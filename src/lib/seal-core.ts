import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/** The sealing format itself (AES-256-GCM), shared by the website and the one-off import script. */
export const keyFrom = (secret: string): Buffer => createHash("sha256").update(secret).digest();

export function sealWith(key: Buffer, value: unknown): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const body = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return `v1.${iv.toString("base64")}.${cipher.getAuthTag().toString("base64")}.${body.toString("base64")}`;
}

export function unsealWith<T>(key: Buffer, sealed: string): T {
  const [v, iv, tag, body] = sealed.split(".");
  if (v !== "v1" || !iv || !tag || !body) throw new Error("Unknown sealed format.");
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return JSON.parse(Buffer.concat([decipher.update(Buffer.from(body, "base64")), decipher.final()]).toString("utf8")) as T;
}
