import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";

/**
 * Checks the "Sign in with Google" result. Google signs every sign-in with a private key (RS256) and publishes the matching
 * public keys, which rotate. We check the signature against those keys, that it was made for this site's client id, that it is
 * fresh, that it carries the one-time nonce this site just issued, and that Google verified the email address.
 * The same client id can serve several sites (the church site, the camps and the Institute of Apologetics).
 */
const CERTS = "https://www.googleapis.com/oauth2/v3/certs";
let remote: JWTVerifyGetKey | undefined;

export type GoogleIdentity = { email: string; sub: string; name: string; picture?: string };

export async function verifyGoogleCredential(credential: string, opts: { clientId: string; nonce: string; keys?: JWTVerifyGetKey }): Promise<GoogleIdentity> {
  const keys = opts.keys ?? (remote ??= createRemoteJWKSet(new URL(CERTS)));
  const { payload } = await jwtVerify(credential, keys, {
    algorithms: ["RS256"],
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    audience: opts.clientId,
    clockTolerance: 10,
  });
  if (!opts.nonce || payload.nonce !== opts.nonce) throw new Error("This sign-in was not started here.");
  if (payload.email_verified !== true) throw new Error("Google has not verified that email address.");
  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  if (!email || !payload.sub) throw new Error("Google did not say who this is.");
  const name = typeof payload.name === "string" && payload.name.trim() ? payload.name.trim().slice(0, 80) : email.split("@")[0];
  return { email, sub: payload.sub, name, picture: typeof payload.picture === "string" ? payload.picture : undefined };
}
