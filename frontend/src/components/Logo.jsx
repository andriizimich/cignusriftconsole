export const Logo = ({ compact = false }) => (
  <div className="flex items-center gap-3" data-testid="brand-logo">
    <div className="relative h-9 w-9 shrink-0">
      <div className="absolute inset-0 rounded-md bg-[#0066FF] blur-md opacity-40 animate-pulse-glow" />
      <div className="relative h-9 w-9 rounded-md border border-white/15 bg-[#0A0A0B] flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="url(#g)" strokeWidth="1.8">
          <defs>
            <linearGradient id="g" x1="0" y1="0" x2="24" y2="24">
              <stop stopColor="#0066FF" />
              <stop offset="1" stopColor="#B800FF" />
            </linearGradient>
          </defs>
          <path d="M12 2 L20 7 V17 L12 22 L4 17 V7 Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </div>
    </div>
    {!compact && (
      <div className="leading-none">
        <p className="font-display text-base font-medium tracking-tight">Cygnus Rift</p>
        <p className="text-[10px] uppercase tracking-[0.28em] text-zinc-500 mt-1">VR Ops Console</p>
      </div>
    )}
  </div>
);
