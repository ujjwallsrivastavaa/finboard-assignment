/**
 * Chart Type Definitions
 * Streamlined type system for chart widgets
 */

import type { FieldType } from "./field";

/**
 * Supported chart types
 */
export type ChartType = "line" | "candlestick";

/**
 * Chart field reference (similar to SelectedField but without order)
 */
export interface ChartField {
  /** Full dot-notation path to the field */
  path: string;
  /** Display name of the field */
  name: string;
  /** Data type of the field */
  type: FieldType;
}

/**
 * Chart-specific configuration
 */
export interface ChartConfig {
  /** Type of chart to render */
  type: ChartType;
  /** X-axis field configuration */
  xAxis: ChartField;
  /** Y-axis field configurations */
  yAxis: ChartField[];
  /** Candlestick field mapping (required only for candlestick charts) */
  candlestickMapping?: CandlestickFieldMapping;
}

/**
 * Field mapping for candlestick charts
 */
export interface CandlestickFieldMapping {
  /** Field for timestamp/date */
  date: ChartField;
  /** Field for open price */
  open: ChartField;
  /** Field for high price */
  high: ChartField;
  /** Field for low price */
  low: ChartField;
  /** Field for close price */
  close: ChartField;
}

/**
 * Chart definition metadata for UI rendering and validation
 */
export interface ChartDefinition {
  /** Display label for UI */
  label: string;
  /** Description of when to use this chart */
  description: string;
  /** Minimum number of Y-axis fields required */
  minYFields: number;
  /** Maximum number of Y-axis fields allowed (0 = unlimited) */
  maxYFields: number;
  /** Whether this chart requires special field mapping */
  requiresMapping: boolean;
  /** Icon name (lucide-react) */
  icon: string;
}

/**
 * Chart definitions for all supported chart types
 */
export const chartDefinitions: Record<ChartType, ChartDefinition> = {
  line: {
    label: "Line Chart",
    description: "Display trends over time with connected data points",
    minYFields: 1,
    maxYFields: 0, // unlimited
    requiresMapping: false,
    icon: "TrendingUp",
  },
  candlestick: {
    label: "Candlestick Chart",
    description:
      "Display OHLC (Open, High, Low, Close) data for financial analysis",
    minYFields: 4, // open, high, low, close
    maxYFields: 4,
    requiresMapping: true,
    icon: "CandlestickChart",
  },
};
