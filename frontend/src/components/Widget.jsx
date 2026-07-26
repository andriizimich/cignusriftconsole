import PropTypes from "prop-types";
import { Heading } from "@/components/base/Heading";

export const PageHeader = ({ overline, title, subtitle, action }) => (
  <div className="cr-pagehead">
    <div>
      {overline && <p className="cr-overline">{overline}</p>}
      <Heading level={1} bare className="cr-h1">{title}</Heading>
      {subtitle && <p className="cr-subtitle">{subtitle}</p>}
    </div>
    {action}
  </div>
);

export const Widget = ({ title, action, children, className = "", testid }) => (
  <section data-testid={testid} className={`cr-widget ${className}`}>
    {title && (
      <div className="cr-widget-head">
        <Heading level={2} bare className="cr-widget-title">{title}</Heading>
        {action}
      </div>
    )}
    {children}
  </section>
);

PageHeader.propTypes = {
  overline: PropTypes.string,
  title: PropTypes.node.isRequired,
  subtitle: PropTypes.node,
  action: PropTypes.node,
};

Widget.propTypes = {
  title: PropTypes.node,
  action: PropTypes.node,
  children: PropTypes.node,
  className: PropTypes.string,
  testid: PropTypes.string,
};
