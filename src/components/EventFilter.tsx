"use client";

import { useState } from "react";

/** Tabs that show or hide the event rows already on the page (rows carry data-cat). */
export default function EventFilter({ options, targetId }: { options: { value: string; label: string; count: number }[]; targetId: string }) {
  const [active, setActive] = useState("all");
  const choose = (value: string) => {
    setActive(value);
    document.querySelectorAll<HTMLElement>(`#${targetId} [data-cat]`).forEach((el) => {
      el.hidden = value !== "all" && el.dataset.cat !== value;
    });
  };
  return (
    <div role="group" aria-label="Filter events" className="flex flex-wrap gap-x-7 gap-y-1 border-b border-rule">
      {[{ value: "all", label: "All events", count: options.reduce((n, o) => n + o.count, 0) }, ...options].map((o) => (
        <button key={o.value} type="button" aria-pressed={active === o.value} onClick={() => choose(o.value)} className={`-mb-px inline-flex min-h-12 items-center gap-2 border-b-2 text-[0.95rem] font-semibold transition-colors ${active === o.value ? "border-purple text-purple" : "border-transparent text-muted hover:text-ink"}`}>
          {o.label} <span className="text-[0.85rem] font-medium">{o.count}</span>
        </button>
      ))}
    </div>
  );
}
