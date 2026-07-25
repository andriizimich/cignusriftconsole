import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Check } from "lucide-react";
import { api } from "@/lib/api";
import { ContentBlockCard } from "@/components/ContentBlockCard";
import { formatApiError } from "@/context/AuthContext";

const inp = "w-full rounded-md border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-[#0066FF]/50";
const lbl = "mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-zinc-500";

export default function LessonForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const [cats, setCats] = useState({});
  const [library, setLibrary] = useState({ theory: [], practice: [] });
  const [f, setF] = useState({ title: "", description: "", category: "", duration: 60, theory_ids: [], practice_ids: [], quizzes: [] });

  useEffect(() => {
    api.get("/categories").then((r) => setCats(r.data));
    Promise.all([api.get("/content-blocks?type=theory"), api.get("/content-blocks?type=practice")]).then(([t, p]) => setLibrary({ theory: t.data, practice: p.data }));
    if (editing) api.get(`/lessons/${id}`).then((r) => { const l = r.data; setF({ title: l.title, description: l.description, category: l.category, duration: l.duration, theory_ids: l.theory_ids || [], practice_ids: l.practice_ids || [], quizzes: l.quizzes || [] }); });
  }, [id, editing]);

  const toggle = (key, bid) => setF((p) => ({ ...p, [key]: p[key].includes(bid) ? p[key].filter((x) => x !== bid) : [...p[key], bid] }));
  const addQuiz = () => setF((p) => ({ ...p, quizzes: [...p.quizzes, { id: `Q${p.quizzes.length + 1}`, question: "", options: ["", "", "", ""], correct: 0, show_after: "end" }] }));
  const updateQuiz = (i, patch) => setF((p) => ({ ...p, quizzes: p.quizzes.map((q, qi) => qi === i ? { ...q, ...patch } : q) }));
  const removeQuiz = (i) => setF((p) => ({ ...p, quizzes: p.quizzes.filter((_, qi) => qi !== i) }));

  const submit = async () => {
    if (!f.title || !f.category) { toast.error("Title and category are required"); return; }
    if (f.theory_ids.length === 0 || f.practice_ids.length === 0) { toast.error("Select at least one theory and one practice block"); return; }
    try {
      if (editing) { await api.put(`/lessons/${id}`, f); toast.success("Lesson updated"); navigate(`/dashboard/lessons/${id}`); }
      else { const r = await api.post("/lessons", f); toast.success("Lesson created"); navigate(`/dashboard/lessons/${r.data.id}`); }
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };

  const Picker = ({ title, items, field }) => (
    <div>
      <p className={lbl}>{title} <span className="text-zinc-600">({f[field].length} selected)</span></p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((b) => {
          const sel = f[field].includes(b.id);
          return (
            <button key={b.id} type="button" data-testid={`pick-${field}-${b.id}`} onClick={() => toggle(field, b.id)} className={`relative overflow-hidden rounded-lg border text-left transition-colors ${sel ? "border-[#0066FF]" : "border-white/[0.07] hover:border-white/20"}`}>
              <div className="relative aspect-video"><img src={b.thumbnail} alt={b.title} className="h-full w-full object-cover" /><div className="absolute inset-0 bg-black/40" />{sel && <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#0066FF]"><Check className="h-3 w-3 text-white" /></span>}</div>
              <div className="p-3"><p className="truncate text-xs text-white">{b.title}</p><p className="mt-1 text-[10px] text-zinc-500">{b.duration} min · {b.category}</p></div>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl">
      <button onClick={() => navigate("/dashboard/lessons")} className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white"><ArrowLeft className="h-4 w-4" /> Sessions</button>
      <h1 className="mb-8 font-display text-3xl font-light tracking-tighter sm:text-4xl">{editing ? "Edit Session" : "Create Session"}</h1>

      <div className="space-y-6 rounded-lg border border-white/[0.07] bg-[#0A0A0B] p-6">
        <div><label className={lbl}>Title *</label><input data-testid="lesson-title-input" className={inp} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="e.g. MetaHuman Interview Simulation" /></div>
        <div><label className={lbl}>Short Description</label><textarea data-testid="lesson-desc-input" rows={3} className={inp} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div><label className={lbl}>Category *</label><select data-testid="lesson-category-select" className={inp} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}><option value="">Select category</option>{Object.entries(cats).map(([g, items]) => <optgroup key={g} label={g}>{items.map((c) => <option key={c} value={c}>{c}</option>)}</optgroup>)}</select></div>
          <div><label className={lbl}>Duration (min)</label><input data-testid="lesson-duration-input" type="number" className={inp} value={f.duration} onChange={(e) => setF({ ...f, duration: Number(e.target.value) })} /></div>
        </div>

        <div className="border-t border-white/[0.06] pt-6"><Picker title="Theory Blocks *" items={library.theory} field="theory_ids" /></div>
        <div className="border-t border-white/[0.06] pt-6"><Picker title="Practice Blocks *" items={library.practice} field="practice_ids" /></div>

        <div className="border-t border-white/[0.06] pt-6">
          <div className="mb-3 flex items-center justify-between"><p className={lbl + " mb-0"}>Quizzes</p><button type="button" data-testid="add-quiz-btn" onClick={addQuiz} className="inline-flex items-center gap-1.5 rounded-md border border-white/15 px-3 py-1.5 text-xs text-zinc-300 hover:text-white"><Plus className="h-3.5 w-3.5" /> Add quiz</button></div>
          <div className="space-y-4">
            {f.quizzes.map((qz, qi) => (
              <div key={qi} data-testid={`quiz-${qi}`} className="rounded-md border border-white/10 bg-black/30 p-4">
                <div className="mb-3 flex items-center gap-2"><input className={inp} value={qz.question} onChange={(e) => updateQuiz(qi, { question: e.target.value })} placeholder="Question" /><button onClick={() => removeQuiz(qi)} className="rounded-md p-2 text-zinc-500 hover:text-[#FF3366]"><Trash2 className="h-4 w-4" /></button></div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {qz.options.map((o, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <button type="button" onClick={() => updateQuiz(qi, { correct: oi })} title="Mark correct" className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${qz.correct === oi ? "border-[#00FF66] bg-[#00FF66]" : "border-white/20"}`}>{qz.correct === oi && <Check className="h-3 w-3 text-black" />}</button>
                      <input className={inp} value={o} onChange={(e) => updateQuiz(qi, { options: qz.options.map((x, xi) => xi === oi ? e.target.value : x) })} placeholder={`Option ${oi + 1}`} />
                    </div>
                  ))}
                </div>
                <div className="mt-3"><label className={lbl}>Show quiz</label><select className={inp} value={qz.show_after} onChange={(e) => updateQuiz(qi, { show_after: e.target.value })}><option value="end">At the end</option><option value="theory">After theory block</option><option value="practice">After practice block</option></select></div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2 border-t border-white/[0.06]">
          <button data-testid="lesson-submit-btn" onClick={submit} className="rounded-md bg-[#0066FF] px-5 py-2.5 text-sm font-medium text-white transition-transform active:scale-95 hover:bg-[#0066FF]/90">{editing ? "Save Changes" : "Create Session"}</button>
          <button onClick={() => navigate("/dashboard/lessons")} className="rounded-md border border-white/15 px-5 py-2.5 text-sm text-zinc-300 hover:text-white">Cancel</button>
        </div>
      </div>
    </div>
  );
}
