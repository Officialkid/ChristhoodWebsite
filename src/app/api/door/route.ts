import { NextResponse } from "next/server";
import { sameOrigin } from "@/lib/auth";
import { codeRequired, doorConfig, knockBlocked, phraseOk } from "@/lib/door";
import { DOOR_COOKIE, KNOCK_COOKIE, signPass } from "@/lib/door-token";

export const runtime = "nodejs";

/** Every refusal looks the same, and says nothing about why. */
const quiet = () => NextResponse.json({ ok: false }, { headers: { "Cache-Control": "no-store" } });

const cookie = (maxAge: number) => ({ httpOnly: true, secure: process.env.NODE_ENV === "production" && Boolean(process.env.VERCEL), sameSite: "lax" as const, path: "/", maxAge });

/** The knock: the phrase typed on a public page. */
export async function POST(req: Request) {
  if (!(await sameOrigin(req))) return quiet();
  let phrase = "";
  try {
    const body = (await req.json()) as { phrase?: unknown };
    phrase = typeof body.phrase === "string" ? body.phrase.slice(0, 64) : "";
  } catch {
    return quiet();
  }
  if (phrase.trim().length < 4 || (await knockBlocked())) return quiet();

  const cfg = await doorConfig();
  if (!(await phraseOk(phrase, cfg))) return quiet();

  const res = NextResponse.json(codeRequired(cfg) ? { ok: true, needCode: true } : { ok: true, next: "/123admin" }, { headers: { "Cache-Control": "no-store" } });
  if (codeRequired(cfg)) {
    const knock = await signPass("knock", 180);
    if (!knock) return quiet();
    res.cookies.set(KNOCK_COOKIE, knock, cookie(180));
  } else {
    const pass = await signPass("door", 1800);
    if (!pass) return quiet();
    res.cookies.set(DOOR_COOKIE, pass, cookie(1800));
  }
  return res;
}
