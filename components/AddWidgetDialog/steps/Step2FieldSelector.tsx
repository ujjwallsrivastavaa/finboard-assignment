"use client";

import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../ui/dialog";
import { Button } from "../../ui/button";
import type { FieldNode, SelectedField } from "@/lib/types/field";
import type { WidgetInput } from "@/lib/types/widget";
import type { ApiAuthentication } from "@/lib/types/api";
import type { ChartConfig } from "@/lib/types/chart";
import { useDashboardStore } from "@/lib/store/useDashboardStore";
import { useCustomToast } from "@/lib/hooks/useToast";
import { getDefaultLayout } from "@/lib/constants/widgetDefaults";
import { CardTableFieldSelector } from "../components/CardTableFieldSelector";
import ChartFieldSelector from "../components/ChartFieldSelector";

interface Step2FieldSelectorProps {
  form: UseFormReturn<any>;
  isArrayResponse: boolean;
  apiFields: FieldNode[];
  onBack: () => void;
  onSuccess: () => void;
}

export const Step2FieldSelector = ({
  form,
  isArrayResponse,
  apiFields,
  onBack,
  onSuccess,
}: Step2FieldSelectorProps) => {
  const [selectedFields, setSelectedFields] = useState<SelectedField[]>([]);
  const [displayMode, setDisplayMode] = useState<"card" | "table" | "chart">(
    isArrayResponse ? "table" : "card"
  );
  const [chartConfig, setChartConfig] = useState<ChartConfig | undefined>();

  const { addWidget } = useDashboardStore();
  const toast = useCustomToast();

  const handleSubmit = (): void => {
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

    const widgetType = displayMode === "chart" ? "chart" : displayMode;

    const widgetInput: WidgetInput = {
      type: widgetType,
      title: values.widgetTitle,
      layout: getDefaultLayout(widgetType, {
        fieldCount: selectedFields.length,
      }),
      config:
        displayMode === "chart" && chartConfig
          ? {
              type: "chart" as const,
              apiEndpoint: values.apiEndpoint,
              chartConfig,
              refreshInterval: values.refreshInterval,
              authentication,
            }
          : {
              type: displayMode as "card" | "table",
              apiEndpoint: values.apiEndpoint,
              fields: selectedFields,
              refreshInterval: values.refreshInterval,
              authentication,
            },
      status: "idle",
    };

    addWidget(widgetInput);
    toast.success("Widget Added", {
      description: `${values.widgetTitle} has been added to your dashboard.`,
    });
    onSuccess();
  };

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
        <DialogHeader className="px-6 py-4 border-b border-slate-700/50 flex flex-row items-start justify-between gap-4 flex-shrink-0">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={onBack}
                className="p-1 hover:bg-slate-800 rounded transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-slate-400" />
              </button>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
                Configure Fields
              </DialogTitle>
            </div>
            <DialogDescription className="text-slate-400 ml-9">
              Select which fields to display and choose your display mode.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          <div>
            <label className="text-slate-300 mb-3 block font-medium text-sm">
              Display Mode
            </label>
            <div className="flex gap-2">
              {[
                {
                  mode: "card" as const,
                  label: "Card",
                  requiresNonArray: true,
                },
                {
                  mode: "table" as const,
                  label: "Table",
                  requiresArray: true,
                },
                {
                  mode: "chart" as const,
                  label: "Chart",
                  requiresArray: true,
                },
              ].map(({ mode, label, requiresArray, requiresNonArray }) => {
                const isDisabled =
                  (requiresArray && !isArrayResponse) ||
                  (requiresNonArray && isArrayResponse);
                return (
                  <Button
                    key={mode}
                    type="button"
                    onClick={() => !isDisabled && setDisplayMode(mode)}
                    disabled={isDisabled}
                    className={`flex-1 transition-all ${
                      displayMode === mode
                        ? "bg-gradient-to-r from-emerald-500 to-blue-600 text-white"
                        : isDisabled
                        ? "bg-slate-800/30 text-slate-600 cursor-not-allowed"
                        : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50"
                    }`}
                  >
                    {label}
                  </Button>
                );
              })}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {isArrayResponse
                ? "Table and Chart views are available for array responses."
                : "Only Card view is available for single object responses."}
            </p>
          </div>

          {/* Field Selector - Different for Card/Table vs Chart */}
          {displayMode === "chart" ? (
            <ChartFieldSelector />
          ) : (
            <CardTableFieldSelector
              apiFields={apiFields}
              selectedFields={selectedFields}
              setSelectedFields={setSelectedFields}
            />
          )}
        </div>

        <DialogFooter className="gap-2 px-6 py-4 border-t border-slate-700/50 flex-shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onSuccess}
            className="border-slate-600 bg-slate-800/50 text-slate-200 hover:bg-slate-700 hover:text-white hover:border-slate-500 transition-colors"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={
              selectedFields.length === 0 ||
              (displayMode === "chart" && !chartConfig)
            }
            className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
          >
            Add Widget
          </Button>
        </DialogFooter>
      </div>
    </motion.div>
  );
};
