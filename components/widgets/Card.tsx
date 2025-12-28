"use client";

import { useEffect, useCallback } from "react";
import { ApiService } from "@/lib/services";
import { useDashboardStore } from "@/lib/store/useDashboardStore";
import type { Widget } from "@/lib/types/widget";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatValue } from "@/lib/utils/formatters";

interface CardWidgetProps {
  widget: Widget;
}

export default function CardWidget({ widget }: CardWidgetProps) {
  const { setWidgetData, updateWidgetStatus } = useDashboardStore();

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
    // Only fetch if we don't have data yet AND not using polling or sockets
    // If refreshInterval or socketUrl is set, the dashboard will handle updates
    const isPolling =
      widget.config.refreshInterval && widget.config.refreshInterval > 0;
    const hasSocket = !!widget.config.socketUrl;

    if (!widget.data && widget.status === "idle" && !isPolling && !hasSocket) {
      fetchData();
    }
  }, [widget.data, widget.status, widget.config.refreshInterval, widget.config.socketUrl, fetchData]);

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

  // Get the first record for card display
  const record = widget.data.records[0];

  // Get selected fields from config
  const fields =
    widget.config.type === "card" || widget.config.type === "table"
      ? widget.config.fields
      : [];

  return (
    <div className="overflow-auto p-4">
      <div className="space-y-3">
        {fields.map((field) => {
          const value = record[field.path];
          return (
            <div
              key={field.path}
              className="flex justify-between items-start gap-4 py-2 border-b border-border/50 last:border-0"
            >
              <span className="text-sm font-medium text-foreground/70 capitalize">
                {field.name}:
              </span>
              <span className="text-sm text-foreground font-semibold text-right">
                {formatValue(value, field.format)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
