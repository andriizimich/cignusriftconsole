import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Search, Check } from "lucide-react";
import { api } from "@/lib/api";

export default function GroupForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const [meta, setMeta] = useState({ courses: [], teachers: [], students: [] });
  const [q, setQ] = useState("");
  const [form, setForm] = useState({ name: "", course: "", teacher: "", institution: "", division: "", limit: 30, student_ids: [] });

  useEffect(() => {
    api.get("/meta").then((r) => setMeta(r.data));
    if (editing) api.get(`/groups/${id}`).then((r) => {
      const g = r.data;
      setForm({ name: g.name, course: g.course, teacher: g.teacher, institution: g.institution || "", division: g.division || "", limit: g.limit, student_ids: g.student_ids || [] });
    });
  }, [id, editing]);

  const toggle = (sid) => setForm((f) => ({ ...f, student_ids: f.student_ids.includes(sid) ? f.student_ids.filter((x) => x !== sid) : [...f.student_ids, sid] }));

  const submit = async () => {
    if (!form.name || !form.course || !form.teacher) { toast.error("Name, course and teacher are required"); return; }
    if (editing) { await api.put(`/groups/${id}`, form); toast.success("Group updated"); navigate(`/dashboard/groups/${id}`); }
    else { const r = await api.post("/groups", form); toast.success("Group created"); navigate(`/dashboard/groups/${r.data.id}`); }
  };

  const inp = "w-full rounded-md border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-[#0066FF]/50";
  const lbl = "mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-zinc-500";
  const students = meta.students.filter((s) => s.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="max-w-3xl">
      <button onClick={() => navigate("/dashboard/groups")} className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white"><ArrowLeft className="h-4 w-4" /> Groups</button>
      <h1 className="mb-8 font-display text-3xl font-light tracking-tighter sm:text-4xl">{editing ? "Edit Group" : "Create Group"}</h1>

      <div className="space-y-5 rounded-lg border border-white/[0.07] bg-[#0A0A0B] p-6">
        <div><label className={lbl}>Group Name *</label><input data-testid="group-name-input" className={inp} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Alpha Cohort" /></div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div><label className={lbl}>Course *</label><select data-testid="group-course-select" className={inp} value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })}><option value="">Select course</option>{meta.courses.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div>
          <div><label className={lbl}>Teacher *</label><select data-testid="group-teacher-select" className={inp} value={form.teacher} onChange={(e) => setForm({ ...form, teacher: e.target.value })}><option value="">Assign teacher</option>{meta.teachers.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}</select></div>
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          <div><label className={lbl}>Institution</label><input className={inp} value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} /></div>
          <div><label className={lbl}>Division</label><input className={inp} value={form.division} onChange={(e) => setForm({ ...form, division: e.target.value })} /></div>
          <div><label className={lbl}>Seat Limit</label><input type="number" className={inp} value={form.limit} onChange={(e) => setForm({ ...form, limit: Number(e.target.value) })} /></div>
        </div>

        <div>
          <label className={lbl}>Students ({form.student_ids.length} selected)</label>
          <div className="relative mb-2"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" /><input data-testid="student-search-input" className={`${inp} pl-9`} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search students..." /></div>
          <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border border-white/10 p-2">
            {students.map((s) => {
              const sel = form.student_ids.includes(s.id);
              return (
                <button key={s.id} data-testid={`student-option-${s.id}`} onClick={() => toggle(s.id)} className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${sel ? "bg-[#0066FF]/10 text-white" : "text-zinc-400 hover:bg-white/5"}`}>
                  <span className={`flex h-4 w-4 items-center justify-center rounded-sm border ${sel ? "border-[#0066FF] bg-[#0066FF]" : "border-white/20"}`}>{sel && <Check className="h-3 w-3 text-white" />}</span>
                  {s.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button data-testid="group-submit-btn" onClick={submit} className="rounded-md bg-[#0066FF] px-5 py-2.5 text-sm font-medium text-white transition-transform active:scale-95 hover:bg-[#0066FF]/90">{editing ? "Save Changes" : "Create Group"}</button>
          <button onClick={() => navigate("/dashboard/groups")} className="rounded-md border border-white/15 px-5 py-2.5 text-sm text-zinc-300 hover:text-white">Cancel</button>
        </div>
      </div>
    </div>
  );
}
