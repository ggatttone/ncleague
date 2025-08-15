import { ReactNode, useState } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

export const AdminLayout = ({ children }: { children: ReactNode }) => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      {/* Desktop Sidebar */}
      <aside className="hidden border-r bg-sidebar md:block">
        <AdminSidebar />
      </aside>
      
      {/* Mobile Header + Main Content */}
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6 md:hidden">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Apri menu di navigazione</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0 w-full max-w-xs bg-sidebar border-r-0">
              <AdminSidebar onLinkClick={() => setIsSheetOpen(false)} />
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1">
            <h1 className="font-semibold text-lg">Admin Panel</h1>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};