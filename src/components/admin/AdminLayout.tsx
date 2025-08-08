import { ReactNode } from "react";
import { AdminSidebar } from "./AdminSidebar";

export const AdminLayout = ({ children }: { children: ReactNode }) => (
  <div className="flex min-h-screen bg-background">
    <AdminSidebar />
    <main className="flex-1 p-8">{children}</main>
  </div>
);