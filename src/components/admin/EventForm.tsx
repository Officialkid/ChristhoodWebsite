"use client";

import { useRouter } from "next/navigation";
import { saveEvent, deleteEvent } from "@/app/123admin/actions-content";
import { DeleteButton, SaveButton, SelectField, TextArea, TextField, Toggle, useSave } from "./forms";
import { PhotoField } from "./PhotoField";
import { LinkButton } from "./ui";
import type { EventDoc } from "@/lib/types";

type Props = { event?: EventDoc; departments: { id: string; name: string }[]; startValue: string; endValue: string; canPickNone: boolean };

const categories = [
  { value: "camp", label: "Camp" },
  { value: "mentorship", label: "Mentorship season" },
  { value: "missions", label: "Missions" },
  { value: "fellowship", label: "Fellowship" },
  { value: "prayer", label: "Prayer or summit" },
];

export default function EventForm({ event, departments, startValue, endValue, canPickNone }: Props) {
  const router = useRouter();
  const { run, formRef, errors } = useSave(saveEvent, () => router.push("/123admin/events"));
  return (
    <form ref={formRef} action={run} className="grid gap-8" noValidate>
      <input type="hidden" name="id" value={event?.id ?? ""} />
      <div className="grid gap-6 sm:grid-cols-2">
        <TextField name="title" label="Name of the event" defaultValue={event?.title} error={errors.title} required maxLength={120} />
        <TextField name="subtitle" label="Short line under the name" optional hint="For example “Ages 7–12”." defaultValue={event?.subtitle} maxLength={120} />
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <TextField name="start" label="Starts" type="datetime-local" defaultValue={startValue} error={errors.start} required />
        <TextField name="end" label="Ends" optional type="datetime-local" defaultValue={endValue} error={errors.end} />
        <TextField name="fee" label="Cost in shillings" optional type="number" min={0} step={10} inputMode="numeric" defaultValue={event?.fee} error={errors.fee} hint="Leave empty if it is free." />
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <SelectField name="category" label="Type" defaultValue={event?.category ?? "camp"} options={categories} error={errors.category} />
        <SelectField
          name="department"
          label="Which department looks after it?"
          defaultValue={event?.department ?? ""}
          error={errors.department}
          options={[...(canPickNone ? [{ value: "", label: "No one in particular" }] : []), ...departments.map((d) => ({ value: d.id, label: d.name }))]}
          hint="Only that department and the web team can change it later."
        />
      </div>
      <TextField name="location" label="Where" optional defaultValue={event?.location} maxLength={160} />
      <TextArea name="details" label="More about it" optional rows={4} defaultValue={event?.details} maxLength={3000} />
      <PhotoField name="image" label="Picture" hint="Shown beside the event on the website." defaultValue={event?.image} />
      <div className="grid gap-6 sm:grid-cols-2">
        <Toggle name="registrationOpen" label="People can register" hint="Shows the Register button." defaultChecked={event?.registrationOpen ?? true} />
        <TextField name="registerHref" label="Where Register goes" optional defaultValue={event?.registerHref} error={errors.registerHref} hint="/events/register for camps, /programmes/branch/register for Branch, or a full https:// link." />
      </div>
      <div className="flex flex-wrap items-center gap-3 border-t border-rule pt-6">
        <SaveButton>{event ? "Save event" : "Add event"}</SaveButton>
        <LinkButton href="/123admin/events" variant="ghost">Cancel</LinkButton>
        {event && <span className="ml-auto"><DeleteButton action={async (fd) => { const r = await deleteEvent(fd); if (r.ok) router.push("/123admin/events"); return r; }} fields={{ id: event.id }} label="Delete event" /></span>}
      </div>
    </form>
  );
}
