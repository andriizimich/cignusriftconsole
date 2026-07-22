import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

const GUEST = {
  user_id: "guest",
  name: "Guest Trainer",
  email: "guest@cygnusrift.io",
  picture: null,
  isGuest: true,
};

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
      setUser(res.data);
    } catch {
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

  const loginAsGuest = () => {
    localStorage.setItem("guest", "true");
    setUser(GUEST);
  };

  const logout = async () => {
    if (!user?.isGuest) {
      try { await api.post("/auth/logout"); } catch {}
    }
    localStorage.removeItem("guest");
    localStorage.removeItem("session_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, checkAuth, loginAsGuest, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
