import { useState } from "react";
import { useRoute } from "wouter";
import { useMotorcycle, useUpdateMotorcycle, useDeleteMotorcycle } from "@/hooks/use-motorcycles";
import { useMaintenance, useCreateMaintenance, useDeleteMaintenance } from "@/hooks/use-maintenance";
import { useModifications, useCreateModification, useDeleteModification } from "@/hooks/use-modifications";
import { ConnectWallet } from "@/components/web3/ConnectWallet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { ArrowLeft, Wrench, Settings, Trash2, Plus, PenTool, Link as LinkIcon, ShieldAlert, FileText, Camera } from "lucide-react";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { ImageUploadField } from "@/components/ui/ImageUploadField";
import { DatePicker } from "@/components/ui/DatePicker";

export function MotorcycleDetails() {
  const [, params] = useRoute("/garage/:id");
  const id = parseInt(params?.id || "0");
  const [, setLocation] = useLocation();

  const { data: bike, isLoading: bikeLoading } = useMotorcycle(id);
  const { data: maintenance } = useMaintenance(id);
  const { data: modifications } = useModifications(id);
  
  const { mutate: addMaintenance, isPending: maintPending } = useCreateMaintenance();
  const { mutate: deleteMaintenance } = useDeleteMaintenance();
  
  const { mutate: addModification, isPending: modPending } = useCreateModification();
  const { mutate: deleteModification } = useDeleteModification();

  const { mutate: updateBike } = useUpdateMotorcycle();
  const { mutate: deleteBike } = useDeleteMotorcycle();

  const [maintForm, setMaintForm] = useState({ title: '', date: '', mileage: 0, cost: 0, notes: '' });
  const [modForm, setModForm] = useState({ title: '', price: 0, installDate: '', description: '' });
  const [docForm, setDocForm] = useState({ documentUrl: '', registrationDate: '', initialMileage: 0, createMaintenanceRecord: true });
  
  const [isMaintOpen, setIsMaintOpen] = useState(false);
  const [isModOpen, setIsModOpen] = useState(false);
  const [isDocOpen, setIsDocOpen] = useState(false);
  const [isHistoricalOpen, setIsHistoricalOpen] = useState(false);
  const [isPhotoEditOpen, setIsPhotoEditOpen] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [docLoading, setDocLoading] = useState(false);
  const [historicalForm, setHistoricalForm] = useState({ title: '', date: '', mileage: 0, cost: '', notes: '' });

  if (bikeLoading) return <div className="animate-pulse h-96 bg-card rounded-3xl" />;
  if (!bike) return <div className="text-destructive font-bold text-center py-20">Motorcycle not found</div>;

  const handleLinkNFT = (address: string) => {
    updateBike({ id, nftContractAddress: address, nftTokenId: "1" }); // Mock token ID for now
  };

  const handleDeleteBike = () => {
    if(confirm("Are you sure you want to scrap this motorcycle? All data will be lost.")) {
      deleteBike(id, { onSuccess: () => setLocation('/garage') });
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    setDocLoading(true);
    try {
      const response = await apiRequest('POST', `/api/motorcycles/${id}/registration-document`, docForm);
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
    <div className="space-y-8 fade-in pb-20">
      <Link href="/garage" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors text-sm font-medium">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Garage
      </Link>

      {/* Photo Edit Dialog */}
      <Dialog open={isPhotoEditOpen} onOpenChange={open => { if (!open) { setIsPhotoEditOpen(false); setNewPhotoUrl(''); } }}>
        <DialogContent className="bg-card border-white/10 text-foreground sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-display uppercase text-primary border-b border-white/10 pb-4">Change Motorcycle Photo</DialogTitle>
          </DialogHeader>
          <div className="pt-4 space-y-4">
            <ImageUploadField label="New Photo" value={newPhotoUrl} onChange={setNewPhotoUrl} />
            <button
              onClick={() => {
                updateBike({ id, photos: newPhotoUrl }, {
                  onSuccess: () => { setIsPhotoEditOpen(false); setNewPhotoUrl(''); }
                });
              }}
              disabled={!newPhotoUrl}
              className="w-full py-3 bg-primary text-black rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-40"
            >
              Save Photo
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="relative rounded-3xl overflow-hidden glass-panel border border-white/10">
        <div className="h-64 sm:h-80 w-full relative group">
          {bike.photos ? (
            <img src={bike.photos} alt={bike.model} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-secondary flex items-center justify-center">
              <span className="text-muted-foreground font-display text-4xl uppercase opacity-20">{bike.brand}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          {/* Camera button overlay */}
          <button
            data-testid="button-edit-hero-photo"
            onClick={() => { setNewPhotoUrl(bike.photos || ''); setIsPhotoEditOpen(true); }}
            className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary hover:text-black text-sm font-medium"
          >
            <Camera className="w-4 h-4" />
            {bike.photos ? 'Change Photo' : 'Add Photo'}
          </button>
          
          <div className="absolute bottom-0 left-0 p-6 sm:p-8 w-full flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="inline-block px-3 py-1 bg-primary/20 text-primary border border-primary/20 rounded-full text-sm font-bold font-mono mb-3">
                {bike.year} • {bike.engineSize}cc
              </div>
              <h1 className="text-4xl sm:text-5xl font-black font-display uppercase tracking-tight text-white shadow-black drop-shadow-md">
                {bike.brand} <span className="text-primary">{bike.model}</span>
              </h1>
              <p className="text-muted-foreground font-mono mt-2 flex items-center gap-2">
                {bike.mileage.toLocaleString()} miles
              </p>
            </div>
            
            <div className="flex gap-2">
              <ConnectWallet onConnect={handleLinkNFT} connectedAddress={bike.nftContractAddress || undefined} />
              <button onClick={handleDeleteBike} className="p-3 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white rounded-xl transition-all">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="maintenance" className="w-full">
        <TabsList className="bg-card border border-white/5 w-full justify-start rounded-xl p-1 h-auto flex-wrap sm:flex-nowrap">
          <TabsTrigger value="maintenance" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg py-2.5 px-6">
            <Wrench className="w-4 h-4 mr-2" /> Maintenance
          </TabsTrigger>
          <TabsTrigger value="modifications" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg py-2.5 px-6">
            <PenTool className="w-4 h-4 mr-2" /> Modifications
          </TabsTrigger>
          <TabsTrigger value="details" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg py-2.5 px-6">
            <Settings className="w-4 h-4 mr-2" /> Specs & Details
          </TabsTrigger>
          <TabsTrigger value="documents" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg py-2.5 px-6">
            <FileText className="w-4 h-4 mr-2" /> Documents
          </TabsTrigger>
        </TabsList>

        <div className="mt-8">
          <TabsContent value="maintenance" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-bold font-display">Service History</h3>
              <Dialog open={isMaintOpen} onOpenChange={setIsMaintOpen}>
                <DialogTrigger asChild>
                  <button className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-white/10 text-sm font-medium rounded-lg transition-colors border border-white/5">
                    <Plus className="w-4 h-4" /> Log Service
                  </button>
                </DialogTrigger>
                <DialogContent className="bg-card border-white/10 text-foreground">
                  <DialogHeader><DialogTitle>Log Maintenance</DialogTitle></DialogHeader>
                  <form onSubmit={e => {
                    e.preventDefault();
                    addMaintenance({ motorcycleId: id, data: { ...maintForm, cost: maintForm.cost.toString(), mileage: Number(maintForm.mileage) } }, { onSuccess: () => { setIsMaintOpen(false); setMaintForm({title:'',date:'',mileage:0,cost:0,notes:''}) }});
                  }} className="space-y-4">
                    <input required value={maintForm.title} onChange={e=>setMaintForm({...maintForm,title:e.target.value})} placeholder="Service Title (e.g. Oil Change)" className="w-full bg-background border border-white/10 rounded-lg px-3 py-2" />
                    <div className="grid grid-cols-2 gap-4">
                      <DatePicker value={maintForm.date} onChange={val => setMaintForm({...maintForm, date: val})} placeholder="Select service date" />
                      <input required type="number" value={maintForm.cost} onChange={e=>setMaintForm({...maintForm,cost:Number(e.target.value)})} placeholder="Cost ($)" className="w-full bg-background border border-white/10 rounded-lg px-3 py-2" />
                    </div>
                    <input required type="number" value={maintForm.mileage} onChange={e=>setMaintForm({...maintForm,mileage:Number(e.target.value)})} placeholder="Mileage at service" className="w-full bg-background border border-white/10 rounded-lg px-3 py-2" />
                    <textarea value={maintForm.notes} onChange={e=>setMaintForm({...maintForm,notes:e.target.value})} placeholder="Notes (Optional)" className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 h-24" />
                    <button type="submit" disabled={maintPending} className="w-full py-3 bg-primary text-white rounded-xl font-bold">{maintPending ? "Saving..." : "Save Record"}</button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {maintenance?.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground glass-panel rounded-2xl">No maintenance records found.</div>
            ) : (
              <div className="relative pl-6 border-l-2 border-white/10 space-y-8 ml-4">
                {maintenance?.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(record => (
                  <div key={record.id} className="relative group">
                    <div className="absolute -left-[35px] top-1 w-4 h-4 rounded-full bg-primary ring-4 ring-background" />
                    <div className="glass-panel p-5 rounded-xl border border-white/5 hover:border-primary/30 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold text-lg">{record.title}</h4>
                          <span className="text-xs font-mono text-muted-foreground">{format(new Date(record.date), 'MMMM d, yyyy')} • {record.mileage.toLocaleString()} mi</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-bold font-mono text-primary">${Number(record.cost).toFixed(2)}</span>
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
          </TabsContent>

          <TabsContent value="modifications" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-bold font-display">Modifications</h3>
              <Dialog open={isModOpen} onOpenChange={setIsModOpen}>
                <DialogTrigger asChild>
                  <button className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-white/10 text-sm font-medium rounded-lg transition-colors border border-white/5">
                    <Plus className="w-4 h-4" /> Add Mod
                  </button>
                </DialogTrigger>
                <DialogContent className="bg-card border-white/10 text-foreground">
                  <DialogHeader><DialogTitle>Add Modification</DialogTitle></DialogHeader>
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
                <div className="col-span-full text-center py-12 text-muted-foreground glass-panel rounded-2xl">No modifications added yet. Keep it stock?</div>
              ) : modifications?.map(mod => (
                <div key={mod.id} className="glass-panel p-5 rounded-2xl border border-white/5 relative group">
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
          </TabsContent>

          <TabsContent value="details">
            <div className="glass-panel rounded-2xl p-6 sm:p-10 space-y-8">
              <h3 className="text-2xl font-bold font-display border-b border-white/5 pb-4">Specifications</h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                <div><dt className="text-sm text-muted-foreground mb-1">Brand</dt><dd className="font-medium text-lg">{bike.brand}</dd></div>
                <div><dt className="text-sm text-muted-foreground mb-1">Model</dt><dd className="font-medium text-lg">{bike.model}</dd></div>
                <div><dt className="text-sm text-muted-foreground mb-1">Year</dt><dd className="font-medium text-lg">{bike.year}</dd></div>
                <div><dt className="text-sm text-muted-foreground mb-1">Engine Size</dt><dd className="font-medium text-lg">{bike.engineSize}cc</dd></div>
                <div><dt className="text-sm text-muted-foreground mb-1">Current Mileage</dt><dd className="font-medium text-lg">{bike.mileage.toLocaleString()} mi</dd></div>
                {bike.initialMileage !== null && <div><dt className="text-sm text-muted-foreground mb-1">Initial Mileage (from registration)</dt><dd className="font-medium text-lg">{bike.initialMileage?.toLocaleString()} mi</dd></div>}
                <div><dt className="text-sm text-muted-foreground mb-1">Added to Garage</dt><dd className="font-medium text-lg">{bike.createdAt ? format(new Date(bike.createdAt), 'MMMM yyyy') : 'Unknown'}</dd></div>
              </dl>

              {bike.nftContractAddress && (
                <div className="mt-8 p-6 bg-secondary/50 rounded-xl border border-primary/20">
                  <h4 className="flex items-center gap-2 font-bold text-primary mb-2"><ShieldAlert className="w-5 h-5"/> Digital Ownership Verified</h4>
                  <p className="text-sm text-muted-foreground font-mono break-all">Contract: {bike.nftContractAddress}</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
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
                    <DialogHeader><DialogTitle>Log Historical Service</DialogTitle></DialogHeader>
                    <form onSubmit={handleAddHistorical} className="space-y-4">
                      <input required value={historicalForm.title} onChange={e=>setHistoricalForm({...historicalForm,title:e.target.value})} placeholder="Service Title (e.g. Oil Change)" className="w-full bg-background border border-white/10 rounded-lg px-3 py-2" />
                      <div className="grid grid-cols-2 gap-4">
                        <DatePicker value={historicalForm.date} onChange={val => setHistoricalForm({...historicalForm, date: val})} placeholder="Select service date" />
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
                  <DialogHeader><DialogTitle>Upload Vehicle Registration</DialogTitle></DialogHeader>
                  <form onSubmit={handleUploadDocument} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Document URL or Path</label>
                      <input required value={docForm.documentUrl} onChange={e=>setDocForm({...docForm,documentUrl:e.target.value})} placeholder="Document URL" className="w-full bg-background border border-white/10 rounded-lg px-3 py-2" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Registration Date</label>
                        <DatePicker value={docForm.registrationDate} onChange={val => setDocForm({...docForm, registrationDate: val})} placeholder="Select registration date" />
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
              <div className="glass-panel p-6 rounded-2xl border border-white/5">
                <h4 className="font-bold text-lg mb-4">Registration Document</h4>
                <dl className="space-y-3">
                  <div><dt className="text-sm text-muted-foreground">Registered Date</dt><dd className="font-medium">{bike.registrationDate ? format(new Date(bike.registrationDate), 'MMMM d, yyyy') : 'N/A'}</dd></div>
                  <div><dt className="text-sm text-muted-foreground">Initial Mileage</dt><dd className="font-medium">{bike.initialMileage?.toLocaleString()} mi</dd></div>
                  <div><dt className="text-sm text-muted-foreground">Document</dt><dd className="font-mono text-sm break-all text-primary hover:underline cursor-pointer">{bike.registrationDocumentUrl}</dd></div>
                </dl>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground glass-panel rounded-2xl">No registration document uploaded yet. Upload one to create initial maintenance history.</div>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
