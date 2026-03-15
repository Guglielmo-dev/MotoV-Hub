import { createContext, useContext, useEffect, useState } from "react";
import { type BrandId, type BrandTheme, applyTheme, getThemeById } from "@/lib/themes";

interface ThemeContextType {
  brandId: BrandId;
  setBrand: (id: BrandId) => void;
  theme: BrandTheme;
}

const ThemeContext = createContext<ThemeContextType>({
  brandId: 'kawasaki',
  setBrand: () => {},
  theme: getThemeById('kawasaki'),
});

const STORAGE_KEY = 'motovault-brand-theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [brandId, setBrandId] = useState<BrandId>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return (saved as BrandId) || 'kawasaki';
  });

  const theme = getThemeById(brandId);

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, brandId);
  }, [brandId, theme]);

  const setBrand = (id: BrandId) => setBrandId(id);

  return (
    <ThemeContext.Provider value={{ brandId, setBrand, theme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
