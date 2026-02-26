import { getSiteUrl } from './site-config';

function toAbsolute(path: string | undefined): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;
  return `${getSiteUrl()}${path}`;
}

export function buildArticleJsonLd(params: {
  title: string;
  description?: string;
  image?: string;
  publishedAt?: string;
  authorName?: string;
  url: string;
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: params.title,
    ...(params.description && { description: params.description }),
    ...(params.image && { image: toAbsolute(params.image) }),
    ...(params.publishedAt && { datePublished: params.publishedAt }),
    ...(params.authorName && { author: { '@type': 'Person', name: params.authorName } }),
    url: toAbsolute(params.url),
    publisher: { '@type': 'Organization', name: 'NC League' },
  };
}

export function buildSportsEventJsonLd(params: {
  name: string;
  startDate?: string;
  homeTeam: string;
  awayTeam: string;
  location?: string;
  url: string;
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: params.name,
    ...(params.startDate && { startDate: params.startDate }),
    homeTeam: { '@type': 'SportsTeam', name: params.homeTeam },
    awayTeam: { '@type': 'SportsTeam', name: params.awayTeam },
    ...(params.location && { location: { '@type': 'Place', name: params.location } }),
    url: toAbsolute(params.url),
  };
}

export function buildSportsTeamJsonLd(params: {
  name: string;
  logo?: string;
  url: string;
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'SportsTeam',
    name: params.name,
    ...(params.logo && { logo: toAbsolute(params.logo) }),
    url: toAbsolute(params.url),
  };
}

export function buildPersonJsonLd(params: {
  name: string;
  image?: string;
  teamName?: string;
  url: string;
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: params.name,
    ...(params.image && { image: toAbsolute(params.image) }),
    ...(params.teamName && { memberOf: { '@type': 'SportsTeam', name: params.teamName } }),
    url: toAbsolute(params.url),
  };
}
