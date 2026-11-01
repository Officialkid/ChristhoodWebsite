"use server";

import { z } from "zod";
import { requirePerm, requireUser, log, newId } from "@/lib/auth";
import { canEditEvent, can, eventDepartments } from "@/lib/rbac";
import { eventsDb, ensureSeeded, leadersDb, messagesDb, pagesDb, slotsDb, storiesDb, type BannerDoc } from "@/lib/content";
import { StorageUnavailable, store } from "@/lib/store";
import { fromNairobiInput } from "@/lib/time";
import { publish } from "@/lib/publish";
import { deleteUpload, mediaDb } from "@/lib/media";
import { allSlots } from "@/content/slots";
import { defaultSettings } from "@/content/site";
import type { Result } from "@/components/admin/forms";
import type { Block, EventDoc, SiteSettings } from "@/lib/types";

const text = (fd: FormData, k: string, max = 400) => String(fd.get(k) ?? "").replace(/\r/g, "").trim().slice(0, max);
const lines = (fd: FormData, k: string, max = 4000) => text(fd, k, max).split(/\n+/).map((l) => l.trim()).filter(Boolean);
const paragraphs = (fd: FormData, k: string) => text(fd, k, 20000).split(/\n{2,}/).map((l) => l.replace(/\n/g, " ").trim()).filter(Boolean);
/** A picture reference is a church photo name, an uploaded picture, or an https address. Anything else is dropped. */
const photoRef = (v: string) => (/^(https:\/\/[^\s"<>]{4,480}|\/media\/[a-z0-9-]+\.webp|[a-z0-9-]{1,80})$/i.test(v) ? v : undefined);
const ok = (message: string, extra: Partial<Result> = {}): Result => ({ ok: true, message, stamp: Date.now(), ...extra });
const bad = (message: string, errors?: Record<string, string>): Result => ({ ok: false, message, errors, stamp: Date.now() });
const guard = async <T>(fn: () => Promise<T>): Promise<T | Result> => {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof StorageUnavailable) return bad(error.message);
    // Next uses thrown values for redirects; let those through.
    if (error && typeof error === "object" && "digest" in error) throw error;
    console.error(error);
    return bad("Something went wrong while saving. Please try again.");
  }
};
const isResult = (v: unknown): v is Result => typeof v === "object" && v !== null && "stamp" in v;

/* ================= events ================= */
const categories = ["camp", "mentorship", "missions", "fellowship", "prayer"] as const;
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);

export async function saveEvent(_p: Result, fd: FormData): Promise<Result> {
  const user = await requireUser();
  const out = await guard(async () => {
    await ensureSeeded("events");
    const id = text(fd, "id", 80);
    const existing = id ? await eventsDb.get(id) : null;
    if (existing && !canEditEvent(user, existing)) return bad("You can only change events that belong to your department.");
    const allowed = eventDepartments(user);
    if (!existing && !allowed.length) return bad("Your department cannot add events.");

    const errors: Record<string, string> = {};
    const title = text(fd, "title", 120);
    if (title.length < 3) errors.title = "Give the event a name.";
    const start = fromNairobiInput(text(fd, "start", 20));
    if (!start) errors.start = "Choose when it starts.";
    const endRaw = text(fd, "end", 20);
    const end = endRaw ? fromNairobiInput(endRaw) : undefined;
    if (endRaw && !end) errors.end = "That date does not look right.";
    if (start && end && new Date(end) < new Date(start)) errors.end = "It cannot end before it starts.";
    const category = text(fd, "category", 20) as EventDoc["category"];
    if (!categories.includes(category)) errors.category = "Choose a type.";
    const feeRaw = text(fd, "fee", 12);
    const fee = feeRaw === "" ? undefined : Number(feeRaw);
    if (fee !== undefined && (!Number.isFinite(fee) || fee < 0)) errors.fee = "Enter the amount in shillings, or leave it empty.";
    const href = text(fd, "registerHref", 300);
    if (href && !/^(\/|https:\/\/)/.test(href)) errors.registerHref = "Start the link with / (a page on this site) or https://.";
    const department = text(fd, "department", 60) || undefined;
    if (department && !allowed.some((d) => d.id === department) && department !== existing?.department) errors.department = "Choose a department you look after.";
    if (!existing && !department && user.role !== "admin" && !can(user, "events:all")) errors.department = "Choose the department this event belongs to.";
    if (Object.keys(errors).length) return bad("Please fix the highlighted answers.", errors);

    const event: EventDoc = {
      id: existing?.id ?? `${slug(title) || "event"}-${newId().slice(0, 6)}`,
      title,
      subtitle: text(fd, "subtitle", 120) || undefined,
      start: start!,
      end,
      location: text(fd, "location", 160) || undefined,
      fee,
      category,
      image: photoRef(text(fd, "image", 500)),
      details: text(fd, "details", 3000) || undefined,
      registrationOpen: fd.get("registrationOpen") === "yes",
      registerHref: href || undefined,
      department,
    };
    await eventsDb.put(event);
    await log(user, existing ? "Updated an event" : "Added an event", title);
    publish();
    return ok(existing ? "Event saved. The website shows it now." : "Event added. The website shows it now.", { id: event.id });
  });
  return isResult(out) ? out : (out as Result);
}

