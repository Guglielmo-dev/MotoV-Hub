import { useState } from "react";
import { Plus, FileText } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { DatePicker as CustomDatePicker } from "@/components/ui/DatePicker";

interface DocumentsTabProps {
  id: number;
  bike: any;
}

export function DocumentsTab({ id, bike }: DocumentsTabProps) {
  const [isDocOpen, setIsDocOpen] = useState(false);
  const [isHistoricalOpen, setIsHistoricalOpen] = useState(false);
  const [docLoading, setDocLoading] = useState(false);
  const [docForm, setDocForm] = useState({ documentUrl: '', registrationDate: '', initialMileage: 0, createMaintenanceRecord: true });
  const [historicalForm, setHistoricalForm] = useState({ title: '', date: '', mileage: 0, cost: '', notes: '' });

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    setDocLoading(true);
    try {
      await apiRequest('POST', `/api/motorcycles/${id}/registration-document`, docForm);
      setIsDocOpen(false);
      setDocForm({ documentUrl: '', registrationDate: '', initialMileage: 0, createMaintenanceRecord: true });
      window.location.reload();
    } catch (error) {
      console.error('Failed to upload document:', error);
      alert('Failed to upload document');
    } finally {
      setDocLoading(false);
    }
  };

  const handleAddHistorical = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('POST', `/api/motorcycles/${id}/maintenance-history`, historicalForm);
      setIsHistoricalOpen(false);
      setHistoricalForm({ title: '', date: '', mileage: 0, cost: '', notes: '' });
      window.location.reload();
    } catch (error) {
      console.error('Failed to add maintenance record:', error);
      alert('Failed to add maintenance record');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold font-display">Registration Documents & History</h3>
        <div className="flex gap-2">
          <Dialog open={isHistoricalOpen} onOpenChange={setIsHistoricalOpen}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-white/10 text-sm font-medium rounded-lg transition-colors border border-white/5">
                <Plus className="w-4 h-4" /> Add Past Service
              </button>
            </DialogTrigger>
            <DialogContent className="bg-card border-white/10 text-foreground">
              <DialogHeader className="pr-8"><DialogTitle>Log Historical Service</DialogTitle></DialogHeader>
              <form onSubmit={handleAddHistorical} className="space-y-4">
                <input required value={historicalForm.title} onChange={e=>setHistoricalForm({...historicalForm,title:e.target.value})} placeholder="Service Title (e.g. Oil Change)" className="w-full bg-background border border-white/10 rounded-lg px-3 py-2" />
                <div className="grid grid-cols-2 gap-4">
                  <CustomDatePicker value={historicalForm.date} onChange={val => setHistoricalForm({...historicalForm, date: val})} placeholder="Select service date" />
                  <input type="number" value={historicalForm.cost} onChange={e=>setHistoricalForm({...historicalForm,cost:e.target.value})} placeholder="Cost (optional)" className="w-full bg-background border border-white/10 rounded-lg px-3 py-2" />
                </div>
                <input required type="number" value={historicalForm.mileage} onChange={e=>setHistoricalForm({...historicalForm,mileage:Number(e.target.value)})} placeholder="Mileage at service" className="w-full bg-background border border-white/10 rounded-lg px-3 py-2" />
                <textarea value={historicalForm.notes} onChange={e=>setHistoricalForm({...historicalForm,notes:e.target.value})} placeholder="Notes from service booklet (Optional)" className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 h-20" />
                <button type="submit" className="w-full py-3 bg-primary text-white rounded-xl font-bold">Save Record</button>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={isDocOpen} onOpenChange={setIsDocOpen}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-white/10 text-sm font-medium rounded-lg transition-colors border border-white/5">
                <Plus className="w-4 h-4" /> Upload Registration
              </button>
            </DialogTrigger>
            <DialogContent className="bg-card border-white/10 text-foreground">
              <DialogHeader className="pr-8"><DialogTitle>Upload Vehicle Registration</DialogTitle></DialogHeader>
              <form onSubmit={handleUploadDocument} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Document URL or Path</label>
                  <input required value={docForm.documentUrl} onChange={e=>setDocForm({...docForm,documentUrl:e.target.value})} placeholder="Document URL" className="w-full bg-background border border-white/10 rounded-lg px-3 py-2" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Registration Date</label>
                    <CustomDatePicker value={docForm.registrationDate} onChange={val => setDocForm({...docForm, registrationDate: val})} placeholder="Select registration date" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Initial Mileage</label>
                    <input required type="number" value={docForm.initialMileage} onChange={e=>setDocForm({...docForm,initialMileage:Number(e.target.value)})} placeholder="0" className="w-full bg-background border border-white/10 rounded-lg px-3 py-2" />
                  </div>
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={docForm.createMaintenanceRecord} onChange={e=>setDocForm({...docForm,createMaintenanceRecord:e.target.checked})} className="w-4 h-4" />
                  <span className="text-sm font-medium">Create initial maintenance record from registration date</span>
                </label>
                <button type="submit" disabled={docLoading} className="w-full py-3 bg-primary text-white rounded-xl font-bold">{docLoading ? "Uploading..." : "Upload Document"}</button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {bike.registrationDocumentUrl ? (
        <div className="bg-card/80 backdrop-blur-md p-6 rounded-2xl border border-white/5">
          <h4 className="font-bold text-lg mb-4">Registration Document</h4>
          <dl className="space-y-3">
            <div><dt className="text-sm text-muted-foreground">Registered Date</dt><dd className="font-medium">{bike.registrationDate ? format(new Date(bike.registrationDate), 'MMMM d, yyyy') : 'N/A'}</dd></div>
            <div><dt className="text-sm text-muted-foreground">Initial Mileage</dt><dd className="font-medium">{bike.initialMileage?.toLocaleString()} mi</dd></div>
            <div><dt className="text-sm text-muted-foreground">Document</dt><dd className="font-mono text-sm break-all text-primary hover:underline cursor-pointer">{bike.registrationDocumentUrl}</dd></div>
          </dl>
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground bg-card/80 backdrop-blur-md border border-white/5 rounded-2xl">No registration document uploaded yet. Upload one to create initial maintenance history.</div>
      )}
    </div>
  );
}
