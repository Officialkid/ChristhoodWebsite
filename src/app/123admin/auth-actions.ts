"use server";

import { redirect } from "next/navigation";
import { ADMIN_PATH, checkPassword, endSession, getUser, hashPassword, log, needsSetup, newId, passwordProblem, requireUser, startSession, systemStatus, tooManyAttempts, users } from "@/lib/auth";
import { store, StorageUnavailable } from "@/lib/store";
import type { Result } from "@/components/admin/forms";
import type { StoredUser } from "@/lib/types";

const text = (fd: FormData, k: string, max = 200) => String(fd.get(k) ?? "").trim().slice(0, max);
const done = (r: Omit<Result, "stamp">): Result => ({ ...r, stamp: Date.now() });

export async function login(_prev: Result, fd: FormData): Promise<Result> {
  const email = text(fd, "email").toLowerCase();
  const password = String(fd.get("password") ?? "").slice(0, 200);
  if (!email || !password) return done({ ok: false, message: "Enter your email and password." });
  if (!(await systemStatus()).signIn) return done({ ok: false, message: "Sign-in is not switched on for this site yet. See the setup steps in the README." });
  if (await tooManyAttempts(email)) return done({ ok: false, message: "Too many tries. Please wait 15 minutes and try again." });

  const user = (await users.list()).find((u) => u.email === email);
  const good = await checkPassword(password, user?.hash);
  if (!user || !good || !user.active) return done({ ok: false, message: "That email and password do not match." });

  try {
    await users.put({ ...user, lastLogin: new Date().toISOString() });
  } catch {
    /* signing in should not depend on this note */
  }
  await startSession(user);
  await log(user, "Signed in");
  redirect(user.mustChange ? `${ADMIN_PATH}/account` : ADMIN_PATH);
}

export async function setupFirstAdmin(_prev: Result, fd: FormData): Promise<Result> {
  if (!(await needsSetup())) return done({ ok: false, message: "This site already has an administrator. Please sign in." });
  const status = await systemStatus();
  if (!status.signIn) return done({ ok: false, message: "Sign-in is not switched on for this site yet. See the setup steps in the README." });
  if (!store.writable) return done({ ok: false, message: new StorageUnavailable().message });

  if (process.env.VERCEL) {
    const key = process.env.ADMIN_SETUP_KEY;
    if (!key) return done({ ok: false, message: "The setup key has not been added to the hosting settings yet." });
    if (text(fd, "setupKey", 100) !== key) return done({ ok: false, message: "That setup key is not right." });
  }
  const name = text(fd, "name", 80);
  const email = text(fd, "email", 120).toLowerCase();
  const password = String(fd.get("password") ?? "");
  const errors: Record<string, string> = {};
  if (name.length < 2) errors.name = "Enter your name.";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errors.email = "Enter a valid email address.";
  const problem = passwordProblem(password);
  if (problem) errors.password = problem;
  if (password !== String(fd.get("confirm") ?? "")) errors.confirm = "The two passwords are not the same.";
  if (Object.keys(errors).length) return done({ ok: false, errors, message: "Please fix the highlighted answers." });

  const user: StoredUser = { id: newId(), email, name, role: "admin", departments: [], hash: await hashPassword(password), active: true, createdAt: new Date().toISOString(), lastLogin: new Date().toISOString() };
  await users.put(user);
  await startSession(user);
  await log(user, "Created the first administrator account");
  redirect(ADMIN_PATH);
}

export async function logout() {
  const user = await getUser();
  if (user) await log(user, "Signed out");
  await endSession();
  redirect(ADMIN_PATH);
}

export async function changePassword(_prev: Result, fd: FormData): Promise<Result> {
  const user = await requireUser();
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("next") ?? "");
  const errors: Record<string, string> = {};
  if (!(await checkPassword(current, user.hash))) errors.current = "That is not your current password.";
  const problem = passwordProblem(next);
  if (problem) errors.next = problem;
  else if (next === current) errors.next = "Choose a password you have not used here before.";
  if (next !== String(fd.get("confirm") ?? "")) errors.confirm = "The two passwords are not the same.";
  if (Object.keys(errors).length) return done({ ok: false, errors, message: "Please fix the highlighted answers." });

  const updated: StoredUser = { ...user, hash: await hashPassword(next), mustChange: false };
  await users.put(updated);
  await startSession(updated);
  await log(user, "Changed their password");
  return done({ ok: true, message: "Password changed." });
}
