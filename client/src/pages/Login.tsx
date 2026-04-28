import { useState } from "react";
import { useLogin } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { Bike, ArrowRight } from "lucide-react";
import { playMotorcycleRevSound } from "@/lib/sound";
import { useTranslation } from "react-i18next";
import { GoogleButton } from "@/components/ui/GoogleButton";

export function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { mutate: login, isPending } = useLogin();
  const [, setLocation] = useLocation();
  const { t } = useTranslation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ username, password }, {
      onSuccess: async (user) => {
        // Play sound and wait a bit for it to actually start before redirecting
        // This prevents the browser from cancelling the audio fetch during navigation
        await playMotorcycleRevSound(user.customAudioData);
        setTimeout(() => setLocation("/"), 400);
      }
    });
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left side form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 xl:px-24 z-10">
        <div className="max-w-md w-full mx-auto">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
              <Bike className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-4xl font-bold font-display uppercase tracking-wider">MOTO<span className="text-primary">VAULT</span></h1>
          </div>

          <h2 className="text-3xl font-bold mb-2">{t('auth.welcomeBack')}</h2>
          <p className="text-muted-foreground mb-8">{t('auth.loginSubtitle')}</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t('auth.username')}</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-card border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                placeholder={t('auth.usernamePlaceholder')}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t('auth.password')}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-card border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                placeholder={t('auth.passwordPlaceholder')}
                required
              />
            </div>

            <div className="flex justify-end">
              <Link href="/forgot-password">
                <span className="text-sm text-primary hover:underline cursor-pointer font-medium">Password dimenticata?</span>
              </Link>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3.5 px-4 bg-primary hover:bg-primary/90 text-black font-semibold rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {isPending ? t('auth.startingEngine') : t('auth.signIn')}
              {!isPending && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-4 text-muted-foreground font-mono">Oppure</span>
            </div>
          </div>

          <GoogleButton variant="login" />

          <p className="mt-8 text-center text-muted-foreground">
            {t('auth.noAccount')}{' '}
            <Link href="/register" className="text-primary hover:underline font-medium">{t('auth.createOne')}</Link>
          </p>
        </div>
      </div>

      {/* Right side image */}
      <div className="hidden lg:block lg:w-1/2 relative border-l border-white/5">
        <div className="absolute inset-0 bg-gradient-to-r from-background to-transparent z-10" />
        <img
          src="https://images.unsplash.com/photo-1558981806-ec527fa84c39?q=80&w=2070&auto=format&fit=crop"
          alt={t('common.altMotorcycleNight')}
          className="absolute inset-0 w-full h-full object-cover grayscale-[0.3]"
        />
      </div>
    </div>
  );
}
