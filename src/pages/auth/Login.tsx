import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/lib/supabase/client';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/supabase/auth-context';

const Login = () => {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Admin Login</h2>
          <p className="mt-2 text-sm text-gray-600">
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
                  brand: '#000000',
                  brandAccent: '#333333',
                }
              }
            }
          }}
          providers={[]}
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
            }
          }}
        />
      </div>
    </div>
  );
};

export default Login;