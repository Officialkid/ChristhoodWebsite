"use server";

import { after } from "next/server";
import { z } from "zod";
import { collection, store } from "@/lib/store";
import { clientKey, newId } from "@/lib/auth";
import { mirrorToSheet, notifyTeam } from "@/lib/notify";
import { site } from "@/content/site";
import type { Prayer, Visitor } from "@/lib/types";

export type FormState = { ok: boolean; message?: string; errors?: Record<string, string>; name?: string; type?: string };

const visitors = collection<Visitor>("visitors");
const prayers = collection<Prayer>("prayers");

const clean = (v: FormDataEntryValue | null, max = 200) => String(v ?? "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max);
const phoneOk = (v: string) => /^\+?[\d\s().-]{7,20}$/.test(v) && v.replace(/\D/g, "").length >= 7;
const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" });

const trapped = (fd: FormData) => Boolean(clean(fd.get("website"))) || Number(fd.get("elapsedMs") ?? 0) < 2500;
const busy = async () => (await store.hit(`form:${await clientKey()}`, 3600)) > 12;
const fail = (message: string): FormState => ({ ok: false, message });
const couldNotSave = fail(`We could not save that just now. Please call or WhatsApp us on 0${site.whatsapp.prayer.replace(/^254/, "")} and we will help.`);

/* ---------- new guests ---------- */
const visitorSchema = z.object({
  fullName: z.string().min(2, "Please enter your full name."),
  phone: z.string().refine(phoneOk, "Please enter a phone number we can reach you on."),
  email: z.string().email("That email address does not look right.").or(z.literal("")),
  visitDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Please choose the date of your visit.").refine((d) => d <= today(), "The date cannot be in the future."),
  firstVisit: z.enum(["First time", "Visited before"], { message: "Please choose one." }),
  consent: z.literal("Yes", { message: "Please tick this box so we can keep your details." }),
});

export async function submitVisitor(_prev: FormState, fd: FormData): Promise<FormState> {
  if (trapped(fd)) return { ok: true, name: "friend" };
  if (await busy()) return fail("That is a lot of forms from one place. Please try again in an hour.");

  const raw = {
    fullName: clean(fd.get("fullName"), 120),
    phone: clean(fd.get("phone"), 20),
    email: clean(fd.get("email"), 120),
    visitDate: clean(fd.get("visitDate"), 10),
    firstVisit: clean(fd.get("firstVisit"), 20),
    consent: clean(fd.get("consent"), 3),
  };
  const parsed = visitorSchema.safeParse(raw);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[String(issue.path[0])] ??= issue.message;
    return { ok: false, errors, message: "Please check the highlighted answers." };
  }

  const v: Visitor = {
    id: newId(),
    createdAt: new Date().toISOString(),
    fullName: raw.fullName,
    phone: raw.phone,
    email: raw.email || undefined,
    area: clean(fd.get("area"), 80) || undefined,
    ageGroup: clean(fd.get("ageGroup"), 30) || undefined,
    visitDate: raw.visitDate,
    firstVisit: raw.firstVisit,
    heardFrom: clean(fd.get("heardFrom"), 80) || undefined,
    invitedBy: clean(fd.get("invitedBy"), 120) || undefined,
    homeChurch: clean(fd.get("homeChurch"), 30) || undefined,
    interests: fd.getAll("interests").map((i) => clean(i, 80)).filter(Boolean).slice(0, 8),
    prayerRequest: clean(fd.get("prayerRequest"), 2000) || undefined,
    status: "new",
  };

  let saved = false;
  if (store.writable) {
    try {
      await visitors.put(v);
      saved = true;
    } catch (error) {
      console.error("Could not save visitor", error);
    }
  }
  const mirrored = await mirrorToSheet({
    form: "visitor", fullName: v.fullName, phone: v.phone, email: v.email ?? "", area: v.area ?? "", ageGroup: v.ageGroup ?? "", visitDate: v.visitDate,
    firstVisit: v.firstVisit, heardFrom: v.heardFrom ?? "", invitedBy: v.invitedBy ?? "", homeChurch: v.homeChurch ?? "", interests: v.interests.join("; "),
    prayerRequest: v.prayerRequest ?? "", consent: "Yes",
  });
  if (!saved && !mirrored) return couldNotSave;
  after(() => notifyTeam("visitor", v.fullName));
  return { ok: true, name: v.fullName.split(/\s+/)[0] };
}

/* ---------- prayer and thanksgiving ---------- */
export async function submitPrayer(_prev: FormState, fd: FormData): Promise<FormState> {
  if (trapped(fd)) return { ok: true, type: "prayer" };
  if (await busy()) return fail("That is a lot of forms from one place. Please try again in an hour.");

  const type = clean(fd.get("type"), 15) === "thanksgiving" ? "thanksgiving" : "prayer";
  const anonymous = clean(fd.get("anonymous"), 3) === "Yes";
  const message = clean(fd.get("message"), 3000);
  const phone = anonymous ? "" : clean(fd.get("phone"), 20);
  const callBack = !anonymous && clean(fd.get("callBack"), 3) === "Yes";
  const errors: Record<string, string> = {};
  if (message.length < 3) errors.message = "Please write a few words before sending.";
  if (phone && !phoneOk(phone)) errors.phone = "Please check this phone number.";
  if (callBack && !phone) errors.phone = "Please add your number so we can call you back.";
  if (type === "prayer" && !clean(fd.get("whoMaySee"))) errors.whoMaySee = "Please choose who may read your request.";
  if (type === "thanksgiving" && !clean(fd.get("mayShare"))) errors.mayShare = "Please choose one.";
  if (clean(fd.get("consent"), 3) !== "Yes") errors.consent = "Please tick this box so we can receive your message.";
  if (Object.keys(errors).length) return { ok: false, errors, message: "Please check the highlighted answers.", type };

  const p: Prayer = {
    id: newId(),
    createdAt: new Date().toISOString(),
    type,
    anonymous,
    name: anonymous ? undefined : clean(fd.get("name"), 120) || undefined,
    phone: phone || undefined,
    category: type === "prayer" ? clean(fd.get("category"), 80) || undefined : undefined,
    message,
    whoMaySee: type === "prayer" ? clean(fd.get("whoMaySee"), 80) : undefined,
    mayShare: type === "thanksgiving" ? clean(fd.get("mayShare"), 80) : undefined,
    callBack,
    status: "new",
  };

  let saved = false;
  if (store.writable) {
    try {
      await prayers.put(p);
      saved = true;
    } catch (error) {
      console.error("Could not save prayer", error);
    }
  }
  const mirrored = await mirrorToSheet({
    form: "prayer", type, anonymous: anonymous ? "Yes" : "", name: p.name ?? "", phone: p.phone ?? "", category: p.category ?? "", message: p.message,
    whoMaySee: p.whoMaySee ?? "", mayShare: p.mayShare ?? "", callBack: callBack ? "Yes" : "", consent: "Yes",
  });
  if (!saved && !mirrored) return { ...couldNotSave, type };
  after(() => notifyTeam(type, p.name ?? "Anonymous"));
  return { ok: true, type, name: p.name?.split(/\s+/)[0] };
}
