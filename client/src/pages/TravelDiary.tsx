import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin, Calendar, Plus, Trash2, Edit3, X, BookOpen,
  ChevronRight, Utensils, Camera, Star, Navigation
} from "lucide-react";
import { DatePicker } from "@/components/ui/DatePicker";

interface TravelLog {
  id: number;
  userId: number;
  title: string;
  location: string;
  visitDate: string;
  description: string;
  highlights: string | null;
  imageUrl: string | null;
  isUpcoming: boolean | null;
  createdAt: string | null;
}

const LOCATION_GRADIENTS = [
  'from-emerald-900/60 to-teal-900/40',
  'from-blue-900/60 to-indigo-900/40',
  'from-orange-900/60 to-amber-900/40',
  'from-purple-900/60 to-pink-900/40',
  'from-red-900/60 to-rose-900/40',
  'from-cyan-900/60 to-sky-900/40',
];

function gradientFor(id: number) {
  return LOCATION_GRADIENTS[id % LOCATION_GRADIENTS.length];
}

function formatDate(date: string) {
  try {
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return date;
  }
}

interface TravelFormData {
  title: string;
  location: string;
  visitDate: string;
  description: string;
  highlights: string;
  imageUrl: string;
  isUpcoming: boolean;
}

const emptyForm: TravelFormData = {
  title: '', location: '', visitDate: '', description: '',
  highlights: '', imageUrl: '', isUpcoming: false,
};

