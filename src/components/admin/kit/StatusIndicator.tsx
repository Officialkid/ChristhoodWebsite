import { Status } from "../ui";

export type StatusTone = "plain" | "new" | "ok" | "warn" | "bad";

/** A state in a word with a small mark. Colour never carries the meaning alone: the word always does. */
export function StatusIndicator({ tone = "plain", children }: { tone?: StatusTone; children: React.ReactNode }) {
  return <Status tone={tone}>{children}</Status>;
}
