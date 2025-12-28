/**
 * Theme Types
 * Type definitions for the theme system using next-themes
 */

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export interface ThemeState {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  systemTheme: ResolvedTheme;
}

export interface ThemeActions {
  setTheme: (theme: Theme) => void;
  updateSystemTheme: (systemTheme: ResolvedTheme) => void;
  toggleTheme: () => void;
}

export type ThemeStore = ThemeState & ThemeActions;
