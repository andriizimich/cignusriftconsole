import { NavLink, useNavigate, useLocation, Outlet } from "react-router-dom";
import { LayoutGrid, GraduationCap, Users, CalendarCheck, User, LogOut, Menu, X, IdCard, ShieldCheck, Bell, Plus, Sun, Moon } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/base/Button";
import { Img } from "@/components/base/Img";
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

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const isStudent = user?.role === "student";
  const NAV = isStudent ? STUDENT_NAV : TEACHER_NAV;

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
              className={({ isActive }) => `cr-nav-item ${isActive ? "is-active" : ""}`}>
              {({ isActive }) => (<>
                {isActive && <span className="cr-nav-item-bar" />}
                <Icon className={`h-[18px] w-[18px] ${isActive ? "cr-nav-icon-active" : ""}`} />
                <span className="tracking-tight">{item.label}</span>
              </>)}
            </NavLink>
            {showSub && (
              <div className="cr-subnav">
                {sub.map((s) => {
                  const SIcon = s.icon;
                  return (
                    <NavLink key={s.to} to={s.to} end data-testid={s.testid} onClick={onNavigate}
                      className={({ isActive }) => `cr-subnav-item ${isActive ? "is-active" : ""}`}>
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
    <div className="cr-usercard">
      <div className="flex items-center gap-3">
        {user?.picture ? <Img src={user.picture} alt={user.name} className="cr-avatar-img" />
          : <div className="cr-avatar">{user?.name?.[0] || "U"}</div>}
        <div className="min-w-0 flex-1">
          <p className="cr-user-name" data-testid="sidebar-user-name">{user?.name}</p>
          <p className="cr-user-role">{user?.role}</p>
        </div>
        <Button variant="bare" data-testid="theme-toggle" onClick={toggle} className="cr-icon-btn" title="Toggle theme">{theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}</Button>
        <Button variant="bare" data-testid="logout-button" onClick={handleLogout} className="cr-icon-btn cr-icon-btn-danger" title="Log out"><LogOut className="h-4 w-4" /></Button>
      </div>
    </div>
  );

  return (
    <div className="cr-shell">
      <aside className="cr-aside">
        <div className="p-6"><Logo /></div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          <p className="cr-nav-heading">Navigation</p>
          <NavList />
        </nav>
        {UserCard}
      </aside>

      <div className="cr-mobilebar">
        <Logo compact />
        <div className="flex items-center gap-1">
          <Button variant="bare" data-testid="theme-toggle-mobile" onClick={toggle} className="cr-icon-btn" title="Toggle theme">{theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}</Button>
          <Button variant="bare" data-testid="mobile-menu-button" onClick={() => setOpen(true)} className="cr-icon-btn"><Menu className="h-5 w-5" /></Button>
        </div>
      </div>

      {open && (
        <div className="cr-drawer-overlay">
          <div className="cr-drawer-scrim" onClick={() => setOpen(false)} />
          <div className="cr-drawer">
            <div className="flex items-center justify-between p-6"><Logo /><Button variant="bare" onClick={() => setOpen(false)} className="cr-icon-btn"><X className="h-5 w-5" /></Button></div>
            <nav className="flex-1 space-y-1 overflow-y-auto px-3"><NavList onNavigate={() => setOpen(false)} /></nav>
            {UserCard}
          </div>
        </div>
      )}

      <main className="cr-main"><div className="cr-main-inner"><Outlet /></div></main>
    </div>
  );
}

