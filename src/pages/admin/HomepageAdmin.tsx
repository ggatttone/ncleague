import { useState, useEffect, useMemo } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useHomepageLayout, useUpdateHomepageLayout, Row, Column, Widget } from '@/hooks/use-homepage-layout';
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Loader2, Plus, Trash2, GripVertical, Edit, Layout } from 'lucide-react';
import { WIDGET_CONFIG } from '@/components/admin/layout-builder/WidgetRendererAdmin';
import { showSuccess } from '@/utils/toast';
import { createPortal } from 'react-dom';
import { HeroWidgetForm } from '@/components/admin/HeroWidgetForm';
import { PinnedArticleWidgetForm } from '@/components/admin/PinnedArticleWidgetForm';

type WidgetType = keyof typeof WIDGET_CONFIG;

const COLUMN_LAYOUTS = {
  '100%': [100],
  '50% / 50%': [50, 50],
  '70% / 30%': [70, 30],
  '30% / 70%': [30, 70],
  '33% / 33% / 33%': [33.33, 33.33, 33.33],
};

// Componente per un singolo Widget nella colonna
const SortableWidget = ({ widget, onEdit, onDelete }: { widget: Widget, onEdit: () => void, onDelete: () => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: widget.id, data: { type: 'Widget' } });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const config = WIDGET_CONFIG[widget.widget_type as WidgetType];

  return (
    <div ref={setNodeRef} style={style} className="p-3 border rounded bg-background flex items-center justify-between">
      <div className="flex items-center gap-2">
        <button {...attributes} {...listeners} className="cursor-grab touch-none"><GripVertical className="h-5 w-5 text-muted-foreground" /></button>
        <span className="text-sm font-medium">{config?.name || widget.widget_type}</span>
      </div>
      <div className="flex items-center gap-1">
        {config?.configurable && <Button variant="ghost" size="sm" onClick={onEdit}><Edit className="h-4 w-4" /></Button>}
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button>
      </div>
    </div>
  );
};

// Componente per una Colonna (dropzone)
const ColumnDropzone = ({ column, children }: { column: Column, children: React.ReactNode }) => {
  const { setNodeRef } = useSortable({ id: column.id, data: { type: 'Column' } });
  return (
    <div ref={setNodeRef} className="p-4 bg-muted/30 rounded-lg min-h-[100px] flex flex-col gap-2" style={{ flexBasis: `${column.width}%` }}>
      <SortableContext items={column.widgets.map(w => w.id)}>{children}</SortableContext>
    </div>
  );
};

// Componente per una Riga
const SortableRow = ({ row, onUpdateRow, onDeleteRow, children }: { row: Row, onUpdateRow: (rowId: string, newLayout: number[]) => void, onDeleteRow: (rowId: string) => void, children: React.ReactNode }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: row.id, data: { type: 'Row' } });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="p-4 border rounded-lg bg-background space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <button {...attributes} {...listeners} className="cursor-grab touch-none"><GripVertical /></button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="outline" size="sm"><Layout className="h-4 w-4 mr-2" /> Layout</Button></DropdownMenuTrigger>
            <DropdownMenuContent>
              {Object.entries(COLUMN_LAYOUTS).map(([key, value]) => (
                <DropdownMenuItem key={key} onSelect={() => onUpdateRow(row.id, value)}>{key}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => onDeleteRow(row.id)}><Trash2 className="h-4 w-4 mr-2" />Elimina Riga</Button>
      </div>
      <div className="flex flex-col md:flex-row gap-4">{children}</div>
    </div>
  );
};

