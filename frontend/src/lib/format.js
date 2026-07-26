import { format, isValid, parseISO } from "date-fns";

const toDate = (value) => {
  if (!value) return null;
  const d = typeof value === "string" ? parseISO(value) : new Date(value);
  return isValid(d) ? d : null;
};

const make = (pattern) => (value) => {
  const d = toDate(value);
  return d ? format(d, pattern) : "—";
};

// Centralized date/time formatters (date-fns based)
export const fmtDate = make("dd MMM yyyy");        // 05 Jun 2026
export const fmtDateShort = make("MMM d");         // Jun 5
export const fmtDateTime = make("dd MMM yyyy · HH:mm"); // 05 Jun 2026 · 13:00
export const fmtTime = make("HH:mm");              // 13:00
export const fmtWeekday = make("EEE, MMM d");      // Fri, Jun 5
