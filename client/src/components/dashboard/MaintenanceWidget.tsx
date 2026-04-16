import { BellRing, Calendar, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

interface MaintenanceItem {
  type: string;
  date: string;
  title: string;
  description: string;
  cost: number | string;
}

interface MaintenanceWidgetProps {
  data: MaintenanceItem[];
  isLoading?: boolean;
  className?: string;
}

export function MaintenanceWidget({ data, isLoading, className }: MaintenanceWidgetProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className={cn("surface-premium p-6 rounded-2xl animate-pulse space-y-4", className)}>
        <div className="h-6 w-1/2 bg-white/5 rounded" />
        <div className="space-y-3">
          <div className="h-16 bg-white/5 rounded-xl" />
          <div className="h-16 bg-white/5 rounded-xl" />
        </div>
      </div>
    );
  }

  const hasItems = data && data.length > 0;

  return (
    <div className={cn("surface-premium p-6 rounded-2xl flex flex-col group", className)}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-black font-display text-foreground tracking-tight flex items-center gap-2">
            <BellRing className="w-5 h-5 text-primary" />
            {t('dashboard.maintenanceRadar')}
          </h3>
          <p className="text-[10px] uppercase font-mono font-bold tracking-[0.1em] text-muted-foreground opacity-50">
            {t('dashboard.maintenanceSub')}
          </p>
        </div>
        {!hasItems ? null : (
          <div className="bg-primary/20 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary/30 text-nowrap">
            {data.length} {t('dashboard.maintenanceAlert')}
          </div>
        )}
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1">
        {hasItems ? (
          data.map((item, i) => (
            <div 
              key={i} 
              className="group/item flex items-center justify-between p-4 bg-white/3 border border-white/5 rounded-xl hover:bg-white/5 hover:border-primary/20 transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-black/40 border border-white/5 flex items-center justify-center text-primary group-hover/item:text-foreground group-hover/item:glow-green transition-all transition-colors">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground group-hover/item:text-primary transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-[10px] text-muted-foreground font-mono opacity-60">
                    {new Date(item.date).toLocaleDateString()} — {item.description.split(' on ')[1]}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover/item:text-primary transition-all" />
            </div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center py-8 opacity-40">
            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-3">
              <BellRing className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-xs italic font-medium">{t('dashboard.everythingInOrder')}</p>
            <p className="text-[9px] uppercase tracking-widest mt-1">{t('dashboard.noUrgentActions')}</p>
          </div>
        )}
      </div>

      <Link href="/garage" className="mt-8 flex items-center justify-center w-full py-3 bg-white/3 border border-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-all text-foreground">
        {t('dashboard.manageGarage')}
      </Link>
    </div>
  );
}
