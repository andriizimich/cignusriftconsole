export const PageHeader = ({ overline, title, subtitle, action }) => (
  <div className="cr-pagehead">
    <div>
      {overline && <p className="cr-overline">{overline}</p>}
      <h1 className="cr-h1">{title}</h1>
      {subtitle && <p className="cr-subtitle">{subtitle}</p>}
    </div>
    {action}
  </div>
);

export const Widget = ({ title, action, children, className = "", testid }) => (
  <section data-testid={testid} className={`cr-widget ${className}`}>
    {title && (
      <div className="cr-widget-head">
        <h2 className="cr-widget-title">{title}</h2>
        {action}
      </div>
    )}
    {children}
  </section>
);
