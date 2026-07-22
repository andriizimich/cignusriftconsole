import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { loginAsGuest } = useAuth();

  const handleGoogle = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/dashboard";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const handleGuest = () => {
    loginAsGuest();
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#050505] grain">
      {/* Left cinematic panel */}
      <div className="relative hidden lg:block overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1775887065658-988ef1c262c6?crop=entropy&cs=srgb&fm=jpg&q=85&w=1400"
          alt="Cygnus Rift immersive environment"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/40 to-transparent" />
        <div className="absolute inset-0 bg-[#050505]/40" />
        <div className="relative z-10 h-full flex flex-col justify-between p-12">
          <Logo />
          <div className="max-w-md">
            <p className="text-xs uppercase tracking-[0.3em] text-[#0066FF] mb-4">Interactive Presence, Automated</p>
            <h2 className="font-display text-4xl font-light tracking-tighter leading-tight">
              Enterprise VR sessions that fuse theory with hands-on practice.
            </h2>
            <p className="mt-4 text-zinc-400 text-sm max-w-sm">
              Powered by Unreal Engine 5, generative AI and prompt-engineered training scenarios.
            </p>
          </div>
        </div>
      </div>

      {/* Right login panel */}
      <div className="relative z-10 flex items-center justify-center p-8 sm:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <div className="lg:hidden mb-10"><Logo /></div>
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500 mb-3">Control Deck</p>
          <h1 className="font-display text-3xl font-light tracking-tighter mb-2">Access your console</h1>
          <p className="text-zinc-500 text-sm mb-10">
            Sign in to manage sessions, cohorts and analytics.
          </p>

          <button
            data-testid="google-login-button"
            onClick={handleGoogle}
            className="group w-full flex items-center justify-center gap-3 rounded-md bg-white text-black font-medium py-3.5 px-4 transition-transform active:scale-[0.98] hover:bg-zinc-200"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"/><path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"/></svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-4 my-6">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-600">or</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <button
            data-testid="guest-login-button"
            onClick={handleGuest}
            className="group w-full flex items-center justify-between rounded-md border border-white/15 bg-white/[0.02] py-3.5 px-4 transition-colors hover:border-[#0066FF]/60 hover:bg-[#0066FF]/5"
          >
            <span className="text-sm text-zinc-200">Explore as guest</span>
            <ArrowRight className="h-4 w-4 text-zinc-500 transition-transform group-hover:translate-x-1 group-hover:text-[#0066FF]" />
          </button>

          <div className="mt-10 flex items-center gap-2 text-zinc-600 text-xs">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Sessions secured for 7 days. No passwords stored.</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
