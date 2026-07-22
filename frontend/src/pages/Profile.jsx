import { useAuth } from "@/context/AuthContext";
import { PageHeader, Widget } from "@/components/Widget";
import { Mail, Shield, Award, Globe } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();

  const stats = [
    { label: "Role", value: "Lead Trainer" },
    { label: "Region", value: "EMEA" },
    { label: "Active Cohorts", value: "5" },
    { label: "Certifications", value: "UE5 · AI" },
  ];

  return (
    <div>
      <PageHeader overline="Account" title="Profile" subtitle="Your Cygnus Rift operator identity and workspace preferences." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Widget testid="profile-identity-widget" className="lg:col-span-1">
          <div className="flex flex-col items-center px-6 py-10 text-center">
            {user?.picture ? (
              <img src={user.picture} alt={user.name} className="h-24 w-24 rounded-lg object-cover ring-2 ring-[#0066FF]/40" />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-[#0066FF]/15 font-display text-3xl text-[#0066FF] ring-2 ring-[#0066FF]/30">{user?.name?.[0] || "G"}</div>
            )}
            <h2 className="mt-5 font-display text-xl font-medium tracking-tight text-white" data-testid="profile-name">{user?.name}</h2>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-500"><Mail className="h-3.5 w-3.5" /> {user?.email}</p>
            {user?.isGuest && (
              <span className="mt-4 rounded-sm bg-[#FFB800]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#FFB800]">Guest Mode</span>
            )}
          </div>
        </Widget>

        <div className="space-y-6 lg:col-span-2">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-lg border border-white/[0.07] bg-[#0A0A0B] p-5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">{s.label}</p>
                <p className="mt-2 font-display text-base font-medium text-white">{s.value}</p>
              </div>
            ))}
          </div>

          <Widget testid="profile-details-widget" title="Workspace">
            <div className="divide-y divide-white/[0.05]">
              {[
                { icon: Shield, label: "Security", value: "Google OAuth · 7-day sessions" },
                { icon: Award, label: "Plan", value: "Enterprise · Institutional" },
                { icon: Globe, label: "Language", value: "English (US)" },
              ].map((row) => {
                const Icon = row.icon;
                return (
                  <div key={row.label} className="flex items-center gap-4 px-6 py-4">
                    <div className="rounded-md border border-white/10 bg-black/40 p-2.5"><Icon className="h-4 w-4 text-[#0066FF]" /></div>
                    <div className="flex-1">
                      <p className="text-[11px] uppercase tracking-widest text-zinc-500">{row.label}</p>
                      <p className="text-sm text-white">{row.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Widget>
        </div>
      </div>
    </div>
  );
}
