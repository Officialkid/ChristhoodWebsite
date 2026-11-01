"use client";

import { useActionState, useCallback, useEffect, useRef } from "react";

/** Puts back what was typed into a form. React clears a form after every send, even when the send was refused or went through. */
function restore(form: HTMLFormElement, fd: FormData) {
  for (const el of Array.from(form.elements)) {
    if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) || !el.name) continue;
    if (el.name === "elapsedMs" || (el instanceof HTMLInputElement && ["submit", "button", "file", "reset"].includes(el.type))) continue;
    if (el instanceof HTMLInputElement && (el.type === "checkbox" || el.type === "radio")) el.checked = fd.getAll(el.name).map(String).includes(el.value);
    else el.value = String(fd.get(el.name) ?? "");
  }
}

/**
 * Like useActionState, but the form keeps everything the person typed (refused or saved).
 * Attach the returned `formRef` to the form.
 */
export function useActionStateKeep<S extends { ok: boolean }>(action: (prev: S, fd: FormData) => Promise<S>, initial: S) {
  const last = useRef<FormData | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const wrapped = useCallback(
    async (prev: S, fd: FormData) => {
      last.current = fd;
      return action(prev, fd);
    },
    [action],
  );
  const [state, run, pending] = useActionState(wrapped as unknown as (prev: Awaited<S>, fd: FormData) => Promise<Awaited<S>>, initial as Awaited<S>) as unknown as [S, (fd: FormData) => void, boolean];
  useEffect(() => {
    const form = formRef.current;
    const fd = last.current;
    if (!form || !fd || state === initial) return;
    const t = setTimeout(() => restore(form, fd), 0);
    return () => clearTimeout(t);
  }, [state, initial]);
  return [state, run, pending, formRef] as const;
}
