import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Check, X, HelpCircle, Plus, LibraryBig, Search } from "lucide-react";
import { api } from "@/lib/api";
import { blockDuration } from "@/components/ContentBlockCard";
import { LibraryPickerModal } from "@/components/LibraryPickerModal";
import { formatApiError } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/base/Button";
import { Img } from "@/components/base/Img";
import { Heading } from "@/components/base/Heading";

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
  const [modal, setModal] = useState(null);
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
    if (!qz) return <Button variant="bare" type="button" data-testid={`add-quiz-${type}`} onClick={() => addQuiz(type)} className="mt-4 cr-btn-sm"><Plus className="h-3.5 w-3.5" /> Attach {type} quiz</Button>;
    return (
      <div className="mt-4 rounded-md border p-3" style={{ borderColor: `${a}40`, background: `${a}0D` }}>
        <div className="mb-2 flex items-center gap-2"><HelpCircle className="h-4 w-4" style={{ color: a }} /><input data-testid={`quiz-question-${type}`} className="cr-input" value={qz.question} onChange={(e) => updateQuiz(type, { question: e.target.value })} placeholder={`${type === "theory" ? "Theory" : "Practice"} quiz question`} /><Button variant="bare" data-testid={`quiz-remove-${type}`} onClick={() => removeQuiz(type)} className="cr-btn-icon cr-btn-icon-danger"><X className="h-4 w-4" /></Button></div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {qz.options.map((o, oi) => (
            <div key={oi} className="flex items-center gap-2">
              <Button variant="bare" type="button" data-testid={`quiz-correct-${type}-${oi}`} title="Mark correct" onClick={() => updateQuiz(type, { correct: oi })} className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border" style={{ borderColor: qz.correct === oi ? a : "var(--cr-border-strong-2)", backgroundColor: qz.correct === oi ? a : "transparent" }}>{qz.correct === oi && <Check className="h-3 w-3" style={{ color: "#fff" }} />}</Button>
              <input className="cr-input" value={o} onChange={(e) => updateQuiz(type, { options: qz.options.map((x, xi) => (xi === oi ? e.target.value : x)) })} placeholder={`Option ${oi + 1}`} />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const Section = ({ type, accent }) => (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <div className="relative flex-1"><Search className="cr-field-icon" /><input data-testid={`search-${type}`} className="cr-input pl-9" value={quickQ[type]} onChange={(e) => setQuickQ((s) => ({ ...s, [type]: e.target.value }))} placeholder={`Search ${type} library...`} /></div>
        <Button variant="bare" type="button" data-testid={`browse-${type}`} onClick={() => setModal(type)} className="inline-flex shrink-0 items-center gap-1.5 rounded-md border px-4 py-2.5 text-sm transition-colors" style={{ borderColor: `${accent}55`, color: accent }}><LibraryBig className="h-4 w-4" /> Library</Button>
      </div>
      {quickQ[type] && (
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {quickRes[type].map((b) => (
            <Button variant="bare" key={b.id} type="button" data-testid={`quick-${type}-${b.id}`} onClick={() => addBlock(type, b)} className="cr-quicktile">
              <Img src={b.thumbnail} alt="" loading="lazy" className="h-9 w-14 rounded object-cover" />
              <div className="min-w-0"><p className="cr-quicktile-title">{b.title}</p><p className="cr-quicktile-meta">{blockDuration(b)}</p></div>
            </Button>
          ))}
          {quickRes[type].length === 0 && <p className="col-span-full text-xs cr-faint-note">No matches — try the full Library.</p>}
        </div>
      )}
      <p className="cr-label">{type === "theory" ? "Theory" : "Practice"} Blocks * <span className="cr-faint-note">({selected[type].length})</span></p>
      {selected[type].length === 0 ? (
        <Button variant="bare" type="button" onClick={() => setModal(type)} className="cr-dashed">Open library to add {type} blocks</Button>
      ) : (
        <div className="space-y-3">
          {selected[type].map((b) => (
            <div key={b.id} data-testid={`selected-${type}-${b.id}`} className="cr-selblock">
              <div className="flex items-center gap-3"><Img src={b.thumbnail} alt="" className="h-10 w-16 rounded object-cover" /><div className="flex-1"><p className="cr-t text-sm">{b.title}</p><p className="cr-tm text-[11px]">{blockDuration(b)} · {b.category}</p></div><Button variant="bare" data-testid={`remove-${type}-${b.id}`} onClick={() => removeBlock(type, b.id)} className="cr-btn-icon cr-btn-icon-danger"><X className="h-4 w-4" /></Button></div>
            </div>
          ))}
        </div>
      )}
      <p className="mt-5 cr-widget-note">{type === "theory" ? "Theory" : "Practice"} Quiz <span className="normal-case tracking-normal">(optional · one per section)</span></p>
      <QuizEditor type={type} accent={accent} />
    </div>
  );

  return (
    <div className="max-w-4xl">
      <Button variant="bare" onClick={() => navigate("/dashboard/lessons")} className="cr-backlink"><ArrowLeft className="h-4 w-4" /> Sessions</Button>
      <Heading level={1} bare className="cr-form-h1">{editing ? "Edit Session" : "Create Session"}</Heading>

      <div className="cr-panel space-y-6">
        <div><label className="cr-label">Title *</label><input data-testid="lesson-title-input" className="cr-input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="e.g. MetaHuman Interview Simulation" /></div>
        <div><label className="cr-label">Short Description</label><textarea data-testid="lesson-desc-input" rows={2} className="cr-input" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div><label className="cr-label">Category *</label><select data-testid="lesson-category-select" className="cr-input" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}><option value="">Select category</option>{Object.entries(cats).map(([g, items]) => <optgroup key={g} label={g}>{items.map((c) => <option key={c} value={c}>{c}</option>)}</optgroup>)}</select></div>
          <div><label className="cr-label">Duration (min · max 40)</label><input data-testid="lesson-duration-input" type="number" min={1} max={40} className="cr-input" value={f.duration} onChange={(e) => setF({ ...f, duration: Math.min(40, Math.max(1, Number(e.target.value) || 1)) })} /></div>
        </div>
        <div className="cr-divider-top-6"><Section type="theory" accent="#0066FF" /></div>
        <div className="cr-divider-top-6"><Section type="practice" accent="#00FF66" /></div>
        <div className="cr-divider-top flex gap-3">
          <Button variant="bare" data-testid="lesson-submit-btn" onClick={submit} className="cr-btn-primary">{editing ? "Save Changes" : "Create Session"}</Button>
          <Button variant="bare" onClick={() => navigate("/dashboard/lessons")} className="cr-btn-ghost">Cancel</Button>
        </div>
      </div>

      <LibraryPickerModal open={modal === "theory"} type="theory" initialBlocks={selected.theory} onClose={() => setModal(null)} onConfirm={onConfirm("theory")} />
      <LibraryPickerModal open={modal === "practice"} type="practice" initialBlocks={selected.practice} onClose={() => setModal(null)} onConfirm={onConfirm("practice")} />
    </div>
  );
}
