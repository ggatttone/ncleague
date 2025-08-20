import { useEffect } from 'react';
import { useThemeContext } from './ThemeProvider';
import { useTranslation } from 'react-i18next';

export const DynamicTitle = () => {
  const { theme } = useThemeContext();
  const { t } = useTranslation();

  useEffect(() => {
    const appName = t('components.dynamicTitle.appName');
    
    if (appName) {
      document.title = appName;
    }
  }, [theme, t]);

  return null;
};