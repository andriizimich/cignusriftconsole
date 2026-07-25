import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Check, Clock, Tag, Users } from "lucide-react";
import { api } from "@/lib/api";
import { fmtDate } from "@/lib/format";

const inp = "w-full rounded-md border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-[#0066FF]/50";
const lbl = "mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-zinc-500";

export default function BookingForm() {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState([]);
  const [groups, setGroups] = useState([]);
  const [lessonId, setLessonId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("13:00");

  useEffect(() => {
    api.get("/lessons").then((r) => setLessons(r.data));
    api.get("/groups").then((r) => setGroups(r.data));
  }, []);

  const lesson = lessons.find((l) => l.id === lessonId);
  const group = groups.find((g) => g.id === groupId);

  const submit = async () => {
    if (!lessonId || !groupId || !date) { toast.error("Select a lesson, group and date"); return; }
    const r = await api.post("/bookings", { lesson_id: lessonId, group_id: groupId, date, time });
    toast.success("Booking created");
    navigate(`/dashboard/bookings/${r.data.id}`);
  };

  return (
    <div className="max-w-4xl">
      <button onClick={() => navigate("/dashboard/bookings")} className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white"><ArrowLeft className="h-4 w-4" /> Bookings</button>
      <h1 className="mb-8 font-display text-3xl font-light tracking-tighter sm:text-4xl">New Booking</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="space-y-6 rounded-lg border border-white/[0.07] bg-[#0A0A0B] p-6 lg:col-span-3">
          <div>
            <label className={lbl}>1 · Select Lesson</label>
            <div className="space-y-2" data-testid="booking-lesson-list">
              {lessons.map((l) => (
                <button key={l.id} data-testid={`booking-lesson-${l.id}`} onClick={() => setLessonId(l.id)} className={`flex w-full items-center justify-between rounded-md border px-4 py-3 text-left text-sm transition-colors ${lessonId === l.id ? "border-[#0066FF] bg-[#0066FF]/10 text-white" : "border-white/10 text-zinc-400 hover:text-white"}`}>
                  <span>{l.title}</span>
                  <span className="flex items-center gap-3 text-xs text-zinc-500"><span className="flex items-center gap-1"><Tag className="h-3 w-3" />{l.category}</span><span className="flex items-center gap-1"><Clock className="h-3 w-3" />{l.duration}m</span></span>
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 border-t border-white/[0.06] pt-6">
            <div><label className={lbl}>2 · Date</label><input data-testid="booking-date-input" type="date" className={inp} value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div><label className={lbl}>Time</label><input data-testid="booking-time-input" type="time" className={inp} value={time} onChange={(e) => setTime(e.target.value)} /></div>
          </div>
          <div className="border-t border-white/[0.06] pt-6">
            <label className={lbl}>3 · Select Group</label>
            <select data-testid="booking-group-select" className={inp} value={groupId} onChange={(e) => setGroupId(e.target.value)}>
              <option value="">Choose a group</option>
              {groups.map((g) => <option key={g.id} value={g.id}>{g.name} ({g.students} students)</option>)}
            </select>
            <button onClick={() => navigate("/dashboard/groups/new")} className="mt-2 text-xs text-[#0066FF] hover:underline">+ Create a new group</button>
          </div>
        </div>

        <div className="rounded-lg border border-white/[0.07] bg-[#0A0A0B] p-6 lg:col-span-2">
          <h2 className="font-display text-lg font-medium tracking-tight">Summary</h2>
          <div className="mt-5 space-y-3 text-sm">
            <div><p className={lbl}>Lesson</p><p className="text-white">{lesson?.title || "—"}</p></div>
            <div><p className={lbl}>Schedule</p><p className="text-white">{date ? `${fmtDate(date)} · ${time}` : "—"}</p></div>
            <div><p className={lbl}>Group</p><p className="flex items-center gap-1.5 text-white"><Users className="h-3.5 w-3.5 text-zinc-600" />{group ? `${group.name} (${group.students})` : "—"}</p></div>
          </div>
          <button data-testid="booking-submit-btn" onClick={submit} className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-[#0066FF] py-3 font-medium text-white transition-transform active:scale-95 hover:bg-[#0066FF]/90"><Check className="h-4 w-4" /> Create Booking</button>
        </div>
      </div>
    </div>
  );
}
