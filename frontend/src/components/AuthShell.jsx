import { Logo } from "@/components/Logo";

export const AuthShell = ({ children }) => (
  <div className="cr-auth">
    <div className="cr-auth-hero">
      <img src="https://images.unsplash.com/photo-1775887065658-988ef1c262c6?crop=entropy&cs=srgb&fm=jpg&q=85&w=1400" alt="Cygnus Rift immersive environment" className="cr-auth-hero-img" />
      <div className="cr-auth-hero-grad" />
      <div className="cr-auth-hero-tint" />
      <div className="cr-auth-hero-inner">
        <Logo />
        <div className="max-w-md">
          <p className="cr-auth-hero-overline">Interactive Presence, Automated</p>
          <h2 className="cr-auth-hero-title">Enterprise VR sessions that fuse theory with hands-on practice.</h2>
          <p className="cr-auth-hero-sub">Powered by Unreal Engine 5, generative AI and prompt-engineered training scenarios.</p>
        </div>
      </div>
    </div>
    <div className="cr-auth-panel">
      <div className="cr-auth-panel-inner">
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
    <button data-testid="google-login-button" onClick={handle} className="cr-btn-google">
      <svg className="h-5 w-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"/><path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"/></svg>
      {label}
    </button>
  );
};

export const inputCls = "cr-input";
export const labelCls = "cr-label";
