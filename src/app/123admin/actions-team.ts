"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { hashPassword, log, newId, requirePerm, users } from "@/lib/auth";
import { departments, departmentName } from "@/lib/rbac";
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
const campDepartments = ["camps", "jewels", "teen-life"] as const;
type CampDepartment = (typeof campDepartments)[number];
const isCampDepartment = (value: string): value is CampDepartment => campDepartments.includes(value as CampDepartment);

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

/** Add an existing, active department head to one camp team without changing their other access. */
export async function addCampDepartment(fd: FormData): Promise<Result> {
  const admin = await requirePerm("users");
  return guard(async () => {
    const user = await users.get(text(fd, "userId", 40));
    const department = text(fd, "department", 40);
    if (!isCampDepartment(department)) return bad("Choose Camps Department, Jewels or Teen Life.");
    if (!user) return bad("That team member could not be found. Refresh the page and try again.");
    if (user.role !== "head") return bad("Administrators already have access to every camp.");
    if (!user.active) return bad("Switch this team account on before assigning camp access.");
    if (fd.get("departmentHeadApproved") !== "yes") return bad("Confirm that the relevant department head approved this access.");
    if (user.departments.includes(department)) return bad("That person already has this camp access.");
    if (department !== "camps" && user.departments.includes("camps")) {
      return bad("This person already has access to every camp through Camps Department.");
    }

    await users.put({ ...user, departments: [...new Set([...user.departments, department])] });
    await log(admin, "Granted camp team access", `${user.name} (${departmentName(department)})`);
    revalidatePath("/123admin/team");
    revalidatePath("/123admin/team/camps");
    return ok(`${user.name} can now access ${departmentName(department)}.`);
  });
}

/** Remove one camp department while leaving the person's other team access intact. */
export async function removeCampDepartment(fd: FormData): Promise<Result> {
  const admin = await requirePerm("users");
  return guard(async () => {
    const user = await users.get(text(fd, "userId", 40));
    const department = text(fd, "department", 40);
    if (!isCampDepartment(department)) return bad("Choose Camps Department, Jewels or Teen Life.");
    if (!user) return bad("That team member could not be found. Refresh the page and try again.");
    if (user.role !== "head") return bad("Administrator access is managed from the team member's account.");
    if (!user.departments.includes(department)) return bad("That person no longer has this camp access.");
    const remaining = user.departments.filter((id) => id !== department);
    if (remaining.length === 0) {
      return bad("This is their only department. Give them another department before removing it, or switch off their account to stop sign-in.");
    }

    await users.put({ ...user, departments: remaining });
    await log(admin, "Removed camp team access", `${user.name} (${departmentName(department)})`);
    revalidatePath("/123admin/team");
    revalidatePath("/123admin/team/camps");
    return ok(`${user.name} no longer has ${departmentName(department)} access.`);
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
