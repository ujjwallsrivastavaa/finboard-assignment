/**
 * Data Transformation Utilities
 * Handles data flattening and transformation operations
 */

/**
 * Checks if a string matches common date/timestamp patterns and is a valid date
 */
export function isDateString(value: string): boolean {
  // ISO date: 2025-12-26
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const date = new Date(value);
    return !isNaN(date.getTime());
  }

  // ISO datetime: 2025-12-26T10:30:00 or with timezone
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?/.test(value)) {
    const date = new Date(value);
    return !isNaN(date.getTime());
  }

  // Unix timestamp (10 or 13 digits)
  if (/^\d{10,13}$/.test(value)) return true;

  // US date formats: 12/26/2025 or 12-26-2025
  if (/^\d{1,2}[/-]\d{1,2}[/-]\d{4}$/.test(value)) {
    const date = new Date(value);
    return !isNaN(date.getTime());
  }

  // Additional datetime formats: 2025/12/26
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(value)) {
    const date = new Date(value);
    return !isNaN(date.getTime());
  }

  // EU date: 25-12-2024
  if (/^\d{2}-\d{2}-\d{4}$/.test(value)) {
    const date = new Date(value);
    return !isNaN(date.getTime());
  }

  return false;
}

/**
 * Checks if a string matches common date/timestamp patterns (for object keys)
 */
function isDateKey(key: string): boolean {
  return isDateString(key);
}

/**
 * Checks if an object contains financial numeric fields
 */
function hasFinancialFields(obj: Record<string, unknown>): boolean {
  const keys = Object.keys(obj);

  const financialKeywords = [
    "open",
    "high",
    "low",
    "close",
    "volume",
    "price",
    "rate",
    "value",
    "1. open",
    "2. high",
    "3. low",
    "4. close",
    "5. volume",
    "adj_close",
    "adjusted_close",
    "vwap",
    "typical_price",
    "bid",
    "ask",
    "spread",
    "sma",
    "ema",
    "rsi",
    "macd",
  ];

  // Count keyword matches
  const matchCount = financialKeywords.filter((keyword) =>
    keys.some((key) => key.toLowerCase().includes(keyword.toLowerCase()))
  ).length;

  if (matchCount >= 2) return true;

  // Fallback: any numeric fields present
  const numericCount = keys.filter((k) => !isNaN(Number(obj[k]))).length;

  return numericCount >= 2;
}

/**
 * Detects if a value is a financial time-series object
 */
export function isFinancialTimeSeries(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const entries = Object.entries(value);
  if (entries.length < 2) return false;

  // Check if all keys are date/timestamp patterns
  const allKeysAreDates = entries.every(([key]) => isDateKey(key));
  if (!allKeysAreDates) return false;

  // Check if all values are objects (not arrays or primitives)
  const allValuesAreObjects = entries.every(
    ([, val]) => val && typeof val === "object" && !Array.isArray(val)
  );
  if (!allValuesAreObjects) return false;

  // Check if at least one value has financial fields
  const hasFinancials = entries.some(([, val]) =>
    hasFinancialFields(val as Record<string, unknown>)
  );

  return hasFinancials;
}

/**
 * Normalizes financial time-series data from object-of-objects to array format
 */
export function normalizeFinancialTimeSeries(
  series: Record<string, Record<string, unknown>>,
  dateKey: string = "date"
): Array<Record<string, unknown>> {
  const entries = Object.entries(series);

  const records = entries.map(([timestamp, values]) => ({
    [dateKey]: timestamp,
    ...values,
  }));

  records.sort((a, b) => {
    const dateA = new Date(a[dateKey] as string | number).getTime();
    const dateB = new Date(b[dateKey] as string | number).getTime();

    if (!isNaN(dateA) && !isNaN(dateB)) return dateA - dateB;

    // Fallback: parse as Unix timestamps
    const tsA = parseInt(String(a[dateKey]));
    const tsB = parseInt(String(b[dateKey]));
    if (!isNaN(tsA) && !isNaN(tsB)) return tsA - tsB;

    // Last fallback: string comparison
    return String(a[dateKey]).localeCompare(String(b[dateKey]));
  });

  return records;
}

/**
 * Flattens nested objects into dot-notation records
 * Example: { user: { name: "John" } } => { "user.name": "John" }
 */
export function flattenObject(
  obj: unknown,
  prefix = ""
): Record<string, string | number | boolean | null> {
  const result: Record<string, string | number | boolean | null> = {};

  if (!obj || typeof obj !== "object") {
    return result;
  }

  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (value === null) {
      result[newKey] = null;
    } else if (Array.isArray(value)) {
      result[newKey] = JSON.stringify(value);
    } else if (typeof value === "object") {
      Object.assign(result, flattenObject(value, newKey));
    } else if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      result[newKey] = value;
    }
  }

  return result;
}

/**
 * Extracts a value from a nested object using dot notation path
 * Example: getNestedValue({ user: { name: "John" } }, "user.name") => "John"
 */
export function getNestedValue(obj: unknown, path: string): unknown {
  const parts = path.split(".");
  let current = obj;

  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return current;
}
