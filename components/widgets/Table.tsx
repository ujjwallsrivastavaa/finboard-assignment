"use client";

import { useEffect, useCallback, useState } from "react";
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
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatValue } from "@/lib/utils/formatters";

interface TableWidgetProps {
  widget: Widget;
}

type SortDirection = "asc" | "desc" | null;

interface SortState {
  field: string | null;
  direction: SortDirection;
}

export default function TableWidget({ widget }: TableWidgetProps) {
  const { setWidgetData, updateWidgetStatus } = useDashboardStore();
  const [sortState, setSortState] = useState<SortState>({
    field: null,
    direction: null,
  });

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
  }, [
    widget.data,
    widget.status,
    widget.config.refreshInterval,
    widget.config.socketUrl,
    fetchData,
  ]);

  const handleRefresh = () => {
    fetchData();
  };

  // Check if a field is sortable based on its type
  const isFieldSortable = (fieldPath: string): boolean => {
    const field = fields.find((f) => f.path === fieldPath);
    if (!field) return false;

    // Sortable types: number, date
    return field.type === "number" || field.type === "date";
  };

  // Handle sort click
  const handleSort = (fieldPath: string) => {
    if (!isFieldSortable(fieldPath)) return;

    setSortState((prev) => {
      if (prev.field !== fieldPath) {
        return { field: fieldPath, direction: "asc" };
      }
      if (prev.direction === "asc") {
        return { field: fieldPath, direction: "desc" };
      }
      if (prev.direction === "desc") {
        return { field: null, direction: null };
      }
      return { field: fieldPath, direction: "asc" };
    });
  };

  // Sort the records
  const getSortedRecords = () => {
    if (!widget.data || !sortState.field || !sortState.direction) {
      return widget.data?.records || [];
    }

    const field = fields.find((f) => f.path === sortState.field);
    if (!field) return widget.data.records;

    const sorted = [...widget.data.records].sort((a, b) => {
      const aVal = a[sortState.field!];
      const bVal = b[sortState.field!];

      // Handle null/undefined
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      // Sort based on field type
      if (field.type === "number") {
        const aNum = Number(aVal);
        const bNum = Number(bVal);
        return sortState.direction === "asc" ? aNum - bNum : bNum - aNum;
      }

      if (field.type === "date") {
        const aDate = new Date(aVal as string);
        const bDate = new Date(bVal as string);
        return sortState.direction === "asc"
          ? aDate.getTime() - bDate.getTime()
          : bDate.getTime() - aDate.getTime();
      }

      // Fallback to string comparison
      const aStr = String(aVal);
      const bStr = String(bVal);
      return sortState.direction === "asc"
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });

    return sorted;
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

  const sortedRecords = getSortedRecords();

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="bg-card/50 border-b border-border">
        <TableUI>
          <TableHeader>
            <TableRow className="hover:bg-accent/50">
              {fields.map((field) => {
                const sortable = isFieldSortable(field.path);
                const isActive = sortState.field === field.path;

                return (
                  <TableHead
                    key={field.path}
                    className={`text-emerald-400 font-semibold text-xs uppercase tracking-wide bg-card/50 py-3 ${
                      sortable
                        ? "cursor-pointer select-none hover:bg-accent/30 transition-colors"
                        : ""
                    }`}
                    onClick={() => sortable && handleSort(field.path)}
                  >
                    <div className="flex items-center gap-2">
                      <span>{field.name}</span>
                      {sortable && (
                        <span className="flex flex-col items-center justify-center">
                          {!isActive && (
                            <ArrowUpDown className="w-3 h-3 text-muted-foreground/50" />
                          )}
                          {isActive && sortState.direction === "asc" && (
                            <ArrowUp className="w-3 h-3 text-emerald-400" />
                          )}
                          {isActive && sortState.direction === "desc" && (
                            <ArrowDown className="w-3 h-3 text-emerald-400" />
                          )}
                        </span>
                      )}
                    </div>
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
        </TableUI>
      </div>
      <div className="flex-1 overflow-auto">
        <TableUI>
          <TableBody>
            {sortedRecords.map((record, index) => (
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
