"use client";

import { useEffect, useCallback, useRef } from "react";
import {
  createChart,
  ColorType,
  Time,
  LineSeries,
  LineData,
} from "lightweight-charts";
import type { IChartApi } from "lightweight-charts";
import { ApiService } from "@/lib/services";
import { useDashboardStore } from "@/lib/store/useDashboardStore";
import type { Widget } from "@/lib/types/widget";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LineChartProps {
  widget: Widget;
}

export default function LineChart({ widget }: LineChartProps) {
  const { setWidgetData, updateWidgetStatus } = useDashboardStore();
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  const fetchData = useCallback(async () => {
    updateWidgetStatus(widget.id, "loading");

    const result = await ApiService.fetchWidgetData(widget.id, widget.config);

    if (result.success && result.data) {
      setWidgetData(widget.id, result.data);
      updateWidgetStatus(widget.id, "success");
    } else {
      updateWidgetStatus(widget.id, "error", result.error);
    }
  }, [widget.id, widget.config, setWidgetData, updateWidgetStatus]);

  useEffect(() => {
    // Only fetch if we don't have data yet AND not using polling
    // If refreshInterval is set, the dashboard will handle polling
    const isPolling =
      widget.config.refreshInterval && widget.config.refreshInterval > 0;
    if (!widget.data && widget.status === "idle" && !isPolling) {
      fetchData();
    }
  }, [widget.data, widget.status, widget.config.refreshInterval, fetchData]);

  useEffect(() => {
    if (
      !chartContainerRef.current ||
      !widget.data ||
      widget.config.type !== "chart"
    ) {
      return;
    }

    const chartConfig = widget.config.chartConfig;
    if (chartConfig?.type !== "line") {
      return;
    }

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#94a3b8",
      },
      grid: {
        vertLines: { color: "#334155" },
        horzLines: { color: "#334155" },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    });
    chartRef.current = chart;

    // Add line series for yAxis
    const yAxisConfig = chartConfig.yAxis;
    const lineColor = getDefaultColor(0);
    const lineSeries = chart.addSeries(LineSeries, {
      color: lineColor,
      lineWidth: 2,
      title: yAxisConfig.name || yAxisConfig.path,
    });

    // Transform data for line chart
    const lineData: LineData[] = widget.data.records
      .map((record) => {
        const timeValue = record[chartConfig.xAxis.path];
        const time: Time =
          chartConfig.xAxis.type === "date"
            ? (Math.floor(new Date(String(timeValue)).getTime() / 1000) as Time)
            : (String(timeValue) as Time);

        const value = Number(record[yAxisConfig.path]);

        return {
          time,
          value,
          isValid: !isNaN(value),
        };
      })
      .filter(
        (item): item is LineData & { isValid: boolean } =>
          (item as LineData & { isValid: boolean }).isValid
      )
      .map(({ time, value }) => ({
        time,
        value,
      }))
      .sort((a, b) => {
        if (typeof a.time === "number" && typeof b.time === "number") {
          return a.time - b.time;
        }
        return String(a.time).localeCompare(String(b.time));
      });

    lineSeries.setData(lineData);
    chart.timeScale().fitContent();
    chart.timeScale().fitContent();

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    if (chartContainerRef.current) {
      resizeObserver.observe(chartContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [widget.data, widget.config]);

  const handleRefresh = () => {
    fetchData();
  };

  if (widget.status === "loading") {
    return (
      <div className="flex items-center justify-center h-full min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (widget.status === "error") {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[200px] gap-4 p-6">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-sm text-red-400 text-center">{widget.error}</p>
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </Button>
      </div>
    );
  }

  if (!widget.data || widget.data.records.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[200px] text-muted-foreground">
        No data available
      </div>
    );
  }

  return (
    <div className="h-full w-full p-4">
      <div ref={chartContainerRef} className="w-full h-full" />
    </div>
  );
}

// Helper function to get default colors for multiple lines
function getDefaultColor(index: number): string {
  const colors = [
    "#3b82f6", // blue
    "#10b981", // green
    "#f59e0b", // amber
    "#ef4444", // red
    "#8b5cf6", // violet
    "#ec4899", // pink
    "#06b6d4", // cyan
  ];
  return colors[index % colors.length];
}
