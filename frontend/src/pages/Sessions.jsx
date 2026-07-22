import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, Users, Layers } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/Widget";
import { StatusBadge } from "@/components/StatusBadge";
import { fmtDate } from "@/components/OrdersTable";

const modeColor = { Hybrid: "#B800FF", Practice: "#0066FF", Theory: "#00FF66" };
const sessionStatus = { confirmed: "paid", pending: "pending" };

export default function Sessions() {
  const [sessions, setSessions] = useState([]);
  useEffect(() => { api.get("/sessions").then((r) => setSessions(r.data)); }, []);

  return (
    <div>
      <PageHeader overline="Schedule" title="Sessions" subtitle="Your upcoming hybrid, practice and theory VR sessions across all cohorts." />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {sessions.map((s, i) => (
          <motion.div
            key={s.id}
            data-testid={`session-card-${s.id}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            whileHover={{ y: -4 }}
            className="group relative overflow-hidden rounded-lg border border-white/[0.07] bg-[#0A0A0B] p-6 transition-colors hover:border-white/[0.14]"
          >
            <span className="absolute left-0 top-0 h-full w-0.5" style={{ backgroundColor: modeColor[s.mode] }} />
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono-plex text-xs text-zinc-500">{s.id}</p>
                <h3 className="mt-1 font-display text-lg font-medium tracking-tight text-white">{s.title}</h3>
              </div>
              <span className="rounded-sm px-2 py-1 text-[10px] font-bold uppercase tracking-widest ring-1" style={{ color: modeColor[s.mode], backgroundColor: `${modeColor[s.mode]}1a`, borderColor: `${modeColor[s.mode]}33` }}>{s.mode}</span>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-zinc-400"><Clock className="h-4 w-4 text-zinc-600" /> {fmtDate(s.date)} · {s.time}</div>
              <div className="flex items-center gap-2 text-zinc-400"><Layers className="h-4 w-4 text-zinc-600" /> {s.duration}</div>
              <div className="flex items-center gap-2 text-zinc-400"><Users className="h-4 w-4 text-zinc-600" /> {s.group}</div>
              <div className="flex justify-start"><StatusBadge status={sessionStatus[s.status]} /></div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
