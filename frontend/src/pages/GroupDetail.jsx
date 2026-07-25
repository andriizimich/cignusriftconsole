import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Pencil, Trash2, Compass, UserRound, Mail, Phone, Building2 } from "lucide-react";
import { api } from "@/lib/api";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/StatusBadge";
import { fmtDate } from "@/lib/format";

export default function GroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [g, setG] = useState(null);
  useEffect(() => { api.get(`/groups/${id}`).then((r) => setG(r.data)).catch(() => navigate("/dashboard/groups")); }, [id, location.key, navigate]);
  if (!g) return null;

  const remove = async () => { await api.delete(`/groups/${id}`); toast.success("Group deleted"); navigate("/dashboard/groups"); };

  return (
    <div>
      <button data-testid="group-back-btn" onClick={() => navigate("/dashboard/groups")} className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white"><ArrowLeft className="h-4 w-4" /> Groups</button>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-light tracking-tighter sm:text-4xl">{g.name}</h1>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-zinc-400">
            <span className="flex items-center gap-2 text-[#B800FF]"><Compass className="h-4 w-4" /> {g.direction}</span>
            <span className="flex items-center gap-2"><UserRound className="h-4 w-4 text-zinc-600" /> {g.teacher}</span>
            <span>{g.students} students</span>
            <span className="text-zinc-600">Created {fmtDate(g.created_at)}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button data-testid="group-edit-btn" onClick={() => navigate(`/dashboard/groups/${id}/edit`)} className="inline-flex items-center gap-1.5 rounded-md border border-white/15 px-4 py-2 text-sm text-zinc-300 hover:border-[#0066FF]/50 hover:text-white"><Pencil className="h-4 w-4" /> Edit</button>
          <button data-testid="group-delete-btn" onClick={remove} className="inline-flex items-center gap-1.5 rounded-md border border-white/15 px-4 py-2 text-sm text-zinc-400 hover:border-[#FF3366]/50 hover:text-[#FF3366]"><Trash2 className="h-4 w-4" /> Delete</button>
        </div>
      </div>

      <Tabs defaultValue="students">
        <TabsList className="border border-white/[0.07] bg-[#0A0A0B]"><TabsTrigger value="students" data-testid="tab-students">Students</TabsTrigger><TabsTrigger value="schedule" data-testid="tab-schedule">Schedule</TabsTrigger></TabsList>
        <TabsContent value="students" className="mt-4">
          <div className="overflow-x-auto rounded-lg border border-white/[0.07] bg-[#0A0A0B]" data-testid="group-students-list">
            <table className="w-full border-collapse text-sm">
              <thead><tr className="text-left text-[10px] uppercase tracking-[0.16em] text-zinc-500">{["Student", "Institution / Division", "Email", "Phone"].map((h) => <th key={h} className="border-b border-white/[0.06] px-6 py-3 font-medium">{h}</th>)}</tr></thead>
              <tbody>
                {g.student_list?.map((s) => (
                  <tr key={s.id} className="transition-colors hover:bg-white/[0.03]">
                    <td className="border-b border-white/[0.05] px-6 py-3"><div className="flex items-center gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#0066FF]/15 text-xs text-[#0066FF] ring-1 ring-[#0066FF]/25">{s.name[0]}</div><span className="text-white">{s.name}</span></div></td>
                    <td className="border-b border-white/[0.05] px-6 py-3 text-zinc-400"><span className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5 text-zinc-600" />{s.institution} · {s.division}</span></td>
                    <td className="border-b border-white/[0.05] px-6 py-3 text-zinc-400"><span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-zinc-600" />{s.email}</span></td>
                    <td className="border-b border-white/[0.05] px-6 py-3 text-zinc-400"><span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-zinc-600" />{s.phone}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!g.student_list || g.student_list.length === 0) && <p className="px-6 py-6 text-sm text-zinc-500">No students yet.</p>}
          </div>
        </TabsContent>
        <TabsContent value="schedule" className="mt-4">
          <div className="overflow-hidden rounded-lg border border-white/[0.07] bg-[#0A0A0B]" data-testid="group-schedule-list">
            {g.bookings?.map((b) => (
              <button key={b.id} onClick={() => navigate(`/dashboard/bookings/${b.id}`)} className="flex w-full items-center gap-4 border-b border-white/[0.05] px-6 py-4 text-left last:border-0 hover:bg-white/[0.03]">
                <div className="flex-1"><p className="text-sm text-white">{b.lesson_title}</p><p className="text-xs text-zinc-500">{fmtDate(b.date)} · {b.time}</p></div>
                <StatusBadge status={b.status} />
              </button>
            ))}
            {(!g.bookings || g.bookings.length === 0) && <p className="px-6 py-6 text-sm text-zinc-500">No bookings for this group.</p>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
