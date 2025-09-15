'use client';

import React, { createContext, useState, useEffect } from 'react';
import type { User } from './types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (user: User) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
});

// This is a server-side "session" store for the demo.
// In a real app, this would be a secure, server-side session management system.
let currentUser: User | null = null;
export async function getCurrentUser(): Promise<User | null> {
    return currentUser;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, you'd fetch the user session from an API or cookie.
    // Here we use sessionStorage to persist the "logged-in" state across reloads.
    try {
      const storedUser = sessionStorage.getItem('lead-trak-user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        currentUser = parsedUser;
      }
    } catch (error) {
      console.error("Could not parse user from sessionStorage", error);
    }
    setLoading(false);
  }, []);

  const login = (user: User) => {
    setUser(user);
    currentUser = user;
    sessionStorage.setItem('lead-trak-user', JSON.stringify(user));
  };

  const logout = () => {
    setUser(null);
    currentUser = null;
    sessionStorage.removeItem('lead-trak-user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
