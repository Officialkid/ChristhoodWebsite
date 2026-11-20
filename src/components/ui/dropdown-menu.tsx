"use client";

import * as Menu from "@radix-ui/react-dropdown-menu";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const DropdownMenu = Menu.Root;
export const DropdownMenuTrigger = Menu.Trigger;

export function DropdownMenuContent({ className, sideOffset = 6, ...props }: React.ComponentProps<typeof Menu.Content>) {
  return (
    <Menu.Portal>
      <Menu.Content sideOffset={sideOffset} className={cn("z-[100] min-w-56 border border-ink/25 bg-paper p-1 text-ink shadow-md", className)} {...props} />
    </Menu.Portal>
  );
}

export const DropdownMenuItem = ({ className, ...props }: React.ComponentProps<typeof Menu.Item>) => (
  <Menu.Item className={cn("flex min-h-10 cursor-pointer select-none items-center gap-2.5 rounded-sm px-3 text-[0.93rem] font-semibold outline-none data-[disabled]:opacity-50 data-[highlighted]:bg-purple-tint pointer-coarse:min-h-11", className)} {...props} />
);
export const DropdownMenuLabel = ({ className, ...props }: React.ComponentProps<typeof Menu.Label>) => <Menu.Label className={cn("px-3 py-2 text-[0.85rem] text-muted", className)} {...props} />;
export const DropdownMenuSeparator = ({ className, ...props }: React.ComponentProps<typeof Menu.Separator>) => <Menu.Separator className={cn("my-1 h-px bg-rule", className)} {...props} />;

/** An item that stays open while it is ticked or unticked (for choosing which columns a table shows). */
export const DropdownMenuCheckboxItem = ({ className, children, ...props }: React.ComponentProps<typeof Menu.CheckboxItem>) => (
  <Menu.CheckboxItem onSelect={(e) => e.preventDefault()} className={cn("flex min-h-10 cursor-pointer select-none items-center gap-2.5 rounded-sm px-3 text-[0.93rem] font-semibold outline-none data-[disabled]:opacity-50 data-[highlighted]:bg-purple-tint pointer-coarse:min-h-11", className)} {...props}>
    <span className="grid size-4 shrink-0 place-items-center border border-ink/50"><Menu.ItemIndicator><Check className="size-3.5" aria-hidden /></Menu.ItemIndicator></span>
    {children}
  </Menu.CheckboxItem>
);
