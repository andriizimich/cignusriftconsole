import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Search, Check, Plus, UserPlus } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/base/Button";
import { Heading } from "@/components/base/Heading";

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
  const [hydrated, setHydrated] = useState(!id);

  const loadStudents = () => api.get("/students").then((r) => setStudents(r.data));
  useEffect(() => {
    api.get("/categories").then((r) => setCats(r.data));
    loadStudents();
    if (editing) api.get(`/groups/${id}`).then((r) => { const g = r.data; setForm({ name: g.name, direction: g.direction, student_ids: g.student_ids || [] }); setHydrated(true); });
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
      <Button variant="bare" onClick={() => navigate("/dashboard/groups")} className="cr-backlink"><ArrowLeft className="h-4 w-4" /> Groups</Button>
      <Heading level={1} bare className="cr-form-h1">{editing ? "Edit Group" : "Create Group"}</Heading>

      <div className="cr-panel space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div><label className="cr-label">Group Name *</label><input data-testid="group-name-input" disabled={!hydrated} className="cr-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. CS Cohort A" /></div>
          <div><label className="cr-label">Direction *</label><select data-testid="group-direction-select" disabled={!hydrated} className="cr-input" value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value })}><option value="">Select direction</option>{Object.entries(cats).map(([grp, items]) => <optgroup key={grp} label={grp}>{items.map((c) => <option key={c} value={c}>{c}</option>)}</optgroup>)}</select></div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="cr-label mb-0">Students ({form.student_ids.length} selected)</label>
            <Button variant="bare" type="button" data-testid="toggle-add-student" onClick={() => setShowAdd((v) => !v)} className="cr-btn-sm"><UserPlus className="h-3.5 w-3.5" /> Add new student</Button>
          </div>

          {showAdd && (
            <div className="cr-addpanel" data-testid="add-student-panel">
              <input data-testid="new-student-name" className="cr-input" value={newStu.name} onChange={(e) => setNewStu({ ...newStu, name: e.target.value })} placeholder="Full name *" />
              <input data-testid="new-student-institution" className="cr-input" value={newStu.institution} onChange={(e) => setNewStu({ ...newStu, institution: e.target.value })} placeholder="Institution / Company" />
              <input data-testid="new-student-division" className="cr-input" value={newStu.division} onChange={(e) => setNewStu({ ...newStu, division: e.target.value })} placeholder="Division" />
              <input data-testid="new-student-email" className="cr-input" value={newStu.email} onChange={(e) => setNewStu({ ...newStu, email: e.target.value })} placeholder="Email" />
              <input data-testid="new-student-phone" className="cr-input" value={newStu.phone} onChange={(e) => setNewStu({ ...newStu, phone: e.target.value })} placeholder="Phone" />
              <Button variant="bare" data-testid="save-new-student" onClick={addStudent} className="cr-btn-primary justify-center"><Plus className="h-4 w-4" /> Add to group</Button>
            </div>
          )}

          <div className="relative mb-2"><Search className="cr-field-icon" /><input data-testid="student-search-input" className="cr-input pl-9" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search students..." /></div>
          <div className="cr-list-box max-h-72">
            {filtered.map((s) => {
              const sel = form.student_ids.includes(s.id);
              return (
                <Button variant="bare" key={s.id} data-testid={`student-option-${s.id}`} onClick={() => toggle(s.id)} className={`cr-checkitem ${sel ? "is-sel" : ""}`}>
                  <span className={`cr-checkbox ${sel ? "is-sel" : ""}`}>{sel && <Check className="h-3 w-3 text-white" />}</span>
                  <span className="flex-1">{s.name}</span>
                  <span className="cr-checkitem-sub">{s.institution}</span>
                </Button>
              );
            })}
          </div>
        </div>

        <div className="cr-divider-top flex gap-3">
          <Button variant="bare" data-testid="group-submit-btn" disabled={!hydrated} onClick={submit} className="cr-btn-primary">{editing ? "Save Changes" : "Create Group"}</Button>
          <Button variant="bare" onClick={() => navigate("/dashboard/groups")} className="cr-btn-ghost">Cancel</Button>
        </div>
      </div>
    </div>
  );
}
