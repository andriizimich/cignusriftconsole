import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { GraduationCap, CalendarCheck, MonitorPlay, Users, Clock, Radio } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader, Widget } from "@/components/Widget";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { fmtDateShort } from "@/lib/format";
import { useAuth } from "@/context/AuthContext";

export default function Summary() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    api.get("/dashboard/summary").then((r) => setData(r.data));
    api.get("/bookings").then((r) => setBookings(r.data));
    api.get("/groups").then((r) => setGroups(r.data));
  }, []);

  const a = data?.analytics;
  const upcoming = bookings.filter((b) => b.status !== "archived").slice(0, 4);

  return (
    <div>
      <PageHeader overline={`Welcome back, ${user?.name?.split(" ")[0] || "Trainer"}`} title="Command Summary" subtitle="Live overview of your cohorts, lessons and bookings."
        action={<div className="hidden items-center gap-2 rounded-md border border-[#00FF66]/20 bg-[#00FF66]/5 px-3 py-2 text-xs text-[#00FF66] sm:flex"><Radio className="h-3.5 w-3.5 animate-pulse-glow" /> All systems nominal</div>} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard testid="stat-students" index={0} label="Students" value={a?.students ?? "—"} icon={GraduationCap} accent="#0066FF" />
        <StatCard testid="stat-bookings" index={1} label="Total Bookings" value={a?.bookings ?? "—"} icon={CalendarCheck} accent="#B800FF" />
        <StatCard testid="stat-conducted" index={2} label="Sessions Conducted" value={a?.conducted ?? "—"} icon={MonitorPlay} accent="#00FF66" />
        <StatCard testid="stat-groups" index={3} label="Groups" value={a?.groups ?? "—"} icon={Users} accent="#FFB800" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Widget testid="progress-chart-widget" title="Cohort Progress" className="lg:col-span-2" action={<span className="text-[10px] uppercase tracking-[0.2em] text-zinc-600">Last 6 months</span>}>
          <div className="h-[280px] px-4 py-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.progress_series || []}>
                <defs><linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0066FF" stopOpacity={0.5} /><stop offset="100%" stopColor="#0066FF" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" stroke="#52525B" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#52525B" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#0A0A0B", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "#fff" }} />
                <Area type="monotone" dataKey="progress" stroke="#0066FF" strokeWidth={2} fill="url(#pg)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Widget>

        <Widget testid="schedule-widget" title="My Schedule" action={<Link to="/dashboard/bookings" className="text-xs text-[#0066FF] hover:underline">View all</Link>}>
          <div className="max-h-[280px] divide-y divide-white/[0.05] overflow-y-auto">
            {upcoming.map((b, i) => (
              <motion.div key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="flex items-start gap-3 px-6 py-4">
                <div className="mt-1 flex flex-col items-center"><span className="h-2 w-2 rounded-full bg-[#0066FF]" /><span className="mt-1 h-8 w-px bg-white/10" /></div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-white">{b.lesson_title}</p>
                  <p className="mt-1 flex items-center gap-2 text-xs text-zinc-500"><Clock className="h-3 w-3" /> {fmtDateShort(b.date)} · {b.time}</p>
                  <p className="mt-0.5 text-[11px] text-zinc-600">{b.group_name} · {b.participants} students</p>
                </div>
              </motion.div>
            ))}
            {upcoming.length === 0 && <p className="px-6 py-6 text-sm text-zinc-500">No upcoming bookings.</p>}
          </div>
        </Widget>
      </div>

      <div className="mt-6">
        <Widget testid="groups-preview-widget" title="Groups" action={<Link to="/dashboard/groups" className="text-xs text-[#0066FF] hover:underline">View all</Link>}>
          <div className="grid grid-cols-1 divide-y divide-white/[0.05] sm:grid-cols-2 sm:divide-y-0">
            {groups.slice(0, 4).map((g) => (
              <div key={g.id} className="flex items-center gap-4 px-6 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#B800FF]/10 font-display text-sm text-[#B800FF] ring-1 ring-[#B800FF]/20">{g.name[0]}</div>
                <div className="min-w-0 flex-1"><p className="truncate text-sm text-white">{g.name}</p><p className="truncate text-xs text-zinc-500">{g.direction}</p></div>
                <div className="text-right"><p className="font-display text-lg font-light text-white">{g.students}</p><p className="text-[10px] uppercase tracking-widest text-zinc-600">Students</p></div>
              </div>
            ))}
          </div>
        </Widget>
      </div>
    </div>
  );
}
