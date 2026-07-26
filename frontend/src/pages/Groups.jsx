import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { UserRound, Plus, Compass } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/Widget";
import { fmtDate } from "@/lib/format";

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const navigate = useNavigate();
  useEffect(() => { api.get("/groups").then((r) => setGroups(r.data)); }, []);

  return (
    <div>
      <PageHeader overline="Cohorts" title="Groups" subtitle="Trainee groups by discipline, with assigned teacher."
        action={<button data-testid="add-group-btn" onClick={() => navigate("/dashboard/groups/new")} className="cr-btn-primary"><Plus className="h-4 w-4" /> New Group</button>} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((g, i) => (
          <motion.div key={g.id} data-testid={`group-card-${g.id}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: i * 0.05 }} whileHover={{ y: -4 }} onClick={() => navigate(`/dashboard/groups/${g.id}`)} className="cr-groupcard">
            <div className="flex items-center justify-between">
              <div className="cr-groupcard-badge">{g.name[0]}</div>
              <div className="text-right"><p className="cr-groupcard-count">{g.students}</p><p className="cr-groupcard-count-label">Students</p></div>
            </div>
            <h3 className="cr-groupcard-title">{g.name}</h3>
            <p className="cr-groupcard-dir"><Compass className="h-3.5 w-3.5" /> {g.direction}</p>
            <p className="cr-groupcard-teacher"><UserRound className="h-3.5 w-3.5" /> {g.teacher}</p>
            <p className="cr-groupcard-created">Created {fmtDate(g.created_at)}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
