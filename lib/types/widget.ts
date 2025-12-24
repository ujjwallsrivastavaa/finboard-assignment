/**
 * Widget Type Definitions
 * Comprehensive type system for dashboard widgets
 */

import { Layout, LayoutItem } from "react-grid-layout";

export type WidgetType = "table" | "chart";

/**
 * Widget configuration for data fetching and display
 */
export interface WidgetConfig {
  apiEndpoint: string;
  refreshInterval?: number; // in milliseconds
  fields: string[]; // Array of field names
  chartConfig?: {
    type: "line" | "bar" | "pie" | "area" | "scatter";
    xAxis: string;
    yAxis: string[];
    colors?: string[];
  };
}

/**
 * Layout input type that omits the 'i' field (auto-generated)
 */
export type LayoutInput = Omit<LayoutItem, "i">;

/**
 * Main Widget interface
 */
export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  layout: LayoutItem;
  config: WidgetConfig;
  data?: any;
  status: "idle" | "loading" | "success" | "error";
  error?: string;
  lastUpdated?: number;
}

/**
 * Widget input type for adding widgets (omits id, lastUpdated, and layout.i)
 */
export type WidgetInput = Omit<Widget, "id" | "lastUpdated" | "layout"> & {
  layout: LayoutInput;
};

/**
 * Widget update type (omits id and layout.i)
 */
export type WidgetUpdate = Partial<Omit<Widget, "id" | "layout">> & {
  layout?: LayoutInput;
};

/**
 * Dashboard Store State
 */
export interface DashboardState {
  widgets: Widget[];
  selectedWidgetId: string | null;
}

/**
 * Dashboard Store Actions
 */
export interface DashboardActions {
  // Widget CRUD operations
  addWidget: (widget: WidgetInput) => void;
  removeWidget: (id: string) => void;
  updateWidget: (id: string, updates: WidgetUpdate) => void;

  updateWidgetLayout: (id: string, layout: LayoutItem) => void;
  updateAllWidgetLayouts: (layouts: Layout) => void;

  setWidgetData: (id: string, data: any[]) => void;
  updateWidgetStatus: (
    id: string,
    status: Widget["status"],
    error?: string
  ) => void;

  selectWidget: (id: string | null) => void;

  clearAllWidgets: () => void;
}

/**
 * Complete Dashboard Store type
 */
export type DashboardStore = DashboardState & DashboardActions;
