import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Settings, Check, Upload, X, Volume2, Music, VolumeX } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { BRAND_THEMES, BRAND_COLORS, type BrandId } from "@/lib/themes";
import {
  setCustomLoginAudio, removeCustomLoginAudio,
  setCustomLoginAudioName, removeCustomLoginAudioName,
  getCustomLoginAudioName, hasCustomLoginAudio,
  playMotorcycleRevSound, isAudioEnabled, setAudioEnabled,
} from "@/lib/sound";
import { useTranslation } from "react-i18next";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const { brandId, setBrand } = useTheme();
  const audioFileRef = useRef<HTMLInputElement>(null);
  const [customAudioName, setCustomAudioName] = useState<string | null>(getCustomLoginAudioName);
  const [hasCustom, setHasCustom] = useState(hasCustomLoginAudio);
  const [uploading, setUploading] = useState(false);
  const [audioOn, setAudioOn] = useState(isAudioEnabled);
  const { t, i18n } = useTranslation();

  const handleToggleAudio = (enabled: boolean) => {
    setAudioEnabled(enabled);
    setAudioOn(enabled);
  };

  const handleAudioFile = (file: File) => {
    if (!file.type.startsWith('audio/')) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setCustomLoginAudio(dataUrl);
      setCustomLoginAudioName(file.name);
      setCustomAudioName(file.name);
      setHasCustom(true);
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAudio = () => {
    removeCustomLoginAudio();
    removeCustomLoginAudioName();
    setCustomAudioName(null);
    setHasCustom(false);
    if (audioFileRef.current) audioFileRef.current.value = '';
  };

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="bg-card border-white/10 text-foreground sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display uppercase text-primary border-b border-white/10 pb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            {t('settings.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="pt-4 space-y-8">
          {/* Brand Theme */}
          <div>
            <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">{t('settings.brandTheme')}</h3>
            <div className="grid grid-cols-2 gap-3">
              {BRAND_THEMES.map((t) => {
                const isSelected = t.id === brandId;
                const color = BRAND_COLORS[t.id as BrandId];
                return (
                  <button
                    key={t.id}
                    data-testid={`button-theme-${t.id}`}
                    onClick={() => setBrand(t.id as BrandId)}
                    className={`relative flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 text-left
                      ${isSelected
                        ? 'border-primary/50 bg-primary/5'
                        : 'border-white/8 bg-background hover:border-white/20 hover:bg-white/3'}`}
                    style={isSelected ? { boxShadow: `0 0 20px ${color}22` } : {}}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center"
                      style={{ backgroundColor: `${color}22`, border: `2px solid ${color}` }}
                    >
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: color, boxShadow: isSelected ? `0 0 8px ${color}` : 'none' }}
                      />
                    </div>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="font-bold text-sm font-display uppercase tracking-wide truncate">{t.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Language Selection */}
          <div className="border-t border-white/5 pt-6">
            <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">{t('settings.language')}</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'it', label: t('settings.it'), flag: '🇮🇹', units: '€ · km' },
                { id: 'en', label: t('settings.en'), flag: '🇬🇧', units: '$ · mi' }
              ].map((lang) => {
                const isSelected = i18n.language === lang.id;
                return (
                  <button
                    key={lang.id}
                    onClick={() => i18n.changeLanguage(lang.id)}
                    className={`relative flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 text-left
                      ${isSelected
                        ? 'border-primary/50 bg-primary/5'
                        : 'border-white/8 bg-background hover:border-white/20 hover:bg-white/3'}`}
                  >
                    <div className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center bg-white/5 text-xl">
                      {lang.flag}
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm font-display uppercase tracking-wide truncate">{lang.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">{lang.units}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Login Sound */}
          <div className="border-t border-white/5 pt-6">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">{t('settings.loginSound')}</h3>
              <div className="flex items-center gap-2.5">
                {audioOn
                  ? <Volume2 className="w-3.5 h-3.5 text-primary" />
                  : <VolumeX className="w-3.5 h-3.5 text-muted-foreground" />
                }
                <Switch
                  checked={audioOn}
                  onCheckedChange={handleToggleAudio}
                  data-testid="switch-audio-enabled"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              {t('settings.loginSoundDesc')}
            </p>

            <div className={`space-y-3 transition-opacity duration-200 ${!audioOn ? 'opacity-40 pointer-events-none' : ''}`}>
              {hasCustom ? (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
                  <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Music className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{customAudioName || t('settings.customAudioNameFallback')}</p>
                    <p className="text-xs text-muted-foreground">{t('settings.customAudioActive')}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => playMotorcycleRevSound()}
                      className="p-2 rounded-lg bg-card hover:bg-white/5 text-muted-foreground hover:text-primary transition-colors"
                      title={t('settings.preview')}
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleRemoveAudio}
                      className="p-2 rounded-lg bg-card hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      title={t('settings.removeAudio')}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-background border border-white/10">
                  <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                    <Volume2 className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{t('settings.defaultSound')}</p>
                    <p className="text-xs text-muted-foreground">{t('settings.synthesized')}</p>
                  </div>
                  <button
                    onClick={() => playMotorcycleRevSound()}
                    className="p-2 rounded-lg bg-card hover:bg-white/5 text-muted-foreground hover:text-primary transition-colors"
                    title={t('settings.preview')}
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              <button
                onClick={() => audioFileRef.current?.click()}
                disabled={uploading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-white/20 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors text-sm disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                {uploading ? t('settings.processing') : hasCustom ? t('settings.replaceAudio') : t('settings.uploadAudio')}
              </button>
              <input
                ref={audioFileRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleAudioFile(f); }}
              />
              <p className="text-xs text-muted-foreground text-center">
                {t('settings.audioHelp')}
              </p>
            </div>

            {!audioOn && (
              <p className="text-xs text-muted-foreground text-center mt-3 italic">
                {t('settings.soundDisabled')}
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SettingsTrigger({ collapsed }: { collapsed?: boolean }) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  return (
    <>
      <button
        data-testid="button-settings"
        onClick={() => setOpen(true)}
        title={t('nav.settings')}
        className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-xl font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
      >
        <Settings className="w-5 h-5 flex-shrink-0" />
        {!collapsed && <span>{t('nav.settings')}</span>}
      </button>
      <SettingsModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
