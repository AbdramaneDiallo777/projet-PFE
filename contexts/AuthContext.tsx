import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  authLogin,
  authRegister,
  fetchCurrentUser,
  type ApiUser,
  type RegisterPayload,
} from "@/lib/agroconnectApi";
import { clearStoredToken, getStoredToken, setStoredToken } from "@/lib/authStorage";

type AuthContextValue = {
  token: string | null;
  user: ApiUser | null;
  isReady: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<ApiUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    (async () => {
      const t = await getStoredToken();
      setToken(t);
      setIsReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!isReady) return;
    if (!token) {
      setUser(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const u = await fetchCurrentUser(token);
        if (!cancelled) setUser(u);
      } catch {
        if (!cancelled) {
          setUser(null);
          setToken(null);
          await clearStoredToken();
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isReady, token]);

  const login = useCallback(async (email: string, password: string) => {
    const { access_token } = await authLogin(email.trim(), password);
    await setStoredToken(access_token);
    setToken(access_token);
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const { access_token } = await authRegister(payload);
    await setStoredToken(access_token);
    setToken(access_token);
  }, []);

  const logout = useCallback(async () => {
    await clearStoredToken();
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const u = await fetchCurrentUser(token);
      setUser(u);
    } catch {
      setUser(null);
      setToken(null);
      await clearStoredToken();
    }
  }, [token]);

  const value = useMemo(
    () => ({
      token,
      user,
      isReady,
      login,
      register,
      logout,
      refreshUser,
    }),
    [token, user, isReady, login, register, logout, refreshUser]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth doit être utilisé dans un AuthProvider");
  }
  return ctx;
}
