export const statusStyles = {
  paid: { label: "Paid", dot: "#00FF66", text: "text-[#00FF66]", bg: "bg-[#00FF66]/10", ring: "ring-[#00FF66]/20" },
  pending: { label: "Pending", dot: "#FFB800", text: "text-[#FFB800]", bg: "bg-[#FFB800]/10", ring: "ring-[#FFB800]/20" },
  failed: { label: "Failed", dot: "#FF3366", text: "text-[#FF3366]", bg: "bg-[#FF3366]/10", ring: "ring-[#FF3366]/20" },
};

export const StatusBadge = ({ status }) => {
  const s = statusStyles[status] || statusStyles.pending;
  return (
    <span
      data-testid={`status-badge-${status}`}
      className={`inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ring-1 ${s.bg} ${s.text} ${s.ring}`}
    >
      <span className="h-1.5 w-1.5 rounded-full animate-pulse-glow" style={{ backgroundColor: s.dot }} />
      {s.label}
    </span>
  );
};
