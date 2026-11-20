"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Phone, Search } from "lucide-react";
import { toast } from "sonner";
import { addWalkIn, checkIn, signOut, undoArrival } from "@/app/123admin/actions-gate";
import { SaveButton, TextField, useSave } from "./forms";
import type { Result } from "./forms";
import { btnClass, Chip } from "./ui";

export type GateRow = {
  key: string;
  name: string;
  age?: number;
  guardian?: string;
  phone?: string;
  source: "application" | "returning" | "walk-in";
  photos?: "Yes" | "No";
  state?: { status: "in" | "out"; droppedBy: string; mayCollect?: string; medication?: boolean; arrived: string; collectedBy?: string; left?: string };
};

const views = [
  ["waiting", "Not here yet"],
  ["here", "At camp"],
  ["gone", "Gone home"],
  ["all", "Everyone"],
] as const;
type View = (typeof views)[number][0];

const sourceNote = { application: "", returning: "Came before", "walk-in": "Added at the gate" } as const;

function useRun(eventId: string, date: string) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (action: (fd: FormData) => Promise<Result>, fields: Record<string, string>, done?: () => void) =>
    start(async () => {
      const fd = new FormData();
      fd.set("eventId", eventId);
      fd.set("date", date);
      for (const [k, v] of Object.entries(fields)) fd.set(k, v);
      const r = await action(fd);
      (r.ok ? toast.success : toast.error)(r.message ?? (r.ok ? "Saved." : "Could not save that."));
      if (r.ok) done?.();
      router.refresh();
    });
  return { run, pending };
}

