import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useTheme } from '@/hooks/use-theme';
import { Theme } from '@/types/database';

interface ThemeContextType {
  theme: Theme | null | undefined;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: null,
  isLoading: true,
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const { data: theme, isLoading } = useTheme();

  useEffect(() => {
    if (theme) {
      const styleId = 'dynamic-theme-styles';
      let styleElement = document.getElementById(styleId);
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
      }

      styleElement.innerHTML = `
        @import url('https://fonts.googleapis.com/css2?family=${theme.font_family.replace(/ /g, '+')}:wght@400;500;600;700&display=swap');
        
        :root {
          --font-sans: "${theme.font_family}", sans-serif;
          --brand-primary: ${theme.primary_color};
          --brand-secondary: ${theme.secondary_color};
        }
      `;
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};