import { useHomepageLayout } from "@/hooks/use-homepage-layout";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { WidgetRenderer } from "@/components/WidgetRenderer";
import { Loader2 } from "lucide-react";

const SIDEBAR_WIDGETS = ['league_table'];

const Index = () => {
  const { data: widgets, isLoading } = useHomepageLayout();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  const mainWidgets = widgets?.filter(w => !SIDEBAR_WIDGETS.includes(w.widget_type)) || [];
  const sidebarWidgets = widgets?.filter(w => SIDEBAR_WIDGETS.includes(w.widget_type)) || [];

  return (
    <div className="bg-gray-50 dark:bg-background min-h-screen">
      <main className="container mx-auto py-8 px-4">
        {widgets && widgets.length === 0 && !isLoading && (
          <div className="text-center py-20 bg-card rounded-lg">
            <h1 className="text-3xl font-bold">Homepage in costruzione</h1>
            <p className="text-muted-foreground mt-4">Nessun widget è stato configurato. Torna più tardi!</p>
          </div>
        )}

        {widgets && widgets.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main column */}
            <div className="lg:col-span-2 space-y-8">
              {mainWidgets.map(widget => (
                <WidgetRenderer key={widget.id} widget={widget} />
              ))}
            </div>

            {/* Sidebar column */}
            {sidebarWidgets.length > 0 && (
              <div className="lg:col-span-1 space-y-8">
                {sidebarWidgets.map(widget => (
                  <WidgetRenderer key={widget.id} widget={widget} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
      <MadeWithDyad />
    </div>
  );
};

export default Index;