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
import type { WidgetData, WidgetConfig } from "../types/widget";
import { FieldDiscoveryService } from "./fieldDiscoveryService";
import {
  flattenObject,
  getNestedValue,
  isFinancialTimeSeries,
  normalizeFinancialTimeSeries,
} from "../utils/dataTransform";

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
  private static lastRequestTime: Map<string, number> = new Map();
  private static readonly MIN_REQUEST_INTERVAL = 1000; // 1 second minimum between requests

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
    // Rate limiting check
    const lastRequest = this.lastRequestTime.get(widgetId);
    const now = Date.now();
    if (lastRequest && now - lastRequest < this.MIN_REQUEST_INTERVAL) {
      const waitTime = this.MIN_REQUEST_INTERVAL - (now - lastRequest);
      return {
        success: false,
        error: `Rate limit: Please wait ${Math.ceil(
          waitTime / 1000
        )}s before next request`,
      };
    }

    this.lastRequestTime.set(widgetId, now);

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

      let dataToProcess = rawData;

      // Check if this is financial time-series data
      const financialDataPath = (
        config as WidgetConfig & { financialDataPath?: string }
      ).financialDataPath;
      if (financialDataPath) {
        const financialData = getNestedValue(rawData, financialDataPath);
        if (isFinancialTimeSeries(financialData)) {
          // Normalize financial time series to array format
          dataToProcess = normalizeFinancialTimeSeries(
            financialData as Record<string, Record<string, unknown>>
          );
        }
      }

      // Transform raw data into WidgetData format
      const widgetData: WidgetData = {
        records: Array.isArray(dataToProcess)
          ? dataToProcess.map((item) => flattenObject(item))
          : [flattenObject(dataToProcess)],
        totalCount: Array.isArray(dataToProcess) ? dataToProcess.length : 1,
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
   * Starts background polling for a widget
   */
  static startPolling(
    widgetId: string,
    config: WidgetConfig,
    onUpdate: (data: WidgetData) => void,
    onError: (error: string) => void
  ): void {
    // Skip if already polling
    if (this.isPolling(widgetId)) {
      return;
    }

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
