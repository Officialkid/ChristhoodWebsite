import "server-only";
import { createClient } from "next-sanity";
import { apiVersion, dataset, isConnected, projectId } from "@/sanity/env";
import { defaultSettings } from "@/content/site";
import { ministries } from "@/content/ministries";
import { programmes } from "@/content/programmes";
import { events as seedEvents } from "@/content/events";
import { leaders as seedLeaders, stories as seedStories } from "@/content/people";
import type { Announcement, Block, EventDoc, Leader, Message, PageDoc, SiteSettings, Story } from "./types";

/**
 * The website reads from the admin area when it is connected, and falls back to the
 * content that ships with the site. A hiccup on the admin side never takes the site down.
 */
const client = isConnected ? createClient({ projectId, dataset, apiVersion, useCdn: true }) : null;
const REFRESH_SECONDS = 60;

async function fetchLive<T>(query: string, params: Record<string, unknown> = {}): Promise<T | null> {
  if (!client) return null;
  try {
    return await client.fetch<T>(query, params, { next: { revalidate: REFRESH_SECONDS } });
  } catch (error) {
    console.error("Admin content unavailable, using shipped content:", error);
    return null;
  }
}

/* ---------- settings ---------- */
type LiveSettings = Partial<{
  heroKicker: string; heroHeadline: string; heroSub: string;
  fellowshipDay: string; fellowshipStart: string; fellowshipEnd: string; fellowshipDisplay: string;
  venue: string; area: string; address: string;
  phones: { label: string; display: string; tel: string }[]; email: string;
  bank: string; paybill: string; account: string;
}>;

export async function getSettings(): Promise<SiteSettings> {
  const d = await fetchLive<LiveSettings>(`*[_type=="siteSettings"][0]`);
  if (!d) return defaultSettings;
  const s = defaultSettings;
  return {
    fellowship: {
      day: d.fellowshipDay || s.fellowship.day,
      start: d.fellowshipStart || s.fellowship.start,
      end: d.fellowshipEnd || s.fellowship.end,
      display: d.fellowshipDisplay || s.fellowship.display,
      venue: d.venue || s.fellowship.venue,
      area: d.area || s.fellowship.area,
      address: d.address || s.fellowship.address,
    },
    contact: { phones: d.phones?.length ? d.phones : s.contact.phones, email: d.email || s.contact.email },
    giving: { bank: d.bank || s.giving.bank, paybill: d.paybill || s.giving.paybill, account: d.account || s.giving.account },
    hero: { kicker: d.heroKicker || s.hero.kicker, headline: d.heroHeadline || s.hero.headline, sub: d.heroSub || s.hero.sub },
  };
}

/* ---------- events ---------- */
type LiveEvent = Omit<EventDoc, "id" | "image"> & { _id: string; imageUrl?: string };

export async function getEvents(): Promise<EventDoc[]> {
  const live = await fetchLive<LiveEvent[]>(
    `*[_type=="event" && visible != false] | order(start asc){ _id, title, subtitle, category, start, end, location, fee, details, registrationOpen, registerHref, "imageUrl": image.asset->url }`,
  );
  if (!live) return seedEvents;
  return live.map(({ _id, imageUrl, ...e }) => ({ ...e, id: _id, image: imageUrl }));
}

/** Events that have not finished yet, soonest first. */
export async function getUpcomingEvents(): Promise<EventDoc[]> {
  const now = Date.now();
  return (await getEvents()).filter((e) => new Date(e.end ?? e.start).getTime() >= now);
}

/* ---------- ministries and programmes ---------- */
type LiveSection = { _type: Block["type"]; photos?: { url: string }[] } & Record<string, unknown>;
type LivePage = Omit<PageDoc, "hero" | "blocks" | "slug" | "intro"> & { slug: string; heroUrl?: string; intro?: string[]; sections?: LiveSection[] };

function toBlocks(sections: LiveSection[] = []): Block[] {
  return sections.map(({ _type, photos, ...rest }) => {
    const { _key, ...fields } = rest as Record<string, unknown>;
    void _key;
    return { type: _type, ...fields, ...(photos ? { photos: photos.map((p) => p.url) } : {}) } as Block;
  });
}

async function getPages(kind: PageDoc["kind"], seed: PageDoc[]): Promise<PageDoc[]> {
  const live = await fetchLive<LivePage[]>(
    `*[_type=="ministryPage" && kind==$kind]{ kind, title, "slug": slug.current, tagline, audience, summary, intro, order, featured, "heroUrl": heroImage.asset->url, sections[]{ ..., photos[]{ "url": asset->url } } }`,
    { kind },
  );
  const bySlug = new Map(seed.map((p) => [p.slug, p]));
  for (const l of live ?? []) {
    const base = bySlug.get(l.slug);
    bySlug.set(l.slug, {
      ...(base ?? { kind, slug: l.slug, title: l.title, tagline: "", summary: "", hero: "christhoood-about", intro: [], blocks: [], order: 99 }),
      ...(l.title ? { title: l.title } : {}),
      ...(l.tagline ? { tagline: l.tagline } : {}),
      ...(l.audience ? { audience: l.audience } : {}),
      ...(l.summary ? { summary: l.summary } : {}),
      ...(l.heroUrl ? { hero: l.heroUrl } : {}),
      ...(l.intro?.length ? { intro: l.intro } : {}),
      ...(l.sections?.length ? { blocks: toBlocks(l.sections) } : {}),
      ...(typeof l.order === "number" ? { order: l.order } : {}),
      ...(typeof l.featured === "boolean" ? { featured: l.featured } : {}),
    });
  }
  return [...bySlug.values()].sort((a, b) => a.order - b.order);
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
  const live = await fetchLive<(Omit<Leader, "photo"> & { photoUrl?: string })[]>(
    `*[_type=="leader"] | order(order asc){ name, role, teaser, story, "photoUrl": photo.asset->url }`,
  );
  if (!live?.length) return seedLeaders;
  return live.map(({ photoUrl, ...l }) => ({ ...l, story: l.story ?? [], photo: photoUrl ?? "logo" }));
}

export async function getStories(): Promise<Story[]> {
  const live = await fetchLive<(Omit<Story, "photo"> & { photoUrl?: string })[]>(
    `*[_type=="story"]{ name, role, quote, "photoUrl": photo.asset->url }`,
  );
  if (!live?.length) return seedStories;
  return live.map(({ photoUrl, ...s }) => ({ ...s, photo: photoUrl }));
}

/* ---------- banner and sermons ---------- */
export async function getAnnouncement(): Promise<Announcement | null> {
  const a = await fetchLive<Announcement | null>(
    `*[_type=="announcement" && active == true && (!defined(expires) || expires > now())] | order(_createdAt desc)[0]{ message, href, label }`,
  );
  return a ?? null;
}

type LiveMessage = Omit<Message, "youtubeId"> & { youtubeUrl?: string };
export function youtubeIdOf(url?: string) {
  const m = url?.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
  return m?.[1];
}

export async function getMessages(limit = 6): Promise<Message[]> {
  const live = await fetchLive<LiveMessage[]>(`*[_type=="message"] | order(date desc)[0...$n]{ title, speaker, date, summary, youtubeUrl }`, { n: limit });
  return (live ?? []).map(({ youtubeUrl, ...m }) => ({ ...m, youtubeId: youtubeIdOf(youtubeUrl) }));
}
