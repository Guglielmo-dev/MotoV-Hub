import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertMaintenance, type Maintenance } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useMaintenance(motorcycleId: number) {
  return useQuery<Maintenance[]>({
    queryKey: [api.maintenance.list.path, motorcycleId],
    queryFn: async () => {
      const url = buildUrl(api.maintenance.list.path, { motorcycleId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch maintenance records");
      return res.json();
    },
    enabled: !!motorcycleId,
  });
}

export function useCreateMaintenance() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ motorcycleId, data }: { motorcycleId: number, data: Omit<InsertMaintenance, 'motorcycleId'> }) => {
      const url = buildUrl(api.maintenance.create.path, { motorcycleId });
      const res = await fetch(url, {
        method: api.maintenance.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to log maintenance");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.maintenance.list.path, variables.motorcycleId] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.summary.path] }); // Update dashboard stats
      toast({ title: "Logged", description: "Maintenance record saved successfully." });
    },
  });
}

export function useDeleteMaintenance() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, motorcycleId }: { id: number, motorcycleId: number }) => {
      const url = buildUrl(api.maintenance.delete.path, { id });
      const res = await fetch(url, {
        method: api.maintenance.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete record");
      return { motorcycleId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.maintenance.list.path, data.motorcycleId] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.summary.path] });
      toast({ title: "Deleted", description: "Maintenance record removed." });
    },
  });
}
