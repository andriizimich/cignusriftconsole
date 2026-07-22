import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";

export const StatCard = ({ label, value, delta, icon: Icon, accent = "#0066FF", index = 0, testid, suffix }) => (
  <motion.div
    data-testid={testid}
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: index * 0.06 }}
    whileHover={{ y: -4 }}
    className="group relative overflow-hidden rounded-lg border border-white/[0.07] bg-[#0A0A0B] p-6"
  >
    <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-10 blur-2xl transition-opacity group-hover:opacity-25" style={{ backgroundColor: accent }} />
    <div className="flex items-start justify-between">
      <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">{label}</p>
      <div className="rounded-md border border-white/10 bg-black/40 p-2">
        <Icon className="h-4 w-4" style={{ color: accent }} />
      </div>
    </div>
    <div className="mt-5 flex items-end gap-1">
      <span className="font-display text-4xl font-light tracking-tighter text-white">{value}</span>
      {suffix && <span className="mb-1 text-sm text-zinc-500">{suffix}</span>}
    </div>
    {delta && (
      <div className="mt-3 inline-flex items-center gap-1 text-xs text-[#00FF66]">
        <TrendingUp className="h-3 w-3" /> {delta}
        <span className="text-zinc-600"> vs last month</span>
      </div>
    )}
  </motion.div>
);
