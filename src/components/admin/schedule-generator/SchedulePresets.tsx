import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Zap } from "lucide-react";

interface Preset {
  id: string;
  labelKey: string;
  days: number[];
  times: string[];
}

const presets: Preset[] = [
  { id: 'weekend', labelKey: 'pages.admin.scheduleGenerator.presets.weekend', days: [0, 6], times: ['15:00', '17:00'] },
  { id: 'weeknight', labelKey: 'pages.admin.scheduleGenerator.presets.weeknight', days: [1, 2, 3, 4], times: ['20:30', '21:30'] },
  { id: 'all', labelKey: 'pages.admin.scheduleGenerator.presets.allDays', days: [0, 1, 2, 3, 4, 5, 6], times: ['20:00'] },
];

interface SchedulePresetsProps {
  onApply: (days: number[], times: string) => void;
}

export function SchedulePresets({ onApply }: SchedulePresetsProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <Zap className="h-3 w-3" />
        {t('pages.admin.scheduleGenerator.presets.title')}
      </p>
      <div className="flex flex-wrap gap-2">
        {presets.map(preset => (
          <Button
            key={preset.id}
            type="button"
            variant="outline"
            size="sm"
            className="text-xs h-7"
            onClick={() => onApply(preset.days, preset.times.join(', '))}
          >
            {t(preset.labelKey)}
          </Button>
        ))}
      </div>
    </div>
  );
}
