import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Dialog, 
  DialogContent, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Camera, X, MapPin, Calendar, BookOpen, Navigation, Sparkles, CheckCircle2, Circle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { DatePicker } from "@/components/ui/DatePicker";
import { TravelLog, TravelFormData, emptyForm } from "./types";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface TravelFormDialogProps {
  open: boolean;
  onClose: () => void;
  existing?: TravelLog | null;
}

export function TravelFormDialog({ open, onClose, existing }: TravelFormDialogProps) {
  const [form, setForm] = useState<TravelFormData>(
    existing ? {
      title: existing.title,
      location: existing.location,
      visitDate: existing.visitDate,
      description: existing.description,
      highlights: existing.highlights ?? '',
      imageUrl: existing.imageUrl ?? '',
      isUpcoming: existing.isUpcoming ?? false,
    } : emptyForm
  );
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  const { mutate: save, isPending } = useMutation({
    mutationFn: (data: object) => existing
      ? apiRequest('PUT', `/api/travel/${existing.id}`, data)
      : apiRequest('POST', '/api/travel', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/travel'] });
      toast({ title: existing ? t('travel.journeyUpdated') : t('travel.journeyLogged') });
      onClose();
    },
  });

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append('image', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      setForm(f => ({ ...f, imageUrl: data.url }));
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setUploading(false);
    }
  };

  const set = (key: keyof TravelFormData, val: string | boolean) =>
    setForm(f => ({ ...f, [key]: val }));

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="surface-premium border-white/10 text-foreground sm:max-w-[680px] p-0 overflow-hidden">
        {/* Header Section */}
        <div className="relative px-8 pt-8 pb-6 border-b border-white/5 bg-black/40">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Navigation className="w-5 h-5 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-black font-display uppercase tracking-tight">
              {existing ? t('travel.editJourney') : t('travel.logJourney')}
            </DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground text-sm font-medium">
            {form.isUpcoming ? t('travel.plannedTripDesc') : t('travel.subtitle')}
          </DialogDescription>
        </div>

        <form onSubmit={e => { e.preventDefault(); save(form); }} className="p-8 space-y-8 max-h-[70vh] overflow-y-auto scrollbar-hide">
          
          {/* Segmented Control State */}
          <div className="flex p-1.5 bg-black/40 rounded-2xl border border-white/5 w-fit">
            {[
              { id: false, label: t('travel.completedTrip'), icon: CheckCircle2 },
              { id: true, label: t('travel.plannedTrip'), icon: Circle }
            ].map((tab) => (
              <button
                key={tab.label}
                type="button"
                onClick={() => set('isUpcoming', tab.id)}
                className={cn(
                  "flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
                  form.isUpcoming === tab.id 
                    ? "bg-primary text-black shadow-lg shadow-primary/20" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Essential Specs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="sm:col-span-2 space-y-2 group">
              <label className="text-[10px] uppercase font-mono font-bold tracking-widest text-muted-foreground opacity-60 ml-2 group-focus-within:text-primary transition-colors">
                {t('travel.adventureTitlePlaceholder')}
              </label>
              <div className="relative">
                <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                <input required value={form.title} onChange={e => set('title', e.target.value)}
                  placeholder={t('travel.titlePlaceholder')}
                  className="w-full bg-black/20 border border-white/5 rounded-2xl px-11 py-4 text-lg font-bold tracking-tight focus:outline-none focus:border-primary/40 focus:bg-primary/5 transition-all outline-none"
                  data-testid="input-travel-title" />
              </div>
            </div>

            <div className="space-y-2 group">
              <label className="text-[10px] uppercase font-mono font-bold tracking-widest text-muted-foreground opacity-60 ml-2 group-focus-within:text-primary transition-colors">
                {t('travel.location')}
              </label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                <input required value={form.location} onChange={e => set('location', e.target.value)}
                  placeholder={t('travel.locationPlaceholder')}
                  className="w-full bg-black/20 border border-white/5 rounded-2xl px-11 py-3 text-sm focus:outline-none focus:border-primary/40 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2 group">
              <label className="text-[10px] uppercase font-mono font-bold tracking-widest text-muted-foreground opacity-60 ml-2 group-focus-within:text-primary transition-colors">
                {t('travel.date')}
              </label>
              <DatePicker 
                className="bg-black/20 border-white/5 rounded-2xl py-6 pl-11"
                value={form.visitDate} 
                onChange={val => set('visitDate', val)} 
                placeholder={t('travel.selectDate')} 
              />
            </div>
          </div>

          {/* Narrative Section */}
          <div className="space-y-2 group">
            <label className="text-[10px] uppercase font-mono font-bold tracking-widest text-muted-foreground opacity-60 ml-2 group-focus-within:text-primary transition-colors">
              {t('travel.diaryEntry')}
            </label>
            <div className="relative">
              <BookOpen className="absolute left-4 top-4 w-4 h-4 text-muted-foreground/40" />
              <textarea required value={form.description} onChange={e => set('description', e.target.value)}
                placeholder={t('travel.diaryNarrativePlaceholder')}
                className="w-full bg-black/20 border border-white/5 border-l-primary/40 border-l-4 rounded-2xl px-11 py-4 h-44 resize-none focus:outline-none focus:border-primary/40 transition-all text-sm leading-relaxed"
              />
            </div>
          </div>

          {/* Visual Data Points */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-start">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-mono font-bold tracking-widest text-muted-foreground opacity-60 ml-2">
                {t('travel.highlights')}
              </label>
              <textarea value={form.highlights} onChange={e => set('highlights', e.target.value)}
                placeholder={t('travel.highlightsQuickPlaceholder')}
                className="w-full bg-black/20 border border-white/5 rounded-2xl px-4 py-3 h-32 resize-none focus:outline-none focus:border-primary/40 transition-all text-xs opacity-70"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-mono font-bold tracking-widest text-muted-foreground opacity-60 ml-2">
                {t('travel.addPhoto')}
              </label>
              {form.imageUrl ? (
                <div className="relative rounded-2xl overflow-hidden group/img aspect-video">
                  <img src={form.imageUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105" />
                  <div className="absolute inset-0 bg-black/20 group-hover/img:bg-black/40 transition-colors" />
                  <button type="button" onClick={() => set('imageUrl', '')}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-red-500 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                  className="w-full aspect-video flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-white/5 bg-black/20 text-muted-foreground hover:border-primary/30 hover:bg-primary/5 hover:text-primary transition-all group/up">
                  <div className="p-3 rounded-full bg-white/5 group-hover/up:bg-primary/10 transition-colors">
                    <Camera className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest">{uploading ? t('common.uploading') : t('travel.addPhoto')}</span>
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose}
              className="flex-1 py-4 rounded-2xl border border-white/10 text-xs font-black uppercase tracking-widest text-muted-foreground hover:bg-white/5 hover:text-foreground transition-all">
              {t('common.cancel')}
            </button>
            <button type="submit" disabled={isPending}
              className="flex-[2] py-4 bg-primary text-black text-xs font-black uppercase tracking-widest rounded-2xl hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-primary/20 transition-all disabled:opacity-50">
              {isPending ? t('common.saving') : existing ? t('travel.updateJourney') : t('travel.logJourney')}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
