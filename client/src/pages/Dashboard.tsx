import { useDashboardSummary } from "@/hooks/use-dashboard";
import { Activity, CircleDollarSign, Bike, ArrowUpRight, GraduationCap, Map, PenTool } from "lucide-react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { StatCard } from "@/components/dashboard/StatCard";
import { ExpensesChart } from "@/components/dashboard/ExpensesChart";
import { MaintenanceWidget } from "@/components/dashboard/MaintenanceWidget";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export function Dashboard() {
  const { data: summary, isLoading, error } = useDashboardSummary();
  const { data: user } = useAuth();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="space-y-10 animate-pulse p-6">
        <div className="space-y-2">
          <div className="h-10 w-64 bg-white/5 rounded-lg"></div>
          <div className="h-4 w-96 bg-white/5 rounded-lg"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-white/5 rounded-2xl"></div>)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[400px] bg-white/5 rounded-2xl"></div>
          <div className="h-[400px] bg-white/5 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-destructive p-8">{t('dashboard.failedLoad')}</div>;
  }

  return (
    <div className="space-y-10 fade-in pb-12">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-gradient-to-b from-primary/5 to-transparent -mx-6 px-6 py-8 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="h-1 w-8 bg-primary rounded-full" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-primary">
              {t('dashboard.operatingSystem')}
            </span>
          </div>
          <h1 className="text-5xl font-black font-display tracking-tight text-foreground uppercase">
            {t('dashboard.welcomeBackUser', { name: user?.username || 'RIDER' })}
          </h1>
          <p className="text-muted-foreground mt-2 max-w-md text-sm font-medium leading-relaxed">
            {t('dashboard.garageStatus', { 
              count: summary?.motorcycleCount || 0, 
              unit: t('dashboard.unitMotorcycles') 
            })}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link href="/garage" className="flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-white/10 hover:border-primary/30 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest transition-all group">
            {t('dashboard.openGarage')} <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
          <button className="p-3 bg-primary text-black rounded-xl hover:scale-105 active:scale-95 transition-all glow-green">
            <PenTool className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-2">
        <StatCard 
          title={t('dashboard.totalMotorcycles')} 
          value={summary?.motorcycleCount || 0} 
          icon={Bike}
        />
        <StatCard 
          title={t('dashboard.totalKilometers')} 
          value={(summary?.totalMileage || 0).toLocaleString()} 
          icon={Map}
        />
        <StatCard 
          title={t('dashboard.totalExpenses')} 
          value={`${t('units.currency')}${Number(summary?.totalExpenses || 0).toLocaleString()}`} 
          icon={CircleDollarSign}
        />
        <StatCard 
          title={t('dashboard.communityRank')} 
          value="#12" 
          icon={GraduationCap}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 px-2">
        {/* Left Column: Analytics */}
        <div className="xl:col-span-2 space-y-8">
          <ExpensesChart data={summary?.monthlyExpenses || []} />
          
          <div className="surface-premium rounded-2xl p-6">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-black font-display tracking-tight uppercase">{t('dashboard.recentActivity')}</h2>
              </div>
              <span className="text-[10px] font-mono font-bold text-muted-foreground opacity-50 uppercase tracking-widest">
                {t('dashboard.activityLog')}
              </span>
            </div>
            
            {(!summary?.recentActivity || summary.recentActivity.length === 0) ? (
              <div className="text-center py-16 text-muted-foreground flex flex-col items-center opacity-30">
                <Activity className="w-16 h-16 mb-4" />
                <p className="font-bold text-lg uppercase tracking-tight">{t('dashboard.noActivityTitle')}</p>
                <p className="text-xs max-w-[200px] mt-2">{t('dashboard.noActivityDesc')}</p>
              </div>
            ) : (
              <div className="relative pl-8 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-white/5">
                {summary.recentActivity.map((activity, i) => (
                  <div key={i} className="relative group/item">
                    {/* Timeline Node */}
                    <div className={cn(
                      "absolute -left-[27px] top-1.5 w-[14px] h-[14px] rounded-full border-2 border-background z-10 transition-all duration-300 group-hover/item:scale-125",
                      activity.type === 'maintenance' ? "bg-primary glow-green" : "bg-emerald-500"
                    )} />
                    
                    <div className="flex justify-between items-start transition-all duration-300 group-hover/item:translate-x-1">
                      <div>
                        <h4 className="font-bold text-sm uppercase tracking-wide group-hover/item:text-primary transition-colors">
                          {activity.title || activity.description}
                        </h4>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-[10px] leading-none text-muted-foreground font-mono font-medium">
                            {new Date(activity.date).toLocaleDateString()}
                          </p>
                          <span className="h-1 w-1 rounded-full bg-white/20" />
                          <p className="text-[10px] lowercase font-medium text-muted-foreground italic opacity-60">
                            {activity.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn(
                          "font-black font-display text-lg tracking-tight",
                          activity.type === 'maintenance' ? "text-primary" : "text-emerald-400"
                        )}>
                          {t('units.currency')}{Number(activity.cost || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Widgets */}
        <div className="space-y-8">
          <MaintenanceWidget data={summary?.maintenanceSoon || []} />
          
          {/* Quick Actions / Snapshot Widget */}
          <div className="surface-premium p-6 rounded-2xl group overflow-hidden relative">
            <h3 className="text-xl font-black font-display text-foreground tracking-tight mb-6 uppercase flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5 text-primary" />
              {t('dashboard.quickActions')}
            </h3>
            <div className="grid grid-cols-2 gap-4 relative z-10">
              <button className="h-24 bg-white/3 border border-white/5 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-primary/10 hover:border-primary/30 transition-all group/btn">
                <Bike className="w-6 h-6 text-muted-foreground group-hover/btn:text-primary transition-colors" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover/btn:text-foreground">{t('dashboard.addBike')}</span>
              </button>
              <button className="h-24 bg-white/3 border border-white/5 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-primary/10 hover:border-primary/30 transition-all group/btn">
                <CircleDollarSign className="w-6 h-6 text-muted-foreground group-hover/btn:text-primary transition-colors" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover/btn:text-foreground">{t('dashboard.newExpense')}</span>
              </button>
            </div>
            
            {/* Background design element */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all" />
          </div>
        </div>
      </div>
    </div>
  );
}
