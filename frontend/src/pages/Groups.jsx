import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Building2 } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/Widget";

export default function Groups() {
  const [groups, setGroups] = useState([]);
  useEffect(() => { api.get("/groups").then((r) => setGroups(r.data)); }, []);

  return (
    <div>
      <PageHeader overline="Cohorts" title="Groups" subtitle="Trainee groups by institution and company division, with live learning progress." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((g, i) => (
          <motion.div
            key={g.id}
            data-testid={`group-card-${g.id}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            whileHover={{ y: -4 }}
            className="group rounded-lg border border-white/[0.07] bg-[#0A0A0B] p-6 transition-colors hover:border-[#B800FF]/30"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-[#B800FF]/10 font-display text-lg text-[#B800FF] ring-1 ring-[#B800FF]/20">{g.name[0]}</div>
              <div className="text-right">
                <p className="font-display text-2xl font-light text-white">{g.students}</p>
                <p className="text-[10px] uppercase tracking-widest text-zinc-600">Students</p>
              </div>
            </div>
            <h3 className="mt-5 font-display text-lg font-medium tracking-tight text-white">{g.name}</h3>
            <p className="mt-1 flex items-center gap-2 text-xs text-zinc-500"><Building2 className="h-3.5 w-3.5" /> {g.institution}</p>
            <p className="mt-0.5 text-xs text-zinc-600">{g.division}</p>
            <div className="mt-5">
              <div className="mb-1.5 flex items-center justify-between text-[11px]">
                <span className="uppercase tracking-widest text-zinc-600">Progress</span>
                <span className="text-white">{g.progress}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                <motion.div initial={{ width: 0 }} animate={{ width: `${g.progress}%` }} transition={{ duration: 0.8, delay: 0.2 }} className="h-full rounded-full bg-gradient-to-r from-[#0066FF] to-[#B800FF]" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
