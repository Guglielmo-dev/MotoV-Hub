import { useState, useEffect } from "react";
import { useMotorcycles, useCreateMotorcycle, useUpdateMotorcycle } from "@/hooks/use-motorcycles";
import { Link, useLocation } from "wouter";
import { Plus, Bike, Calendar, Settings2, FileText, Camera, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ImageUploadField } from "@/components/ui/ImageUploadField";
import { useTranslation } from "react-i18next";
import { DatePicker } from "@/components/ui/DatePicker";
import { LibrettoScanner } from "@/components/LibrettoScanner";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { useCreateStripeSession } from "@/hooks/use-stripe";
import { useAuth } from "@/hooks/use-auth";

export function Garage() {
  const { data: motorcycles, isLoading } = useMotorcycles();
  const { mutate: createBike, isPending } = useCreateMotorcycle();
  const { mutate: updateBike } = useUpdateMotorcycle();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [location] = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [editingPhotoId, setEditingPhotoId] = useState<number | null>(null);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');

  // Handle payment success redirect from Stripe
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      queryClient.invalidateQueries({ queryKey: [api.auth.me.path] });
      toast({
        title: "Pagamento completato! 🎉",
        description: "Il tuo credito è stato aggiunto. Ora puoi scansionare il libretto.",
        duration: 5000,
      });
      // Clean up URL without reload
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [queryClient, toast]);


  const { data: user } = useAuth();
  const currentCount = motorcycles?.length || 0;
  const slots = user?.motorcycleSlots || 2;
  const isLimitReached = currentCount >= slots;

  const buySlot = useCreateStripeSession();

  const [formData, setFormData] = useState({
    brand: '', model: '', year: new Date().getFullYear(),
    engineSize: '', mileage: 0, description: '', photos: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLimitReached) return;
    createBike({ ...formData, year: Number(formData.year), mileage: Number(formData.mileage) }, {
      onSuccess: () => {
        setIsOpen(false);
        setFormData({ brand: '', model: '', year: new Date().getFullYear(), engineSize: '', mileage: 0, description: '', photos: '' });
      }
    });
  };

  const handleSavePhoto = () => {
    if (editingPhotoId === null) return;
    updateBike({ id: editingPhotoId, photos: newPhotoUrl }, {
      onSuccess: () => {
        setEditingPhotoId(null);
        setNewPhotoUrl('');
      }
    });
  };

  const inputCls = "w-full bg-background border border-white/10 rounded-lg px-3 py-2 focus:border-primary outline-none text-sm";

  return (
    <div className="space-y-8 fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display">{t('garage.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('garage.subtitle')}</p>
        </div>

        <div className="flex gap-2">
          {/* Add Motorcycle Dialog */}
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <button data-testid="button-add-motorcycle" className="flex items-center gap-2 px-5 py-2.5 bg-primary text-black font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:-translate-y-0.5">
                <Plus className="w-5 h-5" />
                {t('garage.addMotorcycle')}
              </button>
            </DialogTrigger>
            <DialogContent className="bg-card border-white/10 text-foreground sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
              <DialogHeader className="pr-8">
                <DialogTitle className="text-2xl font-display uppercase text-primary border-b border-white/10 pb-4">{t('garage.newMotorcycle')}</DialogTitle>
              </DialogHeader>

              {isLimitReached ? (
                <div className="py-8 flex flex-col items-center text-center space-y-6">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                    <Bike className="w-10 h-10 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold uppercase tracking-tight">{t('garage.limitReached')}</h3>
                    <p className="text-sm text-muted-foreground max-w-[280px]">
                      {t('garage.limitReachedDesc', { count: slots })}
                    </p>
                  </div>
                  <button
                    onClick={() => buySlot.mutate('motorcycle_slot')}
                    disabled={buySlot.isPending}
                    className="w-full relative group overflow-hidden py-4 bg-gradient-to-r from-primary to-emerald-400 text-black rounded-xl font-black uppercase tracking-widest transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(var(--primary-rgb),0.5)] active:scale-[0.98] flex items-center justify-center gap-3"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    {buySlot.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                      <>
                        <Plus className="w-5 h-5" />
                        {t('garage.buySlot')}
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <>
                  {/* AI Quick Add Trigger */}
                  <div className="mt-4 bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center justify-between group">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-primary text-black font-black px-1.5 py-0.5 rounded tracking-tighter animate-pulse">
                          {t('garage.tryAITag')}
                        </span>
                        <h4 className="text-sm font-bold text-primary uppercase tracking-tight">
                          {t('garage.aiFeatureTitle')}
                        </h4>
                      </div>
                      <p className="text-xs text-muted-foreground pr-2">
                        {t('garage.aiFeatureDesc')}
                      </p>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setIsScannerOpen(true)}
                      className="shrink-0 px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-black hover:border-primary transition-all flex items-center gap-2 shadow-lg"
                    >
                      <FileText className="w-4 h-4" />
                      {t('garage.fromRegistration')}
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('garage.brand')}</label>
                        <input data-testid="input-brand" required value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className={inputCls} placeholder={t('garage.brandPlaceholder')} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('garage.model')}</label>
                        <input data-testid="input-model" required value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} className={inputCls} placeholder={t('garage.modelPlaceholder')} />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('garage.year')}</label>
                        <input type="number" required value={formData.year} onChange={e => setFormData({...formData, year: parseInt(e.target.value)})} className={inputCls} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('garage.engineSize')} (cc)</label>
                        <input value={formData.engineSize} onChange={e => setFormData({...formData, engineSize: e.target.value})} className={inputCls} placeholder="998" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('garage.mileage')}</label>
                        <input type="number" required value={formData.mileage} onChange={e => setFormData({...formData, mileage: parseInt(e.target.value)})} className={inputCls} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t('garage.description')}</label>
                      <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className={`${inputCls} h-20 resize-none`} placeholder={t('garage.descriptionPlaceholder')} />
                    </div>
                    <ImageUploadField label={t('garage.photos')} value={formData.photos} onChange={url => setFormData({...formData, photos: url})} />
                    <button type="submit" disabled={isPending} className="w-full py-3 bg-primary text-black rounded-xl font-bold mt-4 hover:bg-primary/90 transition-colors disabled:opacity-50">
                      {isPending ? t('garage.saving') : t('garage.saveToGarage')}
                    </button>
                  </form>
                </>
              )}
            </DialogContent>
          </Dialog>

          <LibrettoScanner 
            open={isScannerOpen} 
            onOpenChange={setIsScannerOpen} 
            onSuccess={() => setIsOpen(false)}
            isLimitReached={isLimitReached}
          />
        </div>
      </div>

      {/* Change Photo Dialog */}
      <Dialog open={editingPhotoId !== null} onOpenChange={open => { if (!open) { setEditingPhotoId(null); setNewPhotoUrl(''); } }}>
        <DialogContent className="bg-card border-white/10 text-foreground sm:max-w-[420px]">
          <DialogHeader className="pr-8">
            <DialogTitle className="text-xl font-display uppercase text-primary border-b border-white/10 pb-4">{t('garage.changePhoto')}</DialogTitle>
          </DialogHeader>
          <div className="pt-4 space-y-4">
            <ImageUploadField label={t('garage.newPhoto')} value={newPhotoUrl} onChange={setNewPhotoUrl} />
            <button
              onClick={handleSavePhoto}
              disabled={!newPhotoUrl}
              className="w-full py-3 bg-primary text-black rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-40"
            >
              {t('garage.savePhoto')}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1,2,3].map(i => <div key={i} className="h-64 bg-card rounded-2xl"></div>)}
        </div>
      ) : motorcycles?.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-2xl border border-white/5 border-dashed">
          <Bike className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-bold mb-2">{t('garage.emptyGarage')}</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">{t('garage.emptyGarageDesc')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {motorcycles?.map((bike) => (
            <div key={bike.id} className="relative group">
              <Link href={`/garage/${bike.id}`}>
                <div data-testid={`card-motorcycle-${bike.id}`} className="glass-panel rounded-2xl overflow-hidden cursor-pointer hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 flex flex-col h-full">
                  <div className="h-48 relative overflow-hidden bg-secondary">
                    {bike.photos ? (
                      <img src={bike.photos} alt={`${bike.brand} ${bike.model}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center opacity-20">
                        <Bike className="w-20 h-20" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent opacity-80" />
                    <h3 className="absolute bottom-4 left-4 text-2xl font-bold font-display uppercase tracking-wider">{bike.brand}</h3>

                    {/* Edit photo button — appears on hover */}
                    <button
                      data-testid={`button-edit-photo-${bike.id}`}
                      onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        setNewPhotoUrl(bike.photos || '');
                        setEditingPhotoId(bike.id);
                      }}
                      className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary hover:text-black"
                      title={t('common.changePhotoTooltip')}
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between bg-card group-hover:bg-card/80 transition-colors">
                    <div>
                      <h4 className="text-lg font-semibold text-foreground/90">{bike.model}</h4>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{bike.description || t('garage.noDescription')}</p>
                    </div>
                    <div className="flex items-center gap-4 mt-6 pt-4 border-t border-white/5 text-sm text-muted-foreground font-mono">
                      <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-primary" />{bike.year}</div>
                      <div className="flex items-center gap-1.5"><Settings2 className="w-4 h-4 text-primary" />{bike.engineSize || 'N/A'}cc</div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
