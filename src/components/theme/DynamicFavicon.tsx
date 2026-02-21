import { useEffect } from 'react';
import { useThemeContext } from './ThemeProvider';

const DEFAULT_FAVICON_HREF = '/favicon.svg';
const DEFAULT_FAVICON_TYPE = 'image/svg+xml';

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

export const DynamicFavicon = () => {
  const { theme } = useThemeContext();

  useEffect(() => {
    const favicon = document.getElementById('dynamic-favicon') as HTMLLinkElement | null;

    if (!favicon) {
      return;
    }

    const themeLogoUrl = theme?.logo_url?.trim();

    if (themeLogoUrl) {
      favicon.href = themeLogoUrl;
      const mimeType = getMimeType(themeLogoUrl);
      if (mimeType) {
        favicon.type = mimeType;
      } else {
        favicon.removeAttribute('type');
      }
      return;
    }

    favicon.href = DEFAULT_FAVICON_HREF;
    favicon.type = DEFAULT_FAVICON_TYPE;
  }, [theme?.logo_url]);

  return null;
};
