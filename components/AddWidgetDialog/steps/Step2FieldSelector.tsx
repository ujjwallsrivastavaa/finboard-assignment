"use client";

import { useState, useMemo } from "react";
import { UseFormReturn } from "react-hook-form";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { DialogHeader, DialogTitle, DialogDescription } from "../../ui/dialog";
import { Button } from "../../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Label } from "../../ui/label";
import type { FieldNode } from "@/lib/types/field";
import ChartFieldSelector from "../components/ChartFieldSelector";
import { FieldDiscoveryService } from "@/lib/services/fieldDiscoveryService";
import { getNestedValue } from "@/lib/utils/dataTransform";
import type { SelectedField } from "@/lib/types/field";
import type { WidgetConfigForFormatting } from "@/lib/types/widget";
import { CardTableFieldSelector } from "../components/CardTableFieldSelector";
import type { ChartConfig } from "@/lib/types/chart";

interface Step2FieldSelectorProps {
  form: UseFormReturn<{
    widgetTitle: string;
    apiEndpoint: string;
    socketUrl?: string;
    refreshInterval: number;
    requiresAuth: boolean;
    authType: "none" | "bearer" | "api-key" | "basic";
    authToken?: string;
    authHeaderName?: string;
    authUsername?: string;
    authPassword?: string;
  }>;
  apiFields: FieldNode[];
  dataStructure: ReturnType<
    typeof FieldDiscoveryService.analyzeDataStructure
  > | null;
  rawApiData: unknown;
  initialSelectedFields?: SelectedField[];
  initialChartConfig?: ChartConfig;
  onBack: () => void;
  onProceedToFormatting: (
    fields: SelectedField[],
    config: WidgetConfigForFormatting
  ) => void;
  onSuccess: () => void;
}

