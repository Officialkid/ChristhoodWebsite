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
  /** The department that looks after this event (department id). Only that team and the web team may edit it. */
  department?: string;
};

export type Announcement = { message: string; href?: string; label?: string };

export type Message = { title: string; speaker?: string; date?: string; youtubeId?: string; summary?: string; thumb?: string };

export type SiteSettings = {
  verse: { text: string; ref: string; image?: string };
  /** The welcome words on the home page, one paragraph each. */
  welcome: string[];
  fellowship: { day: string; start: string; end: string; display: string; venue: string; area: string; address: string };
  contact: { phones: { label: string; display: string; tel: string }[]; email: string };
  giving: { bank: string; paybill: string; account: string };
  hero: { kicker: string; headline: string; sub: string };
};

/* ---------- admin area ---------- */

export type Role = "admin" | "head";

export type StoredUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  /** Department ids the person leads (ignored for admins, who may do everything). */
  departments: string[];
  hash: string;
  active: boolean;
  /** Must choose a new password at next sign-in. */
  mustChange?: boolean;
  createdAt: string;
  lastLogin?: string;
  /** Google's own id for this person, saved the first time they sign in with Google. */
  googleSub?: string;
};

/** Someone who signed in with Google but is not on the team yet. An administrator approves or declines. */
export type AccessRequest = { id: string; email: string; name: string; sub: string; status: "pending" | "declined"; createdAt: string; lastTriedAt: string; tries: number };

/** What a department head changed on a ministry or programme page. Anything left out keeps the shipped wording. */
export type PageOverride = {
  id: string; // "ministry:worship"
  kind: PageDoc["kind"];
  slug: string;
  title?: string;
  tagline?: string;
  audience?: string;
  summary?: string;
  intro?: string[];
  blocks?: Block[];
  updatedAt: string;
  updatedBy: string;
};

export type SlotValue = { id: string; src: string; focus?: string; updatedAt: string; updatedBy: string };

export type MediaItem = {
  id: string;
  /** Cloudinary assets imported from the church's Immich photo archive. */
  storage?: "cloudinary";
  providerId?: string;
  sourceAssetId?: string;
  /** Address of the full-size picture. */
  url: string;
  /** Address of the small picture used on phones. */
  small: string;
  w: number;
  h: number;
  name: string;
  note: string;
  bytes: number;
  createdAt: string;
  by: string;
};

export type Visitor = {
  id: string;
  createdAt: string;
  fullName: string;
  phone: string;
  email?: string;
  area?: string;
  ageGroup?: string;
  visitDate: string;
  firstVisit: string;
  heardFrom?: string;
  invitedBy?: string;
  homeChurch?: string;
  interests: string[];
  prayerRequest?: string;
  status: "new" | "contacted" | "settled";
  followedUpBy?: string;
  /** The protocol team member who registered them. */
  registeredBy?: string;
  notes?: string;
};

export type Prayer = {
  id: string;
  createdAt: string;
  type: "prayer" | "thanksgiving";
  anonymous: boolean;
  name?: string;
  phone?: string;
  category?: string;
  message: string;
  whoMaySee?: string;
  mayShare?: string;
  callBack: boolean;
  status: "new" | "praying" | "done";
  handledBy?: string;
  notes?: string;
};

export type Activity = { id: string; at: string; by: string; action: string; target?: string };

/* ---------- camp applications ---------- */

export type CampAppStatus = "Pending review" | "Approved" | "Needs correction" | "Declined";

/** The children's details kept sealed (see src/lib/crypto.ts). */
export type CampSealed = {
  dob: string;
  nickname?: string;
  gender?: string;
  school?: string;
  grade?: string;
  guardianId?: string;
  residence?: string;
  house?: string;
  doctor?: string;
  hospital?: string;
  doctorPhone?: string;
  blood?: string;
  insurer?: string;
  policy?: string;
  conditions?: string;
  allergies?: string;
  disabilities?: string;
  otherConditions?: string;
  medication?: string;
  specialNeeds?: string;
  swimming?: string;
  emergencies: { name: string; relationship?: string; gender?: string; email?: string; phone: string }[];
  mediaConsent: "Yes" | "No";
  signature: string;
  consentVersion: string;
  consentAt: string;
  paymentType?: string;
  amount: number;
  paymentDate?: string;
  paymentMode?: string;
  paymentReference?: string;
  balanceDate?: string;
  pocketMoney: number;
};

export type CampApplication = {
  id: string;
  createdAt: string;
  updatedAt: string;
  eventId: string;
  eventTitle: string;
  /** Which programme it belongs to: decides which department head sees it. */
  camp: "jewels" | "teen-life" | "other";
  childName: string;
  guardian: string;
  phone: string;
  email?: string;
  ageAtCamp: number;
  /** Outside the programme's usual age range: the team looks at it by hand. */
  ageReview: boolean;
  status: CampAppStatus;
  paymentVerified: boolean;
  reviewNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  sealed: string;
  /** Set when a signed-in family made the application. */
  familyId?: string;
  childId?: string;
};

/** A child who came to a camp before, kept so the programme can invite the family back. Personal details are sealed. */
export type Camper = {
  id: string;
  camp: "jewels" | "teen-life";
  name: string;
  year: number;
  sealed: string;
  /** A one-time code the camp office gives a parent so the child joins their family page. Only a fingerprint of it is kept. */
  code?: { hash: string; expires: string };
  familyId?: string;
};
export type CamperSealed = { age?: number; guardian?: string; location?: string; contact?: string };

/* ---------- families ---------- */

/** A parent's sign-in for the family page. Separate from the team's accounts. */
export type Family = { id: string; phone: string; name: string; email?: string; hash: string; active: boolean; mustChange?: boolean; createdAt: string };

/** What is kept about a child so the next application starts filled in (sealed, like the application itself). */
export type ChildProfile = Pick<
  CampSealed,
  "dob" | "nickname" | "gender" | "school" | "grade" | "guardianId" | "residence" | "house" | "doctor" | "hospital" | "doctorPhone" | "blood" | "insurer" | "policy" | "conditions" | "allergies" | "disabilities" | "otherConditions" | "medication" | "specialNeeds" | "swimming" | "emergencies"
>;

export type FamilyChild = { id: string; familyId: string; name: string; camp?: "jewels" | "teen-life"; camperId?: string; sealed?: string; createdAt: string; updatedAt: string };

/** A message from the camp team that families can read. */
export type CampUpdate = { id: string; createdAt: string; by: string; camp: "all" | "jewels" | "teen-life"; title: string; body: string };

/* ---------- camp days ---------- */

/** One line of a camp's timetable. `date` is the Nairobi day, `start` and `end` are 24-hour times like 09:30. */
export type CampSession = { id: string; eventId: string; date: string; start: string; end?: string; title: string; place?: string; lead?: string; note?: string; updatedBy: string; updatedAt: string };

/** Which facilitator looks after an approved camper. The id is the application's id. */
export type CampAssignment = { id: string; eventId: string; userId: string; userName: string; by: string; at: string };

/** Whether a camper was at camp on one day. The id is "<application id>~<date>". */
export type CampAttendance = { id: string; applicationId: string; eventId: string; date: string; status: "present" | "absent"; by: string; at: string };

/** A note about a camper. The words are sealed; `shared` notes also show on the family's page. */
export type CampNote = { id: string; applicationId: string; eventId: string; byId: string; by: string; createdAt: string; shared: boolean; sealed: string };
