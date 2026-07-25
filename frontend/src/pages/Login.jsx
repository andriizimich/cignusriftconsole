import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { useAuth, formatApiError } from "@/context/AuthContext";
import { AuthShell, GoogleButton, inputCls, labelCls } from "@/components/AuthShell";

export default function Login() {
  const navigate = useNavigate();
  const { login, loginAsGuest } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (e2) {
      setErr(formatApiError(e2.response?.data?.detail) || e2.message);
    } finally { setBusy(false); }
  };

  const guest = () => { loginAsGuest(); navigate("/dashboard"); };

  return (
    <AuthShell>
      <p className="mb-3 text-xs uppercase tracking-[0.3em] text-zinc-500">Control Deck</p>
      <h1 className="mb-2 font-display text-3xl font-light tracking-tighter">Welcome back</h1>
      <p className="mb-8 text-sm text-zinc-500">Sign in to your Cygnus Rift console.</p>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className={labelCls}>Email</label>
          <div className="relative"><Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" /><input data-testid="login-email-input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={`${inputCls} pl-9`} placeholder="you@company.com" /></div>
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className={labelCls + " mb-0"}>Password</label>
            <Link data-testid="forgot-password-link" to="/forgot-password" className="text-[11px] text-[#0066FF] hover:underline">Forgot password?</Link>
          </div>
          <div className="relative"><Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" /><input data-testid="login-password-input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputCls} pl-9`} placeholder="••••••••" /></div>
        </div>
        {err && <p data-testid="login-error" className="text-xs text-[#FF3366]">{err}</p>}
        <button data-testid="login-submit-button" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-md bg-[#0066FF] py-3 font-medium text-white transition-transform active:scale-[0.98] hover:bg-[#0066FF]/90 disabled:opacity-60">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Sign in <ArrowRight className="h-4 w-4" /></>}
        </button>
      </form>

      <div className="my-6 flex items-center gap-4"><div className="h-px flex-1 bg-white/10" /><span className="text-[10px] uppercase tracking-[0.3em] text-zinc-600">or</span><div className="h-px flex-1 bg-white/10" /></div>
      <GoogleButton />

      <p className="mt-8 text-center text-sm text-zinc-500">
        No account? <Link data-testid="go-register-link" to="/register" className="text-[#0066FF] hover:underline">Create one</Link>
      </p>
      <button data-testid="guest-login-button" onClick={guest} className="mt-3 w-full text-center text-xs text-zinc-600 transition-colors hover:text-zinc-300">Explore as guest →</button>
    </AuthShell>
  );
}
