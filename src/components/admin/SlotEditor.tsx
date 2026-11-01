"use client";

import { useState, useTransition } from "react";
import { Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { resetSlot, saveSlot } from "@/app/123admin/actions-content";
import { SaveButton, useSave } from "./forms";
import { PhotoField, previewSrc } from "./PhotoField";
import { Chip } from "./ui";

type Props = { slotKey: string; label: string; fallback?: string; src?: string; focus?: string; changedBy?: string; defaultFocus?: string };

/** One place on the site where the picture can be changed. Collapsed to a row; opens to the picture chooser. */
export default function SlotEditor({ slotKey, label, fallback, src, focus, changedBy, defaultFocus }: Props) {
  const [open, setOpen] = useState(false);
  const [resetting, start] = useTransition();
  const { run, formRef } = useSave(saveSlot);
  const shown = src ?? fallback;
  return (
    <li className="border-b border-rule">
      <div className="flex flex-wrap items-center gap-3 py-3">
        <div className="relative h-14 w-24 shrink-0 overflow-hidden bg-paper-2">
          {shown ? (
            // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail
            <img src={previewSrc(shown)} alt="" loading="lazy" className="size-full object-cover" style={{ objectPosition: focus ?? defaultFocus }} />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold leading-snug">{label}</p>
          <p className="text-[0.9rem] text-muted">{src ? <>Changed{changedBy ? ` by ${changedBy}` : ""}</> : shown ? "Original picture" : "No picture yet"}</p>
        </div>
        {src && <Chip tone="ok">Changed</Chip>}
        <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)} className="inline-flex min-h-11 items-center rounded-sm border border-ink/35 px-4 text-[0.95rem] font-semibold hover:bg-ink hover:text-paper">
          {open ? "Close" : "Change"}
        </button>
      </div>
      {open && (
        <form ref={formRef} action={run} className="grid gap-5 pb-6 pl-0 sm:pl-[6.75rem]">
          <input type="hidden" name="key" value={slotKey} />
          <PhotoField name="src" label="New picture" defaultValue={src ?? ""} fallback={fallback} focusName="focus" defaultFocus={focus ?? defaultFocus} />
          <div className="flex flex-wrap items-center gap-3">
            <SaveButton>Use this picture</SaveButton>
            {src && (
              <button
                type="button"
                disabled={resetting}
                onClick={() => start(async () => {
                  const fd = new FormData();
                  fd.set("key", slotKey);
                  const r = await resetSlot(fd);
                  (r.ok ? toast.success : toast.error)(r.message ?? "");
                })}
                className="inline-flex min-h-11 items-center gap-2 rounded-sm px-3 font-semibold text-purple hover:bg-purple-tint"
              >
                {resetting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <RotateCcw className="size-4" aria-hidden />} Go back to the original
              </button>
            )}
          </div>
        </form>
      )}
    </li>
  );
}
