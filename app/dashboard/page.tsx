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
    updateWidgetStatus,
    exportWidget,
    exportAllWidgets,
    importWidget,
  } = useDashboardStore();

  // Track which widgets are already polling to avoid duplicates
  const pollingWidgetsRef = useRef<Set<string>>(new Set());
  const widgetIdsRef = useRef<string[]>([]);

  // Start polling for all widgets on mount and when new widgets are added
  useEffect(() => {
    const currentWidgetIds = widgets.map((w) => w.id);
    const pollingSet = pollingWidgetsRef.current;
    const previousWidgetIds = widgetIdsRef.current;

    const newWidgets = widgets.filter(
      (widget) => !previousWidgetIds.includes(widget.id)
    );

    // Update the ref
    widgetIdsRef.current = currentWidgetIds;

    // Only set up polling for new widgets
    newWidgets.forEach((widget) => {
      // Skip if already polling
      if (pollingSet.has(widget.id)) {
        return;
      }

      if (widget.config.refreshInterval && widget.config.refreshInterval > 0) {
        pollingSet.add(widget.id);

        ApiService.startPolling(
          widget.id,
          widget.config,
          (data) => {
            setWidgetData(widget.id, data);
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

    // Cleanup: stop polling for removed widgets
    return () => {
      const removedWidgetIds = Array.from(pollingSet).filter(
        (id) => !currentWidgetIds.includes(id)
      );
      removedWidgetIds.forEach((id) => {
        ApiService.stopPolling(id);
        pollingSet.delete(id);
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

  const handleExportWidget = (widgetId: string) => {
    try {
      const jsonData = exportWidget(widgetId);
      const blob = new Blob([jsonData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      // Generate timestamp in the callback to avoid impure function call during render
      link.download = `widget-${widgetId}-${new Date().getTime()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Widget exported successfully");
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
    input.accept = "application/json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        const isMultiple = parsed.widgets && Array.isArray(parsed.widgets);
        const count = isMultiple ? parsed.widgets.length : 1;

        importWidget(text);
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

  const handleExportAllWidgets = () => {
    try {
      const jsonData = exportAllWidgets();
      const blob = new Blob([jsonData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `all-widgets-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`Exported ${widgets.length} widgets successfully`);
    } catch (error) {
      toast.error(
        `Failed to export widgets: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      \n{" "}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 mt-1">Manage your financial widgets</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportAllWidgets}
            disabled={widgets.length === 0}
            className="rounded-lg px-4 py-2 text-sm font-medium text-emerald-300 bg-emerald-900/30 hover:bg-emerald-800/40 border border-emerald-600/50 hover:border-emerald-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Export All
          </button>
          <button
            onClick={handleImportWidget}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600/50 hover:border-slate-500/50 transition-colors"
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
              className="rounded-lg border border-slate-700/50 bg-slate-800/30 shadow-xl backdrop-blur-sm hover:border-slate-600/50 transition-colors overflow-hidden flex flex-col"
            >
              <div className="flex cursor-move items-center justify-between border-b border-slate-700/50 bg-slate-900/50 px-4 py-3">
                <h3 className="font-semibold text-white">{widget.title}</h3>
                <div className="flex gap-2">
                  <AddWidgetDialog
                    title="Edit Widget"
                    editWidget={widget}
                    triggerButton={
                      <button className="rounded px-3 py-1 text-sm text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/40 transition-colors">
                        Edit
                      </button>
                    }
                  />
                  <button
                    onClick={() => handleExportWidget(widget.id)}
                    className="rounded px-3 py-1 text-sm text-blue-400 hover:bg-blue-500/10 border border-blue-500/20 hover:border-blue-500/40 transition-colors"
                  >
                    Export
                  </button>
                  <button
                    onClick={() => removeWidget(widget.id)}
                    className="rounded px-3 py-1 text-sm text-red-400 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/40 transition-colors"
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
        <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-slate-700/50 bg-slate-800/20">
          <div className="text-center">
            <p className="mb-4 text-slate-400 text-lg">No widgets yet</p>
            <AddWidgetDialog title="Add your first widget" />
          </div>
        </div>
      )}
    </div>
  );
}
