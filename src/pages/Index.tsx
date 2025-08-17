import { useHomepageLayout } from "@/hooks/use-homepage-layout";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { WidgetRenderer } from "@/components/WidgetRenderer";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { data: layoutData, isLoading } = useHomepageLayout();
  const layout = layoutData?.layout_data || [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-background min-h-screen">
      <main className="container mx-auto py-8 px-4">
        {layout.length === 0 && !isLoading ? (
          <div className="text-center py-20 bg-card rounded-lg">
            <h1 className="text-3xl font-bold">Homepage in costruzione</h1>
            <p className="text-muted-foreground mt-4">Nessun widget è stato configurato. Torna più tardi!</p>
          </div>
        ) : (
          <div className="space-y-8">
            {layout.map(row => (
              <div key={row.id} className="flex flex-col lg:flex-row gap-8">
                {row.columns.map(column => (
                  <div key={column.id} className="space-y-8" style={{ flexBasis: `${column.width}%` }}>
                    {column.widgets.map(widget => (
                      <WidgetRenderer key={widget.id} widget={{
                        id: widget.id,
                        widget_type: widget.widget_type,
                        settings: widget.settings,
                        sort_order: 0, // sort_order non è più usato qui
                        created_at: ''
                      }} />
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </main>
      <MadeWithDyad />
    </div>
  );
};

export default Index;