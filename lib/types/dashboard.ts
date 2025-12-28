/**
 * Dashboard Type Definitions
 * Type system for dashboard state management and operations
 */

import type { Layout, LayoutItem } from "react-grid-layout";
import type {
  Widget,
  WidgetInput,
  WidgetUpdate,
  WidgetData,
  WidgetStatus,
} from "./widget";

/**
 * Dashboard Store State
 */
export interface DashboardState {
  /** All widgets in the dashboard */
  widgets: Widget[];
  /** Currently selected widget ID */
  selectedWidgetId: string | null;
}

/**
 * Dashboard Store Actions
 */
export interface DashboardActions {
  /** Add a new widget to the dashboard */
  addWidget: (widget: WidgetInput) => void;

  /** Remove a widget by ID */
  removeWidget: (id: string) => void;

  /** Update widget properties */
  updateWidget: (id: string, updates: WidgetUpdate) => void;

  /** Update widget layout position/size */
  updateWidgetLayout: (id: string, layout: LayoutItem) => void;

  /** Batch update all widget layouts (for drag & drop) */
  updateAllWidgetLayouts: (layouts: Layout) => void;

  /** Set widget data after fetch */
  setWidgetData: (id: string, data: WidgetData) => void;

  /** Append new data to existing widget data (for streaming/incremental updates) */
  appendWidgetData: (id: string, data: WidgetData) => void;

  /** Update widget status and error */
  updateWidgetStatus: (
    id: string,
    status: WidgetStatus,
    error?: string
  ) => void;

  /** Select/deselect a widget */
  selectWidget: (id: string | null) => void;

  /** Clear all widgets from dashboard */
  clearAllWidgets: () => void;

  /** Duplicate an existing widget */
  duplicateWidget: (id: string) => void;

  /** Export widget configuration (encrypted) */
  exportWidget: (id: string) => Promise<string>;

  /** Export all widgets configuration (encrypted) */
  exportAllWidgets: () => Promise<string>;

  /** Import widget(s) from JSON (handles encrypted or plain JSON, single widget or array of widgets) */
  importWidget: (json: string) => Promise<void>;

  /** Apply a dashboard template (replaces all current widgets with template widgets) */
  applyTemplate: (template: DashboardTemplate) => void;
}

/**
 * Complete Dashboard Store type
 */
export type DashboardStore = DashboardState & DashboardActions;

/**
 * Dashboard Template
 * Represents a pre-configured dashboard with widgets and layout
 */
export interface DashboardTemplate {
  /** Unique identifier for the template */
  id: string;
  /** Template name */
  name: string;
  /** Template description */
  description: string;
  /** Category or tags for filtering */
  category?: string;
  /** Preview image URL (optional) */
  preview?: string;
  /** Array of widget inputs that will be added to the dashboard */
  widgets: WidgetInput[];
}
