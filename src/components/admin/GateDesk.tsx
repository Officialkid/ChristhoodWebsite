"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Maximize2, Minimize2, Phone, Search, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { addWalkIn, checkIn, revealContact, signOut, undoArrival } from "@/app/123admin/actions-gate";
import { TextField, useSave } from "./forms";
import type { Result } from "./forms";
import { RecordSheet } from "./kit/RecordSheet";
import { btnClass, Chip } from "./ui";

export type GateRow = {
  key: string;
  name: string;
  age?: number;
  guardian?: string;
  source: "application" | "returning" | "walk-in";
  /** An approved application or a child added at the gate. A returning camper is not expected. */
  expected: boolean;
  /** The year a returning camper last came. */
  year?: number;
  photos?: "Yes" | "No";
  /** Who looks after them, when the head facilitators have given the child to someone. */
  lookedAfter?: string;
  /** Last digits of the phone, for head facilitators and the camp office only. The number itself is never sent until they ask. */
  phoneEnd?: string;
  state?: { status: "in" | "out"; droppedBy: string; authorized: string[]; medication?: boolean; arrived: string; arrivedBy: string; collectedBy?: string; left?: string; leftBy?: string; via?: "dropper" | "named" | "exception"; exception?: string; backfilled?: boolean };
};

const views = [
  ["all", "Everyone"],
  ["waiting", "Not arrived"],
  ["here", "At camp"],
  ["gone", "Collected"],
  ["past", "Previous campers"],
] as const;
type View = (typeof views)[number][0];

const sourceLabel = { application: "Approved application", returning: "Came to this camp before", "walk-in": "Walk-in" } as const;

type Mode = { kind: "in" | "out" | "undo"; key: string } | { kind: "walkin" } | null;

/** Runs one action, shows its answer, and refreshes the list so every desk sees the same children. */
function useRun(eventId: string, date: string) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (action: (fd: FormData) => Promise<Result>, fields: Record<string, string>, done?: (r: Result) => void) =>
    start(async () => {
      const fd = new FormData();
      fd.set("eventId", eventId);
      fd.set("date", date);
      for (const [k, v] of Object.entries(fields)) fd.set(k, v);
      const r = await action(fd);
      (r.ok ? toast.success : toast.error)(r.message ?? (r.ok ? "Saved." : "Could not save that."));
      if (r.ok) done?.(r);
      router.refresh();
    });
  return { run, pending, router };
}

const Big = ({ n, label, tone }: { n: number; label: string; tone?: boolean }) => (
  <div className="min-w-0 border-l border-rule pl-4 first:border-l-0 first:pl-0">
    <p className={`font-display text-[2.4rem] font-extrabold leading-none tabular-nums sm:text-[3rem] ${tone ? "text-purple" : ""}`}>{n}</p>
    <p className="mt-1 text-[0.95rem] font-semibold text-muted">{label}</p>
  </div>
);

