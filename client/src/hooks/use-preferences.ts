import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export interface UserPreferences {
  audioEnabled?: boolean;
  customAudioData?: string | null;
  customAudioName?: string | null;
  activeBrandId?: string | null;
  activeCustomColor?: string | null;
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (prefs: UserPreferences) => {
      const res = await apiRequest("PATCH", "/api/user/preferences", prefs);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.auth.me.path] });
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
