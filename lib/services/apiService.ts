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
import { io, Socket } from "socket.io-client";

/**
 * Polling state management
 */
interface PollingState {
  intervalId: NodeJS.Timeout;
  widgetId: string;
  config: WidgetConfig;
}

/**
 * Socket connection state management (supports both WebSocket and Socket.IO)
 */
interface SocketState {
  socket: Socket | WebSocket;
  widgetId: string;
  config: WidgetConfig;
  reconnectAttempts: number;
  reconnectTimeoutId?: NodeJS.Timeout;
  type: "socket.io" | "websocket";
}

/**
 * Service for API operations: testing, fetching, and background polling/socket updates
 */
export class ApiService {
  private static pollingIntervals: Map<string, PollingState> = new Map();
  private static socketConnections: Map<string, SocketState> = new Map();
  private static readonly DEFAULT_TIMEOUT = 10000; // 10 seconds
  private static readonly DEFAULT_HEADERS = {
    "Content-Type": "application/json",
  };
  private static lastRequestTime: Map<string, number> = new Map();
  private static readonly MIN_REQUEST_INTERVAL = 1000; // 1 second minimum between requests
  private static readonly MAX_RECONNECT_ATTEMPTS = 5;
  private static readonly RECONNECT_DELAY_BASE = 2000; // 2 seconds base delay

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
    onError: (error: string) => void,
    skipInitialFetch = false
  ): void {
    // Skip if already polling
    if (this.isPolling(widgetId)) {
      return;
    }

    // Fetch immediately unless skipInitialFetch is true
    if (!skipInitialFetch) {
      this.fetchWidgetData(widgetId, config).then((result) => {
        if (result.success && result.data) {
          onUpdate(result.data);
        } else if (result.error) {
          onError(result.error);
        }
      });
    }

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

  /**
   * Starts data updates for a widget - uses WebSocket if available, otherwise falls back to polling
   */
  static startDataUpdates(
    widgetId: string,
    config: WidgetConfig,
    onUpdate: (data: WidgetData) => void,
    onError: (error: string) => void
  ): void {
    // First, fetch initial data via HTTP
    this.fetchWidgetData(widgetId, config).then((result) => {
      if (result.success && result.data) {
        onUpdate(result.data);

        // After initial fetch, start WebSocket if available, otherwise use polling
        if (config.socketUrl) {
          this.startSocket(widgetId, config, onUpdate, onError);
        } else if (config.refreshInterval && config.refreshInterval > 0) {
          // Skip initial fetch since we just fetched above
          this.startPolling(widgetId, config, onUpdate, onError, true);
        }
      } else if (result.error) {
        onError(result.error);
      }
    });
  }

  /**
   * Stops data updates for a widget (both socket and polling)
   */
  static stopDataUpdates(widgetId: string): void {
    this.stopSocket(widgetId);
    this.stopPolling(widgetId);
  }

  /**
   * Stops all data updates (both sockets and polling)
   */
  static stopAllDataUpdates(): void {
    this.stopAllSockets();
    this.stopAllPolling();
  }

  /**
   * Determines if the URL should use Socket.IO or plain WebSocket
   */
  private static shouldUseSocketIO(config: WidgetConfig): boolean {
    // Check if explicitly specified in config
    const socketType = (
      config as WidgetConfig & { socketType?: "socket.io" | "websocket" }
    ).socketType;
    if (socketType) {
      return socketType === "socket.io";
    }

    // Auto-detect: if URL doesn't start with ws:// or wss://, assume Socket.IO
    const url = config.socketUrl || "";
    return !url.startsWith("ws://") && !url.startsWith("wss://");
  }

  /**
   * Starts Socket connection for a widget (supports both Socket.IO and WebSocket)
   */
  private static startSocket(
    widgetId: string,
    config: WidgetConfig,
    onUpdate: (data: WidgetData) => void,
    onError: (error: string) => void
  ): void {
    // Skip if already connected
    if (this.isSocketConnected(widgetId)) {
      return;
    }

    if (!config.socketUrl) {
      onError("Socket URL not configured");
      return;
    }

    const useSocketIO = this.shouldUseSocketIO(config);
    console.log(
      `[Socket] Using ${
        useSocketIO ? "Socket.IO" : "WebSocket"
      } for widget: ${widgetId}`
    );

    if (useSocketIO) {
      this.startSocketIO(widgetId, config, onUpdate, onError);
    } else {
      this.startWebSocket(widgetId, config, onUpdate, onError);
    }
  }

  /**
   * Starts Socket.IO connection for a widget
   */
  private static startSocketIO(
    widgetId: string,
    config: WidgetConfig,
    onUpdate: (data: WidgetData) => void,
    onError: (error: string) => void
  ): void {
    try {
      // Create Socket.IO connection
      const socket = io(config.socketUrl!, {
        reconnection: true,
        reconnectionAttempts: this.MAX_RECONNECT_ATTEMPTS,
        reconnectionDelay: this.RECONNECT_DELAY_BASE,
        reconnectionDelayMax: this.RECONNECT_DELAY_BASE * 4,
      });

      console.log(`[Socket.IO] Connecting for widget: ${widgetId}`);

      const socketState: SocketState = {
        socket,
        widgetId,
        config,
        reconnectAttempts: 0,
        type: "socket.io",
      };

      this.socketConnections.set(widgetId, socketState);
      console.log(`[Socket.IO] Created for widget: ${widgetId}`);

      // Handle connection
      socket.on("connect", () => {
        console.log(`[Socket.IO] Connected for widget: ${widgetId}`);
        console.log(`[Socket.IO] Socket ID: ${socket.id}`);
        socketState.reconnectAttempts = 0;
      });

      // Handle stock updates from the server
      socket.on("stock_update", (data) => {
        console.log(
          `[Socket.IO] stock_update event received for widget: ${widgetId}`
        );
        this.handleSocketMessage(
          widgetId,
          config,
          data,
          onUpdate,
          onError,
          "socket.io"
        );
      });

      // Handle stream completion
      socket.on("stream_complete", (data) => {
        console.log(
          `[Socket.IO] Stream complete for widget ${widgetId}:`,
          data
        );
      });

      // Debug: log all events
      socket.onAny((eventName, ...args) => {
        console.log(`[Socket.IO] Event received: ${eventName}`, args);
      });

      // Handle errors
      socket.on("connect_error", (error) => {
        console.error(
          `[Socket.IO] Connection error for widget ${widgetId}:`,
          error
        );
        socketState.reconnectAttempts++;
        onError(`Socket.IO connection error: ${error.message}`);
      });

      // Handle disconnection
      socket.on("disconnect", (reason) => {
        console.log(
          `[Socket.IO] Disconnected for widget ${widgetId}, reason: ${reason}`
        );

        if (reason === "io server disconnect") {
          // Server disconnected, try to reconnect manually
          socket.connect();
        }

        // Check if max reconnect attempts reached
        if (socketState.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
          onError(
            "Max reconnection attempts reached. Falling back to polling."
          );
          this.socketConnections.delete(widgetId);

          // Fall back to polling if available
          if (config.refreshInterval && config.refreshInterval > 0) {
            this.startPolling(widgetId, config, onUpdate, onError);
          }
        }
      });

      // Handle reconnection attempts
      socket.io.on("reconnect_attempt", (attempt) => {
        console.log(
          `[Socket.IO] Reconnect attempt ${attempt} for widget ${widgetId}`
        );
        socketState.reconnectAttempts = attempt;
      });

      // Handle successful reconnection
      socket.io.on("reconnect", (attempt) => {
        console.log(
          `[Socket.IO] Reconnected after ${attempt} attempts for widget ${widgetId}`
        );
        socketState.reconnectAttempts = 0;
      });
    } catch (error) {
      console.error(
        `[Socket.IO] Failed to create connection for widget ${widgetId}:`,
        error
      );
      onError(
        error instanceof Error
          ? error.message
          : "Failed to create Socket.IO connection"
      );
    }
  }

  /**
   * Starts plain WebSocket connection for a widget
   */
  private static startWebSocket(
    widgetId: string,
    config: WidgetConfig,
    onUpdate: (data: WidgetData) => void,
    onError: (error: string) => void
  ): void {
    try {
      const socket = new WebSocket(config.socketUrl!);
      console.log(`[WebSocket] Connecting for widget: ${widgetId}`);

      const socketState: SocketState = {
        socket,
        widgetId,
        config,
        reconnectAttempts: 0,
        type: "websocket",
      };

      this.socketConnections.set(widgetId, socketState);
      console.log(`[WebSocket] Created for widget: ${widgetId}`);

      socket.onopen = () => {
        console.log(`[WebSocket] Connected for widget: ${widgetId}`);
        socketState.reconnectAttempts = 0;
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleSocketMessage(
            widgetId,
            config,
            data,
            onUpdate,
            onError,
            "websocket"
          );
        } catch (error) {
          console.error(
            `[WebSocket] Error parsing message for widget ${widgetId}:`,
            error
          );
          onError(
            error instanceof Error
              ? error.message
              : "Failed to parse WebSocket message"
          );
        }
      };

      socket.onerror = (error) => {
        console.error(`[WebSocket] Error for widget ${widgetId}:`, error);
        onError("WebSocket connection error");
      };

      socket.onclose = (event) => {
        console.log(
          `[WebSocket] Closed for widget ${widgetId}, code: ${event.code}`
        );
        this.socketConnections.delete(widgetId);

        // Attempt reconnection if not a normal closure
        if (
          event.code !== 1000 &&
          socketState.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS
        ) {
          this.scheduleWebSocketReconnect(
            widgetId,
            config,
            onUpdate,
            onError,
            socketState.reconnectAttempts
          );
        } else if (
          socketState.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS
        ) {
          onError(
            "Max reconnection attempts reached. Falling back to polling."
          );
          // Fall back to polling if available
          if (config.refreshInterval && config.refreshInterval > 0) {
            this.startPolling(widgetId, config, onUpdate, onError);
          }
        }
      };
    } catch (error) {
      console.error(
        `[WebSocket] Failed to create connection for widget ${widgetId}:`,
        error
      );
      onError(
        error instanceof Error
          ? error.message
          : "Failed to create WebSocket connection"
      );
    }
  }

  /**
   * Handles incoming socket messages (common for both Socket.IO and WebSocket)
   */
  private static handleSocketMessage(
    widgetId: string,
    config: WidgetConfig,
    data: unknown,
    onUpdate: (data: WidgetData, isIncremental?: boolean) => void,
    onError: (error: string) => void,
    transport: "socket.io" | "websocket"
  ): void {
    try {
      console.log(
        `[${
          transport === "socket.io" ? "Socket.IO" : "WebSocket"
        }] RAW Message received for widget ${widgetId}:`,
        JSON.stringify(data, null, 2)
      );

      // Process the data the same way as HTTP response
      let dataToProcess = data;

      // Check if this is financial time-series data
      const financialDataPath = (
        config as WidgetConfig & { financialDataPath?: string }
      ).financialDataPath;

      console.log(`[Socket] Financial data path:`, financialDataPath);

      if (financialDataPath) {
        const financialData = getNestedValue(data, financialDataPath);
        console.log(`[Socket] Financial data extracted:`, financialData);

        if (isFinancialTimeSeries(financialData)) {
          console.log(
            `[Socket] Detected as financial time series, normalizing...`
          );
          dataToProcess = normalizeFinancialTimeSeries(
            financialData as Record<string, Record<string, unknown>>
          );
          console.log(`[Socket] Normalized data:`, dataToProcess);
        } else {
          console.log(`[Socket] NOT detected as financial time series`);
        }
      } else {
        console.log(`[Socket] No financial data path configured`);
      }

      console.log(`[Socket] Data to process:`, dataToProcess);

      // Transform raw data into WidgetData format
      const records = Array.isArray(dataToProcess)
        ? dataToProcess.map((item) => flattenObject(item))
        : [flattenObject(dataToProcess)];

      console.log(`[Socket] Flattened records:`, records);

      const widgetData: WidgetData = {
        records,
        totalCount: Array.isArray(dataToProcess) ? dataToProcess.length : 1,
        fetchedAt: Date.now(),
        metadata: {
          source: config.socketUrl,
          transport,
        },
      };

      console.log(`[Socket] Final widget data to append:`, widgetData);

      // Pass true as second parameter to indicate this is incremental data that should be appended
      onUpdate(widgetData, true);
    } catch (error) {
      console.error(
        `[${
          transport === "socket.io" ? "Socket.IO" : "WebSocket"
        }] Error processing message for widget ${widgetId}:`,
        error
      );
      onError(
        error instanceof Error
          ? error.message
          : "Failed to process socket message"
      );
    }
  }

  /**
   * Schedules a WebSocket reconnection attempt with exponential backoff
   */
  private static scheduleWebSocketReconnect(
    widgetId: string,
    config: WidgetConfig,
    onUpdate: (data: WidgetData) => void,
    onError: (error: string) => void,
    attemptNumber: number
  ): void {
    const delay = this.RECONNECT_DELAY_BASE * Math.pow(2, attemptNumber);
    console.log(
      `[WebSocket] Scheduling reconnect for widget ${widgetId} in ${delay}ms (attempt ${
        attemptNumber + 1
      })`
    );

    const timeoutId = setTimeout(() => {
      const socketState = this.socketConnections.get(widgetId);
      if (socketState) {
        socketState.reconnectAttempts = attemptNumber + 1;
      }
      this.startWebSocket(widgetId, config, onUpdate, onError);
    }, delay);

    const socketState = this.socketConnections.get(widgetId);
    if (socketState) {
      socketState.reconnectTimeoutId = timeoutId;
    }
  }

  /**
   * Stops Socket connection for a widget (both Socket.IO and WebSocket)
   */
  private static stopSocket(widgetId: string): void {
    const state = this.socketConnections.get(widgetId);
    if (state) {
      // Clear any pending reconnection timeout
      if (state.reconnectTimeoutId) {
        clearTimeout(state.reconnectTimeoutId);
      }

      // Disconnect based on type
      if (state.type === "socket.io") {
        (state.socket as Socket).disconnect();
        console.log(`[Socket.IO] Stopped for widget: ${widgetId}`);
      } else {
        const ws = state.socket as WebSocket;
        if (
          ws.readyState === WebSocket.OPEN ||
          ws.readyState === WebSocket.CONNECTING
        ) {
          ws.close(1000, "Widget removed");
        }
        console.log(`[WebSocket] Stopped for widget: ${widgetId}`);
      }

      this.socketConnections.delete(widgetId);
    }
  }

  /**
   * Stops all WebSocket connections
   */
  private static stopAllSockets(): void {
    for (const [widgetId] of this.socketConnections) {
      this.stopSocket(widgetId);
    }
  }

  /**
   * Checks if a widget has an active Socket connection (Socket.IO or WebSocket)
   */
  static isSocketConnected(widgetId: string): boolean {
    const state = this.socketConnections.get(widgetId);
    if (!state) return false;

    if (state.type === "socket.io") {
      return (state.socket as Socket).connected;
    } else {
      return (state.socket as WebSocket).readyState === WebSocket.OPEN;
    }
  }

  /**
   * Gets all widgets with active WebSocket connections
   */
  static getSocketConnectedWidgets(): string[] {
    return Array.from(this.socketConnections.keys()).filter((widgetId) =>
      this.isSocketConnected(widgetId)
    );
  }

  /**
   * Gets connection info for a widget
   */
  static getConnectionInfo(widgetId: string): {
    type: "socket" | "polling" | "none";
    status: "connected" | "reconnecting" | "disconnected";
  } {
    const socketState = this.socketConnections.get(widgetId);
    if (socketState) {
      let isConnected = false;

      if (socketState.type === "socket.io") {
        isConnected = (socketState.socket as Socket).connected;
      } else {
        isConnected =
          (socketState.socket as WebSocket).readyState === WebSocket.OPEN;
      }

      const status = isConnected
        ? "connected"
        : socketState.reconnectAttempts > 0
        ? "reconnecting"
        : "disconnected";
      return { type: "socket", status };
    }

    const pollingState = this.pollingIntervals.get(widgetId);
    if (pollingState) {
      return { type: "polling", status: "connected" };
    }

    return { type: "none", status: "disconnected" };
  }
}
