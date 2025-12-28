/**
 * Types Index
 * Central export point for all type definitions
 */

// Widget types
export type {
  Widget,
  WidgetInput,
  WidgetConfig,
  WidgetType,
  LayoutInput,
  WidgetUpdate,
  WidgetData,
  WidgetStatus,
  DataRecord,
  ChartConfig,
  ChartType,
} from "./widget";

// Field types
export type {
  FieldNode,
  FieldType,
  PrimitiveType,
  ComplexType,
  FieldTreeConfig,
  FieldDiscoveryResult,
  SelectedField,
  FieldSelectionConfig,
} from "./field";

// API types
export type {
  ApiTestConfig,
  ApiTestResult,
  ApiTestSuccess,
  ApiTestError,
  ApiValidationRules,
  HttpMethod,
  AuthType,
  ApiAuthentication,
  BearerAuth,
  ApiKeyAuth,
  BasicAuth,
  NoAuth,
} from "./api";

// Dashboard types
export type {
  DashboardState,
  DashboardActions,
  DashboardStore,
} from "./dashboard";

// Theme types
export type {
  Theme,
  ResolvedTheme,
  ThemeState,
  ThemeActions,
  ThemeStore,
} from "./theme";
