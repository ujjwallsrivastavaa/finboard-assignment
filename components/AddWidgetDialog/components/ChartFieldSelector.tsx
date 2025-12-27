"use client";

import { useState, useMemo } from "react";
import { UseFormReturn } from "react-hook-form";
import { Button } from "../../ui/button";
import { Label } from "../../ui/label";
import { Card } from "../../ui/card";
import { ScrollArea } from "../../ui/scroll-area";
import { Separator } from "../../ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { FieldDiscoveryService } from "@/lib/services/fieldDiscoveryService";
import type {
  FieldNode,
  PrimitiveType,
  SelectedField,
} from "@/lib/types/field";
import type { WidgetConfigForFormatting } from "@/lib/types/widget";
import type { ApiAuthentication } from "@/lib/types/api";
import {
  chartDefinitions,
  ChartType,
  ChartConfig,
  getChartDefinition,
  validateChartConfig,
} from "@/lib/types/chart";
import { useCustomToast } from "@/lib/hooks/useToast";

interface ChartFieldSelectorProps {
  form: UseFormReturn<{
    widgetTitle: string;
    apiEndpoint: string;
    refreshInterval: number;
    requiresAuth: boolean;
    authType: "none" | "bearer" | "api-key" | "basic";
    authToken?: string;
    authHeaderName?: string;
    authUsername?: string;
    authPassword?: string;
  }>;
  apiFields: FieldNode[];
  dataPath: string | null;
  isFinancialData?: boolean;
  initialChartConfig?: ChartConfig;
  onProceedToFormatting: (
    fields: SelectedField[],
    config: WidgetConfigForFormatting
  ) => void;
  onCancel: () => void;
}

