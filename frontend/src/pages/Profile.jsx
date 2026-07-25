import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Camera, Trash2, Loader2, Bell, Mail } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader, Widget } from "@/components/Widget";
import { useAuth, formatApiError } from "@/context/AuthContext";

const inp = "w-full rounded-md border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-[#0066FF]/50";
const lbl = "mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-zinc-500";
const TABS = ["personal", "security", "notifications"];

export default function Profile() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const active = TABS.includes(tab) ? tab : "personal";
  const { user, setUser } = useAuth();

  const [p, setP] = useState({ name: "", phone: "", institution: "", picture: null });
  const [pw, setPw] = useState({ current_password: "", new_password: "", confirm: "" });
  const [notif, setNotif] = useState({ email_notifications: true, push_notifications: true });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) {
      setP({ name: user.name || "", phone: user.phone || "", institution: user.institution || "", picture: user.picture || null });
      setNotif({ email_notifications: user.email_notifications !== false, push_notifications: user.push_notifications !== false });
    }
  }, [user]);

  const isGuest = user?.isGuest;

  const onAvatar = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setP((s) => ({ ...s, picture: reader.result }));
    reader.readAsDataURL(file);
  };

  const saveProfile = async () => {
    if (isGuest) { toast.info("Sign in to edit your profile"); return; }
    setBusy(true);
    try { const r = await api.put("/auth/profile", p); setUser(r.data); toast.success("Profile updated"); }
    catch (e) { toast.error(formatApiError(e.response?.data?.detail)); } finally { setBusy(false); }
  };

  const changePw = async () => {
    if (isGuest) { toast.info("Sign in to change your password"); return; }
    if (pw.new_password !== pw.confirm) { toast.error("Passwords do not match"); return; }
    setBusy(true);
    try { await api.post("/auth/change-password", { current_password: pw.current_password, new_password: pw.new_password }); toast.success("Password changed"); setPw({ current_password: "", new_password: "", confirm: "" }); }
    catch (e) { toast.error(formatApiError(e.response?.data?.detail)); } finally { setBusy(false); }
  };

  const saveNotif = async (next) => {
    setNotif(next);
    if (isGuest) return;
    try { const r = await api.put("/auth/notifications", next); setUser(r.data); toast.success("Preferences saved"); } catch {}
  };

  const Toggle = ({ on, onClick, testid }) => (
    <button data-testid={testid} onClick={onClick} className={`relative h-6 w-11 rounded-full transition-colors ${on ? "bg-[#0066FF]" : "bg-white/10"}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${on ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );

  return (
    <div>
      <PageHeader overline="Account" title="Profile" subtitle="Manage your identity, security and notification preferences." />

      <div className="mb-6 flex gap-2 border-b border-white/[0.07]">
        {TABS.map((t) => (
          <button key={t} data-testid={`profile-tab-${t}`} onClick={() => navigate(`/dashboard/profile/${t}`)} className={`relative px-4 py-3 text-sm capitalize transition-colors ${active === t ? "text-white" : "text-zinc-500 hover:text-zinc-300"}`}>
            {t === "personal" ? "Personal Data" : t}
            {active === t && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[#0066FF]" />}
          </button>
        ))}
      </div>

      {active === "personal" && (
        <Widget testid="profile-personal-widget" className="max-w-2xl">
          <div className="space-y-5 p-6">
            <div className="flex items-center gap-5">
              {p.picture ? <img src={p.picture} alt="avatar" className="h-20 w-20 rounded-lg object-cover ring-2 ring-[#0066FF]/40" /> : <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-[#0066FF]/15 font-display text-2xl text-[#0066FF] ring-2 ring-[#0066FF]/30">{p.name?.[0] || "U"}</div>}
              <div className="flex gap-2">
                <label data-testid="avatar-upload" className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-white/15 px-3 py-2 text-xs text-zinc-300 hover:text-white"><Camera className="h-3.5 w-3.5" /> Upload<input type="file" accept="image/*" className="hidden" onChange={onAvatar} /></label>
                {p.picture && <button data-testid="avatar-remove" onClick={() => setP({ ...p, picture: null })} className="inline-flex items-center gap-1.5 rounded-md border border-white/15 px-3 py-2 text-xs text-zinc-400 hover:text-[#FF3366]"><Trash2 className="h-3.5 w-3.5" /> Remove</button>}
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div><label className={lbl}>Full Name</label><input data-testid="profile-name-input" className={inp} value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} /></div>
              <div><label className={lbl}>Email</label><input className={`${inp} opacity-60`} value={user?.email || ""} disabled /></div>
              <div><label className={lbl}>Contact Phone</label><input data-testid="profile-phone-input" className={inp} value={p.phone} onChange={(e) => setP({ ...p, phone: e.target.value })} /></div>
              <div><label className={lbl}>Institution / Company</label><input data-testid="profile-institution-input" className={inp} value={p.institution} onChange={(e) => setP({ ...p, institution: e.target.value })} /></div>
            </div>
            <button data-testid="profile-save-btn" onClick={saveProfile} disabled={busy} className="inline-flex items-center gap-2 rounded-md bg-[#0066FF] px-5 py-2.5 text-sm font-medium text-white active:scale-95 disabled:opacity-60">{busy && <Loader2 className="h-4 w-4 animate-spin" />} Save changes</button>
          </div>
        </Widget>
      )}

      {active === "security" && (
        <Widget testid="profile-security-widget" className="max-w-lg">
          <div className="space-y-5 p-6">
            <div><label className={lbl}>Current Password</label><input data-testid="current-password-input" type="password" className={inp} value={pw.current_password} onChange={(e) => setPw({ ...pw, current_password: e.target.value })} /></div>
            <div><label className={lbl}>New Password</label><input data-testid="new-password-input" type="password" className={inp} value={pw.new_password} onChange={(e) => setPw({ ...pw, new_password: e.target.value })} /></div>
            <div><label className={lbl}>Confirm New Password</label><input data-testid="confirm-password-input" type="password" className={inp} value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></div>
            <button data-testid="change-password-btn" onClick={changePw} disabled={busy} className="inline-flex items-center gap-2 rounded-md bg-[#0066FF] px-5 py-2.5 text-sm font-medium text-white active:scale-95 disabled:opacity-60">{busy && <Loader2 className="h-4 w-4 animate-spin" />} Update password</button>
          </div>
        </Widget>
      )}

      {active === "notifications" && (
        <Widget testid="profile-notifications-widget" className="max-w-lg">
          <div className="divide-y divide-white/[0.05]">
            <div className="flex items-center gap-4 px-6 py-5">
              <div className="rounded-md border border-white/10 bg-black/40 p-2.5"><Mail className="h-4 w-4 text-[#0066FF]" /></div>
              <div className="flex-1"><p className="text-sm text-white">Email Notifications</p><p className="text-xs text-zinc-500">Session reminders and booking updates via email.</p></div>
              <Toggle testid="toggle-email" on={notif.email_notifications} onClick={() => saveNotif({ ...notif, email_notifications: !notif.email_notifications })} />
            </div>
            <div className="flex items-center gap-4 px-6 py-5">
              <div className="rounded-md border border-white/10 bg-black/40 p-2.5"><Bell className="h-4 w-4 text-[#B800FF]" /></div>
              <div className="flex-1"><p className="text-sm text-white">Push Notifications</p><p className="text-xs text-zinc-500">Real-time alerts in the Cygnus Rift app.</p></div>
              <Toggle testid="toggle-push" on={notif.push_notifications} onClick={() => saveNotif({ ...notif, push_notifications: !notif.push_notifications })} />
            </div>
          </div>
        </Widget>
      )}
    </div>
  );
}
