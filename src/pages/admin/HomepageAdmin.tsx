import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useHomepageLayout, useUpdateHomepageLayout, Row, Column, Widget } from '@/hooks/use-homepage-layout';
import { DndContext, closestCenter, DragEndEvent, DragStartEvent, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Loader2, Plus, Trash2, GripVertical } from 'lucide-react';
import { WIDGET_CONFIG, WidgetRendererAdmin } from '@/components/admin/layout-builder/WidgetRendererAdmin';
import { showSuccess } from '@/utils/toast';
import { createPortal } from 'react-dom';

// Componente per una singola riga sortable
const SortableRow = ({ row, onUpdateRow, onDeleteRow, children }: { row: Row, onUpdateRow: (rowId: string, columns: Column[]) => void, onDeleteRow: (rowId: string) => void, children: React.ReactNode }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: row.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="p-4 border rounded-lg bg-muted/50 space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <button {...attributes} {...listeners} className="cursor-grab"><GripVertical /></button>
          <p className="text-sm font-medium">Riga</p>
        </div>
        <Button variant="destructive" size="sm" onClick={() => onDeleteRow(row.id)}><Trash2 className="h-4 w-4 mr-2" />Elimina Riga</Button>
      </div>
      <div>{children}</div>
    </div>
  );
};

const HomepageAdmin = () => {
  const { data: layoutData, isLoading } = useHomepageLayout();
  const updateLayoutMutation = useUpdateHomepageLayout();
  const [layout, setLayout] = useState<Row[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (layoutData) {
      setLayout(layoutData.layout_data);
    }
  }, [layoutData]);

  const handleAddRow = () => {
    const newRow: Row = {
      id: `row_${Date.now()}`,
      columns: [{ id: `col_${Date.now()}`, width: 100, widgets: [] }],
    };
    setLayout(prev => [...prev, newRow]);
  };

  const handleDeleteRow = (rowId: string) => {
    setLayout(prev => prev.filter(row => row.id !== rowId));
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setLayout((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSaveLayout = () => {
    updateLayoutMutation.mutate(layout, {
      onSuccess: () => showSuccess("Layout salvato con successo!"),
    });
  };

  const activeRow = activeId ? layout.find(r => r.id === activeId) : null;

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Gestione Homepage</h1>
        <div className="flex gap-2">
          <Button onClick={handleAddRow}><Plus className="mr-2 h-4 w-4" /> Aggiungi Riga</Button>
          <Button onClick={handleSaveLayout} disabled={updateLayoutMutation.isPending}>
            {updateLayoutMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salva Layout
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Layout Corrente</CardTitle>
          <CardDescription>Trascina le righe per riordinarle. Clicca su una riga per aggiungere widget.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : (
            <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
              <SortableContext items={layout.map(r => r.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-4">
                  {layout.map(row => (
                    <SortableRow key={row.id} row={row} onDeleteRow={handleDeleteRow} onUpdateRow={() => {}}>
                      <div className="p-4 bg-background rounded text-center text-muted-foreground">
                        <p>Questa è una riga. La gestione dei widget e delle colonne verrà aggiunta nel prossimo step.</p>
                      </div>
                    </SortableRow>
                  ))}
                </div>
              </SortableContext>
              {createPortal(
                <DragOverlay>
                  {activeRow ? (
                     <div className="p-4 border rounded-lg bg-muted/50 space-y-4 opacity-75">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <GripVertical />
                            <p className="text-sm font-medium">Riga</p>
                          </div>
                        </div>
                      </div>
                  ) : null}
                </DragOverlay>,
                document.body
              )}
            </DndContext>
          )}
          {layout.length === 0 && !isLoading && (
            <div className="text-center py-12 text-muted-foreground">
              <p>La tua homepage è vuota. Aggiungi una riga per iniziare.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default HomepageAdmin;