"use client";

import { Command } from "cmdk";
import { CornerDownLeft } from "lucide-react";
import { Icon } from "../icons";
import type { FindItem } from "./Shell";

function groupBy(items: FindItem[]): [string, FindItem[]][] {
  const m = new Map<string, FindItem[]>();
  for (const i of items) m.set(i.group, [...(m.get(i.group) ?? []), i]);
  return [...m.entries()];
}

/** The search bar (Ctrl K): quick actions, every screen the person may open, and the people and applications they may already see. */
export function CommandPalette({ open, onOpenChange, screens, find, hint, go }: { open: boolean; onOpenChange: (v: boolean) => void; screens: FindItem[]; find: FindItem[]; hint: string; go: (href: string) => void }) {
  const quick = find.filter((f) => f.group === "Do");
  const records = find.filter((f) => f.group !== "Do");
  return (
    <Command.Dialog open={open} onOpenChange={onOpenChange} label={hint} overlayClassName="fixed inset-0 z-[99] bg-ink/45" className="fixed left-1/2 top-[10vh] z-[100] w-[min(38rem,calc(100vw-1.5rem))] -translate-x-1/2 border border-ink/30 bg-paper shadow-md">
      <Command.Input placeholder={hint} className="w-full border-b border-rule bg-paper px-4 py-4 text-base outline-none placeholder:text-muted" />
      <Command.List className="max-h-[56vh] overflow-y-auto p-2 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:text-[0.8rem] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted">
        <Command.Empty className="px-3 py-8 text-center text-muted">Nothing matches that.</Command.Empty>
        {[["Do", quick], ["Screens", screens], ...groupBy(records)].map(([heading, items]) => (items as FindItem[]).length === 0 ? null : (
          <Command.Group key={heading as string} heading={heading === "Do" ? "Do something" : (heading as string)}>
            {(items as FindItem[]).map((a) => (
              <Command.Item key={`${a.group}${a.href}${a.label}`} value={`${a.label} ${a.hint ?? ""} ${a.group}`} onSelect={() => { onOpenChange(false); go(a.href); }} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-sm px-3 data-[selected=true]:bg-purple-tint">
                <Icon name={a.icon} className="size-4 shrink-0 text-purple" />
                <span className="min-w-0 flex-1 truncate">{a.label}</span>
                {a.hint && <span className="shrink-0 text-[0.82rem] text-muted">{a.hint}</span>}
              </Command.Item>
            ))}
          </Command.Group>
        ))}
      </Command.List>
      <p className="flex items-center gap-4 border-t border-rule px-4 py-2 text-[0.8rem] text-muted"><span>Up and down to choose</span><span className="inline-flex items-center gap-1"><CornerDownLeft className="size-3.5" aria-hidden /> to open</span><span>Esc to close</span></p>
    </Command.Dialog>
  );
}
