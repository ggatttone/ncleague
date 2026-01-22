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
import type { TournamentModeSettings, LeagueOnlySettings, KnockoutSettings, GroupsKnockoutSettings } from '@/types/tournament-settings';
import { DEFAULT_LEAGUE_ONLY_SETTINGS, DEFAULT_KNOCKOUT_SETTINGS, DEFAULT_GROUPS_KNOCKOUT_SETTINGS } from '@/types/tournament-settings';
import { getDefaultSettings } from '@/lib/tournament/handler-registry';
import { LeagueOnlySettingsForm } from './LeagueOnlySettingsForm';
import { KnockoutSettingsForm } from './KnockoutSettingsForm';
import { GroupsKnockoutSettingsForm } from './GroupsKnockoutSettingsForm';

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
    case 'knockout':
      return DEFAULT_KNOCKOUT_SETTINGS;
    case 'groups_knockout':
      return DEFAULT_GROUPS_KNOCKOUT_SETTINGS;
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

/**
 * Type guard for KnockoutSettings
 */
function isKnockoutSettings(
  settings: TournamentModeSettings
): settings is KnockoutSettings {
  return (
    'bracketSize' in settings &&
    'seedingMethod' in settings &&
    'thirdPlaceMatch' in settings
  );
}

/**
 * Type guard for GroupsKnockoutSettings
 */
function isGroupsKnockoutSettings(
  settings: TournamentModeSettings
): settings is GroupsKnockoutSettings {
  return (
    'groupCount' in settings &&
    'teamsPerGroup' in settings &&
    'advancingPerGroup' in settings &&
    'knockoutSettings' in settings
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
      // Ensure settings match the expected type
      const knockoutSettings: KnockoutSettings = isKnockoutSettings(settings)
        ? settings
        : DEFAULT_KNOCKOUT_SETTINGS;
      return (
        <KnockoutSettingsForm
          value={knockoutSettings}
          onChange={onChange}
          disabled={disabled}
        />
      );

    case 'groups_knockout':
      // Ensure settings match the expected type
      const groupsSettings: GroupsKnockoutSettings = isGroupsKnockoutSettings(settings)
        ? settings
        : DEFAULT_GROUPS_KNOCKOUT_SETTINGS;
      return (
        <GroupsKnockoutSettingsForm
          value={groupsSettings}
          onChange={onChange}
          disabled={disabled}
        />
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
export { KnockoutSettingsForm } from './KnockoutSettingsForm';
export { GroupsKnockoutSettingsForm } from './GroupsKnockoutSettingsForm';
export { TieBreakersConfig } from './TieBreakersConfig';
