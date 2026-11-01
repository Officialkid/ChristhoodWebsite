import { ministries } from "@/content/ministries";
import { programmes } from "@/content/programmes";
import type { StoredUser } from "./types";

/**
 * Who may change what.
 *
 * Every ministry and programme is a department. A department head can edit their own page and their own events.
 * A few shared departments carry wider jobs: the web team runs the home page, events and announcements, the media team
 * runs the photo library, and the pastoral team reads new-guest forms and prayer requests.
 * Administrators can do everything, including adding people.
 */
export type Perm =
  | "home" | "banner" | "messages" | "people" | "media" | "images" | "visitors" | "prayers" | "settings" | "users" | "system"
  | `events:${string}`
  | `page:${string}`;

export type Department = { id: string; name: string; blurb: string; perms: Perm[] };

const shared: Department[] = [
  { id: "web", name: "Web & Communications", blurb: "Home page words, announcements, events, messages, leaders and stories.", perms: ["home", "banner", "messages", "people", "images", "events:all"] },
  { id: "media", name: "Media Team", blurb: "The photo library, page pictures, messages, and the Media Ministry page.", perms: ["media", "images", "messages", "page:ministry/media"] },
  { id: "pastoral", name: "Pastoral Team", blurb: "New guests and prayer requests.", perms: ["visitors", "prayers"] },
];

const extra: Record<string, Perm[]> = {
  protocol: ["visitors"],
  "international-faith-chapel": ["prayers"],
  counselling: ["prayers"],
};

function build(): Department[] {
  const byId = new Map(shared.map((d) => [d.id, d]));
  const add = (kind: "ministry" | "programme", slug: string, title: string, audience?: string) => {
    const perms: Perm[] = [`page:${kind}/${slug}`, `events:${slug}`, ...(extra[slug] ?? [])];
    const cur = byId.get(slug);
    if (cur) cur.perms = [...new Set([...cur.perms, ...perms])];
    else byId.set(slug, { id: slug, name: title, blurb: audience ? `${kind === "ministry" ? "Ministry" : "Programme"} for ${audience.toLowerCase()}.` : `${kind === "ministry" ? "Ministry" : "Programme"} page and events.`, perms });
  };
  ministries.forEach((m) => add("ministry", m.slug, m.title, m.audience));
  programmes.forEach((p) => add("programme", p.slug, p.title, p.audience));
  return [...byId.values()];
}

export const departments: Department[] = build();
export const departmentName = (id?: string) => departments.find((d) => d.id === id)?.name ?? id ?? "";

type Actor = Pick<StoredUser, "role" | "departments">;

export function permsOf(user: Actor): Set<Perm> {
  const set = new Set<Perm>();
  for (const id of user.departments) departments.find((d) => d.id === id)?.perms.forEach((p) => set.add(p));
  return set;
}

export function can(user: Actor | null | undefined, perm: Perm): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (perm === "settings" || perm === "users" || perm === "system") return false;
  const set = permsOf(user);
  if (set.has(perm)) return true;
  if (perm.startsWith("events:") && set.has("events:all")) return true;
  return false;
}

/** May this person edit the pages of every kind they were given, and which? */
export function editablePages(user: Actor): { kind: "ministry" | "programme"; slug: string; title: string }[] {
  const all = [
    ...ministries.map((m) => ({ kind: "ministry" as const, slug: m.slug, title: m.title })),
    ...programmes.map((p) => ({ kind: "programme" as const, slug: p.slug, title: p.title })),
  ];
  return all.filter((p) => can(user, `page:${p.kind}/${p.slug}`));
}

/** Departments this person may assign to an event. */
export function eventDepartments(user: Actor): Department[] {
  return user.role === "admin" || can(user, "events:all") ? departments : departments.filter((d) => can(user, `events:${d.id}`));
}

export const canEditEvent = (user: Actor, event: { department?: string }) =>
  user.role === "admin" || can(user, "events:all") || (event.department ? can(user, `events:${event.department}`) : false);

/** "Pastoral team only" requests stay with the pastoral team. Requests shared with intercessors are open to prayer departments too. */
export function canReadPrayer(user: Actor, prayer: { type?: string; whoMaySee?: string }): boolean {
  if (user.role === "admin" || user.departments.includes("pastoral")) return true;
  if (prayer.type === "thanksgiving" || !prayer.whoMaySee) return true;
  return prayer.whoMaySee.toLowerCase().includes("intercessory");
}
