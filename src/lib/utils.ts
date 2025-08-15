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
 * Converts an Excel serial number date (which includes time in the decimal part)
 * to a JavaScript Date object.
 * @param serial The Excel serial number.
 * @returns A JavaScript Date object.
 */
export function excelSerialDateToJSDate(serial: number): Date {
  // Excel's epoch starts on 1900-01-01. JavaScript's is 1970-01-01.
  // The difference is 25569 days.
  // The integer part of the serial is the number of days.
  // The fractional part is the fraction of a 24-hour day (the time).
  // We multiply by milliseconds in a day (86400 * 1000).
  const excelEpoch = new Date(Date.UTC(1899, 11, 30));
  const jsDate = new Date(excelEpoch.getTime() + serial * 86400 * 1000);

  return jsDate;
}