import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, Clock, Tag, HelpCircle, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { Widget } from "@/components/Widget";
import { ContentBlockCard } from "@/components/ContentBlockCard";

export default function LessonDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [l, setL] = useState(null);
  useEffect(() => { api.get(`/lessons/${id}`).then((r) => setL(r.data)).catch(() => navigate("/dashboard/lessons")); }, [id, navigate]);
  if (!l) return null;

  return (
    <div>
      <button data-testid="lesson-back-btn" onClick={() => navigate("/dashboard/lessons")} className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white"><ArrowLeft className="h-4 w-4" /> Sessions</button>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-sm bg-[#B800FF]/10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-[#B800FF]"><Tag className="h-3 w-3" />{l.category}</span>
          <h1 className="mt-3 font-display text-3xl font-light tracking-tighter sm:text-4xl">{l.title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">{l.description}</p>
          <p className="mt-3 flex items-center gap-2 text-sm text-zinc-500"><Clock className="h-4 w-4 text-zinc-600" /> {l.duration} min</p>
        </div>
        <button data-testid="lesson-edit-btn" onClick={() => navigate(`/dashboard/lessons/${id}/edit`)} className="inline-flex items-center gap-1.5 rounded-md border border-white/15 px-4 py-2 text-sm text-zinc-300 hover:border-[#0066FF]/50 hover:text-white"><Pencil className="h-4 w-4" /> Edit</button>
      </div>

      <div className="space-y-6">
        <Widget testid="lesson-theory" title={`Theory Blocks (${l.theory_blocks?.length || 0})`}>
          <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
            {l.theory_blocks?.map((b) => <ContentBlockCard key={b.id} block={b} testid={`theory-block-${b.id}`} />)}
          </div>
        </Widget>
        <Widget testid="lesson-practice" title={`Practice Blocks (${l.practice_blocks?.length || 0})`}>
          <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
            {l.practice_blocks?.map((b) => <ContentBlockCard key={b.id} block={b} testid={`practice-block-${b.id}`} />)}
          </div>
        </Widget>
        <Widget testid="lesson-quizzes" title={`Quizzes (${l.quizzes?.length || 0})`}>
          <div className="divide-y divide-white/[0.05]">
            {(l.quizzes || []).map((qz, qi) => (
              <div key={qz.id || qi} className="px-6 py-5">
                <div className="flex items-start gap-3">
                  <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#0066FF]" />
                  <div className="flex-1">
                    <p className="text-sm text-white">{qz.question}</p>
                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {qz.options.map((o, oi) => (
                        <div key={oi} className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${oi === qz.correct ? "border-[#00FF66]/40 bg-[#00FF66]/5 text-[#00FF66]" : "border-white/10 text-zinc-400"}`}>
                          {oi === qz.correct && <CheckCircle2 className="h-3.5 w-3.5" />} {o}
                        </div>
                      ))}
                    </div>
                    <p className="mt-2 text-[10px] uppercase tracking-widest text-zinc-600">Shown: {qz.show_after === "end" ? "At the end" : `After ${qz.show_after}`}</p>
                  </div>
                </div>
              </div>
            ))}
            {(!l.quizzes || l.quizzes.length === 0) && <p className="px-6 py-6 text-sm text-zinc-500">No quizzes.</p>}
          </div>
        </Widget>
      </div>
    </div>
  );
}
