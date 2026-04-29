import { motion } from "framer-motion";
import { ShoppingBag, ExternalLink, Star, BookOpen, Tag, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";

const products = [
  {
    id: 1,
    name: "The MotoVault Rider's Journal",
    category: "Books",
    price: "19.90€",
    image: "https://images.unsplash.com/photo-1614165933026-0750fcd503e8?q=80&w=800&auto=format&fit=crop",
    description: "Il compagno fisico perfetto per il tuo garage digitale. Diario di manutenzione, log di viaggio e guide tecniche.",
    link: "https://www.amazon.it", // Qui metterai il link KDP
    isBook: true,
    tag: undefined as string | undefined
  },
  {
    id: 2,
    name: "Carbon Fiber Series Hoodie",
    category: "Apparel",
    price: "45.00€",
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800&auto=format&fit=crop",
    description: "Felpa premium in cotone biologico con dettagli ispirati alla fibra di carbonio. Comfort e stile per ogni rider.",
    comingSoon: true,
    tag: undefined as string | undefined
  },
  {
    id: 3,
    name: "VaultBot Performance Cap",
    category: "Accessories",
    price: "25.00€",
    image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=800&auto=format&fit=crop",
    description: "Cappellino tecnico traspirante, ideale da indossare dopo aver tolto il casco. Design minimalista.",
    comingSoon: true,
    tag: undefined as string | undefined
  },
  {
    id: 4,
    name: "MotoVault Vinyl Stickers",
    category: "Accessories",
    price: "9.90€",
    image: "https://images.unsplash.com/photo-1572375927902-e60e87bb7fe1?q=80&w=800&auto=format&fit=crop",
    description: "Set di 10 adesivi vinilici ultra-resistenti per personalizzare la tua moto o il tuo casco.",
    comingSoon: true,
    tag: undefined as string | undefined
  }
];

export default function Shop() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen pb-20 space-y-10 fade-in">
      {/* Header Section */}
      <div className="relative h-64 rounded-3xl overflow-hidden flex items-center justify-center text-center px-6">
        {/* Back Button */}
        <Link href="/">
          <div className="absolute top-6 left-6 z-30 p-3 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-primary hover:text-black transition-all flex items-center gap-2 font-bold text-[10px] uppercase tracking-widest cursor-pointer group">
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Torna alla Dashboard
          </div>
        </Link>

        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1511068797325-6083f0f872b1?q=80&w=2000&auto=format&fit=crop')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-10" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-20 space-y-2"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-xs font-bold uppercase mb-2">
            <Tag className="w-3 h-3" />
            Official Merchandise
          </div>
          <h1 className="text-4xl md:text-5xl font-black font-display tracking-tighter uppercase italic">
            MOTOVAULT <span className="text-primary italic">STORE.</span>
          </h1>
          <p className="text-gray-300 max-w-md mx-auto text-[10px] uppercase tracking-[0.3em] font-light">
            Equipaggiamento premium per il rider moderno.
          </p>
        </motion.div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-2">
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="group relative h-full bg-card/50 border-white/5 overflow-hidden hover:border-primary/30 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10">
              {product.tag && (
                <div className="absolute top-4 left-4 z-30 px-2 py-1 bg-primary text-black text-[10px] font-black rounded uppercase tracking-tighter shadow-lg">
                  {product.tag}
                </div>
              )}
              
              {/* Product Image */}
              <div className="relative h-64 overflow-hidden bg-zinc-900">
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale-[0.3] group-hover:grayscale-0"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-60" />
                
                {product.comingSoon && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-20">
                    <span className="text-xs font-black uppercase tracking-[0.2em] border-2 border-white/20 px-4 py-2 rounded-lg text-white">
                      Coming Soon
                    </span>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <CardContent className="p-5 space-y-4">
                <div className="space-y-1">
                  <div className="text-[10px] text-primary font-bold uppercase tracking-widest">{product.category}</div>
                  <h3 className="text-sm font-bold font-display uppercase leading-tight group-hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                  <div className="text-lg font-black text-white/90">{product.price}</div>
                </div>

                <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed h-8">
                  {product.description}
                </p>

                {product.isBook ? (
                  <Button 
                    asChild
                    className="w-full h-10 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold gap-2 shadow-lg shadow-orange-500/20 text-xs"
                  >
                    <a href={product.link} target="_blank" rel="noopener noreferrer">
                      <BookOpen className="w-4 h-4" />
                      ACQUISTA SU AMAZON
                    </a>
                  </Button>
                ) : (
                  <Button 
                    disabled 
                    className="w-full h-10 rounded-xl bg-white/5 border border-white/10 text-white/40 font-bold text-xs"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    NOTIFY ME
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Footer Promo */}
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        className="p-8 rounded-3xl bg-zinc-900 border border-white/5 flex flex-col md:flex-row items-center justify-between gap-8"
      >
        <div className="space-y-4 text-center md:text-left">
          <h2 className="text-2xl font-black font-display uppercase tracking-tighter">
            VUOI VEDERE IL TUO BRAND <br />SU <span className="text-primary italic">MOTOVAULT?</span>
          </h2>
          <p className="text-muted-foreground text-xs max-w-md">
            Siamo aperti a collaborazioni con produttori di abbigliamento e accessori per moto. Contattaci per far parte della community.
          </p>
        </div>
        <Button variant="outline" className="h-12 px-6 rounded-2xl border-white/10 hover:bg-white/5 gap-2 uppercase font-black tracking-widest text-xs">
          Diventa Partner
          <ExternalLink className="w-4 h-4" />
        </Button>
      </motion.div>
    </div>
  );
}
