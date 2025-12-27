/**
 * Field Discovery Service
 * Analyzes API responses and builds field trees
 */

import type {
  FieldNode,
  FieldType,
  FieldDiscoveryResult,
  PrimitiveType,
  SelectedField,
} from "../types/field";
import { isFinancialTimeSeries, isDateString } from "../utils/dataTransform";

/**
 * Service for discovering and analyzing fields from API responses
 */
export class FieldDiscoveryService {
  /**
   * Determines the type of a value from actual data
   */
  static getType(value: unknown): FieldType {
    if (value === null) return "null";
    if (Array.isArray(value)) return "array";

    const jsType = typeof value;
    if (jsType === "object") return "object";

    // If it's a string, try to parse it
    if (jsType === "string") {
      const strValue = value as string;
      const trimmed = strValue.trim();

      // Check for boolean strings
      if (
        trimmed.toLowerCase() === "true" ||
        trimmed.toLowerCase() === "false"
      ) {
        return "boolean";
      }

      // Check if string value looks like a date
      if (isDateString(trimmed)) {
        return "date";
      }

      // Check if it's a numeric string
      if (trimmed !== "" && !isNaN(Number(trimmed))) {
        return "number";
      }

      return "string";
    }

    return jsType as FieldType;
  }

  /**
   * Builds a hierarchical field tree from an object
   */
  static buildFieldTree(obj: unknown, prefix = ""): FieldNode[] {
    const fields: FieldNode[] = [];

    if (!obj || typeof obj !== "object") {
      return fields;
    }

    for (const [key, value] of Object.entries(obj)) {
      const path = prefix ? `${prefix}.${key}` : key;
      const type = this.getType(value);

      if (type === "object" && value !== null) {
        fields.push({
          name: key,
          path,
          type: "object",
          children: this.buildFieldTree(value, path),
          isExpanded: false,
        });
      } else if (type === "array" && Array.isArray(value) && value.length > 0) {
        const firstItem = value[0];
        if (typeof firstItem === "object" && firstItem !== null) {
          fields.push({
            name: key,
            path,
            type: "array",
            children: this.buildFieldTree(firstItem, path),
            isExpanded: false,
          });
        } else {
          fields.push({
            name: key,
            path,
            type: "array",
          });
        }
      } else {
        fields.push({
          name: key,
          path,
          type,
        });
      }
    }

    return fields;
  }

  /**
   * Extracts all leaf field paths from a field tree
   */
  static getAllPaths(fields: FieldNode[]): string[] {
    const paths: string[] = [];

    const traverse = (nodes: FieldNode[]) => {
      for (const node of nodes) {
        if (node.children && node.children.length > 0) {
          traverse(node.children);
        } else {
          paths.push(node.path);
        }
      }
    };

    traverse(fields);
    return paths;
  }

  /**
   * Counts total selectable fields in a tree
   */
  static countSelectableFields(fields: FieldNode[]): number {
    return this.getAllPaths(fields).length;
  }

  /**
   * Discovers fields from API response data
   */
  static discover(data: unknown): FieldDiscoveryResult {
    let fields: FieldNode[] = [];
    let isArray = false;

    if (Array.isArray(data)) {
      isArray = true;
      if (data.length > 0 && typeof data[0] === "object") {
        fields = this.buildFieldTree(data[0]);
      }
    } else if (typeof data === "object" && data !== null) {
      fields = this.buildFieldTree(data);
    }

    const paths = this.getAllPaths(fields);

    return {
      fields,
      totalFields: paths.length,
      paths,
      isArray,
    };
  }

  /**
   * Finds a field node by path
   */
  static findFieldByPath(
    fields: FieldNode[],
    path: string
  ): FieldNode | undefined {
    for (const field of fields) {
      if (field.path === path) {
        return field;
      }
      if (field.children) {
        const found = this.findFieldByPath(field.children, path);
        if (found) return found;
      }
    }
    return undefined;
  }

