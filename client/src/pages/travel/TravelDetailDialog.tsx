import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Calendar, Edit3, Trash2, Star, Navigation } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { TravelLog } from "./types";
import { formatDate, gradientFor, UpcomingBadge } from "./components";

interface TravelDetailDialogProps {
  log: TravelLog;
  onEdit: () => void;
  onClose: () => void;
}

export function TravelDetailDialog({ log, onEdit, onClose }: TravelDetailDialogProps) {
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
              <div className="absolute top-4 left-4">
                <UpcomingBadge />
              </div>
            )}
          </div>
        ) : (
          <div className={`relative h-28 rounded-t-2xl bg-gradient-to-r ${gradientFor(log.id)} flex items-center px-6`}>
            <MapPin className="w-8 h-8 text-primary/60" />
            {log.isUpcoming && (
              <div className="absolute top-4 right-4">
                <UpcomingBadge />
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
