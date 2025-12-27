/**
 * Data Formatting Utilities
 * Comprehensive formatting system for different data types
 */

import type { FieldFormat, FormatType } from "@/lib/types/field";

/**
 * Format a value based on the field format configuration
 */
export function formatValue(
  value: string | number | boolean | null | undefined,
  format?: FieldFormat
): string {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return "N/A";
  }

  // No format specified - return as string
  if (!format || format.type === "none") {
    return String(value);
  }

  // Apply specific formatting based on type
  try {
    switch (format.type) {
      case "currency":
        return formatCurrency(value, format);
      case "percentage":
        return formatPercentage(value, format);
      case "number":
        return formatNumber(value, format);
      case "compact-number":
        return formatCompactNumber(value, format);
      case "decimal":
        return formatDecimal(value, format);
      case "date":
        return formatDate(value, format);
      case "datetime":
        return formatDateTime(value, format);
      case "time":
        return formatTime(value, format);
      default:
        return String(value);
    }
  } catch (error) {
    console.error("Format error:", error);
    return String(value);
  }
}

/**
 * Format as currency
 */
function formatCurrency(
  value: string | number | boolean | null | undefined,
  format: FieldFormat
): string {
  const numValue = Number(value);
  if (isNaN(numValue)) return String(value);

  const locale = format.locale || "en-US";
  const currency = format.currency || "USD";
  const decimals = format.decimals ?? 2;

  const formatted = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numValue);

  return applyPrefixSuffix(formatted, format);
}

/**
 * Format as percentage
 */
function formatPercentage(
  value: string | number | boolean | null | undefined,
  format: FieldFormat
): string {
  const numValue = Number(value);
  if (isNaN(numValue)) return String(value);

  const locale = format.locale || "en-US";
  const decimals = format.decimals ?? 2;

  const formatted = new Intl.NumberFormat(locale, {
    style: "percent",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numValue / 100); // Assuming value is like 25 for 25%

  return applyPrefixSuffix(formatted, format);
}

/**
 * Format as regular number with thousand separators
 */
function formatNumber(
  value: string | number | boolean | null | undefined,
  format: FieldFormat
): string {
  const numValue = Number(value);
  if (isNaN(numValue)) return String(value);

  const locale = format.locale || "en-US";
  const decimals = format.decimals ?? 0;

  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numValue);

  const withSign =
    format.showSign && numValue > 0 ? `+${formatted}` : formatted;
  return applyPrefixSuffix(withSign, format);
}

/**
 * Format as compact number (1K, 1M, 1B)
 */
function formatCompactNumber(
  value: string | number | boolean | null | undefined,
  format: FieldFormat
): string {
  const numValue = Number(value);
  if (isNaN(numValue)) return String(value);

  const locale = format.locale || "en-US";

  const formatted = new Intl.NumberFormat(locale, {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: format.decimals ?? 1,
  }).format(numValue);

  return applyPrefixSuffix(formatted, format);
}

/**
 * Format as decimal number
 */
function formatDecimal(
  value: string | number | boolean | null | undefined,
  format: FieldFormat
): string {
  const numValue = Number(value);
  if (isNaN(numValue)) return String(value);

  const decimals = format.decimals ?? 2;
  const formatted = numValue.toFixed(decimals);

  return applyPrefixSuffix(formatted, format);
}

/**
 * Format as date
 */
function formatDate(
  value: string | number | boolean | null | undefined,
  format: FieldFormat
): string {
  const date = new Date(value as string | number);
  if (isNaN(date.getTime())) return String(value);

  const locale = format.locale || "en-US";

  if (format.dateFormat) {
    // Simple custom format support
    return formatCustomDate(date, format.dateFormat);
  }

  const formatted = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);

  return applyPrefixSuffix(formatted, format);
}

/**
 * Format as datetime
 */
function formatDateTime(
  value: string | number | boolean | null | undefined,
  format: FieldFormat
): string {
  const date = new Date(value as string | number);
  if (isNaN(date.getTime())) return String(value);

  const locale = format.locale || "en-US";

  const formatted = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  return applyPrefixSuffix(formatted, format);
}

/**
 * Format as time
 */
function formatTime(
  value: string | number | boolean | null | undefined,
  format: FieldFormat
): string {
  const date = new Date(value as string | number);
  if (isNaN(date.getTime())) return String(value);

  const locale = format.locale || "en-US";

  const formatted = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);

  return applyPrefixSuffix(formatted, format);
}

/**
 * Custom date formatting
 */
function formatCustomDate(date: Date, formatStr: string): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return formatStr
    .replace("YYYY", String(year))
    .replace("MM", month)
    .replace("DD", day)
    .replace("HH", hours)
    .replace("mm", minutes)
    .replace("ss", seconds);
}

/**
 * Apply prefix and suffix to formatted value
 */
function applyPrefixSuffix(value: string, format: FieldFormat): string {
  let result = value;
  if (format.prefix) {
    result = `${format.prefix}${result}`;
  }
  if (format.suffix) {
    result = `${result}${format.suffix}`;
  }
  return result;
}

/**
 * Get format type suggestions based on field name and type
 */
export function suggestFormatType(
  fieldName: string,
  fieldType: string
): FormatType {
  const nameLower = fieldName.toLowerCase();

  // Currency patterns
  if (
    nameLower.includes("price") ||
    nameLower.includes("cost") ||
    nameLower.includes("amount") ||
    nameLower.includes("salary") ||
    nameLower.includes("revenue") ||
    nameLower.includes("usd") ||
    nameLower.includes("eur")
  ) {
    return "currency";
  }

  // Percentage patterns
  if (
    nameLower.includes("percent") ||
    nameLower.includes("rate") ||
    nameLower.includes("ratio") ||
    nameLower.endsWith("%")
  ) {
    return "percentage";
  }

  // Date patterns
  if (
    nameLower.includes("date") ||
    nameLower.includes("time") ||
    nameLower.includes("created") ||
    nameLower.includes("updated")
  ) {
    return "date";
  }

  // Number patterns
  if (fieldType === "number") {
    if (nameLower.includes("count") || nameLower.includes("total")) {
      return "number";
    }
    return "decimal";
  }

  return "none";
}

/**
 * Get default format configuration for a format type
 */
export function getDefaultFormat(type: FormatType): FieldFormat {
  switch (type) {
    case "currency":
      return {
        type: "currency",
        currency: "USD",
        decimals: 2,
        locale: "en-US",
      };
    case "percentage":
      return {
        type: "percentage",
        decimals: 2,
        locale: "en-US",
      };
    case "number":
      return {
        type: "number",
        decimals: 0,
        locale: "en-US",
      };
    case "compact-number":
      return {
        type: "compact-number",
        decimals: 1,
        locale: "en-US",
      };
    case "decimal":
      return {
        type: "decimal",
        decimals: 2,
      };
    case "date":
      return {
        type: "date",
        locale: "en-US",
      };
    case "datetime":
      return {
        type: "datetime",
        locale: "en-US",
      };
    case "time":
      return {
        type: "time",
        locale: "en-US",
      };
    default:
      return {
        type: "none",
      };
  }
}
