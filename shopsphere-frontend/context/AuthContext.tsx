"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { apiLogin } from "@/lib/api";
import { clearAuth, getToken, getUser, saveAuth } from "@/lib/storage";

type User = { id: number; name: string; role: "admin" | "customer" };

type AuthCtx = {
  token: string | null;
  user: User | null;
  isAdmin: boolean;
  requireToken: () => string; 
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setToken(getToken());
    setUser(getUser());
  }, []);

  async function login(email: string, password: string) {
    const data = await apiLogin({ email, password });
    saveAuth(data.token, data.user);
    setToken(data.token);
    setUser(data.user);
  }

  function logout() {
    clearAuth();
    setToken(null);
    setUser(null);
  }

  function requireToken() {
    if (!token) throw new Error("Missing token. Please login again.");
    return token;
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAdmin: user?.role === "admin",
        requireToken,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
