"use client";

import { useEffect, useState, useRef } from "react";
import { Responsive, Layout } from "react-grid-layout";
import { useDashboardStore } from "@/lib/store/useDashboardStore";
import { widgetsToLayouts } from "@/components/gridLayoutHelpers";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

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
  const { widgets, addWidget, removeWidget, updateAllWidgetLayouts } =
    useDashboardStore();

  const handleAddWidget = () => {
    addWidget({
      type: "table",
      title: `Widget ${widgets.length + 1}`,
      layout: {
        x: (widgets.length * 2) % 12,
        y: Infinity,
        w: 4,
        h: 4,
        minW: 4,
        minH: 4,
      },
      config: {
        apiEndpoint: "/api/mock-data",
        fields: ["name", "value", "status"],
        refreshInterval: 30000,
      },
      status: "idle",
    });
  };

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
        <Button
          onClick={handleAddWidget}
          className="rounded-lg bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 px-6 py-3 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
        >
          <Plus />
          Add Widget
        </Button>
      </div>

      <div className="w-full" ref={containerRef}>
        <Responsive
          className="layout"
          layouts={{ lg: widgetsToLayouts(widgets) }}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={60}
          width={containerWidth}
          onLayoutChange={handleLayoutChange}
        >
          {widgets.map((widget) => (
            <div
              key={widget.id}
              className="rounded-lg border border-slate-700/50 bg-slate-800/30 shadow-xl backdrop-blur-sm hover:border-slate-600/50 transition-colors"
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
              <div className="p-4">
                <div className="space-y-2 text-sm text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Type:</span>
                    <span className="text-emerald-400">{widget.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Status:</span>
                    <span className="text-blue-400">{widget.status}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-slate-500">Fields:</span>
                    <span className="text-slate-300">
                      {widget.config.fields.join(", ")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </Responsive>
      </div>

      {widgets.length === 0 && (
        <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-slate-700/50 bg-slate-800/20">
          <div className="text-center">
            <p className="mb-4 text-slate-400 text-lg">No widgets yet</p>
            <Button
              onClick={handleAddWidget}
              variant="ghost"
              className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
            >
              <Plus />
              Add your first widget
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
