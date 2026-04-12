import { useState } from "react";
import { Plus, Trash2, PenTool } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/DatePicker";
import { useModifications, useCreateModification, useDeleteModification } from "@/hooks/use-modifications";

interface ModificationsTabProps {
  id: number;
}

export function ModificationsTab({ id }: ModificationsTabProps) {
  const { data: modifications } = useModifications(id);
  const { mutate: addModification, isPending: modPending } = useCreateModification();
  const { mutate: deleteModification } = useDeleteModification();
  
  const [modForm, setModForm] = useState({ title: '', price: 0, installDate: '', description: '' });
  const [isModOpen, setIsModOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold font-display">Modifications</h3>
        <Dialog open={isModOpen} onOpenChange={setIsModOpen}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-white/10 text-sm font-medium rounded-lg transition-colors border border-white/5">
              <Plus className="w-4 h-4" /> Add Mod
            </button>
          </DialogTrigger>
          <DialogContent className="bg-card border-white/10 text-foreground">
            <DialogHeader className="pr-8"><DialogTitle>Add Modification</DialogTitle></DialogHeader>
            <form onSubmit={e => {
              e.preventDefault();
              addModification({ motorcycleId: id, data: { ...modForm, price: modForm.price.toString() } }, { onSuccess: () => { setIsModOpen(false); setModForm({title:'',price:0,installDate:'',description:''}) }});
            }} className="space-y-4">
              <input required value={modForm.title} onChange={e=>setModForm({...modForm,title:e.target.value})} placeholder="Modification (e.g. Akrapovic Exhaust)" className="w-full bg-background border border-white/10 rounded-lg px-3 py-2" />
              <div className="grid grid-cols-2 gap-4">
                <DatePicker value={modForm.installDate} onChange={val => setModForm({...modForm, installDate: val})} placeholder="Select install date" />
                <input required type="number" value={modForm.price} onChange={e=>setModForm({...modForm,price:Number(e.target.value)})} placeholder="Price ($)" className="w-full bg-background border border-white/10 rounded-lg px-3 py-2" />
              </div>
              <textarea value={modForm.description} onChange={e=>setModForm({...modForm,description:e.target.value})} placeholder="Description (Optional)" className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 h-24" />
              <button type="submit" disabled={modPending} className="w-full py-3 bg-primary text-white rounded-xl font-bold">{modPending ? "Saving..." : "Save Mod"}</button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modifications?.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground bg-card/80 backdrop-blur-md border border-white/5 rounded-2xl">No modifications added yet. Keep it stock?</div>
        ) : modifications?.map(mod => (
          <div key={mod.id} className="bg-card/80 backdrop-blur-md border border-white/5 p-5 rounded-2xl relative group">
            <button onClick={() => deleteModification({ id: mod.id, motorcycleId: id })} className="absolute top-4 right-4 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
              <Trash2 className="w-4 h-4" />
            </button>
            <h4 className="font-bold text-lg pr-8">{mod.title}</h4>
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5">
              <span className="text-xs text-muted-foreground">{format(new Date(mod.installDate), 'MMM yyyy')}</span>
              <span className="font-mono font-bold text-primary">${Number(mod.price).toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
