"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { useCustomToast } from "@/lib/hooks/useToast";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import type { FieldNode } from "@/lib/types/field";
import type { ApiTestResult, ApiAuthentication } from "@/lib/types/api";
import { FieldDiscoveryService } from "@/lib/services/fieldDiscoveryService";
import { ApiService } from "@/lib/services";
import { Step1Config } from "./steps/Step1Config";
import { Step2FieldSelector } from "./steps/Step2FieldSelector";

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

const AddWidgetDialog = ({ title }: { title: string }) => {
  const [open, setOpen] = useState<boolean>(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [isTestingApi, setIsTestingApi] = useState<boolean>(false);
  const [apiFields, setApiFields] = useState<FieldNode[]>([]);
  const [isArrayResponse, setIsArrayResponse] = useState<boolean>(false);

  const toast = useCustomToast();

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
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
      setApiFields(discovery.fields);
      setIsArrayResponse(result.isArray);

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
    form.reset();
    setStep(1);
    setApiFields([]);
    setIsArrayResponse(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={() => {
        setOpen(!open);
        form.reset();
      }}
    >
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
          <Plus className="mr-2" />
          {title}
        </Button>
      </DialogTrigger>
      <DialogContent
        className={`
          !max-w-none bg-slate-900 border-slate-700/50 text-white p-0
          ${step === 2 ? "!w-[95vw]" : "!w-[600px]"}
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
                isArrayResponse={isArrayResponse}
                apiFields={apiFields}
                onBack={() => setStep(1)}
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
