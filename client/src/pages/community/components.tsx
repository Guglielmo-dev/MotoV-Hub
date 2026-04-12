import { CATEGORIES, CATEGORY_COLORS } from "./types";

export function timeAgo(date: string | Date | null): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / 2592000)}mo ago`;
}

export function Avatar({ name, size = 'sm' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'w-10 h-10 text-base' : size === 'md' ? 'w-8 h-8 text-sm' : 'w-7 h-7 text-xs';
  return (
    <div className={`${sizeClass} rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center font-bold text-primary flex-shrink-0`}>
      {name[0]?.toUpperCase()}
    </div>
  );
}

export function CategoryBadge({ category }: { category: string }) {
  const cat = CATEGORIES.find(c => c.id === category) || CATEGORIES[CATEGORIES.length - 1];
  const color = CATEGORY_COLORS[category] || CATEGORY_COLORS.general;
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${color}`}>
      {cat.emoji} {cat.label}
    </span>
  );
}
