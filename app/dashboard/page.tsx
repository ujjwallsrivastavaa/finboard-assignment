"use client";

import { useEffect, useState, useRef } from "react";
import { Responsive, Layout } from "react-grid-layout";
import { useDashboardStore } from "@/lib/store/useDashboardStore";
import { GRID_CONFIG } from "@/lib/constants/widgetDefaults";
import AddWidgetDialog from "@/components/AddWidgetDialog";
import CardWidget from "@/components/widgets/Card";
import TableWidget from "@/components/widgets/Table";
import { CandleStickCharts, LineChart } from "@/components/widgets/charts";
import { ApiService } from "@/lib/services";
import { toast } from "sonner";
import { SimpleThemeToggle } from "@/components/ThemeToggle";

export default function DashboardPage() {
  const [containerWidth, setContainerWidth] = useState(1200); // Default fallback
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Function to measure container width
    const measureWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setContainerWidth(width);
      }
    };

    // Initial measurement
    setTimeout(measureWidth, 100); // Small delay to ensure DOM is ready

    // Add resize listener
    const handleResize = () => {
      measureWidth();
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);
  const {
    widgets,
    removeWidget,
    updateAllWidgetLayouts,
    setWidgetData,
    appendWidgetData,
    updateWidgetStatus,
    exportWidget,
    exportAllWidgets,
    importWidget,
  } = useDashboardStore();

  // Track which widgets are already connected to avoid duplicates
  const connectedWidgetsRef = useRef<Set<string>>(new Set());
  const widgetIdsRef = useRef<string[]>([]);

  // Start data updates for all widgets on mount and when new widgets are added
  useEffect(() => {
    const currentWidgetIds = widgets.map((w) => w.id);
    const connectedSet = connectedWidgetsRef.current;
    const previousWidgetIds = widgetIdsRef.current;

    const newWidgets = widgets.filter(
      (widget) => !previousWidgetIds.includes(widget.id)
    );

    // Update the ref
    widgetIdsRef.current = currentWidgetIds;

    // Only set up data updates for new widgets
    newWidgets.forEach((widget) => {
      // Skip if already connected
      if (connectedSet.has(widget.id)) {
        return;
      }

      // Start data updates if socket URL is provided OR refresh interval is set
      if (
        widget.config.socketUrl ||
        (widget.config.refreshInterval && widget.config.refreshInterval > 0)
      ) {
        connectedSet.add(widget.id);

        ApiService.startDataUpdates(
          widget.id,
          widget.config,
          (data, isIncremental = false) => {
            if (isIncremental) {
              appendWidgetData(widget.id, data);
            } else {
              setWidgetData(widget.id, data);
            }
            updateWidgetStatus(widget.id, "success");
          },
          (error) => {
            updateWidgetStatus(widget.id, "error", error);
            // Only show toast for non-rate-limit errors
            if (!error.toLowerCase().includes("rate limit")) {
              toast.error(
                `Widget "${widget.title}" failed to fetch data: ${error}`
              );
            }
          }
        );
      }
    });

    // Cleanup: stop data updates for removed widgets
    return () => {
      const removedWidgetIds = Array.from(connectedSet).filter(
        (id) => !currentWidgetIds.includes(id)
      );
      removedWidgetIds.forEach((id) => {
        ApiService.stopDataUpdates(id);
        connectedSet.delete(id);
      });
    };
  }, [widgets, setWidgetData, updateWidgetStatus]);

  const handleLayoutChange = (
    currentLayout: Layout,
    allLayouts: Partial<Record<"lg" | "md" | "sm" | "xs" | "xxs", Layout>>
  ) => {
    const currentLayouts = allLayouts.lg || currentLayout;
    updateAllWidgetLayouts(currentLayouts);
  };

  const handleExportWidget = async (widgetId: string) => {
    try {
      const jsonData = await exportWidget(widgetId);
      const blob = new Blob([jsonData], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      // Generate timestamp in the callback to avoid impure function call during render
      link.download = `widget-${widgetId}-${new Date().getTime()}.enc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Widget exported successfully (encrypted)");
    } catch (error) {
      toast.error(
        `Failed to export widget: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const handleImportWidget = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "*/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();

        // Try to parse to get count (only works for decrypted/plain JSON)
        let count = 1;
        try {
          const parsed = JSON.parse(text);
          const isMultiple = parsed.widgets && Array.isArray(parsed.widgets);
          count = isMultiple ? parsed.widgets.length : 1;
        } catch {
          // Encrypted data won't parse, will be handled in importWidget
        }

        await importWidget(text);
        toast.success(
          `Successfully imported ${count} widget${count > 1 ? "s" : ""}`
        );
      } catch (error) {
        toast.error(
          `Failed to import widget: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    };
    input.click();
  };

  const handleExportAllWidgets = async () => {
    try {
      const jsonData = await exportAllWidgets();
      const blob = new Blob([jsonData], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `all-widgets-${Date.now()}.enc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(
        `Exported ${widgets.length} widgets successfully (encrypted)`
      );
    } catch (error) {
      toast.error(
        `Failed to export widgets: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 p-4 md:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage your financial widgets
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SimpleThemeToggle />
          <button
            onClick={handleExportAllWidgets}
            disabled={widgets.length === 0}
            className="rounded-lg px-4 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 hover:bg-emerald-200 dark:hover:bg-emerald-800/40 border border-emerald-300 dark:border-emerald-600/50 hover:border-emerald-400 dark:hover:border-emerald-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Export All
          </button>
          <button
            onClick={handleImportWidget}
            className="rounded-lg px-4 py-2 text-sm font-medium text-foreground bg-muted hover:bg-accent border border-border hover:border-border/80 transition-colors"
          >
            Import Widget
          </button>
          <AddWidgetDialog title="Add Widget" />
        </div>
      </div>
      <div className="w-full" ref={containerRef}>
        <Responsive
          className="layout"
          layouts={{ lg: widgets.map((widget) => widget.layout) }}
          breakpoints={GRID_CONFIG.breakpoints}
          cols={GRID_CONFIG.cols}
          rowHeight={GRID_CONFIG.rowHeight}
          margin={GRID_CONFIG.margin}
          containerPadding={GRID_CONFIG.containerPadding}
          width={containerWidth}
          onLayoutChange={handleLayoutChange}
        >
          {widgets.map((widget) => (
            <div
              key={widget.id}
              className="rounded-lg border border-border bg-card shadow-xl backdrop-blur-sm hover:border-border/80 transition-colors overflow-hidden flex flex-col"
            >
              <div className="flex cursor-move items-center justify-between border-b border-border bg-muted/50 px-4 py-3">
                <h3 className="font-semibold text-foreground">
                  {widget.title}
                </h3>
                <div className="flex gap-2">
                  <AddWidgetDialog
                    title="Edit Widget"
                    editWidget={widget}
                    triggerButton={
                      <button className="rounded px-3 py-1 text-sm text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/20 hover:border-emerald-400 dark:hover:border-emerald-500/40 transition-colors">
                        Edit
                      </button>
                    }
                  />
                  <button
                    onClick={() => handleExportWidget(widget.id)}
                    className="rounded px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/10 border border-blue-300 dark:border-blue-500/20 hover:border-blue-400 dark:hover:border-blue-500/40 transition-colors"
                  >
                    Export
                  </button>
                  <button
                    onClick={() => removeWidget(widget.id)}
                    className="rounded px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/10 border border-red-300 dark:border-red-500/20 hover:border-red-400 dark:hover:border-red-500/40 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <div className="flex-1 min-h-0">
                {widget.type === "card" && <CardWidget widget={widget} />}
                {widget.type === "table" && <TableWidget widget={widget} />}
                {widget.type === "chart" && widget.config.type === "chart" && (
                  <>
                    {widget.config.chartConfig.type === "candlestick" && (
                      <CandleStickCharts widget={widget} />
                    )}
                    {widget.config.chartConfig.type === "line" && (
                      <LineChart widget={widget} />
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </Responsive>
      </div>
      {widgets.length === 0 && (
        <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/20">
          <div className="text-center">
            <p className="mb-4 text-muted-foreground text-lg">No widgets yet</p>
            <AddWidgetDialog title="Add your first widget" />
          </div>
        </div>
      )}
    </div>
  );
}
