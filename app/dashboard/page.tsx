"use client";

import { useEffect, useState, useRef } from "react";
import { Responsive, Layout } from "react-grid-layout";
import { useDashboardStore } from "@/lib/store/useDashboardStore";
import { widgetsToLayouts } from "@/lib/utils/gridLayoutHelpers";
import { GRID_CONFIG } from "@/lib/constants/widgetDefaults";
import AddWidgetDialog from "@/components/AddWidgetDialog";
import CardWidget from "@/components/widgets/Card";
import TableWidget from "@/components/widgets/Table";
import { ApiService } from "@/lib/services";
import { toast } from "sonner";

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [containerWidth, setContainerWidth] = useState(1200); // Default fallback
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);

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
  } = useDashboardStore();

  // Track which widgets are already polling to avoid duplicates
  const pollingWidgetsRef = useRef<Set<string>>(new Set());

  // Start polling for all widgets on mount and when new widgets are added
  useEffect(() => {
    if (!mounted) return;

    widgets.forEach((widget) => {
      // Skip if already polling
      if (pollingWidgetsRef.current.has(widget.id)) {
        return;
      }

      if (widget.config.refreshInterval && widget.config.refreshInterval > 0) {
        pollingWidgetsRef.current.add(widget.id);

        ApiService.startPolling(
          widget.id,
          widget.config,
          (data) => {
            setWidgetData(widget.id, data);
            updateWidgetStatus(widget.id, "success");
          },
          (error) => {
            updateWidgetStatus(widget.id, "error", error);
            toast.error(
              `Widget "${widget.title}" failed to fetch data: ${error}`
            );
          }
        );
      }
    });

    // Cleanup: stop all polling on unmount
    return () => {
      pollingWidgetsRef.current.clear();
      ApiService.stopAllPolling();
    };
  }, [mounted, widgets.length, setWidgetData, updateWidgetStatus]);

  const handleLayoutChange = (
    currentLayout: Layout,
    allLayouts: Partial<Record<"lg" | "md" | "sm" | "xs" | "xxs", Layout>>
  ) => {
    const currentLayouts = allLayouts.lg || currentLayout;
    updateAllWidgetLayouts(currentLayouts);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 mt-1">Manage your financial widgets</p>
        </div>
        <AddWidgetDialog title="Add Widget" />
      </div>

      <div className="w-full" ref={containerRef}>
        <Responsive
          className="layout"
          layouts={{ lg: widgetsToLayouts(widgets) }}
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
                <button
                  onClick={() => removeWidget(widget.id)}
                  className="rounded px-3 py-1 text-sm text-red-400 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/40 transition-colors"
                >
                  Remove
                </button>
              </div>
              <div className="flex-1 min-h-0">
                {widget.type === "card" && <CardWidget widget={widget} />}
                {widget.type === "table" && <TableWidget widget={widget} />}
                {widget.type === "chart" && (
                  <div className="flex items-center justify-center h-full min-h-[200px] text-slate-400">
                    Chart widget coming soon
                  </div>
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
