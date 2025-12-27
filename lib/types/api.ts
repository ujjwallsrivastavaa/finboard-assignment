/**
 * API Type Definitions
 * Type system for API testing and validation
 */

/**
 * HTTP methods supported for API requests
 */
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * Authentication types
 */
export type AuthType = "none" | "bearer" | "api-key" | "basic";

/**
 * Bearer token authentication
 */
export interface BearerAuth {
  type: "bearer";
  token: string;
}

/**
 * API Key authentication
 */
export interface ApiKeyAuth {
  type: "api-key";
  /** Header name (e.g., 'X-API-Key', 'Authorization') */
  headerName: string;
  /** API key value */
  apiKey: string;
}

/**
 * Basic authentication
 */
export interface BasicAuth {
  type: "basic";
  username: string;
  password: string;
}

/**
 * No authentication
 */
export interface NoAuth {
  type: "none";
}

/**
 * Union type for all authentication methods
 */
export type ApiAuthentication = NoAuth | BearerAuth | ApiKeyAuth | BasicAuth;

/**
 * API test configuration
 */
export interface ApiTestConfig {
  /** API endpoint URL */
  endpoint: string;

  /** HTTP method to use */
  method?: HttpMethod;

  /** Authentication configuration */
  authentication?: ApiAuthentication;

  /** Request headers (will be merged with auth headers) */
  headers?: Record<string, string>;

  /** Request body for POST/PUT/PATCH */
  body?: Record<string, unknown>;

  /** Timeout in milliseconds */
  timeout?: number;
}
/**
 * Success result from API test
 */
export interface ApiTestSuccess {
  success: true;
  message: string;
  data: unknown;
  fields: string[];
  statusCode: number;
  responseTime: number;
}

/**
 * Error result from API test
 */
export interface ApiTestError {
  success: false;
  message: string;
  statusCode?: number;
  error?: Error;
}

/**
 * Result type for API testing
 */
export type ApiTestResult = ApiTestSuccess | ApiTestError;

/**
 * API validation rules
 */
export interface ApiValidationRules {
  /** Require HTTPS */
  requireHttps?: boolean;

  /** Allowed domains (whitelist) */
  allowedDomains?: string[];

  /** Blocked domains (blacklist) */
  blockedDomains?: string[];

  /** Maximum response size in bytes */
  maxResponseSize?: number;

  /** Minimum required fields */
  minFields?: number;
}
