/**
 * Round Robin + Final Settings Form
 *
 * Configuration form for Round Robin + Final tournament mode.
 * Allows setting league phase options (points, round-robin format),
 * playoff configuration (teams, format, third place), and tie-breakers.
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
import { Info, Trophy, Medal } from 'lucide-react';
import type { RoundRobinFinalSettings, PlayoffFormat } from '@/types/tournament-settings';
import { TieBreakersConfig } from './TieBreakersConfig';

interface RoundRobinFinalSettingsFormProps {
  value: RoundRobinFinalSettings;
  onChange: (value: RoundRobinFinalSettings) => void;
  disabled?: boolean;
  teamCount?: number;
}

const PLAYOFF_TEAMS_OPTIONS = [2, 4, 8] as const;

const PLAYOFF_FORMATS: { value: PlayoffFormat; labelKey: string; descriptionKey: string }[] = [
  {
    value: 'single_match',
    labelKey: 'tournament.settings.playoffFormatSingleMatch',
    descriptionKey: 'tournament.settings.playoffFormatSingleMatchDescription',
  },
  {
    value: 'home_away',
    labelKey: 'tournament.settings.playoffFormatHomeAway',
    descriptionKey: 'tournament.settings.playoffFormatHomeAwayDescription',
  },
  {
    value: 'best_of_3',
    labelKey: 'tournament.settings.playoffFormatBestOf3',
    descriptionKey: 'tournament.settings.playoffFormatBestOf3Description',
  },
];

export function RoundRobinFinalSettingsForm({
  value,
  onChange,
  disabled = false,
  teamCount,
}: RoundRobinFinalSettingsFormProps) {
  const { t } = useTranslation();

  // Calculate estimated match counts
  const calculations = useMemo(() => {
    const teams = teamCount ?? 8; // Default assumption
    const leagueMatchesPerRound = (teams * (teams - 1)) / 2;
    const totalLeagueMatches = value.doubleRoundRobin
      ? leagueMatchesPerRound * 2
      : leagueMatchesPerRound;

    // Playoff matches based on format
    let matchesPerPairing = 1;
    if (value.playoffFormat === 'home_away') {
      matchesPerPairing = 2;
    } else if (value.playoffFormat === 'best_of_3') {
      matchesPerPairing = 2.5; // Average (could be 2 or 3)
    }

    // Playoff bracket matches (n-1 for single elimination)
    const playoffRounds = Math.log2(value.playoffTeams);
    const playoffBracketMatches = (value.playoffTeams - 1) * matchesPerPairing;
    const thirdPlaceMatches = value.thirdPlaceMatch ? matchesPerPairing : 0;
    const totalPlayoffMatches = playoffBracketMatches + thirdPlaceMatches;
    const totalMatches = totalLeagueMatches + Math.ceil(totalPlayoffMatches);

    return {
      leagueMatches: totalLeagueMatches,
      playoffMatches: Math.ceil(totalPlayoffMatches),
      totalMatches,
      playoffRounds,
    };
  }, [value, teamCount]);

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
      {/* League Phase Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">
              {t('tournament.settings.leaguePhase')}
            </CardTitle>
          </div>
          <CardDescription>
            {t('tournament.settings.leaguePhaseDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Points System */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {t('tournament.settings.pointsSystem')}
            </Label>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pointsPerWin" className="text-xs text-muted-foreground">
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
                <Label htmlFor="pointsPerDraw" className="text-xs text-muted-foreground">
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
                <Label htmlFor="pointsPerLoss" className="text-xs text-muted-foreground">
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
          </div>

          {/* Double Round Robin */}
          <div className="flex items-center justify-between pt-2">
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

      {/* Playoff Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Medal className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">
              {t('tournament.settings.playoffConfiguration')}
            </CardTitle>
          </div>
          <CardDescription>
            {t('tournament.settings.playoffConfigurationDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Number of Playoff Teams */}
          <div className="space-y-2">
            <Label htmlFor="playoffTeams">
              {t('tournament.settings.playoffTeams')}
            </Label>
            <Select
              value={String(value.playoffTeams)}
              onValueChange={(v) =>
                onChange({ ...value, playoffTeams: parseInt(v) as 2 | 4 | 8 })
              }
              disabled={disabled}
            >
              <SelectTrigger id="playoffTeams">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLAYOFF_TEAMS_OPTIONS.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} {t('tournament.settings.teams')} ({t(`tournament.settings.playoffTeams${n}Description`)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {t('tournament.settings.playoffTeamsDescription')}
            </p>
          </div>

          {/* Playoff Format */}
          <div className="space-y-2">
            <Label htmlFor="playoffFormat">
              {t('tournament.settings.playoffFormat')}
            </Label>
            <Select
              value={value.playoffFormat}
              onValueChange={(v: PlayoffFormat) =>
                onChange({ ...value, playoffFormat: v })
              }
              disabled={disabled}
            >
              <SelectTrigger id="playoffFormat">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLAYOFF_FORMATS.map((format) => (
                  <SelectItem key={format.value} value={format.value}>
                    {t(format.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {t(
                PLAYOFF_FORMATS.find((f) => f.value === value.playoffFormat)
                  ?.descriptionKey || ''
              )}
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
              checked={value.thirdPlaceMatch}
              onCheckedChange={(checked) =>
                onChange({ ...value, thirdPlaceMatch: checked })
              }
              disabled={disabled}
            />
          </div>

          {/* Playoff Info Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              {t('tournament.settings.playoffSeedingInfo')}
            </AlertDescription>
          </Alert>
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
            <span>{t('tournament.settings.leagueMatchesEstimate')}:</span>
            <span className="font-medium">{calculations.leagueMatches}</span>
            <span>{t('tournament.settings.playoffMatchesEstimate')}:</span>
            <span className="font-medium">{calculations.playoffMatches}</span>
            <span className="font-medium">{t('tournament.settings.totalMatchesInfo', { count: '' })}:</span>
            <span className="font-bold">{calculations.totalMatches}</span>
          </div>
          {teamCount && teamCount < value.playoffTeams && (
            <Alert variant="destructive" className="mt-4">
              <Info className="h-4 w-4" />
              <AlertDescription>
                {t('tournament.validation.notEnoughTeamsForPlayoffs', {
                  required: value.playoffTeams,
                  available: teamCount,
                })}
              </AlertDescription>
            </Alert>
          )}
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
