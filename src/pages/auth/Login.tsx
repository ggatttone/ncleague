import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/lib/supabase/client';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/supabase/auth-context';
import { useThemeContext } from '@/components/theme/ThemeProvider';
import { useMode } from '@/components/theme/ModeProvider';
import { useEffect, useState } from 'react';

const Login = () => {
  const { user } = useAuth();
  const { theme: appTheme } = useThemeContext();
  const { theme: mode } = useMode();
  const [effectiveMode, setEffectiveMode] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const resolveSystemTheme = () => {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

    setEffectiveMode(mode === 'system' ? resolveSystemTheme() : mode);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (mode === 'system') {
        setEffectiveMode(resolveSystemTheme());
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mode]);

  if (user) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8 p-8 bg-card rounded-xl shadow-lg border">
        <div className="text-center">
          {appTheme?.logo_url ? (
            <Link to="/">
              <img src={appTheme.logo_url} alt="Logo" className="mx-auto h-12 mb-6" />
            </Link>
          ) : (
            <h2 className="text-3xl font-bold text-card-foreground">Admin Login</h2>
          )}
          <p className="mt-2 text-sm text-muted-foreground">
            Accedi per gestire la piattaforma
          </p>
        </div>
        
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: appTheme?.primary_color || '#09090b',
                  brandAccent: appTheme?.secondary_color || '#64748b',
                }
              }
            }
          }}
          providers={[]}
          theme={effectiveMode}
          localization={{
            variables: {
              sign_in: {
                email_label: 'Email',
                password_label: 'Password',
                button_label: 'Accedi',
                loading_button_label: 'Accesso in corso...',
                link_text: 'Hai già un account? Accedi',
              },
              sign_up: {
                email_label: 'Email',
                password_label: 'Password',
                button_label: 'Registrati',
                loading_button_label: 'Registrazione in corso...',
                link_text: 'Non hai un account? Registrati',
              },
              forgotten_password: {
                email_label: 'Email',
                password_label: 'Password',
                button_label: 'Invia istruzioni',
                loading_button_label: 'Invio in corso...',
                link_text: 'Password dimenticata?',
              }
            }
          }}
        />
      </div>
    </div>
  );
};

export default Login;