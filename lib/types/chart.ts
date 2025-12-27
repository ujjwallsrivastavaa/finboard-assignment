/**
 * Chart Type Definitions
 * Configuration-driven chart system with validators
 */

import type { PrimitiveType } from "./field";

/**
 * Supported chart types
 */
export type ChartType = "line" | "candlestick";

/**
 * Axis configuration with generic type constraint
 */
export interface AxisConfig<T extends PrimitiveType = PrimitiveType> {
  /** Field path (dot notation) */
  path: string;
  /** Expected data type */
  type: T;
  /** Display label */
  name: string;
}

/**
 * Base chart configuration
 */
interface BaseChartConfig {
  /** Chart type identifier */
  type: ChartType;
}

/**
 * Line chart configuration
 */
export interface LineChartConfig extends BaseChartConfig {
  type: "line";
  /** X-axis configuration (typically string or date) */
  xAxis: AxisConfig<"string" | "date" | "number">;
  /** Y-axis configuration (numeric data) */
  yAxis: AxisConfig<"number">;
  /** Optional series field for multiple lines */
  seriesField?: AxisConfig<"string">;
}

/**
 * Candlestick chart configuration (OHLC data)
 */
export interface CandlestickChartConfig extends BaseChartConfig {
  type: "candlestick";
  /** X-axis configuration (typically date or string) */
  xAxis: AxisConfig<"string" | "date">;
  /** Open price field */
  open: AxisConfig<"number">;
  /** High price field */
  high: AxisConfig<"number">;
  /** Low price field */
  low: AxisConfig<"number">;
  /** Close price field */
  close: AxisConfig<"number">;
}

/**
 * Discriminated union of all chart configurations
 */
export type ChartConfig = LineChartConfig | CandlestickChartConfig;

/**
 * Validation result
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** Error messages if validation failed */
  errors: string[];
}

/**
 * Validator function type
 */
export type ChartValidator<T extends ChartConfig = ChartConfig> = (
  config: T,
  data: Record<string, unknown>[]
) => ValidationResult;

/**
 * Chart definition with metadata and validation
 */
export interface ChartDefinition<T extends ChartConfig = ChartConfig> {
  /** Chart type identifier */
  type: ChartType;
  /** Display name */
  displayName: string;
  /** Description for UI */
  description: string;
  /** Required fields configuration */
  requiredFields: {
    [K in keyof Omit<T, "type">]: {
      label: string;
      description: string;
      allowedTypes: PrimitiveType[];
      required: boolean;
    };
  };
  /** Validation function */
  validator: ChartValidator<T>;
  /** Default configuration factory */
  createDefault: () => T;
}

/**
 * Validate line chart configuration
 */
