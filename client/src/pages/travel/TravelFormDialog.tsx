import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Camera, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { DatePicker } from "@/components/ui/DatePicker";
import { TravelLog, TravelFormData, emptyForm } from "./types";
import { useTranslation } from "react-i18next";

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
      <DialogContent className="bg-card border-white/10 text-foreground sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-display uppercase text-primary">
            {existing ? t('travel.editJourney') : t('travel.logJourney')}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={e => { e.preventDefault(); save(form); }} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">{t('travel.tripTitle')} *</label>
              <input required value={form.title} onChange={e => set('title', e.target.value)}
                placeholder={t('travel.titlePlaceholder')}
                className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50"
                data-testid="input-travel-title" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">{t('travel.location')} *</label>
              <input required value={form.location} onChange={e => set('location', e.target.value)}
                placeholder={t('travel.locationPlaceholder')}
                className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50"
                data-testid="input-travel-location" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">{t('travel.date')} *</label>
              <DatePicker value={form.visitDate} onChange={val => set('visitDate', val)} placeholder={t('travel.selectDate')} />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">{t('travel.diaryEntry')} *</label>
            <textarea required value={form.description} onChange={e => set('description', e.target.value)}
              placeholder={t('travel.diaryPlaceholder')}
              className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 h-36 resize-none focus:outline-none focus:border-primary/50"
              data-testid="input-travel-description" />
          </div>

          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">
              {t('travel.highlights')}
            </label>
            <textarea value={form.highlights} onChange={e => set('highlights', e.target.value)}
              placeholder={t('travel.highlightsPlaceholder')}
              className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 h-24 resize-none focus:outline-none focus:border-primary/50"
              data-testid="input-travel-highlights" />
          </div>

          <div className="flex items-center gap-3 p-3 bg-background rounded-xl border border-white/10">
            <input type="checkbox" id="isUpcoming" checked={form.isUpcoming} onChange={e => set('isUpcoming', e.target.checked)}
              className="w-4 h-4 rounded accent-primary" />
            <label htmlFor="isUpcoming" className="text-sm cursor-pointer">
              {t('travel.plannedTripDesc')}
            </label>
          </div>

          {form.imageUrl ? (
            <div className="relative rounded-xl overflow-hidden">
              <img src={form.imageUrl} className="w-full h-44 object-cover" />
              <button type="button" onClick={() => set('imageUrl', '')}
                className="absolute top-2 right-2 p-1 rounded-full bg-black/60 hover:bg-black/80">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-white/15 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors text-sm disabled:opacity-50">
              <Camera className="w-4 h-4" />
              {uploading ? t('common.uploading') : t('travel.addPhoto')}
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} />

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-muted-foreground hover:text-foreground transition-colors">
              {t('common.cancel')}
            </button>
            <button type="submit" disabled={isPending}
              className="flex-1 py-2.5 bg-primary text-black font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
              data-testid="button-submit-travel">
              {isPending ? t('common.saving') : existing ? t('travel.updateJourney') : t('travel.logJourney')}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
