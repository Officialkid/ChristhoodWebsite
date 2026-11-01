"use server";

import { after } from "next/server";
import { collection, store } from "@/lib/store";
import { clientKey, newId } from "@/lib/auth";
import { mirrorToSheet, notifyTeam } from "@/lib/notify";
import { site } from "@/content/site";
import type { Prayer } from "@/lib/types";

export type FormState = { ok: boolean; message?: string; errors?: Record<string, string>; name?: string; type?: string };

const prayers = collection<Prayer>("prayers");

const clean = (v: FormDataEntryValue | null, max = 200) => String(v ?? "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max);
const phoneOk = (v: string) => /^\+?[\d\s().-]{7,20}$/.test(v) && v.replace(/\D/g, "").length >= 7;

const trapped = (fd: FormData) => Boolean(clean(fd.get("website"))) || Number(fd.get("elapsedMs") ?? 0) < 2500;
const busy = async () => (await store.hit(`form:${await clientKey()}`, 3600)) > 12;
const fail = (message: string): FormState => ({ ok: false, message });
const couldNotSave = fail(`We could not save that just now. Please call or WhatsApp us on 0${site.whatsapp.prayer.replace(/^254/, "")} and we will help.`);

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
