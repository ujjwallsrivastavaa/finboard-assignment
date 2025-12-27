"use client";

import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { Reorder } from "framer-motion";
import { FieldItem } from "./FieldItem";
import { FieldDiscoveryService } from "@/lib/services/fieldDiscoveryService";
import { AvailableFieldsTree } from "./AvailableFieldsTree";
import type { FieldNode, SelectedField } from "@/lib/types/field";
import type { ApiAuthentication } from "@/lib/types/api";
import { Button } from "../../ui/button";
import { ChevronRight } from "lucide-react";
import { WidgetConfigForFormatting } from "@/lib/types/widget";

interface CardTableFieldSelectorProps {
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
  displayMode: "card" | "table";
  dataPath: string | null;
  isFinancialData?: boolean;
  onProceedToFormatting: (
    fields: SelectedField[],
    config: WidgetConfigForFormatting
  ) => void;
  onCancel: () => void;
}

export const CardTableFieldSelector = ({
  form,
  apiFields,
  displayMode,
  dataPath,
  isFinancialData = false,
  onProceedToFormatting,
  onCancel,
}: CardTableFieldSelectorProps) => {
  const [selectedFields, setSelectedFields] = useState<SelectedField[]>([]);
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());

  const toggleFieldExpansion = (path: string): void => {
    setExpandedFields((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const moveFieldUp = (index: number): void => {
    if (index === 0) return;
    const newFields = [...selectedFields];
    [newFields[index - 1], newFields[index]] = [
      newFields[index],
      newFields[index - 1],
    ];
    newFields.forEach((field, idx) => {
      field.order = idx;
    });
    setSelectedFields(newFields);
  };

  const moveFieldDown = (index: number): void => {
    if (index === selectedFields.length - 1) return;
    const newFields = [...selectedFields];
    [newFields[index], newFields[index + 1]] = [
      newFields[index + 1],
      newFields[index],
    ];
    newFields.forEach((field, idx) => {
      field.order = idx;
    });
    setSelectedFields(newFields);
  };

  const handleProceedToFormatting = (): void => {
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

    // For financial data, don't prefix paths since fields are from normalized array
    // For regular arrays, prefix with dataPath
    const fieldsWithFullPath = selectedFields.map((field) => ({
      ...field,
      path: isFinancialData
        ? field.path // Keep as-is for financial (date, open, close, etc.)
        : dataPath
        ? `${dataPath}.${field.path}` // Prefix for nested arrays
        : field.path, // Root level
    }));

    const widgetConfig: WidgetConfigForFormatting = {
      type: displayMode,
      title: values.widgetTitle,
      apiEndpoint: values.apiEndpoint,
      refreshInterval: values.refreshInterval,
      authentication,
      isFinancialData,
      dataPath: dataPath || undefined,
      displayMode,
    };

    onProceedToFormatting(fieldsWithFullPath, widgetConfig);
  };

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Available Fields - Left Side */}
      <div className="flex flex-col">
        <label className="text-slate-300 mb-3 block font-medium text-sm">
          Available Fields (
          {FieldDiscoveryService.countSelectableFields(apiFields)})
        </label>
        <div className="space-y-2 max-h-[500px] overflow-y-auto border border-slate-700/50 rounded-lg p-4 bg-slate-800/20">
          <AvailableFieldsTree
            apiFields={apiFields}
            selectedFields={selectedFields}
            setSelectedFields={setSelectedFields}
            expandedFields={expandedFields}
            toggleFieldExpansion={toggleFieldExpansion}
          />
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Select fields to add them to your widget
        </p>
      </div>

      {/* Selected Fields - Right Side */}
      <div className="flex flex-col">
        <label className="text-slate-300 mb-3 block font-medium text-sm">
          Selected Fields ({selectedFields.length})
        </label>
        <div className="space-y-2 max-h-[500px] overflow-y-auto border border-emerald-700/50 rounded-lg p-4 bg-emerald-900/10">
          <Reorder.Group
            axis="y"
            values={selectedFields}
            onReorder={(newOrder) => {
              const reordered = newOrder.map((field, idx) => ({
                ...field,
                order: idx,
              }));
              setSelectedFields(reordered);
            }}
            className="space-y-2"
          >
            {selectedFields.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-slate-500 text-sm">
                No fields selected
              </div>
            ) : (
              selectedFields.map((field, index) => (
                <FieldItem
                  key={field.path}
                  field={field}
                  index={index}
                  selectedFields={selectedFields}
                  setSelectedFields={setSelectedFields}
                  moveFieldUp={moveFieldUp}
                  moveFieldDown={moveFieldDown}
                />
              ))
            )}
          </Reorder.Group>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Drag to reorder or use arrows. Order determines display sequence.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="col-span-2 flex justify-between gap-2 pt-4 border-t border-slate-700/50">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="border-slate-600 bg-slate-800/50 text-slate-200 hover:bg-slate-700 hover:text-white hover:border-slate-500 transition-colors"
        >
          Cancel
        </Button>
        <div className="flex gap-2">
          <Button
            type="button"
            onClick={handleProceedToFormatting}
            disabled={selectedFields.length === 0}
            className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 gap-2"
          >
            Next: Configure Formatting
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
