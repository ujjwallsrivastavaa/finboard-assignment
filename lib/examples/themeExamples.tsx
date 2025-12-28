/**
 * Theme System - Usage Examples
 * 
 * This file demonstrates various ways to use the theme system
 * with next-themes across your application components.
 */

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

// ============================================================================
// Example 1: Basic Theme Access (with hydration check)
// ============================================================================

export function Example1_BasicThemeAccess() {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="p-4">Loading...</div>;
  }
  
  return (
    <div className="p-4">
      <p>Current Theme: {theme}</p>
      <p>Resolved Theme: {resolvedTheme}</p>
      <p className="text-muted-foreground">
        Using semantic color classes
      </p>
    </div>
  );
}

// ============================================================================
// Example 2: Theme Toggle Button
// ============================================================================

export function Example2_CustomThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <button className="px-4 py-2 rounded-lg" disabled>Loading...</button>;
  }
  
  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
    >
      Switch to {theme === "dark" ? "Light" : "Dark"} Mode
    </button>
  );
}

// ============================================================================
// Example 3: Theme-Aware Component with Conditional Rendering
// ============================================================================

export function Example3_ThemeAwareCard() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="p-6 rounded-lg border animate-pulse">Loading...</div>;
  }
  
  return (
    <div className="p-6 rounded-lg bg-card border border-border">
      <h3 className="text-xl font-bold text-card-foreground mb-2">
        Theme-Aware Card
      </h3>
      <p className="text-muted-foreground">
        Currently showing {resolvedTheme} mode content
      </p>
      {resolvedTheme === "dark" ? (
        <div className="mt-4 p-3 bg-slate-800 rounded">
          🌙 Special dark mode content
        </div>
      ) : (
        <div className="mt-4 p-3 bg-slate-100 rounded">
          ☀️ Special light mode content
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Example 4: Using Tailwind's dark: Prefix
// ============================================================================

export function Example4_TailwindDarkMode() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 transition-colors">
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
          Dashboard
        </h1>
        <p className="text-slate-600 dark:text-slate-300">
          This text automatically adapts to the theme
        </p>
        
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-blue-900 dark:text-blue-100">
              Blue themed box
            </p>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-green-900 dark:text-green-100">
              Green themed box
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Example 5: Theme-Aware Charts/Data Visualization
// ============================================================================

export function Example5_ThemeAwareChart() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="p-6 rounded-lg border animate-pulse">Loading chart...</div>;
  }
  
  // Define colors based on theme
  const chartConfig = {
    backgroundColor: resolvedTheme === "dark" ? "#1e293b" : "#ffffff",
    textColor: resolvedTheme === "dark" ? "#e2e8f0" : "#1e293b",
    gridColor: resolvedTheme === "dark" ? "#334155" : "#e2e8f0",
    seriesColors: resolvedTheme === "dark" 
      ? ["#60a5fa", "#34d399", "#fbbf24", "#f472b6"]
      : ["#3b82f6", "#10b981", "#f59e0b", "#ec4899"]
  };
  
  return (
    <div 
      className="p-6 rounded-lg border"
      style={{ 
        backgroundColor: chartConfig.backgroundColor,
        borderColor: chartConfig.gridColor 
      }}
    >
      <h3 style={{ color: chartConfig.textColor }}>
        Chart with Theme Colors
      </h3>
      {/* Your chart component here using chartConfig */}
    </div>
  );
}

// ============================================================================
// Example 6: Programmatic Theme Changes
// ============================================================================

export function Example6_ProgrammaticTheme() {
  const { setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="flex gap-2 p-4">Loading...</div>;
  }
  
  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    console.log(`Theme changed to: ${newTheme}`);
  };
  
  return (
    <div className="flex gap-2 p-4">
      <button
        onClick={() => handleThemeChange("light")}
        className="px-4 py-2 rounded bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100 hover:opacity-80"
      >
        Light
      </button>
      <button
        onClick={() => handleThemeChange("dark")}
        className="px-4 py-2 rounded bg-slate-800 text-white hover:opacity-80"
      >
        Dark
      </button>
      <button
        onClick={() => handleThemeChange("system")}
        className="px-4 py-2 rounded bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 hover:opacity-80"
      >
        System
      </button>
    </div>
  );
}

// ============================================================================
// Example 7: Theme-Aware Widget Container
// ============================================================================