/** The gate desk: a touch-first list. Receiving and handing back open in a side panel, so the list never jumps. */
export function GateDesk({ eventId, date, rows, canSeePhones, keeper }: { eventId: string; date: string; rows: GateRow[]; canSeePhones: boolean; keeper: boolean }) {
  const [q, setQ] = useState("");
  const [view, setView] = useState<View>("all");
  const [mode, setMode] = useState<Mode>(null);
  const [focus, setFocus] = useState(false);
  const { run, pending, router } = useRun(eventId, date);
  const [phones, setPhones] = useState<Record<string, string>>({});
  const hide = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const expected = rows.filter((r) => r.expected);
  const stat = {
    expected: expected.length,
    waiting: expected.filter((r) => !r.state).length,
    here: rows.filter((r) => r.state?.status === "in").length,
    gone: rows.filter((r) => r.state?.status === "out").length,
  };
  const past = rows.filter((r) => !r.expected);
  const unregistered = past.filter((r) => r.state).length;
  const count: Record<View, number> = { all: expected.length + unregistered, waiting: stat.waiting, here: stat.here, gone: stat.gone, past: past.length };
  const needle = q.trim().toLowerCase();

  const list = useMemo(
    () =>
      rows.filter((r) => {
        const hit = !needle || r.name.toLowerCase().includes(needle) || (r.guardian ?? "").toLowerCase().includes(needle);
        // Children who only came in an earlier year appear when someone searches or opens their own tab, never in the plain list.
        const fit = view === "past" ? !r.expected : view === "all" ? r.expected || Boolean(r.state) || Boolean(needle) : view === "waiting" ? r.expected && !r.state : view === "here" ? r.state?.status === "in" : r.state?.status === "out";
        return hit && fit;
      }),
    [rows, needle, view],
  );

  // Full screen: hides the menu and top bar; the browser's own full screen is used where it exists.
  useEffect(() => {
    const root = document.documentElement;
    if (focus) root.dataset.gateFocus = "1";
    else delete root.dataset.gateFocus;
    return () => {
      delete root.dataset.gateFocus;
    };
  }, [focus]);
  useEffect(() => {
    const out = () => !document.fullscreenElement && setFocus(false);
    document.addEventListener("fullscreenchange", out);
    return () => document.removeEventListener("fullscreenchange", out);
  }, []);
  const goFocus = (on: boolean) => {
    setFocus(on);
    if (on) document.documentElement.requestFullscreen?.().catch(() => undefined);
    else if (document.fullscreenElement) document.exitFullscreen?.().catch(() => undefined);
  };

  // Other desks change the same list, so look again every 15 seconds while nobody is in the middle of a form.
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible" && !mode) router.refresh();
    }, 15_000);
    return () => clearInterval(t);
  }, [mode, router]);

  const reveal = (key: string) =>
    run(revealContact, { key }, (r) => {
      if (!r.secret) return;
      setPhones((p) => ({ ...p, [key]: r.secret! }));
      clearTimeout(hide.current[key]);
      hide.current[key] = setTimeout(() => setPhones((p) => Object.fromEntries(Object.entries(p).filter(([k]) => k !== key))), 30_000);
    });

  const current = mode && mode.kind !== "walkin" ? rows.find((r) => r.key === mode.key) : undefined;
  const close = () => setMode(null);

  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4" role="group" aria-label="Today's numbers" aria-live="polite">
        <Big n={stat.expected} label="Expected" />
        <Big n={stat.waiting} label="Not arrived" />
        <Big n={stat.here} label="At camp" tone />
        <Big n={stat.gone} label="Collected" />
      </div>
      {unregistered > 0 && <p className="text-[0.95rem] text-muted">{unregistered} {unregistered === 1 ? "child" : "children"} at camp or collected {unregistered === 1 ? "is" : "are"} not on the expected list: previous campers a parent confirmed at the gate.</p>}

      <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
        <label className="block min-w-[min(100%,16rem)] flex-1 sm:max-w-md">
          <span className="f-label">Find a child or a parent</span>
          <span className="relative mt-1 block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted" aria-hidden />
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Start typing a name" autoComplete="off" className="f-input !mt-0 !min-h-14 !pl-11 !text-[1.05rem]" />
          </span>
        </label>
        <button type="button" onClick={() => setMode({ kind: "walkin" })} className={`${btnClass.purple} !min-h-14 !px-6`}><UserPlus className="size-5" aria-hidden /> Register walk-in</button>
        <button type="button" onClick={() => goFocus(!focus)} aria-pressed={focus} className={`${btnClass.secondary} !min-h-14`}>{focus ? <Minimize2 className="size-4" aria-hidden /> : <Maximize2 className="size-4" aria-hidden />} {focus ? "Show the menu" : "Full screen"}</button>
      </div>

      <nav aria-label="Show" className="a-tabs">
        {views.map(([v, l]) => (
          <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)} className="a-tab !min-h-12">{l} <span className="n">{count[v]}</span></button>
        ))}
      </nav>

      {view === "past" && <p className="max-w-[62ch] text-[0.95rem] text-muted">These children came to this camp in an earlier year. They are not registered for it. Their details may be out of date, so a parent has to confirm at the gate.</p>}

      {list.length === 0 ? (
        <p className="max-w-[62ch] text-muted">{needle ? "Nobody matches that. Try the Previous campers tab, or register the child as a walk-in." : view === "waiting" ? "Everyone expected has arrived." : view === "past" ? "No previous campers for this camp." : "Nobody here."}</p>
      ) : (
        <ul className="border-t border-rule">
          {list.map((r) => {
            const s = r.state;
            return (
              <li key={r.key} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-rule py-4">
                <div className="min-w-0 flex-1 basis-64">
                  <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[1.1rem] font-bold leading-snug">
                    <span>{r.name}{r.age ? <span className="font-normal text-muted"> · age {r.age}</span> : null}</span>
                    {r.photos === "No" && <Chip tone="warn">No photos</Chip>}
                    {s?.medication && <Chip tone="warn">Medicine handed in</Chip>}
                  </p>
                  <p className="mt-0.5 text-[0.95rem] text-muted">
                    {[sourceLabel[r.source] + (r.source === "returning" && r.year ? ` (${r.year}), not registered` : ""), r.guardian && `Parent: ${r.guardian}`, r.lookedAfter && `With ${r.lookedAfter}`].filter(Boolean).join(" · ")}
                  </p>
                  {s && (
                    <p className="mt-1 text-[0.95rem]">
                      {s.status === "out" ? <>Collected at {s.left} by {s.collectedBy}{s.via === "exception" ? " (exception)" : ""}. </> : <>At camp since {s.arrived}{s.backfilled ? " (entered later)" : ""}, brought by {s.droppedBy}. </>}
                    </p>
                  )}
                  {canSeePhones && r.phoneEnd && (
                    phones[r.key] ? (
                      <a href={`tel:${phones[r.key]}`} className="mt-1 inline-flex min-h-11 items-center gap-2 font-semibold text-purple underline underline-offset-4"><Phone className="size-4" aria-hidden /> <span><span className="sr-only">Call </span>{phones[r.key]}</span></a>
                    ) : (
                      <button type="button" disabled={pending} onClick={() => reveal(r.key)} className="mt-1 inline-flex min-h-11 items-center gap-2 font-semibold text-purple underline underline-offset-4"><Phone className="size-4" aria-hidden /> Phone ending {r.phoneEnd}: show<span className="sr-only"> for {r.name}</span></button>
                    )
                  )}
                </div>
                <span className="flex flex-wrap items-center gap-2">
                  <span className="mr-1 min-w-24 text-right">{!s ? <Chip>{r.expected ? "Not arrived" : "Not registered"}</Chip> : s.status === "in" ? <Chip tone="ok">At camp</Chip> : <Chip tone="new">Collected</Chip>}</span>
                  {!s && <button type="button" className={`${btnClass.purple} !min-h-12 !px-6`} onClick={() => setMode({ kind: "in", key: r.key })}>Check in<span className="sr-only"> {r.name}</span></button>}
                  {s?.status === "in" && <button type="button" className={`${btnClass.secondary} !min-h-12 !px-6`} onClick={() => setMode({ kind: "out", key: r.key })}>Sign out<span className="sr-only"> {r.name}</span></button>}
                  {s && <button type="button" className={`${btnClass.ghost} !min-h-12`} onClick={() => setMode({ kind: "undo", key: r.key })}>Correct<span className="sr-only"> a mistake for {r.name}</span></button>}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {mode?.kind === "in" && current && <CheckInSheet key={current.key} row={current} pending={pending} onClose={close} onSubmit={(f) => run(checkIn, f, close)} />}
      {mode?.kind === "out" && current?.state && <SignOutSheet key={current.key} row={current} keeper={keeper} pending={pending} onClose={close} onSubmit={(f) => run(signOut, f, close)} />}
      {mode?.kind === "undo" && current?.state && <UndoSheet key={current.key} row={current} pending={pending} onClose={close} onSubmit={() => run(undoArrival, { key: current.key }, close)} />}
      {mode?.kind === "walkin" && <WalkInSheet eventId={eventId} onClose={close} />}
    </div>
  );
}

const photoNote = (p?: "Yes" | "No") => (p === "No" ? <Chip tone="warn">No photos</Chip> : p === "Yes" ? <Chip tone="ok">Photos allowed</Chip> : <Chip>Ask the parent about photos</Chip>);

function Submit({ form, pending, children, disabled }: { form: string; pending: boolean; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button type="submit" form={form} disabled={pending || disabled} className={`${btnClass.purple} !min-h-14 w-full !text-[1.05rem]`}>
      {pending && <Loader2 className="size-5 animate-spin" aria-hidden />} {children}
    </button>
  );
}

function CheckInSheet({ row, pending, onClose, onSubmit }: { row: GateRow; pending: boolean; onClose: () => void; onSubmit: (f: Record<string, string>) => void }) {
  const returning = row.source === "returning";
  return (
    <RecordSheet
      open
      onClose={onClose}
      title={`Check in ${row.name}`}
      description={sourceLabel[row.source]}
      footer={<Submit form="gate-in" pending={pending}>Check in</Submit>}
    >
      <form
        id="gate-in"
        className="grid gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          onSubmit({ key: row.key, droppedBy: String(f.get("droppedBy") ?? ""), mayCollect: String(f.get("mayCollect") ?? ""), medication: f.get("medication") === "yes" ? "yes" : "", confirmed: f.get("confirmed") === "yes" ? "yes" : "" });
        }}
      >
        <div className="flex flex-wrap items-center gap-2">
          {row.age ? <span className="font-semibold">Age {row.age}</span> : null}
          {photoNote(row.photos)}
        </div>
        {returning && (
          <div role="note" className="border-l-4 border-gold bg-paper-2 px-4 py-3">
            <p className="font-bold">Not registered for this camp</p>
            <p className="mt-1 text-[0.95rem]">{row.name} came in {row.year}. Their details may be out of date. The parent must say they are joining before you check them in.</p>
            <label className="f-choice mt-3"><input type="checkbox" name="confirmed" value="yes" required /><span className="font-semibold leading-snug">The parent confirmed {row.name.split(" ")[0]} is joining this camp</span></label>
          </div>
        )}
        <div>
          <label htmlFor="by" className="f-label">Who is dropping {row.name.split(" ")[0]} off?</label>
          <p id="by-h" className="f-hint">{row.guardian ? `On file: ${row.guardian}. Change it if someone else brought them.` : "Write the name of the person at the gate."}</p>
          <input id="by" name="droppedBy" required minLength={2} maxLength={80} defaultValue={row.guardian ?? ""} autoComplete="off" aria-describedby="by-h" className="f-input" />
        </div>
        <div>
          <label htmlFor="may" className="f-label">Who may collect them <span className="font-normal text-muted">(optional)</span></label>
          <p id="may-h" className="f-hint">One name per line. The person who brought them can always collect. Anyone else is checked by a head facilitator.</p>
          <textarea id="may" name="mayCollect" maxLength={160} rows={3} aria-describedby="may-h" className="f-input" />
        </div>
        <label className="f-choice"><input type="checkbox" name="medication" value="yes" /><span className="font-semibold leading-snug">Medicine was handed in</span></label>
      </form>
    </RecordSheet>
  );
}

function SignOutSheet({ row, keeper, pending, onClose, onSubmit }: { row: GateRow; keeper: boolean; pending: boolean; onClose: () => void; onSubmit: (f: Record<string, string>) => void }) {
  const s = row.state!;
  const first = row.name.split(" ")[0];
  const [who, setWho] = useState<string>("dropper");
  const exception = who === "exception";
  const blocked = exception && !keeper;
  return (
    <RecordSheet
      open
      onClose={onClose}
      title={`Sign out ${row.name}`}
      description={`At camp since ${s.arrived}. Brought by ${s.droppedBy}.`}
      footer={<Submit form="gate-out" pending={pending} disabled={blocked}>Confirm sign out</Submit>}
    >
      <form
        id="gate-out"
        className="grid gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          onSubmit({ key: row.key, via: who === "dropper" ? "dropper" : exception ? "exception" : "named", collectedBy: who === "dropper" ? "" : exception ? String(f.get("collectedBy") ?? "") : who, reason: String(f.get("reason") ?? ""), idSeen: f.get("idSeen") === "yes" ? "yes" : "", confirm: f.get("confirm") === "yes" ? "yes" : "" });
        }}
      >
        <fieldset className="grid gap-2">
          <legend className="f-label">Who is collecting {first}?</legend>
          <label className="f-choice"><input type="radio" name="who" checked={who === "dropper"} onChange={() => setWho("dropper")} /><span className="leading-snug"><strong>{s.droppedBy}</strong> <span className="text-muted">brought them</span></span></label>
          {s.authorized.map((n) => (
            <label key={n} className="f-choice"><input type="radio" name="who" checked={who === n} onChange={() => setWho(n)} /><span className="leading-snug"><strong>{n}</strong> <span className="text-muted">named by the parent</span></span></label>
          ))}
          <label className="f-choice"><input type="radio" name="who" checked={exception} onChange={() => setWho("exception")} /><span className="font-semibold leading-snug">Someone else (an exception)</span></label>
        </fieldset>

        {exception && (
          <div className="grid gap-4 border-l-4 border-gold bg-paper-2 px-4 py-4">
            {blocked ? (
              <p role="alert" className="font-semibold">A head facilitator has to approve this. Ask one to come to the desk and sign {first} out. Do not let {first} go until they have.</p>
            ) : (
              <>
                <p className="text-[0.95rem]">The parent did not name this person. Check who they are with the parent if you can reach them, and see their identity before you go on. This is recorded with your name.</p>
                <div><label htmlFor="cb" className="f-label">Who is collecting?</label><input id="cb" name="collectedBy" required minLength={2} maxLength={80} autoComplete="off" className="f-input" /></div>
                <div><label htmlFor="rs" className="f-label">Why is this person collecting?</label><input id="rs" name="reason" required minLength={5} maxLength={200} autoComplete="off" className="f-input" /></div>
                <label className="f-choice"><input type="checkbox" name="idSeen" value="yes" required /><span className="font-semibold leading-snug">I have seen their identity</span></label>
              </>
            )}
          </div>
        )}

        <label className="f-choice"><input type="checkbox" name="confirm" value="yes" required /><span className="font-semibold leading-snug">I have checked who is collecting {first}</span></label>
      </form>
    </RecordSheet>
  );
}

