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
    // Use theme data if available, otherwise provide sensible defaults.
    const primaryColor = theme?.primary_color || '#09090b';
    const secondaryColor = theme?.secondary_color || '#64748b';
    const fontFamily = theme?.font_family || 'Inter';

    const styleId = 'dynamic-theme-styles';
    let styleElement = document.getElementById(styleId);
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    const primaryHsl = hexToHsl(primaryColor);
    const secondaryHsl = hexToHsl(secondaryColor);

    const themeCss = `
        @import url('https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, '+')}:wght@400;500;600;700&display=swap');
        
        :root {
          --font-sans: "${fontFamily}", sans-serif;

          --background: 0 0% 100%;
          --foreground: ${secondaryHsl.h} ${secondaryHsl.s}% ${Math.max(0, secondaryHsl.l - 40)}%;

          --card: 0 0% 100%;
          --card-foreground: ${secondaryHsl.h} ${secondaryHsl.s}% ${Math.max(0, secondaryHsl.l - 40)}%;

          --popover: 0 0% 100%;
          --popover-foreground: ${secondaryHsl.h} ${secondaryHsl.s}% ${Math.max(0, secondaryHsl.l - 40)}%;

          --primary: ${hslToString(primaryHsl)};
          --primary-foreground: ${getContrastingColor(primaryColor)};

          --secondary: ${hslToString(secondaryHsl)};
          --secondary-foreground: ${getContrastingColor(secondaryColor)};

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

          /* Sidebar specific variables */
          --sidebar-background: 240 4.8% 98.9%;
          --sidebar-foreground: ${secondaryHsl.h} ${secondaryHsl.s}% ${Math.max(0, secondaryHsl.l - 40)}%;
          --sidebar-primary: ${hslToString(primaryHsl)};
          --sidebar-primary-foreground: ${getContrastingColor(primaryColor)};
          --sidebar-accent: ${secondaryHsl.h} ${secondaryHsl.s}% 94%;
          --sidebar-accent-foreground: ${secondaryHsl.h} ${secondaryHsl.s}% 10%;
          --sidebar-border: ${secondaryHsl.h} ${secondaryHsl.s}% 91.4%;
          --sidebar-ring: ${primaryHsl.h} ${primaryHsl.s}% ${primaryHsl.l}%;
        }

        .dark {
          --background: ${secondaryHsl.h} ${secondaryHsl.s}% 10%;
          --foreground: ${secondaryHsl.h} ${secondaryHsl.s}% 98%;

          --card: ${secondaryHsl.h} ${secondaryHsl.s}% 12%;
          --card-foreground: ${secondaryHsl.h} ${secondaryHsl.s}% 98%;

          --popover: ${secondaryHsl.h} ${secondaryHsl.s}% 10%;
          --popover-foreground: ${secondaryHsl.h} ${secondaryHsl.s}% 98%;

          --primary: ${hslToString(primaryHsl)};
          --primary-foreground: ${getContrastingColor(primaryColor)};

          --secondary: ${hslToString(secondaryHsl)};
          --secondary-foreground: ${getContrastingColor(secondaryColor)};

          --muted: ${secondaryHsl.h} ${secondaryHsl.s}% 15%;
          --muted-foreground: ${secondaryHsl.h} ${secondaryHsl.s}% 65%;

          --accent: ${secondaryHsl.h} ${secondaryHsl.s}% 15%;
          --accent-foreground: ${secondaryHsl.h} ${secondaryHsl.s}% 98%;

          --destructive: 0 62.8% 30.6%;
          --destructive-foreground: 0 0% 98%;

          --border: ${secondaryHsl.h} ${secondaryHsl.s}% 20%;
          --input: ${secondaryHsl.h} ${secondaryHsl.s}% 20%;
          --ring: ${primaryHsl.h} ${primaryHsl.s}% ${primaryHsl.l}%;

          /* Sidebar specific variables for dark mode */
          --sidebar-background: ${secondaryHsl.h} ${secondaryHsl.s}% 8%;
          --sidebar-foreground: ${secondaryHsl.h} ${secondaryHsl.s}% 98%;
          --sidebar-primary: ${hslToString(primaryHsl)};
          --sidebar-primary-foreground: ${getContrastingColor(primaryColor)};
          --sidebar-accent: ${secondaryHsl.h} ${secondaryHsl.s}% 15%;
          --sidebar-accent-foreground: ${secondaryHsl.h} ${secondaryHsl.s}% 98%;
          --sidebar-border: ${secondaryHsl.h} ${secondaryHsl.s}% 18%;
          --sidebar-ring: ${primaryHsl.h} ${primaryHsl.s}% ${primaryHsl.l}%;
        }
      `;

    styleElement.innerHTML = themeCss;
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