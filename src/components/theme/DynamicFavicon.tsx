import { useEffect } from 'react';
import { useThemeContext } from './ThemeProvider';

const getMimeType = (url: string): string | undefined => {
  if (!url) return undefined;
  const extension = url.split('.').pop()?.toLowerCase();
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
    
    if (favicon && theme?.logo_url) {
      favicon.href = theme.logo_url;
      const mimeType = getMimeType(theme.logo_url);
      if (mimeType) {
        favicon.type = mimeType;
      } else {
        // Rimuovi l'attributo type se non è riconosciuto per lasciare che il browser decida
        favicon.removeAttribute('type');
      }
    }
  }, [theme]);

  // Questo componente non renderizza nulla a schermo
  return null;
};