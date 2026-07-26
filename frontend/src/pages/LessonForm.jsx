import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Check, X, HelpCircle, Plus, LibraryBig, Search } from "lucide-react";
import { api } from "@/lib/api";
import { blockDuration } from "@/components/ContentBlockCard";
import { LibraryPickerModal } from "@/components/LibraryPickerModal";
import { formatApiError } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

const inp = "w-full rounded-md border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-[#0066FF]/50";
const lbl = "mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-zinc-500";
const newQuiz = () => ({ question: "", options: ["", "", "", ""], correct: 0 });

export default function LessonForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const { theme } = useTheme();
  const [cats, setCats] = useState({});
  const [f, setF] = useState({ title: "", description: "", category: "", duration: 40 });
  const [selected, setSelected] = useState({ theory: [], practice: [] });
  const [sectionQuiz, setSectionQuiz] = useState({ theory: null, practice: null });
  const [modal, setModal] = useState(null); // 'theory' | 'practice' | null
  const [quickQ, setQuickQ] = useState({ theory: "", practice: "" });
  const [quickRes, setQuickRes] = useState({ theory: [], practice: [] });

  useEffect(() => { api.get("/categories").then((r) => setCats(r.data)); }, []);
  useEffect(() => { api.get("/content-blocks", { params: { type: "theory", q: quickQ.theory, limit: 6 } }).then((r) => setQuickRes((s) => ({ ...s, theory: r.data.items }))); }, [quickQ.theory]);
  useEffect(() => { api.get("/content-blocks", { params: { type: "practice", q: quickQ.practice, limit: 6 } }).then((r) => setQuickRes((s) => ({ ...s, practice: r.data.items }))); }, [quickQ.practice]);

  const addBlock = (type, b) => setSelected((s) => (s[type].some((x) => x.id === b.id) ? s : { ...s, [type]: [...s[type], b] }));

  useEffect(() => {
    if (!editing) return;
    api.get(`/lessons/${id}`).then((r) => {
      const l = r.data;
      setF({ title: l.title, description: l.description, category: l.category, duration: l.duration });
      setSelected({ theory: l.theory_blocks || [], practice: l.practice_blocks || [] });
      const pick = (bid) => { const q = (l.quizzes || []).find((qz) => qz.block_id === bid); return q ? { question: q.question, options: q.options, correct: q.correct } : null; };
      setSectionQuiz({ theory: pick("theory"), practice: pick("practice") });
    });
  }, [id, editing]);

  const onConfirm = (type) => (blocks) => setSelected((s) => ({ ...s, [type]: blocks }));
  const removeBlock = (type, bid) => setSelected((s) => ({ ...s, [type]: s[type].filter((b) => b.id !== bid) }));
  const addQuiz = (type) => setSectionQuiz((m) => ({ ...m, [type]: newQuiz() }));
  const updateQuiz = (type, patch) => setSectionQuiz((m) => ({ ...m, [type]: { ...m[type], ...patch } }));
  const removeQuiz = (type) => setSectionQuiz((m) => ({ ...m, [type]: null }));

  const submit = async () => {
    if (!f.title || !f.category) { toast.error("Title and category are required"); return; }
    if (selected.theory.length === 0 || selected.practice.length === 0) { toast.error("Select at least one theory and one practice block"); return; }
    const quizzes = [];
    ["theory", "practice"].forEach((type, i) => {
      const q = sectionQuiz[type];
      if (q && q.question.trim()) quizzes.push({ id: `Q${i + 1}`, block_id: type, question: q.question, options: q.options, correct: q.correct });
    });
    const payload = { ...f, theory_ids: selected.theory.map((b) => b.id), practice_ids: selected.practice.map((b) => b.id), quizzes };
    try {
      if (editing) { await api.put(`/lessons/${id}`, payload); toast.success("Lesson updated"); navigate(`/dashboard/lessons/${id}`); }
      else { const r = await api.post("/lessons", payload); toast.success("Lesson created"); navigate(`/dashboard/lessons/${r.data.id}`); }
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };

  const QuizEditor = ({ type, accent }) => {
    const qz = sectionQuiz[type];
    const a = theme === "light" && accent === "#00FF66" ? "#0a8f4f" : accent;
    if (!qz) return <button type="button" data-testid={`add-quiz-${type}`} onClick={() => addQuiz(type)} className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-white/10 px-3 py-1.5 text-xs text-zinc-400 hover:text-white"><Plus className="h-3.5 w-3.5" /> Attach {type} quiz</button>;
    return (
      <div className="mt-4 rounded-md border p-3" style={{ borderColor: `${a}40`, background: `${a}0D` }}>
        <div className="mb-2 flex items-center gap-2"><HelpCircle className="h-4 w-4" style={{ color: a }} /><input data-testid={`quiz-question-${type}`} className={inp} value={qz.question} onChange={(e) => updateQuiz(type, { question: e.target.value })} placeholder={`${type === "theory" ? "Theory" : "Practice"} quiz question`} /><button data-testid={`quiz-remove-${type}`} onClick={() => removeQuiz(type)} className="rounded-md p-2 text-zinc-500 hover:text-[#FF3366]"><X className="h-4 w-4" /></button></div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {qz.options.map((o, oi) => (
            <div key={oi} className="flex items-center gap-2">
              <button type="button" data-testid={`quiz-correct-${type}-${oi}`} title="Mark correct" onClick={() => updateQuiz(type, { correct: oi })} className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${qz.correct === oi ? "border-[#00FF66] bg-[#00FF66]" : "border-white/20"}`}>{qz.correct === oi && <Check className="h-3 w-3 text-black" />}</button>
              <input className={inp} value={o} onChange={(e) => updateQuiz(type, { options: qz.options.map((x, xi) => (xi === oi ? e.target.value : x)) })} placeholder={`Option ${oi + 1}`} />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const Section = ({ type, accent }) => (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" /><input data-testid={`search-${type}`} className={`${inp} pl-9`} value={quickQ[type]} onChange={(e) => setQuickQ((s) => ({ ...s, [type]: e.target.value }))} placeholder={`Search ${type} library...`} /></div>
        <button type="button" data-testid={`browse-${type}`} onClick={() => setModal(type)} className="inline-flex shrink-0 items-center gap-1.5 rounded-md border px-4 py-2.5 text-sm transition-colors" style={{ borderColor: `${accent}55`, color: accent }}><LibraryBig className="h-4 w-4" /> Library</button>
      </div>
      {quickQ[type] && (
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {quickRes[type].map((b) => (
            <button key={b.id} type="button" data-testid={`quick-${type}-${b.id}`} onClick={() => addBlock(type, b)} className="flex items-center gap-2 rounded-md border border-white/[0.07] p-2 text-left hover:border-[#0066FF]/40">
              <img src={b.thumbnail} alt="" loading="lazy" className="h-9 w-14 rounded object-cover" />
              <div className="min-w-0"><p className="truncate text-[11px] text-white">{b.title}</p><p className="text-[10px] text-zinc-500">{blockDuration(b)}</p></div>
            </button>
          ))}
          {quickRes[type].length === 0 && <p className="col-span-full text-xs text-zinc-600">No matches — try the full Library.</p>}
        </div>
      )}
      <p className={lbl}>{type === "theory" ? "Theory" : "Practice"} Blocks * <span className="text-zinc-600">({selected[type].length})</span></p>
      {selected[type].length === 0 ? (
        <button type="button" onClick={() => setModal(type)} className="flex w-full items-center justify-center rounded-lg border border-dashed border-white/15 py-8 text-sm text-zinc-500 hover:border-[#0066FF]/40 hover:text-white">Open library to add {type} blocks</button>
      ) : (
        <div className="space-y-3">
          {selected[type].map((b) => (
            <div key={b.id} data-testid={`selected-${type}-${b.id}`} className="rounded-lg border border-white/[0.07] bg-black/30 p-3">
              <div className="flex items-center gap-3"><img src={b.thumbnail} alt="" className="h-10 w-16 rounded object-cover" /><div className="flex-1"><p className="text-sm text-white">{b.title}</p><p className="text-[11px] text-zinc-500">{blockDuration(b)} · {b.category}</p></div><button data-testid={`remove-${type}-${b.id}`} onClick={() => removeBlock(type, b.id)} className="rounded-md p-1.5 text-zinc-500 hover:text-[#FF3366]"><X className="h-4 w-4" /></button></div>
            </div>
          ))}
        </div>
      )}
      <p className="mt-5 text-[10px] uppercase tracking-[0.2em] text-zinc-600">{type === "theory" ? "Theory" : "Practice"} Quiz <span className="normal-case tracking-normal">(optional · one per section)</span></p>
      <QuizEditor type={type} accent={accent} />
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
          <div><label className={lbl}>Duration (min · max 40)</label><input data-testid="lesson-duration-input" type="number" min={1} max={40} className={inp} value={f.duration} onChange={(e) => setF({ ...f, duration: Math.min(40, Math.max(1, Number(e.target.value) || 1)) })} /></div>
        </div>
        <div className="border-t border-white/[0.06] pt-6"><Section type="theory" accent="#0066FF" /></div>
        <div className="border-t border-white/[0.06] pt-6"><Section type="practice" accent="#00FF66" /></div>
        <div className="flex gap-3 border-t border-white/[0.06] pt-4">
          <button data-testid="lesson-submit-btn" onClick={submit} className="rounded-md bg-[#0066FF] px-5 py-2.5 text-sm font-medium text-white transition-transform active:scale-95 hover:bg-[#0066FF]/90">{editing ? "Save Changes" : "Create Session"}</button>
          <button onClick={() => navigate("/dashboard/lessons")} className="rounded-md border border-white/15 px-5 py-2.5 text-sm text-zinc-300 hover:text-white">Cancel</button>
        </div>
      </div>

      <LibraryPickerModal open={modal === "theory"} type="theory" initialBlocks={selected.theory} onClose={() => setModal(null)} onConfirm={onConfirm("theory")} />
      <LibraryPickerModal open={modal === "practice"} type="practice" initialBlocks={selected.practice} onClose={() => setModal(null)} onConfirm={onConfirm("practice")} />
    </div>
  );
}
