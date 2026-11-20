import "server-only";
import { unseal } from "./crypto";
import { approvedFor, campApplications, photoRule } from "./camp-day";
import { collection } from "./store";
import type { Camper, CamperSealed, CampArrival, CampWalkIn } from "./types";

/**
 * The gate desk: who is expected at a camp each morning (approved applications and children added at the gate), and the
 * children who came before, listed so the gate can find them but never counted as expected.
 */
export const campWalkIns = collection<CampWalkIn>("camp-walkins");
export const campArrivals = collection<CampArrival>("camp-arrivals");
const campers = collection<Camper>("campers");

export const arrivalId = (key: string, date: string) => `${key}~${date}`;

/**
 * Which programme a camp event belongs to: by the department that looks after it, by its title, or by its id. One rule for
 * applications, the register and the gate, so a camp added later in the team area is read the same everywhere.
 */
export const campOfEvent = (event: { id: string; department?: string; title?: string }): "jewels" | "teen-life" | undefined => {
  if (event.department === "jewels" || /jewels/i.test(event.title ?? "") || event.id.startsWith("jewels")) return "jewels";
  if (event.department === "teen-life" || /teen/i.test(event.title ?? "") || event.id.startsWith("teen-life")) return "teen-life";
  return undefined;
};

export type GatePerson = {
  key: string;
  name: string;
  age?: number;
  guardian?: string;
  phone?: string;
  source: "application" | "returning" | "walk-in";
  /** Only an approved application or a child added at the gate is expected. A returning camper is history, not a registration. */
  expected: boolean;
  /** The year a returning camper last came. */
  year?: number;
  /** "No" means the parent refused photos. Unknown for a child with no application. */
  photos?: "Yes" | "No";
  /** The application was approved and has since been changed. The child is still at camp, so the gate keeps them on the list until they are collected. */
  removed?: string;
  /** An approved application whose payment the office has not checked. */
  unpaid?: boolean;
};

const same = (a: string) => a.toLowerCase().replace(/\s+/g, " ").trim();

/** A camp event is one of the two programmes, or filed as a camp. */
export const isCampEvent = (event: { id: string; category?: string }) => Boolean(campOfEvent(event)) || event.category === "camp";

/** The names a parent allowed to collect, one per entry. The parent writes them in their own words, so commas, "and" and new lines all separate. */
export const authorizedNames = (text?: string): string[] =>
  [...new Set((text ?? "").split(/[,;\n&]|\band\b/i).map((n) => n.replace(/\s+/g, " ").trim()).filter((n) => n.length >= 2))].slice(0, 8);

export const sameName = same;

/**
 * Children of this camp who came in an earlier year. They are not registered for this camp: a returning camper shows up only
 * so the gate can find them, and checking one in needs the parent to confirm. Newest year wins when a name repeats.
 */
async function returningFor(event: { id: string; department?: string; title?: string }, taken: Set<string>): Promise<Camper[]> {
  const camp = campOfEvent(event);
  if (!camp) return [];
  const seen = new Map<string, Camper>();
  for (const c of (await campers.list().catch(() => [])).filter((x) => x.camp === camp && !taken.has(same(x.name)))) {
    const old = seen.get(same(c.name));
    if (!old || c.year > old.year) seen.set(same(c.name), c);
  }
  return [...seen.values()];
}

/** The gate list for a camp: expected children first in the data, plus previous campers so they can be found. `details` opens the sealed guardian and phone of returning campers. */
export async function gateRoster(event: { id: string; start: string; department?: string; title?: string }, details = true): Promise<GatePerson[]> {
  const [apps, walk, arrivals, every] = await Promise.all([approvedFor(event.id), campWalkIns.list().catch(() => []), campArrivals.list().catch(() => []), campApplications.list().catch(() => [])]);
  // A child who is at camp right now must stay on the list even if the application was changed or removed after they arrived.
  const onSite = new Set(arrivals.filter((a) => a.eventId === event.id && a.status === "in").map((a) => a.key));
  const stranded = every.filter((a) => a.eventId === event.id && a.status !== "Approved" && onSite.has(a.id));
  const here = walk.filter((x) => x.eventId === event.id);
  const taken = new Set([...apps.map((a) => same(a.childName)), ...stranded.map((a) => same(a.childName)), ...here.map((w) => same(w.name))]);
  const back = await returningFor(event, taken);
  const people: GatePerson[] = await Promise.all(apps.map(async (a) => ({ key: a.id, name: a.childName, age: a.ageAtCamp, guardian: a.guardian, phone: a.phone, source: "application" as const, expected: true, unpaid: !a.paymentVerified, photos: details ? await photoRule(a) : undefined })));
  for (const a of stranded) people.push({ key: a.id, name: a.childName, age: a.ageAtCamp, guardian: a.guardian, phone: a.phone, source: "application", expected: true, removed: a.status });
  for (const c of back) {
    let d: CamperSealed = {};
    if (details) {
      try {
        d = await unseal<CamperSealed>(c.sealed);
      } catch {
        d = {};
      }
    }
    // Age on file is from an earlier year, so it is not shown.
    people.push({ key: `camper:${c.id}`, name: c.name, guardian: d.guardian, phone: d.contact, source: "returning", expected: false, year: c.year });
  }
  for (const w of here) people.push({ key: `walkin:${w.id}`, name: w.name, age: w.age, guardian: w.guardian, phone: w.phone, source: "walk-in", expected: true });
  return people.sort((a, b) => a.name.localeCompare(b.name));
}

/** How many children are expected (applications and walk-ins), without opening anything sealed. */
export async function gateCount(event: { id: string; start: string; department?: string; title?: string }): Promise<number> {
  return (await gateRoster(event, false)).filter((p) => p.expected).length;
}

/** Checks that a key names a real child on this camp’s list. Returns the application when it is one. */
export async function gateFind(event: { id: string; department?: string; title?: string }, key: string): Promise<{ name: string; source: GatePerson["source"]; applicationId?: string } | null> {
  if (key.startsWith("walkin:")) {
    const w = await campWalkIns.get(key.slice(7));
    return w && w.eventId === event.id ? { name: w.name, source: "walk-in" } : null;
  }
  if (key.startsWith("camper:")) {
    const c = await campers.get(key.slice(7));
    // A returning camper can only be received at the camp they came to before.
    return c && c.camp === campOfEvent(event) ? { name: c.name, source: "returning" } : null;
  }
  const app = (await approvedFor(event.id)).find((a) => a.id === key);
  return app ? { name: app.childName, source: "application", applicationId: app.id } : null;
}

/** May this person collect without an exception? Only the person who brought the child, or a name the parent gave at drop-off. */
export function mayCollectNormally(arrival: Pick<CampArrival, "droppedBy" | "authorized" | "mayCollect">, name: string): boolean {
  const allowed = [arrival.droppedBy, ...(arrival.authorized ?? authorizedNames(arrival.mayCollect))];
  return name.trim().length >= 2 && allowed.some((n) => same(n) === same(name));
}
