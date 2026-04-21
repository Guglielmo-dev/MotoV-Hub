import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Message {
  role: 'user' | 'model';
  content: string;
}

// Icona Casco Integrale Premium v2 - Profilo Aerodinamico Solido
const HelmetIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 64 64" 
    className={cn("drop-shadow-[0_0_12px_rgba(34,197,94,0.45)]", className)}
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Shell principale - Geometria solida e pulita */}
    <path 
      d="M10 52C9 48 8 40 8 30C8 12 20 4 38 4C54 4 58 14 58 30C58 42 54 52 50 52H14L10 52Z" 
      fill="#0A0A0A" 
      stroke="#333" 
      strokeWidth="1.5"
    />
    
    {/* Visiera Racing - Sottile e slanciata */}
    <defs>
      <linearGradient id="visorProfileGradV2" x1="20" y1="18" x2="56" y2="34" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#1a1a1a" />
        <stop offset="50%" stopColor="#252525" />
        <stop offset="100%" stopColor="#1a1a1a" />
      </linearGradient>
    </defs>
    <path 
      d="M20 18C20 18 45 15 54 19C57 20 57 32 54 34C45 38 25 36 20 34V18Z" 
      fill="url(#visorProfileGradV2)" 
      stroke="#22c55e" 
      strokeOpacity="0.7"
      strokeWidth="1"
    />

    {/* Meccanismo Rotazione Laterale */}
    <circle cx="20" cy="26" r="4" fill="#111" stroke="#333" strokeWidth="0.5" />
    <circle cx="20" cy="26" r="1.5" fill="#22c55e" fillOpacity="0.5" />

    {/* Presa d'aria Mentoniera Style */}
    <path d="M48 44H54L56 48H46L48 44Z" fill="#151515" stroke="#22c55e" strokeOpacity="0.4" strokeWidth="0.5" />
    <rect x="50" y="45" width="2" height="1" rx="0.5" fill="#22c55e" fillOpacity="0.8" />

    {/* Riflesso Curvato Calotta */}
    <path d="M20 8C20 8 30 6 40 6" stroke="white" strokeOpacity="0.08" strokeWidth="2" strokeLinecap="round" />

    {/* Linea di base Neon */}
    <path d="M12 52H50" stroke="#22c55e" strokeWidth="1.5" strokeOpacity="0.4" strokeLinecap="round" />
  </svg>
);

export function ChatBot() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      // Formatta la storia per Gemini
      const history = messages.map(m => ({
        role: m.role === 'user' ? 'user' as const : 'model' as const,
        parts: [{ text: m.content }]
      }));

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, history })
      });

      if (!response.ok) throw new Error("Failed to get response");
      
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'model', content: data.response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', content: t('notifications.chat.error') }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-32 right-6 z-[100] flex flex-col items-end pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="w-[350px] sm:w-[400px] h-[500px] bg-card/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden mb-4 pointer-events-auto"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/5 bg-primary/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                  <HelmetIcon className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm uppercase tracking-wider text-primary">VaultBot</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-muted-foreground uppercase font-mono">Expert System Active</span>
                  </div>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/5 rounded-full"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {/* Welcome Message */}
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                    <HelmetIcon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="bg-secondary/50 rounded-2xl rounded-tl-none p-3 text-sm text-foreground/90 max-w-[85%] border border-white/5">
                    {t('notifications.chat.welcome')}
                  </div>
                </div>

                {/* History */}
                {messages.map((msg, i) => (
                  <div key={i} className={cn("flex gap-3", msg.role === 'user' ? "flex-row-reverse" : "")}>
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      msg.role === 'user' ? "bg-zinc-800 border border-white/10" : "bg-primary/20 border border-primary/30"
                    )}>
                      {msg.role === 'user' ? <User className="w-4 h-4 text-zinc-400" /> : <HelmetIcon className="w-4 h-4 text-primary" />}
                    </div>
                    <div className={cn(
                      "rounded-2xl p-3 text-sm max-w-[85%] border border-white/5",
                      msg.role === 'user' 
                        ? "bg-primary text-black font-medium rounded-tr-none" 
                        : "bg-secondary/50 text-foreground/90 rounded-tl-none"
                    )}>
                      {msg.content}
                    </div>
                  </div>
                ))}

                {/* Typing Indicator */}
                {isLoading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                      <HelmetIcon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="bg-secondary/50 rounded-2xl rounded-tl-none p-3 flex items-center gap-1 border border-white/5">
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} className="w-1.5 h-1.5 bg-primary rounded-full" />
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-primary rounded-full" />
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-primary rounded-full" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t border-white/5 bg-background/50">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="flex gap-2"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t('notifications.chat.placeholder')}
                  className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors text-foreground"
                />
                <Button 
                  type="submit" 
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className="bg-primary text-black hover:bg-primary/90 shrink-0 shadow-lg shadow-primary/20"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.05, y: -5 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 pointer-events-auto group relative",
          isOpen 
            ? "bg-zinc-900 text-white border border-white/20 glow-green" 
            : "bg-surface-premium text-black border border-primary/30 glow-green"
        )}
      >
        <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse group-hover:bg-primary/20 transition-colors" />
        
        {isOpen ? (
          <X className="w-7 h-7 relative z-10" />
        ) : (
          <HelmetIcon className="w-10 h-10 relative z-10 group-hover:scale-110 transition-transform duration-500" />
        )}
        
        {/* Badge "IA ACTIVE" - Premium Tech Style */}
        {!isOpen && (
           <div className="absolute -top-2 -left-2 px-2.5 py-1 bg-black/80 backdrop-blur-md border border-primary/50 text-primary text-[9px] font-black uppercase tracking-tighter rounded-lg shadow-[0_0_15px_rgba(34,197,94,0.3)] animate-bounce">
             IA ACTIVE
           </div>
        )}

        {/* Ring Glow Effect */}
        <div className="absolute inset-0 rounded-full border border-primary/20 scale-110 opacity-0 group-hover:opacity-100 group-hover:scale-125 transition-all duration-500" />
      </motion.button>
    </div>
  );
}
