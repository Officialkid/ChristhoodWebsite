import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sameOrigin } from "@/lib/auth";
import { codeBlocked, codeOk } from "@/lib/door";
import { DOOR_COOKIE, KNOCK_COOKIE, hasPass, signPass } from "@/lib/door-token";

export const runtime = "nodejs";

const quiet = () => NextResponse.json({ ok: false }, { headers: { "Cache-Control": "no-store" } });

/** The second step: the rotating code, allowed only just after a correct phrase. */
export async function POST(req: Request) {
  if (!(await sameOrigin(req))) return quiet();
  if (!(await hasPass((await cookies()).get(KNOCK_COOKIE)?.value, "knock"))) return quiet();
  let code = "";
  try {
    const body = (await req.json()) as { code?: unknown };
    code = typeof body.code === "string" ? body.code.slice(0, 12) : "";
  } catch {
    return quiet();
  }
  if (await codeBlocked()) return quiet();
  if (!(await codeOk(code))) return quiet();

  const pass = await signPass("door", 1800);
  if (!pass) return quiet();
  const res = NextResponse.json({ ok: true, next: "/123admin" }, { headers: { "Cache-Control": "no-store" } });
  const secure = process.env.NODE_ENV === "production" && Boolean(process.env.VERCEL);
  res.cookies.set(DOOR_COOKIE, pass, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 1800 });
  res.cookies.set(KNOCK_COOKIE, "", { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 0 });
  return res;
}
