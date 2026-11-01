"use client";

import { useEffect, useState } from "react";
import { gatheringWindow, splitDuration } from "@/lib/time";

/** Re-reads the clock once a minute. Empty until the page is live, so server and browser never disagree. */
function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

function words(ms: number) {
  const { days, hours, minutes } = splitDuration(ms);
  if (days >= 1) return `${plural(days, "day")}${hours ? `, ${plural(hours, "hour")}` : ""}`;
  if (hours >= 1) return `${plural(hours, "hour")}${minutes ? `, ${plural(minutes, "minute")}` : ""}`;
  return plural(Math.max(1, minutes), "minute");
}

/** “in 20 days, 13 hours” for a one-off event. */
export function Until({ to, className }: { to: string; className?: string }) {
  const now = useNow();
  if (now === null) return <span className={className}>&nbsp;</span>;
  const target = new Date(to).getTime();
  return <span className={className}>{target <= now ? "Under way now" : `Starts in ${words(target - now)}`}</span>;
}

/** The weekly fellowship: counts down in plain words, or says it is happening now. */
export function GatheringStatus({ day, start, end, className }: { day: string; start: string; end: string; className?: string }) {
  const now = useNow();
  if (now === null) return <span className={className}>&nbsp;</span>;
  const w = gatheringWindow(day, start, end, now);
  if (now >= w.start && now < w.end) return <span className={className}>We are gathering right now.</span>;
  return <span className={className}>In {words(w.start - now)}</span>;
}
