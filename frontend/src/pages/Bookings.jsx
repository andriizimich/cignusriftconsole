import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, LogIn, LogOut, Users } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader, Widget } from "@/components/Widget";
import { StatusBadge } from "@/components/StatusBadge";
import { fmtDate } from "@/lib/format";
import { useAuth } from "@/context/AuthContext";

export default function Bookings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isStudent = user?.role === "student";
  const [rows, setRows] = useState([]);

  const load = () => {
    const url = isStudent ? "/bookings/student" : "/bookings";
    api.get(url).then((r) => setRows(r.data));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [isStudent]);

  const remove = async (id) => { await api.delete(`/bookings/${id}`); toast.success("Booking removed"); load(); };
  const join = async (id) => { await api.post(`/bookings/${id}/join`); toast.success("Joined the session"); load(); };
  const leave = async (id) => { await api.post(`/bookings/${id}/leave`); toast.info("Left the session"); load(); };

  const Th = ({ children, right }) => <th className={`border-b border-white/[0.06] px-5 py-3 font-medium ${right ? "text-right" : ""}`}>{children}</th>;
  const Td = ({ children, right, mono }) => <td className={`border-b border-white/[0.05] px-5 py-4 ${right ? "text-right" : ""} ${mono ? "font-mono-plex text-[#0066FF]" : "text-zinc-400"}`}>{children}</td>;

  return (
    <div>
      <PageHeader overline={isStudent ? "My Sessions" : "Scheduling"} title="Bookings"
        subtitle={isStudent ? "Sessions you are invited to and lessons you can join." : "Every booking links a lesson, a group and a time."}
        action={!isStudent && <button data-testid="new-booking-btn" onClick={() => navigate("/dashboard/bookings/new")} className="inline-flex items-center gap-2 rounded-md bg-[#0066FF] px-4 py-2.5 text-sm font-medium text-white transition-transform active:scale-95 hover:bg-[#0066FF]/90"><Plus className="h-4 w-4" /> New Booking</button>} />

      <Widget testid="bookings-table-widget">
        <div className="overflow-x-auto" data-testid="bookings-table">
          <table className="w-full border-collapse text-sm">
            <thead><tr className="text-left text-[10px] uppercase tracking-[0.16em] text-zinc-500">
              <Th>ID</Th><Th>Date</Th><Th>Teacher</Th><Th>Lesson</Th><Th>Category</Th><Th>Group</Th><Th right>Participants</Th><Th>Status</Th><Th right>Action</Th>
            </tr></thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id} data-testid={`booking-row-${b.id}`} onClick={() => !isStudent && navigate(`/dashboard/bookings/${b.id}`)} className={`transition-colors hover:bg-white/[0.03] ${!isStudent ? "cursor-pointer" : ""}`}>
                  <Td mono>{b.id}</Td>
                  <Td>{fmtDate(b.date)} · {b.time}</Td>
                  <Td>{b.teacher}</Td>
                  <td className="border-b border-white/[0.05] px-5 py-4 text-white">{b.lesson_title}</td>
                  <Td>{b.category}</Td>
                  <Td>{b.group_name}</Td>
                  <td className="border-b border-white/[0.05] px-5 py-4 text-right text-white"><span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5 text-zinc-600" />{b.participants}</span></td>
                  <td className="border-b border-white/[0.05] px-5 py-4"><StatusBadge status={b.status} /></td>
                  <td className="border-b border-white/[0.05] px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                    {isStudent ? (
                      b.joined
                        ? <button data-testid={`leave-booking-${b.id}`} onClick={() => leave(b.id)} disabled={b.status === "archived"} className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-3 py-1.5 text-xs text-zinc-400 hover:border-[#FF3366]/50 hover:text-[#FF3366] disabled:opacity-40"><LogOut className="h-3.5 w-3.5" /> Leave</button>
                        : <button data-testid={`join-booking-${b.id}`} onClick={() => join(b.id)} disabled={!b.can_join} className="inline-flex items-center gap-1.5 rounded-md bg-[#0066FF] px-3 py-1.5 text-xs font-medium text-white active:scale-95 disabled:opacity-40"><LogIn className="h-3.5 w-3.5" /> Join</button>
                    ) : (
                      <div className="flex justify-end gap-1">
                        <button data-testid={`edit-booking-${b.id}`} onClick={() => navigate(`/dashboard/bookings/${b.id}`)} disabled={b.status !== "scheduled"} className="rounded-md p-1.5 text-zinc-500 hover:text-white disabled:opacity-30" title={b.status !== "scheduled" ? "Only scheduled bookings can be edited" : "Edit"}><Pencil className="h-4 w-4" /></button>
                        <button data-testid={`delete-booking-${b.id}`} onClick={() => remove(b.id)} disabled={b.status !== "scheduled"} className="rounded-md p-1.5 text-zinc-500 hover:text-[#FF3366] disabled:opacity-30" title="Delete"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <p className="px-6 py-8 text-sm text-zinc-500">No bookings yet.</p>}
        </div>
      </Widget>
    </div>
  );
}
