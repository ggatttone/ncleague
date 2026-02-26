import { Helmet } from 'react-helmet-async';
import { getSiteUrl, SUPPORTED_LANGS } from '@/lib/site-config';

interface SEOHeadProps {
  title: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  jsonLd?: Record<string, unknown>;
  noHreflang?: boolean;
}

const APP_NAME = 'NC League';
const DEFAULT_DESCRIPTION = 'Piattaforma completa per la gestione di tornei sportivi';
const DEFAULT_IMAGE = '/icon-512.png';

export const SEOHead = ({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  url,
  type = 'website',
  jsonLd,
  noHreflang,
}: SEOHeadProps) => {
  const fullTitle = `${title} | ${APP_NAME}`;
  const baseUrl = getSiteUrl();
  const absoluteUrl = url ? `${baseUrl}${url}` : undefined;
  const absoluteImage = image?.startsWith('http') ? image : image ? `${baseUrl}${image}` : undefined;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />

      {/* Canonical */}
      {absoluteUrl && <link rel="canonical" href={absoluteUrl} />}

      {/* hreflang */}
      {absoluteUrl && !noHreflang && SUPPORTED_LANGS.map(lang => (
        <link key={lang} rel="alternate" hrefLang={lang} href={absoluteUrl} />
      ))}
      {absoluteUrl && !noHreflang && (
        <link rel="alternate" hrefLang="x-default" href={absoluteUrl} />
      )}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      {absoluteImage && <meta property="og:image" content={absoluteImage} />}
      {absoluteUrl && <meta property="og:url" content={absoluteUrl} />}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {absoluteImage && <meta name="twitter:image" content={absoluteImage} />}

      {/* JSON-LD */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
};
