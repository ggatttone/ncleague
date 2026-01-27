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
import type { TournamentModeSettings, LeagueOnlySettings, KnockoutSettings, GroupsKnockoutSettings, SwissSystemSettings, RoundRobinFinalSettings } from '@/types/tournament-settings';
import { DEFAULT_LEAGUE_ONLY_SETTINGS, DEFAULT_KNOCKOUT_SETTINGS, DEFAULT_GROUPS_KNOCKOUT_SETTINGS, DEFAULT_SWISS_SYSTEM_SETTINGS, DEFAULT_ROUND_ROBIN_FINAL_SETTINGS } from '@/types/tournament-settings';
import { getDefaultSettings } from '@/lib/tournament/handler-registry';
import { LeagueOnlySettingsForm } from './LeagueOnlySettingsForm';
import { KnockoutSettingsForm } from './KnockoutSettingsForm';
import { GroupsKnockoutSettingsForm } from './GroupsKnockoutSettingsForm';
import { SwissSystemSettingsForm } from './SwissSystemSettingsForm';
import { RoundRobinFinalSettingsForm } from './RoundRobinFinalSettingsForm';

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
    case 'swiss_system':
      return DEFAULT_SWISS_SYSTEM_SETTINGS;
    case 'round_robin_final':
      return DEFAULT_ROUND_ROBIN_FINAL_SETTINGS;
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

/**
 * Type guard for SwissSystemSettings
 */
function isSwissSystemSettings(
  settings: TournamentModeSettings
): settings is SwissSystemSettings {
  return (
    'phase1Rounds' in settings &&
    'snakeSeedingPattern' in settings &&
    'pouleFormat' in settings &&
    'finalStageTeams' in settings
  );
}

/**
 * Type guard for RoundRobinFinalSettings
 */
function isRoundRobinFinalSettings(
  settings: TournamentModeSettings
): settings is RoundRobinFinalSettings {
  return (
    'pointsPerWin' in settings &&
    'pointsPerDraw' in settings &&
    'doubleRoundRobin' in settings &&
    'playoffTeams' in settings &&
    'playoffFormat' in settings
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
    case 'league_only': {
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
    }

    case 'knockout': {
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
    }

    case 'groups_knockout': {
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
    }

    case 'swiss_system': {
      const swissSettings: SwissSystemSettings = isSwissSystemSettings(settings)
        ? settings
        : DEFAULT_SWISS_SYSTEM_SETTINGS;
      return (
        <SwissSystemSettingsForm
          value={swissSettings}
          onChange={onChange}
          disabled={disabled}
        />
      );
    }

    case 'round_robin_final': {
      const roundRobinFinalSettings: RoundRobinFinalSettings = isRoundRobinFinalSettings(settings)
        ? settings
        : DEFAULT_ROUND_ROBIN_FINAL_SETTINGS;
      return (
        <RoundRobinFinalSettingsForm
          value={roundRobinFinalSettings}
          onChange={onChange}
          disabled={disabled}
        />
      );
    }

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
export { SwissSystemSettingsForm } from './SwissSystemSettingsForm';
export { RoundRobinFinalSettingsForm } from './RoundRobinFinalSettingsForm';
export { TieBreakersConfig } from './TieBreakersConfig';
