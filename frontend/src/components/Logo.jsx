export const Logo = ({ compact = false }) => (
  <div className="cr-logo" data-testid="brand-logo">
    <div className="cr-logo-mark">
      <div className="cr-logo-glow" />
      <div className="cr-logo-box">
        <img
          src="https://customer-assets-eiarnc6j.emergentagent.net/job_luminous-portal/artifacts/kpz0kdbb_Component%201.png"
          alt="Cygnus Rift"
          className="cr-logo-img"
        />
      </div>
    </div>
    {!compact && (
      <div className="cr-logo-text">
        <p className="cr-logo-name">Cygnus Rift</p>
        <p className="cr-logo-sub">VR Ops Console</p>
      </div>
    )}
  </div>
);
