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
    <Button variant="bare" type="button" data-testid={`role-tab-${value}`} onClick={() => setRole(value)} className={`cr-roletab ${role === value ? "is-active" : ""}`}>
      <Icon className="h-4 w-4" /> {label}
    </Button>
  );

  return (
    <AuthShell>
      <p className="cr-auth-overline">Get started</p>
      <Heading level={1} bare className="cr-auth-h1">Create account</Heading>
      <p className="cr-auth-sub-6">Choose your role to continue.</p>

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

        <label className="cr-terms">
          <input data-testid="register-terms-checkbox" type="checkbox" checked={f.accept_terms} onChange={(e) => set("accept_terms", e.target.checked)} className="mt-0.5 accent-[#0066FF]" />
          I agree to the Terms of Service and Privacy Policy.
        </label>

        {err && <p data-testid="register-error" className="cr-error">{err}</p>}
        <Button variant="bare" type="submit" data-testid="register-submit-button" disabled={busy} className="cr-btn-block">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : `Create ${role} account`}
        </Button>
      </form>

      <div className="cr-or"><div className="cr-or-line" /><span className="cr-or-text">or</span><div className="cr-or-line" /></div>
      <GoogleButton label="Sign up with Google (Teacher)" />

      <p className="cr-muted-center">Already have an account? <Link data-testid="go-login-link" to="/login" className="cr-link-accent">Sign in</Link></p>
    </AuthShell>
  );
}
