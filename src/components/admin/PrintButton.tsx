"use client";

import { Printer } from "lucide-react";
import { btnClass } from "./ui";

/** Opens the print dialog so a screen can be handed round on paper. */
export function PrintButton({ label = "Print this guide" }: { label?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className={`${btnClass.secondary} print:hidden`}>
      <Printer className="size-4" aria-hidden /> {label}
    </button>
  );
}
