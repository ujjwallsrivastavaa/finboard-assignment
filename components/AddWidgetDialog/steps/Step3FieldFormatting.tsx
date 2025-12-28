/**
 * Step 3: Field Formatting Configuration
 * Allows users to configure display formatting for selected fields
 */

import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import type { SelectedField, FieldFormat } from "@/lib/types/field";
import type {
  WidgetInput,
  WidgetConfigForFormatting,
  ChartConfig,
} from "@/lib/types/widget";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import FieldFormatSelector from "../components/FieldFormatSelector";
import { useDashboardStore } from "@/lib/store/useDashboardStore";
import { useCustomToast } from "@/lib/hooks/useToast";
import { getDefaultLayout } from "@/lib/constants/widgetDefaults";

interface Step3FieldFormattingProps {
  selectedFields: SelectedField[];
  widgetConfig: WidgetConfigForFormatting;
  editWidgetId?: string;
  onFieldFormatChange: (
    fieldPath: string,
    format: FieldFormat | undefined
  ) => void;
  onBack: () => void;
  onSuccess: () => void;
}

export default function Step3FieldFormatting({
  selectedFields,
  widgetConfig,
  editWidgetId,
  onFieldFormatChange,
  onBack,
  onSuccess,
}: Step3FieldFormattingProps) {
  const { addWidget, updateWidget } = useDashboardStore();
  const toast = useCustomToast();

  const handleFieldNameChange = (fieldPath: string, newName: string) => {
    // Update the field name through the parent component's state
    // We'll need to update the parent to handle name changes
    // For now, we can use onFieldFormatChange to trigger a re-render
    const field = selectedFields.find((f) => f.path === fieldPath);
    if (field) {
      // This is a workaround - ideally we'd have onFieldNameChange callback
      field.name = newName;
      // Trigger a format change to force parent update
      onFieldFormatChange(fieldPath, field.format);
    }
  };

  if (selectedFields.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p className="text-sm">No fields selected yet</p>
        <p className="text-xs mt-2">Go back and select fields first</p>
      </div>
    );
  }

  const handleAddWidget = () => {
    if (!widgetConfig) return;

    // Build the widget input based on type
    let widgetInput: WidgetInput;

    if (widgetConfig.displayMode === "chart") {
      // For charts, we need to update the chartConfig with formatted fields
      if (!widgetConfig.chartConfig) {
        console.error("Chart config is missing");
        return;
      }

      let chartConfigWithFullPath: ChartConfig = widgetConfig.chartConfig;

      // Prefix field paths if needed
      if (widgetConfig.dataPath && !widgetConfig.isFinancialData) {
        const prefixPath = (config: ChartConfig): ChartConfig => {
          const prefix = widgetConfig.dataPath;

          if (config.type === "line") {
            return {
              ...config,
              xAxis: {
                ...config.xAxis,
                path: `${prefix}.${config.xAxis.path}`,
              },
              yAxis: {
                ...config.yAxis,
                path: `${prefix}.${config.yAxis.path}`,
              },
              ...(config.seriesField && {
                seriesField: {
                  ...config.seriesField,
                  path: `${prefix}.${config.seriesField.path}`,
                },
              }),
            };
          } else {
            // candlestick
            return {
              ...config,
              xAxis: {
                ...config.xAxis,
                path: `${prefix}.${config.xAxis.path}`,
              },
              open: { ...config.open, path: `${prefix}.${config.open.path}` },
              high: { ...config.high, path: `${prefix}.${config.high.path}` },
              low: { ...config.low, path: `${prefix}.${config.low.path}` },
              close: {
                ...config.close,
                path: `${prefix}.${config.close.path}`,
              },
            };
          }
        };

        chartConfigWithFullPath = prefixPath(widgetConfig.chartConfig);
      }

      widgetInput = {
        type: "chart",
        title: widgetConfig.title,
        layout: getDefaultLayout("chart"),
        config: {
          type: "chart",
          apiEndpoint: widgetConfig.apiEndpoint,
          chartConfig: chartConfigWithFullPath,
          refreshInterval: widgetConfig.refreshInterval,
          authentication: widgetConfig.authentication,
          ...(widgetConfig.isFinancialData &&
            widgetConfig.dataPath && {
              financialDataPath: widgetConfig.dataPath,
            }),
        },
        status: "idle",
      };
    } else {
      // For card/table widgets
      widgetInput = {
        type: widgetConfig.displayMode,
        title: widgetConfig.title,
        layout: getDefaultLayout(widgetConfig.displayMode, {
          fieldCount: selectedFields.length,
        }),
        config: {
          type: widgetConfig.displayMode,
          apiEndpoint: widgetConfig.apiEndpoint,
          fields: selectedFields,
          refreshInterval: widgetConfig.refreshInterval,
          authentication: widgetConfig.authentication,
          ...(widgetConfig.isFinancialData &&
            widgetConfig.dataPath && {
              financialDataPath: widgetConfig.dataPath,
            }),
        },
        status: "idle",
      };
    }

    if (editWidgetId) {
      // Update existing widget
      updateWidget(editWidgetId, widgetInput);
      toast.success("Widget Updated", {
        description: `${widgetConfig.title} has been updated successfully.`,
      });
    } else {
      // Add new widget
      addWidget(widgetInput);
      toast.success("Widget Added", {
        description: `${widgetConfig.title} has been added to your dashboard.`,
      });
    }
    onSuccess();
  };

  const handleSkipFormatting = () => {
    // Remove all formats and add widget
    selectedFields.forEach((field) => {
      delete field.format;
    });
    handleAddWidget();
  };

  return (
    <motion.div
      key="step3"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
      className="p-8"
    >
      {/* Header */}
      <DialogHeader className="mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="rounded-lg p-2 hover:bg-accent transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div>
            <DialogTitle className="text-2xl">
              Step 3: Configure Field Formatting
            </DialogTitle>
            <DialogDescription className="mt-1">
              Customize how your data is displayed (optional)
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-white">
            Field Display Configuration
          </h3>
          <p className="text-xs text-muted-foreground">
            Customize display names and formatting for each field. Change how
            data is shown - format numbers as currency, percentages, dates, and
            more.
          </p>
        </div>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {selectedFields.map((field) => (
              <FieldFormatSelector
                key={field.path}
                field={field}
                onFormatChange={onFieldFormatChange}
                onNameChange={handleFieldNameChange}
              />
            ))}
          </div>
        </ScrollArea>

        <div className="pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground mb-4">
            💡 Tip: Click &quot;Auto&quot; to automatically detect and suggest
            the best format based on field names. You can also customize the
            display name for each field.
          </p>

          {/* Action Buttons */}
          <div className="flex justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleSkipFormatting}
              className="border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              Skip Formatting
            </Button>
            <Button
              type="button"
              onClick={handleAddWidget}
              className="bg-gradient-to-r from-emerald-500 to-blue-600 dark:from-emerald-400 dark:to-blue-500 hover:from-emerald-600 hover:to-blue-700 dark:hover:from-emerald-500 dark:hover:to-blue-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Add Widget
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
