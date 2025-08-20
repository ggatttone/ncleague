import { useEffect } from 'react';
import { useThemeContext } from './ThemeProvider';

export const DynamicTitle = () => {
  const { theme } = useThemeContext();

  useEffect(() => {
    // TODO: Il nome dell'app potrebbe essere aggiunto all'oggetto del tema in futuro.
    const appName = "NCL App"; // Nome predefinito dell'app
    
    if (appName) {
      document.title = appName;
    }
  }, [theme]); // Si aggiorna se il tema cambia

  return null;
};