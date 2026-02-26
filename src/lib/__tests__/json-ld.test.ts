import { describe, it, expect } from 'vitest';
import {
  buildArticleJsonLd,
  buildSportsEventJsonLd,
  buildSportsTeamJsonLd,
  buildPersonJsonLd,
} from '../json-ld';

describe('json-ld', () => {
  describe('buildArticleJsonLd', () => {
    it('returns correct schema with all fields', () => {
      const result = buildArticleJsonLd({
        title: 'Test Article',
        description: 'A description',
        image: 'https://example.com/image.jpg',
        publishedAt: '2026-01-15T10:00:00Z',
        authorName: 'John Doe',
        url: '/news/test-article',
      });

      expect(result['@context']).toBe('https://schema.org');
      expect(result['@type']).toBe('Article');
      expect(result.headline).toBe('Test Article');
      expect(result.description).toBe('A description');
      expect(result.image).toBe('https://example.com/image.jpg');
      expect(result.datePublished).toBe('2026-01-15T10:00:00Z');
      expect(result.author).toEqual({ '@type': 'Person', name: 'John Doe' });
      expect(result.publisher).toEqual({ '@type': 'Organization', name: 'NC League' });
    });

    it('omits optional fields when not provided', () => {
      const result = buildArticleJsonLd({
        title: 'Minimal Article',
        url: '/news/minimal',
      });

      expect(result.headline).toBe('Minimal Article');
      expect(result.description).toBeUndefined();
      expect(result.image).toBeUndefined();
      expect(result.datePublished).toBeUndefined();
      expect(result.author).toBeUndefined();
    });

    it('converts relative image URLs to absolute', () => {
      const result = buildArticleJsonLd({
        title: 'Test',
        image: '/images/photo.jpg',
        url: '/news/test',
      });

      // Should prepend the site URL (window.location.origin in test)
      expect(result.image).toContain('/images/photo.jpg');
      expect((result.image as string).startsWith('http')).toBe(true);
    });
  });

  describe('buildSportsEventJsonLd', () => {
    it('returns correct schema', () => {
      const result = buildSportsEventJsonLd({
        name: 'Team A vs Team B',
        startDate: '2026-03-15T20:00:00+00:00',
        homeTeam: 'Team A',
        awayTeam: 'Team B',
        location: 'Stadium',
        url: '/matches/123',
      });

      expect(result['@context']).toBe('https://schema.org');
      expect(result['@type']).toBe('SportsEvent');
      expect(result.name).toBe('Team A vs Team B');
      expect(result.homeTeam).toEqual({ '@type': 'SportsTeam', name: 'Team A' });
      expect(result.awayTeam).toEqual({ '@type': 'SportsTeam', name: 'Team B' });
      expect(result.location).toEqual({ '@type': 'Place', name: 'Stadium' });
    });

    it('omits location when not provided', () => {
      const result = buildSportsEventJsonLd({
        name: 'Match',
        homeTeam: 'A',
        awayTeam: 'B',
        url: '/matches/1',
      });

      expect(result.location).toBeUndefined();
      expect(result.startDate).toBeUndefined();
    });
  });

  describe('buildSportsTeamJsonLd', () => {
    it('returns correct schema', () => {
      const result = buildSportsTeamJsonLd({
        name: 'FC Test',
        logo: 'https://example.com/logo.png',
        url: '/teams/fc-test',
      });

      expect(result['@type']).toBe('SportsTeam');
      expect(result.name).toBe('FC Test');
      expect(result.logo).toBe('https://example.com/logo.png');
    });

    it('omits logo when not provided', () => {
      const result = buildSportsTeamJsonLd({
        name: 'FC Test',
        url: '/teams/fc-test',
      });

      expect(result.logo).toBeUndefined();
    });
  });

  describe('buildPersonJsonLd', () => {
    it('returns correct schema with team', () => {
      const result = buildPersonJsonLd({
        name: 'Player One',
        image: 'https://example.com/player.jpg',
        teamName: 'FC Test',
        url: '/players/1',
      });

      expect(result['@type']).toBe('Person');
      expect(result.name).toBe('Player One');
      expect(result.image).toBe('https://example.com/player.jpg');
      expect(result.memberOf).toEqual({ '@type': 'SportsTeam', name: 'FC Test' });
    });

    it('omits optional fields', () => {
      const result = buildPersonJsonLd({
        name: 'Player One',
        url: '/players/1',
      });

      expect(result.image).toBeUndefined();
      expect(result.memberOf).toBeUndefined();
    });
  });
});
