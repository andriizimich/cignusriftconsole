import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { LayoutGrid, GraduationCap, Users, CalendarCheck, User, LogOut, Menu, X, IdCard, ShieldCheck, Bell, Plus, Sun, Moon } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

const TEACHER_NAV = [
  { to: "/dashboard", label: "Summary", icon: LayoutGrid, testid: "nav-summary-link", end: true },
  { to: "/dashboard/lessons", label: "Sessions", icon: GraduationCap, testid: "nav-sessions-link" },
  { to: "/dashboard/groups", label: "Groups", icon: Users, testid: "nav-groups-link" },
  { to: "/dashboard/bookings", label: "Bookings", icon: CalendarCheck, testid: "nav-bookings-link" },
  { to: "/dashboard/profile", label: "Profile", icon: User, testid: "nav-profile-link" },
];
const STUDENT_NAV = [
  { to: "/dashboard/bookings", label: "Bookings", icon: CalendarCheck, testid: "nav-bookings-link" },
  { to: "/dashboard/profile", label: "Profile", icon: User, testid: "nav-profile-link" },
];
const PROFILE_SUB = [
  { to: "/dashboard/profile/personal", label: "Personal Data", icon: IdCard, testid: "nav-profile-personal" },
  { to: "/dashboard/profile/security", label: "Security", icon: ShieldCheck, testid: "nav-profile-security" },
  { to: "/dashboard/profile/notifications", label: "Notifications", icon: Bell, testid: "nav-profile-notifications" },
];
const SESSIONS_SUB = [
  { to: "/dashboard/lessons/new", label: "New Session", icon: Plus, testid: "nav-new-session" },
];
const SUBMENUS = { "/dashboard/profile": PROFILE_SUB, "/dashboard/lessons": SESSIONS_SUB };

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const isStudent = user?.role === "student";
  const NAV = isStudent ? STUDENT_NAV : TEACHER_NAV;
  const onProfile = location.pathname.startsWith("/dashboard/profile");

  const handleLogout = async () => { await logout(); navigate("/login"); };

  const NavList = ({ onNavigate }) => (
    <>
      {NAV.map((item) => {
        const Icon = item.icon;
        const sub = SUBMENUS[item.to];
        const showSub = sub && location.pathname.startsWith(item.to);
        return (
          <div key={item.to}>
            <NavLink to={item.to} end={item.end} data-testid={item.testid} onClick={onNavigate}
              className={({ isActive }) => `group relative flex items-center gap-3 rounded-md px-3.5 py-3 text-sm transition-colors ${isActive ? "bg-[#0066FF]/10 text-white" : "text-zinc-500 hover:text-white hover:bg-white/[0.04]"}`}>
              {({ isActive }) => (<>
                {isActive && <span className="absolute left-0 top-1/2 h-6 -translate-y-1/2 w-0.5 rounded-full bg-[#0066FF] shadow-[0_0_10px_#0066FF]" />}
                <Icon className={`h-[18px] w-[18px] ${isActive ? "text-[#0066FF]" : ""}`} />
                <span className="tracking-tight">{item.label}</span>
              </>)}
            </NavLink>
            {showSub && (
              <div className="ml-4 mt-1 space-y-0.5 border-l border-white/10 pl-3">
                {sub.map((s) => {
                  const SIcon = s.icon;
                  return (
                    <NavLink key={s.to} to={s.to} end data-testid={s.testid} onClick={onNavigate}
                      className={({ isActive }) => `flex items-center gap-2.5 rounded-md px-3 py-2 text-xs transition-colors ${isActive ? "text-[#0066FF]" : "text-zinc-600 hover:text-zinc-300"}`}>
                      <SIcon className="h-3.5 w-3.5" /> {s.label}
                    </NavLink>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </>
  );

  const UserCard = (
    <div className="border-t border-white/[0.06] p-4">
      <div className="flex items-center gap-3">
        {user?.picture ? <img src={user.picture} alt={user.name} className="h-9 w-9 rounded-md object-cover ring-1 ring-white/10" />
          : <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#0066FF]/15 font-display text-sm text-[#0066FF] ring-1 ring-[#0066FF]/30">{user?.name?.[0] || "U"}</div>}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-white" data-testid="sidebar-user-name">{user?.name}</p>
          <p className="truncate text-[11px] uppercase tracking-wider text-[#0066FF]">{user?.role}</p>
        </div>
        <button data-testid="theme-toggle" onClick={toggle} className="rounded-md p-2 text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-white" title="Toggle theme">{theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}</button>
        <button data-testid="logout-button" onClick={handleLogout} className="rounded-md p-2 text-zinc-500 transition-colors hover:bg-[#FF3366]/10 hover:text-[#FF3366]" title="Log out"><LogOut className="h-4 w-4" /></button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] grain">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/[0.06] bg-[#0A0A0B] lg:flex">
        <div className="p-6"><Logo /></div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          <p className="px-3.5 pb-2 pt-4 text-[10px] uppercase tracking-[0.28em] text-zinc-600">Navigation</p>
          <NavList />
        </nav>
        {UserCard}
      </aside>

      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-white/[0.06] bg-[#0A0A0B]/90 px-4 py-3 backdrop-blur-xl lg:hidden">
        <Logo compact />
        <div className="flex items-center gap-1">
          <button data-testid="theme-toggle-mobile" onClick={toggle} className="rounded-md p-2 text-zinc-400 hover:bg-white/5" title="Toggle theme">{theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}</button>
          <button data-testid="mobile-menu-button" onClick={() => setOpen(true)} className="rounded-md p-2 text-zinc-400 hover:bg-white/5"><Menu className="h-5 w-5" /></button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-white/10 bg-[#0A0A0B]">
            <div className="flex items-center justify-between p-6"><Logo /><button onClick={() => setOpen(false)} className="rounded-md p-2 text-zinc-400 hover:bg-white/5"><X className="h-5 w-5" /></button></div>
            <nav className="flex-1 space-y-1 overflow-y-auto px-3"><NavList onNavigate={() => setOpen(false)} /></nav>
            {UserCard}
          </div>
        </div>
      )}

      <main className="lg:pl-64"><div className="mx-auto max-w-[1400px] px-5 py-8 sm:px-8 lg:px-10">{children}</div></main>
    </div>
  );
}
