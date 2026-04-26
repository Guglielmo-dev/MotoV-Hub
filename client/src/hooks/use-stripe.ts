import { useMutation } from '@tanstack/react-query';
import { StripeProductType } from '@shared/schema';
import { useToast } from './use-toast';

export function useCreateStripeSession() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (type: StripeProductType) => {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Errore creazione sessione');
      }
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      toast({
        title: "Errore di pagamento",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}
