export const fmtDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
};

export const fmtDateShort = (iso) => {
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};
