import { useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { useMotorcycle, useUpdateMotorcycle, useDeleteMotorcycle } from "@/hooks/use-motorcycles";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, ArrowLeft, Trash2, Wrench, PenTool, Settings, FileText } from "lucide-react";
import { ImageUploadField } from "@/components/ui/ImageUploadField";
import { useTranslation } from "react-i18next";

import { MaintenanceTab } from "./motorcycle/MaintenanceTab";
import { ModificationsTab } from "./motorcycle/ModificationsTab";
import { NFTSection } from "./motorcycle/NFTSection";
import { SpecsTab } from "./motorcycle/SpecsTab";
import { DocumentsTab } from "./motorcycle/DocumentsTab";

export function MotorcycleDetails() {
  const [, params] = useRoute("/garage/:id");
  const id = parseInt(params?.id || "0");
  const [, setLocation] = useLocation();

  const { data: bike, isLoading: bikeLoading } = useMotorcycle(id);
  const { mutate: updateBike } = useUpdateMotorcycle();
  const { mutate: deleteBike } = useDeleteMotorcycle();
  const { t } = useTranslation();

  const [isPhotoEditOpen, setIsPhotoEditOpen] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');

  if (bikeLoading) return <div className="animate-pulse h-96 bg-card rounded-3xl" />;
  if (!bike) return <div className="text-destructive font-bold text-center py-20">{t('motorcycleDetails.motorcycleNotFound')}</div>;

  const handleLinkNFT = (address: string) => {
    updateBike({ id, nftContractAddress: address, nftTokenId: "1" });
  };

  const handleDeleteBike = () => {
    if(confirm(t('motorcycleDetails.confirmScrap'))) {
      deleteBike(id, { onSuccess: () => setLocation('/garage') });
    }
  };

  return (
    <div className="space-y-8 fade-in pb-20">
      <Link href="/garage" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors text-sm font-medium">
        <ArrowLeft className="w-4 h-4 mr-2" /> {t('motorcycleDetails.backToGarage')}
      </Link>

      {/* Photo Edit Dialog */}
      <Dialog open={isPhotoEditOpen} onOpenChange={open => { if (!open) { setIsPhotoEditOpen(false); setNewPhotoUrl(''); } }}>
        <DialogContent className="bg-card border-white/10 text-foreground sm:max-w-[420px]">
          <DialogHeader className="pr-8">
            <DialogTitle className="text-xl font-display uppercase text-primary border-b border-white/10 pb-4">{t('motorcycleDetails.changeHeroPhoto')}</DialogTitle>
          </DialogHeader>
          <div className="pt-4 space-y-4">
            <ImageUploadField label={t('garage.newPhoto')} value={newPhotoUrl} onChange={setNewPhotoUrl} />
            <button
              onClick={() => {
                updateBike({ id, photos: newPhotoUrl }, {
                  onSuccess: () => { setIsPhotoEditOpen(false); setNewPhotoUrl(''); }
                });
              }}
              disabled={!newPhotoUrl}
              className="w-full py-3 bg-primary text-black rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-40"
            >
              {t('garage.savePhoto')}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="relative rounded-3xl overflow-hidden bg-card/80 backdrop-blur-md border border-white/10">
        <div className="h-64 sm:h-80 w-full relative group">
          {bike.photos ? (
            <img src={bike.photos} alt={bike.model} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-secondary flex items-center justify-center">
              <span className="text-muted-foreground font-display text-4xl uppercase opacity-20">{bike.brand}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          
          <button
            data-testid="button-edit-hero-photo"
            onClick={() => { setNewPhotoUrl(bike.photos || ''); setIsPhotoEditOpen(true); }}
            className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary hover:text-black text-sm font-medium"
          >
            <Camera className="w-4 h-4" />
            {bike.photos ? t('motorcycleDetails.changeHeroPhoto') : t('motorcycleDetails.addPhoto')}
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
                {bike.mileage?.toLocaleString()} {t('units.km')}
              </p>
            </div>
            
            <div className="flex gap-2">
              <NFTSection nftContractAddress={bike.nftContractAddress} onConnect={handleLinkNFT} />
              <button onClick={handleDeleteBike} className="p-3 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white rounded-xl transition-all">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="maintenance" className="w-full">
        <TabsList className="bg-card border border-white/5 w-full justify-start rounded-xl p-1 h-auto flex-wrap sm:flex-nowrap">
          <TabsTrigger value="maintenance" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg py-3 px-6 min-h-[44px]">
            <Wrench className="w-4 h-4 mr-2" /> {t('motorcycleDetails.maintenance')}
          </TabsTrigger>
          <TabsTrigger value="modifications" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg py-3 px-6 min-h-[44px]">
            <PenTool className="w-4 h-4 mr-2" /> {t('motorcycleDetails.modifications')}
          </TabsTrigger>
          <TabsTrigger value="details" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg py-3 px-6 min-h-[44px]">
            <Settings className="w-4 h-4 mr-2" /> {t('motorcycleDetails.details')}
          </TabsTrigger>
          <TabsTrigger value="documents" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg py-3 px-6 min-h-[44px]">
            <FileText className="w-4 h-4 mr-2" /> {t('motorcycleDetails.documents')}
          </TabsTrigger>
        </TabsList>

        <div className="mt-8">
          <TabsContent value="maintenance">
            <MaintenanceTab id={id} />
          </TabsContent>

          <TabsContent value="modifications">
            <ModificationsTab id={id} />
          </TabsContent>

          <TabsContent value="details">
            <SpecsTab bike={bike} />
          </TabsContent>

          <TabsContent value="documents">
            <DocumentsTab id={id} bike={bike} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

export default MotorcycleDetails;
