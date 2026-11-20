"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Sheet = Dialog.Root;
export const SheetTrigger = Dialog.Trigger;
export const SheetClose = Dialog.Close;
export const SheetTitle = Dialog.Title;
export const SheetDescription = Dialog.Description;

const sides = {
  left: "inset-y-0 left-0 w-[min(20rem,88vw)]",
  right: "inset-y-0 right-0 w-[min(26rem,94vw)]",
  bottom: "inset-x-0 bottom-0 max-h-[82svh] rounded-t-sm border-t",
} as const;

/** A panel that slides in from an edge. Traps focus, closes on Escape, and restores focus to what opened it. */
export function SheetContent({ side = "left", className, children, closeLabel = "Close", ...props }: React.ComponentProps<typeof Dialog.Content> & { side?: keyof typeof sides; closeLabel?: string }) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="sheet-overlay fixed inset-0 z-50 bg-ink/55" />
      <Dialog.Content className={cn("fixed z-[60] flex flex-col outline-none", side === "right" && "sheet-right", sides[side], className)} {...props}>
        {children}
        <Dialog.Close aria-label={closeLabel} className="absolute right-2 top-2 inline-flex size-11 items-center justify-center rounded-sm hover:bg-ink/10">
          <X className="size-5" aria-hidden />
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
