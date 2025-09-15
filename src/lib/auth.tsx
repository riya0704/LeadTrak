'use client';

import React, { createContext, useState, useEffect, useContext } from 'react';
import type { User } from './types';
import { createBrowserClient } from '@supabase/ssr';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { getOrCreateAppUser } from './actions';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: { email: string }) => Promise<any>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
            try {
                const appUser = await getOrCreateAppUser(session.user);
                setUser(appUser);
            } catch (e) {
                console.error("Failed to get or create app user", e);
                setUser(null);
            }
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );
    
    // Initial check
    supabase.auth.getSession().then(async ({ data: { session }}) => {
        if (session?.user) {
            try {
                const appUser = await getOrCreateAppUser(session.user);
                setUser(appUser);
            } catch(e) {
                console.error("Failed to get or create app user on initial check", e);
                setUser(null);
            }
        }
        setLoading(false);
    });


    return () => {
      subscription?.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (data: { email: string }) => {
    const redirectTo = `${window.location.origin}/auth/callback`;
    return supabase.auth.signInWithOtp({ 
        email: data.email,
        options: {
            emailRedirectTo: redirectTo,
        }
    });
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
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
