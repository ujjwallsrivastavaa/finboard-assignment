/**
 * React Grid Layout Integration Helpers
 * Utilities for integrating the dashboard store with react-grid-layout
 */

import type { Widget } from "@/lib/types/widget";
import { Layout } from "react-grid-layout";

/**
 * Convert widget layouts to react-grid-layout format
 * @param widgets - Array of widgets from the store
 * @returns Array of layouts compatible with react-grid-layout
 */
export function widgetsToLayouts(widgets: Widget[]): Layout {
  return widgets.map((widget) => widget.layout);
}
