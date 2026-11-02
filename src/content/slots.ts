import { ministries } from "./ministries";
import { programmes } from "./programmes";

/** Every place on the site where the team can swap the main picture. `fallback` is the original photo. */
export type SlotDef = { key: string; label: string; fallback?: string; focus?: string };
export type SlotGroup = { id: string; title: string; href: string; slots: SlotDef[] };

export const slotGroups: SlotGroup[] = [
  {
    id: "home",
    title: "Home page",
    href: "/",
    slots: [
      { key: "home.hero", label: "Top of the page (the big picture)", fallback: "fellowship", focus: "50% 30%" },
      { key: "home.welcome", label: "Welcome section", fallback: "main-img", focus: "35% 40%" },
      { key: "home.humanitarian", label: "Humanitarian section", fallback: "humanitarian-women", focus: "55% 50%" },
      { key: "home.watch", label: "Watch online section", fallback: "worship" },
    ],
  },
  {
    id: "about",
    title: "About pages",
    href: "/about",
    slots: [
      { key: "about.hero", label: "Our story: top picture", fallback: "christhoood-about" },
      { key: "about.intro", label: "Our story: picture beside the opening words", fallback: "christhood-about-intro" },
      { key: "about.mission.hero", label: "Mission and faith: top picture" },
      { key: "about.apostle.hero", label: "Apostle Dennis: top picture" },
      { key: "about.leadership.hero", label: "Leadership: top picture" },
    ],
  },
  {
    id: "lists",
    title: "Section front pages",
    href: "/ministries",
    slots: [
      { key: "ministries.hero", label: "Ministries: top picture" },
      { key: "programmes.hero", label: "Programmes: top picture" },
      { key: "events.hero", label: "Events: top picture" },
      { key: "give.hero", label: "Giving: top picture" },
      { key: "humanitarian.hero", label: "Humanitarian: top picture", fallback: "humanitarian-women", focus: "50% 45%" },
    ],
  },
  {
    id: "connect",
    title: "New guests and prayer",
    href: "/visit",
    slots: [
      { key: "visit.hero", label: "New guest form: top picture" },
      { key: "prayer.hero", label: "Prayer form: top picture" },
      { key: "camps.hero", label: "Camps page: top picture", fallback: "jewels-camp-memory", focus: "50% 35%" },
      { key: "camps.apply.hero", label: "Camp application: top picture", fallback: "jewels-camp-memory", focus: "50% 35%" },
    ],
  },
  {
    id: "ministry",
    title: "Ministry pages",
    href: "/ministries",
    slots: ministries.map((m) => ({ key: `ministry.${m.slug}.hero`, label: m.title, fallback: m.hero })),
  },
  {
    id: "programme",
    title: "Programme pages",
    href: "/programmes",
    slots: programmes.map((p) => ({ key: `programme.${p.slug}.hero`, label: p.title, fallback: p.hero })),
  },
];

export const allSlots: SlotDef[] = slotGroups.flatMap((g) => g.slots);
