import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Settings, Check, Upload, X, Volume2, Music } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { BRAND_THEMES, BRAND_COLORS, type BrandId } from "@/lib/themes";
import {
  setCustomLoginAudio, removeCustomLoginAudio,
  setCustomLoginAudioName, removeCustomLoginAudioName,
  getCustomLoginAudioName, hasCustomLoginAudio,
  playMotorcycleRevSound,
} from "@/lib/sound";

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
            Settings
          </DialogTitle>
        </DialogHeader>

        <div className="pt-4 space-y-8">
          {/* Brand Theme */}
          <div>
            <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">Brand Theme</h3>
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

          {/* Login Sound */}
          <div className="border-t border-white/5 pt-6">
            <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">Login Sound</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Plays when you sign in or register. Upload your own audio to replace the default engine rev.
            </p>

            {hasCustom ? (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
                <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Music className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{customAudioName || 'Custom audio'}</p>
                  <p className="text-xs text-muted-foreground">Custom audio active</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => playMotorcycleRevSound()}
                    className="p-2 rounded-lg bg-card hover:bg-white/5 text-muted-foreground hover:text-primary transition-colors"
                    title="Preview"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleRemoveAudio}
                    className="p-2 rounded-lg bg-card hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    title="Remove custom audio"
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
                  <p className="text-sm font-medium">Default — Engine Rev</p>
                  <p className="text-xs text-muted-foreground">Synthesized motorcycle sound</p>
                </div>
                <button
                  onClick={() => playMotorcycleRevSound()}
                  className="p-2 rounded-lg bg-card hover:bg-white/5 text-muted-foreground hover:text-primary transition-colors"
                  title="Preview default"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            )}

            <button
              onClick={() => audioFileRef.current?.click()}
              disabled={uploading}
              className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-white/20 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors text-sm disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              {uploading ? 'Processing...' : hasCustom ? 'Replace Audio' : 'Upload Audio File'}
            </button>
            <input
              ref={audioFileRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleAudioFile(f); }}
            />
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Supports MP3, WAV, OGG, AAC — keep files small (&lt;2MB)
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SettingsTrigger({ collapsed }: { collapsed?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        data-testid="button-settings"
        onClick={() => setOpen(true)}
        title="Settings"
        className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-xl font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
      >
        <Settings className="w-5 h-5 flex-shrink-0" />
        {!collapsed && <span>Settings</span>}
      </button>
      <SettingsModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
