"use server";

import { randomInt } from "node:crypto";
import { hashPassword, log, newId, requirePerm, users } from "@/lib/auth";
import { departments } from "@/lib/rbac";
import { StorageUnavailable } from "@/lib/store";
import type { Result } from "@/components/admin/forms";
import type { Role, StoredUser } from "@/lib/types";

const text = (fd: FormData, k: string, max = 200) => String(fd.get(k) ?? "").trim().slice(0, max);
const ok = (message: string, extra: Partial<Result> = {}): Result => ({ ok: true, message, stamp: Date.now(), ...extra });
const bad = (message: string, errors?: Record<string, string>): Result => ({ ok: false, message, errors, stamp: Date.now() });

/** Easy to read out loud: no 0/O or 1/l. */
function tempPassword() {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 12 }, () => chars[randomInt(chars.length)]).join("");
}

async function guard(fn: () => Promise<Result>): Promise<Result> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof StorageUnavailable) return bad(error.message);
    if (error && typeof error === "object" && "digest" in error) throw error;
    console.error(error);
    return bad("Something went wrong. Please try again.");
  }
}

const validDepartments = (fd: FormData) => fd.getAll("departments").map(String).filter((d) => departments.some((x) => x.id === d));

export async function saveUser(_p: Result, fd: FormData): Promise<Result> {
  const admin = await requirePerm("users");
  return guard(async () => {
    const id = text(fd, "id", 40);
    const existing = id ? await users.get(id) : null;
    const name = text(fd, "name", 80);
    const email = text(fd, "email", 120).toLowerCase();
    const role: Role = text(fd, "role", 10) === "admin" ? "admin" : "head";
    const deps = validDepartments(fd);
    const active = existing ? fd.get("active") === "yes" : true;

    const errors: Record<string, string> = {};
    if (name.length < 2) errors.name = "Enter their name.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errors.email = "Enter a valid email address.";
    const all = await users.list();
    if (all.some((u) => u.email === email && u.id !== existing?.id)) errors.email = "Someone already uses that email.";
    if (role === "head" && !deps.length) errors.departments = "Choose at least one department.";
    if (Object.keys(errors).length) return bad("Please fix the highlighted answers.", errors);

    if (existing) {
      const admins = all.filter((u) => u.role === "admin" && u.active && u.id !== existing.id);
      if (existing.id === admin.id && (role !== "admin" || !active)) return bad("You cannot remove your own administrator access or switch yourself off.");
      if ((existing.role === "admin" && (role !== "admin" || !active)) && admins.length === 0) return bad("There must always be at least one active administrator.");
      await users.put({ ...existing, name, email, role, departments: role === "admin" ? [] : deps, active });
      await log(admin, "Changed a team member", name);
      return ok("Saved.", { id: existing.id });
    }

    const password = tempPassword();
    const user: StoredUser = { id: newId(), email, name, role, departments: role === "admin" ? [] : deps, hash: await hashPassword(password), active: true, mustChange: true, createdAt: new Date().toISOString() };
    await users.put(user);
    await log(admin, "Added a team member", name);
    return ok(`${name} can now sign in.`, { id: user.id, secret: password });
  });
}

export async function resetUserPassword(fd: FormData): Promise<Result> {
  const admin = await requirePerm("users");
  return guard(async () => {
    const user = await users.get(text(fd, "id", 40));
    if (!user) return bad("That person no longer exists.");
    const password = tempPassword();
    await users.put({ ...user, hash: await hashPassword(password), mustChange: true });
    await log(admin, "Reset a password", user.name);
    return ok(`New temporary password for ${user.name}.`, { secret: password });
  });
}

export async function deleteUser(fd: FormData): Promise<Result> {
  const admin = await requirePerm("users");
  return guard(async () => {
    const user = await users.get(text(fd, "id", 40));
    if (!user) return bad("That person is already gone.");
    if (user.id === admin.id) return bad("You cannot delete your own account.");
    const others = (await users.list()).filter((u) => u.role === "admin" && u.active && u.id !== user.id);
    if (user.role === "admin" && others.length === 0) return bad("There must always be at least one active administrator.");
    await users.remove(user.id);
    await log(admin, "Removed a team member", user.name);
    return ok(`${user.name} has been removed.`);
  });
}
