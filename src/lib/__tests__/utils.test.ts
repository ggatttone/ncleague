import { describe, it, expect } from 'vitest';
import {
  cn,
  getInitials,
  parseAsLocalTime,
  formatMatchDateLocal,
  toDateTimeLocalInputValue,
  toWallClockUtcIsoString,
} from '../utils';

describe('utils', () => {
  describe('cn', () => {
    it('merges class names', () => {
      expect(cn('px-4', 'py-2')).toBe('px-4 py-2');
    });

    it('resolves Tailwind conflicts (last wins)', () => {
      expect(cn('px-4', 'px-8')).toBe('px-8');
    });

    it('handles conditional classes', () => {
      const isHidden = false;
      expect(cn('base', isHidden && 'hidden', 'visible')).toBe('base visible');
    });
  });

  describe('getInitials', () => {
    it('returns initials from first and last name', () => {
      expect(getInitials('Mario', 'Rossi')).toBe('MR');
    });

    it('returns single initial when only first name', () => {
      expect(getInitials('Mario', undefined)).toBe('M');
    });

    it('returns single initial when only last name', () => {
      expect(getInitials(undefined, 'Rossi')).toBe('R');
    });

    it('returns N/A when no names', () => {
      expect(getInitials(undefined, undefined)).toBe('N/A');
    });

    it('returns N/A for empty strings', () => {
      expect(getInitials('', '')).toBe('N/A');
    });
  });

  describe('parseAsLocalTime', () => {
    it('parses ISO datetime without timezone conversion', () => {
      const date = parseAsLocalTime('2026-03-08T19:00:00+00:00');
      expect(date.getHours()).toBe(19);
      expect(date.getMinutes()).toBe(0);
      expect(date.getFullYear()).toBe(2026);
      expect(date.getMonth()).toBe(2); // March = 2 (0-indexed)
      expect(date.getDate()).toBe(8);
    });

    it('parses ISO datetime without timezone suffix', () => {
      const date = parseAsLocalTime('2026-06-15T14:30:00');
      expect(date.getHours()).toBe(14);
      expect(date.getMinutes()).toBe(30);
    });

    it('falls back to native parsing for non-standard formats', () => {
      const date = parseAsLocalTime('invalid-format');
      expect(date.toString()).toBe('Invalid Date');
    });
  });

  describe('formatMatchDateLocal', () => {
    it('formats date preserving wall-clock time', () => {
      const result = formatMatchDateLocal('2026-03-08T19:00:00+00:00', 'HH:mm');
      expect(result).toBe('19:00');
    });

    it('formats full date', () => {
      const result = formatMatchDateLocal('2026-03-08T19:00:00+00:00', 'yyyy-MM-dd');
      expect(result).toBe('2026-03-08');
    });
  });

  describe('toDateTimeLocalInputValue', () => {
    it('converts ISO to datetime-local format', () => {
      const result = toDateTimeLocalInputValue('2026-03-08T19:00:00+00:00');
      expect(result).toBe('2026-03-08T19:00');
    });

    it('preserves exact time components', () => {
      const result = toDateTimeLocalInputValue('2026-12-25T09:30:00+00:00');
      expect(result).toBe('2026-12-25T09:30');
    });
  });

  describe('toWallClockUtcIsoString', () => {
    it('serializes local date with +00:00 suffix', () => {
      const date = new Date(2026, 2, 8, 19, 0, 0); // March 8, 2026 19:00
      const result = toWallClockUtcIsoString(date);
      expect(result).toBe('2026-03-08T19:00:00+00:00');
    });

    it('pads single-digit values', () => {
      const date = new Date(2026, 0, 5, 9, 5, 3); // Jan 5, 2026 09:05:03
      const result = toWallClockUtcIsoString(date);
      expect(result).toBe('2026-01-05T09:05:03+00:00');
    });
  });
});
