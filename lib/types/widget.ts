/**
 * Widget Type Definitions
 * Comprehensive type system for dashboard widgets
 */

import type { LayoutItem } from "react-grid-layout";
import type { SelectedField } from "./field";
import type { ApiAuthentication } from "./api";
import type { ChartConfig } from "./chart";

/**
 * Supported widget types
 */
export type WidgetType = "table" | "chart" | "card";

/**
 * Widget status states
 */
export type WidgetStatus = "idle" | "loading" | "success" | "error";

/**
 * Generic data record type for widget data
 */
export type DataRecord = Record<string, string | number | boolean | null>;

/**
 * Widget data structure
 */
export interface WidgetData {
  /** Array of data records */
  records: DataRecord[];
  /** Total count of records */
  totalCount: number;
  /** Timestamp of last fetch */
  fetchedAt: number;
  /** Metadata about the data */
  metadata?: {
    source?: string;
    version?: string;
    [key: string]: string | number | boolean | undefined;
  };
}

/**
 * Chart configuration types - imported from chart.ts
 */
export type {
  ChartType,
  ChartConfig,
  ChartDefinition,
  chartDefinitions,
} from "./chart";

/**
 * Base configuration shared by all widget types
 */
interface BaseWidgetConfig {
  /** API endpoint URL for data fetching */
  apiEndpoint: string;
  /** WebSocket URL for real-time updates (optional) */
  socketUrl?: string;
  /** Refresh interval in milliseconds (used for polling when socket is not available) */
  refreshInterval?: number;
  /** Authentication configuration */
  authentication?: ApiAuthentication;
  /** Custom headers for API requests (merged with auth headers) */
  headers?: Record<string, string>;
  /** HTTP method for API requests */
  method?: "GET";
  /** Request body for POST requests */
  body?: Record<string, unknown>;
}

/**
 * Widget configuration for data fetching and display
 * Uses discriminated union based on widget type
 */
export type WidgetConfig =
  | (BaseWidgetConfig & {
      /** Widget type: card or table */
      type: "card" | "table";
      /** Selected fields with metadata (supports dot notation paths) */
      fields: SelectedField[];
    })
  | (BaseWidgetConfig & {
      /** Widget type: chart */
      type: "chart";
      /** Chart-specific configuration */
      chartConfig: ChartConfig;
    });

/**
 * Type guard to check if config is for card/table widget
 */
export function isCardTableConfig(
  config: WidgetConfig
): config is BaseWidgetConfig & {
  type: "card" | "table";
  fields: SelectedField[];
} {
  return config.type === "card" || config.type === "table";
}

/**
 * Intermediate widget config type used between steps 2 and 3
 * This is the partial config before fields are finalized
 */
export interface WidgetConfigForFormatting {
  /** Widget type being created */
  type: "card" | "table" | "chart";
  /** Widget title */
  title: string;
  /** API endpoint URL */
  apiEndpoint: string;
  /** WebSocket URL for real-time updates (optional) */
  socketUrl?: string;
  /** Optional refresh interval in milliseconds */
  refreshInterval?: number;
  /** Authentication configuration */
  authentication?: ApiAuthentication;
  /** Whether this is financial data (OHLC format) */
  isFinancialData?: boolean;
  /** Path to the data array in the API response */
  dataPath?: string;
  /** Display mode (card, table, or chart) */
  displayMode: "card" | "table" | "chart";
  /** Chart configuration (only for chart type) */
  chartConfig?: ChartConfig;
}

/**
 * Type guard to check if config is for chart widget
 */
export function isChartConfig(
  config: WidgetConfig
): config is BaseWidgetConfig & { type: "chart"; chartConfig: ChartConfig } {
  return config.type === "chart";
}

/**
 * Layout input type that omits the 'i' field (auto-generated)
 */
export type LayoutInput = Omit<LayoutItem, "i">;

/**
 * Main Widget interface
 */
export interface Widget {
  /** Unique identifier for the widget */
  id: string;
  /** Type of widget (table, chart, card) */
  type: WidgetType;
  /** Display title */
  title: string;
  /** Grid layout configuration */
  layout: LayoutItem;
  /** Widget configuration */
  config: WidgetConfig;
  /** Fetched data */
  data?: WidgetData;
  /** Current status */
  status: WidgetStatus;
  /** Error message if status is 'error' */
  error?: string;
  /** Timestamp of last update */
  lastUpdated?: number;
  /** Creation timestamp */
  createdAt: number;
}

/**
 * Widget input type for adding widgets (omits id, lastUpdated, createdAt, and layout.i)
 */
export type WidgetInput = Omit<
  Widget,
  "id" | "lastUpdated" | "createdAt" | "layout"
> & {
  layout: LayoutInput;
};

/**
 * Widget update type (omits id and layout.i)
 */
export type WidgetUpdate = Partial<Omit<Widget, "id" | "layout">> & {
  layout?: LayoutInput;
};
