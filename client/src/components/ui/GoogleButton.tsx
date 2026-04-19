import { FcGoogle } from "react-icons/fc";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface GoogleButtonProps {
  className?: string;
  variant?: 'login' | 'register';
}

export function GoogleButton({ className, variant = 'login' }: GoogleButtonProps) {
  const { t } = useTranslation();

  const handleGoogleLogin = () => {
    // Redirect to the backend Google Auth route
    window.location.href = "/api/auth/google";
  };

  return (
    <button
      onClick={handleGoogleLogin}
      className={cn(
        "w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl transition-all duration-300",
        "bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 active:scale-95 group",
        "relative overflow-hidden",
        className
      )}
    >
      {/* Subtle Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-white/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 -translate-x-full group-hover:translate-x-full pointer-events-none" />
      
      <FcGoogle className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
      
      <span className="text-sm font-black uppercase tracking-widest text-foreground/80 group-hover:text-foreground transition-colors">
        {variant === 'login' ? t('auth.loginWithGoogle') : t('auth.registerWithGoogle')}
      </span>
    </button>
  );
}
