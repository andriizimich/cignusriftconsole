import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Pencil, Clock, Tag, Users, Calendar, HelpCircle, X, Check } from "lucide-react";
import { api } from "@/lib/api";
import { Widget } from "@/components/Widget";
import { StatusBadge } from "@/components/StatusBadge";
import { ContentBlockCard } from "@/components/ContentBlockCard";
import { fmtDate } from "@/lib/format";
import { Button } from "@/components/base/Button";
import { Heading } from "@/components/base/Heading";

export default function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [b, setB] = useState(null);
  const [groups, setGroups] = useState([]);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({ group_id: "", date: "", time: "", duration: 60 });

  const load = () => api.get(`/bookings/${id}`).then((r) => { setB(r.data); setForm({ group_id: r.data.group_id, date: r.data.date, time: r.data.time, duration: r.data.duration }); }).catch(() => navigate("/dashboard/bookings"));
  useEffect(() => { load(); api.get("/groups").then((r) => setGroups(r.data)); /* eslint-disable-next-line */ }, [id]);
  if (!b) return null;
  const l = b.lesson;

  const save = async () => { await api.put(`/bookings/${id}`, form); toast.success("Booking updated"); setEdit(false); load(); };

  return (
    <div>
      <Button variant="bare" data-testid="booking-back-btn" onClick={() => navigate("/dashboard/bookings")} className="cr-backlink"><ArrowLeft className="h-4 w-4" /> Bookings</Button>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 font-mono-plex text-xs cr-tm">{b.id}</p>
          <Heading level={1} bare className="cr-detail-h1">{b.lesson_title}</Heading>
          <p className="mt-2 max-w-2xl text-sm cr-t3">{l?.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={b.status} />
          {b.status === "scheduled" && <Button variant="bare" data-testid="booking-edit-btn" onClick={() => setEdit(true)} className="cr-btn-sm"><Pencil className="h-4 w-4" /> Edit Booking</Button>}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="cr-statbox"><p className="cr-label">Category</p><p className="cr-purple-text flex items-center gap-1.5 text-sm"><Tag className="h-3.5 w-3.5" />{b.category}</p></div>
        <div className="cr-statbox"><p className="cr-label">Duration</p><p className="cr-t flex items-center gap-1.5 text-sm"><Clock className="cr-muted-icon h-3.5 w-3.5" />{b.duration} min</p></div>
        <div className="cr-statbox"><p className="cr-label">Schedule</p><p className="cr-t flex items-center gap-1.5 text-sm"><Calendar className="cr-muted-icon h-3.5 w-3.5" />{fmtDate(b.date)} · {b.time}</p></div>
        <div className="cr-statbox"><p className="cr-label">Group</p><p className="cr-t flex items-center gap-1.5 text-sm"><Users className="cr-muted-icon h-3.5 w-3.5" />{b.group_name} ({b.participants})</p></div>
      </div>

      {l && (
        <div className="space-y-6">
          <Widget title="Theory Content"><div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">{l.theory_blocks?.map((x) => <ContentBlockCard key={x.id} block={x} />)}</div></Widget>
          <Widget title="Practice Content"><div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">{l.practice_blocks?.map((x) => <ContentBlockCard key={x.id} block={x} />)}</div></Widget>
          <Widget title={`Quizzes (${l.quizzes?.length || 0})`}>
            <div className="cr-divide">
              {(l.quizzes || []).map((qz, qi) => (
                <div key={qi} className="cr-quiz-row"><HelpCircle className="mt-0.5 h-4 w-4 text-[#0066FF]" /><div><p className="cr-td-strong text-sm">{qz.question}</p><p className="cr-quiz-correct">Correct: {qz.options[qz.correct]}</p></div></div>
              ))}
            </div>
          </Widget>
          <Widget title="Participants" testid="booking-group-list">
            <div className="cr-divide">
              {b.group?.student_list?.map((s) => (
                <div key={s.id} className="cr-row-item"><div className="cr-avatar-sm">{s.name[0]}</div><span className="cr-td-strong flex-1 text-sm">{s.name}</span><span className="cr-tm text-xs">{s.institution}</span></div>
              ))}
            </div>
          </Widget>
        </div>
      )}

      {edit && (
        <div className="cr-modal-overlay" onClick={() => setEdit(false)}>
          <div className="cr-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between"><h3 className="cr-modal-title">Edit Booking</h3><Button variant="bare" onClick={() => setEdit(false)} className="cr-modal-x"><X className="h-5 w-5" /></Button></div>
            <div className="space-y-4">
              <div><label className="cr-label">Group</label><select data-testid="edit-group-select" className="cr-input" value={form.group_id} onChange={(e) => setForm({ ...form, group_id: e.target.value })}>{groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="cr-label">Date</label><input data-testid="edit-date-input" type="date" className="cr-input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
                <div><label className="cr-label">Time</label><input data-testid="edit-time-input" type="time" className="cr-input" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></div>
              </div>
              <div><label className="cr-label">Duration (min)</label><input data-testid="edit-duration-input" type="number" className="cr-input" value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} /></div>
              <Button variant="bare" data-testid="edit-save-btn" onClick={save} className="cr-btn-block"><Check className="h-4 w-4" /> Save Changes</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
