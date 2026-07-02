import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * cn merges Tailwind class names, resolving conflicts (the last wins) — the same
 * helper COSS UI / shadcn components rely on.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
