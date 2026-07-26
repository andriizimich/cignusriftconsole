import PropTypes from "prop-types";
import { TrendingUp } from "lucide-react";

export const StatCard = ({ label, value, delta, icon: Icon, accent = "#0066FF", index = 0, testid, suffix }) => (
  <div data-testid={testid} className="cr-statcard cr-rise cr-fade-up group" style={{ animationDelay: `${index * 0.06}s` }}>
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
  </div>
);

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  delta: PropTypes.string,
  icon: PropTypes.elementType.isRequired,
  accent: PropTypes.string,
  index: PropTypes.number,
  testid: PropTypes.string,
  suffix: PropTypes.string,
};
