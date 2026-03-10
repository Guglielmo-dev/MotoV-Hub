import { useDashboardSummary } from "@/hooks/use-dashboard";
import { Activity, CircleDollarSign, Bike, ArrowUpRight } from "lucide-react";
import { Link } from "wouter";

export function Dashboard() {
  const { data: summary, isLoading, error } = useDashboardSummary();

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 w-48 bg-card rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-32 bg-card rounded-2xl"></div>
          <div className="h-32 bg-card rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-destructive">Failed to load dashboard.</div>;
  }

  return (
    <div className="space-y-8 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display">Command Center</h1>
          <p className="text-muted-foreground mt-1">Overview of your garage and expenses.</p>
        </div>
        <Link href="/garage" className="hidden sm:flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-white/10 rounded-lg text-sm font-medium transition-colors">
          Go to Garage <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:border-primary/50 transition-all duration-500">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Bike className="w-24 h-24 text-primary" />
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-primary/20 text-primary rounded-lg flex items-center justify-center">
              <Bike className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-lg">Total Motorcycles</h3>
          </div>
          <p className="text-5xl font-bold font-display text-gradient">{summary?.motorcycleCount || 0}</p>
        </div>

        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:border-primary/50 transition-all duration-500">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <CircleDollarSign className="w-24 h-24 text-primary" />
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-primary/20 text-primary rounded-lg flex items-center justify-center">
              <CircleDollarSign className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-lg">Total Expenses</h3>
          </div>
          <p className="text-5xl font-bold font-display text-gradient">
            ${Number(summary?.totalExpenses || 0).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
          <Activity className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Recent Activity</h2>
        </div>
        
        {(!summary?.recentActivity || summary.recentActivity.length === 0) ? (
          <div className="text-center py-8 text-muted-foreground flex flex-col items-center">
            <Activity className="w-12 h-12 mb-3 opacity-20" />
            <p>No recent activity in your garage.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {summary.recentActivity.map((activity, i) => (
              <div key={i} className="flex justify-between items-center p-4 bg-background rounded-xl border border-white/5">
                <div>
                  <h4 className="font-semibold">{activity.title}</h4>
                  <p className="text-sm text-muted-foreground">{new Date(activity.date || activity.installDate || activity.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold font-mono text-primary">
                    ${Number(activity.cost || activity.price || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
