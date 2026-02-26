/**
 * Base URL of the site. Uses VITE_SITE_URL env var if available,
 * otherwise falls back to window.location.origin at runtime.
 */
export function getSiteUrl(): string {
  return import.meta.env.VITE_SITE_URL || window.location.origin;
}

export const SUPPORTED_LANGS = ['it', 'en', 'nl'] as const;
export type SupportedLang = (typeof SUPPORTED_LANGS)[number];
export const DEFAULT_LANG: SupportedLang = 'it';
