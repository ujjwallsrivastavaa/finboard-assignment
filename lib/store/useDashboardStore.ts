/**
 * Dashboard Store with localStorage Persistence
 * Industrial-grade state management with type safety
 * Features encrypted storage using AES-256-GCM
 */

import { create } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";
import type {
  Widget,
  WidgetInput,
  WidgetUpdate,
  WidgetData,
  WidgetStatus,
} from "@/lib/types/widget";
import type { DashboardStore, DashboardState, DashboardTemplate } from "@/lib/types/dashboard";
import type { Layout, LayoutItem } from "react-grid-layout";
import {
  encryptData,
  decryptData,
  isEncryptionConfigured,
} from "@/lib/utils/encryption";

/**
 * Initial state for the dashboard
 */
const initialState: DashboardState = {
  widgets: [],
  selectedWidgetId: null,
};

/**
 * Encrypted Storage Adapter for localStorage
 * Encrypts data before saving and decrypts on retrieval
 * If decryption fails (tampered data or key change), clears storage
 */
const encryptedStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    // Check if we're in a browser environment
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return null;
    }

    try {
      const encryptedValue = localStorage.getItem(name);
      if (!encryptedValue) return null;

      if (!isEncryptionConfigured()) {
        console.error("Encryption key not configured. Clearing storage.");
        localStorage.removeItem(name);
        return null;
      }

      // Decrypt the stored value
      const decryptedValue = await decryptData(encryptedValue);
      return decryptedValue;
    } catch (error) {
      console.error("Failed to decrypt stored data. Clearing storage.", error);
      localStorage.removeItem(name);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    // Check if we're in a browser environment
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return;
    }

    try {
      if (!isEncryptionConfigured()) {
        throw new Error("Encryption key not configured");
      }

      // Encrypt before storing
      const encryptedValue = await encryptData(value);
      localStorage.setItem(name, encryptedValue);
    } catch (error) {
      console.error("Failed to encrypt data:", error);
      throw error;
    }
  },
  removeItem: (name: string): void => {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return;
    }
    localStorage.removeItem(name);
  },
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
                  // Clear data and reset status when config changes to force refetch
                  data: updates.config ? undefined : widget.data,
                  status: updates.config ? "idle" : widget.status,
                  error: updates.config ? undefined : widget.error,
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

      appendWidgetData: (id: string, newData: WidgetData): void => {
        console.log(`[Store] appendWidgetData called for widget ${id}`);
        console.log(`[Store] New data to append:`, newData);

        if (!validateWidgetData(newData)) {
          console.error("Invalid widget data structure", newData);
          return;
        }

        set((state) => {
          const widget = state.widgets.find((w) => w.id === id);
          console.log(`[Store] Current widget data:`, widget?.data);

          return {
            widgets: state.widgets.map((widget) => {
              if (widget.id !== id) return widget;

              // If no existing data, just set the new data
              if (!widget.data || !widget.data.records.length) {
                console.log(
                  `[Store] No existing data, setting new data directly`
                );
                return {
                  ...widget,
                  data: newData,
                  status: "success" as WidgetStatus,
                  lastUpdated: Date.now(),
                };
              }

              // Append new records to existing data
              const mergedData: WidgetData = {
                records: [...widget.data.records, ...newData.records],
                totalCount: widget.data.totalCount + newData.totalCount,
                fetchedAt: Date.now(),
                metadata: {
                  ...widget.data.metadata,
                  ...newData.metadata,
                },
              };

              console.log(`[Store] Merged data:`, mergedData);
              console.log(
                `[Store] Old record count: ${widget.data.records.length}, New record count: ${newData.records.length}, Total: ${mergedData.records.length}`
              );

              return {
                ...widget,
                data: mergedData,
                status: "success" as WidgetStatus,
                lastUpdated: Date.now(),
              };
            }),
          };
        });
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

      exportWidget: async (id: string): Promise<string> => {
        const widget = get().widgets.find((w) => w.id === id);
        if (!widget) {
          throw new Error(`Widget with id ${id} not found`);
        }

        // Strip sensitive data (records) from export
        const exportData = {
          ...widget,
          data: widget.data
            ? {
                ...widget.data,
                records: [], // Clear records for security
              }
            : undefined,
          exportedAt: Date.now(),
          version: "1.0.0",
        };

        const jsonString = JSON.stringify(exportData, null, 2);

        // Encrypt the export file
        const encrypted = await encryptData(jsonString);
        return encrypted;
      },

      exportAllWidgets: async (): Promise<string> => {
        const widgets = get().widgets;
        if (widgets.length === 0) {
          throw new Error("No widgets to export");
        }

        // Strip sensitive data (records) from all widgets
        const sanitizedWidgets = widgets.map((widget) => ({
          ...widget,
          data: widget.data
            ? {
                ...widget.data,
                records: [], // Clear records for security
              }
            : undefined,
        }));

        const exportData = {
          widgets: sanitizedWidgets,
          exportedAt: Date.now(),
          version: "1.0.0",
          count: widgets.length,
        };

        const jsonString = JSON.stringify(exportData, null, 2);

        // Encrypt the export file
        const encrypted = await encryptData(jsonString);
        return encrypted;
      },

      importWidget: async (json: string): Promise<void> => {
        try {
          // Try to decrypt if it's encrypted data (hex format with ":")
          let decryptedJson = json;
          if (json.includes(":") && /^[0-9a-f]+:[0-9a-f]+$/i.test(json)) {
            try {
              decryptedJson = await decryptData(json);
            } catch (decryptError) {
              console.warn(
                "Failed to decrypt, trying as plain JSON",
                decryptError
              );
            }
          }

          const parsed = JSON.parse(decryptedJson);

          // Check if it's an array of widgets or a single widget
          const isMultipleWidgets =
            parsed.widgets && Array.isArray(parsed.widgets);
          const widgetsToImport: Widget[] = isMultipleWidgets
            ? parsed.widgets
            : [parsed];

          const now = Date.now();
          const importedWidgets: Widget[] = widgetsToImport.map((widget) => {
            const newId = generateWidgetId(widget.title);
            return {
              ...widget,
              id: newId,
              layout: {
                ...widget.layout,
                i: newId,
              },
              createdAt: now,
              lastUpdated: now,
            };
          });

          set((state) => ({
            widgets: [...state.widgets, ...importedWidgets],
          }));
        } catch (error) {
          console.error("Failed to import widget(s):", error);
          throw new Error("Invalid widget JSON format");
        }
      },

      /**
       * Apply a dashboard template
       * 
       * This action replaces the current dashboard state with a pre-configured template.
       * It follows these steps:
       * 1. Clear all existing widgets from the dashboard
       * 2. Iterate through template.widgets array
       * 3. For each WidgetInput in the template:
       *    - Generate a unique ID using generateWidgetId()
       *    - Add timestamps (createdAt, lastUpdated)
       *    - Set layout.i to the generated ID
       *    - Convert WidgetInput to Widget
       * 4. Set the new widgets array in state
       * 5. Clear selectedWidgetId
       * 
       * After applying:
       * - All widgets will have status: 'idle' (as defined in template)
       * - Widgets will begin polling based on their refreshInterval
       * - Users can edit, delete, or rearrange widgets as normal
       * - Changes persist via existing localStorage mechanism
       * 
       * @param template - DashboardTemplate containing pre-configured widgets
       */
      applyTemplate: (template: DashboardTemplate): void => {
        const now = Date.now();

        // Convert template WidgetInput objects to full Widget objects
        // Each widget needs: id, layout.i, createdAt, lastUpdated
        const templateWidgets: Widget[] = template.widgets.map((widgetInput) => {
          const id = generateWidgetId(widgetInput.title);
          
          return {
            ...widgetInput,
            id,
            layout: {
              ...widgetInput.layout,
              i: id, // Auto-generate 'i' field from id
            },
            createdAt: now,
            lastUpdated: now,
          };
        });

        // Replace entire dashboard state with template widgets
        // This clears existing widgets and loads template state
        set({
          widgets: templateWidgets,
          selectedWidgetId: null,
        });
      },
    }),
    {
      name: "dashboard-storage", // Storage key in localStorage
      storage: createJSONStorage(() => encryptedStorage),
      version: 1, // Version for potential migrations

      // Optional: Partition state for selective persistence
      partialize: (state) => ({
        widgets: state.widgets,
        selectedWidgetId: state.selectedWidgetId,
      }),

      // Optional: Handle migration between versions
      migrate: (persistedState: unknown, version: number) => {
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
