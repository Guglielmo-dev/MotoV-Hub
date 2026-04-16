import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useTranslation } from "react-i18next";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface MonthlyExpense {
  month: string;
  amount: number;
}

interface ExpensesChartProps {
  data: MonthlyExpense[];
  isLoading?: boolean;
  className?: string;
}

export function ExpensesChart({ data, isLoading, className }: ExpensesChartProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className={cn("surface-premium p-6 rounded-2xl animate-pulse h-[360px]", className)}>
        <div className="h-6 w-1/4 bg-white/5 rounded mb-8" />
        <div className="h-full w-full bg-white/5 rounded" />
      </div>
    );
  }

  const hasData = data && data.length > 0;

  return (
    <div className={cn("surface-premium p-6 rounded-2xl group flex flex-col", className)}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-black font-display text-foreground tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            {t('dashboard.expensesTrend')}
          </h3>
          <p className="text-[10px] uppercase font-mono font-bold tracking-[0.1em] text-muted-foreground opacity-50">
            {t('dashboard.expensesChartSub')}
          </p>
        </div>
        <div className="p-2 border border-white/5 rounded-lg bg-black/20 text-[10px] font-mono text-muted-foreground">
          {t('dashboard.liveData')}
        </div>
      </div>

      <div className="flex-1 min-h-[260px] w-full mt-4 relative">
        {hasData ? (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00FF41" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00FF41" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }}
                dx={-10}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0F0F0F', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 800,
                  boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)'
                }}
                itemStyle={{ color: '#00FF41' }}
                cursor={{ stroke: 'rgba(0, 255, 65, 0.2)', strokeWidth: 2 }}
              />
              <Area 
                type="monotone" 
                dataKey="amount" 
                stroke="#00FF41" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorAmount)" 
                animationDuration={1500}
                dot={{ stroke: '#00FF41', strokeWidth: 2, fill: '#050505', r: 4 }}
                activeDot={{ r: 6, strokeWidth: 0, fill: '#00FF41', className: 'glow-green' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full w-full flex items-center justify-center text-muted-foreground opacity-30 italic text-sm">
            {t('dashboard.noDataAvailable')}
          </div>
        )}
      </div>

      <div className="mt-6 pt-6 border-t border-white/5 flex gap-10">
        <div className="flex flex-col">
          <span className="text-[9px] uppercase font-mono text-muted-foreground opacity-60 mb-1">{t('dashboard.avgMonthlyCost')}</span>
          <span className="text-xl font-bold font-display tracking-tight">
            {t('units.currency')}{Math.round(data.reduce((acc, curr) => acc + curr.amount, 0) / (data.length || 1))}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] uppercase font-mono text-muted-foreground opacity-60 mb-1">{t('dashboard.currentMonthCost')}</span>
          <span className="text-xl font-bold font-display text-primary tracking-tight">
            {t('units.currency')}{data[data.length - 1]?.amount || 0}
          </span>
        </div>
      </div>
    </div>
  );
}
