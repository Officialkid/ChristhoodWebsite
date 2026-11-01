"use server";

import { requireUser, log } from "@/lib/auth";
import { mayOpenCamp } from "@/lib/rbac";
import { collection, StorageUnavailable } from "@/lib/store";
import { camperRows } from "@/lib/camper-csv";
import { seal, sealingReady } from "@/lib/crypto";
import type { Result } from "@/components/admin/forms";
import type { CampApplication, CampAppStatus, Camper, CamperSealed } from "@/lib/types";

const applications = collection<CampApplication>("camp-applications");
const text = (fd: FormData, k: string, max = 2000) => String(fd.get(k) ?? "").trim().slice(0, max);
const ok = (message: string): Result => ({ ok: true, message, stamp: Date.now() });
const bad = (message: string): Result => ({ ok: false, message, stamp: Date.now() });

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

const statuses: CampAppStatus[] = ["Pending review", "Approved", "Needs correction", "Declined"];

export async function reviewApplication(_prev: Result, fd: FormData): Promise<Result> {
  const user = await requireUser();
  return guard(async () => {
    const app = await applications.get(text(fd, "id", 40));
    if (!app || !mayOpenCamp(user, app)) return bad("That application is not available to you.");
    const status = text(fd, "status", 30) as CampAppStatus;
    if (!statuses.includes(status)) return bad("Choose a decision.");
    const now = new Date().toISOString();
    await applications.put({ ...app, status, paymentVerified: fd.get("paymentVerified") === "yes", reviewNote: text(fd, "note") || undefined, reviewedBy: user.name, reviewedAt: now, updatedAt: now });
    await log(user, `Marked a camp application "${status}"`, app.childName);
    return ok("Saved.");
  });
}

export async function deleteApplication(fd: FormData): Promise<Result> {
  const user = await requireUser();
  if (user.role !== "admin") return bad("Only an administrator can delete an application.");
  return guard(async () => {
    const app = await applications.get(text(fd, "id", 40));
    if (!app) return bad("That application is already gone.");
    await applications.remove(app.id);
    await log(user, "Deleted a camp application", app.childName);
    return ok("Application deleted.");
  });
}

/** Administrators only: add returning campers from a spreadsheet saved as CSV (id, name, camp, year, age, guardian, location, contact). */
export async function importCampers(_prev: Result, fd: FormData): Promise<Result> {
  const user = await requireUser();
  if (user.role !== "admin") return bad("Only an administrator can import campers.");
  return guard(async () => {
    if (!(await sealingReady())) return bad("The registration key is not set, so private details cannot be kept yet. See System status.");
    const { rows, skipped } = camperRows(text(fd, "csv", 2_000_000));
    if (!rows.length) return bad("No campers were found. The first row must name the columns: id, name, camp, year, age, guardian, location, contact.");
    const campers = collection<Camper>("campers");
    for (const r of rows) {
      const data: CamperSealed = { age: r.age, guardian: r.guardian, location: r.location, contact: r.contact };
      await campers.put({ id: r.id, camp: r.camp, name: r.name, year: r.year, sealed: await seal(data) });
    }
    await log(user, "Imported returning campers", `${rows.length}`);
    return ok(`${rows.length} campers imported${skipped ? `, ${skipped} rows skipped` : ""}.`);
  });
}
