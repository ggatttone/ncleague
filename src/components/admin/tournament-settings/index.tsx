/**
 * Tournament Settings Form
 *
 * Dynamic form router that renders the appropriate settings form
 * based on the selected tournament handler.
 */

import { useTranslation } from 'react-i18next';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { TournamentHandlerKey } from '@/types/tournament-handlers';
import type { TournamentModeSettings, LeagueOnlySettings } from '@/types/tournament-settings';
import { DEFAULT_LEAGUE_ONLY_SETTINGS } from '@/types/tournament-settings';
import { getDefaultSettings } from '@/lib/tournament/handler-registry';
import { LeagueOnlySettingsForm } from './LeagueOnlySettingsForm';

interface TournamentSettingsFormProps {
  handlerKey: TournamentHandlerKey | string;
  value: TournamentModeSettings | null | undefined;
  onChange: (value: TournamentModeSettings) => void;
  disabled?: boolean;
}

/**
 * Get default settings for a handler, ensuring type safety
 */
function getTypedDefaultSettings(handlerKey: string): TournamentModeSettings {
  switch (handlerKey) {
    case 'league_only':
      return DEFAULT_LEAGUE_ONLY_SETTINGS;
    default:
      return getDefaultSettings(handlerKey as TournamentHandlerKey);
  }
}

/**
 * Type guard for LeagueOnlySettings
 */
function isLeagueOnlySettings(
  settings: TournamentModeSettings
): settings is LeagueOnlySettings {
  return (
    'pointsPerWin' in settings &&
    'pointsPerDraw' in settings &&
    'doubleRoundRobin' in settings
  );
}

export function TournamentSettingsForm({
  handlerKey,
  value,
  onChange,
  disabled = false,
}: TournamentSettingsFormProps) {
  const { t } = useTranslation();

  // Ensure we have valid settings
  const settings = value ?? getTypedDefaultSettings(handlerKey);

  switch (handlerKey) {
    case 'league_only':
      // Ensure settings match the expected type
      const leagueSettings: LeagueOnlySettings = isLeagueOnlySettings(settings)
        ? settings
        : DEFAULT_LEAGUE_ONLY_SETTINGS;
      return (
        <LeagueOnlySettingsForm
          value={leagueSettings}
          onChange={onChange}
          disabled={disabled}
        />
      );

    case 'knockout':
      // TODO: Implement KnockoutSettingsForm in Phase 3
      return (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t('tournament.settings.comingSoon', { mode: t('tournament.modes.knockout.name') })}
          </AlertDescription>
        </Alert>
      );

    case 'groups_knockout':
      // TODO: Implement GroupsKnockoutSettingsForm in Phase 4
      return (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t('tournament.settings.comingSoon', { mode: t('tournament.modes.groupsKnockout.name') })}
          </AlertDescription>
        </Alert>
      );

    case 'swiss_system':
      // TODO: Implement SwissSystemSettingsForm in Phase 5
      return (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t('tournament.settings.comingSoon', { mode: t('tournament.modes.swissSystem.name') })}
          </AlertDescription>
        </Alert>
      );

    case 'round_robin_final':
      // TODO: Implement RoundRobinFinalSettingsForm in Phase 6
      return (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t('tournament.settings.comingSoon', { mode: t('tournament.modes.roundRobinFinal.name') })}
          </AlertDescription>
        </Alert>
      );

    default:
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t('tournament.settings.unknownHandler', { handler: handlerKey })}
          </AlertDescription>
        </Alert>
      );
  }
}

// Re-export sub-components for direct usage if needed
export { LeagueOnlySettingsForm } from './LeagueOnlySettingsForm';
export { TieBreakersConfig } from './TieBreakersConfig';
