import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const GUEST = { user_id: "guest", name: "Guest Trainer", email: "guest@cygnusrift.io", role: "guest", picture: null, isGuest: true };

export function formatApiError(detail) {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).filter(Boolean).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    if (localStorage.getItem("guest") === "true") {
      setUser(GUEST);
      setLoading(false);
      return;
    }
    try {
      const res = await api.get("/auth/me");
      if (localStorage.getItem("guest") === "true") return;
      setUser(res.data);
    } catch {
      if (localStorage.getItem("guest") === "true") return;
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (window.location.hash?.includes("session_id=")) {
      setLoading(false);
      return;
    }
    checkAuth();
  }, [checkAuth]);

  const persist = (data) => {
    if (data.token) localStorage.setItem("session_token", data.token);
    localStorage.removeItem("guest");
    setUser(data);
    return data;
  };

  const login = async (email, password) => persist((await api.post("/auth/login", { email, password })).data);
  const register = async (payload) => persist((await api.post("/auth/register", payload)).data);
  const forgotPassword = async (email) => (await api.post("/auth/forgot-password", { email })).data;
  const verifyCode = async (email, code) => (await api.post("/auth/verify-code", { email, code })).data;
  const resetPassword = async (email, code, password) => (await api.post("/auth/reset-password", { email, code, password })).data;

  const loginAsGuest = () => { localStorage.setItem("guest", "true"); setUser(GUEST); };

  const logout = async () => {
    if (!user?.isGuest) { try { await api.post("/auth/logout"); } catch {} }
    localStorage.removeItem("guest");
    localStorage.removeItem("session_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, checkAuth, login, register, forgotPassword, verifyCode, resetPassword, loginAsGuest, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
