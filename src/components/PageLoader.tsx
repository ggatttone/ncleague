import { Loader2 } from "lucide-react";

export const PageLoader = () => {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="flex items-center justify-center h-screen w-full"
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
      <span className="sr-only">Caricamento in corso...</span>
    </div>
  );
};