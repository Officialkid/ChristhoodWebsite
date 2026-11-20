"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({ className, children, ...props }: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-[110] bg-ink/55" />
      <DialogPrimitive.Content className={cn("fixed left-1/2 top-[18vh] z-[111] w-[min(30rem,calc(100vw-1.5rem))] -translate-x-1/2 border border-ink/30 bg-paper p-6 text-ink outline-none", className)} {...props}>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export const DialogTitle = ({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) => <DialogPrimitive.Title className={cn("font-display text-xl font-extrabold leading-tight", className)} {...props} />;
export const DialogDescription = ({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) => <DialogPrimitive.Description className={cn("mt-2 text-muted", className)} {...props} />;
export const DialogFooter = ({ className, ...props }: React.ComponentProps<"div">) => <div className={cn("mt-6 flex flex-wrap justify-end gap-2", className)} {...props} />;
