import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { randomBytes, randomUUID, scrypt, timingSafeEqual } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { collection, store } from "./store";
import { can, eventDepartments, type Perm } from "./rbac";
import type { Activity, StoredUser } from "./types";

export const users = collection<StoredUser>("users");
const activity = collection<Activity>("activity");

export const ADMIN_PATH = "/123admin";
const COOKIE = "ch_session";
const SESSION_HOURS = 12;

/* ---------- passwords ---------- */
const derive = (password: string, salt: Buffer) =>
  new Promise<Buffer>((resolve, reject) => scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (e, key) => (e ? reject(e) : resolve(key))));

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  return `s1$${salt.toString("base64")}$${(await derive(password, salt)).toString("base64")}`;
}

const DUMMY = hashPassword("not-a-real-password-just-for-timing");

export async function checkPassword(password: string, stored?: string): Promise<boolean> {
  const [tag, saltB64, keyB64] = (stored ?? (await DUMMY)).split("$");
  if (tag !== "s1" || !saltB64 || !keyB64) return false;
  const want = Buffer.from(keyB64, "base64");
  const got = await derive(password, Buffer.from(saltB64, "base64"));
  return stored ? want.length === got.length && timingSafeEqual(want, got) : false;
}

/** At least 10 characters with a letter and a number. */
export function passwordProblem(password: string): string | null {
  if (password.length < 10) return "Use at least 10 characters.";
  if (!/[a-z]/i.test(password) || !/\d/.test(password)) return "Mix letters and numbers.";
  return null;
}

/* ---------- the signing secret ---------- */
async function loadSecret(): Promise<Uint8Array | null> {
  const fromEnv = process.env.AUTH_SECRET;
  if (fromEnv && fromEnv.length >= 24) return new TextEncoder().encode(fromEnv);
  if (process.env.VERCEL) return null;
  // Running on a computer: make one once and keep it beside the data.
  const f = path.join(process.cwd(), ".data", "secret.txt");
  const read = async () => new TextEncoder().encode((await fs.readFile(f, "utf8")).trim());
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
// Share one pending promise so two requests arriving together can never make two different secrets.
let secretPromise: Promise<Uint8Array | null> | undefined;
export const secretKey = () => (secretPromise ??= loadSecret());

/** What is and is not switched on. Shown on the System status page. */
export async function systemStatus() {
  return {
    storage: store.mode,
    signIn: Boolean(await secretKey()),
    setupKey: Boolean(process.env.ADMIN_SETUP_KEY) || !process.env.VERCEL,
    photoHost: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    sealing: Boolean(process.env.REGISTRATION_KEY) || !process.env.VERCEL,
    email: Boolean(process.env.SMTP_HOST && process.env.NOTIFY_EMAILS),
    sheet: Boolean(process.env.GOOGLE_SHEET_WEBHOOK),
  };
}

/* ---------- sessions ---------- */
const fingerprint = (u: StoredUser) => u.hash.slice(-12);

export async function startSession(user: StoredUser) {
  const key = await secretKey();
  if (!key) throw new Error("Sign-in is not set up on this site yet.");
  const token = await new SignJWT({ f: fingerprint(user) })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_HOURS}h`)
    .sign(key);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" && Boolean(process.env.VERCEL),
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_HOURS * 3600,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

/** The signed-in person, checked against the saved record every time so removed or changed accounts lose access at once. */
export const getUser = cache(async (): Promise<StoredUser | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  const key = await secretKey();
  if (!token || !key) return null;
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    const user = payload.sub ? await users.get(payload.sub) : null;
    if (!user || !user.active || payload.f !== fingerprint(user)) return null;
    return user;
  } catch {
    return null;
  }
});

export async function requireUser(): Promise<StoredUser> {
  const user = await getUser();
  if (!user) redirect(ADMIN_PATH);
  return user;
}

export async function requirePerm(perm: Perm): Promise<StoredUser> {
  const user = await requireUser();
  if (user.mustChange) redirect(`${ADMIN_PATH}/account`);
  if (!can(user, perm)) redirect(`${ADMIN_PATH}/no-access`);
  return user;
}

export async function requireEvents(): Promise<StoredUser> {
  const user = await requireUser();
  if (user.mustChange) redirect(`${ADMIN_PATH}/account`);
  if (!eventDepartments(user).length) redirect(`${ADMIN_PATH}/no-access`);
  return user;
}

/* ---------- guarding sign-in ---------- */
export async function clientKey(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "local").trim();
}

/** True while this person or address has made too many attempts. */
export async function tooManyAttempts(email: string): Promise<boolean> {
  const [byIp, byEmail] = await Promise.all([store.hit(`login-ip:${await clientKey()}`, 600), store.hit(`login-email:${email.toLowerCase()}`, 900)]);
  return byIp > 15 || byEmail > 8;
}

export async function needsSetup(): Promise<boolean> {
  return (await users.list()).length === 0;
}

export function newId() {
  return randomUUID().replace(/-/g, "").slice(0, 16);
}

/* ---------- activity log ---------- */
export async function log(user: Pick<StoredUser, "name"> | string, action: string, target?: string) {
  try {
    const id = `${Date.now().toString(36)}-${randomBytes(3).toString("hex")}`;
    await activity.put({ id, at: new Date().toISOString(), by: typeof user === "string" ? user : user.name, action, target });
  } catch {
    /* the log must never block a save */
  }
}
export async function recentActivity(n = 60): Promise<Activity[]> {
  return (await activity.list()).sort((a, b) => b.at.localeCompare(a.at)).slice(0, n);
}

/** Cross-site request guard for route handlers: the request must come from this site. */
export async function sameOrigin(req: Request): Promise<boolean> {
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
