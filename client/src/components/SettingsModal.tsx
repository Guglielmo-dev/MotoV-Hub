import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { 
  Settings, Check, Upload, X, Volume2, Music, VolumeX, Plus, 
  Trash2, Palette, Loader2, Globe, BellRing 
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { BRAND_THEMES, BRAND_COLORS, type BrandId } from "@/lib/themes";
import {
  setCustomLoginAudio, removeCustomLoginAudio,
  setCustomLoginAudioName, removeCustomLoginAudioName,
  getCustomLoginAudioName, hasCustomLoginAudio,
  playMotorcycleRevSound, isAudioEnabled, setAudioEnabled,
} from "@/lib/sound";
import { useTranslation } from "react-i18next";
import { useCustomThemes, useCreateCustomTheme, useDeleteCustomTheme } from "@/hooks/use-custom-themes";
import { useUpdatePreferences } from "@/hooks/use-preferences";
import { ColorPicker } from "@/components/ui/ColorPicker";
import { Button } from "@/components/ui/button";
import { useAuth, useDeleteAccount } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle } from "lucide-react";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const { brandId, setBrand, customColor, setCustomColor } = useTheme();
  const { data: user } = useAuth();
  const updatePrefs = useUpdatePreferences();
  const audioFileRef = useRef<HTMLInputElement>(null);
  const { t, i18n } = useTranslation();
  const { toast } = useToast();

  // Audio State (Synced with localStorage and optionally user profile)
  const [customAudioName, setCustomAudioName] = useState<string | null>(getCustomLoginAudioName);
  const [hasCustom, setHasCustom] = useState(hasCustomLoginAudio);
  const [uploading, setUploading] = useState(false);
  const [audioOn, setAudioOn] = useState(isAudioEnabled);
  const [isBrandPickerOpen, setIsBrandPickerOpen] = useState(false);

  // Custom Themes State
  const { data: customThemes } = useCustomThemes();
  const createTheme = useCreateCustomTheme();
  const deleteTheme = useDeleteCustomTheme();
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [newThemeName, setNewThemeName] = useState("");
  const [newThemeColor, setNewThemeColor] = useState("#FFD700");
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const deleteAccount = useDeleteAccount();

  const isCustomActive = brandId === 'custom';
  const currentBrand = BRAND_THEMES.find(b => b.id === brandId);
  
  // Resolve primary color for the UI
  const displayColor = isCustomActive ? (customColor || '#FFFFFF') : (BRAND_COLORS[brandId as keyof typeof BRAND_COLORS] || BRAND_COLORS['kawasaki']);

  const handleApplyBrand = (id: BrandId) => {
    setBrand(id);
    updatePrefs.mutate({ activeBrandId: id, activeCustomColor: null });
    setIsBrandPickerOpen(false);
  };

  const handleApplyCustom = (color: string) => {
    setCustomColor(color);
    updatePrefs.mutate({ activeCustomColor: color, activeBrandId: null });
  };

  const handleToggleAudio = (enabled: boolean) => {
    setAudioEnabled(enabled);
    setAudioOn(enabled);
    updatePrefs.mutate({ audioEnabled: enabled });
  };

  const handleAudioFile = async (file: File) => {
    if (!file.type.startsWith('audio/')) return;
    
    // Limit size to 2MB as defined in the backend
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: t('common.error'),
        description: "Il file audio è troppo grande (max 2MB)",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file); // Backend expects "image" field name even for audio

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Upload failed");
      }

      const { url } = await res.json();
      
      // Update local sound engine
      setCustomLoginAudio(url);
      setCustomLoginAudioName(file.name);
      
      // Update UI state
      setCustomAudioName(file.name);
      setHasCustom(true);
      
      // Save URL to server preferences
      await updatePrefs.mutateAsync({ 
        customAudioData: url, 
        customAudioName: file.name 
      });

      toast({
        title: "Successo",
        description: "Audio salvato sul server",
      });
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAudio = () => {
    removeCustomLoginAudio();
    removeCustomLoginAudioName();
    setHasCustom(false);
    setCustomAudioName(null);
    updatePrefs.mutate({ 
      customAudioData: null, 
      customAudioName: null 
    });
  };

  const handleCreateTheme = async () => {
    if (!newThemeName.trim()) return;
    await createTheme.mutateAsync({
      brandName: newThemeName.toUpperCase(),
      primaryColor: newThemeColor,
    });
    setNewThemeName("");
  };

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="bg-[#0A0A0A] border-white/10 text-foreground sm:max-w-[480px] p-0 overflow-hidden border-t-2 border-t-primary/60 rounded-t-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-white/5">
          <div className="space-y-1">
            <DialogTitle className="text-2xl font-display uppercase flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary animate-[spin-slow_8s_linear_infinite]" />
              <span className="text-gradient tracking-tight">{t('settings.title')}</span>
            </DialogTitle>
            <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest opacity-60">
              {t('settings.subtitle')}
            </p>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto scrollbar-hide">
          <div className="p-6 py-4 space-y-6">
            
            {/* 1. SEZIONE TEMA (DINAMICA) */}
            <div className="space-y-3">
               <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground opacity-50 flex items-center">
                <Palette className="w-3 h-3 mr-2 text-primary" />
                {t('settings.brandTheme')}
              </label>
              
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/3 border border-white/5 group hover:border-primary/30 transition-all">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center border-2 shadow-[0_0_15px_rgba(var(--primary),0.1)] transition-colors duration-500"
                    style={{ backgroundColor: `${displayColor}11`, borderColor: displayColor }}
                  >
                    <div className="w-3 h-3 rounded-full shadow-[0_0_8px_white]" style={{ backgroundColor: displayColor }} />
                  </div>
                  <div>
                    <p className="text-xs font-mono text-muted-foreground uppercase">{t('settings.active')}</p>
                    <p className="font-display font-bold text-sm uppercase tracking-wider">
                      {isCustomActive ? t('settings.brandCustom') : (currentBrand?.name || 'Kawasaki')}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline" size="sm" 
                  onClick={() => setIsBrandPickerOpen(true)}
                  className="bg-primary/5 border-primary/20 text-primary hover:bg-primary hover:text-black font-bold text-[10px] uppercase rounded-lg h-8 px-4"
                >
                  {t('settings.change')}
                </Button>
              </div>
            </div>

            {/* 2. I MIEI TEMI */}
            <Accordion type="single" collapsible className="w-full space-y-2 border-none">
              <AccordionItem value="custom-themes" className="border-none">
                <AccordionTrigger className="flex p-3 rounded-2xl bg-white/3 border border-white/5 hover:bg-white/5 transition-all hover:no-underline">
                  <div className="flex items-center gap-3 text-left">
                    <Plus className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-sm font-bold uppercase tracking-tight">{t('settings.myThemes')}</p>
                      <p className="text-[10px] text-muted-foreground font-mono uppercase opacity-60">
                        {customThemes?.length || 0} temi salvati
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-3 pb-1 px-1 space-y-3">
                   <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                         <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-mono text-muted-foreground">{t('settings.brandName')}</label>
                            <input 
                              value={newThemeName}
                              onChange={(e) => setNewThemeName(e.target.value.toUpperCase())}
                              className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-primary/50 font-bold"
                              placeholder="EAB"
                            />
                         </div>
                         <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-mono text-muted-foreground">{t('settings.primaryColor')}</label>
                            <Popover open={showColorPicker} onOpenChange={setShowColorPicker}>
                              <PopoverTrigger asChild>
                                <button className="w-full h-[34px] rounded-lg border border-white/10 flex items-center justify-between px-2 group">
                                   <div className="w-4 h-4 rounded shadow-lg" style={{ backgroundColor: newThemeColor }} />
                                   <span className="text-[10px] font-mono opacity-60 group-hover:text-primary transition-colors">{newThemeColor}</span>
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="p-0 border-none bg-transparent shadow-none w-auto" side="bottom" align="start" sideOffset={8}>
                                <ColorPicker 
                                  color={newThemeColor}
                                  onChange={setNewThemeColor}
                                  onChangeComplete={handleApplyCustom}
                                />
                              </PopoverContent>
                            </Popover>
                         </div>
                      </div>
                      <Button 
                        disabled={!newThemeName || createTheme.isPending}
                        onClick={handleCreateTheme}
                        className="w-full bg-primary text-black font-bold h-9 text-xs uppercase"
                      >
                         {createTheme.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                         {t('settings.saveTheme')}
                      </Button>
                   </div>

                   <div className="max-h-[160px] overflow-y-auto space-y-2 pr-1 scrollbar-hide">
                      {customThemes?.map(theme => {
                        const isActive = isCustomActive && customColor === theme.primaryColor;
                        return (
                          <div key={theme.id} className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${isActive ? 'bg-primary/5 border-primary/30' : 'bg-white/3 border-white/5 group hover:bg-white/5'}`}>
                             <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full shadow-[0_0_8px_white]" style={{ backgroundColor: theme.primaryColor }} />
                                <span className={`text-[11px] font-bold uppercase tracking-wider ${isActive ? 'text-primary' : ''}`}>{theme.brandName}</span>
                                {isActive && <span className="text-[8px] font-mono text-primary animate-pulse ml-2">ACTIVE</span>}
                             </div>
                             <div className={`flex items-center gap-1 transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                <Button 
                                  variant="ghost" size="icon" 
                                  onClick={() => handleApplyCustom(theme.primaryColor)}
                                  className="w-7 h-7 hover:text-primary"
                                >
                                  <Palette className="w-3.5 h-3.5" />
                                </Button>
                                <Button 
                                  variant="ghost" size="icon" 
                                  onClick={() => { if(confirm(t('settings.deleteThemeConfirm'))) deleteTheme.mutate(theme.id) }}
                                  className="w-7 h-7 hover:text-destructive"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                             </div>
                          </div>
                        );
                      })}
                   </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* 3. LINGUA */}
            <div className="space-y-3">
               <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground opacity-50 flex items-center">
                <Globe className="w-3 h-3 mr-2" />
                {t('settings.language')}
              </label>
              <div className="flex p-1 rounded-2xl bg-white/3 border border-white/5">
                {[
                  { id: 'it', label: t('settings.it'), flag: '🇮🇹' },
                  { id: 'en', label: t('settings.en'), flag: '🇬🇧' }
                ].map((lang) => {
                  const active = i18n.language === lang.id;
                  return (
                    <button 
                      key={lang.id}
                      onClick={() => i18n.changeLanguage(lang.id)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all font-display text-[11px] uppercase tracking-widest font-bold
                        ${active ? 'bg-primary text-black shadow-[0_0_15px_rgba(var(--primary),0.2)]' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      <span>{lang.flag}</span>
                      {lang.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. SUONO LOGIN */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg transition-colors ${audioOn ? 'bg-primary/20 text-primary' : 'bg-white/5 text-muted-foreground'}`}>
                    {audioOn ? <BellRing className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold uppercase">{t('settings.loginSound')}</h4>
                    <p className="text-[10px] text-muted-foreground font-mono uppercase opacity-60">
                      {audioOn ? t('settings.active') : t('common.close')}
                    </p>
                  </div>
                </div>
                <Switch 
                  checked={audioOn} 
                  onCheckedChange={handleToggleAudio}
                  className="data-[state=checked]:bg-primary"
                />
              </div>

              {audioOn && (
                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-4 animate-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center justify-between gap-4">
                     <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center flex-shrink-0 border border-white/5">
                           <Music className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                           <p className="text-xs font-bold truncate uppercase">{hasCustom ? (customAudioName || t('settings.customAudioNameFallback')) : t('settings.defaultSound')}</p>
                           <p className="text-[9px] font-mono text-muted-foreground uppercase opacity-70">
                              {hasCustom ? t('settings.customAudioActive') : t('settings.synthesized')}
                           </p>
                        </div>
                     </div>
                     <div className="flex gap-2">
                        <Button 
                          variant="ghost" size="icon" 
                          onClick={() => playMotorcycleRevSound(user?.customAudioData)} 
                          className="h-9 w-9 border border-white/5 rounded-lg hover:bg-primary/20 hover:text-primary"
                        >
                          <Volume2 className="w-4 h-4" />
                        </Button>
                        {hasCustom && (
                          <Button 
                            variant="ghost" size="icon" 
                            onClick={handleRemoveAudio}
                            className="h-9 w-9 border border-white/5 rounded-lg hover:bg-destructive/20 hover:text-destructive"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                     </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full border-dashed border-primary/40 hover:border-primary text-[10px] font-bold uppercase tracking-wider"
                    onClick={() => audioFileRef.current?.click()}
                    disabled={uploading}
                  >
                     {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-3.5 h-3.5 mr-2" />}
                     {hasCustom ? t('settings.replaceAudio') : t('settings.uploadAudio')}
                  </Button>
                  <input ref={audioFileRef} type="file" accept="audio/*" className="hidden" onChange={e => {const f=e.target.files?.[0]; if(f) handleAudioFile(f);}} />
                </div>
              )}
            </div>

            {/* 5. DANGER ZONE */}
            <div className="pt-8 mt-4 border-t border-white/5 space-y-4">
               <label className="text-[10px] font-mono uppercase tracking-widest text-destructive/70 flex items-center">
                <AlertCircle className="w-3 h-3 mr-2" />
                {t('settings.dangerZone')}
              </label>
              <div className="p-4 rounded-2xl bg-destructive/5 border border-destructive/20 space-y-3">
                <p className="text-[11px] text-muted-foreground/80 leading-relaxed">
                  {t('settings.deleteAccountDesc')}
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  className="w-full border-destructive/30 text-destructive hover:bg-destructive hover:text-white text-[10px] font-bold uppercase tracking-widest h-10"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-2" />
                  {t('settings.deleteAccount')}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 border-t border-white/5 bg-black/40">
           <Button 
             onClick={onClose}
             className="w-full bg-primary text-black font-display font-bold uppercase tracking-widest hover:shadow-[0_0_20px_rgba(var(--primary),0.3)] transition-all h-12 rounded-2xl"
           >
             {t('settings.done')}
           </Button>
        </DialogFooter>
      </DialogContent>

      <Dialog open={isBrandPickerOpen} onOpenChange={setIsBrandPickerOpen}>
        <DialogContent className="bg-[#0D0D0D] border-white/10 text-foreground sm:max-w-[420px] p-6 rounded-3xl">
          <DialogHeader>
             <DialogTitle className="text-xl font-display uppercase text-gradient">{t('settings.chooseBrand')}</DialogTitle>
             <p className="text-xs text-muted-foreground font-mono">{t('settings.brandTheme')}</p>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {BRAND_THEMES.map((theme) => {
              const isSelected = !isCustomActive && theme.id === brandId;
              const color = BRAND_COLORS[theme.id as keyof typeof BRAND_COLORS];
              return (
                <button
                  key={theme.id}
                  onClick={() => handleApplyBrand(theme.id)}
                  className={`flex items-center flex-col gap-3 p-4 rounded-2xl border-2 transition-all duration-300 relative group
                    ${isSelected 
                      ? 'bg-primary/5 border-primary shadow-[0_0_15px_rgba(var(--primary),0.2)]' 
                      : 'bg-white/3 border-white/5 hover:border-white/20 hover:scale-[1.02]'}`}
                >
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{ backgroundColor: `${color}22`, border: `2px solid ${color}` }}
                  >
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
                  </div>
                  <span className="font-bold text-[10px] uppercase tracking-widest">{theme.name}</span>
                  {isSelected && <Check className="absolute top-2 right-2 w-4 h-4 text-primary" />}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Account Deletion Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="bg-[#0A0A0A] border-destructive/30 text-foreground sm:max-w-[400px] p-0 overflow-hidden rounded-3xl shadow-[0_0_50px_rgba(220,38,38,0.15)]">
          <div className="p-8 text-center space-y-6">
            <div className="flex justify-center flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center border-2 border-destructive/20 animate-pulse transition-all">
                <span className="text-5xl leading-none select-none">😢</span>
              </div>
              <h2 className="text-xl font-display uppercase tracking-tight text-destructive">
                {t('settings.deleteAccountSadFace')}
              </h2>
            </div>
            
            <p className="text-sm font-medium text-muted-foreground/80 leading-relaxed px-4">
              {t('settings.deleteAccountConfirm')}
            </p>

            <div className="flex flex-col gap-3 pt-4">
              <Button 
                onClick={() => deleteAccount.mutate()}
                disabled={deleteAccount.isPending}
                className="w-full bg-destructive text-white font-bold h-12 rounded-2xl hover:bg-destructive/90 transition-all uppercase tracking-widest text-[11px] shadow-lg shadow-destructive/20"
              >
                {deleteAccount.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : t('settings.deleteAccountCTA')}
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="w-full text-muted-foreground hover:text-foreground font-bold text-[10px] uppercase tracking-widest"
              >
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

export function SettingsTrigger({ collapsed }: { collapsed?: boolean }) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-xl font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
      >
        <Settings className="w-5 h-5 flex-shrink-0" />
        {!collapsed && <span className="text-xs uppercase font-bold tracking-tight">{t('nav.settings')}</span>}
      </button>
      <SettingsModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