export async function deleteEvent(fd: FormData): Promise<Result> {
  const user = await requireUser();
  const out = await guard(async () => {
    await ensureSeeded("events");
    const event = await eventsDb.get(text(fd, "id", 80));
    if (!event) return bad("That event is already gone.");
    if (!canEditEvent(user, event)) return bad("You can only delete events that belong to your department.");
    await eventsDb.remove(event.id);
    await log(user, "Deleted an event", event.title);
    publish();
    return ok("Event deleted.");
  });
  return out as Result;
}

/* ================= banner ================= */
export async function saveBanner(_p: Result, fd: FormData): Promise<Result> {
  const user = await requirePerm("banner");
  const out = await guard(async () => {
    const message = text(fd, "message", 200);
    const active = fd.get("active") === "yes";
    if (active && message.length < 3) return bad("Write the message people should see.", { message: "Write the message people should see." });
    const href = text(fd, "href", 300);
    if (href && !/^(\/|https:\/\/)/.test(href)) return bad("Start the link with / or https://.", { href: "Start the link with / or https://." });
    const expires = text(fd, "expires", 10);
    const doc: BannerDoc = { active, message, href: href || undefined, label: text(fd, "label", 40) || undefined, expires: /^\d{4}-\d{2}-\d{2}$/.test(expires) ? `${expires}T23:59:00+03:00` : undefined };
    await store.setDoc("banner", doc);
    await log(user, active ? "Switched the announcement bar on" : "Switched the announcement bar off", message);
    publish();
    return ok(active ? "The announcement bar is live." : "The announcement bar is off.");
  });
  return out as Result;
}

/* ================= messages (sermons) ================= */
export async function saveMessage(_p: Result, fd: FormData): Promise<Result> {
  const user = await requirePerm("messages");
  const out = await guard(async () => {
    const title = text(fd, "title", 140);
    const youtube = text(fd, "youtube", 300);
    const errors: Record<string, string> = {};
    if (title.length < 3) errors.title = "Give the message a title.";
    if (youtube && !/(youtu\.be\/|youtube\.com\/)/.test(youtube)) errors.youtube = "Paste a YouTube link.";
    const date = text(fd, "date", 10);
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) errors.date = "Choose a date.";
    if (Object.keys(errors).length) return bad("Please fix the highlighted answers.", errors);
    const id = text(fd, "id", 40) || newId();
    await messagesDb.put({ id, title, speaker: text(fd, "speaker", 80) || undefined, date: date || undefined, summary: text(fd, "summary", 400) || undefined, youtube: youtube || undefined });
    await log(user, "Saved a message", title);
    publish();
    return ok("Message saved.", { id });
  });
  return out as Result;
}

export async function deleteMessage(fd: FormData): Promise<Result> {
  const user = await requirePerm("messages");
  const out = await guard(async () => {
    await messagesDb.remove(text(fd, "id", 40));
    await log(user, "Deleted a message");
    publish();
    return ok("Message deleted.");
  });
  return out as Result;
}

/* ================= leaders and stories ================= */
export async function saveLeader(_p: Result, fd: FormData): Promise<Result> {
  const user = await requirePerm("people");
  const out = await guard(async () => {
    await ensureSeeded("people");
    const name = text(fd, "name", 80);
    const role = text(fd, "role", 120);
    const teaser = text(fd, "teaser", 600);
    const errors: Record<string, string> = {};
    if (name.length < 2) errors.name = "Enter their name.";
    if (role.length < 2) errors.role = "Enter their role.";
    if (Object.keys(errors).length) return bad("Please fix the highlighted answers.", errors);
    const id = text(fd, "id", 40) || newId();
    const prior = await leadersDb.get(id);
    const all = await leadersDb.list();
    await leadersDb.put({ id, name, role, teaser, story: paragraphs(fd, "story"), photo: photoRef(text(fd, "photo", 500)) || prior?.photo || "logo", order: prior?.order ?? all.length });
    await log(user, "Saved a leader", name);
    publish();
    return ok("Leader saved.", { id });
  });
  return out as Result;
}

