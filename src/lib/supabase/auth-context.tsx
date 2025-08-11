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
      setUser(session?.user ?? null);

      if (session?.user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError);
          setProfile(null);
          setRole(null);
        } else {
          setProfile(profileData);
          setRole(profileData.role);
        }
      } else {
        setProfile(null);
        setRole(null);
      }
      setLoading(false);
    };

    fetchSessionAndProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      fetchSessionAndProfile(); // Re-fetch session and profile on auth state change
    });

    return () => subscription.unsubscribe();
  }, []);

  const hasPermission = (requiredRoles: UserRole[], teamId?: string) => {
    if (!user || !role) return false;

    // Admin has all permissions
    if (role === 'admin') return true;

    // Check if user's role is in the required roles
    if (requiredRoles.includes(role)) {
      // Special handling for Captain role
      if (role === 'captain' && teamId) {
        // Check if the current user is the captain of the specified team
        // This requires fetching the team's captain_id and comparing it to the player_id linked to the user
        // For simplicity in this context, we'll assume the profile has enough info or rely on RLS
        // A more robust check would involve another Supabase query here or pre-fetching captained teams
        // For now, we'll rely on RLS to enforce this on the backend.
        // The frontend check will primarily be based on the role itself.
        // The RLS policies are designed to handle the specific team ownership for captains.
        return true; // If role is captain and it's a captain-specific action, let RLS handle team ownership
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
    signOut: () => supabase.auth.signOut(),
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