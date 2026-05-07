import { motion } from "framer-motion";
import { ShoppingBag, ExternalLink, Star, BookOpen, Tag, ChevronLeft, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";

const products = [
  {
    id: 1,
    name: "The MotoVault Rider's Journal",
    category: "Books & Gear",
    price: "19.90€",
    image: "/motovault_rider_journal_premium_1778145941679.png",
    description: "Il compagno fisico perfetto per il tuo garage digitale. Diario di manutenzione, log di viaggio e guide tecniche rilegate in pelle premium.",
    link: "https://www.amazon.it",
    isBook: true,
    isFeatured: true,
    tag: "Best Seller"
  },
  {
    id: 2,
    name: "Carbon Fiber Series Hoodie",
    category: "Apparel",
    price: "45.00€",
    image: "/motovault_hoodie_premium_1778145959413.png",
    description: "Felpa premium in cotone biologico con dettagli ispirati alla fibra di carbonio. Progettata per il massimo comfort sotto la giacca tecnica.",
    comingSoon: true,
  },
  {
    id: 3,
    name: "VaultBot Performance Cap",
    category: "Accessories",
    price: "25.00€",
    image: "/motovault_cap_premium_1778145978513.png",
    description: "Cappellino tecnico traspirante con logo VaultBot riflettente. Ideale per il post-ride.",
    comingSoon: true,
  },
  {
    id: 4,
    name: "MotoVault Vinyl Stickers",
    category: "Accessories",
    price: "9.90€",
    image: "https://images.unsplash.com/photo-1572375927902-e60e87bb7fe1?q=80&w=800&auto=format&fit=crop",
    description: "Set di 10 adesivi vinilici ultra-resistenti agli agenti atmosferici per personalizzare la tua moto.",
    comingSoon: true,
  }
];

export default function Shop() {
  const { t } = useTranslation();

  const featuredProduct = products.find(p => p.isFeatured);
  const otherProducts = products.filter(p => !p.isFeatured);

  return (
    <div className="min-h-screen pb-20 bg-[#080808]">
      {/* Hero Section */}
      <div className="relative h-[450px] overflow-hidden flex items-center justify-center">
        <div 
          className="absolute inset-0 z-0 scale-105"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1511068797325-6083f0f872b1?q=80&w=2000&auto=format&fit=crop')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-[#080808] z-10" />
        
        {/* Back Button */}
        <Link href="/">
          <div className="absolute top-8 left-8 z-30 p-3 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 text-white hover:bg-primary hover:text-black transition-all flex items-center gap-2 font-bold text-[10px] uppercase tracking-widest cursor-pointer group">
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Torna alla Dashboard
          </div>
        </Link>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-20 text-center space-y-6 px-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-4">
            <Zap className="w-3 h-3 fill-primary" />
            The Official Collection 2026
          </div>
          <h1 className="text-6xl md:text-8xl font-black font-display tracking-tighter uppercase italic leading-none">
            MOTOVAULT <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-primary/40 italic">STORE.</span>
          </h1>
          <p className="text-gray-400 max-w-lg mx-auto text-xs uppercase tracking-[0.4em] font-light leading-relaxed">
            Equipaggiamento tecnico d'élite progettato <br /> per il rider che non scende a compromessi.
          </p>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-20 relative z-30">
        {/* Featured Section */}
        {featuredProduct && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="mb-16"
          >
            <div className="relative rounded-[2.5rem] overflow-hidden bg-zinc-900/50 border border-white/10 flex flex-col md:flex-row h-auto md:h-[450px] group shadow-2xl">
              <div className="w-full md:w-1/2 h-64 md:h-full relative overflow-hidden">
                <img 
                  src={featuredProduct.image} 
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
                  alt={featuredProduct.name}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent md:hidden" />
              </div>
              <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center space-y-6 bg-gradient-to-br from-zinc-900 to-black">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-primary text-black text-[10px] font-black rounded-full uppercase tracking-tighter">
                    {featuredProduct.tag}
                  </span>
                  <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                    {featuredProduct.category}
                  </span>
                </div>
                <h2 className="text-3xl md:text-4xl font-black font-display uppercase tracking-tighter text-white">
                  {featuredProduct.name}
                </h2>
                <p className="text-gray-400 text-sm leading-relaxed max-w-md">
                  {featuredProduct.description}
                </p>
                <div className="text-3xl font-black text-primary">
                  {featuredProduct.price}
                </div>
                <Button 
                  asChild
                  className="w-full md:w-fit h-14 px-10 rounded-2xl bg-primary hover:bg-primary/90 text-black font-black gap-3 shadow-xl shadow-primary/20 text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
                >
                  <a href={featuredProduct.link} target="_blank" rel="noopener noreferrer">
                    ACQUISTA ORA
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Categories Section (Simplified for now) */}
        <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
          <h3 className="text-lg font-black font-display uppercase tracking-widest">Esplora Prodotti</h3>
          <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <span className="text-primary cursor-pointer">Tutti</span>
            <span className="hover:text-white cursor-pointer transition-colors">Abbigliamento</span>
            <span className="hover:text-white cursor-pointer transition-colors">Accessori</span>
          </div>
        </div>

        {/* Other Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {otherProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="group relative bg-zinc-900/30 border border-white/5 rounded-[2rem] overflow-hidden hover:border-primary/20 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5">
                <div className="relative h-72 overflow-hidden">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale-[0.2] group-hover:grayscale-0"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-80" />
                  
                  {product.comingSoon && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] z-20">
                      <div className="bg-white/5 backdrop-blur-md border border-white/10 px-6 py-3 rounded-2xl transform rotate-[-2deg] shadow-2xl">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/80">
                          Coming Soon
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-8 space-y-4 relative">
                  <div className="space-y-1">
                    <div className="text-[9px] text-primary/60 font-black uppercase tracking-widest">{product.category}</div>
                    <h3 className="text-lg font-black font-display uppercase leading-none tracking-tight group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                  </div>

                  <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 font-medium">
                    {product.description}
                  </p>

                  <div className="flex items-center justify-between pt-2">
                    <div className="text-2xl font-black text-white">{product.price}</div>
                    <Button 
                      disabled={product.comingSoon}
                      className={`rounded-2xl h-12 px-6 font-black text-[10px] uppercase tracking-widest transition-all ${
                        product.comingSoon 
                        ? "bg-white/5 border border-white/10 text-white/20" 
                        : "bg-white text-black hover:bg-primary shadow-lg shadow-white/5"
                      }`}
                    >
                      {product.comingSoon ? "Notificami" : "Aggiungi"}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Features Row */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 py-12 border-y border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-widest">Qualità Garantita</div>
              <div className="text-[10px] text-muted-foreground uppercase mt-1">Materiali testati in sella</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-widest">Spedizione Express</div>
              <div className="text-[10px] text-muted-foreground uppercase mt-1">Consegna in 48 ore</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <ShoppingBag className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-widest">Resi Facili</div>
              <div className="text-[10px] text-muted-foreground uppercase mt-1">30 giorni per cambiare idea</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
