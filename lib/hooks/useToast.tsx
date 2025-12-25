import { toast } from "sonner";
import { Check, X, AlertCircle, Info } from "lucide-react";

interface ToastOptions {
  description?: string;
  duration?: number;
}

export const useCustomToast = () => {
  const success = (title: string, options?: ToastOptions) => {
    toast.success(title, {
      description: options?.description,
      duration: options?.duration || 4000,
      className:
        "!bg-slate-800 !border !border-emerald-500/50 !text-white shadow-lg",
      descriptionClassName: "!text-slate-300",
      icon: <Check className="w-5 h-5 text-emerald-400" />,
      style: {
        background: "rgb(30 41 59)",
        border: "1px solid rgba(16, 185, 129, 0.5)",
        color: "white",
      },
    });
  };

  const error = (title: string, options?: ToastOptions) => {
    toast.error(title, {
      description: options?.description,
      duration: options?.duration || 4000,
      className:
        "!bg-slate-800 !border !border-red-500/50 !text-white shadow-lg",
      descriptionClassName: "!text-slate-300",
      icon: <X className="w-5 h-5 text-red-400" />,
      style: {
        background: "rgb(30 41 59)",
        border: "1px solid rgba(239, 68, 68, 0.5)",
        color: "white",
      },
    });
  };

  const warning = (title: string, options?: ToastOptions) => {
    toast.warning(title, {
      description: options?.description,
      duration: options?.duration || 4000,
      className:
        "!bg-slate-800 !border !border-amber-500/50 !text-white shadow-lg",
      descriptionClassName: "!text-slate-300",
      icon: <AlertCircle className="w-5 h-5 text-amber-400" />,
      style: {
        background: "rgb(30 41 59)",
        border: "1px solid rgba(245, 158, 11, 0.5)",
        color: "white",
      },
    });
  };

  const info = (title: string, options?: ToastOptions) => {
    toast.info(title, {
      description: options?.description,
      duration: options?.duration || 4000,
      className:
        "!bg-slate-800 !border !border-blue-500/50 !text-white shadow-lg",
      descriptionClassName: "!text-slate-300",
      icon: <Info className="w-5 h-5 text-blue-400" />,
      style: {
        background: "rgb(30 41 59)",
        border: "1px solid rgba(59, 130, 246, 0.5)",
        color: "white",
      },
    });
  };

  return {
    success,
    error,
    warning,
    info,
  };
};
