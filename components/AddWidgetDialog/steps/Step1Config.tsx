"use client";

import { UseFormReturn } from "react-hook-form";
import { motion } from "framer-motion";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../ui/form";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";

interface Step1ConfigProps {
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
  title: string;
  isTestingApi: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}

export const Step1Config = ({
  form,
  title,
  isTestingApi,
  onSubmit,
  onCancel,
}: Step1ConfigProps) => {
  return (
    <motion.div
      key="step-1"
      initial={{ x: -80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 80, opacity: 0 }}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className="flex flex-col max-h-[90vh]"
    >
      <div className="w-full min-w-full flex flex-col max-h-[90vh]">
        <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 dark:from-emerald-400 dark:to-blue-400 bg-clip-text text-transparent">
            {title}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Configure your widget and test the API connection.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 px-6 py-4 overflow-y-auto flex-1 flex flex-col min-h-0"
          >
            <FormField
              control={form.control}
              name="widgetTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">
                    Widget Title
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Bitcoin Price Tracker"
                      {...field}
                      className="bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="apiEndpoint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">
                    API Endpoint
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., https://api.coinbase.com/v2/exchange-rates?currency=BTC"
                      {...field}
                      className="bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="socketUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">
                    WebSocket URL (Optional)
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., wss://api.example.com/realtime"
                      {...field}
                      className="bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground mt-1">
                    If provided, real-time updates will use WebSocket instead of
                    polling
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="refreshInterval"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">
                    Refresh Interval (ms)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="30000"
                      inputMode="numeric"
                      min={1000}
                      step={1000}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      className="bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground mt-1">
                    Used for polling when WebSocket is not available
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Authentication Section */}
            <div className="space-y-4 pt-2 border-t border-border">
              <FormField
                control={form.control}
                name="requiresAuth"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <input
                          type="checkbox"
                          id="requiresAuth"
                          checked={field.value}
                          onChange={(e) => {
                            field.onChange(e.target.checked);
                            if (!e.target.checked) {
                              form.setValue("authType", "none");
                            }
                          }}
                          className="w-4 h-4 rounded accent-emerald-500"
                        />
                      </FormControl>
                      <label
                        htmlFor="requiresAuth"
                        className="text-foreground text-sm font-medium cursor-pointer"
                      >
                        Requires Authentication
                      </label>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch("requiresAuth") && (
                <>
                  <FormField
                    control={form.control}
                    name="authType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground text-sm font-medium">
                          Authentication Type
                        </FormLabel>
                        <FormControl>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              {
                                value: "bearer" as const,
                                label: "Bearer Token",
                              },
                              {
                                value: "api-key" as const,
                                label: "API Key",
                              },
                              {
                                value: "basic" as const,
                                label: "Basic Auth",
                              },
                            ].map(({ value, label }) => (
                              <button
                                key={value}
                                type="button"
                                onClick={() => field.onChange(value)}
                                className={`px-3 py-2 rounded text-sm transition-all ${
                                  field.value === value
                                    ? "bg-emerald-600 dark:bg-emerald-500 text-white"
                                    : "bg-muted text-muted-foreground hover:bg-accent"
                                }`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch("authType") === "bearer" && (
                    <FormField
                      control={form.control}
                      name="authToken"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground text-sm font-medium">
                            Bearer Token
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Enter your bearer token"
                              {...field}
                              className="bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-emerald-500"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {form.watch("authType") === "api-key" && (
                    <>
                      <FormField
                        control={form.control}
                        name="authHeaderName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground text-sm font-medium">
                              Header Name
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., X-API-Key"
                                {...field}
                                className="bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-emerald-500"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="authToken"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground text-sm font-medium">
                              API Key
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="Enter your API key"
                                {...field}
                                className="bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-emerald-500"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  {form.watch("authType") === "basic" && (
                    <>
                      <FormField
                        control={form.control}
                        name="authUsername"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground text-sm font-medium">
                              Username
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter username"
                                {...field}
                                className="bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="authPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground text-sm font-medium">
                              Password
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="Enter password"
                                {...field}
                                className="bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </>
              )}
            </div>
          </form>
        </Form>

        <DialogFooter className="gap-2 px-6 py-4 border-t border-border flex-shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="border-border bg-background text-foreground hover:bg-muted hover:text-foreground hover:border-ring transition-colors"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={isTestingApi}
            className="bg-gradient-to-r from-emerald-600 to-blue-600 dark:from-emerald-500 dark:to-blue-500 hover:from-emerald-700 hover:to-blue-700 dark:hover:from-emerald-600 dark:hover:to-blue-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
          >
            {isTestingApi ? "Testing..." : "Test API"}
          </Button>
        </DialogFooter>
      </div>
    </motion.div>
  );
};
