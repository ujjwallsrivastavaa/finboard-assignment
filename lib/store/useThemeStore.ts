/**
 * Theme Store with localStorage Persistence
 * Manages light/dark/system theme with automatic system preference detection
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Theme, ResolvedTheme, ThemeStore } from "@/lib/types/theme";

/**
 * Resolve the actual theme based on current theme and system preference
 */
const resolveTheme = (theme: Theme, systemTheme: ResolvedTheme): ResolvedTheme => {
  if (theme === "system") {
    return systemTheme;
  }
  return theme;
};

/**
 * Get system theme preference
 */
const getSystemTheme = (): ResolvedTheme => {
  if (typeof window === "undefined") return "light";
  
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  return mediaQuery.matches ? "dark" : "light";
};

/**
 * Apply theme to document
 */
const applyTheme = (resolvedTheme: ResolvedTheme) => {
  if (typeof window === "undefined") return;
  
  const root = window.document.documentElement;
  
  if (resolvedTheme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
};

/**
 * Theme store with persistence and system preference sync
 */
export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      // Initial state
      theme: "system",
      systemTheme: "light",
      resolvedTheme: "light",

      // Set theme preference
      setTheme: (theme: Theme) => {
        const { systemTheme } = get();
        const resolvedTheme = resolveTheme(theme, systemTheme);
        
        set({ theme, resolvedTheme });
        applyTheme(resolvedTheme);
      },

      // Update system theme (called when system preference changes)
      updateSystemTheme: (systemTheme: ResolvedTheme) => {
        const { theme } = get();
        const resolvedTheme = resolveTheme(theme, systemTheme);
        
        set({ systemTheme, resolvedTheme });
        applyTheme(resolvedTheme);
      },

      // Toggle between light and dark (skips system)
      toggleTheme: () => {
        const { resolvedTheme } = get();
        const newTheme: Theme = resolvedTheme === "dark" ? "light" : "dark";
        
        set({ theme: newTheme, resolvedTheme: newTheme });
        applyTheme(newTheme);
      },
    }),
    {
      name: "finboard-theme-storage",
      storage: createJSONStorage(() => localStorage),
      // Only persist the theme preference, not resolved/system theme
      partialize: (state) => ({ theme: state.theme }),
      // After hydration, recalculate resolved theme
      onRehydrateStorage: () => (state) => {
        if (state) {
          const systemTheme = getSystemTheme();
          const resolvedTheme = resolveTheme(state.theme, systemTheme);
          
          state.systemTheme = systemTheme;
          state.resolvedTheme = resolvedTheme;
          applyTheme(resolvedTheme);
        }
      },
    }
  )
);

/**
 * Initialize theme system
 * Call this once on app mount (client-side only)
 */
export const initializeTheme = () => {
  if (typeof window === "undefined") return;

  const store = useThemeStore.getState();
  const systemTheme = getSystemTheme();
  
  // Update system theme in store
  store.updateSystemTheme(systemTheme);

  // Listen for system theme changes
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handleChange = (e: MediaQueryListEvent) => {
    const newSystemTheme: ResolvedTheme = e.matches ? "dark" : "light";
    store.updateSystemTheme(newSystemTheme);
  };

  mediaQuery.addEventListener("change", handleChange);

  // Return cleanup function
  return () => {
    mediaQuery.removeEventListener("change", handleChange);
  };
};
