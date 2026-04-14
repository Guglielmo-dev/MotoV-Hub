export type BrandId = 'kawasaki' | 'ducati' | 'bmw' | 'honda' | 'yamaha' | 'harley';

export interface BrandTheme {
  id: BrandId;
  name: string;
  primary: string;
  ring: string;
  chart1: string;
  chart2: string;
  shadowRgb: string;
  textGradientTo: string;
}

export const BRAND_THEMES: BrandTheme[] = [
  {
    id: 'kawasaki',
    name: 'Kawasaki',
    primary: '142 100% 35%',
    ring: '142 100% 35%',
    chart1: '142 100% 35%',
    chart2: '142 70% 22%',
    shadowRgb: '0, 180, 64',
    textGradientTo: 'emerald-400',
  },
  {
    id: 'ducati',
    name: 'Ducati',
    primary: '0 100% 40%',
    ring: '0 100% 40%',
    chart1: '0 100% 40%',
    chart2: '0 70% 25%',
    shadowRgb: '200, 0, 0',
    textGradientTo: 'orange-500',
  },
  {
    id: 'bmw',
    name: 'BMW',
    primary: '207 96% 38%',
    ring: '207 96% 38%',
    chart1: '207 96% 38%',
    chart2: '207 70% 22%',
    shadowRgb: '0, 100, 200',
    textGradientTo: 'sky-400',
  },
  {
    id: 'honda',
    name: 'Honda',
    primary: '350 100% 43%',
    ring: '350 100% 43%',
    chart1: '350 100% 43%',
    chart2: '350 70% 28%',
    shadowRgb: '210, 10, 30',
    textGradientTo: 'red-400',
  },
  {
    id: 'yamaha',
    name: 'Yamaha',
    primary: '222 100% 50%',
    ring: '222 100% 50%',
    chart1: '222 100% 50%',
    chart2: '222 80% 32%',
    shadowRgb: '30, 80, 240',
    textGradientTo: 'blue-400',
  },
  {
    id: 'harley',
    name: 'Harley-Davidson',
    primary: '24 100% 50%',
    ring: '24 100% 50%',
    chart1: '24 100% 50%',
    chart2: '24 70% 32%',
    shadowRgb: '255, 102, 0',
    textGradientTo: 'amber-400',
  },
];

export function applyTheme(theme: BrandTheme) {
  const root = document.documentElement;
  root.style.setProperty('--primary', theme.primary);
  root.style.setProperty('--accent', theme.primary);
  root.style.setProperty('--ring', theme.ring);
  root.style.setProperty('--chart-1', theme.chart1);
  root.style.setProperty('--chart-2', theme.chart2);
  root.style.setProperty('--primary-shadow-rgb', theme.shadowRgb);
}

export function getThemeById(id: string): BrandTheme {
  return BRAND_THEMES.find(t => t.id === id) || BRAND_THEMES[0];
}

export function hexToHsl(hex: string): string {
  // converte #FFD700 in "48 100% 50%"
  const r = parseInt(hex.slice(1,3),16)/255;
  const g = parseInt(hex.slice(3,5),16)/255;
  const b = parseInt(hex.slice(5,7),16)/255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h=0, s=0, l=(max+min)/2;
  if(max !== min){
    const d = max-min;
    s = l > 0.5 ? d/(2-max-min) : d/(max+min);
    switch(max){
      case r: h=((g-b)/d+(g<b?6:0))/6; break;
      case g: h=((b-r)/d+2)/6; break;
      case b: h=((r-g)/d+4)/6; break;
    }
  }
  return `${Math.round(h*360)} ${Math.round(s*100)}% ${Math.round(l*100)}%`;
}

export function applyCustomTheme(primaryHex: string) {
  const hsl = hexToHsl(primaryHex);
  const root = document.documentElement;
  root.style.setProperty('--primary', hsl);
  root.style.setProperty('--accent', hsl);
  root.style.setProperty('--ring', hsl);
  root.style.setProperty('--chart-1', hsl);
}

export const BRAND_COLORS: Record<BrandId, string> = {
  kawasaki: '#00B140',
  ducati: '#CC0000',
  bmw: '#0166B1',
  honda: '#D00A1E',
  yamaha: '#1E50F0',
  harley: '#FF6600',
};