/** The gate desk list: search by name, receive a child, hand them back. */
export function GateDesk({ eventId, date, rows, showPhones }: { eventId: string; date: string; rows: GateRow[]; showPhones: boolean }) {
  const [q, setQ] = useState("");
  const [view, setView] = useState<View>("waiting");
  const [open, setOpen] = useState<string | null>(null);
  const { run, pending } = useRun(eventId, date);

  const waiting = rows.filter((r) => !r.state).length;
  const here = rows.filter((r) => r.state?.status === "in").length;
  const gone = rows.filter((r) => r.state?.status === "out").length;
  const count = { waiting, here, gone, all: rows.length };
  const needle = q.trim().toLowerCase();
  const list = rows.filter((r) => (view === "all" ? true : view === "waiting" ? !r.state : view === "here" ? r.state?.status === "in" : r.state?.status === "out") && (!needle || r.name.toLowerCase().includes(needle) || (r.guardian ?? "").toLowerCase().includes(needle)));

  return (
    <div className="grid gap-6">
      <p className="text-muted" aria-live="polite"><strong className="font-bold text-ink">{here}</strong> at camp · <strong className="font-bold text-ink">{waiting}</strong> not here yet · <strong className="font-bold text-ink">{gone}</strong> gone home · {rows.length} on the list</p>

      <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
        <label className="block w-full max-w-md">
          <span className="f-label">Find a child or a parent</span>
          <span className="relative mt-1 block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Start typing a name" autoComplete="off" className="f-input !mt-0 !pl-10" />
          </span>
        </label>
        <nav aria-label="Show" className="a-tabs">
          {views.map(([v, l]) => (
            <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)} className="a-tab">{l} <span className="n">{count[v]}</span></button>
          ))}
        </nav>
      </div>

      {list.length === 0 ? (
        <p className="max-w-[62ch] text-muted">{needle ? "Nobody matches that. Look under Everyone, or add the child below." : view === "waiting" ? "Everyone on the list has been received." : "Nobody here."}</p>
      ) : (
        <ul className="border-t border-rule">
          {list.map((r) => {
            const s = r.state;
            const mode = open === r.key ? (s ? "out" : "in") : null;
            const first = r.name.split(" ")[0];
            return (
              <li key={r.key} className="border-b border-rule py-4">
                <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
                  <div className="min-w-0 flex-1 basis-64">
                    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-bold leading-snug">
                      <span>{r.name}{r.age ? <span className="font-normal text-muted"> · age {r.age}</span> : null}</span>
                      {r.photos === "No" && <Chip tone="warn">No photos</Chip>}
                      {!r.photos && <Chip>Ask about photos</Chip>}
                      {s?.medication && <Chip tone="warn">Medicine handed in</Chip>}
                    </p>
                    <p className="mt-0.5 text-[0.92rem] text-muted">{[r.guardian && `Parent: ${r.guardian}`, sourceNote[r.source]].filter(Boolean).join(" · ") || "No parent on file"}</p>
                    {showPhones && r.phone && (
                      <a href={`tel:${r.phone}`} className="mt-1 inline-flex min-h-11 items-center gap-2 font-semibold text-purple underline underline-offset-4">
                        <Phone className="size-4" aria-hidden /> <span><span className="sr-only">Call </span>{r.phone}</span>
                      </a>
                    )}
                    {s && (
                      <p className="mt-1 text-[0.95rem]">
                        {s.status === "out" ? <>Went home at {s.left} with {s.collectedBy}. </> : <>Here since {s.arrived}, brought by {s.droppedBy}. </>}
                        {s.mayCollect && <span className="text-muted">May also collect: {s.mayCollect}.</span>}
                      </p>
                    )}
                  </div>
                  <span className="flex flex-wrap items-center gap-2">
                    {!s && <button type="button" className={btnClass.purple} aria-expanded={mode === "in"} onClick={() => setOpen(mode ? null : r.key)}>Check in<span className="sr-only"> {r.name}</span></button>}
                    {s?.status === "in" && <button type="button" className={btnClass.secondary} aria-expanded={mode === "out"} onClick={() => setOpen(mode ? null : r.key)}>Sign out<span className="sr-only"> {r.name}</span></button>}
                    {s && <button type="button" disabled={pending} className={btnClass.ghost} onClick={() => run(undoArrival, { key: r.key }, () => setOpen(null))}>Undo<span className="sr-only"> for {r.name}</span></button>}
                  </span>
                </div>

                {mode === "in" && (
                  <form
                    className="mt-4 grid max-w-xl gap-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const f = new FormData(e.currentTarget);
                      run(checkIn, { key: r.key, droppedBy: String(f.get("droppedBy") ?? ""), mayCollect: String(f.get("mayCollect") ?? ""), medication: f.get("medication") === "yes" ? "yes" : "" }, () => setOpen(null));
                    }}
                  >
                    <div>
                      <label htmlFor={`by-${r.key}`} className="f-label">Who is bringing {first}?</label>
                      <input id={`by-${r.key}`} name="droppedBy" required minLength={2} maxLength={80} defaultValue={r.guardian ?? ""} autoComplete="off" className="f-input" />
                    </div>
                    <div>
                      <label htmlFor={`may-${r.key}`} className="f-label">Who else may collect them <span className="font-normal text-muted">(optional)</span></label>
                      <input id={`may-${r.key}`} name="mayCollect" maxLength={160} autoComplete="off" className="f-input" />
                    </div>
                    <label className="f-choice"><input type="checkbox" name="medication" value="yes" /><span className="font-semibold leading-snug">Medicine was handed in</span></label>
                    <div className="flex flex-wrap gap-3">
                      <button type="submit" disabled={pending} className={btnClass.primary}>{pending && <Loader2 className="size-4 animate-spin" aria-hidden />} Check in</button>
                      <button type="button" className={btnClass.ghost} onClick={() => setOpen(null)}>Cancel</button>
                    </div>
                  </form>
                )}

                {mode === "out" && (
                  <form
                    className="mt-4 grid max-w-xl gap-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      run(signOut, { key: r.key, collectedBy: String(new FormData(e.currentTarget).get("collectedBy") ?? "") }, () => setOpen(null));
                    }}
                  >
                    <div>
                      <label htmlFor={`col-${r.key}`} className="f-label">Who is collecting {first}?</label>
                      <p id={`col-${r.key}-h`} className="f-hint">{s?.mayCollect ? `The parent allowed: ${s.mayCollect}. Brought by ${s.droppedBy}.` : `Brought by ${s?.droppedBy}. Ask anyone else to show who they are before the child goes.`}</p>
                      <input id={`col-${r.key}`} name="collectedBy" required minLength={2} maxLength={80} autoComplete="off" aria-describedby={`col-${r.key}-h`} className="f-input" />
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button type="submit" disabled={pending} className={btnClass.primary}>{pending && <Loader2 className="size-4 animate-spin" aria-hidden />} Sign out</button>
                      <button type="button" className={btnClass.ghost} onClick={() => setOpen(null)}>Cancel</button>
                    </div>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <WalkIn eventId={eventId} />
    </div>
  );
}

/** A child who is not on the list. */
function WalkIn({ eventId }: { eventId: string }) {
  const router = useRouter();
  const { run, formRef, errors } = useSave(addWalkIn, () => {
    formRef.current?.reset();
    router.refresh();
  });
  return (
    <details className="max-w-xl border-t border-rule pt-5">
      <summary className="inline-flex min-h-11 cursor-pointer items-center font-semibold text-purple underline underline-offset-4">A child who is not on the list</summary>
      <form ref={formRef} action={run} className="mt-4 grid gap-5" noValidate>
        <input type="hidden" name="eventId" value={eventId} />
        <TextField name="name" label="Child's full name" required maxLength={80} autoComplete="off" error={errors.name} />
        <TextField name="age" label="Age" required inputMode="numeric" maxLength={2} autoComplete="off" error={errors.age} />
        <TextField name="guardian" label="Parent or guardian" required maxLength={80} autoComplete="off" error={errors.guardian} />
        <TextField name="phone" label="Phone number" required type="tel" maxLength={20} autoComplete="off" error={errors.phone} hint="A number we can call today." />
        <div><SaveButton>Add to the list</SaveButton></div>
      </form>
    </details>
  );
}
