import type { AdminNavGroup } from "@/components/admin/Shell";
import { pageIcon } from "@/components/icons";
import { campScope, can, editablePages, permsOf } from "./rbac";
import type { StoredUser } from "./types";

/** The menu each person sees: only the screens their departments allow. */
export function buildNav(user: StoredUser, counts: { guests: number; prayers: number; camps?: number }): AdminNavGroup[] {
  const A = "/123admin";
  const groups: AdminNavGroup[] = [{ title: "Start", items: [{ href: A, label: "Overview", icon: "dashboard" }] }];

  const website: AdminNavGroup["items"] = [];
  if (can(user, "home")) website.push({ href: `${A}/home`, label: "Home page", icon: "home" });
  const pages = editablePages(user);
  if (pages.length) {
    website.push({
      href: `${A}/pages`,
      label: user.role === "admin" ? "Pages" : "My pages",
      icon: "church",
      children: pages.map((p) => ({ href: `${A}/pages/${p.kind}/${p.slug}`, label: p.title, icon: pageIcon[p.slug] ?? "church" })),
    });
  }
  const hasEvents = user.role === "admin" || [...permsOf(user)].some((p) => p.startsWith("events:"));
  if (hasEvents) website.push({ href: `${A}/events`, label: "Events", icon: "calendar" });
  const camps = campScope(user);
  if (camps === "all" || camps.length) website.push({ href: `${A}/camps`, label: "Camp applications", icon: "tent", badge: counts.camps, children: [{ href: `${A}/camps/returning`, label: "Returning campers", icon: "users" }] });
  if (can(user, "banner")) website.push({ href: `${A}/banner`, label: "Announcement bar", icon: "megaphone" });
  if (can(user, "messages")) website.push({ href: `${A}/messages`, label: "Messages to watch", icon: "play" });
  if (can(user, "people")) website.push({ href: `${A}/people`, label: "Leaders and stories", icon: "users" });
  if (website.length) groups.push({ title: "Website", items: website });

  const pictures: AdminNavGroup["items"] = [];
  if (can(user, "images")) pictures.push({ href: `${A}/pictures`, label: "Page pictures", icon: "image-plus" });
  if (can(user, "media")) pictures.push({ href: `${A}/media`, label: "Photo library", icon: "images" });
  if (pictures.length) groups.push({ title: "Pictures", items: pictures });

  const care: AdminNavGroup["items"] = [];
  if (can(user, "visitors")) care.push({ href: `${A}/guests`, label: "New members", icon: "guest", badge: counts.guests });
  if (can(user, "prayers")) care.push({ href: `${A}/prayers`, label: "Prayer requests", icon: "prayer", badge: counts.prayers });
  if (care.length) groups.push({ title: "Care", items: care });

  const site: AdminNavGroup["items"] = [{ href: `${A}/share`, label: "Share links and QR codes", icon: "qr" }];
  if (can(user, "settings")) site.push({ href: `${A}/settings`, label: "Church details", icon: "settings" });
  if (can(user, "users")) site.push({ href: `${A}/team`, label: "Team and access", icon: "shield" });
  if (can(user, "system")) {
    site.push({ href: `${A}/status`, label: "System status", icon: "activity" });
    site.push({ href: `${A}/activity`, label: "Activity log", icon: "history" });
  }
  site.push({ href: `${A}/account`, label: "My account", icon: "key" });
  groups.push({ title: "Site", items: site });
  return groups;
}
