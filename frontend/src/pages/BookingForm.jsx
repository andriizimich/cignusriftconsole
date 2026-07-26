import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Check, Clock, Tag, Users } from "lucide-react";
import { api } from "@/lib/api";
import { fmtDate } from "@/lib/format";
import { Button } from "@/components/base/Button";
import { Heading } from "@/components/base/Heading";

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
      <Button variant="bare" onClick={() => navigate("/dashboard/bookings")} className="cr-backlink"><ArrowLeft className="h-4 w-4" /> Bookings</Button>
      <Heading level={1} bare className="cr-form-h1">New Booking</Heading>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="cr-panel space-y-6 lg:col-span-3">
          <div>
            <label className="cr-label">1 · Select Lesson</label>
            <div className="space-y-2" data-testid="booking-lesson-list">
              {lessons.map((l) => (
                <Button variant="bare" key={l.id} data-testid={`booking-lesson-${l.id}`} onClick={() => setLessonId(l.id)} className={`cr-optbtn ${lessonId === l.id ? "is-sel" : ""}`}>
                  <span>{l.title}</span>
                  <span className="cr-opt-meta"><span className="flex items-center gap-1"><Tag className="h-3 w-3" />{l.category}</span><span className="flex items-center gap-1"><Clock className="h-3 w-3" />{l.duration}m</span></span>
                </Button>
              ))}
            </div>
          </div>
          <div className="cr-divider-top-6 grid grid-cols-2 gap-4">
            <div><label className="cr-label">2 · Date</label><input data-testid="booking-date-input" type="date" className="cr-input" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div><label className="cr-label">Time</label><input data-testid="booking-time-input" type="time" className="cr-input" value={time} onChange={(e) => setTime(e.target.value)} /></div>
          </div>
          <div className="cr-divider-top-6">
            <label className="cr-label">3 · Select Group</label>
            <select data-testid="booking-group-select" className="cr-input" value={groupId} onChange={(e) => setGroupId(e.target.value)}>
              <option value="">Choose a group</option>
              {groups.map((g) => <option key={g.id} value={g.id}>{g.name} ({g.students} students)</option>)}
            </select>
            <Button variant="bare" onClick={() => navigate("/dashboard/groups/new")} className="cr-mini-link mt-2 block">+ Create a new group</Button>
          </div>
        </div>

        <div className="cr-panel lg:col-span-2">
          <Heading level={2} bare className="cr-widget-title">Summary</Heading>
          <div className="mt-5 space-y-3 text-sm">
            <div><p className="cr-label">Lesson</p><p className="cr-t">{lesson?.title || "—"}</p></div>
            <div><p className="cr-label">Schedule</p><p className="cr-t">{date ? `${fmtDate(date)} · ${time}` : "—"}</p></div>
            <div><p className="cr-label">Group</p><p className="cr-t flex items-center gap-1.5"><Users className="cr-muted-icon h-3.5 w-3.5" />{group ? `${group.name} (${group.students})` : "—"}</p></div>
          </div>
          <Button variant="bare" data-testid="booking-submit-btn" onClick={submit} className="cr-btn-block mt-6"><Check className="h-4 w-4" /> Create Booking</Button>
        </div>
      </div>
    </div>
  );
}
