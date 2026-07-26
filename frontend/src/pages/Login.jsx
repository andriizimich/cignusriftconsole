import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { useAuth, formatApiError } from "@/context/AuthContext";
import { AuthShell, GoogleButton, inputCls, labelCls } from "@/components/AuthShell";
import { Button } from "@/components/base/Button";
import { Heading } from "@/components/base/Heading";

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
      <p className="cr-auth-overline">Control Deck</p>
      <Heading level={1} bare className="cr-auth-h1">Welcome back</Heading>
      <p className="cr-auth-sub">Sign in to your Cygnus Rift console.</p>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className={labelCls}>Email</label>
          <div className="relative"><Mail className="cr-field-icon" /><input data-testid="login-email-input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={`${inputCls} pl-9`} placeholder="you@company.com" /></div>
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className={labelCls + " mb-0"}>Password</label>
            <Link data-testid="forgot-password-link" to="/forgot-password" className="cr-mini-link">Forgot password?</Link>
          </div>
          <div className="relative"><Lock className="cr-field-icon" /><input data-testid="login-password-input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputCls} pl-9`} placeholder="••••••••" /></div>
        </div>
        {err && <p data-testid="login-error" className="cr-error">{err}</p>}
        <Button variant="bare" type="submit" data-testid="login-submit-button" disabled={busy} className="cr-btn-block">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Sign in <ArrowRight className="h-4 w-4" /></>}
        </Button>
      </form>

      <div className="cr-or"><div className="cr-or-line" /><span className="cr-or-text">or</span><div className="cr-or-line" /></div>
      <GoogleButton />

      <p className="cr-muted-center">No account? <Link data-testid="go-register-link" to="/register" className="cr-link-accent">Create one</Link></p>
      <Button variant="bare" data-testid="guest-login-button" onClick={guest} className="cr-guest-link">Explore as guest →</Button>
    </AuthShell>
  );
}
