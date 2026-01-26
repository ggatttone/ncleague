import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Check,
  Save,
  Loader2,
  Calendar,
  Users,
  Trophy,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  Info,
} from "lucide-react";
import { useTeams } from "@/hooks/use-teams";
import { useTournamentModes } from "@/hooks/use-tournament-modes";
import { getHandlerPhases, isValidHandlerKey } from "@/lib/tournament/handler-registry";
import { TournamentHandlerKey } from "@/types/tournament-handlers";
import { useWizard } from "./WizardContext";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface Warning {
  type: "warning" | "info";
  message: string;
}

export function ConfirmStep() {
  const { t } = useTranslation();
  const { formData, prevStep, saveAndExit, publishDraft, isSaving, isPublishing } = useWizard();
  const { data: teams } = useTeams();
  const { data: tournamentModes } = useTournamentModes();

  const [teamsOpen, setTeamsOpen] = useState(false);

  // Get selected teams
  const selectedTeams = useMemo(() => {
    const teamIds = formData.teams.team_ids || [];
    return teams?.filter(t => teamIds.includes(t.id)) || [];
  }, [teams, formData.teams.team_ids]);

  // Get selected tournament mode
  const selectedMode = useMemo(() => {
    return tournamentModes?.find(m => m.id === formData.tournament.tournament_mode_id);
  }, [tournamentModes, formData.tournament.tournament_mode_id]);

  // Get handler key and phases
  const handlerKey = selectedMode?.handler_key as TournamentHandlerKey | undefined;
  const phases = handlerKey && isValidHandlerKey(handlerKey)
    ? getHandlerPhases(handlerKey).filter(p => p.id !== 'start')
    : [];

  // Generate warnings
  const warnings = useMemo<Warning[]>(() => {
    const result: Warning[] = [];
    const teamCount = selectedTeams.length;

    if (teamCount === 0) {
      result.push({
        type: "warning",
        message: "Nessuna squadra selezionata. Potrai aggiungerle successivamente.",
      });
    }

    // Round-robin odd team warning
    if (handlerKey === "league_only" || handlerKey === "round_robin_final") {
      if (teamCount > 0 && teamCount % 2 !== 0) {
        result.push({
          type: "info",
          message: `Con ${teamCount} squadre (numero dispari), ogni giornata avrà una squadra a riposo.`,
        });
      }
    }

    // Groups knockout team validation
    if (handlerKey === "groups_knockout") {
      if (teamCount > 0 && teamCount < 4) {
        result.push({
          type: "warning",
          message: "Per la fase a gironi sono necessarie almeno 4 squadre.",
        });
      }
    }

    // Knockout bracket size validation
    if (handlerKey === "knockout") {
      const validSizes = [2, 4, 8, 16, 32];
      if (teamCount > 0 && !validSizes.includes(teamCount)) {
        const closest = validSizes.reduce((prev, curr) =>
          Math.abs(curr - teamCount) < Math.abs(prev - teamCount) ? curr : prev
        );
        result.push({
          type: "info",
          message: `Per un tabellone ad eliminazione diretta, il numero ideale di squadre è ${closest}.`,
        });
      }
    }

    if (!formData.basicInfo.start_date) {
      result.push({
        type: "info",
        message: "Data di inizio non specificata. Potrai impostarla successivamente.",
      });
    }

    if (!selectedMode) {
      result.push({
        type: "warning",
        message: "Nessuna modalità torneo selezionata.",
      });
    }

    return result;
  }, [selectedTeams.length, handlerKey, formData.basicInfo.start_date, selectedMode]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Non specificata";
    try {
      return format(new Date(dateStr), "d MMMM yyyy", { locale: it });
    } catch {
      return dateStr;
    }
  };

  const handleCreate = async () => {
    await publishDraft();
  };

  const isLoading = isSaving || isPublishing;
  const hasBlockingWarnings = warnings.some(w => w.type === "warning" && w.message.includes("Nessuna modalità"));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conferma e Crea</CardTitle>
        <CardDescription>
          Rivedi le informazioni e crea la stagione
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Summary Section */}
          <div className="space-y-4">
            {/* Basic Info */}
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Info className="h-4 w-4" />
                Informazioni Base
              </div>
              <div className="grid gap-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nome:</span>
                  <span className="font-medium">{formData.basicInfo.name || "Non specificato"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data Inizio:</span>
                  <span>{formatDate(formData.basicInfo.start_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data Fine:</span>
                  <span>{formatDate(formData.basicInfo.end_date)}</span>
                </div>
              </div>
            </div>

            {/* Teams */}
            <Collapsible open={teamsOpen} onOpenChange={setTeamsOpen}>
              <div className="rounded-lg border p-4">
                <CollapsibleTrigger asChild>
                  <button className="flex w-full items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Users className="h-4 w-4" />
                      Squadre
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{selectedTeams.length} squadre</Badge>
                      {teamsOpen ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <Separator className="my-3" />
                  {selectedTeams.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {selectedTeams.map(team => (
                        <div
                          key={team.id}
                          className="text-sm py-1 px-2 rounded bg-muted/50 truncate"
                          title={team.name}
                        >
                          {team.name}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Nessuna squadra selezionata
                    </p>
                  )}
                </CollapsibleContent>
              </div>
            </Collapsible>

            {/* Tournament Mode */}
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Trophy className="h-4 w-4" />
                Formato Torneo
              </div>
              <div className="grid gap-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Modalità:</span>
                  <span className="font-medium">{selectedMode?.name || "Non selezionata"}</span>
                </div>
                {formData.tournament.use_custom_settings && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Impostazioni:</span>
                    <Badge variant="outline">Personalizzate</Badge>
                  </div>
                )}
              </div>
              {phases.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <span className="text-sm text-muted-foreground">Fasi:</span>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {phases.map((phase, index) => (
                        <div key={phase.id} className="flex items-center gap-1">
                          <Badge variant="secondary" className="text-xs">
                            {t(phase.nameKey, { defaultValue: phase.id })}
                          </Badge>
                          {index < phases.length - 1 && (
                            <ChevronRight className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="space-y-2">
              {warnings.map((warning, index) => (
                <Alert key={index} variant={warning.type === "warning" ? "destructive" : "default"}>
                  {warning.type === "warning" ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : (
                    <Info className="h-4 w-4" />
                  )}
                  <AlertDescription>{warning.message}</AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-2 justify-between pt-4 border-t">
            <Button
              type="button"
              variant="ghost"
              onClick={prevStep}
              disabled={isLoading}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Indietro
            </Button>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={saveAndExit}
                disabled={isLoading}
              >
                <Save className="mr-2 h-4 w-4" />
                Salva Bozza
              </Button>
              <Button
                onClick={handleCreate}
                disabled={isLoading || hasBlockingWarnings}
              >
                {isPublishing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Crea Stagione
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