const validateLineChart: ChartValidator<LineChartConfig> = (config, data) => {
  const errors: string[] = [];

  if (!config.xAxis?.path) {
    errors.push("X-axis field is required");
  }

  if (!config.yAxis?.path) {
    errors.push("Y-axis field is required");
  }

  if (data.length > 0) {
    const sample = data[0];

    // Validate xAxis field exists and type matches
    if (config.xAxis?.path && !(config.xAxis.path in sample)) {
      errors.push(`X-axis field "${config.xAxis.path}" not found in data`);
    } else if (config.xAxis?.path) {
      const value = sample[config.xAxis.path];
      const actualType = getActualType(value);
      if (!isTypeCompatible(actualType, config.xAxis.type)) {
        errors.push(
          `X-axis field "${config.xAxis.path}" type mismatch: expected ${config.xAxis.type}, got ${actualType}`
        );
      }
    }

    // Validate yAxis field exists and type matches
    if (config.yAxis?.path && !(config.yAxis.path in sample)) {
      errors.push(`Y-axis field "${config.yAxis.path}" not found in data`);
    } else if (config.yAxis?.path) {
      const value = sample[config.yAxis.path];
      const actualType = getActualType(value);
      if (!isTypeCompatible(actualType, "number")) {
        errors.push(
          `Y-axis field "${config.yAxis.path}" must be numeric, got ${actualType}`
        );
      }
    }

    // Validate series field if provided
    if (config.seriesField?.path && !(config.seriesField.path in sample)) {
      errors.push(
        `Series field "${config.seriesField.path}" not found in data`
      );
    } else if (config.seriesField?.path) {
      const value = sample[config.seriesField.path];
      const actualType = getActualType(value);
      if (!isTypeCompatible(actualType, "string")) {
        errors.push(
          `Series field "${config.seriesField.path}" must be string, got ${actualType}`
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Validate candlestick chart configuration
 */
const validateCandlestickChart: ChartValidator<CandlestickChartConfig> = (
  config,
  data
) => {
  const errors: string[] = [];

  // Check required fields
  const requiredFields = ["xAxis", "open", "high", "low", "close"] as const;
  for (const field of requiredFields) {
    if (!config[field]?.path) {
      errors.push(`${field} field is required`);
    }
  }

  if (data.length > 0) {
    const sample = data[0];

    // Validate xAxis
    if (config.xAxis?.path && !(config.xAxis.path in sample)) {
      errors.push(`X-axis field "${config.xAxis.path}" not found in data`);
    } else if (config.xAxis?.path) {
      const value = sample[config.xAxis.path];
      const actualType = getActualType(value);
      if (!isTypeCompatible(actualType, config.xAxis.type)) {
        errors.push(
          `X-axis field "${config.xAxis.path}" type mismatch: expected ${config.xAxis.type}, got ${actualType}`
        );
      }
    }

    // Validate OHLC fields
    const ohlcFields = ["open", "high", "low", "close"] as const;
    for (const field of ohlcFields) {
      const fieldConfig = config[field];
      if (fieldConfig?.path && !(fieldConfig.path in sample)) {
        errors.push(`${field} field "${fieldConfig.path}" not found in data`);
      } else if (fieldConfig?.path) {
        const value = sample[fieldConfig.path];
        const actualType = getActualType(value);
        if (!isTypeCompatible(actualType, "number")) {
          errors.push(
            `${field} field "${fieldConfig.path}" must be numeric, got ${actualType}`
          );
        }
      }
    }

    // Validate OHLC relationships (if all fields exist)
    if (
      config.open?.path &&
      config.high?.path &&
      config.low?.path &&
      config.close?.path
    ) {
      for (const record of data) {
        const open = Number(record[config.open.path]);
        const high = Number(record[config.high.path]);
        const low = Number(record[config.low.path]);
        const close = Number(record[config.close.path]);

        if (high < low) {
          errors.push("High price must be greater than or equal to low price");
          break;
        }
        if (high < open || high < close) {
          errors.push("High price must be the highest value");
          break;
        }
        if (low > open || low > close) {
          errors.push("Low price must be the lowest value");
          break;
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Helper: Get actual type of a value
 */
function getActualType(value: unknown): PrimitiveType {
  if (value === null) return "null";
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return "number";
  if (typeof value === "string") {
    // Check if it's a date string
    if (!isNaN(Date.parse(value))) {
      return "date";
    }
    return "string";
  }
  return "string";
}

/**
 * Helper: Check if actual type is compatible with expected type
 */
function isTypeCompatible(
  actualType: PrimitiveType,
  expectedType: PrimitiveType | string
): boolean {
  if (actualType === expectedType) return true;
  // Date strings can be treated as strings
  if (actualType === "date" && expectedType === "string") return true;
  if (actualType === "string" && expectedType === "date") return true;
  return false;
}

/**
 * Chart definitions registry - Single source of truth
 */
export const chartDefinitions: {
  [K in ChartType]: ChartDefinition<Extract<ChartConfig, { type: K }>>;
} = {
  line: {
    type: "line",
    displayName: "Line Chart",
    description: "Display trends over time or categories with connected lines",
    requiredFields: {
      xAxis: {
        label: "X-Axis",
        description: "Category or time dimension",
        allowedTypes: ["string", "date", "number"],
        required: true,
      },
      yAxis: {
        label: "Y-Axis",
        description: "Numeric values to plot",
        allowedTypes: ["number"],
        required: true,
      },
      seriesField: {
        label: "Series",
        description: "Field to group multiple lines (optional)",
        allowedTypes: ["string"],
        required: false,
      },
    },
    validator: validateLineChart,
    createDefault: () => ({
      type: "line",
      xAxis: { path: "", type: "string", name: "" },
      yAxis: { path: "", type: "number", name: "" },
    }),
  },
  candlestick: {
    type: "candlestick",
    displayName: "Candlestick Chart",
    description: "Display OHLC (Open, High, Low, Close) financial data",
    requiredFields: {
      xAxis: {
        label: "X-Axis",
        description: "Time dimension (typically date)",
        allowedTypes: ["string", "date"],
        required: true,
      },
      open: {
        label: "Open Price",
        description: "Opening price value",
        allowedTypes: ["number"],
        required: true,
      },
      high: {
        label: "High Price",
        description: "Highest price value",
        allowedTypes: ["number"],
        required: true,
      },
      low: {
        label: "Low Price",
        description: "Lowest price value",
        allowedTypes: ["number"],
        required: true,
      },
      close: {
        label: "Close Price",
        description: "Closing price value",
        allowedTypes: ["number"],
        required: true,
      },
    },
    validator: validateCandlestickChart,
    createDefault: () => ({
      type: "candlestick",
      xAxis: { path: "", type: "date", name: "" },
      open: { path: "", type: "number", name: "" },
      high: { path: "", type: "number", name: "" },
      low: { path: "", type: "number", name: "" },
      close: { path: "", type: "number", name: "" },
    }),
  },
};

/**
 * Get chart definition by type
 */
export function getChartDefinition<T extends ChartType>(
  type: T
): ChartDefinition<Extract<ChartConfig, { type: T }>> {
  return chartDefinitions[type] as ChartDefinition<
    Extract<ChartConfig, { type: T }>
  >;
}

/**
 * Validate any chart configuration
 */
export function validateChartConfig(
  config: ChartConfig,
  data: Record<string, unknown>[]
): ValidationResult {
  const definition = getChartDefinition(config.type);
  return definition.validator(config as never, data);
}

/**
 * Type guard for line chart config
 */
export function isLineChartConfig(
  config: ChartConfig
): config is LineChartConfig {
  return config.type === "line";
}

/**
 * Type guard for candlestick chart config
 */
export function isCandlestickChartConfig(
  config: ChartConfig
): config is CandlestickChartConfig {
  return config.type === "candlestick";
}
