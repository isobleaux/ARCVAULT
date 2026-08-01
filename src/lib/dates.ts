/**
 * Day handling.
 *
 * Every log row stores the *calendar day it belongs to* as a UTC-midnight
 * Date (`loggedOn` / `performedOn` / `recordedOn`). The instant is stored
 * separately. That keeps "what did I eat on Tuesday" stable regardless of the
 * server's timezone, and makes day rollups a plain equality check.
 */

/** Parse a `YYYY-MM-DD` string into the UTC-midnight Date for that day. */
export function dayKeyToDate(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1));
}

/** Format a Date as `YYYY-MM-DD` using its UTC components. */
export function dateToDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** The `YYYY-MM-DD` for "today" in the viewer's local timezone. */
export function localDayKey(now: Date = new Date()): string {
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export function isValidDayKey(key: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  const date = dayKeyToDate(key);
  return !Number.isNaN(date.getTime()) && dateToDayKey(date) === key;
}

export function addDays(key: string, delta: number): string {
  const date = dayKeyToDate(key);
  date.setUTCDate(date.getUTCDate() + delta);
  return dateToDayKey(date);
}

/** Inclusive list of day keys ending at `endKey`. */
export function lastNDays(endKey: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => addDays(endKey, i - (n - 1)));
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** "Today" / "Yesterday" / "Tue 12 Mar" — never depends on locale data. */
export function humanDay(key: string, todayKey: string): string {
  if (key === todayKey) return "Today";
  if (key === addDays(todayKey, -1)) return "Yesterday";
  if (key === addDays(todayKey, 1)) return "Tomorrow";
  const date = dayKeyToDate(key);
  const label = `${WEEKDAYS[date.getUTCDay()]} ${date.getUTCDate()} ${MONTHS[date.getUTCMonth()].slice(0, 3)}`;
  return date.getUTCFullYear() === dayKeyToDate(todayKey).getUTCFullYear()
    ? label
    : `${label} ${date.getUTCFullYear()}`;
}

export function shortDay(key: string): string {
  const date = dayKeyToDate(key);
  return WEEKDAYS[date.getUTCDay()];
}

export function shortDate(key: string): string {
  const date = dayKeyToDate(key);
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()].slice(0, 3)}`;
}

/** Clock time for a log instant, in the server's locale-independent form. */
export function clockTime(date: Date): string {
  return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}
