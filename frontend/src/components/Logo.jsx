import PropTypes from "prop-types";
import { Img } from "@/components/base/Img";
import styles from "./Logo.module.css";

const LOGO_SRC = "https://customer-assets-eiarnc6j.emergentagent.net/job_luminous-portal/artifacts/kpz0kdbb_Component%201.png";

export const Logo = ({ compact = false }) => (
  <div className={styles.logo} data-testid="brand-logo">
    <div className={styles.mark}>
      <div className={styles.glow} />
      <div className={styles.box}>
        <Img src={LOGO_SRC} alt="Cygnus Rift" className={styles.img} />
      </div>
    </div>
    {!compact && (
      <div className={styles.text}>
        <p className={styles.name}>Cygnus Rift</p>
        <p className={styles.sub}>VR Ops Console</p>
      </div>
    )}
  </div>
);

Logo.propTypes = {
  compact: PropTypes.bool,
};
