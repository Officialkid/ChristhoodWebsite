"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useActionStateKeep } from "../forms/keep";
import { useFormStatus } from "react-dom";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { btnClass } from "./ui";

/** What every admin save returns. `stamp` makes two identical messages in a row still show. */
export type Result = { ok: boolean; message?: string; errors?: Record<string, string>; stamp?: number; id?: string; /** Shown once, for example a temporary password. */ secret?: string };
export const idle: Result = { ok: false };

/** Runs a save action and shows its result as a short message. */
export function useSave(action: (prev: Result, fd: FormData) => Promise<Result>, onDone?: (r: Result) => void) {
  const [state, run, pending, formRef] = useActionStateKeep(action, idle);
  const seen = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (!state.stamp || seen.current === state.stamp) return;
    seen.current = state.stamp;
    if (state.message) (state.ok ? toast.success : toast.error)(state.message);
    if (state.ok) onDone?.(state);
  }, [state, onDone]);
  return { state, run, pending, formRef, errors: state.errors ?? {} };
}

export function SaveButton({ children = "Save changes", label }: { children?: React.ReactNode; label?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-label={label} className={btnClass.primary}>
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {pending ? "Saving…" : children}
    </button>
  );
}

/** Two-step delete: the first press asks, the second does it. No pop-up window needed. */
export function DeleteButton({ action, label = "Delete", confirmText = "Yes, delete it", fields }: { action: (fd: FormData) => Promise<Result | void>; label?: string; confirmText?: string; fields: Record<string, string> }) {
  const [asking, setAsking] = useState(false);
  const [pending, start] = useTransition();
  if (!asking) {
    return (
      <button type="button" onClick={() => setAsking(true)} className={btnClass.danger}>
        <Trash2 className="size-4" aria-hidden /> {label}
      </button>
    );
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-2" role="group" aria-label="Confirm delete">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const fd = new FormData();
            for (const [k, v] of Object.entries(fields)) fd.set(k, v);
            const r = await action(fd);
            if (r && !r.ok && r.message) toast.error(r.message);
          })
        }
        className="inline-flex min-h-11 items-center gap-2 rounded-sm bg-danger px-5 text-[0.95rem] font-semibold text-paper"
      >
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {confirmText}
      </button>
      <button type="button" onClick={() => setAsking(false)} className={btnClass.ghost}>Keep it</button>
    </span>
  );
}

/* ---- field wrappers sharing the public form look ---- */
export function Label({ htmlFor, children, optional }: { htmlFor: string; children: React.ReactNode; optional?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="f-label">
      {children} {optional && <span className="font-normal text-muted">(optional)</span>}
    </label>
  );
}

export function Group({ id, label, optional, hint, error, children }: { id: string; label: string; optional?: boolean; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label htmlFor={id} optional={optional}>{label}</Label>
      {hint && <p id={`${id}-hint`} className="f-hint">{hint}</p>}
      {children}
      {error && <p id={`${id}-err`} role="alert" className="f-error">{error}</p>}
    </div>
  );
}

type FieldProps = { name: string; label: string; optional?: boolean; hint?: string; error?: string; defaultValue?: string | number };

export function TextField({ name, label, optional, hint, error, defaultValue, type = "text", ...rest }: FieldProps & Omit<React.InputHTMLAttributes<HTMLInputElement>, "name" | "defaultValue">) {
  const id = `f-${name}`;
  return (
    <Group id={id} label={label} optional={optional} hint={hint} error={error}>
      <input id={id} name={name} type={type} defaultValue={defaultValue} className="f-input" aria-invalid={error ? true : undefined} aria-describedby={[hint && `${id}-hint`, error && `${id}-err`].filter(Boolean).join(" ") || undefined} {...rest} />
    </Group>
  );
}

export function TextArea({ name, label, optional, hint, error, defaultValue, rows = 5, ...rest }: FieldProps & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "name" | "defaultValue">) {
  const id = `f-${name}`;
  return (
    <Group id={id} label={label} optional={optional} hint={hint} error={error}>
      <textarea id={id} name={name} rows={rows} defaultValue={defaultValue} className="f-input" aria-invalid={error ? true : undefined} aria-describedby={[hint && `${id}-hint`, error && `${id}-err`].filter(Boolean).join(" ") || undefined} {...rest} />
    </Group>
  );
}

export function SelectField({ name, label, optional, hint, error, defaultValue, options, ...rest }: FieldProps & { options: { value: string; label: string }[] } & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "name" | "defaultValue">) {
  const id = `f-${name}`;
  return (
    <Group id={id} label={label} optional={optional} hint={hint} error={error}>
      <select id={id} name={name} defaultValue={defaultValue} className="f-input" aria-invalid={error ? true : undefined} {...rest}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Group>
  );
}

export function Toggle({ name, label, hint, defaultChecked }: { name: string; label: string; hint?: string; defaultChecked?: boolean }) {
  return (
    <label className="f-choice">
      <input type="checkbox" name={name} value="yes" defaultChecked={defaultChecked} />
      <span className="leading-snug"><span className="font-semibold">{label}</span>{hint && <span className="block text-[0.9rem] text-muted">{hint}</span>}</span>
    </label>
  );
}
