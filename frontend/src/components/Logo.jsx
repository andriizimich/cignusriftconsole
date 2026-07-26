export const Logo = ({ compact = false }) => (
  <div className="flex items-center gap-3" data-testid="brand-logo">
    <div className="relative h-9 w-9 shrink-0">
      <div className="absolute inset-0 rounded-md bg-[#0066FF] blur-md opacity-30 animate-pulse-glow" />
      <div className="relative flex h-9 w-9 items-center justify-center rounded-md border border-white/15" style={{ backgroundColor: "#0A0A0B" }}>
        <img
          src="https://customer-assets-eiarnc6j.emergentagent.net/job_luminous-portal/artifacts/kpz0kdbb_Component%201.png"
          alt="Cygnus Rift"
          className="h-6 w-6 object-contain"
        />
      </div>
    </div>
    {!compact && (
      <div className="leading-none">
        <p className="font-display text-base font-medium tracking-tight">Cygnus Rift</p>
        <p className="mt-1 text-[10px] uppercase tracking-[0.28em] text-zinc-500">VR Ops Console</p>
      </div>
    )}
  </div>
);
