import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from './client';

// Define possible roles
type UserRole = 'admin' | 'editor' | 'player' | 'captain';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: UserRole | null;
  profile: { id: string; first_name?: string; last_name?: string; avatar_url?: string; role: UserRole } | null;
  signOut: () => Promise<void>;
  hasPermission: (requiredRoles: UserRole[], teamId?: string) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  role: null,
  profile: null,
  signOut: async () => {},
  hasPermission: () => false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<AuthContextType['profile']>(null);
  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const fetchSessionAndProfile = async () => {
      setLoading(true);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Error fetching session:", sessionError);
        setSession(null);
        setUser(null);
        setProfile(null);
        setRole(null);
        setLoading(false);
        return;
      }

      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();

        if (profileError && profileError.code === 'PGRST116') {
          const { count: adminCount, error: countError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'admin');

          if (countError) {
            console.error("Error checking for admins:", countError);
            setLoading(false);
            return;
          }

          const newRole = (adminCount === 0) ? 'admin' : 'player';

          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({ 
              id: currentUser.id, 
              role: newRole, 
              first_name: currentUser.user_metadata?.first_name, 
              last_name: currentUser.user_metadata?.last_name 
            })
            .select()
            .single();
          
          if (insertError) {
            console.error("Error creating profile:", insertError);
          } else {
            profileData = newProfile;
          }
        } else if (profileError) {
          console.error("Error fetching profile:", profileError);
        }

        setProfile(profileData as AuthContextType['profile']);
        setRole(profileData?.role || null);

      } else {
        setProfile(null);
        setRole(null);
      }
      setLoading(false);
    };

    fetchSessionAndProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      fetchSessionAndProfile();
    });

    return () => subscription.unsubscribe();
  }, []);

  const hasPermission = (requiredRoles: UserRole[], teamId?: string) => {
    if (!user || !role) return false;

    if (role === 'admin') return true;

    if (requiredRoles.includes(role)) {
      if (role === 'captain' && teamId) {
        return true;
      }
      return true;
    }
    return false;
  };

  const value = {
    user,
    session,
    loading,
    role,
    profile,
    signOut: async () => {
      await supabase.auth.signOut();
    },
    hasPermission,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};