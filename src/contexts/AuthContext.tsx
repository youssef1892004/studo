// File path: src/contexts/AuthContext.tsx
'use client';

import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { User, Subscription } from '@/lib/types';

// --- START: Define the shape of the context data ---
interface AuthContextType {
  user: User | null;
  token: string | null;
  subscription: Subscription | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshSubscription: () => Promise<void>;
}
// --- END: Define the shape of the context data ---

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSubscription = async () => {
    const currentToken = localStorage.getItem('token');
    if (!currentToken) return;

    try {
      const res = await fetch('/api/user/subscription', {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      if (res.ok) {
        const { subscription: subData } = await res.json();
        console.log("Subscription data:", subData);
        setSubscription(subData);
      }
    } catch (error) {
      console.error("Failed to refresh subscription:", error);
      setSubscription(null);
    }
  };

  useEffect(() => {
    const loadAuthData = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');
        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
          // Fetch subscription data after loading user
          await refreshSubscription();
        }
      } catch (error) {
        console.error("Failed to parse auth data from localStorage", error);
        localStorage.clear();
      } finally {
        setIsLoading(false);
      }
    };
    loadAuthData();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'فشل تسجيل الدخول.');
    }

    const userData: User = data.user;
    const userToken: string = data.accessToken; // FIX: API returns accessToken, not token

    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', userToken);
    
    setUser(userData);
    setToken(userToken);

    // Fetch subscription after logging in
    await refreshSubscription();
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
    setSubscription(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, subscription, isLoading, login, logout, refreshSubscription }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

