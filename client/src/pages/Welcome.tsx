import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Bike, Book, Users, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";

export default function Welcome() {
  const { t } = useTranslation();
  const { data: user } = useAuth();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col relative overflow-hidden">
      {/* Background Hero Image with Overlay */}
      <div 
        className="absolute inset-0 z-0 opacity-40 grayscale-[0.2]"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=2000&auto=format&fit=crop')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-[#0a0a0a]/80 via-transparent to-[#0a0a0a]" />

      {/* Content */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-center px-6 pt-20 pb-10 max-w-lg mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-sm font-medium mb-6">
            <Book className="w-4 h-4" />
            <span>MotoVault Digital Twin</span>
          </div>
          
          <h1 className="text-5xl font-black tracking-tighter mb-4 italic italic">
            BENVENUTO <span className="text-primary">RIDER.</span>
          </h1>
          
          <p className="text-gray-300 text-lg mb-10 leading-relaxed">
            Hai il diario tra le mani, ora accendi il motore digitale. 
            MotoVault è il compagno perfetto per ogni km del tuo viaggio.
          </p>
        </motion.div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 gap-4 w-full mb-10 text-left">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary shrink-0">
              <Bike className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold">Garage Digitale</h3>
              <p className="text-sm text-gray-400">Gestisci manutenzioni e scadenze.</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <Book className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold">Diario di Viaggio</h3>
              <p className="text-sm text-gray-400">Salva foto e percorsi delle tue uscite.</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md"
          >
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center text-green-400 shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold">Community</h3>
              <p className="text-sm text-gray-400">Condividi la passione con altri rider.</p>
            </div>
          </motion.div>
        </div>

        {/* Call to Action */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 }}
          className="w-full space-y-4"
        >
          <Link href={user ? "/" : "/login"}>
            <Button className="w-full h-14 rounded-2xl text-lg font-bold gap-2 group shadow-[0_0_20px_rgba(var(--primary),0.3)]">
              {user ? "VAI AL TUO GARAGE" : "INIZIA ORA"}
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <p className="text-gray-500 text-sm italic italic leading-none">
            La strada è più bella quando la condividi.
          </p>
        </motion.div>
      </div>

      {/* Footer Branding */}
      <div className="relative z-20 pb-10 opacity-30 text-center uppercase tracking-[0.3em] text-xs font-light">
        MotoVault &copy; 2026 — Built for Riders
      </div>
    </div>
  );
}
