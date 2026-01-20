/**
 * Converts a hex color string to an HSL object.
 * @param hex The hex color string (e.g., "#RRGGBB").
 * @returns An object with h, s, l properties.
 */
export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex[1] + hex[2], 16);
    g = parseInt(hex[3] + hex[4], 16);
    b = parseInt(hex[5] + hex[6], 16);
  }

  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Generates a foreground color (black or white) based on the luminance of the background color.
 * @param hex The background hex color.
 * @returns "222.2 84% 4.9%" (dark text) or "210 40% 98%" (light text) in HSL format for CSS variables.
 */
export function getContrastingColor(hex: string): string {
    if (!hex || hex.length < 4) return '222.2 84% 4.9%'; // Default to dark text
    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '222.2 84% 4.9%' : '210 40% 98%';
}

/**
 * Converts an HSL object to a string format for CSS variables.
 * @param hsl The HSL object.
 * @returns A string like "h s% l%".
 */
export function hslToString(hsl: { h: number; s: number; l: number }): string {
  return `${hsl.h} ${hsl.s}% ${hsl.l}%`;
}