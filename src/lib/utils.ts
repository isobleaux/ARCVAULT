import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatKcal(value: number): string {
  return Math.round(value).toLocaleString();
}

export function formatGrams(value: number, places = 0): string {
  const rounded = Number(value.toFixed(places));
  return `${rounded}g`;
}

/** "1,240" style number with no unit. */
export function formatNumber(value: number, places = 0): string {
  return Number(value.toFixed(places)).toLocaleString(undefined, {
    maximumFractionDigits: places,
  });
}

export function formatDuration(minutes: number): string {
  const total = Math.round(minutes);
  if (total < 60) return `${total} min`;
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} min`;
}

export function pct(value: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}

export function initials(name: string | null | undefined, email: string): string {
  const source = name?.trim() || email;
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  return (parts[0]?.[0] ?? "?").concat(parts[1]?.[0] ?? "").toUpperCase();
}
