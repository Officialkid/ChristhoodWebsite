import "server-only";
import { unstable_cache } from "next/cache";
import { collection, store } from "./store";
import { defaultSettings } from "@/content/site";
import { ministries } from "@/content/ministries";
import { programmes } from "@/content/programmes";
import { events as seedEvents } from "@/content/events";
import { leaders as seedLeaders, stories as seedStories } from "@/content/people";
import type { Announcement, EventDoc, Leader, Message, PageDoc, PageOverride, SiteSettings, SlotValue, Story } from "./types";

/**
 * The website shows what the team saved in the admin area, and falls back to the content that ships with the site.
 * A problem on the admin side can never take the public site down.
 */
export const CONTENT_TAG = "content";

async function live<T>(key: string, read: () => Promise<T | null>): Promise<T | null> {
  if (!store.writable) return null;
  try {
    return await unstable_cache(async () => (await read()) ?? null, ["content", key], { tags: [CONTENT_TAG], revalidate: 120 })();
  } catch (error) {
    console.error(`Saved content "${key}" unavailable, using shipped content:`, error);
    return null;
  }
}

/* ---------- records the admin area edits ---------- */
export type LeaderRec = Leader & { id: string; order: number };
export type StoryRec = Story & { id: string; order: number };
export type MessageRec = { id: string; title: string; speaker?: string; date?: string; summary?: string; youtube?: string };
export type BannerDoc = { active: boolean; message: string; href?: string; label?: string; expires?: string };

export const eventsDb = collection<EventDoc>("events");
export const leadersDb = collection<LeaderRec>("leaders");
export const storiesDb = collection<StoryRec>("stories");
export const messagesDb = collection<MessageRec>("messages");
export const pagesDb = collection<PageOverride>("pages");
export const slotsDb = collection<SlotValue>("slots");

export const shipped = {
  events: seedEvents,
  leaders: seedLeaders.map((l, i): LeaderRec => ({ ...l, id: `leader-${i + 1}`, order: i })),
  stories: seedStories.map((s, i): StoryRec => ({ ...s, id: `story-${i + 1}`, order: i })),
};

/** Copies the shipped events, leaders or stories into the database the first time the team opens that screen. */
export async function ensureSeeded(what: "events" | "people") {
  if (!store.writable || (await store.getDoc<boolean>(`seeded:${what}`))) return;
  if (what === "events") for (const e of shipped.events) await eventsDb.put(e);
  else {
    for (const l of shipped.leaders) await leadersDb.put(l);
    for (const s of shipped.stories) await storiesDb.put(s);
  }
  await store.setDoc(`seeded:${what}`, true);
}

const seeded = (what: "events" | "people") => store.getDoc<boolean>(`seeded:${what}`);

/* ---------- settings ---------- */
export async function getSettings(): Promise<SiteSettings> {
  const d = await live<Partial<SiteSettings>>("settings", () => store.getDoc("settings"));
  if (!d) return defaultSettings;
  const s = defaultSettings;
  return {
    fellowship: { ...s.fellowship, ...d.fellowship },
    contact: { phones: d.contact?.phones?.length ? d.contact.phones : s.contact.phones, email: d.contact?.email || s.contact.email },
    giving: { ...s.giving, ...d.giving },
    hero: { ...s.hero, ...d.hero },
    verse: { ...s.verse, ...d.verse },
    welcome: d.welcome?.length ? d.welcome : s.welcome,
  };
}

/* ---------- events ---------- */
export async function getEvents(): Promise<EventDoc[]> {
  const list = await live<EventDoc[] | { empty: true }>("events", async () => {
    if (!(await seeded("events"))) return null;
    const all = await eventsDb.list();
    return all.length ? all : { empty: true };
  });
  const events = Array.isArray(list) ? list : list ? [] : seedEvents;
  return [...events].sort((a, b) => a.start.localeCompare(b.start));
}

/** Events that have not finished yet, soonest first. */
export async function getUpcomingEvents(): Promise<EventDoc[]> {
  const now = Date.now();
  return (await getEvents()).filter((e) => new Date(e.end ?? e.start).getTime() >= now);
}

/* ---------- page pictures ---------- */
export async function getSlots(): Promise<Record<string, SlotValue>> {
  const list = (await live<SlotValue[]>("slots", () => slotsDb.list())) ?? [];
  return Object.fromEntries(list.map((s) => [s.id, s]));
}

/** The picture for a place on a page: what the team chose, or the original. */
export async function getSlot(key: string, fallback?: string): Promise<{ src?: string; focus?: string }> {
  const v = (await getSlots())[key];
  return v ? { src: v.src, focus: v.focus } : { src: fallback };
}

/* ---------- ministries and programmes ---------- */
async function getPages(kind: PageDoc["kind"], seed: PageDoc[]): Promise<PageDoc[]> {
  const [overrides, slots] = await Promise.all([live<PageOverride[]>("pages", () => pagesDb.list()), getSlots()]);
  const mine = new Map((overrides ?? []).filter((o) => o.kind === kind).map((o) => [o.slug, o]));
  return seed
    .map((base) => {
      const o = mine.get(base.slug);
      const hero = slots[`${kind}.${base.slug}.hero`]?.src;
      return {
        ...base,
        ...(o?.title ? { title: o.title } : {}),
        ...(o?.tagline ? { tagline: o.tagline } : {}),
        ...(o?.audience ? { audience: o.audience } : {}),
        ...(o?.summary ? { summary: o.summary } : {}),
        ...(o?.intro?.length ? { intro: o.intro } : {}),
        ...(o?.blocks?.length ? { blocks: o.blocks } : {}),
        ...(hero ? { hero } : {}),
      };
    })
    .sort((a, b) => a.order - b.order);
}

export const getMinistries = () => getPages("ministry", ministries);
export const getProgrammes = () => getPages("programme", programmes);

export async function getMinistry(slug: string) {
  return (await getMinistries()).find((p) => p.slug === slug);
}
export async function getProgramme(slug: string) {
  return (await getProgrammes()).find((p) => p.slug === slug);
}

/* ---------- people ---------- */
export async function getLeaders(): Promise<Leader[]> {
  const list = await live<LeaderRec[]>("leaders", async () => ((await seeded("people")) ? leadersDb.list() : null));
  if (!list?.length) return seedLeaders;
  return [...list].sort((a, b) => a.order - b.order).map(({ id, order, ...l }) => (void id, void order, l));
}

export async function getStories(): Promise<Story[]> {
  const list = await live<StoryRec[]>("stories", async () => ((await seeded("people")) ? storiesDb.list() : null));
  if (!list?.length) return seedStories;
  return [...list].sort((a, b) => a.order - b.order).map(({ id, order, ...s }) => (void id, void order, s));
}

/* ---------- banner and messages ---------- */
export async function getAnnouncement(): Promise<Announcement | null> {
  const a = await live<BannerDoc>("banner", () => store.getDoc("banner"));
  if (!a?.active || !a.message) return null;
  if (a.expires && new Date(a.expires).getTime() < Date.now()) return null;
  return { message: a.message, href: a.href, label: a.label };
}

export function youtubeIdOf(url?: string) {
  const m = url?.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
  return m?.[1];
}

export async function getMessages(limit = 6): Promise<Message[]> {
  const list = (await live<MessageRec[]>("messages", () => messagesDb.list())) ?? [];
  return list
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
    .slice(0, limit)
    .map(({ youtube, id, ...m }) => (void id, { ...m, youtubeId: youtubeIdOf(youtube) }));
}
