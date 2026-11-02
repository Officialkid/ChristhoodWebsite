import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { SignJWT, jwtVerify } from "jose";

/**
 * Small, dependency-free pieces shared by the proxy (which guards the team area) and the door routes.
 * No database here: a pass is just a signed, short-lived cookie.
 */
export const DOOR_COOKIE = "ch_door"; // "you knocked correctly": lets the sign-in page open
export const KNOCK_COOKIE = "ch_knock"; // "the phrase was right, now the code": lasts a few minutes
export const SESSION_COOKIE = "ch_session";

let cached: string | null | undefined;
/** The same secret the sign-in sessions use. On a computer it is the file kept beside the data. */
function rawSecret(): string | null {
  if (cached !== undefined) return cached;
  const env = process.env.AUTH_SECRET;
  if (env && env.length >= 24) return (cached = env);
  if (process.env.VERCEL) return (cached = null);
  try {
    return (cached = readFileSync(path.join(process.cwd(), ".data", "secret.txt"), "utf8").trim());
  } catch {
    return (cached = null);
  }
}

const enc = new TextEncoder();
/** Passes use their own key, so a pass can never stand in for a sign-in session or the other way round. */
const doorKey = (secret: string) => createHmac("sha256", secret).update("door-pass-v1").digest();

export async function signPass(kind: "door" | "knock", seconds: number): Promise<string | null> {
  const secret = rawSecret();
  if (!secret) return null;
  return new SignJWT({ k: kind }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(`${seconds}s`).sign(doorKey(secret));
}

export async function hasPass(token: string | undefined, kind: "door" | "knock"): Promise<boolean> {
  const secret = rawSecret();
  if (!token || !secret) return false;
  try {
    const { payload } = await jwtVerify(token, doorKey(secret), { algorithms: ["HS256"] });
    return payload.k === kind;
  } catch {
    return false;
  }
}

/** Signed and not expired. The pages still check the person against the saved record; this only keeps strangers out early. */
export async function hasSession(token: string | undefined): Promise<boolean> {
  const secret = rawSecret();
  if (!token || !secret) return false;
  try {
    await jwtVerify(token, enc.encode(secret), { algorithms: ["HS256"] });
    return true;
  } catch {
    return false;
  }
}

/** True when this site has no secret at all (a fresh computer): nothing can be checked, so the guard stays out of the way. */
export const noSecretOnThisComputer = () => !process.env.VERCEL && rawSecret() === null;
