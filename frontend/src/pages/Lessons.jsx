import { useEffect, useState, useMemo } from "react";
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
  const [sort, setSort] = useState({ field: "title", dir: "asc" });

  const sorted = useMemo(() => {
    const dir = sort.dir === "asc" ? 1 : -1;
    const val = (l) => (sort.field === "duration" ? l.duration : (l[sort.field] || "").toLowerCase());
    return [...lessons].sort((a, b) => { const va = val(a), vb = val(b); return va < vb ? -dir : va > vb ? dir : 0; });
  }, [lessons, sort]);

  const load = () => {
    const params = {};
    if (q) params.q = q;
    if (category) params.category = category;
    api.get("/lessons", { params }).then((r) => setLessons(r.data));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [q, category]);
  useEffect(() => { api.get("/categories").then((r) => setCats(r.data)); }, []);

  const remove = async (id, e) => { e.stopPropagation(); await api.delete(`/lessons/${id}`); toast.success("Lesson deleted"); load(); };

  return (
    <div>
      <PageHeader overline="Content" title="Sessions" subtitle="Your VR lesson library with theory + practice blocks and quizzes."
        action={<button data-testid="new-lesson-btn" onClick={() => navigate("/dashboard/lessons/new")} className="cr-btn-primary"><Plus className="h-4 w-4" /> Create Session</button>} />

      <div className="cr-toolbar">
        <div className="cr-search"><Search className="cr-search-icon" /><input data-testid="lesson-search-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by topic..." className="cr-search-input" /></div>
        <select data-testid="lesson-filter-category" value={category} onChange={(e) => setCategory(e.target.value)} className="cr-select">
          <option value="">All categories</option>
          {Object.entries(cats).map(([grp, items]) => <optgroup key={grp} label={grp}>{items.map((c) => <option key={c} value={c}>{c}</option>)}</optgroup>)}
        </select>
        <select data-testid="lesson-sort-field" value={sort.field} onChange={(e) => setSort((s) => ({ ...s, field: e.target.value }))} className="cr-select">
          <option value="title">Sort: Title</option>
          <option value="category">Sort: Category</option>
          <option value="duration">Sort: Duration</option>
        </select>
        <button data-testid="lesson-sort-dir" onClick={() => setSort((s) => ({ ...s, dir: s.dir === "asc" ? "desc" : "asc" }))} className="cr-select uppercase">{sort.dir === "asc" ? "Asc ↑" : "Desc ↓"}</button>
        <div className="cr-viewtoggle">
          <button data-testid="lesson-view-grid" onClick={() => setView("grid")} className={`cr-viewtoggle-btn ${view === "grid" ? "is-active" : ""}`}><LayoutGrid className="h-4 w-4" /></button>
          <button data-testid="lesson-view-table" onClick={() => setView("table")} className={`cr-viewtoggle-btn ${view === "table" ? "is-active" : ""}`}><Table2 className="h-4 w-4" /></button>
        </div>
      </div>

      {sorted.length === 0 && <p className="cr-empty">No lessons match your filters.</p>}

      {view === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((l, i) => (
            <motion.div key={l.id} data-testid={`lesson-card-${l.id}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: i * 0.04 }} whileHover={{ y: -4 }} onClick={() => navigate(`/dashboard/lessons/${l.id}`)} className="cr-lesson-card">
              <span className="cr-catbadge"><Tag className="h-3 w-3" />{l.category}</span>
              <h3 className="cr-lesson-title">{l.title}</h3>
              <div className="cr-lesson-meta">
                <span className="flex items-center gap-1.5"><UserRound className="h-3.5 w-3.5" /> {l.teacher}</span>
                <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {l.duration} min</span>
              </div>
              <div className="cr-lesson-actions" onClick={(e) => e.stopPropagation()}>
                <button data-testid={`lesson-edit-${l.id}`} onClick={() => navigate(`/dashboard/lessons/${l.id}/edit`)} className="cr-btn-sm"><Pencil className="h-3.5 w-3.5" /> Edit</button>
                <button data-testid={`lesson-delete-${l.id}`} onClick={(e) => remove(l.id, e)} className="cr-btn-sm cr-btn-sm-danger"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="cr-widget overflow-x-auto" data-testid="lessons-table">
          <table className="cr-table">
            <thead><tr className="cr-thead-row">{["Title", "Category", "Teacher", "Duration", "Action"].map((h) => <th key={h} className="cr-th">{h}</th>)}</tr></thead>
            <tbody>
              {sorted.map((l) => (
                <tr key={l.id} data-testid={`lesson-row-${l.id}`} onClick={() => navigate(`/dashboard/lessons/${l.id}`)} className="cr-row cursor-pointer">
                  <td className="cr-td cr-td-strong">{l.title}</td>
                  <td className="cr-td cr-cat-text">{l.category}</td>
                  <td className="cr-td">{l.teacher}</td>
                  <td className="cr-td">{l.duration} min</td>
                  <td className="cr-td" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1">
                      <button onClick={() => navigate(`/dashboard/lessons/${l.id}/edit`)} className="cr-btn-icon"><Pencil className="h-4 w-4" /></button>
                      <button onClick={(e) => remove(l.id, e)} className="cr-btn-icon cr-btn-icon-danger"><Trash2 className="h-4 w-4" /></button>
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
