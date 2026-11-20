"use client";

import { Group, Panel, Separator } from "react-resizable-panels";
import { cn } from "@/lib/utils";

export const ResizablePanelGroup = Group;
export const ResizablePanel = Panel;

/** The draggable divider. Arrow keys resize it, so it works without a mouse. */
export function ResizableHandle({ className, label = "Resize the panels", ...props }: React.ComponentProps<typeof Separator> & { label?: string }) {
  return (
    <Separator
      aria-label={label}
      className={cn("relative w-px shrink-0 bg-rule outline-none transition-colors after:absolute after:inset-y-0 after:-left-1.5 after:-right-1.5 hover:bg-purple focus-visible:bg-purple data-[separator=active]:bg-purple", className)}
      {...props}
    />
  );
}
