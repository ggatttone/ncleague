/**
 * Tie Breakers Configuration
 *
 * Drag-and-drop interface for ordering tie-breaker criteria.
 * Used across all tournament modes that have standings.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GripVertical, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TieBreakerCriteria } from '@/types/tournament-settings';

interface TieBreakersConfigProps {
  value: TieBreakerCriteria[];
  onChange: (value: TieBreakerCriteria[]) => void;
  disabled?: boolean;
}

const ALL_TIE_BREAKERS: TieBreakerCriteria[] = [
  'head_to_head',
  'goal_difference',
  'goals_scored',
  'goals_against',
  'wins',
  'fair_play',
];

export function TieBreakersConfig({
  value,
  onChange,
  disabled = false,
}: TieBreakersConfigProps) {
  const { t } = useTranslation();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const availableTieBreakers = ALL_TIE_BREAKERS.filter(
    (tb) => !value.includes(tb)
  );

  const handleDragStart = (index: number) => {
    if (disabled) return;
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (disabled || draggedIndex === null || draggedIndex === index) return;

    const newValue = [...value];
    const draggedItem = newValue[draggedIndex];
    newValue.splice(draggedIndex, 1);
    newValue.splice(index, 0, draggedItem);
    setDraggedIndex(index);
    onChange(newValue);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleRemove = (index: number) => {
    if (disabled) return;
    if (value.length <= 1) return; // Keep at least one
    const newValue = [...value];
    newValue.splice(index, 1);
    onChange(newValue);
  };

  const handleAdd = (tieBreaker: TieBreakerCriteria) => {
    if (disabled) return;
    onChange([...value, tieBreaker]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {t('tournament.settings.tieBreakers')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {t('tournament.settings.tieBreakersDescription')}
        </p>

        {/* Current tie-breakers list */}
        <div className="space-y-2">
          {value.map((tieBreaker, index) => (
            <div
              key={tieBreaker}
              draggable={!disabled}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`
                flex items-center gap-2 p-3 bg-muted rounded-lg
                ${!disabled ? 'cursor-grab active:cursor-grabbing' : ''}
                ${draggedIndex === index ? 'opacity-50' : ''}
              `}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground mr-2">
                {index + 1}.
              </span>
              <span className="flex-1">
                {t(`tournament.settings.tieBreaker.${tieBreaker}`)}
              </span>
              {value.length > 1 && !disabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(index)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Add tie-breaker */}
        {availableTieBreakers.length > 0 && !disabled && (
          <Select onValueChange={(v) => handleAdd(v as TieBreakerCriteria)}>
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={t('tournament.settings.addTieBreaker')}
              />
            </SelectTrigger>
            <SelectContent>
              {availableTieBreakers.map((tieBreaker) => (
                <SelectItem key={tieBreaker} value={tieBreaker}>
                  {t(`tournament.settings.tieBreaker.${tieBreaker}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </CardContent>
    </Card>
  );
}
