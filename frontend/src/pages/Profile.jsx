import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Camera, Trash2, Loader2, Bell, Mail } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader, Widget } from "@/components/Widget";
import { Button } from "@/components/base/Button";
import { Img } from "@/components/base/Img";
import { useAuth, formatApiError } from "@/context/AuthContext";

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
    <Button variant="bare" data-testid={testid} onClick={onClick} role="switch" aria-checked={on} className={`cr-toggle ${on ? "is-on" : ""}`}>
      <span className={`cr-toggle-knob ${on ? "translate-x-[22px]" : "translate-x-0.5"}`} />
    </Button>
  );

  return (
    <div>
      <PageHeader overline="Account" title="Profile" subtitle="Manage your identity, security and notification preferences." />

      <div className="cr-tabs">
        {TABS.map((t) => (
          <Button variant="bare" key={t} data-testid={`profile-tab-${t}`} onClick={() => navigate(`/dashboard/profile/${t}`)} className={`cr-tab ${active === t ? "is-active" : ""}`}>
            {t === "personal" ? "Personal Data" : t}
            {active === t && <span className="cr-tab-bar" />}
          </Button>
        ))}
      </div>

      {active === "personal" && (
        <Widget testid="profile-personal-widget" className="max-w-2xl">
          <div className="space-y-5 p-6">
            <div className="flex items-center gap-5">
              {p.picture ? <Img src={p.picture} alt="avatar" className="cr-avatar-lg-img" /> : <div className="cr-avatar-lg">{p.name?.[0] || "U"}</div>}
              <div className="flex gap-2">
                <label data-testid="avatar-upload" className="cr-btn-sm cursor-pointer"><Camera className="h-3.5 w-3.5" /> Upload<input type="file" accept="image/*" className="hidden" onChange={onAvatar} /></label>
                {p.picture && <Button variant="bare" data-testid="avatar-remove" onClick={() => setP({ ...p, picture: null })} className="cr-btn-sm cr-btn-sm-danger"><Trash2 className="h-3.5 w-3.5" /> Remove</Button>}
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div><label className="cr-label">Full Name</label><input data-testid="profile-name-input" className="cr-input" value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} /></div>
              <div><label className="cr-label">Email</label><input className="cr-input opacity-60" value={user?.email || ""} disabled /></div>
              <div><label className="cr-label">Contact Phone</label><input data-testid="profile-phone-input" className="cr-input" value={p.phone} onChange={(e) => setP({ ...p, phone: e.target.value })} /></div>
              <div><label className="cr-label">Institution / Company</label><input data-testid="profile-institution-input" className="cr-input" value={p.institution} onChange={(e) => setP({ ...p, institution: e.target.value })} /></div>
            </div>
            <Button variant="bare" data-testid="profile-save-btn" onClick={saveProfile} disabled={busy} className="cr-btn-primary disabled:opacity-60">{busy && <Loader2 className="h-4 w-4 animate-spin" />} Save changes</Button>
          </div>
        </Widget>
      )}

      {active === "security" && (
        <Widget testid="profile-security-widget" className="max-w-lg">
          <div className="space-y-5 p-6">
            <div><label className="cr-label">Current Password</label><input data-testid="current-password-input" type="password" className="cr-input" value={pw.current_password} onChange={(e) => setPw({ ...pw, current_password: e.target.value })} /></div>
            <div><label className="cr-label">New Password</label><input data-testid="new-password-input" type="password" className="cr-input" value={pw.new_password} onChange={(e) => setPw({ ...pw, new_password: e.target.value })} /></div>
            <div><label className="cr-label">Confirm New Password</label><input data-testid="confirm-password-input" type="password" className="cr-input" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></div>
            <Button variant="bare" data-testid="change-password-btn" onClick={changePw} disabled={busy} className="cr-btn-primary disabled:opacity-60">{busy && <Loader2 className="h-4 w-4 animate-spin" />} Update password</Button>
          </div>
        </Widget>
      )}

      {active === "notifications" && (
        <Widget testid="profile-notifications-widget" className="max-w-lg">
          <div className="cr-divide">
            <div className="cr-list-row py-5">
              <div className="cr-notif-icon"><Mail className="h-4 w-4 text-[#0066FF]" /></div>
              <div className="flex-1"><p className="cr-td-strong text-sm">Email Notifications</p><p className="cr-tm text-xs">Session reminders and booking updates via email.</p></div>
              <Toggle testid="toggle-email" on={notif.email_notifications} onClick={() => saveNotif({ ...notif, email_notifications: !notif.email_notifications })} />
            </div>
            <div className="cr-list-row py-5">
              <div className="cr-notif-icon"><Bell className="h-4 w-4 text-[#B800FF]" /></div>
              <div className="flex-1"><p className="cr-td-strong text-sm">Push Notifications</p><p className="cr-tm text-xs">Real-time alerts in the Cygnus Rift app.</p></div>
              <Toggle testid="toggle-push" on={notif.push_notifications} onClick={() => saveNotif({ ...notif, push_notifications: !notif.push_notifications })} />
            </div>
          </div>
        </Widget>
      )}
    </div>
  );
}
