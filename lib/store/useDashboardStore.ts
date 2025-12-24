/**
 * Dashboard Store with localStorage Persistence
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Widget,
  DashboardStore,
  DashboardState,
  WidgetInput,
  WidgetUpdate,
} from "@/lib/types/widget";
import { Layout, LayoutItem } from "react-grid-layout";

/**
 * Initial state for the dashboard
 */
const initialState: DashboardState = {
  widgets: [],
  selectedWidgetId: null,
};

/**
 * Generate a unique ID for widgets
 */
const generateWidgetId = (title: string): string => {
  return `widget-${title}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
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
      addWidget: (widget: WidgetInput) => {
        const id: string = generateWidgetId(widget.title);
        const newWidget: Widget = {
          ...widget,
          id,
          layout: {
            ...widget.layout,
            i: id, // Auto-generate 'i' from id
          },
          lastUpdated: Date.now(),
        };

        set((state) => ({
          widgets: [...state.widgets, newWidget],
        }));
      },

      removeWidget: (id: string) => {
        set((state) => ({
          widgets: state.widgets.filter((widget) => widget.id !== id),
          selectedWidgetId:
            state.selectedWidgetId === id ? null : state.selectedWidgetId,
        }));
      },

      updateWidget: (id: string, updates: WidgetUpdate) => {
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

      updateWidgetLayout: (id: string, layout: LayoutItem) => {
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

      updateAllWidgetLayouts: (layouts: Layout) => {
        set((state) => ({
          widgets: state.widgets.map((widget) => {
            const layout = layouts.find((l) => l.i === widget.id);

            if (!layout) return widget;

            return {
              ...widget,
              layout,
              lastUpdated: Date.now(),
            };
          }),
        }));
      },

      setWidgetData: (id: string, data: any) => {
        set((state) => ({
          widgets: state.widgets.map((widget) =>
            widget.id === id
              ? {
                  ...widget,
                  data,
                  lastUpdated: Date.now(),
                }
              : widget
          ),
        }));
      },

      updateWidgetStatus: (
        id: string,
        status: Widget["status"],
        error?: string
      ) => {
        set((state) => ({
          widgets: state.widgets.map((widget) =>
            widget.id === id
              ? {
                  ...widget,
                  status,
                  error,
                  lastUpdated: Date.now(),
                }
              : widget
          ),
        }));
      },

      selectWidget: (id: string | null) => {
        set({ selectedWidgetId: id });
      },

      clearAllWidgets: () => {
        set({
          widgets: [],
          selectedWidgetId: null,
        });
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
  widgets: (state: DashboardStore) => state.widgets,
  selectedWidget: (state: DashboardStore) =>
    state.widgets.find((w) => w.id === state.selectedWidgetId),
  widgetById: (id: string) => (state: DashboardStore) =>
    state.widgets.find((w) => w.id === id),
  widgetsByType: (type: Widget["type"]) => (state: DashboardStore) =>
    state.widgets.filter((w) => w.type === type),
  loadingWidgets: (state: DashboardStore) =>
    state.widgets.filter((w) => w.status === "loading"),
  errorWidgets: (state: DashboardStore) =>
    state.widgets.filter((w) => w.status === "error"),
};

/**
 * Hook for using selectors
 * @example
 * ```tsx
 * const widgets = useDashboardStore(dashboardSelectors.widgets);
 * const selectedWidget = useDashboardStore(dashboardSelectors.selectedWidget);
 * ```
 */
