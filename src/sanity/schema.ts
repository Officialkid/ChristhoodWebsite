import { defineArrayMember, defineField, defineType } from "sanity";

/**
 * Everything here is worded for the church team, not for developers.
 * Titles are what people see in the admin area. Field names stay stable so the website can read them.
 */

const photo = (name: string, title: string, description?: string) =>
  defineField({ name, title, type: "image", options: { hotspot: true }, description });

const statement = defineArrayMember({
  name: "statement", title: "Big statement (mission, vision…)", type: "object",
  fields: [
    defineField({ name: "label", title: "Small heading", type: "string", validation: (r) => r.required() }),
    defineField({ name: "text", title: "Statement", type: "text", rows: 4, validation: (r) => r.required() }),
  ],
  preview: { select: { title: "label", subtitle: "text" } },
});

const prose = defineArrayMember({
  name: "prose", title: "Paragraphs", type: "object",
  fields: [
    defineField({ name: "title", title: "Heading (optional)", type: "string" }),
    defineField({ name: "paragraphs", title: "Paragraphs", type: "array", of: [{ type: "text", rows: 4 }] }),
  ],
  preview: { select: { title: "title", subtitle: "paragraphs.0" }, prepare: ({ title, subtitle }) => ({ title: title || "Paragraphs", subtitle }) },
});

const cards = defineArrayMember({
  name: "cards", title: "Cards (a set of ideas side by side)", type: "object",
  fields: [
    defineField({ name: "title", title: "Heading", type: "string", validation: (r) => r.required() }),
    defineField({ name: "intro", title: "Short introduction (optional)", type: "text", rows: 3 }),
    defineField({ name: "numbered", title: "Number the cards 1, 2, 3…", type: "boolean", initialValue: false }),
    defineField({
      name: "items", title: "Cards", type: "array",
      of: [{
        type: "object", name: "card", title: "Card",
        fields: [
          defineField({ name: "title", title: "Card title", type: "string", validation: (r) => r.required() }),
          defineField({ name: "text", title: "Card text", type: "text", rows: 4 }),
          defineField({ name: "bullets", title: "Bullet points (optional)", type: "array", of: [{ type: "string" }] }),
        ],
        preview: { select: { title: "title", subtitle: "text" } },
      }],
    }),
  ],
  preview: { select: { title: "title" }, prepare: ({ title }) => ({ title, subtitle: "Cards" }) },
});

const list = defineArrayMember({
  name: "list", title: "Checklist", type: "object",
  fields: [
    defineField({ name: "title", title: "Heading", type: "string", validation: (r) => r.required() }),
    defineField({ name: "intro", title: "Short introduction (optional)", type: "text", rows: 2 }),
    defineField({ name: "items", title: "Items", type: "array", of: [{ type: "string" }] }),
  ],
  preview: { select: { title: "title" }, prepare: ({ title }) => ({ title, subtitle: "Checklist" }) },
});

const quote = defineArrayMember({
  name: "quote", title: "Scripture or quote", type: "object",
  fields: [
    defineField({ name: "text", title: "Words", type: "text", rows: 3, validation: (r) => r.required() }),
    defineField({ name: "cite", title: "Who or where from", type: "string" }),
  ],
  preview: { select: { title: "text", subtitle: "cite" } },
});

const gallery = defineArrayMember({
  name: "gallery", title: "Photo gallery", type: "object",
  fields: [
    defineField({ name: "title", title: "Heading", type: "string", validation: (r) => r.required() }),
    defineField({ name: "photos", title: "Photos", type: "array", of: [{ type: "image", options: { hotspot: true } }], options: { layout: "grid" } }),
  ],
  preview: { select: { title: "title", media: "photos.0" }, prepare: ({ title, media }) => ({ title, subtitle: "Photo gallery", media }) },
});

