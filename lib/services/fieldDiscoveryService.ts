/**
 * Field Discovery Service
 * Analyzes API responses and builds field trees
 */

import type {
  FieldNode,
  FieldType,
  FieldDiscoveryResult,
  PrimitiveType,
  ComplexType,
  SelectedField,
} from "../types/field";

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

    // Check if string value looks like a date
    if (jsType === "string" && this.isDateString(value as string)) {
      return "date";
    }

    return jsType as FieldType;
  }

  /**
   * Checks if a string value looks like a date
   */
  private static isDateString(value: string): boolean {
    // Check for common date formats
    const datePatterns = [
      /^\d{4}-\d{2}-\d{2}/, // ISO date: 2024-12-25
      /^\d{4}\/\d{2}\/\d{2}/, // US date: 2024/12/25
      /^\d{2}\/\d{2}\/\d{4}/, // US date: 12/25/2024
      /^\d{2}-\d{2}-\d{4}/, // EU date: 25-12-2024
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, // ISO datetime
    ];

    // Check if it matches any date pattern
    if (datePatterns.some((pattern) => pattern.test(value))) {
      const date = new Date(value);
      // Verify it's a valid date
      return !isNaN(date.getTime());
    }

    return false;
  }

  /**
   * Checks if a type is primitive (leaf node)
   */
  static isPrimitive(type: FieldType): type is PrimitiveType {
    return ["string", "number", "boolean", "null", "date"].includes(type);
  }

  /**
   * Checks if a type is complex (has children)
   */
  static isComplex(type: FieldType): type is ComplexType {
    return ["object", "array"].includes(type);
  }

  /**
   * Builds a hierarchical field tree from an object
   */
  static buildFieldTree(obj: any, prefix = ""): FieldNode[] {
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
   * Checks if a path is a descendant of another path
   */
  static isDescendantOf(childPath: string, parentPath: string): boolean {
    return childPath.startsWith(parentPath + ".");
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
   * Creates SelectedFields from field paths
   */
  static createSelectedFieldsFromPaths(
    paths: string[],
    allFields: FieldNode[]
  ): SelectedField[] {
    return paths.map((path, index) => {
      const field = this.findFieldByPath(allFields, path);
      if (field) {
        return this.createSelectedField(field, index);
      }
      // Fallback if field not found
      const name = path.split(".").pop() || path;
      return {
        path,
        name,
        type: "string" as FieldType,
        label: name,
        order: index,
      };
    });
  }

  /**
   * Extracts paths from SelectedFields
   */
  static extractPaths(selectedFields: SelectedField[]): string[] {
    return selectedFields.map((field) => field.path);
  }

  /**
   * Validates selected fields
   */
  static validateSelectedFields(
    selectedFields: SelectedField[],
    allFields: FieldNode[]
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const allPaths = this.getAllPaths(allFields);

    for (const selected of selectedFields) {
      if (!allPaths.includes(selected.path)) {
        errors.push(`Field path "${selected.path}" does not exist`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
