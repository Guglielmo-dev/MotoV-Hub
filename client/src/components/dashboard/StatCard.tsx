import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isUp?: boolean;
    isPositive?: boolean;
  };
  isLoading?: boolean;
  className?: string;
}

export function StatCard({ title, value, icon: Icon, trend, isLoading, className }: StatCardProps) {
  if (isLoading) {
    return (
      <div className={cn("surface-premium p-6 rounded-2xl animate-pulse space-y-3", className)}>
        <div className="w-10 h-10 rounded-lg bg-white/5" />
        <div className="h-8 bg-white/5 rounded w-1/2" />
        <div className="h-4 bg-white/5 rounded w-full" />
      </div>
    );
  }

  return (
    <div className={cn(
      "surface-premium p-6 rounded-2xl relative overflow-hidden group hover:border-primary/20 transition-all duration-500",
      className
    )}>
      {/* Background Icon Glow */}
      <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
        <Icon className="w-24 h-24 text-primary" />
      </div>

      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center glow-green border border-primary/20">
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <div className={cn(
            "text-[10px] font-mono font-bold px-2 py-1 rounded-full border",
            trend.isPositive 
              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
              : "bg-destructive/10 text-destructive border-destructive/20"
          )}>
            {trend.value}
          </div>
        )}
      </div>

      <div className="relative z-10">
        <p className="text-[10px] uppercase font-mono font-bold tracking-[0.2em] text-muted-foreground mb-1 opacity-60">
          {title}
        </p>
        <h3 className="text-4xl font-black font-display text-foreground tracking-tight group-hover:text-primary transition-colors">
          {value}
        </h3>
      </div>

      {/* Subtle indicator line */}
      <div className="absolute bottom-0 left-0 h-1 w-0 bg-primary group-hover:w-full transition-all duration-700" />
    </div>
  );
}
