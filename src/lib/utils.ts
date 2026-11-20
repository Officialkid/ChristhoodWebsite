import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Joins class names and lets the last Tailwind utility win (the helper shadcn/ui components expect at `@/lib/utils`). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
