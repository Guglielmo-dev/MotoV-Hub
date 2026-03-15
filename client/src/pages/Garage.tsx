import { useState, useRef } from "react";
import { useMotorcycles, useCreateMotorcycle } from "@/hooks/use-motorcycles";
import { Link } from "wouter";
import { Plus, Bike, Calendar, Settings2, FileText, Upload, X, ImageIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";

async function uploadImageFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);
  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
    credentials: "include",
  });
  if (!res.ok) throw new Error("Image upload failed");
  const data = await res.json();
  return data.url;
}

function ImageUploadField({ label, value, onChange }: { label: string; value: string; onChange: (url: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string>(value);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setUploading(true);
    try {
      const url = await uploadImageFile(file);
      onChange(url);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) handleFile(file);
  };

  const clear = () => {
    setPreview("");
    onChange("");
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        className="relative w-full border border-dashed border-white/20 rounded-lg overflow-hidden bg-background hover:border-primary/50 transition-colors cursor-pointer"
        style={{ minHeight: preview ? 140 : 90 }}
        onClick={() => !preview && fileRef.current?.click()}
      >
        {preview ? (
          <>
            <img src={preview} alt="preview" className="w-full h-36 object-cover" />
            {uploading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <button
              type="button"
              onClick={e => { e.stopPropagation(); clear(); }}
              className="absolute top-2 right-2 p-1 rounded-full bg-black/70 text-white hover:bg-black transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-24 gap-2 text-muted-foreground pointer-events-none">
            <Upload className="w-6 h-6 text-primary" />
            <p className="text-xs">Click or drag & drop an image</p>
          </div>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
    </div>
  );
}

export function Garage() {
  const { data: motorcycles, isLoading } = useMotorcycles();
  const { mutate: createBike, isPending } = useCreateMotorcycle();
  const [isOpen, setIsOpen] = useState(false);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);

  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    engineSize: '',
    mileage: 0,
    description: '',
    photos: ''
  });

  const [regData, setRegData] = useState({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    engineSize: '',
    initialMileage: 0,
    registrationDate: '',
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
        setFormData({ brand: '', model: '', year: new Date().getFullYear(), engineSize: '', mileage: 0, description: '', photos: '' });
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
        setRegData({ brand: '', model: '', year: new Date().getFullYear(), engineSize: '', initialMileage: 0, registrationDate: '', documentUrl: '', description: '', photos: '' });
      }
    });
  };

  const inputCls = "w-full bg-background border border-white/10 rounded-lg px-3 py-2 focus:border-primary outline-none text-sm";

  return (
    <div className="space-y-8 fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display">My Garage</h1>
          <p className="text-muted-foreground mt-1">Manage your Kawasaki collection.</p>
        </div>

        <div className="flex gap-2">
          {/* Add Motorcycle Dialog */}
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <button data-testid="button-add-motorcycle" className="flex items-center gap-2 px-5 py-2.5 bg-primary text-black font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:-translate-y-0.5">
                <Plus className="w-5 h-5" />
                Add Motorcycle
              </button>
            </DialogTrigger>
            <DialogContent className="bg-card border-white/10 text-foreground sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-display uppercase text-primary border-b border-white/10 pb-4">New Motorcycle</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Brand</label>
                    <input data-testid="input-brand" required value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className={inputCls} placeholder="e.g. Kawasaki" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Model</label>
                    <input data-testid="input-model" required value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} className={inputCls} placeholder="e.g. Ninja ZX-10R" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Year</label>
                    <input data-testid="input-year" type="number" required value={formData.year} onChange={e => setFormData({...formData, year: parseInt(e.target.value)})} className={inputCls} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Engine (cc)</label>
                    <input data-testid="input-engine" value={formData.engineSize} onChange={e => setFormData({...formData, engineSize: e.target.value})} className={inputCls} placeholder="998" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Mileage</label>
                    <input data-testid="input-mileage" type="number" required value={formData.mileage} onChange={e => setFormData({...formData, mileage: parseInt(e.target.value)})} className={inputCls} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <textarea data-testid="input-description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className={`${inputCls} h-20 resize-none`} placeholder="e.g. Track-tuned beast, pristine condition" />
                </div>

                <ImageUploadField
                  label="Photo"
                  value={formData.photos}
                  onChange={url => setFormData({...formData, photos: url})}
                />

                <button data-testid="button-submit-motorcycle" type="submit" disabled={isPending} className="w-full py-3 bg-primary text-black rounded-xl font-bold mt-4 hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {isPending ? "Saving..." : "Save to Garage"}
                </button>
              </form>
            </DialogContent>
          </Dialog>

          {/* From Registration Dialog */}
          <Dialog open={isRegistrationOpen} onOpenChange={setIsRegistrationOpen}>
            <DialogTrigger asChild>
              <button data-testid="button-from-registration" className="flex items-center gap-2 px-5 py-2.5 bg-secondary text-foreground font-semibold rounded-xl hover:bg-white/10 transition-all border border-white/5">
                <FileText className="w-5 h-5" />
                From Registration
              </button>
            </DialogTrigger>
            <DialogContent className="bg-card border-white/10 text-foreground sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-display uppercase text-primary border-b border-white/10 pb-4">Add from Registration Document</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleRegistrationSubmit} className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Brand</label>
                    <input required value={regData.brand} onChange={e => setRegData({...regData, brand: e.target.value})} className={inputCls} placeholder="e.g. Kawasaki" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Model</label>
                    <input required value={regData.model} onChange={e => setRegData({...regData, model: e.target.value})} className={inputCls} placeholder="e.g. Z900" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Year</label>
                    <input type="number" required value={regData.year} onChange={e => setRegData({...regData, year: parseInt(e.target.value)})} className={inputCls} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Engine (cc)</label>
                    <input value={regData.engineSize} onChange={e => setRegData({...regData, engineSize: e.target.value})} className={inputCls} placeholder="948" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Init. Mileage</label>
                    <input type="number" required value={regData.initialMileage} onChange={e => setRegData({...regData, initialMileage: parseInt(e.target.value)})} className={inputCls} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Registration Date</label>
                  <input type="date" required value={regData.registrationDate} onChange={e => setRegData({...regData, registrationDate: e.target.value})} className={inputCls} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Document URL (Optional)</label>
                  <input value={regData.documentUrl} onChange={e => setRegData({...regData, documentUrl: e.target.value})} className={inputCls} placeholder="https://..." />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <textarea value={regData.description} onChange={e => setRegData({...regData, description: e.target.value})} className={`${inputCls} h-20 resize-none`} placeholder="e.g. Stock, well maintained" />
                </div>

                <ImageUploadField
                  label="Photo"
                  value={regData.photos}
                  onChange={url => setRegData({...regData, photos: url})}
                />

                <button type="submit" disabled={isPending} className="w-full py-3 bg-primary text-black rounded-xl font-bold mt-4 hover:bg-primary/90 transition-colors disabled:opacity-50">
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
          <p className="text-muted-foreground max-w-sm mx-auto">No bikes yet. Add your first Kawasaki above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {motorcycles?.map((bike) => (
            <Link key={bike.id} href={`/garage/${bike.id}`}>
              <div data-testid={`card-motorcycle-${bike.id}`} className="group glass-panel rounded-2xl overflow-hidden cursor-pointer hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 flex flex-col h-full">
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
