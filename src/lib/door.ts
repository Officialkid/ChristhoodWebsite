import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { checkPassword, clientKey, hashPassword } from "./auth";
import { seal, unseal } from "./crypto";
import { matchStep, newSecret, otpauthUrl } from "./door-totp";
import { store } from "./store";

/**
 * The team door. Nothing on the public site links to the team area. A team member types a phrase (anywhere on the public
 * pages, or taps the logo seven times on a phone) and, when the code is switched on, the six-digit code that rotates every
 * 30 seconds on their phone. That earns a pass for half an hour, and the team sign-in opens. The door only hides the
 * sign-in: the real protection is still Google (or a password) plus the list of approved people.
 */
export const DEFAULT_PHRASE = "123admin";
const KEY = "door:config";

export type DoorConfig = {
  /** Only a fingerprint of a phrase the administrator chose. Without one, the default phrase works. */
  phraseHash?: string;
  /** Ask for the rotating code as well as the phrase. */
  requireCode: boolean;
  /** The code's secret, sealed like the children's details. */
  secret?: string;
  /** The last 30-second step that was used, so one code cannot be used twice. */
  lastStep?: number;
  updatedBy?: string;
  updatedAt?: string;
};

export const doorConfig = async (): Promise<DoorConfig> => (await store.getDoc<DoorConfig>(KEY)) ?? { requireCode: false };
const save = (cfg: DoorConfig) => store.setDoc(KEY, cfg);

export const normalisePhrase = (p: string) => p.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 64);
const sha = (s: string) => createHash("sha256").update(s).digest();

/** DOOR_CODE_OFF=1 in the hosting settings turns the code off, in case the phone is lost. */
export const codeRequired = (cfg: DoorConfig) => process.env.DOOR_CODE_OFF !== "1" && cfg.requireCode && Boolean(cfg.secret);

export async function phraseOk(typed: string, cfg: DoorConfig): Promise<boolean> {
  const t = normalisePhrase(typed);
  if (!t) return false;
  if (cfg.phraseHash) return checkPassword(t, cfg.phraseHash);
  return timingSafeEqual(sha(t), sha(DEFAULT_PHRASE));
}

/** Checks a typed code, and remembers it was used. */
export async function codeOk(typed: string): Promise<boolean> {
  const cfg = await doorConfig();
  if (!cfg.secret) return false;
  const step = matchStep(await unseal<string>(cfg.secret), typed, cfg.lastStep ?? -1);
  if (step === null) return false;
  await save({ ...cfg, lastStep: step });
  return true;
}

/** Too many guesses from one place: they are answered with silence for a while. */
export async function knockBlocked(): Promise<boolean> {
  return (await store.hit(`knock-ip:${await clientKey()}`, 3600)) > 30;
}
export async function codeBlocked(): Promise<boolean> {
  return (await store.hit(`knock-code-ip:${await clientKey()}`, 900)) > 6;
}

/* ---------- what the administrator can change ---------- */

export async function setPhrase(by: string, phrase: string): Promise<string | null> {
  const p = normalisePhrase(phrase);
  if (p.length < 6) return "Use at least 6 characters.";
  if (/^\d+$/.test(p)) return "Mix letters in with the numbers.";
  await save({ ...(await doorConfig()), phraseHash: await hashPassword(p), updatedBy: by, updatedAt: new Date().toISOString() });
  return null;
}

/** Makes a new secret for the rotating code. Everyone must add it to their phone again. */
export async function makeSecret(by: string) {
  await save({ ...(await doorConfig()), secret: await seal(newSecret()), lastStep: undefined, updatedBy: by, updatedAt: new Date().toISOString() });
}

/** Switching the code on needs a code that works right now, so nobody can lock the team out by mistake. */
export async function setCodeRequired(by: string, on: boolean, typed?: string): Promise<string | null> {
  const cfg = await doorConfig();
  if (on) {
    if (!cfg.secret) return "Make the code first.";
    const step = matchStep(await unseal<string>(cfg.secret), typed ?? "", cfg.lastStep ?? -1);
    if (step === null) return "That code is not right. Add the code to your phone, then type the six digits it shows now.";
    await save({ ...cfg, requireCode: true, lastStep: step, updatedBy: by, updatedAt: new Date().toISOString() });
    return null;
  }
  await save({ ...cfg, requireCode: false, updatedBy: by, updatedAt: new Date().toISOString() });
  return null;
}

/** What a phone's authenticator app reads from the QR code. */
export async function codeSetupUrl(account: string): Promise<string | null> {
  const cfg = await doorConfig();
  return cfg.secret ? otpauthUrl(await unseal<string>(cfg.secret), account) : null;
}
