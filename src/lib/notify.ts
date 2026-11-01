import "server-only";
import nodemailer from "nodemailer";
import { site } from "@/content/site";
import type { SiteSettings } from "@/lib/types";

/** Optional extras after a form is saved. Each one is switched on only when its settings exist, and a failure never loses the form. */

export async function notifyTeam(kind: "visitor" | "prayer" | "thanksgiving" | "camp", who: string) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, NOTIFY_EMAILS } = process.env;
  if (!SMTP_HOST || !NOTIFY_EMAILS) return;
  try {
    const transport = nodemailer.createTransport({ host: SMTP_HOST, port: Number(SMTP_PORT ?? 587), secure: Number(SMTP_PORT) === 465, auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined });
    const label = kind === "visitor" ? "new member" : kind === "prayer" ? "prayer request" : kind === "camp" ? "camp application" : "thanksgiving";
    await transport.sendMail({
      from: SMTP_FROM ?? SMTP_USER,
      to: NOTIFY_EMAILS,
      subject: `New ${label} from the website: ${who.replace(/[\r\n]+/g, " ").slice(0, 60)}`,
      // Details stay in the admin area. Prayer requests are never copied into email.
      text: `A new ${label} has come in through the website.\n\nOpen it here: ${site.url}/123admin/${kind === "visitor" ? "guests" : kind === "camp" ? "camps" : "prayers"}\n\nFor privacy, the details are kept only in the admin area, not in this email.`,
    });
  } catch (error) {
    console.error("Notification email failed", error);
  }
}

/** Also adds the entry to the church's private Google Sheet, for teams that like to work there. */
export async function mirrorToSheet(fields: Record<string, string>): Promise<boolean> {
  const url = process.env.GOOGLE_SHEET_WEBHOOK;
  if (!url) return false;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ elapsedMs: "5000", website: "", ...fields }).toString(),
      redirect: "follow",
    });
    return res.ok;
  } catch (error) {
    console.error("Sheet mirror failed", error);
    return false;
  }
}

/**
 * A short welcome email to a new member the protocol team has just registered. Only sent when mail is set up.
 * Returns what happened so the protocol team can be told plainly.
 */
export async function welcomeEmail(to: string, firstName: string, settings: SiteSettings): Promise<"sent" | "not-set-up" | "failed"> {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  if (!SMTP_HOST) return "not-set-up";
  const f = settings.fellowship;
  try {
    const transport = nodemailer.createTransport({ host: SMTP_HOST, port: Number(SMTP_PORT ?? 587), secure: Number(SMTP_PORT) === 465, auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined });
    await transport.sendMail({
      from: SMTP_FROM ?? SMTP_USER,
      to,
      replyTo: settings.contact.email,
      subject: "Welcome to Christhood Ministries",
      text: [
        `Dear ${firstName},`,
        "",
        "Welcome to the Christhood family. We are so glad you joined us.",
        "",
        `We meet every ${f.day}, ${f.display}, at ${f.address}.`,
        "Our protocol team will keep in touch, and you are always welcome to reply to this email or call us:",
        ...settings.contact.phones.map((p) => `  ${p.display}`),
        "",
        "Believe. Belong. Become.",
        "Christhood Ministries",
      ].join("\n"),
    });
    return "sent";
  } catch (error) {
    console.error("Welcome email failed", error);
    return "failed";
  }
}
