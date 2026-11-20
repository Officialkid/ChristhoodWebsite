"use client";

import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { btnClass } from "../ui";

/** One row of filters above a table. Everything inside is a real control with a visible label. */
export function FilterBar({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div role="search" className={cn("flex flex-wrap items-end gap-x-3 gap-y-2", className)}>{children}</div>;
}

export function SearchField({ value, onChange, label = "Search", placeholder }: { value: string; onChange: (v: string) => void; label?: string; placeholder?: string }) {
  return (
    <label className="relative block min-w-0 grow basis-56 sm:max-w-80">
      <span className="sr-only">{label}</span>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
      <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder ?? label} autoComplete="off" className="f-input !mt-0 !min-h-10 pl-9 pointer-coarse:!min-h-11" />
    </label>
  );
}

export function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[0.8rem] font-semibold text-muted">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="f-input !mt-0 !min-h-10 !w-auto min-w-32 pointer-coarse:!min-h-11">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

/** Tabs that filter in place and say how many each holds. Buttons, so they work without leaving the page. */
export function FilterTabs<T extends string>({ label, value, onChange, items }: { label: string; value: T; onChange: (v: T) => void; items: { value: T; label: string; count: number }[] }) {
  return (
    <div role="group" aria-label={label} className="a-tabs">
      {items.map((i) => (
        <button key={i.value} type="button" aria-pressed={value === i.value} onClick={() => onChange(i.value)} className="a-tab">
          {i.label}
          <span className="n">{i.count}</span>
        </button>
      ))}
    </div>
  );
}

export function ClearFilters({ show, onClear }: { show: boolean; onClear: () => void }) {
  if (!show) return null;
  return <button type="button" onClick={onClear} className={cn(btnClass.ghost, "min-h-10")}><X className="size-4" aria-hidden /> Clear filters</button>;
}
