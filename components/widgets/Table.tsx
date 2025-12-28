"use client";

import { useEffect, useCallback } from "react";
import {
  Table as TableUI,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApiService } from "@/lib/services";
import { useDashboardStore } from "@/lib/store/useDashboardStore";
import type { Widget } from "@/lib/types/widget";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatValue } from "@/lib/utils/formatters";

interface TableWidgetProps {
  widget: Widget;
}

export default function TableWidget({ widget }: TableWidgetProps) {
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
    // Only fetch if we don't have data yet AND not using polling
    // If refreshInterval is set, the dashboard will handle polling
    const isPolling =
      widget.config.refreshInterval && widget.config.refreshInterval > 0;
    if (!widget.data && widget.status === "idle" && !isPolling) {
      fetchData();
    }
  }, [widget.data, widget.status, widget.config.refreshInterval, fetchData]);

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

  // Get selected fields from config
  const fields =
    widget.config.type === "card" || widget.config.type === "table"
      ? widget.config.fields
      : [];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="bg-card/50 border-b border-border">
        <TableUI>
          <TableHeader>
            <TableRow className="hover:bg-accent/50">
              {fields.map((field) => (
                <TableHead
                  key={field.path}
                  className="text-emerald-400 font-semibold text-xs uppercase tracking-wide bg-card/50 py-3"
                >
                  {field.name}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
        </TableUI>
      </div>
      <div className="flex-1 overflow-auto">
        <TableUI>
          <TableBody>
            {widget.data.records.map((record, index) => (
              <TableRow
                key={index}
                className="hover:bg-accent/30 border-b border-border/30"
              >
                {fields.map((field) => {
                  const value = record[field.path];
                  return (
                    <TableCell
                      key={`${index}-${field.path}`}
                      className="text-foreground text-sm py-3"
                    >
                      {formatValue(value, field.format)}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </TableUI>
      </div>
    </div>
  );
}
