import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Clock, Users, LayoutGrid, Table2, Search, Play, Pencil, Trash2, UserRound } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/Widget";
import { StatusBadge } from "@/components/StatusBadge";
import { fmtDate } from "@/components/OrdersTable";

const modeColor = { Hybrid: "#B800FF", Practice: "#0066FF", Theory: "#00FF66" };

export default function Sessions() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [groups, setGroups] = useState([]);
  const [meta, setMeta] = useState({ teachers: [] });
  const [view, setView] = useState("grid");
  const [f, setF] = useState({ q: "", teacher: "", group: "", status: "", date: "" });

  const load = () => {
    const params = Object.fromEntries(Object.entries(f).filter(([, v]) => v));
    api.get("/sessions", { params }).then((r) => setSessions(r.data));
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [f]);
  useEffect(() => {
    api.get("/groups").then((r) => setGroups(r.data));
    api.get("/meta").then((r) => setMeta(r.data));
  }, []);

  const remove = async (id) => {
    await api.delete(`/sessions/${id}`);
    toast.success(`Session ${id} deleted`);
    load();
  };

  const selCls = "rounded-md border border-white/10 bg-[#0A0A0B] px-3 py-2 text-sm text-zinc-300 outline-none focus:border-[#0066FF]/50";

  return (
    <div>
      <PageHeader overline="Schedule" title="Sessions" subtitle="Search, filter and manage all VR training sessions." />

      {/* Toolbar */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-white/[0.07] bg-[#0A0A0B] p-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
          <input data-testid="session-search-input" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} placeholder="Search by topic..." className="w-full rounded-md border border-white/10 bg-black/40 py-2 pl-9 pr-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-[#0066FF]/50" />
        </div>
        <input data-testid="session-filter-date" type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} className={selCls} />
        <select data-testid="session-filter-teacher" value={f.teacher} onChange={(e) => setF({ ...f, teacher: e.target.value })} className={selCls}>
          <option value="">All teachers</option>
          {meta.teachers?.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
        </select>
        <select data-testid="session-filter-group" value={f.group} onChange={(e) => setF({ ...f, group: e.target.value })} className={selCls}>
          <option value="">All groups</option>
          {groups.map((g) => <option key={g.id} value={g.name}>{g.name}</option>)}
        </select>
        <select data-testid="session-filter-status" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} className={selCls}>
          <option value="">All statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        <div className="flex overflow-hidden rounded-md border border-white/10">
          <button data-testid="view-grid-btn" onClick={() => setView("grid")} className={`p-2 ${view === "grid" ? "bg-[#0066FF] text-white" : "text-zinc-500 hover:text-white"}`}><LayoutGrid className="h-4 w-4" /></button>
          <button data-testid="view-table-btn" onClick={() => setView("table")} className={`p-2 ${view === "table" ? "bg-[#0066FF] text-white" : "text-zinc-500 hover:text-white"}`}><Table2 className="h-4 w-4" /></button>
        </div>
      </div>

      {sessions.length === 0 && <p className="text-sm text-zinc-500">No sessions match your filters.</p>}

      {view === "grid" ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {sessions.map((s, i) => (
            <motion.div key={s.id} data-testid={`session-card-${s.id}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: i * 0.04 }} whileHover={{ y: -4 }} className="group relative cursor-pointer overflow-hidden rounded-lg border border-white/[0.07] bg-[#0A0A0B] p-6 transition-colors hover:border-white/[0.14]" onClick={() => navigate(`/dashboard/sessions/${s.id}`)}>
              <span className="absolute left-0 top-0 h-full w-0.5" style={{ backgroundColor: modeColor[s.mode] }} />
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-mono-plex text-xs text-zinc-500">{s.id}</p>
                  <h3 className="mt-1 font-display text-lg font-medium tracking-tight text-white">{s.title}</h3>
                </div>
                <StatusBadge status={s.status} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-zinc-400">
                <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-zinc-600" /> {fmtDate(s.date)} · {s.time}</span>
                <span className="flex items-center gap-2"><Users className="h-4 w-4 text-zinc-600" /> {s.group}</span>
                <span className="flex items-center gap-2"><UserRound className="h-4 w-4 text-zinc-600" /> {s.teacher}</span>
              </div>
              <div className="mt-5 flex gap-2" onClick={(e) => e.stopPropagation()}>
                <button data-testid={`session-join-${s.id}`} onClick={() => navigate(`/dashboard/sessions/${s.id}`)} className="inline-flex items-center gap-1.5 rounded-md bg-[#0066FF] px-3 py-1.5 text-xs font-medium text-white transition-transform active:scale-95"><Play className="h-3.5 w-3.5" /> Join</button>
                <button data-testid={`session-edit-${s.id}`} disabled title="Locked: depends on VR server" className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-md border border-white/10 px-3 py-1.5 text-xs text-zinc-600"><Pencil className="h-3.5 w-3.5" /> Edit</button>
                <button data-testid={`session-delete-${s.id}`} onClick={() => remove(s.id)} className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-[#FF3366]/50 hover:text-[#FF3366]"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-white/[0.07] bg-[#0A0A0B]" data-testid="sessions-table">
          <table className="w-full border-collapse text-sm">
            <thead><tr className="text-left text-[10px] uppercase tracking-[0.18em] text-zinc-500">
              {["Topic", "Date", "Group", "Teacher", "Status", "Action"].map((h) => <th key={h} className="border-b border-white/[0.06] px-6 py-3 font-medium">{h}</th>)}
            </tr></thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} data-testid={`session-row-${s.id}`} className="cursor-pointer transition-colors hover:bg-white/[0.03]" onClick={() => navigate(`/dashboard/sessions/${s.id}`)}>
                  <td className="border-b border-white/[0.05] px-6 py-4 text-white">{s.title}</td>
                  <td className="border-b border-white/[0.05] px-6 py-4 text-zinc-400">{fmtDate(s.date)} · {s.time}</td>
                  <td className="border-b border-white/[0.05] px-6 py-4 text-zinc-400">{s.group}</td>
                  <td className="border-b border-white/[0.05] px-6 py-4 text-zinc-400">{s.teacher}</td>
                  <td className="border-b border-white/[0.05] px-6 py-4"><StatusBadge status={s.status} /></td>
                  <td className="border-b border-white/[0.05] px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => remove(s.id)} className="rounded-md p-1.5 text-zinc-500 hover:text-[#FF3366]"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
