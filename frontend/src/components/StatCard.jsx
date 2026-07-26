import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";

export const StatCard = ({ label, value, delta, icon: Icon, accent = "#0066FF", index = 0, testid, suffix }) => (
  <motion.div
    data-testid={testid}
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: index * 0.06 }}
    whileHover={{ y: -4 }}
    className="cr-statcard group"
  >
    <div className="cr-statcard-glow" style={{ backgroundColor: accent }} />
    <div className="cr-statcard-row">
      <p className="cr-statcard-label">{label}</p>
      <div className="cr-statcard-icon">
        <Icon className="h-4 w-4" style={{ color: accent }} />
      </div>
    </div>
    <div className="cr-statcard-valrow">
      <span className="cr-statcard-value">{value}</span>
      {suffix && <span className="cr-statcard-suffix">{suffix}</span>}
    </div>
    {delta && (
      <div className="cr-statcard-delta">
        <TrendingUp className="h-3 w-3" /> {delta}
        <span className="cr-statcard-delta-note"> vs last month</span>
      </div>
    )}
  </motion.div>
);
