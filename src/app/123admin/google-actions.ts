"use server";

import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { ADMIN_PATH, clientKey, log, newId, startSession, systemStatus, users } from "@/lib/auth";
import { accessRequests } from "@/lib/access";
import { decide } from "@/lib/google-decide";
import { verifyGoogleCredential } from "@/lib/google-verify";
import { notifyAccessRequest } from "@/lib/notify";
import { store } from "@/lib/store";
import type { StoredUser } from "@/lib/types";

const NONCE = "ch_gnonce";
export type GoogleResult = { ok: boolean; next?: string; requested?: boolean; message?: string };

/** A one-time value that must come back inside Google's answer, so a sign-in made elsewhere cannot be replayed here. */
export async function googleNonce(): Promise<string> {
  const nonce = randomBytes(18).toString("base64url");
  (await cookies()).set(NONCE, nonce, { httpOnly: true, secure: process.env.NODE_ENV === "production" && Boolean(process.env.VERCEL), sameSite: "lax", path: "/", maxAge: 600 });
  return nonce;
}

const fail = (message: string): GoogleResult => ({ ok: false, message });

export async function googleSignIn(credential: string): Promise<GoogleResult> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return fail("Google sign-in is not switched on for this site yet.");
  if (!(await systemStatus()).signIn) return fail("Sign-in is not switched on for this site yet.");
  if ((await store.hit(`google-ip:${await clientKey()}`, 600)) > 20) return fail("Too many tries. Please wait 10 minutes and try again.");

  const jar = await cookies();
  const nonce = jar.get(NONCE)?.value ?? "";
  jar.delete(NONCE);
  let who;
  try {
    who = await verifyGoogleCredential(String(credential).slice(0, 4000), { clientId, nonce });
  } catch {
    return fail("Google sign-in did not work. Please reload the page and try again.");
  }

  const [all, requests] = await Promise.all([users.list(), accessRequests.list()]);
  const d = decide(who, all, requests);

  if (d.kind === "off") return fail("This account is switched off. Please ask the administrator.");
  if (d.kind === "mismatch") {
    await log("Google sign-in", "Refused a Google account that does not match the one linked to that team member", who.email);
    return fail("That Google account is not the one linked to this team member. Please ask the administrator.");
  }

  if (d.kind === "signin") {
    const now = new Date().toISOString();
    let user: StoredUser = { ...d.user, lastLogin: now };
    if (d.firstTime) {
      // Link Google by its own id. A department head then signs in with Google only: the temporary password is retired.
      user = { ...user, googleSub: who.sub, ...(user.role === "admin" ? {} : { hash: "", mustChange: false }) };
    }
    await users.put(user);
    await startSession(user);
    await log(user, "Signed in with Google");
    return { ok: true, next: user.mustChange ? `${ADMIN_PATH}/account` : ADMIN_PATH };
  }

  // Not on the team: leave a request for an administrator. Declined people are told the same thing, quietly.
  const existing = d.existing;
  const now = new Date().toISOString();
  if (existing) {
    if (existing.status === "pending") await accessRequests.put({ ...existing, lastTriedAt: now, tries: existing.tries + 1 });
    return { ok: true, requested: true };
  }
  if ((await accessRequests.list()).filter((r) => r.status === "pending").length >= 100) return fail("Too many requests are waiting. Please call the office.");
  if ((await store.hit(`google-ask-ip:${await clientKey()}`, 86400)) > 5) return fail("Too many requests from this place today. Please try again tomorrow.");
  await accessRequests.put({ id: newId(), email: who.email, name: who.name, sub: who.sub, status: "pending", createdAt: now, lastTriedAt: now, tries: 1 });
  await log("Google sign-in", "Someone asked for team access", who.email);
  await notifyAccessRequest();
  return { ok: true, requested: true };
}
