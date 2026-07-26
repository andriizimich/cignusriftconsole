import PropTypes from "prop-types";
import clsx from "clsx";
import styles from "./Img.module.css";

export const Img = ({ src, alt, loading = "lazy", className, ...rest }) => (
  <img src={src} alt={alt} loading={loading} className={clsx(styles.img, className)} {...rest} />
);

Img.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  loading: PropTypes.oneOf(["lazy", "eager"]),
  className: PropTypes.string,
};
