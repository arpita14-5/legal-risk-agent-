import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client.js';
import type { User } from '../types/index.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: 'user' | 'admin') => Promise<void>;
  quickDemoLogin: (role?: 'user' | 'admin') => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('lexguard_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('lexguard_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function checkAuth() {
      if (token) {
        try {
          const res = await api.get<{ user: User }>('/auth/me');
          setUser(res.data.user);
          localStorage.setItem('lexguard_user', JSON.stringify(res.data.user));
        } catch {
          logout();
        }
      }
      setIsLoading(false);
    }
    checkAuth();
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await api.post<{ user: User; token: string }>('/auth/login', { email, password });
    setUser(res.data.user);
    setToken(res.data.token);
    localStorage.setItem('lexguard_token', res.data.token);
    localStorage.setItem('lexguard_user', JSON.stringify(res.data.user));
  };

  const register = async (name: string, email: string, password: string, role?: 'user' | 'admin') => {
    const res = await api.post<{ user: User; token: string }>('/auth/register', { name, email, password, role });
    setUser(res.data.user);
    setToken(res.data.token);
    localStorage.setItem('lexguard_token', res.data.token);
    localStorage.setItem('lexguard_user', JSON.stringify(res.data.user));
  };

  const quickDemoLogin = async (role: 'user' | 'admin' = 'user') => {
    const email = role === 'admin' ? 'admin@lexguard.ai' : 'counsel@lexguard.ai';
    await login(email, 'password123');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('lexguard_token');
    localStorage.removeItem('lexguard_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, quickDemoLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}