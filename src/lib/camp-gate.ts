import "server-only";
import { unseal } from "./crypto";
import { approvedFor, nairobiDay, photoRule } from "./camp-day";
import { collection } from "./store";
import type { Camper, CamperSealed, CampArrival, CampWalkIn } from "./types";

/**
 * The gate desk: who is expected on a camp's first morning and every morning after, whether they came through an
 * application, came to a camp before, or turned up on the day.
 */
export const campWalkIns = collection<CampWalkIn>("camp-walkins");
export const campArrivals = collection<CampArrival>("camp-arrivals");
const campers = collection<Camper>("campers");

export const arrivalId = (key: string, date: string) => `${key}~${date}`;

/** Which programme a camp event belongs to. */
export const campOfEvent = (event: { id: string }): "jewels" | "teen-life" | undefined => (event.id.startsWith("jewels") ? "jewels" : event.id.startsWith("teen-life") ? "teen-life" : undefined);

export type GatePerson = {
  key: string;
  name: string;
  age?: number;
  guardian?: string;
  phone?: string;
  source: "application" | "returning" | "walk-in";
  /** "No" means the parent refused photos. Unknown for a child with no application. */
  photos?: "Yes" | "No";
};

const same = (a: string) => a.toLowerCase().replace(/\s+/g, " ").trim();

/** Returning campers of this camp and year, not counting a child who already has an approved application. */
async function returningFor(event: { id: string; start: string }, taken: Set<string>): Promise<Camper[]> {
  const camp = campOfEvent(event);
  const year = Number(nairobiDay(event.start).slice(0, 4));
  if (!camp) return [];
  return (await campers.list().catch(() => [])).filter((c) => c.camp === camp && c.year === year && !taken.has(same(c.name)));
}

/** The expected list for a camp. `details` also opens the sealed guardian and phone of returning campers. */
export async function gateRoster(event: { id: string; start: string }, details = true): Promise<GatePerson[]> {
  const apps = await approvedFor(event.id);
  const taken = new Set(apps.map((a) => same(a.childName)));
  const [back, walk] = await Promise.all([returningFor(event, taken), campWalkIns.list().catch(() => [])]);
  const people: GatePerson[] = await Promise.all(apps.map(async (a) => ({ key: a.id, name: a.childName, age: a.ageAtCamp, guardian: a.guardian, phone: a.phone, source: "application" as const, photos: details ? await photoRule(a) : undefined })));
  for (const c of back) {
    let d: CamperSealed = {};
    if (details) {
      try {
        d = await unseal<CamperSealed>(c.sealed);
      } catch {
        d = {};
      }
    }
    people.push({ key: `camper:${c.id}`, name: c.name, age: d.age, guardian: d.guardian, phone: d.contact, source: "returning" });
  }
  for (const w of walk.filter((x) => x.eventId === event.id)) people.push({ key: `walkin:${w.id}`, name: w.name, age: w.age, guardian: w.guardian, phone: w.phone, source: "walk-in" });
  return people.sort((a, b) => a.name.localeCompare(b.name));
}

/** How many are expected, without opening anything sealed. */
export async function gateCount(event: { id: string; start: string }): Promise<number> {
  return (await gateRoster(event, false)).length;
}

/** Checks that a key names a real child on this camp's list. Returns the application when it is one. */
export async function gateFind(eventId: string, key: string): Promise<{ name: string; applicationId?: string } | null> {
  if (key.startsWith("walkin:")) {
    const w = await campWalkIns.get(key.slice(7));
    return w && w.eventId === eventId ? { name: w.name } : null;
  }
  if (key.startsWith("camper:")) {
    const c = await campers.get(key.slice(7));
    return c ? { name: c.name } : null;
  }
  const app = (await approvedFor(eventId)).find((a) => a.id === key);
  return app ? { name: app.childName, applicationId: app.id } : null;
}