export default function ChartFieldSelector({
  form,
  apiFields,
  dataPath,
  isFinancialData = false,
  initialChartConfig,
  onProceedToFormatting,
  onCancel,
}: ChartFieldSelectorProps) {
  const toast = useCustomToast();
  const [selectedChartType, setSelectedChartType] = useState<ChartType>(
    initialChartConfig?.type || "line"
  );

  // Initialize field selections from chart config when in edit mode
  const getInitialFieldSelections = (): Record<
    string,
    { path: string; name: string; type: PrimitiveType } | null
  > => {
    if (!initialChartConfig) return {};

    const selections: Record<
      string,
      { path: string; name: string; type: PrimitiveType } | null
    > = {};

    // Extract field selections from the chart config
    Object.entries(initialChartConfig).forEach(([key, value]) => {
      if (
        key !== "type" &&
        value &&
        typeof value === "object" &&
        "path" in value &&
        "type" in value &&
        "name" in value
      ) {
        selections[key] = {
          path: (value as { path: string }).path,
          name: (value as { name: string }).name,
          type: (value as { type: PrimitiveType }).type,
        };
      }
    });

    return selections;
  };

  const [fieldSelections, setFieldSelections] = useState<
    Record<string, { path: string; name: string; type: PrimitiveType } | null>
  >(getInitialFieldSelections());

  const chartDefinition = getChartDefinition(selectedChartType);

  // Build chart config from selections
  const currentChartConfig = useMemo((): ChartConfig | null => {
    const baseConfig = chartDefinition.createDefault();
    const config = { ...baseConfig };

    // Map field selections to config
    for (const [fieldKey, selection] of Object.entries(fieldSelections)) {
      if (selection) {
        (config as Record<string, unknown>)[fieldKey] = {
          path: selection.path,
          type: selection.type,
          name: selection.name,
        };
      }
    }

    return config as ChartConfig;
  }, [fieldSelections, chartDefinition]);

  const handleProceedToFormatting = (): void => {
    if (!currentChartConfig) return;

    // Validate configuration
    const validation = validateChartConfig(currentChartConfig, []);
    if (!validation.valid) {
      toast.error("Configuration Error", {
        description: validation.errors.join(", "),
      });
      return;
    }

    const values = form.getValues();
    let authentication: ApiAuthentication | undefined;

    if (values.requiresAuth) {
      switch (values.authType) {
        case "bearer":
          authentication = { type: "bearer", token: values.authToken || "" };
          break;
        case "api-key":
          authentication = {
            type: "api-key",
            headerName: values.authHeaderName || "",
            apiKey: values.authToken || "",
          };
          break;
        case "basic":
          authentication = {
            type: "basic",
            username: values.authUsername || "",
            password: values.authPassword || "",
          };
          break;
      }
    }

    // Extract fields from chart config
    const fields: SelectedField[] = [];
    Object.entries(currentChartConfig).forEach(([key, value]) => {
      if (value && typeof value === "object" && "path" in value) {
        const field = value as {
          path: string;
          name: string;
          type: PrimitiveType;
        };
        fields.push({
          path: field.path,
          name: field.name || key,
          type: field.type,
          order: fields.length,
        });
      }
    });

    const widgetConfig: WidgetConfigForFormatting = {
      type: "chart",
      title: values.widgetTitle,
      apiEndpoint: values.apiEndpoint,
      refreshInterval: values.refreshInterval,
      authentication,
      isFinancialData,
      dataPath: dataPath ? dataPath : "",
      chartConfig: currentChartConfig,
      displayMode: "chart",
    };

    onProceedToFormatting(fields, widgetConfig);
  };

  const canSubmit = useMemo(() => {
    if (!currentChartConfig) return false;

    // Check only required fields are filled
    const requiredFieldKeys = Object.keys(
      chartDefinition.requiredFields
    ).filter((key) => {
      const field =
        chartDefinition.requiredFields[
          key as keyof typeof chartDefinition.requiredFields
        ];
      return field?.required;
    });
    return requiredFieldKeys.every((key) => {
      const selection = fieldSelections[key];
      return selection && selection.path;
    });
  }, [currentChartConfig, chartDefinition, fieldSelections]);

  return (
    <div className="flex flex-col gap-6">
      {/* Chart Type Selector */}
      <div className="space-y-3">
        <Label className="text-slate-300 font-medium text-sm">Chart Type</Label>
        <Select
          value={selectedChartType}
          onValueChange={(value) => {
            setSelectedChartType(value as ChartType);
            setFieldSelections({});
          }}
        >
          <SelectTrigger className="!h-14 bg-slate-800/50 border-slate-700 text-slate-200 px-4">
            <SelectValue />
          </SelectTrigger>

          <SelectContent className="bg-slate-800 border-slate-700">
            <div className="max-h-60 overflow-y-auto">
              {(Object.keys(chartDefinitions) as ChartType[]).map((type) => {
                const def = chartDefinitions[type];
                return (
                  <SelectItem
                    key={type}
                    value={type}
                    className="text-slate-200 focus:bg-slate-700 focus:text-white"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{def.displayName}</span>
                      <span className="text-xs text-slate-400">
                        {def.description}
                      </span>
                    </div>
                  </SelectItem>
                );
              })}
            </div>
          </SelectContent>
        </Select>
      </div>

      <Separator className="bg-slate-700/50" />

      {/* Dynamic Field Selectors */}
      <ScrollArea className="h-[400px] w-full">
        <div className="space-y-4 pr-4">
          <h3 className="text-slate-300 font-medium text-sm">
            Configure Fields
          </h3>
          <p className="text-xs text-slate-400">
            Map your API fields to the chart configuration
          </p>

          <div className="space-y-4 mt-4">
            {Object.entries(chartDefinition.requiredFields).map(
              ([fieldKey, fieldMeta]) => {
                const availableFields = FieldDiscoveryService.flattenFields(
                  apiFields,
                  fieldMeta.allowedTypes
                );
                const currentSelection = fieldSelections[fieldKey];

                return (
                  <Card
                    key={fieldKey}
                    className="p-4 bg-slate-800/30 border-slate-700/50"
                  >
                    <div className="space-y-3">
                      <div>
                        <Label className="text-slate-200 font-medium">
                          {fieldMeta.label}
                          {!fieldMeta.required && (
                            <span className="text-xs text-slate-400 ml-2">
                              (Optional)
                            </span>
                          )}
                        </Label>
                        <p className="text-xs text-slate-400 mt-1">
                          {fieldMeta.description}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Allowed types: {fieldMeta.allowedTypes.join(", ")}
                        </p>
                      </div>

                      <Select
                        value={currentSelection?.path || ""}
                        onValueChange={(path) => {
                          const field = availableFields.find(
                            (f) => f.path === path
                          );
                          if (field) {
                            setFieldSelections((prev) => ({
                              ...prev,
                              [fieldKey]: field,
                            }));
                          }
                        }}
                      >
                        <SelectTrigger className="bg-slate-900/50 border-slate-600 text-slate-200">
                          <SelectValue placeholder="Select a field..." />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <div className="max-h-60 overflow-y-auto">
                            {availableFields.length === 0 ? (
                              <div className="p-2 text-sm text-slate-400">
                                No compatible fields found
                              </div>
                            ) : (
                              availableFields.map((field) => (
                                <SelectItem
                                  key={field.path}
                                  value={field.path}
                                  className="text-slate-200 focus:bg-slate-700 focus:text-white"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span>{field.name}</span>
                                    <span className="text-xs text-slate-400">
                                      ({field.type})
                                    </span>
                                  </div>
                                </SelectItem>
                              ))
                            )}
                          </div>
                        </SelectContent>
                      </Select>
                    </div>
                  </Card>
                );
              }
            )}
          </div>
        </div>
      </ScrollArea>

      <Separator className="bg-slate-700/50" />

      {/* Action Buttons */}
      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="border-slate-600 bg-slate-800/50 text-slate-200 hover:bg-slate-700 hover:text-white hover:border-slate-500 transition-colors"
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleProceedToFormatting}
          disabled={!canSubmit}
          className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
        >
          Next: Configure Formatting
        </Button>
      </div>
    </div>
  );
}
