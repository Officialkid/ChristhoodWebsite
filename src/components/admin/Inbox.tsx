"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageCircle, Phone, Search } from "lucide-react";
import { toast } from "sonner";
import { deleteGuest, deletePrayer, updateGuest, updatePrayer } from "@/app/123admin/actions-care";
import { DeleteButton } from "./forms";
import { btnClass, Chip, Empty } from "./ui";
import { formatStamp } from "@/lib/time";
import type { Prayer, Visitor } from "@/lib/types";

type Item = { id: string; createdAt: string; status: string; title: string; summary: string; body: React.ReactNode; notes?: string; handledBy?: string; phone?: string; searchable: string };

const waLink = (phone: string) => `https://wa.me/${phone.replace(/\D/g, "").replace(/^0/, "254")}`;

function Inbox({ items, statuses, update, remove, canDelete, noun }: { items: Item[]; statuses: { value: string; label: string }[]; update: (fd: FormData) => Promise<{ ok: boolean; message?: string }>; remove: (fd: FormData) => Promise<{ ok: boolean; message?: string }>; canDelete: boolean; noun: string }) {
  const router = useRouter();
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const shown = useMemo(
    () => items.filter((i) => (filter === "all" || i.status === filter) && (!q || i.searchable.includes(q.toLowerCase()))).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [items, filter, q],
  );
  const count = (s: string) => items.filter((i) => i.status === s).length;

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-1">
          {[{ value: "all", label: "All" }, ...statuses].map((s) => (
            <button key={s.value} type="button" aria-pressed={filter === s.value} onClick={() => setFilter(s.value)} className={`min-h-11 px-4 text-[0.95rem] font-semibold ${filter === s.value ? "bg-purple text-on-purple" : "border border-rule hover:border-ink"}`}>
              {s.label} <span className="opacity-75">{s.value === "all" ? items.length : count(s.value)}</span>
            </button>
          ))}
        </div>
        <label className="relative ml-auto flex w-full items-center sm:w-72">
          <span className="sr-only">Search</span>
          <Search className="pointer-events-none absolute left-3 size-4 text-muted" aria-hidden />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="f-input !mt-0 !min-h-11 pl-9" />
        </label>
      </div>

      {shown.length === 0 ? (
        <Empty icon="guest" title={items.length ? "Nothing matches" : `No ${noun} yet`}>{items.length ? "Try a different filter or search." : "They will appear here as soon as someone sends the form."}</Empty>
      ) : (
        <ul className="border-t border-rule">
          {shown.map((i) => {
            const isOpen = open === i.id;
            return (
              <li key={i.id} className="border-b border-rule">
                <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : i.id)} className="flex w-full items-start gap-3 px-1 py-4 text-left hover:bg-paper-2">
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold leading-snug">{i.title}</span>
                    <span className="mt-0.5 block truncate text-[0.92rem] text-muted">{i.summary}</span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1 text-[0.85rem] text-muted">
                    <Chip tone={i.status === "new" ? "new" : i.status === "settled" || i.status === "done" ? "ok" : "warn"}>{statuses.find((s) => s.value === i.status)?.label ?? i.status}</Chip>
                    <time dateTime={i.createdAt}>{formatStamp(i.createdAt)}</time>
                  </span>
                </button>
                {isOpen && (
                  <div className="grid gap-6 px-1 pb-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
                    <div className="grid gap-4">{i.body}</div>
                    <form
                      className="grid content-start gap-4"
                      action={(fd) => start(async () => { const r = await update(fd); (r.ok ? toast.success : toast.error)(r.message ?? ""); if (r.ok) router.refresh(); })}
                    >
                      <input type="hidden" name="id" value={i.id} />
                      {i.phone && (
                        <div className="flex flex-wrap gap-2">
                          <a href={`tel:${i.phone}`} className={btnClass.secondary}><Phone className="size-4" aria-hidden /> Call</a>
                          <a href={waLink(i.phone)} target="_blank" rel="noopener noreferrer" className={btnClass.secondary}><MessageCircle className="size-4" aria-hidden /> WhatsApp</a>
                        </div>
                      )}
                      <div>
                        <label htmlFor={`st-${i.id}`} className="f-label">Status</label>
                        <select id={`st-${i.id}`} name="status" defaultValue={i.status} className="f-input">{statuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select>
                        {i.handledBy && <p className="f-hint">Last handled by {i.handledBy}.</p>}
                      </div>
                      <div>
                        <label htmlFor={`nt-${i.id}`} className="f-label">Notes <span className="font-normal text-muted">(only the team sees these)</span></label>
                        <textarea id={`nt-${i.id}`} name="notes" rows={3} defaultValue={i.notes} className="f-input" maxLength={2000} />
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <button type="submit" disabled={pending} className={btnClass.primary}>{pending && <Loader2 className="size-4 animate-spin" aria-hidden />} Save</button>
                        {canDelete && <span className="ml-auto"><DeleteButton action={async (fd) => { const r = await remove(fd); if (r.ok) { toast.success(r.message ?? ""); router.refresh(); } return r as never; }} fields={{ id: i.id }} /></span>}
                      </div>
                    </form>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

const Fact = ({ label, value }: { label: string; value?: React.ReactNode }) => (value ? <div><dt className="text-[0.85rem] font-semibold text-muted">{label}</dt><dd className="mt-0.5 whitespace-pre-wrap break-words">{value}</dd></div> : null);

export function GuestInbox({ guests, canDelete }: { guests: Visitor[]; canDelete: boolean }) {
  const items: Item[] = guests.map((g) => ({
    id: g.id,
    createdAt: g.createdAt,
    status: g.status,
    notes: g.notes,
    handledBy: g.followedUpBy,
    phone: g.phone,
    title: g.fullName,
    summary: [g.firstVisit, g.area, g.interests[0]].filter(Boolean).join(" · "),
    searchable: [g.fullName, g.phone, g.email, g.area].join(" ").toLowerCase(),
    body: (
      <dl className="grid gap-3 sm:grid-cols-2">
        <Fact label="Phone or WhatsApp" value={g.phone} />
        <Fact label="Email" value={g.email} />
        <Fact label="Lives in" value={g.area} />
        <Fact label="Age group" value={g.ageGroup} />
        <Fact label="Date of visit" value={g.visitDate} />
        <Fact label="First time?" value={g.firstVisit} />
        <Fact label="Heard about us" value={g.heardFrom} />
        <Fact label="Invited by" value={g.invitedBy} />
        <Fact label="Home church" value={g.homeChurch} />
        <Fact label="Would like to" value={g.interests.join(", ")} />
        <div className="sm:col-span-2"><Fact label="Prayer request" value={g.prayerRequest} /></div>
      </dl>
    ),
  }));
  return <Inbox items={items} update={updateGuest} remove={deleteGuest} canDelete={canDelete} noun="new guests" statuses={[{ value: "new", label: "New" }, { value: "contacted", label: "Contacted" }, { value: "settled", label: "Settled in" }]} />;
}

export function PrayerInbox({ prayers }: { prayers: Prayer[] }) {
  const items: Item[] = prayers.map((p) => ({
    id: p.id,
    createdAt: p.createdAt,
    status: p.status,
    notes: p.notes,
    handledBy: p.handledBy,
    phone: p.callBack || p.phone ? p.phone : undefined,
    title: `${p.type === "thanksgiving" ? "Thanksgiving" : "Prayer request"} · ${p.anonymous ? "Anonymous" : p.name || "No name given"}`,
    summary: p.message.slice(0, 120),
    searchable: [p.name, p.message, p.category].join(" ").toLowerCase(),
    body: (
      <dl className="grid gap-3">
        <Fact label={p.type === "thanksgiving" ? "Thanksgiving" : "Prayer request"} value={p.message} />
        <Fact label="About" value={p.category} />
        <Fact label="Who may read it" value={p.whoMaySee} />
        <Fact label="May we share it?" value={p.mayShare} />
        <Fact label="Asked for a call back" value={p.callBack ? "Yes" : undefined} />
        <Fact label="Phone" value={p.phone} />
      </dl>
    ),
  }));
  return <Inbox items={items} update={updatePrayer} remove={deletePrayer} canDelete noun="prayer requests" statuses={[{ value: "new", label: "New" }, { value: "praying", label: "Praying" }, { value: "done", label: "Answered or done" }]} />;
}
