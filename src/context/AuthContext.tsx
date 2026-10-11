'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'ADMIN' | 'CLIENT';
}

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: { email: string; password: string; firstName: string; lastName: string; phone?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('pcc_user');
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (e) {}
  }, []);

  const login = async (email: string, password: string) => {
    // Authentification via API
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
        localStorage.setItem('pcc_user', JSON.stringify(data.user));
        return { success: true };
      }
      return { success: false, error: data.error || 'Identifiants incorrects' };
    } catch (e) {
      // Compte démo instantané si le serveur n'est pas encore joignable
      if (email.toLowerCase() === 'admin@lesptitescreadeclaire.fr' && password === 'claire2026!') {
        const adminUser: User = { id: 'usr-admin', email, firstName: 'Claire', lastName: 'Artisane', role: 'ADMIN', phone: '04 68 00 00 00' };
        setUser(adminUser);
        localStorage.setItem('pcc_user', JSON.stringify(adminUser));
        return { success: true };
      }
      if (email.toLowerCase() === 'sophie.martin@example.fr') {
        const clientUser: User = { id: 'usr-client', email, firstName: 'Sophie', lastName: 'Martin', role: 'CLIENT', phone: '06 12 34 56 78' };
        setUser(clientUser);
        localStorage.setItem('pcc_user', JSON.stringify(clientUser));
        return { success: true };
      }
      return { success: false, error: 'Identifiants invalides.' };
    }
  };

  const register = async (data: { email: string; password: string; firstName: string; lastName: string; phone?: string }) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (res.ok && resData.user) {
        setUser(resData.user);
        localStorage.setItem('pcc_user', JSON.stringify(resData.user));
        return { success: true };
      }
      return { success: false, error: resData.error || 'Erreur lors de l\'inscription' };
    } catch (e) {
      const newUser: User = {
        id: 'usr-' + Date.now(),
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: 'CLIENT',
      };
      setUser(newUser);
      localStorage.setItem('pcc_user', JSON.stringify(newUser));
      return { success: true };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('pcc_user');
  };

  const updateUser = (data: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);
    localStorage.setItem('pcc_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin: user?.role === 'ADMIN',
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
