import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { Mail, KeyRound, Lock, ArrowLeft, Loader2, Check } from "lucide-react";
import { useAuth, formatApiError } from "@/context/AuthContext";
import { AuthShell, inputCls, labelCls } from "@/components/AuthShell";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { forgotPassword, verifyCode, resetPassword } = useAuth();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const wrap = async (fn) => { setBusy(true); setErr(""); try { await fn(); } catch (e) { setErr(formatApiError(e.response?.data?.detail) || e.message); } finally { setBusy(false); } };

  const sendCode = (e) => { e.preventDefault(); wrap(async () => {
    const r = await forgotPassword(email);
    if (r.demo_code) toast.info(`Demo code: ${r.demo_code}`, { description: "No email provider configured — use this code." });
    setStep(2);
  }); };

  const checkCode = (e) => { e.preventDefault(); wrap(async () => { await verifyCode(email, code); setStep(3); }); };

  const doReset = (e) => { e.preventDefault(); if (password !== confirm) { setErr("Passwords do not match"); return; } wrap(async () => { await resetPassword(email, code, password); toast.success("Password updated. Please sign in."); navigate("/login"); }); };

  const Steps = () => (
    <div className="mb-8 flex items-center gap-2" data-testid="reset-steps">
      {[1, 2, 3].map((n) => (
        <div key={n} className="flex flex-1 items-center gap-2">
          <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${step > n ? "bg-[#00FF66] text-black" : step === n ? "bg-[#0066FF] text-white" : "bg-white/5 text-zinc-600"}`}>{step > n ? <Check className="h-3.5 w-3.5" /> : n}</span>
          {n < 3 && <span className={`h-px flex-1 ${step > n ? "bg-[#00FF66]/40" : "bg-white/10"}`} />}
        </div>
      ))}
    </div>
  );

  return (
    <AuthShell>
      <Link to="/login" className="mb-6 inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-white"><ArrowLeft className="h-4 w-4" /> Back to sign in</Link>
      <h1 className="mb-2 font-display text-3xl font-light tracking-tighter">Reset password</h1>
      <p className="mb-8 text-sm text-zinc-500">{step === 1 ? "Enter your email to receive a code." : step === 2 ? "Enter the 6-digit code we sent." : "Choose a new password."}</p>
      <Steps />

      {step === 1 && (
        <form onSubmit={sendCode} className="space-y-4">
          <div><label className={labelCls}>Email</label><div className="relative"><Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" /><input data-testid="reset-email-input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={`${inputCls} pl-9`} placeholder="you@company.com" /></div></div>
          {err && <p data-testid="reset-error" className="text-xs text-[#FF3366]">{err}</p>}
          <button data-testid="send-code-button" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-md bg-[#0066FF] py-3 font-medium text-white active:scale-[0.98] disabled:opacity-60">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send code"}</button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={checkCode} className="space-y-4">
          <div><label className={labelCls}>Verification Code</label><div className="relative"><KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" /><input data-testid="reset-code-input" required value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} className={`${inputCls} pl-9 font-mono-plex tracking-[0.3em]`} placeholder="000000" /></div></div>
          {err && <p data-testid="reset-error" className="text-xs text-[#FF3366]">{err}</p>}
          <button data-testid="verify-code-button" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-md bg-[#0066FF] py-3 font-medium text-white active:scale-[0.98] disabled:opacity-60">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify code"}</button>
          <button type="button" onClick={() => setStep(1)} className="w-full text-center text-xs text-zinc-600 hover:text-zinc-300">Change email</button>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={doReset} className="space-y-4">
          <div><label className={labelCls}>New Password</label><div className="relative"><Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" /><input data-testid="reset-new-password-input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputCls} pl-9`} placeholder="••••••••" /></div></div>
          <div><label className={labelCls}>Confirm Password</label><div className="relative"><Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" /><input data-testid="reset-confirm-password-input" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className={`${inputCls} pl-9`} placeholder="••••••••" /></div></div>
          {err && <p data-testid="reset-error" className="text-xs text-[#FF3366]">{err}</p>}
          <button data-testid="reset-submit-button" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-md bg-[#0066FF] py-3 font-medium text-white active:scale-[0.98] disabled:opacity-60">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}</button>
        </form>
      )}
    </AuthShell>
  );
}
