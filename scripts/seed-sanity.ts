/**
 * One-time import: loads the content that ships with the site into the admin area,
 * so the team can edit what is already on the website instead of starting from blank.
 *
 * Run (after connecting the admin area, see README):
 *   npx tsx --env-file=.env.local scripts/seed-sanity.ts
 *
 * Safe to run again: every document has a fixed id, so it replaces itself. Photos are de-duplicated by the service.
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@sanity/client";
import { defaultSettings } from "@/content/site";
import { ministries } from "@/content/ministries";
import { programmes } from "@/content/programmes";
import { events } from "@/content/events";
import { leaders, stories } from "@/content/people";
import type { Block, PageDoc } from "@/lib/types";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const token = process.env.SANITY_WRITE_TOKEN;
if (!projectId || !token) {
  console.error("Set NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_WRITE_TOKEN in .env.local first (see README).");
  process.exit(1);
}

const client = createClient({ projectId, dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production", apiVersion: "2025-01-01", token, useCdn: false });
const cache = new Map<string, { _type: "image"; asset: { _type: "reference"; _ref: string } }>();
let key = 0;
const k = () => `k${(key++).toString(36)}`;

/** Uploads a prepared photo once and returns an image reference. */
async function photo(name?: string) {
  if (!name || /^https?:\/\//.test(name)) return undefined;
  if (cache.has(name)) return cache.get(name);
  const file = path.resolve("public/img", `${name}.webp`);
  if (!fs.existsSync(file)) return undefined;
  const asset = await client.assets.upload("image", fs.createReadStream(file), { filename: `${name}.webp` });
  const ref = { _type: "image" as const, asset: { _type: "reference" as const, _ref: asset._id } };
  cache.set(name, ref);
  return ref;
}

async function section(b: Block) {
  switch (b.type) {
    case "statement": return { _type: "statement", _key: k(), label: b.label, text: b.text };
    case "prose": return { _type: "prose", _key: k(), title: b.title, paragraphs: b.paragraphs };
    case "list": return { _type: "list", _key: k(), title: b.title, intro: b.intro, items: b.items };
    case "quote": return { _type: "quote", _key: k(), text: b.text, cite: b.cite };
    case "cards": return { _type: "cards", _key: k(), title: b.title, intro: b.intro, numbered: !!b.numbered, items: b.items.map((i) => ({ _type: "card", _key: k(), title: i.title, text: i.text, bullets: i.bullets })) };
    case "gallery": {
      const photos = (await Promise.all(b.photos.map(photo))).filter(Boolean).map((p) => ({ ...p!, _key: k() }));
      return { _type: "gallery", _key: k(), title: b.title, photos };
    }
  }
}

async function pageDoc(p: PageDoc) {
  return {
    _id: `ministryPage-${p.kind}-${p.slug}`,
    _type: "ministryPage",
    kind: p.kind, title: p.title, slug: { _type: "slug", current: p.slug },
    tagline: p.tagline, audience: p.audience, summary: p.summary, intro: p.intro,
    order: p.order, featured: !!p.featured,
    heroImage: await photo(p.hero),
    sections: await Promise.all(p.blocks.map(section)),
  };
}

async function main() {
  const docs: Record<string, unknown>[] = [];
  const s = defaultSettings;
  docs.push({
    _id: "siteSettings", _type: "siteSettings",
    heroKicker: s.hero.kicker, heroHeadline: s.hero.headline, heroSub: s.hero.sub,
    fellowshipDay: s.fellowship.day, fellowshipStart: s.fellowship.start, fellowshipEnd: s.fellowship.end, fellowshipDisplay: s.fellowship.display,
    venue: s.fellowship.venue, area: s.fellowship.area, address: s.fellowship.address,
    phones: s.contact.phones.map((p) => ({ _type: "phone", _key: k(), ...p })), email: s.contact.email,
    bank: s.giving.bank, paybill: s.giving.paybill, account: s.giving.account,
  });

  for (const e of events) {
    docs.push({ _id: `event-${e.id}`, _type: "event", title: e.title, subtitle: e.subtitle, category: e.category, start: e.start, end: e.end, location: e.location, fee: e.fee, details: e.details, registrationOpen: e.registrationOpen, registerHref: e.registerHref, visible: true, image: await photo(e.image) });
  }
  for (const p of [...ministries, ...programmes]) {
    console.log("page:", p.kind, p.slug);
    docs.push(await pageDoc(p));
  }
  for (const [i, l] of leaders.entries()) docs.push({ _id: `leader-${i + 1}`, _type: "leader", name: l.name, role: l.role, teaser: l.teaser, story: l.story, order: i + 1, photo: await photo(l.photo) });
  for (const [i, st] of stories.entries()) docs.push({ _id: `story-${i + 1}`, _type: "story", name: st.name, role: st.role, quote: st.quote, photo: await photo(st.photo) });

  const tx = client.transaction();
  for (const d of docs) tx.createOrReplace(d as { _id: string; _type: string });
  await tx.commit();
  console.log(`Imported ${docs.length} documents and ${cache.size} photos.`);
}

main().catch((err) => {
  console.error("Import failed:", err.message ?? err);
  process.exit(1);
});
