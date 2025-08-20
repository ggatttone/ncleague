import { toast } from "sonner";
import i18n from "@/lib/i18n";

export const showSuccess = (message: string, options?: any) => {
  toast.success(i18n.t(message, options) as string);
};

export const showError = (message: string, options?: any) => {
  toast.error(i18n.t(message, options) as string);
};

export const showLoading = (message: string, options?: any) => {
  return toast.loading(i18n.t(message, options) as string);
};

export const dismissToast = (toastId: string | number) => {
  toast.dismiss(toastId);
};