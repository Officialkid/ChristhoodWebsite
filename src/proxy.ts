import { NextResponse, type NextRequest } from "next/server";
import { DOOR_COOKIE, SESSION_COOKIE, hasPass, hasSession, noSecretOnThisComputer } from "@/lib/door-token";

/**
 * The team area has no public door. Without a signed-in session or a pass from the team door, every address under
 * /123admin (and the team's download and upload routes) answers exactly like a page that does not exist.
 * Setting DOOR_OFF=1 in the hosting settings switches this guard off, in case the door itself ever locks the team out.
 */
export async function proxy(req: NextRequest) {
  if (process.env.DOOR_OFF === "1" || noSecretOnThisComputer()) return NextResponse.next();
  const ok = (await hasSession(req.cookies.get(SESSION_COOKIE)?.value)) || (await hasPass(req.cookies.get(DOOR_COOKIE)?.value, "door"));
  if (ok) return NextResponse.next();
  // Rewrite to an address that does not exist, so the visitor gets the site's ordinary "page not found".
  return NextResponse.rewrite(new URL("/page-that-is-not-here", req.url), { status: 404 });
}

export const config = { matcher: ["/123admin", "/123admin/:path*", "/api/admin/:path*"] };