export function Example7_WidgetContainer({ 
  children, 
  title 
}: { 
  children: React.ReactNode;
  title: string;
}) {
  return (
    <div className="rounded-xl overflow-hidden border border-border bg-card shadow-lg hover:shadow-xl transition-all">
      <div className="px-4 py-3 bg-muted/50 border-b border-border">
        <h3 className="font-semibold text-card-foreground">{title}</h3>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}

// ============================================================================
// Example 8: Full Page Layout with Theme
// ============================================================================

export function Example8_DashboardLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold">FinBoard</h1>
          <div className="flex items-center gap-4">
            {/* Theme toggle would go here */}
            <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
              Settings
            </button>
          </div>
        </div>
      </nav>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Widget 1 */}
          <div className="p-6 rounded-lg bg-card border border-border hover:border-ring/50 transition-colors">
            <h2 className="text-lg font-semibold text-card-foreground mb-2">
              Revenue
            </h2>
            <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              $12,345
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              +12.5% from last month
            </p>
          </div>
          
          {/* Widget 2 */}
          <div className="p-6 rounded-lg bg-card border border-border hover:border-ring/50 transition-colors">
            <h2 className="text-lg font-semibold text-card-foreground mb-2">
              Users
            </h2>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              1,234
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              +5.2% from last month
            </p>
          </div>
          
          {/* Widget 3 */}
          <div className="p-6 rounded-lg bg-card border border-border hover:border-ring/50 transition-colors">
            <h2 className="text-lg font-semibold text-card-foreground mb-2">
              Orders
            </h2>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              567
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              +8.1% from last month
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// Example 9: Theme State in useEffect
// ============================================================================

export function Example9_ThemeEffect() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  // React to theme changes
  useEffect(() => {
    if (!mounted) return;
    
    console.log("Theme changed to:", resolvedTheme);
    
    // You could update chart libraries, apply custom styles, etc.
    // Example: Update a third-party component's theme
    if (typeof window !== "undefined") {
      // Update some external library
      // externalLib.setTheme(resolvedTheme);
    }
  }, [resolvedTheme, mounted]);

  if (!mounted) {
    return <div className="p-4">Loading...</div>;
  }
  
  return (
    <div className="p-4">
      <p>Check console for theme change logs</p>
      <p className="text-muted-foreground">Current: {resolvedTheme}</p>
    </div>
  );
}

// ============================================================================
// Example 10: Table with Theme-Aware Styling
// ============================================================================

export function Example10_ThemeAwareTable() {
  const data = [
    { id: 1, name: "Product A", price: "$99.99", status: "In Stock" },
    { id: 2, name: "Product B", price: "$149.99", status: "Low Stock" },
    { id: 3, name: "Product C", price: "$199.99", status: "Out of Stock" },
  ];
  
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              ID
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              Name
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              Price
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.map((item) => (
            <tr 
              key={item.id} 
              className="bg-card hover:bg-muted/50 transition-colors"
            >
              <td className="px-4 py-3 text-sm text-card-foreground">
                {item.id}
              </td>
              <td className="px-4 py-3 text-sm text-card-foreground">
                {item.name}
              </td>
              <td className="px-4 py-3 text-sm text-card-foreground">
                {item.price}
              </td>
              <td className="px-4 py-3 text-sm">
                <span className={`
                  inline-block px-2 py-1 rounded-full text-xs font-medium
                  ${item.status === "In Stock" ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300" : ""}
                  ${item.status === "Low Stock" ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300" : ""}
                  ${item.status === "Out of Stock" ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300" : ""}
                `}>
                  {item.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// Example 11: Accessing Theme Outside React Components
// ============================================================================

// Note: With next-themes, accessing outside components is not recommended
// Instead, use the hook within components or pass theme as props

// If you absolutely need it, you can create a custom solution:
let cachedTheme: string | undefined = undefined;

export function ThemeCacheUpdater() {
  const { resolvedTheme } = useTheme();
  
  useEffect(() => {
    cachedTheme = resolvedTheme;
  }, [resolvedTheme]);
  
  return null;
}

// Use with caution - may not be in sync
export function getCachedTheme() {
  return cachedTheme || "light";
}

// Better approach: Pass theme as parameter
export function generateThemeAwareConfig(theme: string | undefined) {
  const isDark = theme === "dark";
  
  return {
    backgroundColor: isDark ? "#0f172a" : "#ffffff",
    primaryColor: isDark ? "#60a5fa" : "#3b82f6",
    textColor: isDark ? "#e2e8f0" : "#1e293b",
  };
}
