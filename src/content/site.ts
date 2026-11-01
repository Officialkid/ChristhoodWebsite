import type { SiteSettings } from "@/lib/types";

export const site = {
  name: "Christhood Ministries",
  fullName: "Christhood International Outfield Ministry",
  short: "C.I.O.M",
  mantra: ["Believe", "Belong", "Become"],
  scripture: { text: "Therefore go and make disciples of all nations…", ref: "Matthew 28:19" },
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://christhood-website.vercel.app",
  mapsLink: "https://www.google.com/maps/search/?api=1&query=Azuri+Premier+Cuisines+Nairobi",
  mapEmbed:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3988.8093851399153!2d36.82375007320759!3d-1.2885517356249188!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x182f1114511e8a1d%3A0x10609fba1f57532!2sAzuri%20Premier%20Cuisines!5e0!3m2!1sen!2ske!4v1729920524128!5m2!1sen!2ske",
  portal: { label: "Christhood Learning Portal", href: "https://instituteofapologetics.org" },
  prayerForm:
    "https://docs.google.com/forms/d/e/1FAIpQLSfdQc7PtNFp_YQmI-xPh_jEuLnQBZpNkiGx6bcdcTdzVEpGkQ/viewform?embedded=true",
  whatsapp: { prayer: "254714545791", counselling: "254714545791", camps: "254725968973" },
  socials: [
    { name: "Instagram", handle: "@christhoodministries", href: "https://www.instagram.com/christhoodministries" },
    { name: "Facebook", handle: "Christhood Ministries", href: "https://www.facebook.com/christhoodministries" },
    { name: "YouTube", handle: "@christhoodministries", href: "https://youtube.com/@christhoodministries" },
    { name: "TikTok", handle: "@christhoodministries_int", href: "https://www.tiktok.com/@christhoodministries_int" },
    { name: "X", handle: "@christhood_ciom", href: "https://x.com/christhood_ciom" },
  ],
  facts: [
    { value: 2009, label: "Where the story began", plain: true },
    { value: 12, label: "Ministries" },
    { value: 5, label: "Programmes" },
    { value: 3, label: "Humanitarian activities" },
    { value: 11, label: "Towns with Branch mentorship" },
  ],
};

/** What the admin area can change. These are the starting values. */
export const defaultSettings: SiteSettings = {
  fellowship: {
    day: "Saturday",
    start: "15:00",
    end: "18:30",
    display: "3:00 PM – 6:30 PM",
    venue: "Azuri Premier Hotel",
    area: "Along Aga Khan Walk, Nairobi CBD",
    address: "Azuri Premier Cuisines, Aga Khan Walk, opposite National Bank, Nairobi CBD",
  },
  contact: {
    phones: [
      { label: "Main line", display: "+254 714 545 791", tel: "+254714545791" },
      { label: "Second line", display: "+254 712 284 711", tel: "+254712284711" },
    ],
    email: "christhoodministries01@gmail.com",
  },
  giving: { bank: "Cooperative Bank", paybill: "400200", account: "01103743154200" },
  hero: {
    kicker: "Saturday Fellowship · Azuri Premier Hotel · Nairobi CBD",
    headline: "Believe. Belong. Become.",
    sub: "Join our vibrant family, committed to the Word, prayer, and intercession.",
  },
};

export type NavItem = { label: string; href: string; blurb?: string };
export const nav: { label: string; href: string; children?: NavItem[] }[] = [
  {
    label: "About",
    href: "/about",
    children: [
      { label: "Our story", href: "/about", blurb: "From a small outreach in 2009 to a family of ministries" },
      { label: "Mission, vision & faith", href: "/about/mission", blurb: "What we believe and how we live it" },
      { label: "Apostle Dennis", href: "/about/apostle-dennis", blurb: "Our founder and visionary leader" },
      { label: "Leadership", href: "/about/leadership", blurb: "The servant leaders behind each ministry" },
    ],
  },
  { label: "Ministries", href: "/ministries" },
  { label: "Programmes", href: "/programmes" },
  { label: "Events", href: "/events" },
  { label: "Humanitarian", href: "/humanitarian" },
];
