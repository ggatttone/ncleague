/**
 * Knockout Settings Form
 *
 * Configuration form for Knockout tournament mode.
 * Allows setting bracket size, seeding method, and third place match option.
 */

import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Info } from 'lucide-react';
import type { KnockoutSettings, SeedingMethod } from '@/types/tournament-settings';

interface KnockoutSettingsFormProps {
  value: KnockoutSettings;
  onChange: (value: KnockoutSettings) => void;
  disabled?: boolean;
}

const BRACKET_SIZES = [4, 8, 16, 32] as const;

const SEEDING_METHODS: { value: SeedingMethod; labelKey: string; descriptionKey: string }[] = [
  {
    value: 'seeded',
    labelKey: 'tournament.settings.seedingMethods.seeded',
    descriptionKey: 'tournament.settings.seedingMethods.seededDescription',
  },
  {
    value: 'random',
    labelKey: 'tournament.settings.seedingMethods.random',
    descriptionKey: 'tournament.settings.seedingMethods.randomDescription',
  },
  {
    value: 'manual',
    labelKey: 'tournament.settings.seedingMethods.manual',
    descriptionKey: 'tournament.settings.seedingMethods.manualDescription',
  },
];

export function KnockoutSettingsForm({
  value,
  onChange,
  disabled = false,
}: KnockoutSettingsFormProps) {
  const { t } = useTranslation();

  // Calculate number of matches based on bracket size
  const calculateTotalMatches = (bracketSize: number, thirdPlace: boolean): number => {
    // In single elimination: n-1 matches for n teams + optional 3rd place
    return bracketSize - 1 + (thirdPlace ? 1 : 0);
  };

  const totalMatches = calculateTotalMatches(value.bracketSize, value.thirdPlaceMatch);

  return (
    <div className="space-y-6">
      {/* Bracket Size */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t('tournament.settings.bracketSize')}
          </CardTitle>
          <CardDescription>
            {t('tournament.settings.bracketSizeDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-2">
              {BRACKET_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => onChange({ ...value, bracketSize: size })}
                  disabled={disabled}
                  className={`
                    flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all
                    ${value.bracketSize === size
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                    }
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <span className="text-2xl font-bold">{size}</span>
                  <span className="text-xs text-muted-foreground">
                    {t('tournament.settings.teams')}
                  </span>
                </button>
              ))}
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                {t('tournament.settings.totalMatchesInfo', { count: totalMatches })}
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Seeding Method */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t('tournament.settings.seedingMethod')}
          </CardTitle>
          <CardDescription>
            {t('tournament.settings.seedingMethodDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={value.seedingMethod}
            onValueChange={(method: SeedingMethod) =>
              onChange({ ...value, seedingMethod: method })
            }
            disabled={disabled}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SEEDING_METHODS.map((method) => (
                <SelectItem key={method.value} value={method.value}>
                  <div className="flex flex-col">
                    <span>{t(method.labelKey)}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Description of selected method */}
          <p className="text-sm text-muted-foreground mt-2">
            {t(
              SEEDING_METHODS.find((m) => m.value === value.seedingMethod)
                ?.descriptionKey ?? ''
            )}
          </p>
        </CardContent>
      </Card>

      {/* Third Place Match */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t('tournament.settings.additionalMatches')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
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

          <div className="flex items-center justify-between opacity-50">
            <div className="space-y-0.5">
              <Label htmlFor="doubleElimination">
                {t('tournament.settings.doubleElimination')}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t('tournament.settings.doubleEliminationDescription')}
              </p>
            </div>
            <Switch
              id="doubleElimination"
              checked={value.doubleElimination}
              onCheckedChange={(checked) =>
                onChange({ ...value, doubleElimination: checked })
              }
              disabled={true} // Not yet implemented
            />
          </div>

          {value.doubleElimination && (
            <Alert variant="default">
              <Info className="h-4 w-4" />
              <AlertDescription>
                {t('tournament.settings.doubleEliminationNotYetAvailable')}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
