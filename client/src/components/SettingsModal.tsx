import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Settings, Check } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { BRAND_THEMES, BRAND_COLORS, type BrandId } from "@/lib/themes";

const BRAND_DESCRIPTIONS: Record<BrandId, string> = {
  kawasaki: "Lime green & black — pure aggression",
  ducati: "Italian racing red — passion on asphalt",
  bmw: "Motorrad blue — precision engineering",
  honda: "Fireblade red — born to win",
  yamaha: "Deep blue & white — total control",
  harley: "Freedom orange — ride or die",
};

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const { brandId, setBrand } = useTheme();

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="bg-card border-white/10 text-foreground sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display uppercase text-primary border-b border-white/10 pb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Settings
          </DialogTitle>
        </DialogHeader>

        <div className="pt-4 space-y-6">
          <div>
            <h3 className="text-sm font-mono uppercase tracking-widest text-muted-foreground mb-4">Brand Theme</h3>
            <div className="grid grid-cols-2 gap-3">
              {BRAND_THEMES.map((t) => {
                const isSelected = t.id === brandId;
                const color = BRAND_COLORS[t.id as BrandId];
                return (
                  <button
                    key={t.id}
                    data-testid={`button-theme-${t.id}`}
                    onClick={() => setBrand(t.id as BrandId)}
                    className={`relative flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 text-left
                      ${isSelected
                        ? 'border-primary/50 bg-primary/5'
                        : 'border-white/8 bg-background hover:border-white/20 hover:bg-white/3'}`}
                    style={isSelected ? { boxShadow: `0 0 20px ${color}22` } : {}}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center"
                      style={{ backgroundColor: `${color}22`, border: `2px solid ${color}` }}
                    >
                      <div
                        className="w-5 h-5 rounded-full"
                        style={{ backgroundColor: color, boxShadow: isSelected ? `0 0 8px ${color}` : 'none' }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm font-display uppercase tracking-wide">{t.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                        {BRAND_DESCRIPTIONS[t.id as BrandId]}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-white/5">
            <p className="text-xs text-muted-foreground font-mono text-center">
              More customization options coming soon.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SettingsTrigger() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        data-testid="button-settings"
        onClick={() => setOpen(true)}
        className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-xl font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
      >
        <Settings className="w-5 h-5" />
        Settings
      </button>
      <SettingsModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
