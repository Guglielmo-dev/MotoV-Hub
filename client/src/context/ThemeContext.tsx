import { createContext, useContext, useEffect, useState } from "react";
import { type BrandId, type BrandTheme, applyTheme, getThemeById, applyCustomTheme, BRAND_COLORS } from "@/lib/themes";
import { useAuth } from "@/hooks/use-auth";

interface ThemeContextType {
  brandId: BrandId;
  setBrand: (id: BrandId) => void;
  theme: BrandTheme;
  customColor: string | null;
  setCustomColor: (color: string | null) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  brandId: 'kawasaki',
  setBrand: () => {},
  theme: getThemeById('kawasaki'),
  customColor: null,
  setCustomColor: () => {},
});

const STORAGE_KEY_BRAND = 'motovault-brand-theme';
const STORAGE_KEY_CUSTOM = 'motovault-custom-theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: user } = useAuth();
  
  const [brandId, setBrandId] = useState<BrandId>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_BRAND);
    return (saved as BrandId) || 'kawasaki';
  });

  const [customColor, setCustomColorState] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY_CUSTOM);
  });

  // Sync with user profile on login
  useEffect(() => {
    if (user) {
      if (user.activeCustomColor) {
        setBrandId('custom');
        setCustomColorState(user.activeCustomColor);
        localStorage.setItem(STORAGE_KEY_CUSTOM, user.activeCustomColor);
        localStorage.removeItem(STORAGE_KEY_BRAND);
      } else if (user.activeBrandId) {
        setBrandId(user.activeBrandId as BrandId);
        setCustomColorState(null);
        localStorage.setItem(STORAGE_KEY_BRAND, user.activeBrandId);
        localStorage.removeItem(STORAGE_KEY_CUSTOM);
      }
    }
  }, [user]);

  const theme = getThemeById(brandId);

  useEffect(() => {
    if (brandId === 'custom' && customColor) {
      applyCustomTheme(customColor);
      localStorage.setItem(STORAGE_KEY_CUSTOM, customColor);
      localStorage.removeItem(STORAGE_KEY_BRAND);
    } else {
      applyTheme(theme);
      localStorage.setItem(STORAGE_KEY_BRAND, brandId);
      localStorage.removeItem(STORAGE_KEY_CUSTOM);
      setCustomColorState(null);
    }
  }, [brandId, customColor, theme]);

  const setBrand = (id: BrandId) => {
    setBrandId(id);
    if (id !== 'custom') {
      setCustomColorState(null);
      localStorage.removeItem(STORAGE_KEY_CUSTOM);
    }
  };

  const setCustomColor = (color: string | null) => {
    if (color) {
      setCustomColorState(color);
      setBrandId('custom');
    } else {
      setCustomColorState(null);
      setBrandId('kawasaki'); // Default back to a brand
    }
  };

  return (
    <ThemeContext.Provider value={{ brandId, setBrand, theme, customColor, setCustomColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
