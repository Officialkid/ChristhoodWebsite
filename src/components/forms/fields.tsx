"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

export type Errors = Record<string, string | undefined>;

/** A labelled field with its hint and error wired up for screen readers. */
export function Field({ label, optional, hint, error, children }: { label: string; optional?: boolean; hint?: string; error?: string; children: (props: { id: string; "aria-describedby"?: string; "aria-invalid"?: boolean }) => React.ReactNode }) {
  const id = useId();
  const describedBy = [hint && `${id}-hint`, error && `${id}-err`].filter(Boolean).join(" ") || undefined;
  return (
    <div>
      <label htmlFor={id} className="f-label">
        {label} {optional && <span className="font-normal text-muted">(optional)</span>}
      </label>
      {hint && <p id={`${id}-hint`} className="f-hint">{hint}</p>}
      {children({ id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined })}
      {error && <p id={`${id}-err`} className="f-error" role="alert">{error}</p>}
    </div>
  );
}

/** A group of radio buttons or tick boxes. */
export function Choices({ legend, optional, hint, error, type, name, options, defaultValue, columns = 1, onChange }: { legend: string; optional?: boolean; hint?: string; error?: string; type: "radio" | "checkbox"; name: string; options: { value: string; label: React.ReactNode }[]; defaultValue?: string | string[]; columns?: 1 | 2 | 3; onChange?: (value: string) => void }) {
  const id = useId();
  const cols = columns === 3 ? "sm:grid-cols-3" : columns === 2 ? "sm:grid-cols-2" : "";
  return (
    <fieldset aria-describedby={[hint && `${id}-hint`, error && `${id}-err`].filter(Boolean).join(" ") || undefined}>
      <legend className="f-label">{legend} {optional && <span className="font-normal text-muted">(optional)</span>}</legend>
      {hint && <p id={`${id}-hint`} className="f-hint">{hint}</p>}
      <div className={`mt-2 grid gap-2 ${cols}`}>
        {options.map((o) => (
          <label key={o.value} className="f-choice">
            <input
              type={type}
              name={name}
              value={o.value}
              defaultChecked={Array.isArray(defaultValue) ? defaultValue.includes(o.value) : defaultValue === o.value}
              onChange={onChange ? () => onChange(o.value) : undefined}
            />
            <span className="leading-snug">{o.label}</span>
          </label>
        ))}
      </div>
      {error && <p id={`${id}-err`} className="f-error" role="alert">{error}</p>}
    </fieldset>
  );
}

export function SubmitButton({ children, pending: pendingLabel = "Sending…", className = "" }: { children: React.ReactNode; pending?: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-sm bg-gold px-7 text-[0.98rem] font-bold text-ink transition-colors hover:bg-gold-hover disabled:cursor-wait disabled:opacity-70 ${className}`}>
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {pending ? pendingLabel : children}
    </button>
  );
}

/** Hidden helpers that make bots easy to spot: a trap field and the time spent on the form. */
export function BotTraps() {
  const started = useRef(0);
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    started.current = Date.now();
    const t = setInterval(() => setElapsed(Date.now() - started.current), 500);
    return () => clearInterval(t);
  }, []);
  return (
    <>
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>Leave this empty<input type="text" name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <input type="hidden" name="elapsedMs" value={elapsed} readOnly />
    </>
  );
}

/** Moves focus to the first field with a problem after a failed send. */
export function useFocusFirstError(errors?: Errors, formRef?: React.RefObject<HTMLFormElement | null>) {
  useEffect(() => {
    if (!errors || !formRef?.current) return;
    formRef.current.querySelector<HTMLElement>('[aria-invalid="true"], fieldset[aria-describedby*="-err"] input')?.focus();
  }, [errors, formRef]);
}

export function nairobiToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" });
}
