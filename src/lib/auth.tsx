'use client';

import React, { createContext, useState, useEffect, useContext } from 'react';
import type { User } from './types';
import { supabase } from './supabase/client';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

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

// This is a server-side "session" store for the demo.
// In a real app, this would be a secure, server-side session management system.
let currentUser: User | null = null;
export async function getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        return {
            id: user.id,
            name: user.email || 'User',
            role: 'USER', // default role, can be expanded
        }
    }
    return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const getSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const user = session.user;
            setUser({
                id: user.id,
                name: user.email || 'User',
                role: 'USER' // Assign a default role
            });
        }
        setLoading(false);
    };
    
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session) {
          const user = session.user;
          setUser({
            id: user.id,
            name: user.email || 'User',
            role: 'USER'
          });
          router.push('/buyers');
        } else {
          setUser(null);
          router.push('/login');
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [router]);

  const login = async (data: { email: string }) => {
    return supabase.auth.signInWithOtp({ 
        email: data.email,
        options: {
            emailRedirectTo: window.location.origin + '/buyers',
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
