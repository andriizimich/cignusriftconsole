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
        action={<button data-testid="add-group-btn" onClick={() => navigate("/dashboard/groups/new")} className="inline-flex items-center gap-2 rounded-md bg-[#0066FF] px-4 py-2.5 text-sm font-medium text-white transition-transform active:scale-95 hover:bg-[#0066FF]/90"><Plus className="h-4 w-4" /> New Group</button>} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((g, i) => (
          <motion.div key={g.id} data-testid={`group-card-${g.id}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: i * 0.05 }} whileHover={{ y: -4 }} onClick={() => navigate(`/dashboard/groups/${g.id}`)} className="group cursor-pointer rounded-lg border border-white/[0.07] bg-[#0A0A0B] p-6 transition-colors hover:border-[#B800FF]/30">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-[#B800FF]/10 font-display text-lg text-[#B800FF] ring-1 ring-[#B800FF]/20">{g.name[0]}</div>
              <div className="text-right"><p className="font-display text-2xl font-light text-white">{g.students}</p><p className="text-[10px] uppercase tracking-widest text-zinc-600">Students</p></div>
            </div>
            <h3 className="mt-5 font-display text-lg font-medium tracking-tight text-white">{g.name}</h3>
            <p className="mt-1 flex items-center gap-2 text-xs text-[#B800FF]"><Compass className="h-3.5 w-3.5" /> {g.direction}</p>
            <p className="mt-2 flex items-center gap-2 text-xs text-zinc-500"><UserRound className="h-3.5 w-3.5" /> {g.teacher}</p>
            <p className="mt-3 text-[11px] text-zinc-600">Created {fmtDate(g.created_at)}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
