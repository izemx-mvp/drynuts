import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const KEY = "drynuts.auth.v1";

export const DEMO_EMAIL = "admin@drynuts.ma";
export const DEMO_PASSWORD = "demo1234";

interface AuthCtx {
  user: { email: string; name: string } | null;
  ready: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthCtx["user"]>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const login = (email: string, password: string) => {
    if (email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD) {
      const u = { email: DEMO_EMAIL, name: "Admin DryNuts" };
      setUser(u);
      window.localStorage.setItem(KEY, JSON.stringify(u));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    window.localStorage.removeItem(KEY);
  };

  return <Ctx.Provider value={{ user, ready, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
