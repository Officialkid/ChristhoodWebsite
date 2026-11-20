"use client";

import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";

/** One record opened beside its list: the list keeps its place, Esc or the close button returns to it. */
export function RecordSheet({ open, onClose, title, description, children, footer }: { open: boolean; onClose: () => void; title: string; description?: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" closeLabel="Close the details" className="w-[min(36rem,100vw)] border-l border-ink/25 bg-paper text-ink">
        <div className="border-b border-rule px-5 pb-4 pt-5 pr-16">
          <SheetTitle className="break-words font-display text-[1.3rem] font-extrabold leading-tight">{title}</SheetTitle>
          <SheetDescription className="mt-1 text-[0.92rem] text-muted">{description ?? "Details"}</SheetDescription>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="border-t border-rule bg-paper px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">{footer}</div>}
      </SheetContent>
    </Sheet>
  );
}

/** A label and its value, for the facts at the top of a record. Shows nothing when there is no value. */
export function Facts({ items }: { items: { label: string; value?: React.ReactNode }[] }) {
  const shown = items.filter((i) => i.value !== undefined && i.value !== null && i.value !== "" && i.value !== false);
  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
      {shown.map((i) => (
        <div key={i.label} className="min-w-0">
          <dt className="text-[0.82rem] font-semibold text-muted">{i.label}</dt>
          <dd className="mt-0.5 break-words">{i.value}</dd>
        </div>
      ))}
    </dl>
  );
}
