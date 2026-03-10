import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertMotorcycle, type Motorcycle } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useMotorcycles() {
  return useQuery<Motorcycle[]>({
    queryKey: [api.motorcycles.list.path],
    queryFn: async () => {
      const res = await fetch(api.motorcycles.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch motorcycles");
      return res.json();
    },
  });
}

export function useMotorcycle(id: number) {
  return useQuery<Motorcycle>({
    queryKey: [api.motorcycles.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.motorcycles.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) throw new Error("Motorcycle not found");
      if (!res.ok) throw new Error("Failed to fetch motorcycle");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateMotorcycle() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertMotorcycle) => {
      const res = await fetch(api.motorcycles.create.path, {
        method: api.motorcycles.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to add motorcycle");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.motorcycles.list.path] });
      toast({ title: "Success", description: "Motorcycle added to your garage." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });
}

export function useUpdateMotorcycle() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<InsertMotorcycle>) => {
      const url = buildUrl(api.motorcycles.update.path, { id });
      const res = await fetch(url, {
        method: api.motorcycles.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update motorcycle");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.motorcycles.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.motorcycles.get.path, data.id] });
      toast({ title: "Updated", description: "Motorcycle details saved." });
    },
  });
}

export function useDeleteMotorcycle() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.motorcycles.delete.path, { id });
      const res = await fetch(url, {
        method: api.motorcycles.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete motorcycle");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.motorcycles.list.path] });
      toast({ title: "Deleted", description: "Motorcycle removed from garage." });
    },
  });
}
