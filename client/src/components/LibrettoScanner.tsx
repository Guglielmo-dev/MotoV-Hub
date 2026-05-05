import React, { useState, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileSearch, Loader2, UploadCloud, X, RefreshCw, Plus, Bike, CreditCard, Coins } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useScanAndSaveLibretto } from '@/hooks/use-scan-libretto';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useCreateStripeSession } from '@/hooks/use-stripe';
import { cn } from '@/lib/utils';

interface LibrettoScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  isLimitReached?: boolean;
}

type ScannerState = 'upload' | 'preview' | 'loading' | 'limit';

export function LibrettoScanner({ open, onOpenChange, onSuccess, isLimitReached }: LibrettoScannerProps) {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { data: user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [state, setState] = useState<ScannerState>(isLimitReached ? 'limit' : 'upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const scanMutation = useScanAndSaveLibretto();

  const scansUsed = user?.aiScansUsed || 0;
  const scansAvailable = user?.aiScansCount || 0;
  const creditsLeft = Math.max(0, scansAvailable - scansUsed);
  const hasCredits = creditsLeft > 0;

  const slots = user?.motorcycleSlots || 2;

  const handleReset = useCallback(() => {
    setState('upload');
    setSelectedFile(null);
    setPreviewUrl(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, []);

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      if (isLimitReached) {
        setState('limit');
      } else {
        handleReset();
      }
    }
  }, [open, isLimitReached, handleReset]);

  const handleFileSelect = (file: File) => {
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';

    if (!isImage && !isPdf) {
      toast({
        title: i18n.language === 'it' ? "Formato non valido" : "Invalid format",
        description: i18n.language === 'it' ? "Seleziona un'immagine o un PDF." : "Please select an image or PDF.",
        variant: "destructive"
      });
      return;
    }
    setSelectedFile(file);
    if (isImage) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
    setState('preview');
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleStartScan = () => {
    if (!selectedFile) return;
    setState('loading');
    scanMutation.mutate(selectedFile, {
      onSuccess: () => {
        onOpenChange(false);
        if (onSuccess) onSuccess();
        toast({
          title: i18n.language === 'it' ? "Moto aggiunta! 🏍" : "Motorcycle added! 🏍",
          description: i18n.language === 'it'
            ? "Apri la pagina dettagli per aggiungere foto e altri dati."
            : "Open details page to add photos and other data.",
          duration: 5000,
        });
      },
      onError: (err: any) => {
        const msg = err.message || "";
        if (msg.includes("non_vehicle_document")) {
          toast({
            title: i18n.language === 'it' ? "Documento non riconosciuto" : "Document not recognized",
            description: i18n.language === 'it'
              ? "Assicurati di fotografare il libretto di circolazione."
              : "Make sure you took a picture of the registration document.",
            variant: "destructive"
          });
        } else if (msg.includes('429') || msg.includes('occupato')) {
          toast({
            title: i18n.language === 'it' ? "Servizio occupato" : "Service busy",
            description: i18n.language === 'it'
              ? "Attendi qualche secondo e riprova."
              : "Please wait a few seconds and try again.",
            variant: "destructive",
            duration: 5000,
          });
        } else {
          toast({
            title: i18n.language === 'it' ? "Errore durante la scansione" : "Scan Error",
            description: msg ? msg : (i18n.language === 'it'
              ? "Riprova o usa Aggiungi Moto manualmente."
              : "Try again or use manual creation."),
            variant: "destructive"
          });
        }
        setState('upload'); // return to upload if it fails
      }
    });
  };

  const canClose = state !== 'loading';
  const buySession = useCreateStripeSession();

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!canClose) return; // Prevent closing while loading
        onOpenChange(val);
      }}
    >
      <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800 p-0 overflow-hidden [&>button]:hidden">

        {/* Custom Header with conditional close button */}
        <div className="flex items-center justify-between p-6 pb-2">
          <DialogTitle className="text-xl font-display font-black uppercase tracking-widest text-primary flex items-center md:gap-2 gap-1 mb-2">
            <FileSearch className="w-5 h-5" />
            {i18n.language === 'it' ? 'AGGIUNGI DA LIBRETTO' : 'ADD FROM DOCUMENT'}
          </DialogTitle>
          {canClose && (
            <button
              onClick={() => onOpenChange(false)}
              className="text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="px-6 mb-4 flex items-center justify-between bg-zinc-900/30 py-2 rounded-lg mx-6 border border-white/5">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-tighter text-zinc-400">
              {i18n.language === 'it' ? 'Crediti IA:' : 'AI Credits:'}
            </span>
          </div>
          <span className={cn("text-xs font-black font-mono", creditsLeft > 0 ? "text-primary" : "text-destructive")}>
            {creditsLeft} / {scansAvailable}
          </span>
        </div>

        <div className="p-6 pt-0">
          {state === 'limit' && (
            <div className="py-8 flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                <Bike className="w-10 h-10 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold uppercase tracking-tight text-white">{t('garage.limitReached')}</h3>
                <p className="text-sm text-muted-foreground max-w-[280px]">
                  {t('garage.limitReachedDesc', { count: slots })}
                </p>
              </div>
              <button
                onClick={() => buySession.mutate('motorcycle_slot')}
                disabled={buySession.isPending}
                className="w-full relative group overflow-hidden py-4 bg-gradient-to-r from-primary to-emerald-400 text-black rounded-xl font-black uppercase tracking-widest transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(var(--primary-rgb),0.5)] active:scale-[0.98] flex items-center justify-center gap-3"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                {buySession.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    <Plus className="w-5 h-5" />
                    {t('garage.buySlot')}
                  </>
                )}
              </button>
            </div>
          )}

          {state === 'upload' && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <div
                className={`
                  border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer
                  ${isDragging ? 'border-primary bg-primary/10' : 'border-primary/30 hover:border-primary/60 hover:bg-primary/5'}
                `}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center mb-4">
                  <UploadCloud className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-bold text-white mb-1">
                  {i18n.language === 'it' ? 'Carica la foto del libretto di circolazione' : 'Upload registration document photo'}
                </h3>
                <p className="text-sm text-zinc-400">
                  {i18n.language === 'it' ? 'Scegli foto oppure trascina qui' : 'Choose photo or drag and drop here'}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  capture="environment"
                  className="hidden"
                  disabled={!hasCredits}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                      e.target.value = ''; // allow picking the same file again
                    }
                  }}
                />
              </div>

              {!hasCredits && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-destructive/20 rounded-lg shrink-0">
                      <CreditCard className="w-5 h-5 text-destructive" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-destructive uppercase tracking-tight">
                        {i18n.language === 'it' ? 'Crediti Esauriti' : 'No Credits Left'}
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                        {i18n.language === 'it' 
                          ? 'Hai terminato la tua prova gratuita. Acquista un nuovo credito per aggiungere una moto istantaneamente.' 
                          : 'You have used your free scan. Buy a new credit to add a bike instantly.'}
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => buySession.mutate('ai_scan_credit')}
                    disabled={buySession.isPending}
                    className="w-full relative group overflow-hidden py-6 bg-gradient-to-r from-destructive to-orange-500 text-white font-black rounded-xl uppercase tracking-widest transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(239,68,68,0.4)] active:scale-[0.98]"
                  >
                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    {buySession.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Coins className="w-4 h-4 mr-2" />}
                    {i18n.language === 'it' ? 'Acquista 1 Credito — 1.00€' : 'Buy 1 Credit — 1.00€'}
                  </Button>
                  <div className="w-full text-center relative py-2">
                    <span className="bg-card px-2 text-[10px] text-muted-foreground uppercase absolute left-1/2 -translate-x-1/2 -top-1.5 z-10">OPPURE</span>
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-white/10" />
                  </div>
                  <Button 
                    onClick={() => buySession.mutate('pro_subscription')}
                    disabled={buySession.isPending}
                    className="w-full relative group overflow-hidden py-6 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-black rounded-xl uppercase tracking-widest transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] active:scale-[0.98] border border-white/10"
                  >
                    {buySession.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Coins className="w-4 h-4 mr-2" />}
                    PASSA A PRO (TUTTO ILLIMITATO)
                  </Button>
                </div>
              )}

              <div className="bg-zinc-900/50 rounded-lg p-4 space-y-2">
                <p className="text-sm text-zinc-300 flex items-start gap-2">
                  <span className="text-xl leading-none">📱</span>
                  <span>{i18n.language === 'it' ? 'Su mobile puoi fotografare direttamente il libretto' : 'On mobile you can directly snap a photo of the document'}</span>
                </p>
                <p className="text-sm text-zinc-400 flex items-start gap-2">
                  <span className="text-xl leading-none">⚠️</span>
                  <span>{i18n.language === 'it' ? 'La foto NON verrà salvata — usata solo per la lettura' : 'The photo will NOT be saved — used strictly for extraction'}</span>
                </p>
              </div>
            </div>
          )}

          {state === 'preview' && selectedFile && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="rounded-xl overflow-hidden bg-zinc-900 flex items-center justify-center relative p-2 border border-zinc-800 h-[220px]">
                {selectedFile.type === 'application/pdf' ? (
                  <div className="flex flex-col items-center justify-center text-zinc-400 gap-3">
                    <FileSearch className="w-16 h-16 opacity-50" />
                    <p className="font-medium text-sm max-w-[200px] truncate">{selectedFile.name}</p>
                    <span className="text-xs font-mono bg-zinc-800 px-2 py-1 rounded">PDF Document</span>
                  </div>
                ) : previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Document preview"
                    className="w-full max-h-[200px] object-contain rounded-md"
                  />
                ) : null}
                <button
                  onClick={handleReset}
                  className="absolute top-4 right-4 bg-black/60 hover:bg-black/90 text-white backdrop-blur-md rounded-full p-2 transition-colors border border-white/10"
                  title={i18n.language === 'it' ? 'Cambia foto/file' : 'Change file'}
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <Button
                  onClick={handleStartScan}
                  className="w-full py-6 text-lg font-bold bg-primary hover:bg-primary/90 text-black shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  🔍 {i18n.language === 'it' ? 'Aggiungi al Garage' : 'Add to Garage'}
                </Button>

                <p className="text-xs text-zinc-500 text-center leading-relaxed">
                  {i18n.language === 'it'
                    ? 'La moto verrà aggiunta senza foto. Potrai aggiungerla dopo dalla pagina dettagli.'
                    : 'The motorcycle will be added without a photo. You can add one later from the details page.'}
                </p>
              </div>
            </div>
          )}

          {state === 'loading' && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-6 animate-in zoom-in duration-500">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-zinc-800 rounded-full"></div>
                <Loader2 className="w-20 h-20 text-primary animate-spin absolute inset-0 top-0 left-0" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white tracking-tight">
                  {i18n.language === 'it' ? 'Lettura libretto in corso...' : 'Reading document...'}
                </h3>
                <p className="text-sm text-zinc-400">
                  {i18n.language === 'it' ? 'Sto estraendo i dati del veicolo' : 'Extracting vehicle data'}
                </p>
              </div>

              <div className="bg-primary/10 text-primary border border-primary/20 px-4 py-2 rounded-lg text-xs font-medium animate-pulse">
                {i18n.language === 'it' ? 'Attendi qualche secondo' : 'Please wait a few seconds'}
              </div>

              <p className="text-[10px] text-zinc-600 uppercase tracking-widest pt-4">
                {i18n.language === 'it' ? '[NON chiudere questa finestra]' : '[DO NOT close this window]'}
              </p>
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
}
