import "server-only";
import { collection } from "./store";
import type { AccessRequest } from "./types";

/** People who signed in with Google but are not on the team yet. An administrator approves or declines each one. */
export const accessRequests = collection<AccessRequest>("access-requests");

export async function pendingRequestCount(): Promise<number> {
  try {
    return (await accessRequests.list()).filter((r) => r.status === "pending").length;
  } catch {
    return 0;
  }
}
