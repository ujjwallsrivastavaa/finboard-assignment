"use client";

import { useEffect, useCallback, useRef } from "react";
import {
  createChart,
  ColorType,
  Time,
  CandlestickData,
} from "lightweight-charts";
import { IChartApi, CandlestickSeries } from "lightweight-charts";
import { ApiService } from "@/lib/services";
import { useDashboardStore } from "@/lib/store/useDashboardStore";
import type { Widget } from "@/lib/types/widget";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CandleStickChartsProps {
  widget: Widget;
}

export default function CandleStickCharts({ widget }: CandleStickChartsProps) {
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
    if (chartConfig?.type !== "candlestick") {
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

    // Add candlestick series
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#10b981",
      downColor: "#ef4444",
      borderVisible: true,
      wickVisible: true,
      borderUpColor: "#10b981",
      borderDownColor: "#ef4444",
      wickUpColor: "#10b981",
      wickDownColor: "#ef4444",
    });

    // Transform data for candlestick chart
    const candleData: CandlestickData[] = widget.data.records
      .map((record) => {
        const timeValue = record[chartConfig.xAxis.path];
        const time: Time =
          chartConfig.xAxis.type === "date"
            ? (Math.floor(new Date(String(timeValue)).getTime() / 1000) as Time)
            : (String(timeValue) as Time);

        const open = Number(record[chartConfig.open.path]);
        const high = Number(record[chartConfig.high.path]);
        const low = Number(record[chartConfig.low.path]);
        const close = Number(record[chartConfig.close.path]);

        return {
          time,
          open,
          high,
          low,
          close,
          isValid: !isNaN(open) && !isNaN(high) && !isNaN(low) && !isNaN(close),
        };
      })
      .filter(
        (item): item is CandlestickData & { isValid: boolean } =>
          (item as CandlestickData & { isValid: boolean }).isValid
      )
      .map(({ time, open, high, low, close }) => ({
        time,
        open,
        high,
        low,
        close,
      }))
      .sort((a, b) => {
        if (typeof a.time === "number" && typeof b.time === "number") {
          return a.time - b.time;
        }
        return String(a.time).localeCompare(String(b.time));
      });
    console.log("Candle Data:", candleData);
    candlestickSeries.setData(candleData);
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
      <div className="flex items-center justify-center h-full min-h-[200px] text-slate-400">
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
