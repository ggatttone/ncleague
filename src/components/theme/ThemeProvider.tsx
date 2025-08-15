import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useTheme } from '@/hooks/use-theme';
import { Theme } from '@/types/database';
import { hexToHsl, getContrastingColor, hslToString } from '@/lib/color-utils';

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

      const primaryHsl = hexToHsl(theme.primary_color);
      const secondaryHsl = hexToHsl(theme.secondary_color);

      const themeCss = `
        @import url('https://fonts.googleapis.com/css2?family=${theme.font_family.replace(/ /g, '+')}:wght@400;500;600;700&display=swap');
        
        :root {
          --font-sans: "${theme.font_family}", sans-serif;

          --background: 0 0% 100%;
          --foreground: ${secondaryHsl.h} ${secondaryHsl.s}% ${Math.max(0, secondaryHsl.l - 40)}%;

          --card: 0 0% 100%;
          --card-foreground: ${secondaryHsl.h} ${secondaryHsl.s}% ${Math.max(0, secondaryHsl.l - 40)}%;

          --popover: 0 0% 100%;
          --popover-foreground: ${secondaryHsl.h} ${secondaryHsl.s}% ${Math.max(0, secondaryHsl.l - 40)}%;

          --primary: ${hslToString(primaryHsl)};
          --primary-foreground: ${getContrastingColor(theme.primary_color)};

          --secondary: ${hslToString(secondaryHsl)};
          --secondary-foreground: ${getContrastingColor(theme.secondary_color)};

          --muted: ${secondaryHsl.h} ${secondaryHsl.s}% 96.1%;
          --muted-foreground: ${secondaryHsl.h} ${secondaryHsl.s}% 40%;

          --accent: ${secondaryHsl.h} ${secondaryHsl.s}% 96.1%;
          --accent-foreground: ${secondaryHsl.h} ${secondaryHsl.s}% 10%;

          --destructive: 0 84.2% 60.2%;
          --destructive-foreground: 210 40% 98%;

          --border: ${secondaryHsl.h} ${secondaryHsl.s}% 91.4%;
          --input: ${secondaryHsl.h} ${secondaryHsl.s}% 91.4%;
          --ring: ${primaryHsl.h} ${primaryHsl.s}% ${primaryHsl.l}%;

          --radius: 0.5rem;
        }

        .dark {
          /* Dark theme can be implemented here */
        }
      `;

      styleElement.innerHTML = themeCss;
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