import { useState } from "react";
import { Link } from "wouter";
import { Bike, ArrowRight, Mail, CheckCircle2, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { t } = useTranslation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    try {
      await apiRequest("POST", "/api/auth/forgot-password", { email });
      setIsSubmitted(true);
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message || "Qualcosa è andato storto",
        variant: "destructive"
      });
    } finally {
      setIsPending(false);
    }
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

          {!isSubmitted ? (
            <>
              <h2 className="text-3xl font-bold mb-2">Password dimenticata?</h2>
              <p className="text-muted-foreground mb-8 text-balance">
                Inserisci la tua email e ti invieremo un link per resettare la tua password.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-card border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                      placeholder="tua@email.com"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-3.5 px-4 bg-primary hover:bg-primary/90 text-black font-semibold rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Invia link di recupero"}
                  {!isPending && <ArrowRight className="w-5 h-5" />}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-8 animate-in zoom-in-95 duration-500">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-3xl font-bold mb-4">Email Inviata</h2>
              <p className="text-muted-foreground mb-8">
                Se l'account esiste con l'email <strong>{email}</strong>, riceverai a breve le istruzioni per reimpostare la password.
              </p>
              <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5 text-sm mb-8">
                <p className="text-primary font-bold mb-1 italic">Ambiente di Sviluppo:</p>
                <p className="text-zinc-400">Controlla il terminale del backend per vedere il link di reset generato.</p>
              </div>
            </div>
          )}

          <p className="mt-8 text-center text-muted-foreground">
            Torna al{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">Login</Link>
          </p>
        </div>
      </div>

      {/* Right side image */}
      <div className="hidden lg:block lg:w-1/2 relative border-l border-white/5">
        <div className="absolute inset-0 bg-gradient-to-r from-background to-transparent z-10" />
        <img
          src="https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?q=80&w=2070&auto=format&fit=crop"
          alt="Motorcycle night rider"
          className="absolute inset-0 w-full h-full object-cover grayscale-[0.3]"
        />
      </div>
    </div>
  );
}
