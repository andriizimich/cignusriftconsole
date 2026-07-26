import PropTypes from "prop-types";
import clsx from "clsx";
import { Link } from "react-router-dom";
import styles from "./TextLink.module.css";

export const TextLink = ({ to, variant = "accent", className, children, ...rest }) => (
  <Link to={to} className={clsx(styles[variant], className)} {...rest}>
    {children}
  </Link>
);

TextLink.propTypes = {
  to: PropTypes.string.isRequired,
  variant: PropTypes.oneOf(["accent", "muted"]),
  className: PropTypes.string,
  children: PropTypes.node,
};
