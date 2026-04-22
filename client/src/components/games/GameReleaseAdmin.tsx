import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { GameRelease, InsertGameRelease } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Loader2, X } from "lucide-react";

const GAME_CATEGORIES = ['Arcade', 'Racing', 'Motorcycle', 'Retro', 'Trivia'];
const RELEASE_STATUSES = [
  'In Sviluppo', 
  'In Lavorazione', 
  'In Aggiornamento', 
  'Completato', 
  'Coming Soon'
];

export function GameReleaseAdmin() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  
  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("Arcade");
  const [progress, setProgress] = useState("Coming Soon");

  const { data: releases, isLoading } = useQuery<GameRelease[]>({
    queryKey: ["/api/game-releases"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertGameRelease) => {
      const res = await apiRequest("POST", "/api/game-releases", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/game-releases"] });
      toast({ title: "Rilascio pubblicato", description: "La news è stata aggiunta correttamente." });
      setTitle("");
      setDescription("");
      setIsOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/game-releases/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/game-releases"] });
      toast({ title: "Rilascio eliminato" });
    }
  });

  if (!isOpen) {
    return (
      <Button 
        onClick={() => setIsOpen(true)}
        className="w-full mt-4 bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 text-[10px] font-black uppercase tracking-widest h-12 rounded-xl"
      >
        <Plus className="w-4 h-4 mr-2" />
        Gestisci Rilasci
      </Button>
    );
  }

  return (
    <div className="mt-4 p-6 rounded-2xl bg-black/60 border border-primary/30 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xs font-black uppercase tracking-widest text-primary">Nuovo Rilascio</h3>
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 hover:bg-white/10">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-4 mb-8">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Titolo Gioco/News</label>
          <Input 
            value={title} 
            onChange={(e) => setTitle(e.target.value)}
            placeholder="es. Helmet Hero 2"
            className="bg-white/5 border-white/10 rounded-xl"
          />
        </div>
        
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Categoria (Tipo)</label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="bg-white/5 border-white/10 rounded-xl text-[10px] uppercase font-bold tracking-widest">
              <SelectValue placeholder="Seleziona categoria" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-white/10 text-[10px] uppercase font-bold tracking-widest">
              {GAME_CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Stato / Progresso</label>
          <Select value={progress} onValueChange={setProgress}>
            <SelectTrigger className="bg-white/5 border-white/10 rounded-xl text-[10px] uppercase font-bold tracking-widest">
              <SelectValue placeholder="Seleziona stato" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-white/10 text-[10px] uppercase font-bold tracking-widest">
              {RELEASE_STATUSES.map(status => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Descrizione</label>
          <Textarea 
            value={description} 
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Dettagli sul rilascio..."
            className="bg-white/5 border-white/10 rounded-xl min-h-[100px]"
          />
        </div>

        <Button 
          onClick={() => createMutation.mutate({ title, description, type, progress })}
          disabled={!title || !description || createMutation.isPending}
          className="w-full bg-primary text-black font-black uppercase tracking-widest rounded-xl py-6"
        >
          {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Pubblica Rilascio"}
        </Button>
      </div>

      {releases && releases.length > 0 && (
        <div className="pt-6 border-t border-white/10">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Rilasci Attivi</h4>
          <div className="space-y-3">
            {releases.map(r => (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="truncate mr-4">
                  <p className="text-[10px] font-bold uppercase text-white truncate">{r.title}</p>
                  <div className="flex gap-2">
                    <p className="text-[9px] text-primary uppercase font-bold">{r.type}</p>
                    <p className="text-[9px] text-muted-foreground uppercase">{r.progress}</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => deleteMutation.mutate(r.id)}
                  disabled={deleteMutation.isPending}
                  className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
