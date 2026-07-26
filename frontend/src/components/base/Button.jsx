import PropTypes from "prop-types";
import clsx from "clsx";
import styles from "./Button.module.css";

export const Button = ({ variant = "primary", size = "md", type = "button", className, children, ...rest }) => (
  <button type={type} className={clsx(styles.base, styles[variant], styles[size], className)} {...rest}>
    {children}
  </button>
);

Button.propTypes = {
  variant: PropTypes.oneOf(["primary", "ghost", "outline", "danger"]),
  size: PropTypes.oneOf(["md", "sm"]),
  type: PropTypes.string,
  className: PropTypes.string,
  children: PropTypes.node,
};
