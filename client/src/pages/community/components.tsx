import { CATEGORIES, CATEGORY_COLORS } from "./types";
import { Lightbulb, MapPin, Wrench, Calendar, Trophy, MessageCircle, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

export function timeAgo(date: string | Date | null, t: any): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return t('common.justNow');
  if (diff < 3600) return `${Math.floor(diff / 60)}m ${t('common.ago')}`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ${t('common.ago')}`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ${t('common.ago')}`;
  return `${Math.floor(diff / 2592000)}mo ${t('common.ago')}`;
}

export function Avatar({ name, size = 'sm' }: { name?: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'w-10 h-10 text-base' : size === 'md' ? 'w-8 h-8 text-sm' : 'w-7 h-7 text-xs';
  const initial = name ? name[0]?.toUpperCase() : '?';
  
  return (
    <div className={`${sizeClass} rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center font-bold text-primary flex-shrink-0`}>
      {initial}
    </div>
  );
}

export function CategoryBadge({ category }: { category: string }) {
  const { t } = useTranslation();
  const cat = CATEGORIES.find(c => c.id === category) || CATEGORIES[CATEGORIES.length - 1];
  const color = CATEGORY_COLORS[category] || CATEGORY_COLORS.general;

  const IconMap: Record<string, LucideIcon> = {
    advice: Lightbulb,
    rides: MapPin,
    gear: Wrench,
    meetup: Calendar,
    showoff: Trophy,
    general: MessageCircle,
  };

  const Icon = IconMap[category] || MessageCircle;

  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full border font-bold ${color}`}>
      <Icon className="w-3 h-3" />
      {t(`community.categories.${cat.id}`)}
    </span>
  );
}
