/**
 * Groups + Knockout Settings Form
 *
 * Configuration form for Groups + Knockout tournament mode.
 * Allows setting group count, teams per group, advancing teams,
 * and knockout bracket settings.
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
import { Info, Users, Trophy } from 'lucide-react';
import type { GroupsKnockoutSettings, SeedingMethod } from '@/types/tournament-settings';
import { TieBreakersConfig } from './TieBreakersConfig';

interface GroupsKnockoutSettingsFormProps {
  value: GroupsKnockoutSettings;
  onChange: (value: GroupsKnockoutSettings) => void;
  disabled?: boolean;
}

const GROUP_OPTIONS = [2, 4, 6, 8] as const;
const TEAMS_PER_GROUP_OPTIONS = [3, 4, 5, 6] as const;
const ADVANCING_OPTIONS = [1, 2, 3, 4] as const;

const SEEDING_METHODS: { value: SeedingMethod; labelKey: string }[] = [
  { value: 'seeded', labelKey: 'tournament.settings.seedingMethods.seeded' },
  { value: 'random', labelKey: 'tournament.settings.seedingMethods.random' },
  { value: 'manual', labelKey: 'tournament.settings.seedingMethods.manual' },
];

export function GroupsKnockoutSettingsForm({
  value,
  onChange,
  disabled = false,
}: GroupsKnockoutSettingsFormProps) {
  const { t } = useTranslation();

  // Calculate derived values
  const calculations = useMemo(() => {
    const totalTeams = value.groupCount * value.teamsPerGroup;
    const advancingTeams = value.groupCount * value.advancingPerGroup;
    const groupMatches = value.teamsPerGroup * (value.teamsPerGroup - 1) / 2;
    const totalGroupMatches = groupMatches * value.groupCount * (value.doubleRoundRobin ? 2 : 1);
    const knockoutMatches = advancingTeams - 1 + (value.knockoutSettings.thirdPlaceMatch ? 1 : 0);
    const totalMatches = totalGroupMatches + knockoutMatches;

    return {
      totalTeams,
      advancingTeams,
      totalGroupMatches,
      knockoutMatches,
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

  const handleKnockoutChange = (
    field: keyof GroupsKnockoutSettings['knockoutSettings'],
    newValue: unknown
  ) => {
    onChange({
      ...value,
      knockoutSettings: {
        ...value.knockoutSettings,
        [field]: newValue,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Group Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">
              {t('tournament.settings.groupConfiguration')}
            </CardTitle>
          </div>
          <CardDescription>
            {t('tournament.settings.groupConfigurationDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="groupCount">
                {t('tournament.settings.groupCount')}
              </Label>
              <Select
                value={String(value.groupCount)}
                onValueChange={(v) => onChange({ ...value, groupCount: parseInt(v) })}
                disabled={disabled}
              >
                <SelectTrigger id="groupCount">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GROUP_OPTIONS.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} {t('tournament.settings.groups')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="teamsPerGroup">
                {t('tournament.settings.teamsPerGroup')}
              </Label>
              <Select
                value={String(value.teamsPerGroup)}
                onValueChange={(v) => onChange({ ...value, teamsPerGroup: parseInt(v) })}
                disabled={disabled}
              >
                <SelectTrigger id="teamsPerGroup">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEAMS_PER_GROUP_OPTIONS.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} {t('tournament.settings.teams')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="advancingPerGroup">
                {t('tournament.settings.advancingPerGroup')}
              </Label>
              <Select
                value={String(value.advancingPerGroup)}
                onValueChange={(v) => onChange({ ...value, advancingPerGroup: parseInt(v) })}
                disabled={disabled}
              >
                <SelectTrigger id="advancingPerGroup">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ADVANCING_OPTIONS.filter(n => n <= value.teamsPerGroup).map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} {t('tournament.settings.teamsAdvance')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Summary */}
          <Alert className="mt-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span>{t('tournament.settings.totalTeamsRequired')}:</span>
                <span className="font-medium">{calculations.totalTeams}</span>
                <span>{t('tournament.settings.teamsInKnockout')}:</span>
                <span className="font-medium">{calculations.advancingTeams}</span>
                <span>{t('tournament.settings.totalMatchesInfo', { count: '' })}:</span>
                <span className="font-medium">{calculations.totalMatches}</span>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Points System */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t('tournament.settings.pointsSystem')}
          </CardTitle>
          <CardDescription>
            {t('tournament.settings.pointsSystemGroupDescription')}
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

          {/* Double Round Robin */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="space-y-0.5">
              <Label htmlFor="doubleRoundRobin">
                {t('tournament.settings.doubleRoundRobin')}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t('tournament.settings.doubleRoundRobinGroupDescription')}
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

      {/* Knockout Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">
              {t('tournament.settings.knockoutPhase')}
            </CardTitle>
          </div>
          <CardDescription>
            {t('tournament.settings.knockoutPhaseDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Seeding Method */}
          <div className="space-y-2">
            <Label htmlFor="seedingMethod">
              {t('tournament.settings.seedingMethod')}
            </Label>
            <Select
              value={value.knockoutSettings.seedingMethod}
              onValueChange={(v: SeedingMethod) =>
                handleKnockoutChange('seedingMethod', v)
              }
              disabled={disabled}
            >
              <SelectTrigger id="seedingMethod">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SEEDING_METHODS.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {t(method.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {t('tournament.settings.knockoutSeedingDescription')}
            </p>
          </div>

          {/* Third Place Match */}
          <div className="flex items-center justify-between pt-2">
            <div className="space-y-0.5">
              <Label htmlFor="thirdPlaceMatch">
                {t('tournament.settings.thirdPlaceMatch')}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t('tournament.settings.thirdPlaceMatchDescription')}
              </p>
            </div>
            <Switch
              id="thirdPlaceMatch"
              checked={value.knockoutSettings.thirdPlaceMatch}
              onCheckedChange={(checked) =>
                handleKnockoutChange('thirdPlaceMatch', checked)
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
