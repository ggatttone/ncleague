import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ArrowRight, Save, Loader2, Trophy, Swords, Users, Shuffle, Award, ChevronRight, Settings2 } from "lucide-react";
import { useTournamentModes } from "@/hooks/use-tournament-modes";
import { getHandlerPhases, getHandlerMetadata, getAllHandlerMetadata, isValidHandlerKey } from "@/lib/tournament/handler-registry";
import { TournamentSettingsForm } from "@/components/admin/tournament-settings";
import { TournamentModeSettings } from "@/types/tournament-settings";
import { TournamentHandlerKey, PhaseConfig } from "@/types/tournament-handlers";
import { useWizard } from "./WizardContext";
import { cn } from "@/lib/utils";

const HANDLER_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Trophy,
  Swords,
  Users,
  Shuffle,
  Award,
};

function getIconComponent(iconName: string) {
  return HANDLER_ICONS[iconName] || Trophy;
}

export function TournamentFormatStep() {
  const { t } = useTranslation();
  const { formData, setStepData, nextStep, prevStep, saveAndExit, isSaving } = useWizard();
  const { data: tournamentModes, isLoading: modesLoading } = useTournamentModes();

  const [selectedModeId, setSelectedModeId] = useState<string | undefined>(
    formData.tournament.tournament_mode_id
  );
  const [useCustomSettings, setUseCustomSettings] = useState<boolean>(
    formData.tournament.use_custom_settings || false
  );
  const [customSettings, setCustomSettings] = useState<TournamentModeSettings | undefined>(
    formData.tournament.custom_settings
  );

  // Get handler metadata for all modes
  const handlerMetadata = getAllHandlerMetadata();

  // Get the selected mode and its handler key
  const selectedMode = tournamentModes?.find(m => m.id === selectedModeId);
  const selectedHandlerKey = selectedMode?.handler_key as TournamentHandlerKey | undefined;

  // Get phases for preview
  const phases = selectedHandlerKey && isValidHandlerKey(selectedHandlerKey)
    ? getHandlerPhases(selectedHandlerKey).filter(p => p.id !== 'start')
    : [];

  // Get handler metadata for the selected mode
  const selectedMetadata = selectedHandlerKey && isValidHandlerKey(selectedHandlerKey)
    ? getHandlerMetadata(selectedHandlerKey)
    : undefined;

  // Update form data when selection changes
  useEffect(() => {
    setStepData("tournament", {
      tournament_mode_id: selectedModeId,
      use_custom_settings: useCustomSettings,
      custom_settings: useCustomSettings ? customSettings : undefined,
    });
  }, [selectedModeId, useCustomSettings, customSettings, setStepData]);

  const handleModeSelect = (modeId: string) => {
    setSelectedModeId(modeId);
    // Reset custom settings when mode changes
    setCustomSettings(undefined);
    setUseCustomSettings(false);
  };

  const handleSettingsChange = (newSettings: TournamentModeSettings) => {
    setCustomSettings(newSettings);
  };

  const handleNext = async () => {
    await nextStep();
  };

  if (modesLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Formato Torneo</CardTitle>
        <CardDescription>
          Seleziona la modalità di torneo per questa stagione
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Tournament Mode Selection */}
          <div className="space-y-3">
            <Label>Modalità Torneo</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              {tournamentModes?.map((mode) => {
                const metadata = isValidHandlerKey(mode.handler_key)
                  ? getHandlerMetadata(mode.handler_key as TournamentHandlerKey)
                  : undefined;
                const Icon = metadata ? getIconComponent(metadata.icon) : Trophy;
                const isSelected = selectedModeId === mode.id;

                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => handleModeSelect(mode.id)}
                    className={cn(
                      "flex items-start gap-3 p-4 rounded-lg border-2 text-left transition-all",
                      "hover:border-primary/50 hover:bg-accent/50",
                      isSelected
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border"
                    )}
                  >
                    <div className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                      isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{mode.name}</div>
                      {mode.description && (
                        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                          {mode.description}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            {!selectedModeId && (
              <p className="text-sm text-muted-foreground">
                Seleziona una modalità per vedere le fasi del torneo
              </p>
            )}
          </div>

          {/* Custom Settings Toggle */}
          {selectedModeId && selectedHandlerKey && (
            <>
              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="custom-settings" className="flex items-center gap-2">
                    <Settings2 className="h-4 w-4" />
                    Personalizza Impostazioni
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Modifica le impostazioni predefinite del torneo
                  </p>
                </div>
                <Switch
                  id="custom-settings"
                  checked={useCustomSettings}
                  onCheckedChange={setUseCustomSettings}
                />
              </div>

              {/* Custom Settings Form */}
              {useCustomSettings && isValidHandlerKey(selectedHandlerKey) && (
                <div className="rounded-lg border bg-muted/30 p-4">
                  <TournamentSettingsForm
                    handlerKey={selectedHandlerKey}
                    value={customSettings || selectedMode?.settings as TournamentModeSettings}
                    onChange={handleSettingsChange}
                  />
                </div>
              )}

              <Separator />

              {/* Phases Preview */}
              <div className="space-y-3">
                <Label>Fasi del Torneo</Label>
                <div className="flex flex-wrap items-center gap-2">
                  {phases.map((phase, index) => (
                    <div key={phase.id} className="flex items-center gap-2">
                      <Badge variant="secondary" className="px-3 py-1.5">
                        {t(phase.nameKey, { defaultValue: phase.id })}
                      </Badge>
                      {index < phases.length - 1 && (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  ))}
                </div>
                {phases.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Nessuna fase configurata per questa modalità
                  </p>
                )}
              </div>
            </>
          )}

          {/* Navigation Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-2 justify-between pt-4 border-t">
            <Button
              type="button"
              variant="ghost"
              onClick={prevStep}
              disabled={isSaving}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Indietro
            </Button>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={saveAndExit}
                disabled={isSaving}
              >
                <Save className="mr-2 h-4 w-4" />
                Salva e Esci
              </Button>
              <Button onClick={handleNext} disabled={isSaving}>
                Avanti
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
