import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { GripVertical } from "lucide-react";

export const WIDGET_CONFIG = {
  hero: { name: 'Hero Section' },
  countdown: { name: 'Countdown Evento' },
  media_carousel: { name: 'Carosello Media' },
  upcoming_matches: { name: 'Prossime Partite' },
  latest_news: { name: 'Ultime Notizie' },
  league_table: { name: 'Classifica' },
};

interface WidgetRendererAdminProps {
  type: string;
}

export const WidgetRendererAdmin = ({ type }: WidgetRendererAdminProps) => {
  const config = WIDGET_CONFIG[type as keyof typeof WIDGET_CONFIG];
  return (
    <Card className="p-3">
      <CardHeader className="p-0 flex flex-row items-center gap-2">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
        <CardTitle className="text-sm font-medium">{config?.name || type}</CardTitle>
      </CardHeader>
    </Card>
  );
};