/**
 * Dashboard Store with localStorage Persistence
 * Industrial-grade state management with type safety
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Widget,
  WidgetInput,
  WidgetUpdate,
  WidgetData,
  WidgetStatus,
} from "@/lib/types/widget";
import type { DashboardStore, DashboardState } from "@/lib/types/dashboard";
import type { Layout, LayoutItem } from "react-grid-layout";

/**
 * Initial state for the dashboard
 */
const initialState: DashboardState = {
  widgets: [],
  selectedWidgetId: null,
};

/**
 * Generate a unique ID for widgets
 * Uses timestamp and random string for collision resistance
 */
const generateWidgetId = (title: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  const sanitizedTitle = title
    .toLowerCase()
    .replace(/\s+/g, "-")
    .substring(0, 20);
  return `widget-${sanitizedTitle}-${timestamp}-${random}`;
};

/**
 * Validates widget data structure
 */
const validateWidgetData = (data: unknown): data is WidgetData => {
  if (!data || typeof data !== "object") return false;
  const widgetData = data as WidgetData;
  return (
    Array.isArray(widgetData.records) &&
    typeof widgetData.totalCount === "number" &&
    typeof widgetData.fetchedAt === "number"
  );
};

/**
 * Dashboard Store Hook
 *
 * Features:
 * - Full CRUD operations for widgets
 * - Layout management with drag & drop support
 * - Data and status handling
 * - Widget selection tracking
 * - Automatic localStorage persistence
 * - Type-safe throughout
 *
 * @example
 * ```tsx
 * const { widgets, addWidget, updateWidget } = useDashboardStore();
 *
 * // Add a new widget
 * addWidget({
 *   type: 'table',
 *   title: 'Sales Data',
 *   layout: { x: 0, y: 0, w: 6, h: 4 },
 *   config: { apiEndpoint: '/api/sales', fields: [...] },
 *   data: [],
 *   status: 'idle'
 * });
 * ```
 */
export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set, get) => ({
      // State
      ...initialState,

      // Actions
      addWidget: (widget: WidgetInput): void => {
        const id = generateWidgetId(widget.title);
        const now = Date.now();

        const newWidget: Widget = {
          ...widget,
          id,
          layout: {
            ...widget.layout,
            i: id, // Auto-generate 'i' from id
          },
          createdAt: now,
          lastUpdated: now,
        };

        set((state) => ({
          widgets: [...state.widgets, newWidget],
        }));
      },

      removeWidget: (id: string): void => {
        set((state) => ({
          widgets: state.widgets.filter((widget) => widget.id !== id),
          selectedWidgetId:
            state.selectedWidgetId === id ? null : state.selectedWidgetId,
        }));
      },

      updateWidget: (id: string, updates: WidgetUpdate): void => {
        set((state) => ({
          widgets: state.widgets.map((widget) =>
            widget.id === id
              ? {
                  ...widget,
                  ...updates,
                  // If layout is being updated, add 'i' field
                  layout: updates.layout
                    ? { ...updates.layout, i: id }
                    : widget.layout,
                  lastUpdated: Date.now(),
                }
              : widget
          ),
        }));
      },

      updateWidgetLayout: (id: string, layout: LayoutItem): void => {
        set((state) => ({
          widgets: state.widgets.map((widget) =>
            widget.id === id
              ? {
                  ...widget,
                  layout,
                  lastUpdated: Date.now(),
                }
              : widget
          ),
        }));
      },

      updateAllWidgetLayouts: (layouts: Layout): void => {
        const now = Date.now();
        set((state) => ({
          widgets: state.widgets.map((widget) => {
            const layout = layouts.find((l) => l.i === widget.id);

            if (!layout) return widget;

            return {
              ...widget,
              layout,
              lastUpdated: now,
            };
          }),
        }));
      },

      setWidgetData: (id: string, data: WidgetData): void => {
        if (!validateWidgetData(data)) {
          console.error("Invalid widget data structure", data);
          return;
        }

        set((state) => ({
          widgets: state.widgets.map((widget) =>
            widget.id === id
              ? {
                  ...widget,
                  data,
                  status: "success" as WidgetStatus,
                  lastUpdated: Date.now(),
                }
              : widget
          ),
        }));
      },

      updateWidgetStatus: (
        id: string,
        status: WidgetStatus,
        error?: string
      ): void => {
        set((state) => ({
          widgets: state.widgets.map((widget) =>
            widget.id === id
              ? {
                  ...widget,
                  status,
                  error: status === "error" ? error : undefined,
                  lastUpdated: Date.now(),
                }
              : widget
          ),
        }));
      },

      selectWidget: (id: string | null): void => {
        set({ selectedWidgetId: id });
      },

      clearAllWidgets: (): void => {
        set({
          widgets: [],
          selectedWidgetId: null,
        });
      },

      duplicateWidget: (id: string): void => {
        const widget = get().widgets.find((w) => w.id === id);
        if (!widget) return;

        const newId = generateWidgetId(`${widget.title} (Copy)`);
        const now = Date.now();

        const duplicated: Widget = {
          ...widget,
          id: newId,
          title: `${widget.title} (Copy)`,
          layout: {
            ...widget.layout,
            i: newId,
            x: (widget.layout.x + 2) % 12, // Offset position
            y: widget.layout.y + 2,
          },
          createdAt: now,
          lastUpdated: now,
        };

        set((state) => ({
          widgets: [...state.widgets, duplicated],
        }));
      },

      exportWidget: (id: string): string => {
        const widget = get().widgets.find((w) => w.id === id);
        if (!widget) {
          throw new Error(`Widget with id ${id} not found`);
        }

        const exportData = {
          ...widget,
          exportedAt: Date.now(),
          version: "1.0.0",
        };

        return JSON.stringify(exportData, null, 2);
      },

      importWidget: (json: string): void => {
        try {
          const parsed = JSON.parse(json) as Widget;

          // Create new widget from imported data
          const newId = generateWidgetId(parsed.title);
          const now = Date.now();

          const importedWidget: Widget = {
            ...parsed,
            id: newId,
            layout: {
              ...parsed.layout,
              i: newId,
            },
            createdAt: now,
            lastUpdated: now,
          };

          set((state) => ({
            widgets: [...state.widgets, importedWidget],
          }));
        } catch (error) {
          console.error("Failed to import widget:", error);
          throw new Error("Invalid widget JSON format");
        }
      },
    }),
    {
      name: "dashboard-storage", // Storage key in localStorage
      storage: createJSONStorage(() => localStorage),
      version: 1, // Version for potential migrations

      // Optional: Partition state for selective persistence
      partialize: (state) => ({
        widgets: state.widgets,
        selectedWidgetId: state.selectedWidgetId,
      }),

      // Optional: Handle migration between versions
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Migration logic from version 0 to 1
          // Example: add new fields, transform data structure
          return persistedState;
        }
        return persistedState;
      },

      // Optional: Skip hydration on server-side rendering
      skipHydration: false,
    }
  )
);