  /**
   * Creates a SelectedField from a field node
   */
  static createSelectedField(
    fieldNode: FieldNode,
    order: number
  ): SelectedField {
    return {
      path: fieldNode.path,
      name: fieldNode.name,
      type: fieldNode.type,
      order,
    };
  }

  /**
   * Flattens field tree to get all selectable primitive fields
   * Useful for dropdowns and field selection in charts
   */
  static flattenFields(
    fields: FieldNode[],
    allowedTypes?: PrimitiveType[]
  ): Array<{ path: string; name: string; type: PrimitiveType }> {
    const result: Array<{ path: string; name: string; type: PrimitiveType }> =
      [];

    const traverse = (nodes: FieldNode[]) => {
      for (const node of nodes) {
        // Only include primitive types
        if (
          node.type !== "object" &&
          node.type !== "array" &&
          (!allowedTypes || allowedTypes.includes(node.type as PrimitiveType))
        ) {
          result.push({
            path: node.path,
            name: node.name,
            type: node.type as PrimitiveType,
          });
        }
        if (node.children) {
          traverse(node.children);
        }
      }
    };

    traverse(fields);
    return result;
  }

  /**
   * Finds all array fields in the response
   */
  static findArrayPaths(
    fields: FieldNode[]
  ): Array<{ path: string; name: string }> {
    const arrays: Array<{ path: string; name: string }> = [];

    const traverse = (nodes: FieldNode[]) => {
      for (const node of nodes) {
        if (node.type === "array") {
          arrays.push({ path: node.path, name: node.name });
        }
        if (node.children) {
          traverse(node.children);
        }
      }
    };

    traverse(fields);
    return arrays;
  }

  /**
   * Finds all financial time-series objects in the response
   */
  static findFinancialTimeSeriesPaths(
    data: unknown,
    prefix = ""
  ): Array<{ path: string; name: string }> {
    const financialPaths: Array<{ path: string; name: string }> = [];

    if (!data || typeof data !== "object") {
      return financialPaths;
    }

    for (const [key, value] of Object.entries(data)) {
      const path = prefix ? `${prefix}.${key}` : key;

      // Check if this value is a financial time series
      if (isFinancialTimeSeries(value)) {
        financialPaths.push({ path, name: key });
      }

      // Recurse into nested objects (but not arrays or financial time series)
      if (
        value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        !isFinancialTimeSeries(value)
      ) {
        financialPaths.push(...this.findFinancialTimeSeriesPaths(value, path));
      }
    }

    return financialPaths;
  }

  /**
   * Analyzes data structure to determine what widget types are possible
   */
  static analyzeDataStructure(data: unknown): {
    isRootArray: boolean;
    hasArrays: boolean;
    hasFinancialTimeSeries: boolean;
    arrayPaths: Array<{ path: string; name: string }>;
    financialPaths: Array<{ path: string; name: string }>;
    allowedModes: Array<"card" | "table" | "chart">;
  } {
    const isRootArray = Array.isArray(data);
    const fields =
      isRootArray && data.length > 0
        ? this.buildFieldTree(data[0])
        : typeof data === "object" && data !== null
        ? this.buildFieldTree(data)
        : [];

    const arrayPaths = this.findArrayPaths(fields);
    const financialPaths = this.findFinancialTimeSeriesPaths(data);

    const hasArrays = arrayPaths.length > 0;
    const hasFinancialTimeSeries = financialPaths.length > 0;

    let allowedModes: Array<"card" | "table" | "chart">;

    if (isRootArray) {
      // Case 3: Root is array - only table and chart
      allowedModes = ["table", "chart"];
    } else if (hasArrays || hasFinancialTimeSeries) {
      // Case 2 & 4: Has arrays or financial data - only table and chart
      allowedModes = ["table", "chart"];
    } else {
      // Case 1: Pure object - only card
      allowedModes = ["card"];
    }

    return {
      isRootArray,
      hasArrays,
      hasFinancialTimeSeries,
      arrayPaths,
      financialPaths,
      allowedModes,
    };
  }
}
