/**
 * Swiss System Settings Form
 *
 * Configuration form for Swiss System tournament mode.
 * Allows setting phase 1 rounds, snake seeding pattern,
 * poule format, and final stage configuration.
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Shuffle, Users, Trophy } from 'lucide-react';
import type { SwissSystemSettings, PouleFormat } from '@/types/tournament-settings';
import { TieBreakersConfig } from './TieBreakersConfig';

interface SwissSystemSettingsFormProps {
  value: SwissSystemSettings;
  onChange: (value: SwissSystemSettings) => void;
  disabled?: boolean;
}

const PHASE1_ROUNDS_OPTIONS = [3, 4, 5, 6, 7, 8, 9, 10] as const;
const FINAL_STAGE_TEAMS_OPTIONS = [2, 4, 6, 8] as const;

// Preset snake seeding patterns for common team counts
const SNAKE_SEEDING_PRESETS: { teams: number; pattern: number[][] }[] = [
  { teams: 6, pattern: [[1, 4, 5], [2, 3, 6]] },
  { teams: 8, pattern: [[1, 4, 5, 8], [2, 3, 6, 7]] },
  { teams: 10, pattern: [[1, 4, 5, 8, 9], [2, 3, 6, 7, 10]] },
  { teams: 12, pattern: [[1, 4, 5, 8, 9, 12], [2, 3, 6, 7, 10, 11]] },
];

const POULE_FORMATS: { value: PouleFormat; labelKey: string }[] = [
  { value: 'round_robin', labelKey: 'tournament.settings.pouleFormatRoundRobin' },
  { value: 'swiss', labelKey: 'tournament.settings.pouleFormatSwiss' },
];

export function SwissSystemSettingsForm({
  value,
  onChange,
  disabled = false,
}: SwissSystemSettingsFormProps) {
  const { t } = useTranslation();

  // Calculate derived values
  const calculations = useMemo(() => {
    const teamsPerPoule = value.snakeSeedingPattern[0]?.length || 4;
    const pouleCount = value.snakeSeedingPattern.length;
    const totalTeams = teamsPerPoule * pouleCount;
    const phase1Matches = Math.floor(totalTeams / 2) * value.phase1Rounds;
    const pouleMatches = teamsPerPoule * (teamsPerPoule - 1) / 2 * pouleCount * (value.doubleRoundRobin ? 2 : 1);
    const finalMatches = value.finalStageTeams - 1; // Knockout matches
    const totalMatches = phase1Matches + pouleMatches + finalMatches;

    return {
      totalTeams,
      teamsPerPoule,
      pouleCount,
      phase1Matches,
      pouleMatches,
      finalMatches,
      totalMatches,
    };
  }, [value]);

  const handlePointsChange = (
    field: 'pointsPerWin' | 'pointsPerDraw' | 'pointsPerLoss',
    newValue: number
  ) => {
    onChange({
      ...value,
      [field]: newValue,
    });
  };

  const handleSnakeSeedingChange = (teamCount: number) => {
    const preset = SNAKE_SEEDING_PRESETS.find(p => p.teams === teamCount);
    if (preset) {
      onChange({
        ...value,
        snakeSeedingPattern: preset.pattern,
      });
    }
  };

  // Format snake seeding pattern for display
  const formatSnakePattern = (pattern: number[][]): string => {
    return pattern.map((poule, idx) =>
      `Poule ${String.fromCharCode(65 + idx)}: ${poule.join(', ')}`
    ).join(' | ');
  };

  return (
    <div className="space-y-6">
      {/* Phase 1 Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shuffle className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">
              {t('tournament.settings.phase1Configuration')}
            </CardTitle>
          </div>
          <CardDescription>
            {t('tournament.settings.phase1ConfigurationDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phase1Rounds">
                {t('tournament.settings.phase1Rounds')}
              </Label>
              <Select
                value={String(value.phase1Rounds)}
                onValueChange={(v) => onChange({ ...value, phase1Rounds: parseInt(v) })}
                disabled={disabled}
              >
                <SelectTrigger id="phase1Rounds">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PHASE1_ROUNDS_OPTIONS.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} {t('tournament.settings.rounds')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {t('tournament.settings.phase1RoundsDescription')}
              </p>
            </div>

            {/* Phase 1 matches info */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                {t('tournament.settings.phase1MatchesInfo', {
                  count: calculations.phase1Matches,
                })}
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Points System */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t('tournament.settings.pointsSystem')}
          </CardTitle>
          <CardDescription>
            {t('tournament.settings.pointsSystemDescription')}
          </CardDescription>
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

      {/* Snake Seeding Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">
              {t('tournament.settings.snakeSeeding')}
            </CardTitle>
          </div>
          <CardDescription>
            {t('tournament.settings.snakeSeedingDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Team count selector for preset patterns */}
          <div className="space-y-2">
            <Label htmlFor="teamCount">
              {t('tournament.settings.teamCountForSeeding')}
            </Label>
            <Select
              value={String(calculations.totalTeams)}
              onValueChange={(v) => handleSnakeSeedingChange(parseInt(v))}
              disabled={disabled}
            >
              <SelectTrigger id="teamCount">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SNAKE_SEEDING_PRESETS.map((preset) => (
                  <SelectItem key={preset.teams} value={String(preset.teams)}>
                    {preset.teams} {t('tournament.settings.teams')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Current pattern display */}
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm font-medium mb-1">
              {t('tournament.settings.currentPattern')}:
            </p>
            <p className="text-sm text-muted-foreground font-mono">
              {formatSnakePattern(value.snakeSeedingPattern)}
            </p>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              {t('tournament.settings.snakeSeedingExplanation')}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Poule Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t('tournament.settings.pouleConfiguration')}
          </CardTitle>
          <CardDescription>
            {t('tournament.settings.pouleConfigurationDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pouleFormat">
              {t('tournament.settings.pouleFormat')}
            </Label>
            <Select
              value={value.pouleFormat}
              onValueChange={(v: PouleFormat) => onChange({ ...value, pouleFormat: v })}
              disabled={disabled}
            >
              <SelectTrigger id="pouleFormat">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {POULE_FORMATS.map((format) => (
                  <SelectItem key={format.value} value={format.value}>
                    {t(format.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Double Round Robin (only for round_robin format) */}
          {value.pouleFormat === 'round_robin' && (
            <div className="flex items-center justify-between pt-2">
              <div className="space-y-0.5">
                <Label htmlFor="doubleRoundRobin">
                  {t('tournament.settings.doubleRoundRobin')}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t('tournament.settings.doubleRoundRobinPouleDescription')}
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
          )}

          {/* Poule matches info */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              {t('tournament.settings.pouleMatchesInfo', {
                count: calculations.pouleMatches,
                teamsPerPoule: calculations.teamsPerPoule,
                pouleCount: calculations.pouleCount,
              })}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Final Stage Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">
              {t('tournament.settings.finalStage')}
            </CardTitle>
          </div>
          <CardDescription>
            {t('tournament.settings.finalStageDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="finalStageTeams">
              {t('tournament.settings.finalStageTeams')}
            </Label>
            <Select
              value={String(value.finalStageTeams)}
              onValueChange={(v) => onChange({ ...value, finalStageTeams: parseInt(v) })}
              disabled={disabled}
            >
              <SelectTrigger id="finalStageTeams">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FINAL_STAGE_TEAMS_OPTIONS.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} {t('tournament.settings.teams')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {t('tournament.settings.finalStageTeamsDescription')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t('tournament.settings.summary')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span>{t('tournament.settings.totalTeamsRequired')}:</span>
            <span className="font-medium">{calculations.totalTeams}</span>
            <span>{t('tournament.settings.phase1Matches')}:</span>
            <span className="font-medium">{calculations.phase1Matches}</span>
            <span>{t('tournament.settings.pouleMatches')}:</span>
            <span className="font-medium">{calculations.pouleMatches}</span>
            <span>{t('tournament.settings.finalMatches')}:</span>
            <span className="font-medium">{calculations.finalMatches}</span>
            <span className="font-medium">{t('tournament.settings.totalMatchesInfo', { count: '' })}:</span>
            <span className="font-bold">{calculations.totalMatches}</span>
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
