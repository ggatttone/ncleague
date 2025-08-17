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
import { Loader2, Plus, Trash2, GripVertical, Edit, Layout, Columns, ChevronsLeftRight } from 'lucide-react';
import { WIDGET_CONFIG } from '@/components/admin/layout-builder/WidgetRendererAdmin';
import { showSuccess } from '@/utils/toast';
import { createPortal } from 'react-dom';
import { HeroWidgetForm } from '@/components/admin/HeroWidgetForm';

type WidgetType = keyof typeof WIDGET_CONFIG;

const COLUMN_LAYOUTS = {
  '100': [100],
  '50/50': [50, 50],
  '70/30': [70, 30],
  '30/70': [30, 70],
  '33/33/33': [33.33, 33.33, 33.33],
};

// Componente per un singolo Widget nella colonna
const SortableWidget = ({ widget, onEdit, onDelete }: { widget: Widget, onEdit: () => void, onDelete: () => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: widget.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const config = WIDGET_CONFIG[widget.widget_type as WidgetType];

  return (
    <div ref={setNodeRef} style={style} className="p-3 border rounded bg-background flex items-center justify-between">
      <div className="flex items-center gap-2">
        <button {...attributes} {...listeners} className="cursor-grab"><GripVertical className="h-5 w-5 text-muted-foreground" /></button>
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
          <button {...attributes} {...listeners} className="cursor-grab"><GripVertical /></button>
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
      <div className="flex gap-4">{children}</div>
    </div>
  );
};

// Componente per la Palette dei Widget
const WidgetPalette = () => {
  return (
    <Card className="w-full lg:w-64">
      <CardHeader><CardTitle className="text-base">Widget Disponibili</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {Object.entries(WIDGET_CONFIG).map(([type, { name }]) => (
          <DraggablePaletteWidget key={type} id={type} name={name} />
        ))}
      </CardContent>
    </Card>
  );
};

const DraggablePaletteWidget = ({ id, name }: { id: string, name: string }) => {
  const { attributes, listeners, setNodeRef } = useSortable({ id: `palette-${id}`, data: { type: 'PaletteWidget', widgetType: id } });
  return (
    <div ref={setNodeRef} {...attributes} {...listeners} className="p-2 border rounded bg-background cursor-grab flex items-center gap-2">
      <GripVertical className="h-5 w-5 text-muted-foreground" />
      <span className="text-sm">{name}</span>
    </div>
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

  const findContainer = (id: string): { type: 'row' | 'column', container: Row | Column } | null => {
    if (layout.find(r => r.id === id)) return { type: 'row', container: layout.find(r => r.id === id)! };
    for (const row of layout) {
      const column = row.columns.find(c => c.id === id);
      if (column) return { type: 'column', container: column };
      const widget = row.columns.flatMap(c => c.widgets).find(w => w.id === id);
      if (widget) {
        const parentColumn = row.columns.find(c => c.widgets.some(w => w.id === id));
        return { type: 'column', container: parentColumn! };
      }
    }
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const type = active.data.current?.type;
    if (type === 'Row') setActiveItem(layout.find(r => r.id === active.id));
    if (type === 'Widget') setActiveItem(layout.flatMap(r => r.columns).flatMap(c => c.widgets).find(w => w.id === active.id));
    if (type === 'PaletteWidget') setActiveItem({ id: active.id, type: 'PaletteWidget', widgetType: active.data.current?.widgetType });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveItem(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();
    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    // Reordering rows
    if (activeType === 'Row' && overType === 'Row' && activeId !== overId) {
      setLayout(items => arrayMove(items, items.findIndex(i => i.id === activeId), items.findIndex(i => i.id === overId)));
      return;
    }

    const activeContainerInfo = findContainer(activeId);
    const overContainerInfo = findContainer(overId);

    // Moving widgets
    if (activeType === 'Widget' || activeType === 'PaletteWidget') {
      setLayout(prevLayout => {
        const newLayout = JSON.parse(JSON.stringify(prevLayout));
        const overColumnId = overType === 'Column' ? overId : overContainerInfo?.type === 'column' ? overContainerInfo.container.id : null;
        if (!overColumnId) return prevLayout;

        let widgetToAdd: Widget;
        let activeColumnId: string | null = null;
        let activeWidgetIndex = -1;

        // Find and remove active widget if it's not from palette
        if (activeType === 'Widget') {
          for (const row of newLayout) {
            for (const col of row.columns) {
              const idx = col.widgets.findIndex(w => w.id === activeId);
              if (idx !== -1) {
                activeColumnId = col.id;
                activeWidgetIndex = idx;
                break;
              }
            }
            if (activeColumnId) break;
          }
          if (activeColumnId) {
            const [removedWidget] = newLayout.flatMap(r => r.columns).find(c => c.id === activeColumnId)!.widgets.splice(activeWidgetIndex, 1);
            widgetToAdd = removedWidget;
          } else {
            return prevLayout; // Should not happen
          }
        } else { // New widget from palette
          const widgetType = active.data.current?.widgetType;
          widgetToAdd = {
            id: `widget_${Date.now()}`,
            widget_type: widgetType,
            settings: WIDGET_CONFIG[widgetType as WidgetType]?.configurable ? {} : null,
          };
        }

        // Add widget to new column
        const overColumn = newLayout.flatMap(r => r.columns).find(c => c.id === overColumnId);
        if (!overColumn) return prevLayout;

        const overWidgetIndex = overType === 'Widget' ? overColumn.widgets.findIndex(w => w.id === overId) : overColumn.widgets.length;
        overColumn.widgets.splice(overWidgetIndex, 0, widgetToAdd);

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
      // Move widgets from removed columns to the first new column
      if (row.columns.length > newColumns.length) {
        const orphanedWidgets = row.columns.slice(newColumns.length).flatMap(c => c.widgets);
        newColumns[0].widgets.push(...orphanedWidgets);
      }
      return { ...row, columns: newColumns };
    }));
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
  const allWidgetIds = useMemo(() => layout.flatMap(r => r.columns.flatMap(c => c.widgets.map(w => w.id))), [layout]);

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
              <CardHeader><CardTitle>Layout</CardTitle><CardDescription>Trascina righe e widget per costruire la pagina.</CardDescription></CardHeader>
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
          <SortableContext items={Object.keys(WIDGET_CONFIG).map(t => `palette-${t}`)}>
            <WidgetPalette />
          </SortableContext>
        </div>
        {createPortal(
          <DragOverlay>
            {activeItem?.type === 'Row' && <div className="p-4 border rounded-lg bg-muted/80 h-[150px]"><p className="font-bold">Riga</p></div>}
            {activeItem?.type === 'Widget' && <div className="p-3 border rounded bg-background opacity-90"><span className="font-medium">{WIDGET_CONFIG[activeItem.widget_type as WidgetType]?.name}</span></div>}
            {activeItem?.type === 'PaletteWidget' && <div className="p-2 border rounded bg-background opacity-90"><span className="text-sm">{WIDGET_CONFIG[activeItem.widgetType as WidgetType]?.name}</span></div>}
          </DragOverlay>,
          document.body
        )}
      </DndContext>
      {editingWidget && WIDGET_CONFIG[editingWidget.widget_type as WidgetType]?.configurable && (
        <HeroWidgetForm
          widget={editingWidget}
          open={!!editingWidget}
          onOpenChange={() => setEditingWidget(null)}
          onSave={handleSaveSettings}
          isSaving={false} // The main save button handles the mutation state
        />
      )}
    </AdminLayout>
  );
};

export default HomepageAdmin;