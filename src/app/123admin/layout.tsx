import type { Metadata, Viewport } from "next";
import Shell, { type FindItem } from "@/components/admin/Shell";
import { getUser, users } from "@/lib/auth";
import { buildNav } from "@/lib/admin-nav";
import { pendingRequestCount } from "@/lib/access";
import { shortCamp } from "@/lib/names";
import { campScope, can, canReadPrayer, departmentName, mayOpenCamp, permsOf } from "@/lib/rbac";
import { collection } from "@/lib/store";
import type { CampApplication, Prayer, Visitor } from "@/lib/types";
import { logout } from "./auth-actions";

export const metadata: Metadata = {
  title: { default: "Team area", template: "%s | Team area" },
  robots: { index: false, follow: false },
};
export const viewport: Viewport = { themeColor: "#2d0f5a", width: "device-width", initialScale: 1 };

const A = "/123admin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) return <div className="min-h-svh bg-paper">{children}</div>;

  const scope = campScope(user);
  const [guests, prayers, camps, requests] = await Promise.all([
    can(user, "visitors") ? collection<Visitor>("visitors").list().catch(() => []) : [],
    can(user, "prayers") ? collection<Prayer>("prayers").list().catch(() => []) : [],
    scope === "all" || scope.length ? collection<CampApplication>("camp-applications").list().catch(() => []) : [],
    can(user, "users") ? pendingRequestCount() : 0,
  ]);
  // What the search bar can open besides screens: quick actions, and the people and applications this person may already see in a list.
  const find: FindItem[] = [];
  const act = (label: string, href: string, icon: string) => find.push({ group: "Do", label, href, icon });
  if (can(user, "members")) act("Register a new member", `${A}/guests/new`, "guest");
  if (can(user, "users")) act("Add a person to the team", `${A}/team/new`, "shield");
  if (user.role === "admin" || [...permsOf(user)].some((p) => p.startsWith("events:"))) act("Add an event", `${A}/events/new`, "calendar");
  if (can(user, "messages")) act("Add a message to watch", `${A}/messages/new`, "play");
  if (scope === "all") act("Write an update to families", `${A}/camps/updates`, "megaphone");
  for (const a of camps.filter((c) => mayOpenCamp(user, c)).sort((x, y) => y.createdAt.localeCompare(x.createdAt)).slice(0, 150)) find.push({ group: "Camp applications", label: a.childName, href: `${A}/camps/${a.id}`, icon: "tent", hint: `${shortCamp(a.eventTitle)} · ${a.status}` });
  for (const g of guests.slice().sort((x, y) => y.createdAt.localeCompare(x.createdAt)).slice(0, 120)) find.push({ group: "New members", label: g.fullName, href: `${A}/guests?open=${g.id}`, icon: "guest", hint: g.area });
  if (can(user, "users")) for (const u of (await users.list().catch(() => [])).slice(0, 60)) find.push({ group: "Team", label: u.name, href: `${A}/team/${u.id}`, icon: u.role === "admin" ? "shield" : "users", hint: u.email });
  const roleLabel = user.role === "admin" ? "Administrator" : user.departments.map(departmentName).join(", ") || "Department head";
  return (
    <Shell
      groups={buildNav(user, { guests: guests.filter((g) => g.status === "new").length, prayers: prayers.filter((p) => p.status === "new" && canReadPrayer(user, p)).length, camps: camps.filter((a) => a.status === "Pending review" && mayOpenCamp(user, a)).length, requests })}
      user={{ name: user.name, roleLabel }}
      signOut={logout}
      find={find}
    >
      {children}
    </Shell>
  );
}
