import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Clock, Calendar, Users, UserRound, FileText, Presentation, Link2, Rocket, Upload } from "lucide-react";
import { api } from "@/lib/api";
import { Widget } from "@/components/Widget";
import { StatusBadge } from "@/components/StatusBadge";
import { fmtDate } from "@/components/OrdersTable";

const matIcon = { file: FileText, slides: Presentation, link: Link2 };

export default function SessionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [s, setS] = useState(null);

  useEffect(() => { api.get(`/sessions/${id}`).then((r) => setS(r.data)).catch(() => navigate("/dashboard/sessions")); }, [id, navigate]);
  if (!s) return null;

  return (
    <div>
      <button data-testid="session-back-btn" onClick={() => navigate("/dashboard/sessions")} className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-white"><ArrowLeft className="h-4 w-4" /> Sessions</button>

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 font-mono-plex text-xs text-zinc-500">{s.id}</p>
          <h1 className="font-display text-3xl font-light tracking-tighter sm:text-4xl">{s.title}</h1>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-zinc-400">
            <span className="flex items-center gap-2"><Calendar className="h-4 w-4 text-zinc-600" /> {fmtDate(s.date)}</span>
            <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-zinc-600" /> {s.time} · {s.duration}</span>
            <span className="flex items-center gap-2"><Users className="h-4 w-4 text-zinc-600" /> {s.group}</span>
            <span className="flex items-center gap-2"><UserRound className="h-4 w-4 text-zinc-600" /> {s.teacher}</span>
          </div>
        </div>
        <StatusBadge status={s.status} />
      </div>

      {/* Interactive launch zone */}
      <div className="mb-6 flex flex-col items-start justify-between gap-4 overflow-hidden rounded-lg border border-[#0066FF]/25 bg-gradient-to-r from-[#0066FF]/10 to-transparent p-6 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-lg font-medium tracking-tight text-white">Enter the Virtual Classroom</h2>
          <p className="mt-1 text-sm text-zinc-400">Launch the immersive VR session and sync all participant headsets.</p>
        </div>
        <button data-testid="launch-vr-btn" onClick={() => toast.info("VR classroom launch is stubbed", { description: "Headset sync depends on the VR server." })} className="inline-flex shrink-0 items-center gap-2 rounded-md bg-[#0066FF] px-5 py-3 font-medium text-white transition-transform active:scale-95 hover:bg-[#0066FF]/90"><Rocket className="h-4 w-4" /> Launch Session</button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Widget testid="session-description" title="Topic" className="lg:col-span-2">
          <p className="px-6 py-5 text-sm leading-relaxed text-zinc-400">{s.description}</p>
        </Widget>
        <Widget testid="session-materials" title="Lesson Materials">
          <div className="divide-y divide-white/[0.05]">
            {s.materials.map((m, i) => {
              const Icon = matIcon[m.type] || FileText;
              return (
                <button key={i} onClick={() => toast.info(`Downloading ${m.name}`)} className="flex w-full items-center gap-3 px-6 py-3.5 text-left transition-colors hover:bg-white/[0.03]">
                  <Icon className="h-4 w-4 text-[#0066FF]" />
                  <span className="flex-1 text-sm text-zinc-300">{m.name}</span>
                  <span className="text-[10px] uppercase tracking-widest text-zinc-600">{m.type}</span>
                </button>
              );
            })}
          </div>
        </Widget>
      </div>

      <div className="mt-6">
        <Widget testid="session-homework" title="Homework">
          <div className="px-6 py-5">
            <p className="text-sm text-zinc-400">{s.homework.description}</p>
            <div className="mt-5 flex flex-col items-start gap-3 rounded-md border border-dashed border-white/15 bg-black/30 p-6 sm:flex-row sm:items-center">
              <Upload className="h-5 w-5 text-zinc-500" />
              <div className="flex-1"><p className="text-sm text-white">Submit your work</p><p className="text-xs text-zinc-600">Drag & drop files or click to upload (stub).</p></div>
              <button data-testid="hw-submit-btn" onClick={() => toast.info("Submission upload is stubbed")} className="rounded-md border border-white/15 px-4 py-2 text-xs text-zinc-300 hover:border-[#0066FF]/50 hover:text-white">Choose file</button>
            </div>
            {s.homework.submissions.length > 0 && (
              <div className="mt-6">
                <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-zinc-500">Submitted work</p>
                <div className="divide-y divide-white/[0.05] rounded-md border border-white/[0.07]">
                  {s.homework.submissions.map((sub, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm text-zinc-300">{sub.student}</span>
                      <span className="rounded-sm bg-[#00FF66]/10 px-2 py-0.5 text-xs font-bold text-[#00FF66]">{sub.grade}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Widget>
      </div>
    </div>
  );
}
