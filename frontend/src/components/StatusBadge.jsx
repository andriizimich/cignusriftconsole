const LABELS = {
  paid: "Paid",
  pending: "Pending",
  failed: "Failed",
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Completed",
  created: "Created",
  active: "Active",
  archived: "Archived",
};

export const StatusBadge = ({ status }) => (
  <span data-testid={`status-badge-${status}`} className={`cr-badge cr-badge--${status}`}>
    <span className="cr-badge-dot" />
    {LABELS[status] || "Pending"}
  </span>
);
