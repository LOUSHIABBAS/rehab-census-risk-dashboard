import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDaysOpen(createdAt: Date | string): string {
  const ms = Date.now() - new Date(createdAt).getTime();
  const days = ms / (1000 * 60 * 60 * 24);
  if (days < 1) return "<1 day";
  if (days < 2) return "1 day";
  return `${Math.floor(days)} days`;
}

export function formatShortDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