function TravelFormDialog({
  open, onClose, existing,
}: {
  open: boolean;
  onClose: () => void;
  existing?: TravelLog | null;
}) {
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
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = await res.json();
    setForm(f => ({ ...f, imageUrl: data.url }));
    setUploading(false);
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

function TravelDetailDialog({ log, onEdit, onClose }: { log: TravelLog; onEdit: () => void; onClose: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { mutate: deleteLog } = useMutation({
    mutationFn: () => apiRequest('DELETE', `/api/travel/${log.id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/travel'] });
      toast({ title: 'Journey deleted' });
      onClose();
    },
  });

  return (
    <Dialog open onOpenChange={o => !o && onClose()}>
      <DialogContent className="bg-card border-white/10 text-foreground sm:max-w-[660px] max-h-[90vh] overflow-y-auto p-0">
        {log.imageUrl ? (
          <div className="relative h-52 overflow-hidden rounded-t-2xl">
            <img src={log.imageUrl} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
            {log.isUpcoming && (
              <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/20 border border-green-500/40 text-green-400 text-xs font-semibold">
                <Navigation className="w-3 h-3" /> UPCOMING TRIP
              </div>
            )}
          </div>
        ) : (
          <div className={`relative h-28 rounded-t-2xl bg-gradient-to-r ${gradientFor(log.id)} flex items-center px-6`}>
            <MapPin className="w-8 h-8 text-primary/60" />
            {log.isUpcoming && (
              <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/20 border border-green-500/40 text-green-400 text-xs font-semibold">
                <Navigation className="w-3 h-3" /> UPCOMING TRIP
              </div>
            )}
          </div>
        )}

        <div className="p-6 space-y-5">
          <div>
            <h2 className="text-2xl font-black font-display">{log.title}</h2>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-primary" />{log.location}</span>
              <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-primary" />{formatDate(log.visitDate)}</span>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">Diary Entry</h3>
            <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">{log.description}</p>
          </div>

          {log.highlights && (
            <div className="p-4 bg-background rounded-xl border border-white/8 space-y-2">
              <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Star className="w-3.5 h-3.5 text-yellow-400" /> Highlights
              </h3>
              <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap">{log.highlights}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2 border-t border-white/5">
            <button onClick={onEdit}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-muted-foreground hover:text-foreground hover:border-white/25 transition-all text-sm">
              <Edit3 className="w-4 h-4" /> Edit
            </button>
            <button onClick={() => deleteLog()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-destructive/20 text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-all text-sm ml-auto">
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TravelCard({ log, onClick }: { log: TravelLog; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="bg-card border border-white/8 rounded-2xl overflow-hidden hover:border-white/20 transition-all cursor-pointer group"
      data-testid={`card-travel-${log.id}`}
    >
      {log.imageUrl ? (
        <div className="relative h-36 overflow-hidden">
          <img src={log.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute inset-0 bg-gradient-to-t from-card/70 to-transparent" />
        </div>
      ) : (
        <div className={`h-20 bg-gradient-to-r ${gradientFor(log.id)} flex items-center px-4`}>
          <MapPin className="w-6 h-6 text-white/40" />
        </div>
      )}
      <div className="p-4 space-y-2">
        <h3 className="font-bold text-base group-hover:text-primary transition-colors leading-snug line-clamp-2">
          {log.title}
        </h3>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          <span className="truncate">{log.location}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{formatDate(log.visitDate)}</span>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{log.description}</p>
        {log.highlights && (
          <div className="flex items-center gap-1.5 text-xs text-yellow-500/80 pt-1">
            <Utensils className="w-3 h-3" />
            <span className="truncate">{log.highlights.slice(0, 60)}{log.highlights.length > 60 ? '...' : ''}</span>
          </div>
        )}
        <div className="flex items-center justify-end pt-1">
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </div>
    </div>
  );
}

export function TravelDiary() {
  const [formOpen, setFormOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<TravelLog | null>(null);
  const [editingLog, setEditingLog] = useState<TravelLog | null>(null);

  const { data: logs = [], isLoading } = useQuery<TravelLog[]>({
    queryKey: ['/api/travel'],
  });

  const upcoming = logs.filter(l => l.isUpcoming);
  const past = logs.filter(l => !l.isUpcoming);

  const countries = [...new Set(logs.map(l => l.location.split(',').pop()?.trim()))].filter(Boolean);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-display uppercase tracking-wide flex items-center gap-3">
            <BookOpen className="w-7 h-7 text-primary" />
            Travel Diary
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Log your motorcycle adventures — roads, food, sights and memories</p>
        </div>
        <button
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-black font-bold rounded-xl hover:opacity-90 transition-opacity whitespace-nowrap"
          data-testid="button-add-journey"
        >
          <Plus className="w-4 h-4" />
          Add Journey
        </button>
      </div>

      {logs.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Trips', value: logs.length, icon: MapPin },
            { label: 'Destinations', value: countries.length, icon: Navigation },
            { label: 'Upcoming', value: upcoming.length, icon: Calendar },
          ].map(s => (
            <div key={s.label} className="bg-card border border-white/8 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <s.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-black font-display text-primary">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-60 bg-card rounded-2xl animate-pulse border border-white/5" />)}
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-24 space-y-4">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <BookOpen className="w-10 h-10 text-primary/50" />
          </div>
          <div>
            <p className="font-bold text-lg">Your diary is empty</p>
            <p className="text-muted-foreground text-sm mt-1">Start logging your motorcycle adventures</p>
          </div>
          <button onClick={() => setFormOpen(true)}
            className="px-6 py-2.5 bg-primary text-black font-bold rounded-xl hover:opacity-90 transition-opacity">
            Log your first journey
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {upcoming.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-sm font-mono uppercase tracking-widest text-green-400">Upcoming Trips</h2>
                <div className="flex-1 h-px bg-green-400/10" />
                <span className="text-xs text-muted-foreground">{upcoming.length}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {upcoming.map(log => (
                  <div key={log.id} className="relative">
                    <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-semibold">
                      <Navigation className="w-3 h-3" /> Planned
                    </div>
                    <TravelCard log={log} onClick={() => setSelectedLog(log)} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground">Past Adventures</h2>
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-xs text-muted-foreground">{past.length}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {past.map(log => <TravelCard key={log.id} log={log} onClick={() => setSelectedLog(log)} />)}
              </div>
            </section>
          )}
        </div>
      )}

      {(formOpen || editingLog) && (
        <TravelFormDialog
          open
          onClose={() => { setFormOpen(false); setEditingLog(null); }}
          existing={editingLog}
        />
      )}

      {selectedLog && !editingLog && (
        <TravelDetailDialog
          log={selectedLog}
          onEdit={() => { setEditingLog(selectedLog); setSelectedLog(null); }}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </div>
  );
}
