"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { useCustomToast } from "@/lib/hooks/useToast";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import type { Widget } from "@/lib/types/widget";
import { Button } from "../ui/button";
import type { FieldNode, SelectedField, FieldFormat } from "@/lib/types/field";
import type { ApiTestResult, ApiAuthentication } from "@/lib/types/api";
import type { WidgetConfigForFormatting } from "@/lib/types/widget";
import { FieldDiscoveryService } from "@/lib/services/fieldDiscoveryService";
import { ApiService } from "@/lib/services";
import { Step1Config } from "./steps/Step1Config";
import { Step2FieldSelector } from "./steps/Step2FieldSelector";
import Step3FieldFormatting from "./steps/Step3FieldFormatting";

const formSchema = z
  .object({
    widgetTitle: z.string().min(1, "Widget title is required"),
    apiEndpoint: z.string().url("Must be a valid URL"),
    refreshInterval: z.number().min(1000, "Minimum 1000ms"),
    requiresAuth: z.boolean(),
    authType: z.enum(["none", "bearer", "api-key", "basic"]),
    authToken: z.string().optional(),
    authHeaderName: z.string().optional(),
    authUsername: z.string().optional(),
    authPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.requiresAuth) return true;
      if (data.authType === "bearer") return !!data.authToken?.trim();
      if (data.authType === "api-key")
        return !!data.authHeaderName?.trim() && !!data.authToken?.trim();
      if (data.authType === "basic")
        return !!data.authUsername?.trim() && !!data.authPassword?.trim();
      return data.authType === "none";
    },
    {
      message: "Please provide required authentication credentials",
      path: ["requiresAuth"],
    }
  )
  .refine(
    (data) => {
      if (!data.requiresAuth || data.authType !== "bearer") return true;
      return !!data.authToken?.trim();
    },
    { message: "Bearer token is required", path: ["authToken"] }
  )
  .refine(
    (data) => {
      if (!data.requiresAuth || data.authType !== "api-key") return true;
      return !!data.authHeaderName?.trim();
    },
    { message: "Header name is required", path: ["authHeaderName"] }
  )
  .refine(
    (data) => {
      if (!data.requiresAuth || data.authType !== "api-key") return true;
      return !!data.authToken?.trim();
    },
    { message: "API key is required", path: ["authToken"] }
  )
  .refine(
    (data) => {
      if (!data.requiresAuth || data.authType !== "basic") return true;
      return !!data.authUsername?.trim();
    },
    { message: "Username is required", path: ["authUsername"] }
  )
  .refine(
    (data) => {
      if (!data.requiresAuth || data.authType !== "basic") return true;
      return !!data.authPassword?.trim();
    },
    { message: "Password is required", path: ["authPassword"] }
  );

type FormSchema = z.infer<typeof formSchema>;

interface AddWidgetDialogProps {
  title: string;
  editWidget?: Widget;
  triggerButton?: React.ReactNode;
}

