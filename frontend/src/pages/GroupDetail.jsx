import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Pencil, Trash2, Building2, UserRound, FileText } from "lucide-react";
import { api } from "@/lib/api";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/StatusBadge";
import { fmtDate } from "@/components/OrdersTable";

export default function GroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [g, setG] = useState(null);

  useEffect(() => { api.get(`/groups/${id}`).then((r) => setG(r.data)).catch(() => navigate("/dashboard/groups")); }, [id, location.key, navigate]);
  if (!g) return null;

  const remove = async () => {
    await api.delete(`/groups/${id}`);
    toast.success("Group deleted");
    navigate("/dashboard/groups");
  };

  return (
    <div>
      <button data-testid="group-back-btn" onClick={() => navigate("/dashboard/groups")} className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white"><ArrowLeft className="h-4 w-4" /> Groups</button>

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-light tracking-tighter sm:text-4xl">{g.name}</h1>
          <p className="mt-2 text-sm text-[#B800FF]">{g.course}</p>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-zinc-400">
            <span className="flex items-center gap-2"><UserRound className="h-4 w-4 text-zinc-600" /> {g.teacher}</span>
            <span className="flex items-center gap-2"><Building2 className="h-4 w-4 text-zinc-600" /> {g.institution} · {g.division}</span>
            <span>{g.students}/{g.limit} students</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button data-testid="group-edit-btn" onClick={() => navigate(`/dashboard/groups/${id}/edit`)} className="inline-flex items-center gap-1.5 rounded-md border border-white/15 px-4 py-2 text-sm text-zinc-300 hover:border-[#0066FF]/50 hover:text-white"><Pencil className="h-4 w-4" /> Edit</button>
          <button data-testid="group-delete-btn" onClick={remove} className="inline-flex items-center gap-1.5 rounded-md border border-white/15 px-4 py-2 text-sm text-zinc-400 hover:border-[#FF3366]/50 hover:text-[#FF3366]"><Trash2 className="h-4 w-4" /> Delete</button>
        </div>
      </div>

      <Tabs defaultValue="students">
        <TabsList className="bg-[#0A0A0B] border border-white/[0.07]">
          <TabsTrigger value="students" data-testid="tab-students">Students</TabsTrigger>
          <TabsTrigger value="schedule" data-testid="tab-schedule">Schedule</TabsTrigger>
          <TabsTrigger value="materials" data-testid="tab-materials">Materials</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="mt-4">
          <div className="overflow-hidden rounded-lg border border-white/[0.07] bg-[#0A0A0B]" data-testid="group-students-list">
            {g.student_list.length === 0 && <p className="px-6 py-6 text-sm text-zinc-500">No students assigned yet.</p>}
            {g.student_list.map((s) => (
              <div key={s.id} className="flex items-center gap-4 border-b border-white/[0.05] px-6 py-4 last:border-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#0066FF]/15 text-sm font-medium text-[#0066FF] ring-1 ring-[#0066FF]/25">{s.name[0]}</div>
                <span className="flex-1 text-sm text-white">{s.name}</span>
                <div className="w-32">
                  <p className="mb-1 text-[10px] uppercase tracking-widest text-zinc-600">Attendance {s.attendance}%</p>
                  <div className="h-1 rounded-full bg-white/5"><div className="h-full rounded-full bg-[#0066FF]" style={{ width: `${s.attendance}%` }} /></div>
                </div>
                <span className="w-14 text-right text-sm text-[#00FF66]">{s.grade}%</span>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="mt-4">
          <div className="overflow-hidden rounded-lg border border-white/[0.07] bg-[#0A0A0B]" data-testid="group-schedule-list">
            {g.sessions.length === 0 && <p className="px-6 py-6 text-sm text-zinc-500">No sessions for this group.</p>}
            {g.sessions.map((s) => (
              <button key={s.id} onClick={() => navigate(`/dashboard/sessions/${s.id}`)} className="flex w-full items-center gap-4 border-b border-white/[0.05] px-6 py-4 text-left last:border-0 hover:bg-white/[0.03]">
                <div className="flex-1"><p className="text-sm text-white">{s.title}</p><p className="text-xs text-zinc-500">{fmtDate(s.date)} · {s.time}</p></div>
                <StatusBadge status={s.status} />
              </button>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="materials" className="mt-4">
          <div className="overflow-hidden rounded-lg border border-white/[0.07] bg-[#0A0A0B]" data-testid="group-materials-list">
            {["Course Syllabus.pdf", "Onboarding Deck.pptx", "Shared Asset Library"].map((m, i) => (
              <button key={i} onClick={() => toast.info(`Downloading ${m}`)} className="flex w-full items-center gap-3 border-b border-white/[0.05] px-6 py-4 text-left last:border-0 hover:bg-white/[0.03]">
                <FileText className="h-4 w-4 text-[#0066FF]" />
                <span className="text-sm text-zinc-300">{m}</span>
              </button>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
