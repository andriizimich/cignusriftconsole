import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Search, Check, Plus, UserPlus } from "lucide-react";
import { api } from "@/lib/api";

const inp = "w-full rounded-md border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-[#0066FF]/50";
const lbl = "mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-zinc-500";

export default function GroupForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const [cats, setCats] = useState({});
  const [students, setStudents] = useState([]);
  const [q, setQ] = useState("");
  const [form, setForm] = useState({ name: "", direction: "", student_ids: [] });
  const [showAdd, setShowAdd] = useState(false);
  const [newStu, setNewStu] = useState({ name: "", institution: "", division: "", email: "", phone: "" });

  const loadStudents = () => api.get("/students").then((r) => setStudents(r.data));
  useEffect(() => {
    api.get("/categories").then((r) => setCats(r.data));
    loadStudents();
    if (editing) api.get(`/groups/${id}`).then((r) => { const g = r.data; setForm({ name: g.name, direction: g.direction, student_ids: g.student_ids || [] }); });
  }, [id, editing]);

  const toggle = (sid) => setForm((p) => ({ ...p, student_ids: p.student_ids.includes(sid) ? p.student_ids.filter((x) => x !== sid) : [...p.student_ids, sid] }));

  const addStudent = async () => {
    if (!newStu.name) { toast.error("Student name is required"); return; }
    const r = await api.post("/students", newStu);
    await loadStudents();
    setForm((p) => ({ ...p, student_ids: [...p.student_ids, r.data.id] }));
    setNewStu({ name: "", institution: "", division: "", email: "", phone: "" });
    setShowAdd(false);
    toast.success("Student added");
  };

  const submit = async () => {
    if (!form.name || !form.direction) { toast.error("Name and direction are required"); return; }
    if (editing) { await api.put(`/groups/${id}`, form); toast.success("Group updated"); navigate(`/dashboard/groups/${id}`); }
    else { const r = await api.post("/groups", form); toast.success("Group created"); navigate(`/dashboard/groups/${r.data.id}`); }
  };

  const filtered = students.filter((s) => s.name.toLowerCase().includes(q.toLowerCase()) || (s.email || "").toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="max-w-3xl">
      <button onClick={() => navigate("/dashboard/groups")} className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white"><ArrowLeft className="h-4 w-4" /> Groups</button>
      <h1 className="mb-8 font-display text-3xl font-light tracking-tighter sm:text-4xl">{editing ? "Edit Group" : "Create Group"}</h1>

      <div className="space-y-5 rounded-lg border border-white/[0.07] bg-[#0A0A0B] p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <div><label className={lbl}>Group Name *</label><input data-testid="group-name-input" className={inp} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. CS Cohort A" /></div>
          <div><label className={lbl}>Direction *</label><select data-testid="group-direction-select" className={inp} value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value })}><option value="">Select direction</option>{Object.entries(cats).map(([grp, items]) => <optgroup key={grp} label={grp}>{items.map((c) => <option key={c} value={c}>{c}</option>)}</optgroup>)}</select></div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className={lbl + " mb-0"}>Students ({form.student_ids.length} selected)</label>
            <button type="button" data-testid="toggle-add-student" onClick={() => setShowAdd((v) => !v)} className="inline-flex items-center gap-1.5 rounded-md border border-white/15 px-3 py-1.5 text-xs text-zinc-300 hover:text-white"><UserPlus className="h-3.5 w-3.5" /> Add new student</button>
          </div>

          {showAdd && (
            <div className="mb-3 grid grid-cols-1 gap-2 rounded-md border border-[#0066FF]/25 bg-[#0066FF]/5 p-4 sm:grid-cols-2" data-testid="add-student-panel">
              <input data-testid="new-student-name" className={inp} value={newStu.name} onChange={(e) => setNewStu({ ...newStu, name: e.target.value })} placeholder="Full name *" />
              <input data-testid="new-student-institution" className={inp} value={newStu.institution} onChange={(e) => setNewStu({ ...newStu, institution: e.target.value })} placeholder="Institution / Company" />
              <input data-testid="new-student-division" className={inp} value={newStu.division} onChange={(e) => setNewStu({ ...newStu, division: e.target.value })} placeholder="Division" />
              <input data-testid="new-student-email" className={inp} value={newStu.email} onChange={(e) => setNewStu({ ...newStu, email: e.target.value })} placeholder="Email" />
              <input data-testid="new-student-phone" className={inp} value={newStu.phone} onChange={(e) => setNewStu({ ...newStu, phone: e.target.value })} placeholder="Phone" />
              <button data-testid="save-new-student" onClick={addStudent} className="inline-flex items-center justify-center gap-1.5 rounded-md bg-[#0066FF] px-4 py-2.5 text-sm font-medium text-white active:scale-95"><Plus className="h-4 w-4" /> Add to group</button>
            </div>
          )}

          <div className="relative mb-2"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" /><input data-testid="student-search-input" className={`${inp} pl-9`} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search students..." /></div>
          <div className="max-h-72 space-y-1 overflow-y-auto rounded-md border border-white/10 p-2">
            {filtered.map((s) => {
              const sel = form.student_ids.includes(s.id);
              return (
                <button key={s.id} data-testid={`student-option-${s.id}`} onClick={() => toggle(s.id)} className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${sel ? "bg-[#0066FF]/10 text-white" : "text-zinc-400 hover:bg-white/5"}`}>
                  <span className={`flex h-4 w-4 items-center justify-center rounded-sm border ${sel ? "border-[#0066FF] bg-[#0066FF]" : "border-white/20"}`}>{sel && <Check className="h-3 w-3 text-white" />}</span>
                  <span className="flex-1">{s.name}</span>
                  <span className="text-[11px] text-zinc-600">{s.institution}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3 border-t border-white/[0.06] pt-4">
          <button data-testid="group-submit-btn" onClick={submit} className="rounded-md bg-[#0066FF] px-5 py-2.5 text-sm font-medium text-white transition-transform active:scale-95 hover:bg-[#0066FF]/90">{editing ? "Save Changes" : "Create Group"}</button>
          <button onClick={() => navigate("/dashboard/groups")} className="rounded-md border border-white/15 px-5 py-2.5 text-sm text-zinc-300 hover:text-white">Cancel</button>
        </div>
      </div>
    </div>
  );
}
