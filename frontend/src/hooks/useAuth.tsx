import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { authApi, type AuthUser } from '@/components/Login-register/authApi';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  // NEW: re-fetch /auth/me and update the in-memory user.
  refresh: () => Promise<AuthUser | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    authApi
      .me()
      .then((me) => {
        if (!cancelled) setUser(me);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const me = await authApi.login(username.trim(), password);
    setUser(me);
  }, []);

  const signup = useCallback(async (username: string, email: string, password: string) => {
    await authApi.signup({ username: username.trim(), email: email.trim(), password });
    // Backend does not auto-login on signup — caller switches to login view.
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  }, []);

  // Re-fetch the current user. Returns the user (or null) so callers can
  // optionally await the updated object.
  const refresh = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const me = await authApi.me();
      setUser(me);
      return me;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}