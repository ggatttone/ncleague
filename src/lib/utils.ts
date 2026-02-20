import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format as formatDate, formatDistanceToNow, type Locale } from 'date-fns';
import { it } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateRelative(dateString: string | null | undefined): string {
  if (!dateString) return '';
  try {
    // Imposta la data corrente come riferimento per evitare discrepanze
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: it });
  } catch (error) {
    console.error("Error formatting date:", error);
    return '';
  }
}

export function getInitials(firstName?: string, lastName?: string) {
  const first = firstName?.[0] || '';
  const last = lastName?.[0] || '';
  const initials = `${first}${last}`.toUpperCase();
  return initials || 'N/A';
}

/**
 * Parse an ISO datetime string and return a Date object treating the time
 * as local time, ignoring any timezone suffix.
 *
 * This is useful for displaying "wall clock" times without timezone conversion.
 * Example: "2026-03-08T19:00:00+00:00" will return a Date representing 19:00 local time,
 * not 20:00 (which would happen if the browser is in UTC+1).
 *
 * @param isoString - ISO 8601 datetime string (e.g., "2026-03-08T19:00:00+00:00")
 * @returns Date object with the time components as local time
 */
export function parseAsLocalTime(isoString: string): Date {
  const match = isoString.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
  if (!match) {
    // Fallback to native parsing if format doesn't match
    return new Date(isoString);
  }
  const [, year, month, day, hour, minute, second] = match.map(Number);
  // Create date using local timezone (month is 0-indexed in JavaScript Date)
  return new Date(year, month - 1, day, hour, minute, second);
}

/**
 * Format match datetime preserving wall-clock time (no timezone conversion).
 */
export function formatMatchDateLocal(
  isoString: string,
  pattern: string,
  locale?: Locale
): string {
  const localDate = parseAsLocalTime(isoString);
  return formatDate(localDate, pattern, locale ? { locale } : undefined);
}

/**
 * Convert persisted datetime string to a value accepted by <input type="datetime-local" />.
 */
export function toDateTimeLocalInputValue(isoString: string): string {
  const localDate = parseAsLocalTime(isoString);
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, '0');
  const day = String(localDate.getDate()).padStart(2, '0');
  const hour = String(localDate.getHours()).padStart(2, '0');
  const minute = String(localDate.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

/**
 * Serialize a local Date preserving wall-clock time using +00:00 suffix.
 */
export function toWallClockUtcIsoString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}T${hour}:${minute}:${second}+00:00`;
}
