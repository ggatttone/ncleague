import { ReactNode } from "react";
import { AdminSidebar } from "./AdminSidebar";
// No longer need useIsMobile here, AdminSidebar handles it internally
// import { useIsMobile } from "@/hooks/use-mobile"; 

export const AdminLayout = ({ children }: { children: ReactNode }) => {
  // const isMobile = useIsMobile(); // Removed this line

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar /> {/* AdminSidebar is now always rendered */}
      <main className="flex-1 p-4 md:p-8"> {/* Simplified padding, as sidebar handles its own space */}
        {children}
      </main>
    </div>
  );
};

// Helper function for responsive classes (still useful for other components)
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}