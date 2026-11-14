import "server-only";
import { randomUUID } from "node:crypto";

const endpoint = "https://api.httpsms.com/v1/messages/send";
const e164 = (value: string) => /^\+[1-9]\d{7,14}$/.test(value.trim());

export function httpSmsReady() {
  return Boolean(process.env.HTTPSMS_API_KEY?.trim() && e164(process.env.HTTPSMS_FROM?.trim() ?? ""));
}

/** A transactional text. Message bodies never include a child's health or care details. */
export async function sendHttpSms(to: string, content: string): Promise<boolean> {
  const key = process.env.HTTPSMS_API_KEY?.trim();
  const from = process.env.HTTPSMS_FROM?.trim();
  const recipient = to.trim();
  if (!key || !from || !e164(from) || !e164(recipient) || !content.trim()) return false;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "x-api-key": key, Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: recipient, content: content.trim().slice(0, 900), request_id: randomUUID() }),
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) {
      console.error("httpSMS delivery request failed", { status: response.status });
      return false;
    }
    return true;
  } catch (error) {
    console.error("httpSMS delivery request failed", error instanceof Error ? error.name : "unknown error");
    return false;
  }
}

/** A parent receipt and, when configured, an office alert after a batch is safely saved. */
export async function sendCampApplicationTexts(input: { parentPhone: string; campTitle: string; count: number; parentOptIn: boolean }) {
  const parentPhone = input.parentPhone.trim();
  const title = input.campTitle.replace(/[\r\n\u0000-\u001f]/g, " ").trim().slice(0, 48);
  const count = Math.max(1, Math.min(8, Math.floor(input.count)));
  const parentMessage = `Christhood Camps: We received applications for ${count} ${count === 1 ? "camper" : "campers"}${title ? ` for ${title}` : ""}. The camp office will review and contact you. No payment was taken online.`;
  const destinations = (process.env.CAMP_SMS_TO ?? "").split(/[;,\s]+/).map((v) => v.trim()).filter((v) => e164(v)).slice(0, 5);
  const officeMessage = `Christhood Camps: ${count} camp ${count === 1 ? "application" : "applications"} received${title ? ` for ${title}` : ""}. Sign in to the camp area to review.`;
  const officeRecipients = destinations.filter((to) => input.parentOptIn || to !== parentPhone);
  const unique = [...new Set([...(input.parentOptIn ? [parentPhone] : []), ...officeRecipients].map((v) => v.trim()).filter(e164))];
  await Promise.allSettled(unique.map((to) => sendHttpSms(to, input.parentOptIn && to === parentPhone ? parentMessage : officeMessage)));
}

/** Sends a brief private alert without disclosing the message or a child's details. */
export async function sendFamilyCampAlert(phone: string, kind: "shared-note" | "away") {
  const content = kind === "away"
    ? "Christhood Camps: The team recorded your child as away from a camp check-in today. Please sign in to your family page or contact the camp office if this is unexpected."
    : "Christhood Camps: The camp team has posted a private update for your family. Sign in to your family page to read it.";
  await sendHttpSms(phone, content);
}

export async function sendPhoneVerificationCode(phone: string, code: string) {
  return sendHttpSms(phone, `Christhood family page: your phone-change code is ${code}. It expires in 10 minutes. If you did not request it, ignore this message.`);
}