export async function deleteLeader(fd: FormData): Promise<Result> {
  const user = await requirePerm("people");
  const out = await guard(async () => {
    await ensureSeeded("people");
    await leadersDb.remove(text(fd, "id", 40));
    await log(user, "Deleted a leader");
    publish();
    return ok("Leader removed.");
  });
  return out as Result;
}

export async function saveStory(_p: Result, fd: FormData): Promise<Result> {
  const user = await requirePerm("people");
  const out = await guard(async () => {
    await ensureSeeded("people");
    const name = text(fd, "name", 80);
    const quote = text(fd, "quote", 1200);
    const errors: Record<string, string> = {};
    if (name.length < 2) errors.name = "Enter their name.";
    if (quote.length < 10) errors.quote = "Add what they said.";
    if (Object.keys(errors).length) return bad("Please fix the highlighted answers.", errors);
    const id = text(fd, "id", 40) || newId();
    const prior = await storiesDb.get(id);
    const all = await storiesDb.list();
    await storiesDb.put({ id, name, role: text(fd, "role", 120), quote, photo: photoRef(text(fd, "photo", 500)), order: prior?.order ?? all.length });
    await log(user, "Saved a story", name);
    publish();
    return ok("Story saved.", { id });
  });
  return out as Result;
}

export async function deleteStory(fd: FormData): Promise<Result> {
  const user = await requirePerm("people");
  const out = await guard(async () => {
    await ensureSeeded("people");
    await storiesDb.remove(text(fd, "id", 40));
    await log(user, "Deleted a story");
    publish();
    return ok("Story removed.");
  });
  return out as Result;
}

/* ================= settings and home ================= */
async function mergeSettings(patch: Partial<SiteSettings>) {
  const cur = (await store.getDoc<Partial<SiteSettings>>("settings")) ?? {};
  await store.setDoc("settings", { ...cur, ...patch });
}

export async function saveHome(_p: Result, fd: FormData): Promise<Result> {
  const user = await requirePerm("home");
  const out = await guard(async () => {
    const headline = text(fd, "headline", 60);
    if (headline.length < 3) return bad("The big headline cannot be empty.", { headline: "The big headline cannot be empty." });
    const welcome = paragraphs(fd, "welcome");
    await mergeSettings({
      hero: { kicker: text(fd, "kicker", 140), headline, sub: text(fd, "sub", 240) },
      verse: { text: text(fd, "verse", 400) || defaultSettings.verse.text, ref: text(fd, "ref", 60) || defaultSettings.verse.ref },
      ...(welcome.length ? { welcome } : {}),
    });
    await log(user, "Updated the home page words");
    publish();
    return ok("Home page saved. The website shows it now.");
  });
  return out as Result;
}

export async function saveSettings(_p: Result, fd: FormData): Promise<Result> {
  const user = await requirePerm("settings");
  const out = await guard(async () => {
    const errors: Record<string, string> = {};
    const time = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (!time.test(text(fd, "start", 5))) errors.start = "Use 24-hour time, like 15:00.";
    if (!time.test(text(fd, "end", 5))) errors.end = "Use 24-hour time, like 18:30.";
    const email = text(fd, "email", 120);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errors.email = "Enter a valid email address.";
    if (Object.keys(errors).length) return bad("Please fix the highlighted answers.", errors);
    const phones = [1, 2, 3]
      .map((n) => ({ label: text(fd, `phoneLabel${n}`, 40), display: text(fd, `phone${n}`, 30) }))
      .filter((p) => p.display)
      .map((p, i) => ({ label: p.label || `Line ${i + 1}`, display: p.display, tel: `+${p.display.replace(/\D/g, "").replace(/^0/, "254")}` }));
    if (!phones.length) return bad("Keep at least one phone number.", { phone1: "Keep at least one phone number." });
    await mergeSettings({
      fellowship: { day: text(fd, "day", 12), start: text(fd, "start", 5), end: text(fd, "end", 5), display: text(fd, "display", 40), venue: text(fd, "venue", 120), area: text(fd, "area", 160), address: text(fd, "address", 300) },
      contact: { phones, email },
      giving: { bank: text(fd, "bank", 80), paybill: text(fd, "paybill", 20), account: text(fd, "account", 40) },
    });
    await log(user, "Updated the church details");
    publish();
    return ok("Church details saved.");
  });
  return out as Result;
}

