import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Search, Check, X, HelpCircle, Plus } from "lucide-react";
import { api } from "@/lib/api";
import { blockDuration } from "@/components/ContentBlockCard";
import { formatApiError } from "@/context/AuthContext";

const inp = "w-full rounded-md border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-[#0066FF]/50";
const lbl = "mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-zinc-500";
const emptyQuiz = { question: "", options: ["", "", "", ""], correct: 0 };

export default function LessonForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const [cats, setCats] = useState({});
  const [f, setF] = useState({ title: "", description: "", category: "", duration: 60 });
  const [selected, setSelected] = useState({ theory: [], practice: [] });
  const [quizzes, setQuizzes] = useState({}); // block_id -> {question, options, correct}
  const [q, setQ] = useState({ theory: "", practice: "" });
  const [results, setResults] = useState({ theory: [], practice: [] });

  useEffect(() => { api.get("/categories").then((r) => setCats(r.data)); }, []);

  const search = (type, term) => api.get("/content-blocks", { params: { type, q: term, limit: 9 } }).then((r) => setResults((s) => ({ ...s, [type]: r.data.items })));
  useEffect(() => { search("theory", q.theory); }, [q.theory]);
  useEffect(() => { search("practice", q.practice); }, [q.practice]);

  useEffect(() => {
    if (!editing) return;
    api.get(`/lessons/${id}`).then((r) => {
      const l = r.data;
      setF({ title: l.title, description: l.description, category: l.category, duration: l.duration });
      setSelected({ theory: l.theory_blocks || [], practice: l.practice_blocks || [] });
      const qm = {};
      (l.quizzes || []).forEach((qz) => { qm[qz.block_id] = { question: qz.question, options: qz.options, correct: qz.correct }; });
      setQuizzes(qm);
    });
  }, [id, editing]);

  const isSel = (type, bid) => selected[type].some((b) => b.id === bid);
  const toggle = (type, block) => setSelected((s) => ({ ...s, [type]: isSel(type, block.id) ? s[type].filter((b) => b.id !== block.id) : [...s[type], block] }));
  const removeBlock = (type, bid) => { setSelected((s) => ({ ...s, [type]: s[type].filter((b) => b.id !== bid) })); setQuizzes((m) => { const n = { ...m }; delete n[bid]; return n; }); };
  const addQuiz = (bid) => setQuizzes((m) => ({ ...m, [bid]: { ...emptyQuiz } }));
  const updateQuiz = (bid, patch) => setQuizzes((m) => ({ ...m, [bid]: { ...m[bid], ...patch } }));
  const removeQuiz = (bid) => setQuizzes((m) => { const n = { ...m }; delete n[bid]; return n; });

  const submit = async () => {
    if (!f.title || !f.category) { toast.error("Title and category are required"); return; }
    if (selected.theory.length === 0 || selected.practice.length === 0) { toast.error("Select at least one theory and one practice block"); return; }
    const payload = {
      ...f,
      theory_ids: selected.theory.map((b) => b.id),
      practice_ids: selected.practice.map((b) => b.id),
      quizzes: Object.entries(quizzes).map(([block_id, qz], i) => ({ id: `Q${i + 1}`, block_id, ...qz })),
    };
    try {
      if (editing) { await api.put(`/lessons/${id}`, payload); toast.success("Lesson updated"); navigate(`/dashboard/lessons/${id}`); }
      else { const r = await api.post("/lessons", payload); toast.success("Lesson created"); navigate(`/dashboard/lessons/${r.data.id}`); }
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };

  const QuizEditor = ({ bid }) => {
    const qz = quizzes[bid];
    if (!qz) return <button type="button" data-testid={`add-quiz-${bid}`} onClick={() => addQuiz(bid)} className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-white/10 px-3 py-1.5 text-xs text-zinc-400 hover:text-white"><Plus className="h-3.5 w-3.5" /> Attach quiz</button>;
    return (
      <div className="mt-3 rounded-md border border-[#0066FF]/25 bg-[#0066FF]/5 p-3">
        <div className="mb-2 flex items-center gap-2"><HelpCircle className="h-4 w-4 text-[#0066FF]" /><input className={inp} value={qz.question} onChange={(e) => updateQuiz(bid, { question: e.target.value })} placeholder="Quiz question" /><button onClick={() => removeQuiz(bid)} className="rounded-md p-2 text-zinc-500 hover:text-[#FF3366]"><X className="h-4 w-4" /></button></div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {qz.options.map((o, oi) => (
            <div key={oi} className="flex items-center gap-2">
              <button type="button" title="Mark correct" onClick={() => updateQuiz(bid, { correct: oi })} className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${qz.correct === oi ? "border-[#00FF66] bg-[#00FF66]" : "border-white/20"}`}>{qz.correct === oi && <Check className="h-3 w-3 text-black" />}</button>
              <input className={inp} value={o} onChange={(e) => updateQuiz(bid, { options: qz.options.map((x, xi) => (xi === oi ? e.target.value : x)) })} placeholder={`Option ${oi + 1}`} />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const Picker = ({ type, accent }) => (
    <div>
      <div className="relative mb-3"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" /><input data-testid={`search-${type}`} className={`${inp} pl-9`} value={q[type]} onChange={(e) => setQ((s) => ({ ...s, [type]: e.target.value }))} placeholder={`Search ${type} library...`} /></div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {results[type].map((b) => {
          const sel = isSel(type, b.id);
          return (
            <button key={b.id} type="button" data-testid={`pick-${type}-${b.id}`} onClick={() => toggle(type, b)} className={`relative overflow-hidden rounded-md border text-left transition-colors ${sel ? "border-[#0066FF]" : "border-white/[0.07] hover:border-white/20"}`}>
              <div className="relative aspect-video"><img src={b.thumbnail} alt={b.title} loading="lazy" className="h-full w-full object-cover" /><div className="absolute inset-0 bg-black/40" />{sel && <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#0066FF]"><Check className="h-3 w-3 text-white" /></span>}</div>
              <div className="p-2"><p className="truncate text-[11px] text-white">{b.title}</p><p className="text-[10px] text-zinc-500">{blockDuration(b)}</p></div>
            </button>
          );
        })}
      </div>
      {selected[type].length > 0 && (
        <div className="mt-4 space-y-3">
          <p className={lbl}>Selected {type} ({selected[type].length}) · attach a quiz to each</p>
          {selected[type].map((b) => (
            <div key={b.id} data-testid={`selected-${type}-${b.id}`} className="rounded-lg border border-white/[0.07] bg-black/30 p-3">
              <div className="flex items-center gap-3"><img src={b.thumbnail} alt="" className="h-10 w-16 rounded object-cover" /><div className="flex-1"><p className="text-sm text-white">{b.title}</p><p className="text-[11px] text-zinc-500">{blockDuration(b)} · {b.category}</p></div><button onClick={() => removeBlock(type, b.id)} className="rounded-md p-1.5 text-zinc-500 hover:text-[#FF3366]"><X className="h-4 w-4" /></button></div>
              <QuizEditor bid={b.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl">
      <button onClick={() => navigate("/dashboard/lessons")} className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white"><ArrowLeft className="h-4 w-4" /> Sessions</button>
      <h1 className="mb-8 font-display text-3xl font-light tracking-tighter sm:text-4xl">{editing ? "Edit Session" : "Create Session"}</h1>

      <div className="space-y-6 rounded-lg border border-white/[0.07] bg-[#0A0A0B] p-6">
        <div><label className={lbl}>Title *</label><input data-testid="lesson-title-input" className={inp} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="e.g. MetaHuman Interview Simulation" /></div>
        <div><label className={lbl}>Short Description</label><textarea data-testid="lesson-desc-input" rows={2} className={inp} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div><label className={lbl}>Category *</label><select data-testid="lesson-category-select" className={inp} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}><option value="">Select category</option>{Object.entries(cats).map(([g, items]) => <optgroup key={g} label={g}>{items.map((c) => <option key={c} value={c}>{c}</option>)}</optgroup>)}</select></div>
          <div><label className={lbl}>Duration (min)</label><input data-testid="lesson-duration-input" type="number" className={inp} value={f.duration} onChange={(e) => setF({ ...f, duration: Number(e.target.value) })} /></div>
        </div>
        <div className="border-t border-white/[0.06] pt-6"><p className={lbl}>Theory Blocks * (from library)</p><Picker type="theory" /></div>
        <div className="border-t border-white/[0.06] pt-6"><p className={lbl}>Practice Blocks * (from library)</p><Picker type="practice" /></div>

        <div className="flex gap-3 border-t border-white/[0.06] pt-4">
          <button data-testid="lesson-submit-btn" onClick={submit} className="rounded-md bg-[#0066FF] px-5 py-2.5 text-sm font-medium text-white transition-transform active:scale-95 hover:bg-[#0066FF]/90">{editing ? "Save Changes" : "Create Session"}</button>
          <button onClick={() => navigate("/dashboard/lessons")} className="rounded-md border border-white/15 px-5 py-2.5 text-sm text-zinc-300 hover:text-white">Cancel</button>
        </div>
      </div>
    </div>
  );
}