/**
 * Selectors for optimized state access
 * Use these to prevent unnecessary re-renders
 */
export const dashboardSelectors = {
  /** Get all widgets */
  widgets: (state: DashboardStore): Widget[] => state.widgets,

  /** Get currently selected widget */
  selectedWidget: (state: DashboardStore): Widget | undefined =>
    state.widgets.find((w) => w.id === state.selectedWidgetId),

  /** Get widget by ID */
  widgetById:
    (id: string) =>
    (state: DashboardStore): Widget | undefined =>
      state.widgets.find((w) => w.id === id),

  /** Get widgets by type */
  widgetsByType:
    (type: Widget["type"]) =>
    (state: DashboardStore): Widget[] =>
      state.widgets.filter((w) => w.type === type),

  /** Get all loading widgets */
  loadingWidgets: (state: DashboardStore): Widget[] =>
    state.widgets.filter((w) => w.status === "loading"),

  /** Get all error widgets */
  errorWidgets: (state: DashboardStore): Widget[] =>
    state.widgets.filter((w) => w.status === "error"),

  /** Get all successful widgets */
  successWidgets: (state: DashboardStore): Widget[] =>
    state.widgets.filter((w) => w.status === "success"),

  /** Get widget count */
  widgetCount: (state: DashboardStore): number => state.widgets.length,

  /** Get widgets sorted by creation date */
  widgetsByCreationDate: (state: DashboardStore): Widget[] =>
    [...state.widgets].sort((a, b) => b.createdAt - a.createdAt),

  /** Get widgets sorted by last update */
  widgetsByLastUpdate: (state: DashboardStore): Widget[] =>
    [...state.widgets].sort(
      (a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0)
    ),
};

/**
 * Hook for using selectors
 * @example
 * ```tsx
 * const widgets = useDashboardStore(dashboardSelectors.widgets);
 * const selectedWidget = useDashboardStore(dashboardSelectors.selectedWidget);
 * ```
 */
