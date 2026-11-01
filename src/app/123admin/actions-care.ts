"use server";

import { z } from "zod";
import { requirePerm, log, newId } from "@/lib/auth";
import { getSettings } from "@/lib/content";
import { mirrorToSheet, welcomeEmail } from "@/lib/notify";
import { canReadPrayer } from "@/lib/rbac";
import { collection, StorageUnavailable } from "@/lib/store";
import type { Result } from "@/components/admin/forms";
import type { Prayer, Visitor } from "@/lib/types";

const visitors = collection<Visitor>("visitors");
const prayers = collection<Prayer>("prayers");
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

export async function updateGuest(fd: FormData): Promise<Result> {
  const user = await requirePerm("visitors");
  return guard(async () => {
    const v = await visitors.get(text(fd, "id", 40));
    if (!v) return bad("That guest is no longer in the list.");
    const status = text(fd, "status", 12) as Visitor["status"];
    if (!["new", "contacted", "settled"].includes(status)) return bad("Choose a status.");
    await visitors.put({ ...v, status, notes: text(fd, "notes") || undefined, followedUpBy: status === "new" ? undefined : v.followedUpBy && v.status !== "new" ? v.followedUpBy : user.name });
    await log(user, "Updated a guest", v.fullName);
    return ok("Saved.");
  });
}

export async function deleteGuest(fd: FormData): Promise<Result> {
  const user = await requirePerm("visitors");
  if (user.role !== "admin" && !user.departments.includes("pastoral")) return bad("Only the pastoral team or an administrator can delete guest records.");
  return guard(async () => {
    const v = await visitors.get(text(fd, "id", 40));
    if (!v) return bad("That guest is already gone.");
    await visitors.remove(v.id);
    await log(user, "Deleted a guest record", v.fullName);
    return ok("Guest record deleted.");
  });
}

export async function updatePrayer(fd: FormData): Promise<Result> {
  const user = await requirePerm("prayers");
  return guard(async () => {
    const p = await prayers.get(text(fd, "id", 40));
    if (!p || !canReadPrayer(user, p)) return bad("That request is not available to you.");
    const status = text(fd, "status", 12) as Prayer["status"];
    if (!["new", "praying", "done"].includes(status)) return bad("Choose a status.");
    await prayers.put({ ...p, status, notes: text(fd, "notes") || undefined, handledBy: status === "new" ? undefined : p.handledBy && p.status !== "new" ? p.handledBy : user.name });
    await log(user, "Updated a prayer request");
    return ok("Saved.");
  });
}

export async function deletePrayer(fd: FormData): Promise<Result> {
  const user = await requirePerm("prayers");
  return guard(async () => {
    const p = await prayers.get(text(fd, "id", 40));
    if (!p || !canReadPrayer(user, p)) return bad("That request is not available to you.");
    await prayers.remove(p.id);
    await log(user, "Deleted a prayer request");
    return ok("Request deleted.");
  });
}

/* ---------- registering a new member: the protocol team only ---------- */
const phoneOk = (v: string) => /^\+?[\d\s().-]{7,20}$/.test(v) && v.replace(/\D/g, "").length >= 7;
const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" });

const memberSchema = z.object({
  fullName: z.string().min(2, "Enter their full name."),
  phone: z.string().refine(phoneOk, "Enter a phone number we can reach them on."),
  email: z.string().email("That email address does not look right.").or(z.literal("")),
  visitDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose the date they joined us.").refine((d) => d <= today(), "The date cannot be in the future."),
  firstVisit: z.enum(["First time", "Visited before"], { message: "Choose one." }),
  consent: z.literal("Yes", { message: "Tick this once they have agreed we may keep their details." }),
});

export async function registerMember(_prev: Result, fd: FormData): Promise<Result> {
  // Only the protocol team (and administrators) may set up a new member. Everyone else is refused here, not just hidden in the menu.
  const user = await requirePerm("members");
  return guard(async () => {
    const noEmail = text(fd, "noEmail", 3) === "Yes";
    const raw = {
      fullName: text(fd, "fullName", 120),
      phone: text(fd, "phone", 20),
      email: noEmail ? "" : text(fd, "email", 120),
      visitDate: text(fd, "visitDate", 10),
      firstVisit: text(fd, "firstVisit", 20),
      consent: text(fd, "consent", 3),
    };
    const parsed = memberSchema.safeParse(raw);
    const errors: Record<string, string> = {};
    if (!parsed.success) for (const issue of parsed.error.issues) errors[String(issue.path[0])] ??= issue.message;
    if (!noEmail && !raw.email && !errors.email) errors.email = "Enter their email address, or tick that they have none.";
    if (Object.keys(errors).length) return { ok: false, errors, message: "Please fix the highlighted answers.", stamp: Date.now() };

    const v: Visitor = {
      id: newId(),
      createdAt: new Date().toISOString(),
      fullName: raw.fullName,
      phone: raw.phone,
      email: raw.email || undefined,
      area: text(fd, "area", 80) || undefined,
      ageGroup: text(fd, "ageGroup", 30) || undefined,
      visitDate: raw.visitDate,
      firstVisit: raw.firstVisit,
      heardFrom: text(fd, "heardFrom", 80) || undefined,
      invitedBy: text(fd, "invitedBy", 120) || undefined,
      homeChurch: text(fd, "homeChurch", 30) || undefined,
      interests: fd.getAll("interests").map((i) => String(i).trim().slice(0, 80)).filter(Boolean).slice(0, 8),
      prayerRequest: text(fd, "prayerRequest", 2000) || undefined,
      status: "new",
      registeredBy: user.name,
    };
    await visitors.put(v);
    await mirrorToSheet({
      form: "visitor", fullName: v.fullName, phone: v.phone, email: v.email ?? "", area: v.area ?? "", ageGroup: v.ageGroup ?? "", visitDate: v.visitDate,
      firstVisit: v.firstVisit, heardFrom: v.heardFrom ?? "", invitedBy: v.invitedBy ?? "", homeChurch: v.homeChurch ?? "", interests: v.interests.join("; "),
      prayerRequest: v.prayerRequest ?? "", consent: "Yes",
    });
    await log(user, "Registered a new member", v.fullName);

    let note = "";
    if (v.email && text(fd, "sendWelcome", 3) === "Yes") {
      const sent = await welcomeEmail(v.email, v.fullName.split(/\s+/)[0], await getSettings());
      note = sent === "sent" ? " A welcome email has been sent." : sent === "failed" ? " The welcome email could not be sent." : " Welcome emails are not switched on yet, so none was sent.";
    }
    return { ok: true, message: `${v.fullName.split(/\s+/)[0]} is registered.${note}`, stamp: Date.now(), id: v.id };
  });
}
