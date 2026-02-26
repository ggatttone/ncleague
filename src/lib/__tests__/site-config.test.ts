import { describe, it, expect, vi, afterEach } from 'vitest';
import { getSiteUrl, SUPPORTED_LANGS, DEFAULT_LANG } from '../site-config';

describe('site-config', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('getSiteUrl', () => {
    it('returns VITE_SITE_URL when set', () => {
      vi.stubEnv('VITE_SITE_URL', 'https://example.com');
      expect(getSiteUrl()).toBe('https://example.com');
    });

    it('falls back to window.location.origin when VITE_SITE_URL is empty', () => {
      vi.stubEnv('VITE_SITE_URL', '');
      expect(getSiteUrl()).toBe(window.location.origin);
    });

    it('falls back to window.location.origin when VITE_SITE_URL is not set', () => {
      // Default test environment has no VITE_SITE_URL
      expect(getSiteUrl()).toBe(window.location.origin);
    });
  });

  describe('constants', () => {
    it('SUPPORTED_LANGS contains it, en, nl', () => {
      expect(SUPPORTED_LANGS).toEqual(['it', 'en', 'nl']);
    });

    it('DEFAULT_LANG is it', () => {
      expect(DEFAULT_LANG).toBe('it');
    });
  });
});
