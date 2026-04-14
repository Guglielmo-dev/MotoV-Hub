import { HexColorPicker, HexColorInput } from "react-colorful";
import { useCallback, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";

interface ColorPickerProps {
  color: string;
  onChange: (hex: string) => void;
  onChangeComplete?: (hex: string) => void;
}

const PRESETS = [
  { name: "Triumph Gold", hex: "#FFD700" },
  { name: "MV Agusta Red", hex: "#C0392B" },
  { name: "Aprilia Red", hex: "#E74C3C" },
  { name: "Gilera Orange", hex: "#E67E22" },
  { name: "KTM Orange", hex: "#FF6600" },
  { name: "Suzuki Blue", hex: "#1E88E5" },
  { name: "Norton Grey", hex: "#2C3E50" },
  { name: "RE Brown", hex: "#8B4513" },
];

export function ColorPicker({ color, onChange, onChangeComplete }: ColorPickerProps) {
  const [localColor, setLocalColor] = useState(color);
  const { t } = useTranslation();

  // Debounced callback for live preview (80ms)
  const debouncedOnChange = useDebouncedCallback((value: string) => {
    onChange(value);
  }, 80);

  const handlePickerChange = (newColor: string) => {
    setLocalColor(newColor);
    debouncedOnChange(newColor);
  };

  const handleComplete = () => {
    if (onChangeComplete) {
      onChangeComplete(localColor);
    }
  };

  return (
    <div 
      className="p-3 bg-card/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl w-[240px] animate-in zoom-in-95 duration-200"
      onMouseUp={handleComplete}
      onTouchEnd={handleComplete}
    >
      <div className="space-y-4">
        {/* Custom CSS Overrides for react-colorful */}
        <style>{`
          .react-colorful { width: 100%; height: 160px; }
          .react-colorful__saturation { border-radius: 8px 8px 0 0; border-bottom: none; }
          .react-colorful__hue { 
            height: 14px; 
            border-radius: 10px;
            margin-top: 12px;
          }
          .react-colorful__pointer {
            width: 18px;
            height: 18px;
            border: 2px solid white;
            box-shadow: 0 0 10px rgba(0,0,0,0.5);
          }
        `}</style>

        <HexColorPicker color={localColor} onChange={handlePickerChange} />

        <div className="flex items-center gap-3 pt-1">
          <div 
            className="w-10 h-10 rounded-lg border border-white/20 shadow-inner flex-shrink-0"
            style={{ backgroundColor: localColor }}
          />
          <div className="relative flex-1">
            <HexColorInput
              color={localColor}
              onChange={handlePickerChange}
              onBlur={handleComplete}
              className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-xs font-mono uppercase outline-none focus:border-primary/60 transition-colors"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-mono pointer-events-none">
              {t('settings.hex', { defaultValue: 'HEX' })}
            </span>
          </div>
        </div>

        <div className="pt-2 border-t border-white/5">
          <p className="text-[10px] uppercase font-mono text-muted-foreground mb-3 tracking-tighter">{t('settings.brandColors')}</p>
          <div className="grid grid-cols-4 gap-2">
            <TooltipProvider>
              {PRESETS.map((preset) => (
                <Tooltip key={preset.hex}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => {
                        handlePickerChange(preset.hex);
                        if (onChangeComplete) onChangeComplete(preset.hex);
                      }}
                      className={`w-full aspect-square rounded-full border-2 transition-all hover:scale-110 active:scale-95
                        ${localColor.toUpperCase() === preset.hex.toUpperCase() 
                          ? 'border-white/80 scale-110 shadow-[0_0_10px_rgba(255,255,255,0.2)]' 
                          : 'border-white/10 hover:border-white/40'}`}
                      style={{ backgroundColor: preset.hex }}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-[10px] font-bold uppercase">
                    {preset.name}
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
          </div>
        </div>
      </div>
    </div>
  );
}
