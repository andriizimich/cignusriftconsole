import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GraduationCap, Presentation, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth, formatApiError } from "@/context/AuthContext";
import { AuthShell, GoogleButton, inputCls, labelCls } from "@/components/AuthShell";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [role, setRole] = useState("student");
  const [specs, setSpecs] = useState({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [f, setF] = useState({ name: "", email: "", password: "", confirm: "", phone: "", specialization: "", accept_terms: false });

  useEffect(() => { api.get("/auth/specializations").then((r) => setSpecs(r.data)); }, []);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    if (f.password !== f.confirm) { setErr("Passwords do not match"); return; }
    if (!f.accept_terms) { setErr("Please accept the terms to continue"); return; }
    if (role === "teacher" && !f.specialization) { setErr("Please select your specialization"); return; }
    setBusy(true);
    try {
      await register({ name: f.name, email: f.email, password: f.password, role, phone: f.phone, specialization: role === "teacher" ? f.specialization : null, accept_terms: f.accept_terms });
      navigate("/dashboard");
    } catch (e2) {
      setErr(formatApiError(e2.response?.data?.detail) || e2.message);
    } finally { setBusy(false); }
  };

  const Tab = ({ value, icon: Icon, label }) => (
    <button type="button" data-testid={`role-tab-${value}`} onClick={() => setRole(value)} className={`flex flex-1 items-center justify-center gap-2 rounded-md border px-4 py-3 text-sm transition-colors ${role === value ? "border-[#0066FF] bg-[#0066FF]/10 text-white" : "border-white/10 text-zinc-500 hover:text-white"}`}>
      <Icon className="h-4 w-4" /> {label}
    </button>
  );

  return (
    <AuthShell>
      <p className="mb-3 text-xs uppercase tracking-[0.3em] text-zinc-500">Get started</p>
      <h1 className="mb-2 font-display text-3xl font-light tracking-tighter">Create account</h1>
      <p className="mb-6 text-sm text-zinc-500">Choose your role to continue.</p>

      <div className="mb-6 flex gap-3">
        <Tab value="student" icon={GraduationCap} label="Student" />
        <Tab value="teacher" icon={Presentation} label="Teacher" />
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div><label className={labelCls}>Full Name</label><input data-testid="register-name-input" required value={f.name} onChange={(e) => set("name", e.target.value)} className={inputCls} placeholder="Jane Doe" /></div>
        <div><label className={labelCls}>Email</label><input data-testid="register-email-input" type="email" required value={f.email} onChange={(e) => set("email", e.target.value)} className={inputCls} placeholder="you@company.com" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelCls}>Password</label><input data-testid="register-password-input" type="password" required value={f.password} onChange={(e) => set("password", e.target.value)} className={inputCls} placeholder="••••••••" /></div>
          <div><label className={labelCls}>Confirm</label><input data-testid="register-confirm-input" type="password" required value={f.confirm} onChange={(e) => set("confirm", e.target.value)} className={inputCls} placeholder="••••••••" /></div>
        </div>
        <div><label className={labelCls}>Contact Phone</label><input data-testid="register-phone-input" value={f.phone} onChange={(e) => set("phone", e.target.value)} className={inputCls} placeholder="+1 555 000 0000" /></div>

        {role === "teacher" && (
          <div>
            <label className={labelCls}>Specialization</label>
            <select data-testid="register-specialization-select" value={f.specialization} onChange={(e) => set("specialization", e.target.value)} className={inputCls}>
              <option value="">Select a field</option>
              {Object.entries(specs).map(([grp, items]) => (
                <optgroup key={grp} label={grp}>
                  {items.map((it) => <option key={it} value={it}>{it}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
        )}

        <label className="flex items-start gap-2 text-xs text-zinc-500">
          <input data-testid="register-terms-checkbox" type="checkbox" checked={f.accept_terms} onChange={(e) => set("accept_terms", e.target.checked)} className="mt-0.5 accent-[#0066FF]" />
          I agree to the Terms of Service and Privacy Policy.
        </label>

        {err && <p data-testid="register-error" className="text-xs text-[#FF3366]">{err}</p>}
        <button data-testid="register-submit-button" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-md bg-[#0066FF] py-3 font-medium text-white transition-transform active:scale-[0.98] hover:bg-[#0066FF]/90 disabled:opacity-60">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : `Create ${role} account`}
        </button>
      </form>

      <div className="my-6 flex items-center gap-4"><div className="h-px flex-1 bg-white/10" /><span className="text-[10px] uppercase tracking-[0.3em] text-zinc-600">or</span><div className="h-px flex-1 bg-white/10" /></div>
      <GoogleButton label="Sign up with Google (Teacher)" />

      <p className="mt-8 text-center text-sm text-zinc-500">Already have an account? <Link data-testid="go-login-link" to="/login" className="text-[#0066FF] hover:underline">Sign in</Link></p>
    </AuthShell>
  );
}
