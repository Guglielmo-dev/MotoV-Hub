import { MapPin, Calendar, Utensils, ChevronRight } from "lucide-react";
import { TravelLog } from "./types";
import { formatDate, gradientFor } from "./components";

interface TravelCardProps {
  log: TravelLog;
  onClick: () => void;
}

export function TravelCard({ log, onClick }: TravelCardProps) {
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