const siteSettings = defineType({
  name: "siteSettings", title: "Website settings", type: "document",
  groups: [{ name: "home", title: "Home page" }, { name: "visit", title: "Visit us" }, { name: "contact", title: "Contact" }, { name: "giving", title: "Giving" }],
  fields: [
    defineField({ name: "heroKicker", title: "Line above the main heading", type: "string", group: "home", description: "Example: Saturday Fellowship · Azuri Premier Hotel · Nairobi CBD" }),
    defineField({ name: "heroHeadline", title: "Main heading", type: "string", group: "home" }),
    defineField({ name: "heroSub", title: "Sentence under the heading", type: "text", rows: 2, group: "home" }),
    defineField({ name: "fellowshipDay", title: "Day of the week", type: "string", group: "visit", options: { list: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] } }),
    defineField({ name: "fellowshipStart", title: "Starts at (24-hour, e.g. 15:00)", type: "string", group: "visit", validation: (r) => r.regex(/^([01]\d|2[0-3]):[0-5]\d$/, { name: "time" }).error("Use the 24-hour format, like 15:00") }),
    defineField({ name: "fellowshipEnd", title: "Ends at (24-hour, e.g. 18:30)", type: "string", group: "visit", validation: (r) => r.regex(/^([01]\d|2[0-3]):[0-5]\d$/, { name: "time" }).error("Use the 24-hour format, like 18:30") }),
    defineField({ name: "fellowshipDisplay", title: "Time as people read it", type: "string", group: "visit", description: "Example: 3:00 PM – 6:30 PM" }),
    defineField({ name: "venue", title: "Venue name", type: "string", group: "visit" }),
    defineField({ name: "area", title: "Short location", type: "string", group: "visit" }),
    defineField({ name: "address", title: "Full address", type: "text", rows: 2, group: "visit" }),
    defineField({
      name: "phones", title: "Phone numbers", type: "array", group: "contact",
      of: [{
        type: "object", name: "phone",
        fields: [
          defineField({ name: "label", title: "Whose number is it?", type: "string" }),
          defineField({ name: "display", title: "How it should read", type: "string", description: "+254 714 545 791" }),
          defineField({ name: "tel", title: "Number for tapping to call (no spaces)", type: "string", description: "+254714545791" }),
        ],
        preview: { select: { title: "display", subtitle: "label" } },
      }],
    }),
    defineField({ name: "email", title: "Email address", type: "string", group: "contact" }),
    defineField({ name: "bank", title: "Bank", type: "string", group: "giving" }),
    defineField({ name: "paybill", title: "Paybill number", type: "string", group: "giving" }),
    defineField({ name: "account", title: "Account number", type: "string", group: "giving" }),
  ],
  preview: { prepare: () => ({ title: "Website settings" }) },
});

const event = defineType({
  name: "event", title: "Event or camp", type: "document",
  fields: [
    defineField({ name: "title", title: "Name", type: "string", validation: (r) => r.required() }),
    defineField({ name: "subtitle", title: "Short line under the name", type: "string" }),
    defineField({ name: "category", title: "Kind of event", type: "string", initialValue: "camp", options: { list: [{ title: "Camp", value: "camp" }, { title: "Mentorship", value: "mentorship" }, { title: "Missions", value: "missions" }, { title: "Fellowship", value: "fellowship" }, { title: "Prayer & summit", value: "prayer" }] } }),
    defineField({ name: "start", title: "Starts", type: "datetime", validation: (r) => r.required() }),
    defineField({ name: "end", title: "Ends", type: "datetime" }),
    defineField({ name: "location", title: "Where", type: "string" }),
    defineField({ name: "fee", title: "Cost per person (KES, leave empty if free)", type: "number" }),
    photo("image", "Poster or photo"),
    defineField({ name: "details", title: "More details", type: "text", rows: 4 }),
    defineField({ name: "registrationOpen", title: "Registration is open", type: "boolean", initialValue: true }),
    defineField({ name: "registerHref", title: "Where the Register button goes", type: "string", description: "Leave empty to use the camp form. You can paste any web address." }),
    defineField({ name: "visible", title: "Show on the website", type: "boolean", initialValue: true }),
  ],
  orderings: [{ title: "Soonest first", name: "startAsc", by: [{ field: "start", direction: "asc" }] }],
  preview: { select: { title: "title", subtitle: "start", media: "image" } },
});

