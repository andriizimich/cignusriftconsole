import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Pencil, Clock, Tag, Users, Calendar, HelpCircle, X, Check } from "lucide-react";
import { api } from "@/lib/api";
import { Widget } from "@/components/Widget";
import { StatusBadge } from "@/components/StatusBadge";
import { ContentBlockCard } from "@/components/ContentBlockCard";
import { fmtDate } from "@/lib/format";

const inp = "w-full rounded-md border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-[#0066FF]/50";
const lbl = "mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-zinc-500";

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
      <button data-testid="booking-back-btn" onClick={() => navigate("/dashboard/bookings")} className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white"><ArrowLeft className="h-4 w-4" /> Bookings</button>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 font-mono-plex text-xs text-zinc-500">{b.id}</p>
          <h1 className="font-display text-3xl font-light tracking-tighter sm:text-4xl">{b.lesson_title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">{l?.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={b.status} />
          {b.status === "scheduled" && <button data-testid="booking-edit-btn" onClick={() => setEdit(true)} className="inline-flex items-center gap-1.5 rounded-md border border-white/15 px-4 py-2 text-sm text-zinc-300 hover:border-[#0066FF]/50 hover:text-white"><Pencil className="h-4 w-4" /> Edit Booking</button>}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-white/[0.07] bg-[#0A0A0B] p-5"><p className={lbl}>Category</p><p className="flex items-center gap-1.5 text-sm text-[#B800FF]"><Tag className="h-3.5 w-3.5" />{b.category}</p></div>
        <div className="rounded-lg border border-white/[0.07] bg-[#0A0A0B] p-5"><p className={lbl}>Duration</p><p className="flex items-center gap-1.5 text-sm text-white"><Clock className="h-3.5 w-3.5 text-zinc-600" />{b.duration} min</p></div>
        <div className="rounded-lg border border-white/[0.07] bg-[#0A0A0B] p-5"><p className={lbl}>Schedule</p><p className="flex items-center gap-1.5 text-sm text-white"><Calendar className="h-3.5 w-3.5 text-zinc-600" />{fmtDate(b.date)} · {b.time}</p></div>
        <div className="rounded-lg border border-white/[0.07] bg-[#0A0A0B] p-5"><p className={lbl}>Group</p><p className="flex items-center gap-1.5 text-sm text-white"><Users className="h-3.5 w-3.5 text-zinc-600" />{b.group_name} ({b.participants})</p></div>
      </div>

      {l && (
        <div className="space-y-6">
          <Widget title="Theory Content"><div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">{l.theory_blocks?.map((x) => <ContentBlockCard key={x.id} block={x} />)}</div></Widget>
          <Widget title="Practice Content"><div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">{l.practice_blocks?.map((x) => <ContentBlockCard key={x.id} block={x} />)}</div></Widget>
          <Widget title={`Quizzes (${l.quizzes?.length || 0})`}>
            <div className="divide-y divide-white/[0.05]">
              {(l.quizzes || []).map((qz, qi) => (
                <div key={qi} className="flex items-start gap-3 px-6 py-4"><HelpCircle className="mt-0.5 h-4 w-4 text-[#0066FF]" /><div><p className="text-sm text-white">{qz.question}</p><p className="mt-1 text-xs text-[#00FF66]">Correct: {qz.options[qz.correct]}</p></div></div>
              ))}
            </div>
          </Widget>
          <Widget title="Participants" testid="booking-group-list">
            <div className="divide-y divide-white/[0.05]">
              {b.group?.student_list?.map((s) => (
                <div key={s.id} className="flex items-center gap-3 px-6 py-3"><div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#0066FF]/15 text-xs text-[#0066FF] ring-1 ring-[#0066FF]/25">{s.name[0]}</div><span className="flex-1 text-sm text-white">{s.name}</span><span className="text-xs text-zinc-500">{s.institution}</span></div>
              ))}
            </div>
          </Widget>
        </div>
      )}

      {edit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6" onClick={() => setEdit(false)}>
          <div className="w-full max-w-md rounded-lg border border-white/10 bg-[#0A0A0B] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between"><h3 className="font-display text-lg tracking-tight">Edit Booking</h3><button onClick={() => setEdit(false)} className="text-zinc-500 hover:text-white"><X className="h-5 w-5" /></button></div>
            <div className="space-y-4">
              <div><label className={lbl}>Group</label><select data-testid="edit-group-select" className={inp} value={form.group_id} onChange={(e) => setForm({ ...form, group_id: e.target.value })}>{groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lbl}>Date</label><input data-testid="edit-date-input" type="date" className={inp} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
                <div><label className={lbl}>Time</label><input data-testid="edit-time-input" type="time" className={inp} value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></div>
              </div>
              <div><label className={lbl}>Duration (min)</label><input data-testid="edit-duration-input" type="number" className={inp} value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} /></div>
              <button data-testid="edit-save-btn" onClick={save} className="flex w-full items-center justify-center gap-2 rounded-md bg-[#0066FF] py-2.5 font-medium text-white active:scale-95"><Check className="h-4 w-4" /> Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
