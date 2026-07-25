import { Logo } from "@/components/Logo";

export const AuthShell = ({ children }) => (
  <div className="min-h-screen grid lg:grid-cols-2 bg-[#050505] grain">
    <div className="relative hidden lg:block overflow-hidden">
      <img src="https://images.unsplash.com/photo-1775887065658-988ef1c262c6?crop=entropy&cs=srgb&fm=jpg&q=85&w=1400" alt="Cygnus Rift immersive environment" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/40 to-transparent" />
      <div className="absolute inset-0 bg-[#050505]/40" />
      <div className="relative z-10 flex h-full flex-col justify-between p-12">
        <Logo />
        <div className="max-w-md">
          <p className="mb-4 text-xs uppercase tracking-[0.3em] text-[#0066FF]">Interactive Presence, Automated</p>
          <h2 className="font-display text-4xl font-light leading-tight tracking-tighter">Enterprise VR sessions that fuse theory with hands-on practice.</h2>
          <p className="mt-4 max-w-sm text-sm text-zinc-400">Powered by Unreal Engine 5, generative AI and prompt-engineered training scenarios.</p>
        </div>
      </div>
    </div>
    <div className="relative z-10 flex items-center justify-center overflow-y-auto p-8 sm:p-12">
      <div className="w-full max-w-sm py-8">
        <div className="mb-8 lg:hidden"><Logo /></div>
        {children}
      </div>
    </div>
  </div>
);

export const GoogleButton = ({ label = "Continue with Google" }) => {
  const handle = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/dashboard";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };
  return (
    <button data-testid="google-login-button" onClick={handle} className="flex w-full items-center justify-center gap-3 rounded-md bg-white px-4 py-3 font-medium text-black transition-transform active:scale-[0.98] hover:bg-zinc-200">
      <svg className="h-5 w-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"/><path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"/></svg>
      {label}
    </button>
  );
};

export const inputCls = "w-full rounded-md border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-[#0066FF]/50 transition-colors";
export const labelCls = "mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-zinc-500";
