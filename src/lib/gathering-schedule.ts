type FellowshipHours = { start: string; end: string };

const FINAL_GATHERING_DATE = "2026-11-14";

export function finalGatheringStartAt(fellowship: FellowshipHours): string {
  return `${FINAL_GATHERING_DATE}T${fellowship.start}:00+03:00`;
}

export function finalGatheringEndAt(fellowship: FellowshipHours): number {
  return Date.parse(`${FINAL_GATHERING_DATE}T${fellowship.end}:00+03:00`);
}

/** The ministry has confirmed 14 November as its final 2026 gathering; January's exact date is not set yet. */
export function finalGatheringIsUpcoming(fellowship: FellowshipHours, now = Date.now()): boolean {
  return now < finalGatheringEndAt(fellowship);
}
