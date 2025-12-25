import type { WidgetType } from "../types/widget";

export const WIDGET_DEFAULT_LAYOUTS: Record<
  WidgetType,
  {
    w: number;
    h: number;
    minW: number;
    minH: number;
  }
> = {
  card: {
    w: 4,
    h: 3,
    minW: 2,
    minH: 2,
  },
  table: {
    w: 4,
    h: 6,
    minW: 4,
    minH: 3,
  },
  chart: {
    w: 6,
    h: 4,
    minW: 4,
    minH: 3,
  },
};

export const GRID_CONFIG = {
  cols: {
    lg: 12,
    md: 10,
    sm: 6,
    xs: 4,
    xxs: 2,
  },
  breakpoints: {
    lg: 1200,
    md: 996,
    sm: 768,
    xs: 480,
    xxs: 0,
  },
  rowHeight: 60,
  margin: [16, 16] as [number, number],
  containerPadding: [16, 16] as [number, number],
} as const;

export function getDefaultLayout(
  type: WidgetType,
  options?: {
    fieldCount?: number;
  }
) {
  const baseLayout = WIDGET_DEFAULT_LAYOUTS[type];

  if (type === "table" && options?.fieldCount) {
    const { fieldCount } = options;
    const dynamicWidth = Math.min(
      12,
      Math.max(baseLayout.minW, Math.ceil(fieldCount * 2))
    );
    const dynamicHeight = Math.min(
      8,
      Math.max(baseLayout.minH, baseLayout.h + Math.floor(fieldCount / 3))
    );

    return {
      x: 0,
      y: 0,
      ...baseLayout,
      w: dynamicWidth,
      h: dynamicHeight,
    };
  }

  if (type === "card" && options?.fieldCount) {
    const { fieldCount } = options;
    const dynamicHeight = Math.min(
      10,
      Math.max(baseLayout.minH, Math.ceil(fieldCount * 0.5) + 2)
    );

    return {
      x: 0,
      y: 0,
      ...baseLayout,
      h: dynamicHeight,
    };
  }

  return {
    x: 0,
    y: 0,
    ...baseLayout,
  };
}
