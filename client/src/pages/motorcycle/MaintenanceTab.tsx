import { useState } from "react";
import { Plus, Trash2, Wrench } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/DatePicker";
import { useMaintenance, useCreateMaintenance, useDeleteMaintenance } from "@/hooks/use-maintenance";
import { useTranslation } from "react-i18next";

interface MaintenanceTabProps {
  id: number;
}

export function MaintenanceTab({ id }: MaintenanceTabProps) {
  const { data: maintenance } = useMaintenance(id);
  const { mutate: addMaintenance, isPending: maintPending } = useCreateMaintenance();
  const { mutate: deleteMaintenance } = useDeleteMaintenance();
  const { t } = useTranslation();
  
  const [maintForm, setMaintForm] = useState({ title: '', date: '', mileage: 0, cost: 0, notes: '' });
  const [isMaintOpen, setIsMaintOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold font-display">{t('motorcycleDetails.maintenance')}</h3>
        <Dialog open={isMaintOpen} onOpenChange={setIsMaintOpen}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-white/10 text-sm font-medium rounded-lg transition-colors border border-white/5">
              <Plus className="w-4 h-4" /> {t('motorcycleDetails.addMaintenance')}
            </button>
          </DialogTrigger>
          <DialogContent className="bg-card border-white/10 text-foreground">
            <DialogHeader className="pr-8"><DialogTitle>{t('motorcycleDetails.addMaintenance')}</DialogTitle></DialogHeader>
            <form onSubmit={e => {
              e.preventDefault();
              addMaintenance({ motorcycleId: id, data: { ...maintForm, cost: maintForm.cost.toString(), mileage: Number(maintForm.mileage) } }, { onSuccess: () => { setIsMaintOpen(false); setMaintForm({title:'',date:'',mileage:0,cost:0,notes:''}) }});
            }} className="space-y-4">
              <input required value={maintForm.title} onChange={e=>setMaintForm({...maintForm,title:e.target.value})} placeholder={t('motorcycleDetails.title') + " (" + t('motorcycleDetails.titleExample') + ")"} className="w-full bg-background border border-white/10 rounded-lg px-3 py-2" />
              <div className="grid grid-cols-2 gap-4">
                <DatePicker value={maintForm.date} onChange={val => setMaintForm({...maintForm, date: val})} placeholder={t('motorcycleDetails.date')} />
                <input required type="number" value={maintForm.cost} onChange={e=>setMaintForm({...maintForm,cost:Number(e.target.value)})} placeholder={t('motorcycleDetails.cost') + " (" + t('units.currency') + ")"} className="w-full bg-background border border-white/10 rounded-lg px-3 py-2" />
              </div>
              <input required type="number" value={maintForm.mileage} onChange={e=>setMaintForm({...maintForm,mileage:Number(e.target.value)})} placeholder={t('motorcycleDetails.mileageAtService')} className="w-full bg-background border border-white/10 rounded-lg px-3 py-2" />
              <textarea value={maintForm.notes} onChange={e=>setMaintForm({...maintForm,notes:e.target.value})} placeholder={t('motorcycleDetails.notes') + " " + t('common.optional')} className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 h-24" />
              <button type="submit" disabled={maintPending} className="w-full py-3 bg-primary text-black rounded-xl font-bold">{maintPending ? t('garage.saving') : t('common.save')}</button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {maintenance?.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-card/80 backdrop-blur-md border border-white/5 rounded-2xl">{t('motorcycleDetails.noMaintenance')}</div>
      ) : (
        <div className="relative pl-6 border-l-2 border-white/10 space-y-8 ml-4">
          {maintenance?.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(record => (
            <div key={record.id} className="relative group">
              <div className="absolute -left-[35px] top-1 w-4 h-4 rounded-full bg-primary ring-4 ring-background" />
              <div className="bg-card/80 backdrop-blur-md border border-white/5 p-5 rounded-xl hover:border-primary/30 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-lg">{record.title}</h4>
                    <span className="text-xs font-mono text-muted-foreground">{format(new Date(record.date), 'MMMM d, yyyy')} • {record.mileage.toLocaleString()} {t('units.km')}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold font-mono text-primary">{t('units.currency')}{Number(record.cost).toFixed(2)}</span>
                    <button onClick={() => deleteMaintenance({ id: record.id, motorcycleId: id })} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {record.notes && <p className="text-sm text-muted-foreground mt-3 bg-background/50 p-3 rounded-lg">{record.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
