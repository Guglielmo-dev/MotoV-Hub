import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertModification, type Modification } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useModifications(motorcycleId: number) {
  return useQuery<Modification[]>({
    queryKey: [api.modifications.list.path, motorcycleId],
    queryFn: async () => {
      const url = buildUrl(api.modifications.list.path, { motorcycleId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch modifications");
      return res.json();
    },
    enabled: !!motorcycleId,
  });
}

export function useCreateModification() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ motorcycleId, data }: { motorcycleId: number, data: Omit<InsertModification, 'motorcycleId'> }) => {
      const url = buildUrl(api.modifications.create.path, { motorcycleId });
      const res = await fetch(url, {
        method: api.modifications.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to add modification");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.modifications.list.path, variables.motorcycleId] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.summary.path] });
      toast({ title: "Added", description: "Modification saved successfully." });
    },
  });
}

export function useDeleteModification() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, motorcycleId }: { id: number, motorcycleId: number }) => {
      const url = buildUrl(api.modifications.delete.path, { id });
      const res = await fetch(url, {
        method: api.modifications.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete modification");
      return { motorcycleId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.modifications.list.path, data.motorcycleId] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.summary.path] });
      toast({ title: "Deleted", description: "Modification removed." });
    },
  });
}
