import { ReactNode } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { useIsMobile } from "@/hooks/use-mobile";

export const AdminLayout = ({ children }: { children: ReactNode }) => {
  const isMobile = useIsMobile();

  return (
    <div className="flex min-h-screen bg-background">
      {!isMobile && <AdminSidebar />}
      <main className={cn(
        "flex-1 p-4 md:p-8",
        isMobile && "p-4"
      )}>
        {children}
      </main>
    </div>
  );
};

// Helper function for responsive classes
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}