/**
 * League Only Settings Form
 *
 * Configuration form for League Only tournament mode.
 * Allows setting points system, round-robin format, and tie-breakers.
 */

import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { LeagueOnlySettings } from '@/types/tournament-settings';
import { TieBreakersConfig } from './TieBreakersConfig';

interface LeagueOnlySettingsFormProps {
  value: LeagueOnlySettings;
  onChange: (value: LeagueOnlySettings) => void;
  disabled?: boolean;
}

export function LeagueOnlySettingsForm({
  value,
  onChange,
  disabled = false,
}: LeagueOnlySettingsFormProps) {
  const { t } = useTranslation();

  const handlePointsChange = (
    field: 'pointsPerWin' | 'pointsPerDraw' | 'pointsPerLoss',
    newValue: number
  ) => {
    onChange({
      ...value,
      [field]: newValue,
    });
  };

  return (
    <div className="space-y-6">
      {/* Points System */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t('tournament.settings.pointsSystem')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pointsPerWin">
                {t('tournament.settings.pointsPerWin')}
              </Label>
              <Input
                id="pointsPerWin"
                type="number"
                min={0}
                max={10}
                value={value.pointsPerWin}
                onChange={(e) =>
                  handlePointsChange('pointsPerWin', parseInt(e.target.value) || 0)
                }
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pointsPerDraw">
                {t('tournament.settings.pointsPerDraw')}
              </Label>
              <Input
                id="pointsPerDraw"
                type="number"
                min={0}
                max={10}
                value={value.pointsPerDraw}
                onChange={(e) =>
                  handlePointsChange('pointsPerDraw', parseInt(e.target.value) || 0)
                }
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pointsPerLoss">
                {t('tournament.settings.pointsPerLoss')}
              </Label>
              <Input
                id="pointsPerLoss"
                type="number"
                min={0}
                max={10}
                value={value.pointsPerLoss}
                onChange={(e) =>
                  handlePointsChange('pointsPerLoss', parseInt(e.target.value) || 0)
                }
                disabled={disabled}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Match Format */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t('tournament.settings.matchFormat')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="doubleRoundRobin">
                {t('tournament.settings.doubleRoundRobin')}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t('tournament.settings.doubleRoundRobinDescription')}
              </p>
            </div>
            <Switch
              id="doubleRoundRobin"
              checked={value.doubleRoundRobin}
              onCheckedChange={(checked) =>
                onChange({ ...value, doubleRoundRobin: checked })
              }
              disabled={disabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tie Breakers */}
      <TieBreakersConfig
        value={value.tieBreakers}
        onChange={(tieBreakers) => onChange({ ...value, tieBreakers })}
        disabled={disabled}
      />
    </div>
  );
}
