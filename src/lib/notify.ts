import "server-only";
import nodemailer from "nodemailer";
import { site } from "@/content/site";

/** Optional extras after a form is saved. Each one is switched on only when its settings exist, and a failure never loses the form. */

export async function notifyTeam(kind: "visitor" | "prayer" | "thanksgiving", who: string) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, NOTIFY_EMAILS } = process.env;
  if (!SMTP_HOST || !NOTIFY_EMAILS) return;
  try {
    const transport = nodemailer.createTransport({ host: SMTP_HOST, port: Number(SMTP_PORT ?? 587), secure: Number(SMTP_PORT) === 465, auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined });
    const label = kind === "visitor" ? "new guest" : kind === "prayer" ? "prayer request" : "thanksgiving";
    await transport.sendMail({
      from: SMTP_FROM ?? SMTP_USER,
      to: NOTIFY_EMAILS,
      subject: `New ${label} from the website: ${who.replace(/[\r\n]+/g, " ").slice(0, 60)}`,
      // Details stay in the admin area. Prayer requests are never copied into email.
      text: `A new ${label} has come in through the website.\n\nOpen it here: ${site.url}/123admin/${kind === "visitor" ? "guests" : "prayers"}\n\nFor privacy, the details are kept only in the admin area, not in this email.`,
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
