import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type CustomTheme, type InsertCustomTheme } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export function useCustomThemes() {
  return useQuery<CustomTheme[]>({
    queryKey: ["/api/themes"],
  });
}

export function useCreateCustomTheme() {
  const { toast } = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: async (data: InsertCustomTheme) => {
      const res = await apiRequest("POST", "/api/themes", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/themes"] });
      toast({
        title: t('common.confirm'),
        description: t('settings.themeCreated', { defaultValue: 'Tema personalizzato creato correttamente' }),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteCustomTheme() {
  const { toast } = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/themes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/themes"] });
      toast({
        title: t('common.confirm'),
        description: t('settings.themeDeleted', { defaultValue: 'Tema rimosso correttamente' }),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
