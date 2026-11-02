"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { deleteUpdate, issueFamilyCode, postUpdate, resetFamilyPassword } from "@/app/123admin/actions-family";
import { DeleteButton, SaveButton, SelectField, TextArea, TextField, useSave } from "./forms";
import { btnClass, Notice } from "./ui";

/** A code or password shown once, with a button to copy it. */
function Shown({ title, note, value }: { title: string; note: string; value: string }) {
  return (
    <Notice tone="warn" title={title}>
      <p>{note}</p>
      <p className="mt-3 flex flex-wrap items-center gap-3">
        <code className="select-all break-all rounded-sm bg-paper px-3 py-2 text-lg font-bold tracking-wide">{value}</code>
        <button type="button" onClick={async () => { await navigator.clipboard.writeText(value); toast.success("Copied."); }} className={btnClass.secondary}><Copy className="size-4" aria-hidden /> Copy</button>
      </p>
    </Notice>
  );
}

/** Makes a one-time code for a returning camper. */
export function CodeButton({ id, name, active }: { id: string; name: string; active: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [shown, setShown] = useState<{ message: string; value: string } | null>(null);
  return (
    <span className="grid w-full gap-3">
      <span>
        <button
          type="button"
          disabled={pending}
          aria-label={`${active ? "Make a new" : "Make a"} family code for ${name}`}
          onClick={() =>
            start(async () => {
              const fd = new FormData();
              fd.set("id", id);
              const r = await issueFamilyCode(fd);
              if (r.ok && r.secret) {
                setShown({ message: r.message ?? "", value: r.secret });
                router.refresh();
              } else toast.error(r.message ?? "Could not make a code.");
            })
          }
          className={btnClass.secondary}
        >
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <KeyRound className="size-4" aria-hidden />} {active ? "New family code" : "Family code"}
        </button>
      </span>
      {shown && <Shown title={`Family code for ${name}`} note={shown.message} value={shown.value} />}
    </span>
  );
}

export function ResetPasswordButton({ id, name }: { id: string; name: string }) {
  const [pending, start] = useTransition();
  const [shown, setShown] = useState<{ message: string; value: string } | null>(null);
  return (
    <span className="grid w-full gap-3">
      <span>
        <button
          type="button"
          disabled={pending}
          aria-label={`Reset the password for ${name}`}
          onClick={() =>
            start(async () => {
              const fd = new FormData();
              fd.set("id", id);
              const r = await resetFamilyPassword(fd);
              if (r.ok && r.secret) setShown({ message: r.message ?? "", value: r.secret });
              else toast.error(r.message ?? "Could not reset the password.");
            })
          }
          className={btnClass.secondary}
        >
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <KeyRound className="size-4" aria-hidden />} Reset password
        </button>
      </span>
      {shown && <Shown title={shown.message} note="Give this to the parent privately (for example on WhatsApp). It is shown only once, and they choose their own password when they sign in." value={shown.value} />}
    </span>
  );
}

export function UpdateForm({ groups }: { groups: { value: string; label: string }[] }) {
  const router = useRouter();
  const { run, formRef, errors } = useSave(postUpdate, () => {
    formRef.current?.reset();
    router.refresh();
  });
  return (
    <form ref={formRef} action={run} className="grid max-w-2xl gap-6" noValidate>
      <SelectField name="camp" label="Who is it for?" options={groups} defaultValue={groups[0]?.value} error={errors.camp} />
      <TextField name="title" label="Title" maxLength={120} required error={errors.title} />
      <TextArea name="body" label="Update" rows={6} maxLength={3000} required error={errors.body} hint="Every family in that group can read this. Do not put a child's name or health details in it." />
      <div><SaveButton>Post update</SaveButton></div>
    </form>
  );
}

export function RemoveUpdate({ id }: { id: string }) {
  return <DeleteButton action={deleteUpdate} fields={{ id }} label="Remove" confirmText="Yes, remove it" />;
}
