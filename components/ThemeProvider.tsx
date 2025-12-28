"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * ThemeProvider Component
 * Wrapper around next-themes provider with app-specific configuration
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
    >
      {children}
    </NextThemesProvider>
  );
}
