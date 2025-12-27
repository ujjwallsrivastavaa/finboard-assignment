/**
 * Field Type Definitions
 * Type system for API field discovery and selection
 */

/**
 * Primitive data types that can be extracted from JSON
 */
export type PrimitiveType = "string" | "number" | "boolean" | "null" | "date";

/**
 * Format types for data display
 */
export type FormatType =
  | "none"
  | "currency"
  | "percentage"
  | "number"
  | "date"
  | "datetime"
  | "time"
  | "compact-number"
  | "decimal";

/**
 * Currency codes (ISO 4217)
 */
export type CurrencyCode =
  | "USD"
  | "EUR"
  | "GBP"
  | "JPY"
  | "CNY"
  | "INR"
  | "AUD"
  | "CAD"
  | "CHF";

/**
 * Format configuration for a field
 */
export interface FieldFormat {
  /** Type of formatting to apply */
  type: FormatType;

  /** Currency code for currency formatting */
  currency?: CurrencyCode;

  /** Number of decimal places */
  decimals?: number;

  /** Locale for number formatting (default: 'en-US') */
  locale?: string;

  /** Prefix to add before value */
  prefix?: string;

  /** Suffix to add after value */
  suffix?: string;

  /** Whether to show + sign for positive numbers */
  showSign?: boolean;

  /** Date format string (for date types) */
  dateFormat?: string;
}

/**
 * Complex data types for nested structures
 */
export type ComplexType = "object" | "array";

/**
 * All possible field data types
 */
export type FieldType = PrimitiveType | ComplexType;

/**
 * Represents a single field in the API response structure
 */
export interface FieldNode {
  /** Display name of the field */
  name: string;

  /** Full dot-notation path to the field (e.g., "address.street") */
  path: string;

  /** Data type of the field */
  type: FieldType;

  /** Child fields for nested objects/arrays */
  children?: FieldNode[];

  /** UI state for expansion (managed by component) */
  isExpanded?: boolean;
}

/**
 * Configuration for field tree rendering
 */
export interface FieldTreeConfig {
  /** Maximum nesting depth to display */
  maxDepth?: number;

  /** Show type annotations */
  showTypes?: boolean;

  /** Allow multi-select */
  multiSelect?: boolean;

  /** Custom type formatter */
  typeFormatter?: (type: FieldType) => string;
}

/**
 * Selected field with metadata
 */
export interface SelectedField {
  /** Full dot-notation path to the field */
  path: string;

  /** Display name of the field */
  name: string;

  /** Data type of the field */
  type: FieldType;

  /** Field order in display */
  order: number;

  /** Format configuration for display */
  format?: FieldFormat;
}

/**
 * Field selection configuration
 */
export interface FieldSelectionConfig {
  /** Selected fields with metadata */
  fields: SelectedField[];

  /** Maximum number of fields allowed */
  maxFields?: number;

  /** Minimum number of fields required */
  minFields?: number;

  /** Allow reordering of fields */
  allowReorder?: boolean;
}

/**
 * Result of API field discovery
 */
export interface FieldDiscoveryResult {
  /** Root field nodes */
  fields: FieldNode[];

  /** Total count of selectable leaf fields */
  totalFields: number;

  /** All paths as flat array */
  paths: string[];

  /** Whether the response was an array */
  isArray: boolean;
}
