export const PageHeader = ({ overline, title, subtitle, action }) => (
  <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
    <div>
      {overline && <p className="mb-2 text-[10px] uppercase tracking-[0.3em] text-[#0066FF]">{overline}</p>}
      <h1 className="font-display text-3xl font-light tracking-tighter sm:text-4xl">{title}</h1>
      {subtitle && <p className="mt-2 max-w-xl text-sm text-zinc-500">{subtitle}</p>}
    </div>
    {action}
  </div>
);

export const Widget = ({ title, action, children, className = "", testid }) => (
  <section
    data-testid={testid}
    className={`rounded-lg border border-white/[0.07] bg-[#0A0A0B] transition-colors hover:border-white/[0.12] ${className}`}
  >
    {title && (
      <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
        <h2 className="font-display text-lg font-medium tracking-tight">{title}</h2>
        {action}
      </div>
    )}
    {children}
  </section>
);
