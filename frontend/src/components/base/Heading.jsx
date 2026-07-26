import PropTypes from "prop-types";
import clsx from "clsx";
import styles from "./Heading.module.css";

export const Heading = ({ level = 1, bare = false, className, children, ...rest }) => {
  const Tag = `h${level}`;
  return (
    <Tag className={bare ? clsx(className) : clsx(styles[`h${level}`], className)} {...rest}>
      {children}
    </Tag>
  );
};

Heading.propTypes = {
  level: PropTypes.oneOf([1, 2, 3]),
  bare: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node,
};