const announcement = defineType({
  name: "announcement", title: "Announcement banner", type: "document",
  fields: [
    defineField({ name: "message", title: "Message", type: "string", validation: (r) => r.required().max(140) }),
    defineField({ name: "label", title: "Button words", type: "string", description: "Example: Register now" }),
    defineField({ name: "href", title: "Where the button goes", type: "string" }),
    defineField({ name: "active", title: "Show it now", type: "boolean", initialValue: true }),
    defineField({ name: "expires", title: "Hide automatically after", type: "datetime" }),
  ],
  preview: { select: { title: "message", subtitle: "active" }, prepare: ({ title, subtitle }) => ({ title, subtitle: subtitle ? "Showing" : "Hidden" }) },
});

const message = defineType({
  name: "message", title: "Message or sermon", type: "document",
  fields: [
    defineField({ name: "title", title: "Title", type: "string", validation: (r) => r.required() }),
    defineField({ name: "speaker", title: "Who spoke", type: "string" }),
    defineField({ name: "date", title: "Date", type: "date" }),
    defineField({ name: "youtubeUrl", title: "YouTube link", type: "url", description: "Paste the link to the video. It plays on the website." }),
    defineField({ name: "summary", title: "Short summary", type: "text", rows: 3 }),
  ],
  orderings: [{ title: "Newest first", name: "dateDesc", by: [{ field: "date", direction: "desc" }] }],
  preview: { select: { title: "title", subtitle: "speaker" } },
});

const leader = defineType({
  name: "leader", title: "Leader", type: "document",
  fields: [
    defineField({ name: "name", title: "Name", type: "string", validation: (r) => r.required() }),
    defineField({ name: "role", title: "Role", type: "string" }),
    photo("photo", "Photo"),
    defineField({ name: "teaser", title: "Opening words", type: "text", rows: 3 }),
    defineField({ name: "story", title: "The rest of their message", type: "array", of: [{ type: "text", rows: 4 }] }),
    defineField({ name: "order", title: "Order on the page (1 first)", type: "number" }),
  ],
  orderings: [{ title: "Page order", name: "orderAsc", by: [{ field: "order", direction: "asc" }] }],
  preview: { select: { title: "name", subtitle: "role", media: "photo" } },
});

const story = defineType({
  name: "story", title: "Member story", type: "document",
  fields: [
    defineField({ name: "name", title: "Name", type: "string", validation: (r) => r.required() }),
    defineField({ name: "role", title: "Role or team", type: "string" }),
    photo("photo", "Photo"),
    defineField({ name: "quote", title: "Their words", type: "text", rows: 5, validation: (r) => r.required() }),
  ],
  preview: { select: { title: "name", subtitle: "role", media: "photo" } },
});

const ministryPage = defineType({
  name: "ministryPage", title: "Ministry or programme page", type: "document",
  fields: [
    defineField({ name: "kind", title: "Is this a ministry or a programme?", type: "string", initialValue: "ministry", options: { list: [{ title: "Ministry", value: "ministry" }, { title: "Programme", value: "programme" }], layout: "radio" }, validation: (r) => r.required() }),
    defineField({ name: "title", title: "Name", type: "string", validation: (r) => r.required() }),
    defineField({ name: "slug", title: "Page address", type: "slug", options: { source: "title", maxLength: 60 }, description: "Press Generate. To change an existing page, keep the address it already has.", validation: (r) => r.required() }),
    defineField({ name: "tagline", title: "Line under the name", type: "string" }),
    defineField({ name: "audience", title: "Who it is for", type: "string", description: "Example: Ages 13–19" }),
    defineField({ name: "summary", title: "Short summary for the cards", type: "text", rows: 3 }),
    photo("heroImage", "Main photo", "Wide photos work best."),
    defineField({ name: "intro", title: "Opening paragraphs", type: "array", of: [{ type: "text", rows: 4 }] }),
    defineField({ name: "sections", title: "Page sections", type: "array", of: [statement, cards, prose, list, quote, gallery], description: "Add, remove and drag sections to change the page." }),
    defineField({ name: "order", title: "Order in lists (1 first)", type: "number" }),
    defineField({ name: "featured", title: "Show on the home page", type: "boolean", initialValue: false }),
  ],
  orderings: [{ title: "Page order", name: "orderAsc", by: [{ field: "order", direction: "asc" }] }],
  preview: { select: { title: "title", subtitle: "kind", media: "heroImage" } },
});

export const schemaTypes = [siteSettings, event, announcement, message, ministryPage, leader, story];
