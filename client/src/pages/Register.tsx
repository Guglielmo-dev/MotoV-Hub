import { useState } from "react";
import { useRegister } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { Bike, ArrowRight } from "lucide-react";
import { playMotorcycleRevSound } from "@/lib/sound";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { GoogleButton } from "@/components/ui/GoogleButton";

export function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { mutate: register, isPending } = useRegister();
  const [, setLocation] = useLocation();
  const { t } = useTranslation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    register({ username, email, password }, {
      onSuccess: () => {
        playMotorcycleRevSound();
        setTimeout(() => setLocation("/"), 200);
      }
    });
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left side image */}
      <div className="hidden lg:block lg:w-1/2 relative border-r border-white/5">
        <div className="absolute inset-0 bg-gradient-to-l from-background to-transparent z-10" />
        <img
          src="https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?q=80&w=2070&auto=format&fit=crop"
          alt={t('common.altMotorcycleGarage')}
          className="absolute inset-0 w-full h-full object-cover grayscale-[0.2]"
        />
      </div>

      {/* Right side form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 xl:px-24 z-10">
        <div className="max-w-md w-full mx-auto">
          <div className="flex items-center gap-3 mb-12 lg:justify-end">
            <h1 className="text-4xl font-bold font-display uppercase tracking-wider">MOTO<span className="text-primary">VAULT</span></h1>
            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
              <Bike className="w-7 h-7 text-primary" />
            </div>
          </div>

          <h2 className="text-3xl font-bold mb-2">{t('auth.joinCommunity')}</h2>
          <p className="text-muted-foreground mb-8">{t('auth.registerSubtitle')}</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium text-foreground">{t('auth.username')}</label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-card border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                placeholder={t('auth.chooseUsername')}
                required
                minLength={3}
              />
            </div>
 
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">{t('auth.email')}</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-card border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                placeholder={t('auth.emailPlaceholder')}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground">{t('auth.password')}</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-card border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                placeholder={t('auth.passwordPlaceholder')}
                required
              />
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 px-1 pt-1">
                {[
                  { key: 'length', met: password.length >= 8 },
                  { key: 'uppercase', met: /[A-Z]/.test(password) },
                  { key: 'number', met: /[0-9]/.test(password) },
                  { key: 'special', met: /[^a-zA-Z0-9]/.test(password) },
                ].map((req) => (
                  <div key={req.key} className="flex items-center gap-1.5 transition-all duration-300">
                    <div className={cn(
                      "w-1 h-1 rounded-full",
                      req.met ? "bg-primary shadow-[0_0_8px_rgba(var(--primary),0.8)]" : "bg-white/20"
                    )} />
                    <span className={cn(
                      "text-[10px] uppercase font-bold tracking-tight transition-colors",
                      req.met ? "text-primary/90" : "text-muted-foreground/50"
                    )}>
                      {t(`auth.passwordRequirements.${req.key}`)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3.5 px-4 bg-primary hover:bg-primary/90 text-black font-semibold rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {isPending ? t('auth.creatingProfile') : t('auth.registerAction')}
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

          <GoogleButton variant="register" />

          <p className="mt-8 text-center text-muted-foreground">
            {t('auth.hasAccount')}{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">{t('auth.signIn')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
