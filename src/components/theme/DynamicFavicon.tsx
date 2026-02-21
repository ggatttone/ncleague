import { useEffect } from 'react';
import { useThemeContext } from './ThemeProvider';

const DEFAULT_FAVICON_HREF = '/favicon.ico?v=20260221-1';
const DEFAULT_FAVICON_TYPE = 'image/x-icon';
const RASTER_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/gif']);

const getMimeType = (url: string): string | undefined => {
  if (!url) return undefined;
  const cleanUrl = url.split('#')[0].split('?')[0];
  const extension = cleanUrl.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'png':
      return 'image/png';
    case 'svg':
      return 'image/svg+xml';
    case 'ico':
      return 'image/x-icon';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'gif':
      return 'image/gif';
    default:
      return undefined;
  }
};

const setFavicon = (favicon: HTMLLinkElement, href: string, type?: string) => {
  favicon.href = href;
  if (type) {
    favicon.type = type;
  } else {
    favicon.removeAttribute('type');
  }
};

export const DynamicFavicon = () => {
  const { theme } = useThemeContext();

  useEffect(() => {
    const favicon = document.getElementById('dynamic-favicon') as HTMLLinkElement | null;

    if (!favicon) {
      return;
    }

    const setDefaultFavicon = () => {
      setFavicon(favicon, DEFAULT_FAVICON_HREF, DEFAULT_FAVICON_TYPE);
    };

    // Always start from a known-good local favicon.
    setDefaultFavicon();

    const themeLogoUrl = theme?.logo_url?.trim();
    if (!themeLogoUrl) {
      return;
    }

    const mimeType = getMimeType(themeLogoUrl);
    if (!mimeType) {
      setFavicon(favicon, themeLogoUrl);
      return;
    }

    if (!RASTER_MIME_TYPES.has(mimeType)) {
      setFavicon(favicon, themeLogoUrl, mimeType);
      return;
    }

    let isDisposed = false;
    const image = new Image();

    image.onload = () => {
      if (isDisposed) {
        return;
      }

      // Some browsers ignore non-square raster favicons; keep local fallback for those.
      if (image.naturalWidth > 0 && image.naturalWidth === image.naturalHeight) {
        setFavicon(favicon, themeLogoUrl, mimeType);
      }
    };

    image.onerror = () => {
      if (!isDisposed) {
        setDefaultFavicon();
      }
    };

    image.src = themeLogoUrl;

    return () => {
      isDisposed = true;
    };
  }, [theme?.logo_url]);

  return null;
};
