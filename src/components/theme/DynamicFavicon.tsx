import { useEffect } from 'react';
import { useThemeContext } from './ThemeProvider';

export const DynamicFavicon = () => {
  const { theme } = useThemeContext();

  useEffect(() => {
    const favicon = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    
    // Se abbiamo un favicon e un logo_url nel tema, aggiorniamo l'href
    if (favicon && theme?.logo_url) {
      favicon.href = theme.logo_url;
    }
  }, [theme]);

  // Questo componente non renderizza nulla a schermo
  return null;
};