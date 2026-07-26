import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { GraduationCap, CalendarCheck, MonitorPlay, Users, Clock, Radio } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader, Widget } from "@/components/Widget";
import { StatCard } from "@/components/StatCard";
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
        action={<div className="cr-nominal"><Radio className="h-3.5 w-3.5 animate-pulse-glow" /> All systems nominal</div>} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard testid="stat-students" index={0} label="Students" value={a?.students ?? "—"} icon={GraduationCap} accent="#0066FF" />
        <StatCard testid="stat-bookings" index={1} label="Total Bookings" value={a?.bookings ?? "—"} icon={CalendarCheck} accent="#B800FF" />
        <StatCard testid="stat-conducted" index={2} label="Sessions Conducted" value={a?.conducted ?? "—"} icon={MonitorPlay} accent="#00FF66" />
        <StatCard testid="stat-groups" index={3} label="Groups" value={a?.groups ?? "—"} icon={Users} accent="#FFB800" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Widget testid="progress-chart-widget" title="Cohort Progress" className="lg:col-span-2" action={<span className="cr-widget-note">Last 6 months</span>}>
          <div className="h-[280px] px-4 py-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.progress_series || []}>
                <defs><linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0066FF" stopOpacity={0.5} /><stop offset="100%" stopColor="#0066FF" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.12)" vertical={false} />
                <XAxis dataKey="month" stroke="#8b8f99" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#8b8f99" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--cr-surface)", border: "1px solid var(--cr-border-strong)", borderRadius: 8, fontSize: 12, color: "var(--cr-text)" }} labelStyle={{ color: "var(--cr-text)" }} />
                <Area type="monotone" dataKey="progress" stroke="#0066FF" strokeWidth={2} fill="url(#pg)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Widget>

        <Widget testid="schedule-widget" title="My Schedule" action={<Link to="/dashboard/bookings" className="cr-link">View all</Link>}>
          <div className="cr-sched cr-divide">
            {upcoming.map((b, i) => (
              <div key={b.id} style={{ animationDelay: `${i * 0.05}s` }} className="cr-sched-item cr-fade-up">
                <div className="mt-1 flex flex-col items-center"><span className="cr-dot" /><span className="cr-dot-line" /></div>
                <div className="min-w-0 flex-1">
                  <p className="cr-sched-title">{b.lesson_title}</p>
                  <p className="cr-sched-meta"><Clock className="h-3 w-3" /> {fmtDateShort(b.date)} · {b.time}</p>
                  <p className="cr-sched-sub">{b.group_name} · {b.participants} students</p>
                </div>
              </div>
            ))}
            {upcoming.length === 0 && <p className="cr-empty">No upcoming bookings.</p>}
          </div>
        </Widget>
      </div>

      <div className="mt-6">
        <Widget testid="groups-preview-widget" title="Groups" action={<Link to="/dashboard/groups" className="cr-link">View all</Link>}>
          <div className="grid grid-cols-1 divide-y sm:grid-cols-2 sm:divide-y-0 cr-divide">
            {groups.slice(0, 4).map((g) => (
              <div key={g.id} className="cr-group-row">
                <div className="cr-group-badge">{g.name[0]}</div>
                <div className="min-w-0 flex-1"><p className="cr-group-name">{g.name}</p><p className="cr-group-sub">{g.direction}</p></div>
                <div className="text-right"><p className="cr-group-count">{g.students}</p><p className="cr-group-count-label">Students</p></div>
              </div>
            ))}
          </div>
        </Widget>
      </div>
    </div>
  );
}
