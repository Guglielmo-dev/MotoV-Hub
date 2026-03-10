import { useState } from "react";
import { useMotorcycles, useCreateMotorcycle } from "@/hooks/use-motorcycles";
import { Link } from "wouter";
import { Plus, Bike, Calendar, Settings2, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function Garage() {
  const { data: motorcycles, isLoading } = useMotorcycles();
  const { mutate: createBike, isPending } = useCreateMotorcycle();
  const [isOpen, setIsOpen] = useState(false);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    engineSize: '',
    mileage: 0,
    description: '',
    photos: ''
  });

  // Registration extraction form
  const [regData, setRegData] = useState({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    engineSize: '',
    mileage: 0,
    registrationDate: '',
    initialMileage: 0,
    documentUrl: '',
    description: '',
    photos: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createBike({
      ...formData,
      year: Number(formData.year),
      mileage: Number(formData.mileage)
    }, {
      onSuccess: () => {
        setIsOpen(false);
        setFormData({ brand: '', model: '', year: 2024, engineSize: '', mileage: 0, description: '', photos: '' });
      }
    });
  };

  const handleRegistrationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createBike({
      brand: regData.brand,
      model: regData.model,
      year: Number(regData.year),
      engineSize: regData.engineSize,
      mileage: Number(regData.initialMileage),
      description: regData.description,
      photos: regData.photos,
      registrationDocumentUrl: regData.documentUrl,
      registrationDate: regData.registrationDate,
      initialMileage: Number(regData.initialMileage),
    }, {
      onSuccess: () => {
        setIsRegistrationOpen(false);
        setRegData({ brand: '', model: '', year: new Date().getFullYear(), engineSize: '', mileage: 0, registrationDate: '', initialMileage: 0, documentUrl: '', description: '', photos: '' });
      }
    });
  };

  return (
    <div className="space-y-8 fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display">My Garage</h1>
          <p className="text-muted-foreground mt-1">Manage your collection of motorcycles.</p>
        </div>

        <div className="flex gap-2">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:-translate-y-0.5">
                <Plus className="w-5 h-5" />
                Add Motorcycle
              </button>
            </DialogTrigger>
            <DialogContent className="bg-card border-white/10 text-foreground sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-display uppercase text-primary border-b border-white/10 pb-4">New Motorcycle</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Brand</label>
                    <input required value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 focus:border-primary outline-none" placeholder="e.g. Ducati" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Model</label>
                    <input required value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 focus:border-primary outline-none" placeholder="e.g. Panigale V4" />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Year</label>
                    <input type="number" required value={formData.year} onChange={e => setFormData({...formData, year: parseInt(e.target.value)})} className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 focus:border-primary outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Engine (cc)</label>
                    <input value={formData.engineSize} onChange={e => setFormData({...formData, engineSize: e.target.value})} className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 focus:border-primary outline-none" placeholder="1103" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Mileage</label>
                    <input type="number" required value={formData.mileage} onChange={e => setFormData({...formData, mileage: parseInt(e.target.value)})} className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 focus:border-primary outline-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 focus:border-primary outline-none h-20" placeholder="e.g. Italian classic, excellent condition" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Photo URL (Optional)</label>
                  <input value={formData.photos} onChange={e => setFormData({...formData, photos: e.target.value})} className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 focus:border-primary outline-none" placeholder="https://..." />
                </div>

                <button type="submit" disabled={isPending} className="w-full py-3 bg-primary text-white rounded-xl font-bold mt-4 hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {isPending ? "Adding..." : "Save to Garage"}
                </button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isRegistrationOpen} onOpenChange={setIsRegistrationOpen}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-2 px-5 py-2.5 bg-secondary text-foreground font-semibold rounded-xl hover:bg-white/10 transition-all border border-white/5">
                <FileText className="w-5 h-5" />
                From Registration
              </button>
            </DialogTrigger>
            <DialogContent className="bg-card border-white/10 text-foreground sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-display uppercase text-primary border-b border-white/10 pb-4">Add from Registration Document</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleRegistrationSubmit} className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Brand</label>
                    <input required value={regData.brand} onChange={e => setRegData({...regData, brand: e.target.value})} className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 focus:border-primary outline-none" placeholder="e.g. Ducati" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Model</label>
                    <input required value={regData.model} onChange={e => setRegData({...regData, model: e.target.value})} className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 focus:border-primary outline-none" placeholder="e.g. Panigale V4" />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Year</label>
                    <input type="number" required value={regData.year} onChange={e => setRegData({...regData, year: parseInt(e.target.value)})} className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 focus:border-primary outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Engine (cc)</label>
                    <input value={regData.engineSize} onChange={e => setRegData({...regData, engineSize: e.target.value})} className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 focus:border-primary outline-none" placeholder="1103" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Initial Mileage</label>
                    <input type="number" required value={regData.initialMileage} onChange={e => setRegData({...regData, initialMileage: parseInt(e.target.value)})} className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 focus:border-primary outline-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Registration Date</label>
                  <input type="date" required value={regData.registrationDate} onChange={e => setRegData({...regData, registrationDate: e.target.value})} className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 focus:border-primary outline-none" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Document URL</label>
                  <input value={regData.documentUrl} onChange={e => setRegData({...regData, documentUrl: e.target.value})} className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 focus:border-primary outline-none" placeholder="https://..." />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <textarea value={regData.description} onChange={e => setRegData({...regData, description: e.target.value})} className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 focus:border-primary outline-none h-20" placeholder="e.g. Italian classic, excellent condition" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Photo URL</label>
                  <input value={regData.photos} onChange={e => setRegData({...regData, photos: e.target.value})} className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 focus:border-primary outline-none" placeholder="https://..." />
                </div>

                <button type="submit" disabled={isPending} className="w-full py-3 bg-primary text-white rounded-xl font-bold mt-4 hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {isPending ? "Adding..." : "Create Motorcycle"}
                </button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1,2,3].map(i => <div key={i} className="h-64 bg-card rounded-2xl"></div>)}
        </div>
      ) : motorcycles?.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-2xl border border-white/5 border-dashed">
          <Bike className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-bold mb-2">Empty Garage</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">You haven't added any motorcycles yet. Click the button above to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {motorcycles?.map((bike) => (
            <Link key={bike.id} href={`/garage/${bike.id}`}>
              <div className="group glass-panel rounded-2xl overflow-hidden cursor-pointer hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 flex flex-col h-full">
                <div className="h-48 relative overflow-hidden bg-secondary">
                  {bike.photos ? (
                    <img src={bike.photos} alt={`${bike.brand} ${bike.model}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center opacity-20">
                      <Bike className="w-20 h-20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent opacity-80" />
                  <h3 className="absolute bottom-4 left-4 text-2xl font-bold font-display uppercase tracking-wider">{bike.brand}</h3>
                </div>
                
                <div className="p-5 flex-1 flex flex-col justify-between bg-card group-hover:bg-card/80 transition-colors">
                  <div>
                    <h4 className="text-lg font-semibold text-foreground/90">{bike.model}</h4>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{bike.description || "No description provided."}</p>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-6 pt-4 border-t border-white/5 text-sm text-muted-foreground font-mono">
                    <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-primary" />{bike.year}</div>
                    <div className="flex items-center gap-1.5"><Settings2 className="w-4 h-4 text-primary" />{bike.engineSize || 'N/A'}cc</div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
