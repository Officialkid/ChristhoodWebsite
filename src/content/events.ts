import type { EventDoc } from "@/lib/types";

/** Starting events, copied from the events sheet the team used before. */
export const events: EventDoc[] = [
  {
    id: "branch-excands-2026",
    title: "Branch ExCands Programme",
    subtitle: "Making Disciples for Jesus",
    start: "2026-02-28T06:00:00+03:00",
    end: "2026-05-23T06:00:00+03:00",
    location: "Azuri Premier Hotel (Along Aga Khan Walk)",
    fee: 3000,
    category: "mentorship",
    image: "branch-program-2026",
    registrationOpen: true,
    registerHref: "/programmes/branch/register",
  },
  {
    id: "jewels-kids-camp-2026",
    title: "Jewels Kids Camp",
    subtitle: "Ages 7–12",
    start: "2026-11-22T00:00:00+03:00",
    end: "2026-11-27T23:59:00+03:00",
    location: "Lukenya Academy",
    fee: 10960,
    category: "camp",
    image: "jewels-about-page",
    registrationOpen: true,
    registerHref: "/events/apply",
  },
  {
    id: "teen-life-camp-2026",
    title: "Teen Life Mentorship Camp",
    subtitle: "Ages 13–19",
    start: "2026-12-06T00:00:00+03:00",
    end: "2026-12-11T23:59:00+03:00",
    location: "Lukenya Academy",
    fee: 10960,
    category: "camp",
    image: "tlm-about-section",
    registrationOpen: true,
    registerHref: "/events/apply",
  },
];

export const categoryLabel: Record<EventDoc["category"], string> = {
  camp: "Camps",
  mentorship: "Mentorship",
  missions: "Missions",
  fellowship: "Fellowship",
  prayer: "Prayer & summits",
};