// Componente per la Palette dei Widget
const WidgetPalette = ({ onAddWidget }: { onAddWidget: (type: string) => void }) => {
  return (
    <Card className="w-full lg:w-64">
      <CardHeader><CardTitle className="text-base">Widget Disponibili</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {Object.entries(WIDGET_CONFIG).map(([type, { name }]) => (
          <Button key={type} variant="outline" className="w-full justify-start" onClick={() => onAddWidget(type)}>
            <Plus className="h-4 w-4 mr-2" /> {name}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
};

const HomepageAdmin = () => {
  const { data: layoutData, isLoading } = useHomepageLayout();
  const updateLayoutMutation = useUpdateHomepageLayout();
  const [layout, setLayout] = useState<Row[]>([]);
  const [activeItem, setActiveItem] = useState<any>(null);
  const [editingWidget, setEditingWidget] = useState<Widget | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    if (layoutData) setLayout(layoutData.layout_data);
  }, [layoutData]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const type = active.data.current?.type;
    if (type === 'Row') setActiveItem(layout.find(r => r.id === active.id));
    if (type === 'Widget') setActiveItem(layout.flatMap(r => r.columns).flatMap(c => c.widgets).find(w => w.id === active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveItem(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();
    const activeType = active.data.current?.type;

    // --- 1. Handle Row Reordering ---
    if (activeType === 'Row' && over.data.current?.type === 'Row' && activeId !== overId) {
      setLayout(items => {
        const oldIndex = items.findIndex(i => i.id === activeId);
        const newIndex = items.findIndex(i => i.id === overId);
        return arrayMove(items, oldIndex, newIndex);
      });
      return;
    }

    // --- 2. Handle Widget Dragging ---
    if (activeType === 'Widget') {
      setLayout(prevLayout => {
        let sourceColumn: Column | undefined, overColumn: Column | undefined;
        let sourceWidgetIndex = -1, overWidgetIndex = -1;

        // Find source and destination columns and indices
        for (const row of prevLayout) {
          for (const col of row.columns) {
            const sIndex = col.widgets.findIndex(w => w.id === activeId);
            if (sIndex !== -1) {
              sourceColumn = col;
              sourceWidgetIndex = sIndex;
            }
            const oIndex = col.widgets.findIndex(w => w.id === overId);
            if (oIndex !== -1) {
              overColumn = col;
              overWidgetIndex = oIndex;
            }
            if (col.id === overId) {
              overColumn = col;
              overWidgetIndex = col.widgets.length;
            }
          }
        }

        if (!sourceColumn || !overColumn) return prevLayout;

        const newLayout = JSON.parse(JSON.stringify(prevLayout));
        const realSourceColumn = newLayout.flatMap((r: Row) => r.columns).find((c: Column) => c.id === sourceColumn!.id)!;
        const realOverColumn = newLayout.flatMap((r: Row) => r.columns).find((c: Column) => c.id === overColumn!.id)!;
        
        const [draggedWidget] = realSourceColumn.widgets.splice(sourceWidgetIndex, 1);

        if (realSourceColumn.id === realOverColumn.id) {
          // Reordering in the same column
          realOverColumn.widgets.splice(overWidgetIndex, 0, draggedWidget);
        } else {
          // Moving to a different column
          const finalOverIndex = overWidgetIndex === -1 ? realOverColumn.widgets.length : overWidgetIndex;
          realOverColumn.widgets.splice(finalOverIndex, 0, draggedWidget);
        }
        
        return newLayout;
      });
    }
  };

  const handleAddRow = () => setLayout(prev => [...prev, { id: `row_${Date.now()}`, columns: [{ id: `col_${Date.now()}`, width: 100, widgets: [] }] }]);
  const handleDeleteRow = (rowId: string) => setLayout(prev => prev.filter(row => row.id !== rowId));
  const handleUpdateRowLayout = (rowId: string, newLayout: number[]) => {
    setLayout(prev => prev.map(row => {
      if (row.id !== rowId) return row;
      const newColumns = newLayout.map((width, index) => ({
        id: row.columns[index]?.id || `col_${Date.now()}_${index}`,
        width,
        widgets: row.columns[index]?.widgets || [],
      }));
      if (row.columns.length > newColumns.length) {
        const orphanedWidgets = row.columns.slice(newColumns.length).flatMap(c => c.widgets);
        newColumns[0].widgets.push(...orphanedWidgets);
      }
      return { ...row, columns: newColumns };
    }));
  };

  const handleAddWidget = (type: string) => {
    setLayout(prev => {
      if (prev.length === 0) return prev;
      const newLayout = JSON.parse(JSON.stringify(prev));
      const firstColumn = newLayout[0].columns[0];
      firstColumn.widgets.push({
        id: `widget_${Date.now()}`,
        widget_type: type,
        settings: WIDGET_CONFIG[type as WidgetType]?.configurable ? {} : null,
      });
      return newLayout;
    });
  };

  const handleDeleteWidget = (widgetId: string) => {
    setLayout(prev => JSON.parse(JSON.stringify(prev)).map((row: Row) => ({
      ...row,
      columns: row.columns.map(col => ({
        ...col,
        widgets: col.widgets.filter(w => w.id !== widgetId),
      })),
    })));
  };

  const handleEditWidget = (widget: Widget) => {
    if (WIDGET_CONFIG[widget.widget_type as WidgetType]?.configurable) {
      setEditingWidget(widget);
    }
  };

  const handleSaveSettings = (settings: any) => {
    if (!editingWidget) return;
    setLayout(prev => JSON.parse(JSON.stringify(prev)).map((row: Row) => ({
      ...row,
      columns: row.columns.map(col => ({
        ...col,
        widgets: col.widgets.map(w => w.id === editingWidget.id ? { ...w, settings } : w),
      })),
    })));
    setEditingWidget(null);
  };

  const handleSaveLayout = () => updateLayoutMutation.mutate(layout, { onSuccess: () => showSuccess("Layout salvato!") });

  const allColumnIds = useMemo(() => layout.flatMap(r => r.columns.map(c => c.id)), [layout]);

  return (
    <AdminLayout>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={closestCorners}>
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Gestione Homepage</h1>
              <div className="flex gap-2">
                <Button onClick={handleAddRow}><Plus className="mr-2 h-4 w-4" /> Riga</Button>
                <Button onClick={handleSaveLayout} disabled={updateLayoutMutation.isPending}>
                  {updateLayoutMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salva
                </Button>
              </div>
            </div>
            <Card>
              <CardHeader><CardTitle>Layout</CardTitle><CardDescription>Trascina le righe per riordinarle e i widget per spostarli.</CardDescription></CardHeader>
              <CardContent>
                {isLoading ? <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div> : (
                  <SortableContext items={layout.map(r => r.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-4">
                      {layout.map(row => (
                        <SortableRow key={row.id} row={row} onDeleteRow={handleDeleteRow} onUpdateRow={handleUpdateRowLayout}>
                          <SortableContext items={allColumnIds}>
                            {row.columns.map(column => (
                              <ColumnDropzone key={column.id} column={column}>
                                {column.widgets.map(widget => (
                                  <SortableWidget key={widget.id} widget={widget} onDelete={() => handleDeleteWidget(widget.id)} onEdit={() => handleEditWidget(widget)} />
                                ))}
                              </ColumnDropzone>
                            ))}
                          </SortableContext>
                        </SortableRow>
                      ))}
                    </div>
                  </SortableContext>
                )}
                {layout.length === 0 && !isLoading && <div className="text-center py-12 text-muted-foreground"><p>Aggiungi una riga per iniziare.</p></div>}
              </CardContent>
            </Card>
          </div>
          <WidgetPalette onAddWidget={handleAddWidget} />
        </div>
        {createPortal(
          <DragOverlay>
            {activeItem?.type === 'Row' && <div className="p-4 border rounded-lg bg-muted/80 h-[150px]"><p className="font-bold">Riga</p></div>}
            {activeItem?.type === 'Widget' && <div className="p-3 border rounded bg-background opacity-90"><span className="font-medium">{WIDGET_CONFIG[activeItem.widget_type as WidgetType]?.name}</span></div>}
          </DragOverlay>,
          document.body
        )}
      </DndContext>
      {editingWidget && editingWidget.widget_type === 'hero' && (
        <HeroWidgetForm
          widget={editingWidget}
          open={!!editingWidget}
          onOpenChange={() => setEditingWidget(null)}
          onSave={handleSaveSettings}
          isSaving={false}
        />
      )}
      {editingWidget && editingWidget.widget_type === 'pinned_article' && (
        <PinnedArticleWidgetForm
          widget={editingWidget}
          open={!!editingWidget}
          onOpenChange={() => setEditingWidget(null)}
          onSave={handleSaveSettings}
          isSaving={false}
        />
      )}
    </AdminLayout>
  );
};

export default HomepageAdmin;