function UndoSheet({ row, pending, onClose, onSubmit }: { row: GateRow; pending: boolean; onClose: () => void; onSubmit: () => void }) {
  const s = row.state!;
  const out = s.status === "out";
  return (
    <RecordSheet open onClose={onClose} title={`Correct ${row.name}`} description={out ? "Take back the sign-out" : "Take back the check-in"} footer={<button type="button" disabled={pending} onClick={onSubmit} className={`${btnClass.danger} !min-h-14 w-full`}>{pending && <Loader2 className="size-5 animate-spin" aria-hidden />} {out ? "Put back at camp" : "Remove the check-in"}</button>}>
      <p className="max-w-[48ch]">
        {out ? `${row.name} was signed out at ${s.left} to ${s.collectedBy}. Taking it back puts them at camp again. The record of who collected stays on file.` : `${row.name} was checked in at ${s.arrived} by ${s.arrivedBy}. Use this only for a mistake. After ten minutes only a head facilitator can do it.`}
      </p>
    </RecordSheet>
  );
}

function WalkInSheet({ eventId, onClose }: { eventId: string; onClose: () => void }) {
  const router = useRouter();
  const { run, formRef, errors, pending } = useSave(addWalkIn, () => {
    router.refresh();
    onClose();
  });
  return (
    <RecordSheet open onClose={onClose} title="Register a walk-in" description="A child who is not on the expected list. They stay on the list for the rest of camp." footer={<Submit form="gate-walkin" pending={pending}>Add to the list</Submit>}>
      <form id="gate-walkin" ref={formRef} action={run} className="grid gap-5" noValidate>
        <input type="hidden" name="eventId" value={eventId} />
        <TextField name="name" label="Child's full name" required maxLength={80} autoComplete="off" error={errors.name} />
        <TextField name="age" label="Age" required inputMode="numeric" maxLength={2} autoComplete="off" error={errors.age} />
        <TextField name="guardian" label="Parent or guardian" required maxLength={80} autoComplete="off" error={errors.guardian} />
        <TextField name="phone" label="Phone number" required type="tel" maxLength={20} autoComplete="off" error={errors.phone} hint="A number we can call today." />
        <p className="text-[0.95rem] text-muted">Adding a child does not check them in. Check them in from the list once the parent is at the gate.</p>
      </form>
    </RecordSheet>
  );
}
