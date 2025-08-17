import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useHomepageLayout, useAddHomepageWidget, useUpdateHomepageWidget, useDeleteHomepageWidget, useReorderHomepageWidgets, HomepageWidget } from '@/hooks/use-homepage-layout';
import { Loader2, Plus, GripVertical, Trash2, Edit } from 'lucide-react';
import { HeroWidgetForm } from '@/components/admin/HeroWidgetForm';
import { showSuccess } from '@/utils/toast';

const WIDGET_CONFIG = {
  hero: { name: 'Hero Section', configurable: true },
  countdown: { name: 'Countdown Evento', configurable: false },
  media_carousel: { name: 'Carosello Media Recenti', configurable: false },
  upcoming_matches: { name: 'Prossime Partite', configurable: false },
  latest_news: { name: 'Ultime Notizie', configurable: false },
  league_table: { name: 'Classifica Widget', configurable: false },
};

type WidgetType = keyof typeof WIDGET_CONFIG;

const HomepageAdmin = () => {
  const { data: widgets, isLoading } = useHomepageLayout();
  const addWidgetMutation = useAddHomepageWidget();
  const updateWidgetMutation = useUpdateHomepageWidget();
  const deleteWidgetMutation = useDeleteHomepageWidget();
  const reorderWidgetsMutation = useReorderHomepageWidgets();

  const [editingWidget, setEditingWidget] = useState<HomepageWidget | null>(null);

  const handleAddWidget = (widgetType: WidgetType) => {
    const newOrder = widgets ? widgets.length : 0;
    const defaultSettings = widgetType === 'hero' ? {
      title: "Benvenuti su NC League",
      subtitle: "La piattaforma per la tua lega di calcetto: risultati, classifiche, statistiche e news!",
      buttonText: "Scopri l'ultima giornata",
      buttonLink: "/matches",
    } : null;

    addWidgetMutation.mutate({
      widget_type: widgetType,
      sort_order: newOrder,
      settings: defaultSettings,
    });
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (!widgets) return;
    const newWidgets = [...widgets];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newWidgets.length) return;

    [newWidgets[index], newWidgets[targetIndex]] = [newWidgets[targetIndex], newWidgets[index]];
    
    const reorderPayload = newWidgets.map((widget, idx) => ({
      ...widget,
      sort_order: idx,
    }));
    reorderWidgetsMutation.mutate(reorderPayload);
  };

  const handleSaveSettings = (settings: any) => {
    if (!editingWidget) return;
    updateWidgetMutation.mutate(
      { id: editingWidget.id, settings },
      {
        onSuccess: () => {
          showSuccess('Widget aggiornato!');
          setEditingWidget(null);
        },
      }
    );
  };

  const availableWidgets = Object.keys(WIDGET_CONFIG).filter(
    type => !widgets?.some(w => w.widget_type === type)
  );

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Gestione Homepage</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button disabled={availableWidgets.length === 0}>
              <Plus className="mr-2 h-4 w-4" /> Aggiungi Widget
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {availableWidgets.map(type => (
              <DropdownMenuItem key={type} onSelect={() => handleAddWidget(type as WidgetType)}>
                {WIDGET_CONFIG[type as WidgetType].name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Layout Corrente</CardTitle>
          <CardDescription>Aggiungi, rimuovi e riordina i blocchi che compongono la tua homepage.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : (
            <div className="space-y-4">
              {widgets?.map((widget, index) => (
                <div key={widget.id} className="flex items-center gap-4 p-3 border rounded-lg bg-background">
                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1 font-medium">
                    {WIDGET_CONFIG[widget.widget_type as WidgetType]?.name || widget.widget_type}
                  </div>
                  <div className="flex items-center gap-2">
                    {WIDGET_CONFIG[widget.widget_type as WidgetType]?.configurable && (
                      <Button variant="outline" size="sm" onClick={() => setEditingWidget(widget)}>
                        <Edit className="h-4 w-4 mr-2" /> Modifica
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => handleMove(index, 'up')} disabled={index === 0}>▲</Button>
                    <Button variant="ghost" size="icon" onClick={() => handleMove(index, 'down')} disabled={index === widgets.length - 1}>▼</Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => deleteWidgetMutation.mutate(widget.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {widgets?.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <p>La tua homepage è vuota.</p>
                  <p>Aggiungi un widget per iniziare.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <HeroWidgetForm
        widget={editingWidget}
        open={!!editingWidget}
        onOpenChange={() => setEditingWidget(null)}
        onSave={handleSaveSettings}
        isSaving={updateWidgetMutation.isPending}
      />
    </AdminLayout>
  );
};

export default HomepageAdmin;