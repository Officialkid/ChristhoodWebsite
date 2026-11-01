/** Shapes shared by the shipped content and the admin area. Keep both in step. */

export type Block =
  | { type: "statement"; label: string; text: string }
  | { type: "prose"; title?: string; paragraphs: string[] }
  | { type: "cards"; title: string; intro?: string; numbered?: boolean; items: { title: string; text?: string; bullets?: string[] }[] }
  | { type: "list"; title: string; intro?: string; items: string[] }
  | { type: "quote"; text: string; cite?: string }
  | { type: "gallery"; title: string; photos: string[] };

export type PageDoc = {
  kind: "ministry" | "programme";
  slug: string;
  title: string;
  tagline: string;
  /** One or two sentences used on cards. */
  summary: string;
  /** Photo name (see src/content/images.json) or a full address from the admin area. */
  hero: string;
  /** Who it is for, shown as a badge. */
  audience?: string;
  intro: string[];
  blocks: Block[];
  order: number;
  featured?: boolean;
  /** Extra buttons on the page. */
  actions?: { label: string; href: string; external?: boolean }[];
};

export type Leader = {
  name: string;
  role: string;
  photo: string;
  teaser: string;
  story: string[];
};

export type Story = { name: string; role: string; photo?: string; quote: string };

export type EventDoc = {
  id: string;
  title: string;
  subtitle?: string;
  start: string; // ISO date or date-time, Nairobi time
  end?: string;
  location?: string;
  fee?: number;
  category: "camp" | "mentorship" | "missions" | "fellowship" | "prayer";
  image?: string;
  details?: string;
  registrationOpen: boolean;
  registerHref?: string;
};

export type Announcement = { message: string; href?: string; label?: string };

export type Message = { title: string; speaker?: string; date?: string; youtubeId?: string; summary?: string; thumb?: string };

export type SiteSettings = {
  fellowship: { day: string; start: string; end: string; display: string; venue: string; area: string; address: string };
  contact: { phones: { label: string; display: string; tel: string }[]; email: string };
  giving: { bank: string; paybill: string; account: string };
  hero: { kicker: string; headline: string; sub: string };
};
