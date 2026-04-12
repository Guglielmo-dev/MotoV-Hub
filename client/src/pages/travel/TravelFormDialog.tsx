import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Camera, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { DatePicker } from "@/components/ui/DatePicker";
import { TravelLog, TravelFormData, emptyForm } from "./types";

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

  const { mutate: save, isPending } = useMutation({
    mutationFn: (data: object) => existing
      ? apiRequest('PUT', `/api/travel/${existing.id}`, data)
      : apiRequest('POST', '/api/travel', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/travel'] });
      toast({ title: existing ? 'Journey updated!' : 'Journey logged!' });
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
            {existing ? 'Edit Journey' : 'Log a Journey'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={e => { e.preventDefault(); save(form); }} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Trip Title *</label>
              <input required value={form.title} onChange={e => set('title', e.target.value)}
                placeholder="e.g. Alpine Roads Adventure"
                className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50"
                data-testid="input-travel-title" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Location *</label>
              <input required value={form.location} onChange={e => set('location', e.target.value)}
                placeholder="e.g. Amalfi Coast, Italy"
                className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50"
                data-testid="input-travel-location" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Date *</label>
              <DatePicker value={form.visitDate} onChange={val => set('visitDate', val)} placeholder="Select trip date" />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Diary Entry *</label>
            <textarea required value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="Describe the roads, the weather, the people you met, the feeling of freedom..."
              className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 h-36 resize-none focus:outline-none focus:border-primary/50"
              data-testid="input-travel-description" />
          </div>

          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">
              Highlights — food, sights, tips
            </label>
            <textarea value={form.highlights} onChange={e => set('highlights', e.target.value)}
              placeholder="Best pasta in Rome at Trattoria da Mario... Incredible sunset at the Stelvio Pass... Pack rain gear..."
              className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 h-24 resize-none focus:outline-none focus:border-primary/50"
              data-testid="input-travel-highlights" />
          </div>

          <div className="flex items-center gap-3 p-3 bg-background rounded-xl border border-white/10">
            <input type="checkbox" id="isUpcoming" checked={form.isUpcoming} onChange={e => set('isUpcoming', e.target.checked)}
              className="w-4 h-4 rounded accent-primary" />
            <label htmlFor="isUpcoming" className="text-sm cursor-pointer">
              This is a <strong>planned upcoming trip</strong> (not yet completed)
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
              {uploading ? 'Uploading...' : 'Add a photo from your ride'}
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} />

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-muted-foreground hover:text-foreground transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isPending}
              className="flex-1 py-2.5 bg-primary text-black font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
              data-testid="button-submit-travel">
              {isPending ? 'Saving...' : existing ? 'Update Journey' : 'Log Journey'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
