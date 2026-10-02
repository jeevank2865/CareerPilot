import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured, dataService, getLocalProfile } from '../lib/supabase';
import { UserProfile } from '../types/database';

export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

interface AuthContextType {
  user: AuthUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isConfigured: boolean;
  isDemoMode: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null; needsEmailConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<UserProfile>;
  uploadAvatar: (file: File) => Promise<string>;
  loginAsDemo: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER: AuthUser = {
  id: 'demo-user-1',
  email: 'jeevan.k@example.com',
  user_metadata: {
    full_name: 'Jeevan Kumar',
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const configured = isSupabaseConfigured();

  // Load initial session
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        if (configured && supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && mounted) {
            const authUser: AuthUser = {
              id: session.user.id,
              email: session.user.email || '',
              user_metadata: session.user.user_metadata,
            };
            setUser(authUser);
            setIsDemoMode(false);
            const prof = await dataService.getProfile(session.user.id);
            if (mounted) setProfile(prof);
          } else if (mounted) {
            // Check if demo session was saved
            const savedDemo = localStorage.getItem('active_demo_session');
            if (savedDemo === 'true') {
              setUser(DEMO_USER);
              setIsDemoMode(true);
              setProfile(getLocalProfile());
            } else {
              setUser(null);
            }
          }
        } else if (mounted) {
          // In local/demo mode without live credentials, default to authenticated demo user so app is immediately testable
          const savedDemo = localStorage.getItem('active_demo_session');
          if (savedDemo !== 'false') {
            setUser(DEMO_USER);
            setIsDemoMode(true);
            setProfile(getLocalProfile());
          } else {
            setUser(null);
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    // Listen for Supabase auth state changes if configured
    let subscription: { unsubscribe: () => void } | null = null;
    if (configured && supabase) {
      const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (!mounted) return;
        if (session?.user) {
          const authUser: AuthUser = {
            id: session.user.id,
            email: session.user.email || '',
            user_metadata: session.user.user_metadata,
          };
          setUser(authUser);
          setIsDemoMode(false);
          localStorage.removeItem('active_demo_session');
          const prof = await dataService.getProfile(session.user.id);
          setProfile(prof);
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      });
      subscription = data.subscription;
    }

    return () => {
      mounted = false;
      if (subscription) subscription.unsubscribe();
    };
  }, [configured]);

  const signIn = async (email: string, password: string): Promise<{ error: Error | null }> => {
    if (configured && supabase) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error ? new Error(error.message) : null };
    }

    // Local mode signIn
    setUser({
      id: 'local-' + btoa(email).substring(0, 8),
      email,
      user_metadata: { full_name: email.split('@')[0] },
    });
    setIsDemoMode(true);
    localStorage.setItem('active_demo_session', 'true');
    setProfile({
      id: 'local-' + btoa(email).substring(0, 8),
      user_id: 'local-' + btoa(email).substring(0, 8),
      full_name: email.split('@')[0],
      email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    return { error: null };
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string
  ): Promise<{ error: Error | null; needsEmailConfirmation?: boolean }> => {
    if (configured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) return { error: new Error(error.message) };
      
      const needsEmailConfirmation = !data.session && Boolean(data.user);
      return { error: null, needsEmailConfirmation };
    }

    // Local mode signup
    const newId = 'local-' + Date.now();
    const newUser: AuthUser = {
      id: newId,
      email,
      user_metadata: { full_name: fullName },
    };
    setUser(newUser);
    setIsDemoMode(true);
    localStorage.setItem('active_demo_session', 'true');
    const newProfile: UserProfile = {
      id: newId,
      user_id: newId,
      full_name: fullName,
      email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    dataService.updateProfile(newId, newProfile);
    setProfile(newProfile);
    return { error: null, needsEmailConfirmation: false };
  };

  const signOut = async () => {
    if (configured && supabase) {
      await supabase.auth.signOut();
    }
    localStorage.setItem('active_demo_session', 'false');
    setUser(null);
    setProfile(null);
    setIsDemoMode(false);
  };

  const resetPassword = async (email: string): Promise<{ error: Error | null }> => {
    if (configured && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      return { error: error ? new Error(error.message) : null };
    }
    // Simulation
    return { error: null };
  };

  const updateUserProfile = async (updates: Partial<UserProfile>): Promise<UserProfile> => {
    if (!user) throw new Error('Not logged in');
    const updated = await dataService.updateProfile(user.id, updates);
    setProfile(updated);
    return updated;
  };

  const uploadAvatar = async (file: File): Promise<string> => {
    if (!user) throw new Error('Not logged in');
    const url = await dataService.uploadProfilePhoto(user.id, file);
    await updateUserProfile({ profile_photo_url: url });
    return url;
  };

  const loginAsDemo = () => {
    setUser(DEMO_USER);
    setIsDemoMode(true);
    localStorage.setItem('active_demo_session', 'true');
    setProfile(getLocalProfile());
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isConfigured: configured,
        isDemoMode,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updateUserProfile,
        uploadAvatar,
        loginAsDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
