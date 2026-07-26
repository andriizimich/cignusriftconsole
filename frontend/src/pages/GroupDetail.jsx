import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Pencil, Trash2, Compass, UserRound, Mail, Phone, Building2 } from "lucide-react";
import { api } from "@/lib/api";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/StatusBadge";
import { fmtDate } from "@/lib/format";
import { Button } from "@/components/base/Button";
import { Heading } from "@/components/base/Heading";

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
      <Button variant="bare" data-testid="group-back-btn" onClick={() => navigate("/dashboard/groups")} className="cr-backlink"><ArrowLeft className="h-4 w-4" /> Groups</Button>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Heading level={1} bare className="cr-detail-h1">{g.name}</Heading>
          <div className="cr-detail-meta">
            <span className="cr-purple-text flex items-center gap-2"><Compass className="h-4 w-4" /> {g.direction}</span>
            <span className="flex items-center gap-2"><UserRound className="cr-muted-icon h-4 w-4" /> {g.teacher}</span>
            <span>{g.students} students</span>
            <span className="cr-tf">Created {fmtDate(g.created_at)}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="bare" data-testid="group-edit-btn" onClick={() => navigate(`/dashboard/groups/${id}/edit`)} className="cr-btn-sm"><Pencil className="h-4 w-4" /> Edit</Button>
          <Button variant="bare" data-testid="group-delete-btn" onClick={remove} className="cr-btn-sm cr-btn-sm-danger"><Trash2 className="h-4 w-4" /> Delete</Button>
        </div>
      </div>

      <Tabs defaultValue="students">
        <TabsList className="cr-tabsl"><TabsTrigger value="students" data-testid="tab-students">Students</TabsTrigger><TabsTrigger value="schedule" data-testid="tab-schedule">Schedule</TabsTrigger></TabsList>
        <TabsContent value="students" className="mt-4">
          <div className="cr-widget overflow-x-auto" data-testid="group-students-list">
            <table className="cr-table">
              <thead><tr className="cr-thead-row">{["Student", "Institution / Division", "Email", "Phone"].map((h) => <th key={h} className="cr-th">{h}</th>)}</tr></thead>
              <tbody>
                {g.student_list?.map((s) => (
                  <tr key={s.id} className="cr-row">
                    <td className="cr-td"><div className="flex items-center gap-3"><div className="cr-avatar-sm">{s.name[0]}</div><span className="cr-td-strong">{s.name}</span></div></td>
                    <td className="cr-td"><span className="flex items-center gap-1.5"><Building2 className="cr-muted-icon h-3.5 w-3.5" />{s.institution} · {s.division}</span></td>
                    <td className="cr-td"><span className="flex items-center gap-1.5"><Mail className="cr-muted-icon h-3.5 w-3.5" />{s.email}</span></td>
                    <td className="cr-td"><span className="flex items-center gap-1.5"><Phone className="cr-muted-icon h-3.5 w-3.5" />{s.phone}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!g.student_list || g.student_list.length === 0) && <p className="cr-empty">No students yet.</p>}
          </div>
        </TabsContent>
        <TabsContent value="schedule" className="mt-4">
          <div className="cr-widget overflow-hidden" data-testid="group-schedule-list">
            {g.bookings?.map((b) => (
              <Button variant="bare" key={b.id} onClick={() => navigate(`/dashboard/bookings/${b.id}`)} className="cr-row flex w-full items-center gap-4 border-b px-6 py-4 text-left last:border-0" style={{ borderColor: "var(--cr-border-hair)" }}>
                <div className="flex-1"><p className="cr-td-strong text-sm">{b.lesson_title}</p><p className="cr-tm text-xs">{fmtDate(b.date)} · {b.time}</p></div>
                <StatusBadge status={b.status} />
              </Button>
            ))}
            {(!g.bookings || g.bookings.length === 0) && <p className="cr-empty">No bookings for this group.</p>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
