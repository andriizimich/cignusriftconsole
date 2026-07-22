import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const hash = window.location.hash;
    const match = hash.match(/session_id=([^&]+)/);
    const sessionId = match ? match[1] : null;

    const run = async () => {
      if (!sessionId) {
        navigate("/login");
        return;
      }
      try {
        const res = await api.post("/auth/session", null, {
          headers: { "X-Session-ID": sessionId },
        });
        if (res.data.session_token) {
          localStorage.setItem("session_token", res.data.session_token);
        }
        localStorage.removeItem("guest");
        setUser(res.data);
        window.history.replaceState(null, "", "/dashboard");
        navigate("/dashboard", { state: { user: res.data } });
      } catch {
        navigate("/login");
      }
    };
    run();
  }, [navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505]">
      <div className="text-center" data-testid="auth-callback-loading">
        <div className="h-10 w-10 mx-auto rounded-full border-2 border-[#0066FF] border-t-transparent animate-spin" />
        <p className="mt-4 text-zinc-500 text-xs uppercase tracking-[0.3em]">Establishing link</p>
      </div>
    </div>
  );
}
