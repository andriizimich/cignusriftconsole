import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, Clock, Tag, HelpCircle, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { Widget } from "@/components/Widget";
import { ContentBlockCard } from "@/components/ContentBlockCard";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/base/Button";
import { Heading } from "@/components/base/Heading";

export default function LessonDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [l, setL] = useState(null);
  useEffect(() => { api.get(`/lessons/${id}`).then((r) => setL(r.data)).catch(() => navigate("/dashboard/lessons")); }, [id, navigate]);
  if (!l) return null;

  const quizFor = (bid) => (l.quizzes || []).find((q) => q.block_id === bid);
  const theoryQuiz = quizFor("theory");
  const practiceQuiz = quizFor("practice");
  const quizCount = (l.quizzes || []).length;

  const QuizCard = ({ qz, accent = "#0066FF" }) => {
    const a = theme === "light" && accent === "#00FF66" ? "#0a8f4f" : accent;
    return (
      <div className="rounded-md border p-4" style={{ borderColor: `${a}40`, background: `${a}0D` }} data-testid={`quiz-for-${qz.block_id}`}>
        <div className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em]" style={{ color: a }}><HelpCircle className="h-3.5 w-3.5" /> {qz.block_id === "theory" ? "Theory" : "Practice"} Quiz</div>
        <p className="cr-t text-sm">{qz.question}</p>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {qz.options.map((o, oi) => (
            <div key={oi} className={`cr-quizopt ${oi === qz.correct ? "is-correct" : ""}`}>{oi === qz.correct && <CheckCircle2 className="h-3.5 w-3.5" />} {o}</div>
          ))}
        </div>
      </div>
    );
  };

  const Blocks = ({ items }) => (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items?.map((b) => <ContentBlockCard key={b.id} block={b} testid={`block-${b.id}`} />)}
    </div>
  );

  return (
    <div>
      <Button variant="bare" data-testid="lesson-back-btn" onClick={() => navigate("/dashboard/lessons")} className="cr-backlink"><ArrowLeft className="h-4 w-4" /> Sessions</Button>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="cr-catbadge"><Tag className="h-3 w-3" />{l.category}</span>
          <Heading level={1} bare className="cr-detail-h1 mt-3">{l.title}</Heading>
          <p className="mt-2 max-w-2xl text-sm cr-t3">{l.description}</p>
          <p className="mt-3 flex items-center gap-2 text-sm cr-tm"><Clock className="cr-muted-icon h-4 w-4" /> {l.duration} min · {l.theory_blocks?.length || 0} theory · {l.practice_blocks?.length || 0} practice · {quizCount} quizzes</p>
        </div>
        <Button variant="bare" data-testid="lesson-edit-btn" onClick={() => navigate(`/dashboard/lessons/${id}/edit`)} className="cr-btn-sm"><Pencil className="h-4 w-4" /> Edit</Button>
      </div>

      <div className="space-y-6">
        <Widget testid="lesson-theory" title="Theory Content">
          <div className="space-y-5 p-6">
            <Blocks items={l.theory_blocks} />
            {theoryQuiz && <QuizCard qz={theoryQuiz} accent="#0066FF" />}
          </div>
        </Widget>
        <Widget testid="lesson-practice" title="Practice Content">
          <div className="space-y-5 p-6">
            <Blocks items={l.practice_blocks} />
            {practiceQuiz && <QuizCard qz={practiceQuiz} accent="#00FF66" />}
          </div>
        </Widget>
      </div>
    </div>
  );
}
