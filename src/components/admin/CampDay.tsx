"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Shuffle } from "lucide-react";
import { toast } from "sonner";
import { addNote, assignCamper, deleteNote, deleteSession, markAttendance, saveSession, shareOutCampers } from "@/app/123admin/actions-day";
import { DeleteButton, SaveButton, SelectField, TextArea, TextField, Toggle, useSave } from "./forms";
import type { Result } from "./forms";
import { btnClass } from "./ui";
import type { CampSession } from "@/lib/types";

const seg = "inline-flex min-h-11 min-w-[4.5rem] items-center justify-center px-4 text-[0.95rem] font-semibold";

/** Here / Away for one camper on one day. Pressing the mark that is already on takes it off again. */
export function AttendanceToggle({ id, date, name, status }: { id: string; date: string; name: string; status?: "present" | "absent" }) {
  const router = useRouter();
  const [mark, setMark] = useOptimistic(status);
  const [pending, start] = useTransition();
  const press = (next: "present" | "absent") =>
    start(async () => {
      const to = mark === next ? "clear" : next;
      setMark(to === "clear" ? undefined : to);
      const fd = new FormData();
      fd.set("id", id);
      fd.set("date", date);
      fd.set("status", to);
      const r = await markAttendance(fd);
      if (!r.ok) toast.error(r.message ?? "Could not save that.");
      router.refresh();
    });
  return (
    <span role="group" aria-label={`Attendance for ${name}`} className="inline-flex" aria-busy={pending}>
      <button type="button" aria-pressed={mark === "present"} aria-label={`${name}: here`} onClick={() => press("present")} className={`${seg} border border-r-0 ${mark === "present" ? "border-purple bg-purple text-on-purple" : "border-ink/35 hover:border-ink"}`}>Here</button>
      <button type="button" aria-pressed={mark === "absent"} aria-label={`${name}: away`} onClick={() => press("absent")} className={`${seg} border ${mark === "absent" ? "border-ink bg-ink text-paper" : "border-ink/35 hover:border-ink"}`}>Away</button>
    </span>
  );
}

/** Chooses which facilitator looks after a camper. */
export function AssignSelect({ id, name, current, options }: { id: string; name: string; current: string; options: { value: string; label: string }[] }) {
  const router = useRouter();
  const [value, setValue] = useOptimistic(current);
  const [pending, start] = useTransition();
  return (
    <label className="flex items-center gap-2">
      <span className="sr-only">Facilitator for {name}</span>
      <select
        value={value}
        disabled={pending}
        onChange={(e) =>
          start(async () => {
            setValue(e.target.value);
            const fd = new FormData();
            fd.set("id", id);
            fd.set("userId", e.target.value);
            const r = await assignCamper(fd);
            if (!r.ok) toast.error(r.message ?? "Could not save that.");
            router.refresh();
          })
        }
        className="f-input !mt-0 !min-h-11 w-full sm:w-64"
      >
        <option value="">Not given to anyone yet</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {pending && <Loader2 className="size-4 animate-spin text-muted" aria-hidden />}
    </label>
  );
}

export function ShareOutButton({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className={btnClass.secondary}
      onClick={() =>
        start(async () => {
          const fd = new FormData();
          fd.set("eventId", eventId);
          const r = await shareOutCampers(fd);
          (r.ok ? toast.success : toast.error)(r.message ?? "");
          router.refresh();
        })
      }
    >
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Shuffle className="size-4" aria-hidden />} Share the rest out evenly
    </button>
  );
}

/** Adds a line to the timetable, or changes the one being edited. */
export function SessionForm({ eventId, days, session, back }: { eventId: string; days: { value: string; label: string }[]; session?: CampSession; back: string }) {
  const router = useRouter();
  const { run, formRef, errors } = useSave(saveSession, () => {
    formRef.current?.reset();
    router.replace(back);
    router.refresh();
  });
  return (
    <form ref={formRef} action={run} className="grid max-w-2xl gap-6" noValidate>
      <input type="hidden" name="eventId" value={eventId} />
      {session && <input type="hidden" name="id" value={session.id} />}
      <SelectField name="date" label="Day" options={days} defaultValue={session?.date ?? days[0]?.value} error={errors.date} />
      <div className="grid gap-6 sm:grid-cols-2">
        <TextField name="start" label="Starts" type="time" required defaultValue={session?.start} error={errors.start} />
        <TextField name="end" label="Ends" type="time" optional defaultValue={session?.end} error={errors.end} />
      </div>
      <TextField name="title" label="What is happening" required maxLength={120} defaultValue={session?.title} error={errors.title} hint="For example: Breakfast, Morning devotion, Sports, Small groups." />
      <div className="grid gap-6 sm:grid-cols-2">
        <TextField name="place" label="Where" optional maxLength={120} defaultValue={session?.place} />
        <TextField name="lead" label="Who leads" optional maxLength={120} defaultValue={session?.lead} />
      </div>
      <TextArea name="note" label="A note for families and facilitators" optional rows={3} maxLength={500} defaultValue={session?.note} hint="Families can read this. For example: bring a towel, wear closed shoes." />
      <div className="flex flex-wrap gap-3">
        <SaveButton>{session ? "Save the session" : "Add to the timetable"}</SaveButton>
        {session && <a href={back} className={btnClass.ghost}>Cancel</a>}
      </div>
    </form>
  );
}

function RefreshingDelete({ action, id, label }: { action: (fd: FormData) => Promise<Result>; id: string; label: string }) {
  const router = useRouter();
  return (
    <DeleteButton
      label={label}
      confirmText="Yes, remove it"
      fields={{ id }}
      action={async (fd) => {
        const r = await action(fd);
        if (r.ok) router.refresh();
        return r;
      }}
    />
  );
}
export const RemoveSession = ({ id }: { id: string }) => <RefreshingDelete action={deleteSession} id={id} label="Remove" />;
export const RemoveNote = ({ id }: { id: string }) => <RefreshingDelete action={deleteNote} id={id} label="Remove" />;

/** A note about one camper. Shared notes also appear on the family's page. */
export function NoteForm({ applicationId, onFamilyPage }: { applicationId: string; onFamilyPage: boolean }) {
  const router = useRouter();
  const { run, formRef, errors } = useSave(addNote, () => {
    formRef.current?.reset();
    router.refresh();
  });
  return (
    <form ref={formRef} action={run} className="grid max-w-2xl gap-5" noValidate>
      <input type="hidden" name="id" value={applicationId} />
      <TextArea name="text" label="Your note" rows={4} maxLength={2000} required error={errors.text} hint="What they enjoyed, what they learned, how they are getting on." />
      <Toggle name="shared" label="Share this note with the family" hint={onFamilyPage ? "The parent reads it on their family page. Keep health details out of it." : "This family has no family page yet, so they cannot read it until the camp office puts the application on one."} />
      <div><SaveButton>Save the note</SaveButton></div>
    </form>
  );
}
