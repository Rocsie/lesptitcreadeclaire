'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/paths';
import type { User } from '@/lib/types';

export type { User };

type Result = { success: boolean; error?: string; user?: User };

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<Result>;
  register: (data: { email: string; password: string; firstName: string; lastName: string; phone?: string }) => Promise<Result>;
  logout: () => Promise<void>;
  updateProfile: (data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    currentPassword?: string;
    newPassword?: string;
  }) => Promise<Result>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const NETWORK_ERROR = 'Connexion au serveur impossible. Vérifiez votre connexion internet et réessayez.';

async function send(path: string, method: string, body?: unknown): Promise<Result> {
  try {
    const res = await apiFetch(path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.user) return { success: true, user: data.user as User };
    return { success: false, error: data.error || 'Une erreur est survenue.' };
  } catch {
    return { success: false, error: NETWORK_ERROR };
  }
}

// La session vit dans un cookie httpOnly posé par le serveur.
// Le compte connecté est lu côté serveur et fourni dès le premier rendu (initialUser).
export function AuthProvider({ initialUser, children }: { initialUser: User | null; children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(initialUser);

  // Nettoyage : les anciennes versions du site gardaient le compte dans le navigateur.
  useEffect(() => {
    try {
      window.localStorage.removeItem('pcc_user');
    } catch {
      // stockage indisponible
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await send('/api/auth/login', 'POST', { email, password });
    if (result.user) setUser(result.user);
    return result;
  }, []);

  const register = useCallback<AuthContextType['register']>(async (data) => {
    const result = await send('/api/auth/register', 'POST', data);
    if (result.user) setUser(result.user);
    return result;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // même hors ligne, on efface le compte affiché
    }
    setUser(null);
  }, []);

  const updateProfile = useCallback<AuthContextType['updateProfile']>(async (data) => {
    const result = await send('/api/auth/me', 'PUT', data);
    if (result.user) setUser(result.user);
    return result;
  }, []);

  const value = useMemo(
    () => ({ user, isAdmin: user?.role === 'ADMIN', login, register, logout, updateProfile }),
    [user, login, register, logout, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
