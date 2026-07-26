import PropTypes from "prop-types";
import clsx from "clsx";
import styles from "./Heading.module.css";

export const Heading = ({ level = 1, className, children, ...rest }) => {
  const Tag = `h${level}`;
  return (
    <Tag className={clsx(styles[`h${level}`], className)} {...rest}>
      {children}
    </Tag>
  );
};

Heading.propTypes = {
  level: PropTypes.oneOf([1, 2, 3]),
  className: PropTypes.string,
  children: PropTypes.node,
};
