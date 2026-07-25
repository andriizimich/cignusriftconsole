import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Plus, Search, LayoutGrid, Table2, Pencil, Trash2, UserRound, Clock, Tag } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/Widget";

export default function Lessons() {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState([]);
  const [cats, setCats] = useState({});
  const [view, setView] = useState("grid");
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");

  const load = () => {
    const params = {};
    if (q) params.q = q;
    if (category) params.category = category;
    api.get("/lessons", { params }).then((r) => setLessons(r.data));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [q, category]);
  useEffect(() => { api.get("/categories").then((r) => setCats(r.data)); }, []);

  const remove = async (id, e) => { e.stopPropagation(); await api.delete(`/lessons/${id}`); toast.success("Lesson deleted"); load(); };
  const selCls = "rounded-md border border-white/10 bg-[#0A0A0B] px-3 py-2 text-sm text-zinc-300 outline-none focus:border-[#0066FF]/50";

  return (
    <div>
      <PageHeader overline="Content" title="Sessions" subtitle="Your VR lesson library with theory + practice blocks and quizzes."
        action={<button data-testid="new-lesson-btn" onClick={() => navigate("/dashboard/lessons/new")} className="inline-flex items-center gap-2 rounded-md bg-[#0066FF] px-4 py-2.5 text-sm font-medium text-white transition-transform active:scale-95 hover:bg-[#0066FF]/90"><Plus className="h-4 w-4" /> Create Session</button>} />

      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-white/[0.07] bg-[#0A0A0B] p-4">
        <div className="relative min-w-[200px] flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" /><input data-testid="lesson-search-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by topic..." className="w-full rounded-md border border-white/10 bg-black/40 py-2 pl-9 pr-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-[#0066FF]/50" /></div>
        <select data-testid="lesson-filter-category" value={category} onChange={(e) => setCategory(e.target.value)} className={selCls}>
          <option value="">All categories</option>
          {Object.entries(cats).map(([grp, items]) => <optgroup key={grp} label={grp}>{items.map((c) => <option key={c} value={c}>{c}</option>)}</optgroup>)}
        </select>
        <div className="flex overflow-hidden rounded-md border border-white/10">
          <button data-testid="lesson-view-grid" onClick={() => setView("grid")} className={`p-2 ${view === "grid" ? "bg-[#0066FF] text-white" : "text-zinc-500 hover:text-white"}`}><LayoutGrid className="h-4 w-4" /></button>
          <button data-testid="lesson-view-table" onClick={() => setView("table")} className={`p-2 ${view === "table" ? "bg-[#0066FF] text-white" : "text-zinc-500 hover:text-white"}`}><Table2 className="h-4 w-4" /></button>
        </div>
      </div>

      {lessons.length === 0 && <p className="text-sm text-zinc-500">No lessons match your filters.</p>}

      {view === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lessons.map((l, i) => (
            <motion.div key={l.id} data-testid={`lesson-card-${l.id}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: i * 0.04 }} whileHover={{ y: -4 }} onClick={() => navigate(`/dashboard/lessons/${l.id}`)} className="group cursor-pointer rounded-lg border border-white/[0.07] bg-[#0A0A0B] p-6 transition-colors hover:border-[#0066FF]/30">
              <span className="inline-flex items-center gap-1.5 rounded-sm bg-[#B800FF]/10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-[#B800FF]"><Tag className="h-3 w-3" />{l.category}</span>
              <h3 className="mt-4 font-display text-lg font-medium tracking-tight text-white">{l.title}</h3>
              <div className="mt-3 flex items-center gap-4 text-xs text-zinc-500">
                <span className="flex items-center gap-1.5"><UserRound className="h-3.5 w-3.5" /> {l.teacher}</span>
                <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {l.duration} min</span>
              </div>
              <div className="mt-5 flex gap-2" onClick={(e) => e.stopPropagation()}>
                <button data-testid={`lesson-edit-${l.id}`} onClick={() => navigate(`/dashboard/lessons/${l.id}/edit`)} className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-3 py-1.5 text-xs text-zinc-400 hover:border-[#0066FF]/50 hover:text-white"><Pencil className="h-3.5 w-3.5" /> Edit</button>
                <button data-testid={`lesson-delete-${l.id}`} onClick={(e) => remove(l.id, e)} className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-3 py-1.5 text-xs text-zinc-400 hover:border-[#FF3366]/50 hover:text-[#FF3366]"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-white/[0.07] bg-[#0A0A0B]" data-testid="lessons-table">
          <table className="w-full border-collapse text-sm">
            <thead><tr className="text-left text-[10px] uppercase tracking-[0.18em] text-zinc-500">{["Title", "Category", "Teacher", "Duration", "Action"].map((h) => <th key={h} className="border-b border-white/[0.06] px-6 py-3 font-medium">{h}</th>)}</tr></thead>
            <tbody>
              {lessons.map((l) => (
                <tr key={l.id} data-testid={`lesson-row-${l.id}`} onClick={() => navigate(`/dashboard/lessons/${l.id}`)} className="cursor-pointer transition-colors hover:bg-white/[0.03]">
                  <td className="border-b border-white/[0.05] px-6 py-4 text-white">{l.title}</td>
                  <td className="border-b border-white/[0.05] px-6 py-4 text-[#B800FF]">{l.category}</td>
                  <td className="border-b border-white/[0.05] px-6 py-4 text-zinc-400">{l.teacher}</td>
                  <td className="border-b border-white/[0.05] px-6 py-4 text-zinc-400">{l.duration} min</td>
                  <td className="border-b border-white/[0.05] px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1">
                      <button onClick={() => navigate(`/dashboard/lessons/${l.id}/edit`)} className="rounded-md p-1.5 text-zinc-500 hover:text-white"><Pencil className="h-4 w-4" /></button>
                      <button onClick={(e) => remove(l.id, e)} className="rounded-md p-1.5 text-zinc-500 hover:text-[#FF3366]"><Trash2 className="h-4 w-4" /></button>
                    </div>
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
