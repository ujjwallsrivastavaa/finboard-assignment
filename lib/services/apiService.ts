/**
 * API Service
 * Handles API endpoint testing, data fetching, and background polling
 */

import type {
  ApiTestConfig,
  ApiTestResult,
  ApiTestSuccess,
  ApiAuthentication,
} from "../types/api";
import type { Widget, WidgetData, WidgetConfig } from "../types/widget";
import { FieldDiscoveryService } from "./fieldDiscoveryService";

/**
 * Polling state management
 */
interface PollingState {
  intervalId: NodeJS.Timeout;
  widgetId: string;
  config: WidgetConfig;
}

/**
 * Service for API operations: testing, fetching, and background polling
 */
export class ApiService {
  private static pollingIntervals: Map<string, PollingState> = new Map();
  private static readonly DEFAULT_TIMEOUT = 10000; // 10 seconds
  private static readonly DEFAULT_HEADERS = {
    "Content-Type": "application/json",
  };

  /**
   * Builds authentication headers from configuration
   */
  private static buildAuthHeaders(
    auth?: ApiAuthentication
  ): Record<string, string> {
    if (!auth || auth.type === "none") {
      return {};
    }

    switch (auth.type) {
      case "bearer":
        return {
          Authorization: `Bearer ${auth.token}`,
        };

      case "api-key":
        return {
          [auth.headerName]: auth.apiKey,
        };

      case "basic": {
        const encoded = btoa(`${auth.username}:${auth.password}`);
        return {
          Authorization: `Basic ${encoded}`,
        };
      }

      default:
        return {};
    }
  }

  /**
   * Tests an API endpoint and discovers fields
   */
  static async test(config: ApiTestConfig): Promise<ApiTestResult> {
    const startTime = performance.now();

    // Basic URL validation
    try {
      new URL(config.endpoint);
    } catch {
      return {
        success: false,
        message: "Invalid URL format",
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        config.timeout || this.DEFAULT_TIMEOUT
      );

      // Build authentication headers
      const authHeaders = this.buildAuthHeaders(config.authentication);

      const response = await fetch(config.endpoint, {
        method: config.method || "GET",
        headers: {
          ...this.DEFAULT_HEADERS,
          ...authHeaders,
          ...config.headers,
        },
        body: config.body ? JSON.stringify(config.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          success: false,
          message: `API returned status ${response.status}: ${response.statusText}`,
          statusCode: response.status,
        };
      }

      const data = await response.json();
      const responseTime = performance.now() - startTime;

      // Discover fields
      const discovery = FieldDiscoveryService.discover(data);

      const result: ApiTestSuccess = {
        success: true,
        message: `API connection successful! ${discovery.totalFields} fields found.`,
        data,
        fields: discovery.paths,
        statusCode: response.status,
        responseTime: Math.round(responseTime),
        isArray: Array.isArray(data),
      };

      return result;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          return {
            success: false,
            message: "Request timed out",
            error,
          };
        }

        return {
          success: false,
          message: error.message,
          error,
        };
      }

      return {
        success: false,
        message: "Failed to connect to API",
      };
    }
  }

  /**
   * Fetches data for a widget
   */
  static async fetchWidgetData(
    widgetId: string,
    config: WidgetConfig
  ): Promise<{ success: boolean; data?: WidgetData; error?: string }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.DEFAULT_TIMEOUT
      );

      // Build authentication headers
      const authHeaders = this.buildAuthHeaders(config.authentication);

      const response = await fetch(config.apiEndpoint, {
        method: config.method || "GET",
        headers: {
          ...this.DEFAULT_HEADERS,
          ...authHeaders,
          ...config.headers,
        },
        body: config.body ? JSON.stringify(config.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          success: false,
          error: `API returned status ${response.status}: ${response.statusText}`,
        };
      }

      const rawData = await response.json();

      // Transform raw data into WidgetData format
      const widgetData: WidgetData = {
        records: Array.isArray(rawData)
          ? rawData.map((item) => this.flattenObject(item))
          : [this.flattenObject(rawData)],
        totalCount: Array.isArray(rawData) ? rawData.length : 1,
        fetchedAt: Date.now(),
        metadata: {
          source: config.apiEndpoint,
        },
      };

      return {
        success: true,
        data: widgetData,
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          return {
            success: false,
            error: "Request timed out",
          };
        }

        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: false,
        error: "Failed to fetch data",
      };
    }
  }

  /**
   * Flattens nested objects into dot-notation records
   */
  private static flattenObject(
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
        Object.assign(result, this.flattenObject(value, newKey));
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
   * Starts background polling for a widget
   */
  static startPolling(
    widgetId: string,
    config: WidgetConfig,
    onUpdate: (data: WidgetData) => void,
    onError: (error: string) => void
  ): void {
    // Stop existing polling if any
    this.stopPolling(widgetId);

    // Fetch immediately
    this.fetchWidgetData(widgetId, config).then((result) => {
      if (result.success && result.data) {
        onUpdate(result.data);
      } else if (result.error) {
        onError(result.error);
      }
    });

    // Set up interval if refreshInterval is specified
    if (config.refreshInterval && config.refreshInterval > 0) {
      const intervalId = setInterval(async () => {
        const result = await this.fetchWidgetData(widgetId, config);

        if (result.success && result.data) {
          onUpdate(result.data);
        } else if (result.error) {
          onError(result.error);
        }
      }, config.refreshInterval);

      this.pollingIntervals.set(widgetId, {
        intervalId,
        widgetId,
        config,
      });
    }
  }

  /**
   * Stops background polling for a widget
   */
  static stopPolling(widgetId: string): void {
    const state = this.pollingIntervals.get(widgetId);
    if (state) {
      clearInterval(state.intervalId);
      this.pollingIntervals.delete(widgetId);
    }
  }

  /**
   * Stops all background polling
   */
  static stopAllPolling(): void {
    for (const [widgetId] of this.pollingIntervals) {
      this.stopPolling(widgetId);
    }
  }

  /**
   * Gets active polling widgets
   */
  static getPollingWidgets(): string[] {
    return Array.from(this.pollingIntervals.keys());
  }

  /**
   * Checks if a widget is currently polling
   */
  static isPolling(widgetId: string): boolean {
    return this.pollingIntervals.has(widgetId);
  }
}