/* ================= ministry and programme pages ================= */
const str = (max: number) => z.string().max(max);
const blockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("statement"), label: str(200), text: str(2500) }),
  z.object({ type: z.literal("prose"), title: str(200).optional(), paragraphs: z.array(str(4000)).max(20) }),
  z.object({ type: z.literal("cards"), title: str(200), intro: str(1200).optional(), numbered: z.boolean().optional(), items: z.array(z.object({ title: str(200), text: str(3000).optional(), bullets: z.array(str(500)).max(30).optional() })).max(40) }),
  z.object({ type: z.literal("list"), title: str(200), intro: str(1200).optional(), items: z.array(str(500)).max(60) }),
  z.object({ type: z.literal("quote"), text: str(1500), cite: str(160).optional() }),
  z.object({ type: z.literal("gallery"), title: str(200), photos: z.array(str(500).refine((v) => photoRef(v) !== undefined, "Not a valid picture")).max(24) }),
]);

export async function savePage(_p: Result, fd: FormData): Promise<Result> {
  const kind = text(fd, "kind", 12) as "ministry" | "programme";
  const pageSlug = text(fd, "slug", 60);
  const user = await requirePerm(`page:${kind}/${pageSlug}`);
  const out = await guard(async () => {
    const title = text(fd, "title", 120);
    if (title.length < 3) return bad("The page needs a title.", { title: "The page needs a title." });
    let blocks: Block[] | undefined;
    const raw = text(fd, "blocks", 200000);
    if (raw) {
      const parsed = z.array(blockSchema).safeParse(JSON.parse(raw));
      if (!parsed.success) return bad("One of the page sections is not filled in correctly.");
      blocks = parsed.data as Block[];
    }
    await pagesDb.put({
      id: `${kind}:${pageSlug}`,
      kind,
      slug: pageSlug,
      title,
      tagline: text(fd, "tagline", 300),
      audience: text(fd, "audience", 120) || undefined,
      summary: text(fd, "summary", 400),
      intro: paragraphs(fd, "intro"),
      blocks,
      updatedAt: new Date().toISOString(),
      updatedBy: user.name,
    });
    const hero = photoRef(text(fd, "hero", 500)) ?? "";
    const key = `${kind}.${pageSlug}.hero`;
    if (hero && hero !== text(fd, "heroOriginal", 500)) await slotsDb.put({ id: key, src: hero, focus: text(fd, "heroFocus", 20) || undefined, updatedAt: new Date().toISOString(), updatedBy: user.name });
    await log(user, "Updated a page", title);
    publish();
    return ok("Page saved. The website shows it now.");
  });
  return out as Result;
}

export async function resetPage(fd: FormData): Promise<Result> {
  const kind = text(fd, "kind", 12);
  const pageSlug = text(fd, "slug", 60);
  const user = await requirePerm(`page:${kind}/${pageSlug}`);
  const out = await guard(async () => {
    await pagesDb.remove(`${kind}:${pageSlug}`);
    await slotsDb.remove(`${kind}.${pageSlug}.hero`);
    await log(user, "Put a page back to the original wording", `${kind}/${pageSlug}`);
    publish();
    return ok("The page is back to its original wording.");
  });
  return out as Result;
}

/* ================= page pictures ================= */
export async function saveSlot(_p: Result, fd: FormData): Promise<Result> {
  const user = await requirePerm("images");
  const out = await guard(async () => {
    const key = text(fd, "key", 80);
    const src = text(fd, "src", 500);
    if (!allSlots.some((s) => s.key === key)) return bad("That place on the site does not exist.");
    if (!src) return bad("Choose a picture first.");
    if (!/^(https:\/\/|\/media\/)/.test(src) && !/^[a-z0-9-]+$/.test(src)) return bad("That picture is not valid.");
    await slotsDb.put({ id: key, src, focus: text(fd, "focus", 20) || undefined, updatedAt: new Date().toISOString(), updatedBy: user.name });
    await log(user, "Changed a page picture", allSlots.find((s) => s.key === key)?.label);
    publish();
    return ok("Picture changed. The website shows it now.", { id: key });
  });
  return out as Result;
}

export async function resetSlot(fd: FormData): Promise<Result> {
  const user = await requirePerm("images");
  const out = await guard(async () => {
    const key = text(fd, "key", 80);
    await slotsDb.remove(key);
    await log(user, "Put a page picture back to the original", allSlots.find((s) => s.key === key)?.label);
    publish();
    return ok("The original picture is back.");
  });
  return out as Result;
}

/* ================= photo library ================= */
export async function deleteMedia(fd: FormData): Promise<Result> {
  const user = await requirePerm("media");
  const out = await guard(async () => {
    const id = text(fd, "id", 40);
    const item = await mediaDb.get(id);
    if (!item) return bad("That photo is already gone.");
    await deleteUpload(id);
    for (const slot of await slotsDb.list()) if (slot.src === item.url) await slotsDb.remove(slot.id);
    await log(user, "Deleted a photo", item.name);
    publish();
    return ok("Photo deleted. If a page was using it, the original picture is shown again.");
  });
  return out as Result;
}
