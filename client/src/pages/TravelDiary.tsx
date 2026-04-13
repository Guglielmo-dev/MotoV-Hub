import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  MapPin, Plus, BookOpen,
  Calendar, Navigation
} from "lucide-react";
import { TravelLog } from "./travel/types";
import { TravelCard } from "./travel/TravelCard";
import { TravelFormDialog } from "./travel/TravelFormDialog";
import { TravelDetailDialog } from "./travel/TravelDetailDialog";
import { PlannedBadge } from "./travel/components";
import { useTranslation } from "react-i18next";

export function TravelDiary() {
  const [formOpen, setFormOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<TravelLog | null>(null);
  const [editingLog, setEditingLog] = useState<TravelLog | null>(null);
  const { t } = useTranslation();

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
            {t('travel.title')}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">{t('travel.subtitle')}</p>
        </div>
        <button
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-black font-bold rounded-xl hover:opacity-90 transition-opacity whitespace-nowrap"
          data-testid="button-add-journey"
        >
          <Plus className="w-4 h-4" />
          {t('travel.addJourney')}
        </button>
      </div>

      {logs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: t('travel.stats.totalTrips'), value: logs.length, icon: MapPin },
            { label: t('travel.stats.destinations'), value: countries.length, icon: Navigation },
            { label: t('travel.stats.upcoming'), value: upcoming.length, icon: Calendar },
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
            <p className="font-bold text-lg">{t('travel.emptyDiary')}</p>
            <p className="text-muted-foreground text-sm mt-1">{t('travel.emptyDiaryDesc')}</p>
          </div>
          <button onClick={() => setFormOpen(true)}
            className="px-6 py-2.5 bg-primary text-black font-bold rounded-xl hover:opacity-90 transition-opacity">
            {t('travel.logFirstJourney')}
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {upcoming.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-sm font-mono uppercase tracking-widest text-green-400">{t('travel.upcomingTrips')}</h2>
                <div className="flex-1 h-px bg-green-400/10" />
                <span className="text-xs text-muted-foreground">{upcoming.length}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {upcoming.map(log => (
                  <div key={log.id} className="relative">
                    <PlannedBadge />
                    <TravelCard log={log} onClick={() => setSelectedLog(log)} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground">{t('travel.pastAdventures')}</h2>
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

export default TravelDiary;
