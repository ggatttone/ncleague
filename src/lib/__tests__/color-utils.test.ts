import { describe, it, expect } from 'vitest';
import { hexToHsl, getContrastingColor, hslToString } from '../color-utils';

describe('hexToHsl', () => {
  it('converts black (#000000)', () => {
    expect(hexToHsl('#000000')).toEqual({ h: 0, s: 0, l: 0 });
  });

  it('converts white (#ffffff)', () => {
    expect(hexToHsl('#ffffff')).toEqual({ h: 0, s: 0, l: 100 });
  });

  it('converts pure red (#ff0000)', () => {
    expect(hexToHsl('#ff0000')).toEqual({ h: 0, s: 100, l: 50 });
  });

  it('converts pure green (#00ff00)', () => {
    expect(hexToHsl('#00ff00')).toEqual({ h: 120, s: 100, l: 50 });
  });

  it('converts pure blue (#0000ff)', () => {
    expect(hexToHsl('#0000ff')).toEqual({ h: 240, s: 100, l: 50 });
  });

  it('converts 3-char hex (#f00)', () => {
    expect(hexToHsl('#f00')).toEqual({ h: 0, s: 100, l: 50 });
  });

  it('converts 3-char hex (#fff)', () => {
    expect(hexToHsl('#fff')).toEqual({ h: 0, s: 0, l: 100 });
  });

  it('converts mid-gray (#808080)', () => {
    const result = hexToHsl('#808080');
    expect(result.h).toBe(0);
    expect(result.s).toBe(0);
    expect(result.l).toBeCloseTo(50, 0);
  });
});

describe('getContrastingColor', () => {
  it('returns dark text for light backgrounds', () => {
    expect(getContrastingColor('#ffffff')).toBe('222.2 84% 4.9%');
  });

  it('returns light text for dark backgrounds', () => {
    expect(getContrastingColor('#000000')).toBe('210 40% 98%');
  });

  it('returns dark text for mid-light colors', () => {
    expect(getContrastingColor('#ffcc00')).toBe('222.2 84% 4.9%');
  });

  it('returns light text for dark blue', () => {
    expect(getContrastingColor('#000080')).toBe('210 40% 98%');
  });

  it('returns default (dark text) for empty string', () => {
    expect(getContrastingColor('')).toBe('222.2 84% 4.9%');
  });

  it('returns default for short hex', () => {
    expect(getContrastingColor('#ab')).toBe('222.2 84% 4.9%');
  });
});

describe('hslToString', () => {
  it('formats HSL object as CSS string', () => {
    expect(hslToString({ h: 210, s: 50, l: 60 })).toBe('210 50% 60%');
  });

  it('formats zero values', () => {
    expect(hslToString({ h: 0, s: 0, l: 0 })).toBe('0 0% 0%');
  });

  it('formats max values', () => {
    expect(hslToString({ h: 360, s: 100, l: 100 })).toBe('360 100% 100%');
  });
});
