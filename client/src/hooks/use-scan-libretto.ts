import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from "@shared/routes";

export function useScanAndSaveLibretto() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/scan-libretto-and-save', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Errore scansione');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/motorcycles'] });
      queryClient.invalidateQueries({ queryKey: [api.auth.me.path] });
    }
  });
}
