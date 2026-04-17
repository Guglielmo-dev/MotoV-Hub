import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export interface DashboardSummary {
  motorcycleCount: number;
  totalExpenses: number;
  totalMileage: number;
  recentActivity: any[];
  monthlyExpenses: { month: string; amount: number }[];
  maintenanceSoon: any[];
}

export function useDashboardSummary() {
  return useQuery<DashboardSummary>({
    queryKey: [api.dashboard.summary.path],
    queryFn: async () => {
      const res = await fetch(api.dashboard.summary.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch dashboard summary");
      return res.json();
    },
  });
}
