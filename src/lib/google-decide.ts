import type { AccessRequest, StoredUser } from "./types";
import type { GoogleIdentity } from "./google-verify";

/**
 * What happens when someone has proved who they are with Google. Pure, so it can be tested without a database.
 *  - an approved, active person signs in (the first time, Google is linked to them by its own id, so a recycled email
 *    address cannot take over the account later);
 *  - someone switched off gets nothing;
 *  - everyone else becomes (or stays) a request that an administrator must approve.
 */
export type Decision =
  | { kind: "signin"; user: StoredUser; firstTime: boolean }
  | { kind: "off" }
  | { kind: "mismatch" }
  | { kind: "request"; existing?: AccessRequest };

export function decide(who: GoogleIdentity, users: StoredUser[], requests: AccessRequest[]): Decision {
  const user = users.find((u) => u.email.toLowerCase() === who.email);
  if (user) {
    if (!user.active) return { kind: "off" };
    if (user.googleSub && user.googleSub !== who.sub) return { kind: "mismatch" };
    return { kind: "signin", user, firstTime: !user.googleSub };
  }
  return { kind: "request", existing: requests.find((r) => r.email === who.email) };
}
