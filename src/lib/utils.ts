import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow } from 'date-fns';
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
};

/**
 * Converts an Excel serial number date to a JavaScript Date object.
 * @param serial The Excel serial number.
 * @returns A JavaScript Date object.
 */
export function excelSerialDateToJSDate(serial: number): Date {
  // Excel's epoch starts on 1900-01-01, which it incorrectly treats as a leap year.
  // JavaScript's epoch is 1970-01-01.
  // The difference is 25569 days (70 years + 17 leap days + 1 for the 1900 bug).
  const utc_days = Math.floor(serial - 25569);
  const date = new Date(utc_days * 86400 * 1000);

  // Adjust for timezone offset
  const tz_offset_minutes = date.getTimezoneOffset();
  return new Date(date.getTime() + tz_offset_minutes * 60 * 1000);
}