const AddWidgetDialog = ({
  title,
  editWidget,
  triggerButton,
}: AddWidgetDialogProps) => {
  const [open, setOpen] = useState<boolean>(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isTestingApi, setIsTestingApi] = useState<boolean>(false);
  const [apiFields, setApiFields] = useState<FieldNode[]>([]);
  const [dataStructure, setDataStructure] = useState<ReturnType<
    typeof FieldDiscoveryService.analyzeDataStructure
  > | null>(null);
  const [rawApiData, setRawApiData] = useState<unknown>(null);

  // Get initial chart config if editing a chart widget
  const getInitialChartConfig = () => {
    if (!editWidget || editWidget.config.type !== "chart") return undefined;
    if ("chartConfig" in editWidget.config) {
      return editWidget.config.chartConfig;
    }
    return undefined;
  };

  // Initialize with existing fields if editing
  const getInitialFields = (): SelectedField[] => {
    if (!editWidget || editWidget.config.type === "chart") return [];
    if ("fields" in editWidget.config) {
      return editWidget.config.fields || [];
    }
    return [];
  };

  const [selectedFields, setSelectedFields] = useState<SelectedField[]>(
    getInitialFields()
  );

  // Initialize widget config if editing
  const getInitialConfig = (): WidgetConfigForFormatting | null => {
    if (!editWidget) return null;
    return {
      type: editWidget.type,
      title: editWidget.title,
      apiEndpoint: editWidget.config.apiEndpoint,
      refreshInterval: editWidget.config.refreshInterval,
      authentication: editWidget.config.authentication,
      displayMode: editWidget.type,
      ...(editWidget.config.type === "chart" &&
      "chartConfig" in editWidget.config
        ? { chartConfig: editWidget.config.chartConfig }
        : {}),
    };
  };

  const [widgetConfig, setWidgetConfig] =
    useState<WidgetConfigForFormatting | null>(getInitialConfig());

  const toast = useCustomToast();

  const getAuthDefaults = () => {
    if (!editWidget?.config.authentication) {
      return {
        requiresAuth: false,
        authType: "none" as const,
        authToken: "",
        authHeaderName: "X-API-Key",
        authUsername: "",
        authPassword: "",
      };
    }

    const auth = editWidget.config.authentication;
    switch (auth.type) {
      case "bearer":
        return {
          requiresAuth: true,
          authType: "bearer" as const,
          authToken: auth.token,
          authHeaderName: "X-API-Key",
          authUsername: "",
          authPassword: "",
        };
      case "api-key":
        return {
          requiresAuth: true,
          authType: "api-key" as const,
          authToken: auth.apiKey,
          authHeaderName: auth.headerName,
          authUsername: "",
          authPassword: "",
        };
      case "basic":
        return {
          requiresAuth: true,
          authType: "basic" as const,
          authToken: "",
          authHeaderName: "X-API-Key",
          authUsername: auth.username,
          authPassword: auth.password,
        };
      default:
        return {
          requiresAuth: false,
          authType: "none" as const,
          authToken: "",
          authHeaderName: "X-API-Key",
          authUsername: "",
          authPassword: "",
        };
    }
  };

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: editWidget
      ? {
          widgetTitle: editWidget.title,
          apiEndpoint: editWidget.config.apiEndpoint,
          refreshInterval: editWidget.config.refreshInterval || 30000,
          ...getAuthDefaults(),
        }
      : {
          widgetTitle: "",
          apiEndpoint: "",
          refreshInterval: 30000,
          requiresAuth: false,
          authType: "none",
          authToken: "",
          authHeaderName: "X-API-Key",
          authUsername: "",
          authPassword: "",
        },
  });

  const testApi = async (): Promise<void> => {
    setIsTestingApi(true);

    try {
      const values = form.getValues();
      let authentication: ApiAuthentication = { type: "none" };

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

      const result: ApiTestResult = await ApiService.test({
        endpoint: values.apiEndpoint,
        method: "GET",
        timeout: 10000,
        authentication,
      });

      if (!result.success) {
        toast.error("API Connection Failed", {
          description: result.message,
        });
        setIsTestingApi(false);
        return;
      }

      const discovery = FieldDiscoveryService.discover(result.data);
      const structure = FieldDiscoveryService.analyzeDataStructure(result.data);

      console.log({ result, discovery, structure });

      setApiFields(discovery.fields);
      setDataStructure(structure);
      setRawApiData(result.data);

      toast.success("API Connected", {
        description: `Found ${discovery.totalFields} fields in ${result.responseTime}ms`,
      });

      setTimeout(() => setStep(2), 500);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unexpected error occurred";
      toast.error("API Connection Failed", {
        description: errorMessage,
      });
    } finally {
      setIsTestingApi(false);
    }
  };

  const onSubmit = (): void => {
    testApi();
  };

  const resetDialog = () => {
    setOpen(false);
    setStep(1);
    setApiFields([]);
    setDataStructure(null);
    setRawApiData(null);

    // Reset to initial state based on whether we're editing or adding
    if (editWidget) {
      setSelectedFields(getInitialFields());
      setWidgetConfig(getInitialConfig());
      form.reset({
        widgetTitle: editWidget.title,
        apiEndpoint: editWidget.config.apiEndpoint,
        refreshInterval: editWidget.config.refreshInterval || 30000,
        ...getAuthDefaults(),
      });
    } else {
      setSelectedFields([]);
      setWidgetConfig(null);
      form.reset({
        widgetTitle: "",
        apiEndpoint: "",
        refreshInterval: 30000,
        requiresAuth: false,
        authType: "none",
        authToken: "",
        authHeaderName: "X-API-Key",
        authUsername: "",
        authPassword: "",
      });
    }
  };

  const handleFieldFormatChange = (
    fieldPath: string,
    format: FieldFormat | undefined
  ) => {
    setSelectedFields((prevFields) =>
      prevFields.map((field) =>
        field.path === fieldPath ? { ...field, format } : field
      )
    );
  };

  const proceedToFormatting = (
    fields: SelectedField[],
    config: WidgetConfigForFormatting
  ) => {
    setSelectedFields(fields);
    setWidgetConfig(config);
    setStep(3);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) {
          // Dialog is closing - reset everything properly
          resetDialog();
        } else {
          setOpen(true);
        }
      }}
    >
      <DialogTrigger asChild>
        {triggerButton || (
          <Button className="bg-gradient-to-r from-emerald-600 to-blue-600 dark:from-emerald-500 dark:to-blue-500 hover:from-emerald-700 hover:to-blue-700 dark:hover:from-emerald-600 dark:hover:to-blue-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
            <Plus className="mr-2" />
            {title}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        className={`
          !max-w-none bg-card border-border text-foreground p-0
          ${step === 2 ? "!w-[95vw]" : step === 3 ? "!w-[800px]" : "!w-[600px]"}
          max-h-[90vh] overflow-hidden
        `}
      >
        <motion.div layout className="relative overflow-hidden">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <Step1Config
                form={form}
                title={title}
                isTestingApi={isTestingApi}
                onSubmit={() => form.handleSubmit(onSubmit)()}
                onCancel={resetDialog}
              />
            )}

            {step === 2 && (
              <Step2FieldSelector
                form={form}
                apiFields={apiFields}
                dataStructure={dataStructure}
                rawApiData={rawApiData}
                initialSelectedFields={selectedFields}
                initialChartConfig={getInitialChartConfig()}
                onBack={() => setStep(1)}
                onProceedToFormatting={proceedToFormatting}
                onSuccess={resetDialog}
              />
            )}

            {step === 3 && widgetConfig && (
              <Step3FieldFormatting
                selectedFields={selectedFields}
                widgetConfig={widgetConfig}
                editWidgetId={editWidget?.id}
                onFieldFormatChange={handleFieldFormatChange}
                onBack={() => setStep(2)}
                onSuccess={resetDialog}
              />
            )}
          </AnimatePresence>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default AddWidgetDialog;
