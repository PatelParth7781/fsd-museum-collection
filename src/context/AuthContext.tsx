import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import api from '@/lib/api';
import type { Profile, UserRole } from '@/types';

export interface UserSession {
  id: string;
  email: string;
  full_name?: string;
  role?: UserRole;
  [key: string]: any;
}

export interface Session {
  user: UserSession;
  token: string;
}

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
  isStaff: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = useCallback(async (token: string) => {
    try {
      const data = await api.get('/auth/me');
      const user = data.user;
      if (user) {
        setSession({ user, token });
        setProfile(user as Profile);
      } else {
        localStorage.removeItem('token');
        setSession(null);
        setProfile(null);
      }
    } catch (err) {
      console.error('Error fetching current user:', err);
      localStorage.removeItem('token');
      setSession(null);
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchCurrentUser(token).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [fetchCurrentUser]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.token) {
        localStorage.setItem('token', res.token);
        setSession({ user: res.user, token: res.token });
        setProfile(res.user as Profile);
        return { error: null };
      }
      return { error: 'Failed to sign in' };
    } catch (err: any) {
      return { error: err.message || 'Login failed' };
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    try {
      const res = await api.post('/auth/register', {
        email,
        password,
        full_name: fullName,
      });
      if (res.token) {
        localStorage.setItem('token', res.token);
        setSession({ user: res.user, token: res.token });
        setProfile(res.user as Profile);
      }
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Sign up failed' };
    }
  }, []);

  const signOut = useCallback(async () => {
    localStorage.removeItem('token');
    setProfile(null);
    setSession(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (token) {
      await fetchCurrentUser(token);
    }
  }, [fetchCurrentUser]);

  const hasRole = useCallback((role: UserRole) => profile?.role === role, [profile]);

  const value: AuthContextValue = {
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    hasRole,
    isStaff: profile?.role === 'admin' || profile?.role === 'curator',
    isAdmin: profile?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
