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

// Bot Icon - Robot Helmet Style (Premium Tech)
const HelmetIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 100 100" 
    className={cn("drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]", className)}
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Main Outer Shell */}
    <path 
      d="M25 45C25 30 35 20 50 20C65 20 75 30 75 45V75C75 80 70 85 65 85H35C30 85 25 80 25 75V45Z" 
      stroke="currentColor" 
      strokeWidth="3.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
    
    {/* Forehead Section */}
    <path 
      d="M40 20L44 32H56L60 20" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />

    {/* Visor Area */}
    <path 
      d="M30 48C30 42 35 40 50 40C65 40 70 42 70 48V58C70 64 65 66 50 66C35 66 30 64 30 58V48Z" 
      fill="currentColor" 
      fillOpacity="0.1"
      stroke="currentColor" 
      strokeWidth="3.5" 
    />

    {/* Visor Inner Light/Glow */}
    <path 
      d="M34 50C34 46 38 44 50 44C62 44 66 46 66 50V56C66 60 62 62 50 62C38 62 34 60 34 56V50Z" 
      fill="currentColor" 
      fillOpacity="0.8"
    />

    {/* Robot Eyes (Glow) */}
    <ellipse cx="43" cy="53" rx="3.5" ry="5.5" fill="black" />
    <ellipse cx="57" cy="53" rx="3.5" ry="5.5" fill="black" />

    {/* Side Ear Panels */}
    <path 
      d="M25 50H21V70H25" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
    />
    <path 
      d="M75 50H79V70H75" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
    />

    {/* Antennas */}
    <line x1="21" y1="50" x2="21" y2="35" stroke="currentColor" strokeWidth="2.5" />
    <circle cx="21" cy="35" r="2.5" fill="currentColor" />
    
    <line x1="79" y1="50" x2="79" y2="35" stroke="currentColor" strokeWidth="2.5" />
    <circle cx="79" cy="35" r="2.5" fill="currentColor" />

    {/* Chin Detail */}
    <path d="M44 85V75H56V85" stroke="currentColor" strokeWidth="3" />
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
