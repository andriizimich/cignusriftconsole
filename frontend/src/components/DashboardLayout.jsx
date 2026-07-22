import { NavLink, useNavigate } from "react-router-dom";
import { LayoutGrid, CalendarClock, Users, Receipt, User, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";

const NAV = [
  { to: "/dashboard", label: "Summary", icon: LayoutGrid, testid: "nav-summary-link", end: true },
  { to: "/dashboard/sessions", label: "Sessions", icon: CalendarClock, testid: "nav-sessions-link" },
  { to: "/dashboard/groups", label: "Groups", icon: Users, testid: "nav-groups-link" },
  { to: "/dashboard/orders", label: "Orders", icon: Receipt, testid: "nav-orders-link" },
  { to: "/dashboard/profile", label: "Profile", icon: User, testid: "nav-profile-link" },
];

const NavItems = ({ onNavigate }) =>
  NAV.map((item) => {
    const Icon = item.icon;
    return (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.end}
        data-testid={item.testid}
        onClick={onNavigate}
        className={({ isActive }) =>
          `group relative flex items-center gap-3 rounded-md px-3.5 py-3 text-sm transition-colors ${
            isActive ? "bg-[#0066FF]/10 text-white" : "text-zinc-500 hover:text-white hover:bg-white/[0.04]"
          }`
        }
      >
        {({ isActive }) => (
          <>
            {isActive && <span className="absolute left-0 top-1/2 h-6 -translate-y-1/2 w-0.5 rounded-full bg-[#0066FF] shadow-[0_0_10px_#0066FF]" />}
            <Icon className={`h-[18px] w-[18px] transition-colors ${isActive ? "text-[#0066FF]" : ""}`} />
            <span className="tracking-tight">{item.label}</span>
          </>
        )}
      </NavLink>
    );
  });

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const UserCard = (
    <div className="border-t border-white/[0.06] p-4">
      <div className="flex items-center gap-3">
        {user?.picture ? (
          <img src={user.picture} alt={user.name} className="h-9 w-9 rounded-md object-cover ring-1 ring-white/10" />
        ) : (
          <div className="h-9 w-9 rounded-md bg-[#0066FF]/15 ring-1 ring-[#0066FF]/30 flex items-center justify-center font-display text-sm text-[#0066FF]">
            {user?.name?.[0] || "G"}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-white" data-testid="sidebar-user-name">{user?.name}</p>
          <p className="truncate text-[11px] text-zinc-500">{user?.email}</p>
        </div>
        <button
          data-testid="logout-button"
          onClick={handleLogout}
          className="rounded-md p-2 text-zinc-500 transition-colors hover:bg-[#FF3366]/10 hover:text-[#FF3366]"
          title="Log out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] grain">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/[0.06] bg-[#0A0A0B] lg:flex">
        <div className="p-6"><Logo /></div>
        <nav className="flex-1 space-y-1 px-3">
          <p className="px-3.5 pb-2 pt-4 text-[10px] uppercase tracking-[0.28em] text-zinc-600">Navigation</p>
          <NavItems />
        </nav>
        {UserCard}
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-white/[0.06] bg-[#0A0A0B]/90 px-4 py-3 backdrop-blur-xl lg:hidden">
        <Logo compact />
        <button data-testid="mobile-menu-button" onClick={() => setOpen(true)} className="rounded-md p-2 text-zinc-400 hover:bg-white/5">
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-white/10 bg-[#0A0A0B]">
            <div className="flex items-center justify-between p-6">
              <Logo />
              <button onClick={() => setOpen(false)} className="rounded-md p-2 text-zinc-400 hover:bg-white/5"><X className="h-5 w-5" /></button>
            </div>
            <nav className="flex-1 space-y-1 px-3"><NavItems onNavigate={() => setOpen(false)} /></nav>
            {UserCard}
          </div>
        </div>
      )}

      <main className="lg:pl-64">
        <div className="mx-auto max-w-[1400px] px-5 py-8 sm:px-8 lg:px-10">{children}</div>
      </main>
    </div>
  );
}
