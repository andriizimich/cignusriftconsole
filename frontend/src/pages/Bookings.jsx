import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, LogIn, LogOut, Users, ArrowUp, ArrowDown } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader, Widget } from "@/components/Widget";
import { StatusBadge } from "@/components/StatusBadge";
import { fmtDate } from "@/lib/format";
import { useAuth } from "@/context/AuthContext";

const STATUS_RANK = { scheduled: 0, active: 0, pending: 0, archived: 1 };

export default function Bookings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isStudent = user?.role === "student";
  const [rows, setRows] = useState([]);
  const [sort, setSort] = useState({ field: "date", dir: "asc" });

  const load = () => {
    const url = isStudent ? "/bookings/student" : "/bookings";
    api.get(url).then((r) => setRows(r.data));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [isStudent]);

  const remove = async (id) => { await api.delete(`/bookings/${id}`); toast.success("Booking removed"); load(); };
  const join = async (id) => { await api.post(`/bookings/${id}/join`); toast.success("Joined the session"); load(); };
  const leave = async (id) => { await api.post(`/bookings/${id}/leave`); toast.info("Left the session"); load(); };

  const sorted = useMemo(() => {
    const dir = sort.dir === "asc" ? 1 : -1;
    const val = (b) => {
      switch (sort.field) {
        case "date": return `${b.date} ${b.time}`;
        case "teacher": return (b.teacher || "").toLowerCase();
        case "lesson_title": return (b.lesson_title || "").toLowerCase();
        case "group_name": return (b.group_name || "").toLowerCase();
        case "category": return (b.category || "").toLowerCase();
        case "participants": return b.participants || 0;
        default: return b.date;
      }
    };
    return [...rows].sort((a, b) => {
      const ra = STATUS_RANK[a.status] ?? 0, rb = STATUS_RANK[b.status] ?? 0;
      if (ra !== rb) return ra - rb;
      const va = val(a), vb = val(b);
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });
  }, [rows, sort]);

  const toggleSort = (field) => setSort((s) => (s.field === field ? { field, dir: s.dir === "asc" ? "desc" : "asc" } : { field, dir: "asc" }));

  const SortTh = ({ field, children, right }) => (
    <th className={`cr-th ${right ? "text-right" : ""}`}>
      <button data-testid={`sort-${field}`} onClick={() => toggleSort(field)} className={`cr-th-sort ${sort.field === field ? "is-active" : ""} ${right ? "flex-row-reverse" : ""}`}>
        {children}
        {sort.field === field && (sort.dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
      </button>
    </th>
  );
  const Td = ({ children, right, mono }) => <td className={`cr-td ${right ? "text-right" : ""} ${mono ? "cr-td-mono" : ""}`}>{children}</td>;

  return (
    <div>
      <PageHeader overline={isStudent ? "My Sessions" : "Scheduling"} title="Bookings"
        subtitle={isStudent ? "Sessions you are invited to and lessons you can join." : "Scheduled & active bookings first, archived last. Click a column to sort."}
        action={!isStudent && <button data-testid="new-booking-btn" onClick={() => navigate("/dashboard/bookings/new")} className="cr-btn-primary"><Plus className="h-4 w-4" /> New Booking</button>} />

      <Widget testid="bookings-table-widget">
        <div className="overflow-x-auto" data-testid="bookings-table">
          <table className="cr-table">
            <thead><tr className="cr-thead-row">
              <th className="cr-th">ID</th>
              <SortTh field="date">Date</SortTh>
              <SortTh field="teacher">Teacher</SortTh>
              <SortTh field="lesson_title">Lesson</SortTh>
              <SortTh field="category">Category</SortTh>
              <SortTh field="group_name">Group</SortTh>
              <SortTh field="participants" right>Participants</SortTh>
              <th className="cr-th">Status</th>
              <th className="cr-th text-right">Action</th>
            </tr></thead>
            <tbody>
              {sorted.map((b) => (
                <tr key={b.id} data-testid={`booking-row-${b.id}`} onClick={() => !isStudent && navigate(`/dashboard/bookings/${b.id}`)} className={`cr-row ${!isStudent ? "cursor-pointer" : ""}`}>
                  <Td mono>{b.id}</Td>
                  <Td>{fmtDate(b.date)} · {b.time}</Td>
                  <Td>{b.teacher}</Td>
                  <td className="cr-td cr-td-strong">{b.lesson_title}</td>
                  <Td>{b.category}</Td>
                  <Td>{b.group_name}</Td>
                  <td className="cr-td cr-cell-count"><span className="inline-flex items-center gap-1"><Users className="cr-muted-icon h-3.5 w-3.5" />{b.participants}</span></td>
                  <td className="cr-td"><StatusBadge status={b.status} /></td>
                  <td className="cr-td text-right" onClick={(e) => e.stopPropagation()}>
                    {isStudent ? (
                      b.joined
                        ? <button data-testid={`leave-booking-${b.id}`} onClick={() => leave(b.id)} disabled={b.status === "archived"} className="cr-btn-sm cr-btn-sm-danger disabled:opacity-40"><LogOut className="h-3.5 w-3.5" /> Leave</button>
                        : <button data-testid={`join-booking-${b.id}`} onClick={() => join(b.id)} disabled={!b.can_join} className="cr-btn-sm-primary disabled:opacity-40"><LogIn className="h-3.5 w-3.5" /> Join</button>
                    ) : (
                      <div className="flex justify-end gap-1">
                        <button data-testid={`edit-booking-${b.id}`} onClick={() => navigate(`/dashboard/bookings/${b.id}`)} disabled={b.status !== "scheduled"} className="cr-btn-icon disabled:opacity-30" title={b.status !== "scheduled" ? "Only scheduled bookings can be edited" : "Edit"}><Pencil className="h-4 w-4" /></button>
                        <button data-testid={`delete-booking-${b.id}`} onClick={() => remove(b.id)} disabled={b.status !== "scheduled"} className="cr-btn-icon cr-btn-icon-danger disabled:opacity-30" title="Delete"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {sorted.length === 0 && <p className="cr-empty">No bookings yet.</p>}
        </div>
      </Widget>
    </div>
  );
}