export const Step2FieldSelector = ({
  form,
  apiFields,
  dataStructure,
  rawApiData,
  initialSelectedFields,
  initialChartConfig,
  onBack,
  onProceedToFormatting,
  onSuccess,
}: Step2FieldSelectorProps) => {
  // Determine initial display mode based on widget being edited or allowed modes
  const getInitialDisplayMode = (): "card" | "table" | "chart" => {
    // If editing a chart widget, start with chart mode
    if (initialChartConfig) {
      return "chart";
    }
    // If editing card/table with fields, determine from field count
    if (initialSelectedFields && initialSelectedFields.length > 0) {
      // If multiple fields, likely a table; single field likely a card
      return initialSelectedFields.length > 1 ? "table" : "card";
    }
    // Default to first allowed mode
    return dataStructure?.allowedModes?.[0] || "card";
  };

  const [displayMode, setDisplayMode] = useState<"card" | "table" | "chart">(
    getInitialDisplayMode()
  );

  // Get available data source options (arrays + financial time series)
  const dataSourceOptions = useMemo(() => {
    if (!dataStructure) return [];

    const options: Array<{
      path: string;
      name: string;
      type: "array" | "financial";
    }> = [];

    // Add array paths
    if (dataStructure.arrayPaths) {
      dataStructure.arrayPaths.forEach(
        (item: { path: string; name: string }) => {
          options.push({ ...item, type: "array" });
        }
      );
    }

    // Add financial time series paths
    if (dataStructure.financialPaths) {
      dataStructure.financialPaths.forEach(
        (item: { path: string; name: string }) => {
          options.push({ ...item, type: "financial" });
        }
      );
    }

    return options;
  }, [dataStructure]);

  // Derive initial selected data path
  const getInitialDataPath = () => {
    if (dataStructure?.isRootArray) {
      return null; // Root is already array, no selection needed
    }
    if (dataSourceOptions.length === 1) {
      return dataSourceOptions[0].path; // Auto-select if only one option
    }
    return null; // User must choose manually
  };

  // Track selected data source path (for arrays or financial time series)
  const [selectedDataPath, setSelectedDataPath] = useState<string | null>(
    getInitialDataPath
  );

  // Get fields to display based on selected data source
  const displayFields = useMemo(() => {
    if (!selectedDataPath) {
      return apiFields; // Use root fields
    }

    // Check if selected path is a financial time series
    const selectedOption = dataSourceOptions.find(
      (opt) => opt.path === selectedDataPath
    );
    const isFinancialSeries = selectedOption?.type === "financial";

    // Find the field node for the selected path
    const selectedField = FieldDiscoveryService.findFieldByPath(
      apiFields,
      selectedDataPath
    );

    if (selectedField?.children && !isFinancialSeries) {
      return selectedField.children;
    }

    // For financial time series, normalize and build fields including the date
    if (isFinancialSeries) {
      const nestedData = getNestedValue(rawApiData, selectedDataPath);
      if (
        nestedData &&
        typeof nestedData === "object" &&
        !Array.isArray(nestedData)
      ) {
        const firstEntry = Object.values(nestedData)[0];

        if (firstEntry && typeof firstEntry === "object") {
          const fields = FieldDiscoveryService.buildFieldTree(
            firstEntry as Record<string, unknown>
          );

          // Add the date field at the beginning
          const dateField: FieldNode = {
            name: "date",
            path: "date",
            type: "date",
          };

          return [dateField, ...fields];
        }
      }
    }

    return apiFields;
  }, [selectedDataPath, apiFields, rawApiData, dataSourceOptions]);

  const allowedModes = dataStructure?.allowedModes || [
    "card",
    "table",
    "chart",
  ];

  // Determine if selected data path is financial
  const isFinancialDataPath = useMemo(() => {
    if (!selectedDataPath) return false;
    const selectedOption = dataSourceOptions.find(
      (opt) => opt.path === selectedDataPath
    );
    return selectedOption?.type === "financial";
  }, [selectedDataPath, dataSourceOptions]);

  return (
    <motion.div
      key="step-2"
      initial={{ x: 80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -80, opacity: 0 }}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className="flex flex-col max-h-[90vh]"
    >
      <div className="w-full min-w-full flex flex-col max-h-[90vh]">
        <DialogHeader className="px-6 py-4 border-b border-border flex flex-row items-start justify-between gap-4 flex-shrink-0">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={onBack}
                className="p-1 hover:bg-accent rounded transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-muted-foreground" />
              </button>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
                Configure Fields
              </DialogTitle>
            </div>
            <DialogDescription className="text-muted-foreground ml-9">
              Select which fields to display and choose your display mode.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Data Source Selector - Show for arrays or financial time series */}
          {dataSourceOptions.length > 0 && !dataStructure?.isRootArray && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-foreground font-medium text-sm">
                  Data Source{" "}
                  {dataSourceOptions.length > 1 && (
                    <span className="text-emerald-400">*</span>
                  )}
                </Label>
                {dataSourceOptions.length > 1 && (
                  <span className="text-xs text-emerald-400">
                    {dataSourceOptions.length} options available
                  </span>
                )}
              </div>
              <Select
                value={selectedDataPath || ""}
                onValueChange={(value) => {
                  setSelectedDataPath(value);
                }}
              >
                <SelectTrigger
                  className={`bg-background border-border text-foreground ${
                    !selectedDataPath && dataSourceOptions.length > 1
                      ? "border-emerald-500/50 ring-1 ring-emerald-500/20"
                      : ""
                  }`}
                >
                  <SelectValue
                    placeholder={
                      dataSourceOptions.length > 1
                        ? "Please select a data source to continue..."
                        : "Select data source..."
                    }
                  />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {dataSourceOptions.map((option) => (
                    <SelectItem
                      key={option.path}
                      value={option.path}
                      className="text-popover-foreground focus:bg-accent focus:text-accent-foreground"
                    >
                      {option.path} (
                      {option.type === "array"
                        ? "Array"
                        : "Financial Time Series"}
                      )
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {selectedDataPath
                  ? `Using data from "${selectedDataPath}" for Table or Chart view`
                  : dataSourceOptions.length > 1
                  ? "⚠️ Multiple data sources detected - please select one to continue"
                  : "Select a data source to continue"}
              </p>
            </div>
          )}

          <div>
            <label className="text-foreground mb-3 block font-medium text-sm">
              Display Mode
            </label>
            <div className="flex gap-2">
              {[
                { mode: "card" as const, label: "Card" },
                { mode: "table" as const, label: "Table" },
                { mode: "chart" as const, label: "Chart" },
              ].map(({ mode, label }) => {
                const isAllowed = allowedModes.includes(mode);
                return (
                  <Button
                    key={mode}
                    type="button"
                    onClick={() => isAllowed && setDisplayMode(mode)}
                    disabled={!isAllowed}
                    className={`flex-1 transition-all ${
                      displayMode === mode
                        ? "bg-gradient-to-r from-emerald-500 to-blue-600 dark:from-emerald-400 dark:to-blue-500 text-white"
                        : !isAllowed
                        ? "bg-muted/50 text-muted-foreground/30 cursor-not-allowed opacity-50"
                        : "bg-muted text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {label}
                  </Button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {dataStructure?.isRootArray
                ? "Root data is an array - only Table and Chart modes available"
                : dataStructure?.hasArrays ||
                  dataStructure?.hasFinancialTimeSeries
                ? "Array or financial data detected - only Table and Chart modes available"
                : "Single object data - only Card mode available"}
            </p>
          </div>

          {/* Field Selector - Different for Card/Table vs Chart */}
          {/* Show message if data source selection is required but not made */}
          {dataSourceOptions.length > 1 && !selectedDataPath ? (
            <div className="border border-emerald-500/30 bg-emerald-900/10 rounded-lg p-8 text-center">
              <p className="text-emerald-400 font-medium mb-2">
                Data Source Selection Required
              </p>
              <p className="text-muted-foreground text-sm">
                Multiple data sources detected. Please select one from the
                dropdown above to continue configuring your widget.
              </p>
            </div>
          ) : displayMode === "chart" ? (
            <ChartFieldSelector
              form={form}
              apiFields={displayFields}
              dataPath={selectedDataPath}
              isFinancialData={isFinancialDataPath}
              initialChartConfig={initialChartConfig}
              onProceedToFormatting={onProceedToFormatting}
              onCancel={onSuccess}
            />
          ) : (
            <CardTableFieldSelector
              form={form}
              apiFields={displayFields}
              displayMode={displayMode}
              dataPath={selectedDataPath}
              isFinancialData={isFinancialDataPath}
              initialSelectedFields={initialSelectedFields}
              onProceedToFormatting={onProceedToFormatting}
              onCancel={onSuccess}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
};
