import PropTypes from "prop-types";
import clsx from "clsx";
import styles from "./StatusBadge.module.css";

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
  <span data-testid={`status-badge-${status}`} className={clsx(styles.badge, styles[status])}>
    <span className={styles.dot} />
    {LABELS[status] || "Pending"}
  </span>
);

StatusBadge.propTypes = {
  status: PropTypes.string.isRequired,
};
