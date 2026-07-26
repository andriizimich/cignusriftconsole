import { Logo } from "@/components/Logo";
import { FcGoogle } from "react-icons/fc";
import { Img } from "@/components/base/Img";
import { Button } from "@/components/base/Button";
import { Heading } from "@/components/base/Heading";

export const AuthShell = ({ children }) => (
  <div className="cr-auth">
    <div className="cr-auth-hero">
      <Img src="https://images.unsplash.com/photo-1775887065658-988ef1c262c6?crop=entropy&cs=srgb&fm=jpg&q=85&w=1400" alt="Cygnus Rift immersive environment" className="cr-auth-hero-img" />
      <div className="cr-auth-hero-grad" />
      <div className="cr-auth-hero-tint" />
      <div className="cr-auth-hero-inner">
        <Logo />
        <div className="max-w-md">
          <p className="cr-auth-hero-overline">Interactive Presence, Automated</p>
          <Heading level={2} bare className="cr-auth-hero-title">Enterprise VR sessions that fuse theory with hands-on practice.</Heading>
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
    <Button variant="bare" data-testid="google-login-button" onClick={handle} className="cr-btn-google">
      <FcGoogle className="h-5 w-5" />
      {label}
    </Button>
  );
};

export const inputCls = "cr-input";
export const labelCls = "cr-label";
