import { lazy } from "react";

/**
 * Registry of dynamic imports for prefetching.
 * We store the import functions so they can be called manually.
 */
export const routeImports = {
  Login: () => import("@/pages/Login").then(m => ({ default: m.Login })),
  Register: () => import("@/pages/Register").then(m => ({ default: m.Register })),
  Dashboard: () => import("@/pages/Dashboard").then(m => ({ default: m.Dashboard })),
  Garage: () => import("@/pages/Garage").then(m => ({ default: m.Garage })),
  MotorcycleDetails: () => import("@/pages/MotorcycleDetails").then(m => ({ default: m.MotorcycleDetails })),
  Community: () => import("@/pages/Community").then(m => ({ default: m.Community })),
  TravelDiary: () => import("@/pages/TravelDiary").then(m => ({ default: m.TravelDiary })),
  Games: () => import("@/pages/Games").then(m => ({ default: m.Games })),
};

export type PageName = keyof typeof routeImports;

const prefetched = new Set<PageName>();

/**
 * Triggers the dynamic import for a page.
 * Browser will start downloading the chunk and cache it.
 */
export function prefetchPage(name: PageName) {
  if (prefetched.has(name)) return;
  prefetched.add(name);
  
  // Call the import function
  routeImports[name]().catch(() => {
    // Silently fail prefetch if net error, 
    // real attempt will happen on click
    prefetched.delete(name);
  });
}

/**
 * Utility to create a lazy component from our registry
 */
export function createLazyComponent(name: PageName) {
  return lazy(routeImports[name]);
}
