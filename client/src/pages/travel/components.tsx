import { Navigation } from "lucide-react";
import { LOCATION_GRADIENTS } from "./types";

export function gradientFor(id: number) {
  return LOCATION_GRADIENTS[id % LOCATION_GRADIENTS.length];
}

export function formatDate(date: string) {
  try {
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return date;
  }
}

export function UpcomingBadge() {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/20 border border-green-500/40 text-green-400 text-xs font-semibold">
      <Navigation className="w-3 h-3" /> UPCOMING TRIP
    </div>
  );
}

export function PlannedBadge() {
  return (
    <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-semibold">
      <Navigation className="w-3 h-3" /> Planned
    </div>
  );
}
