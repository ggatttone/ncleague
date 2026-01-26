import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MultiSelect, OptionType } from "@/components/ui/multi-select";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Save, Loader2, Users } from "lucide-react";
import { useTeams } from "@/hooks/use-teams";
import { useWizard } from "./WizardContext";

export function TeamSelectionStep() {
  const { formData, setStepData, nextStep, prevStep, saveAndExit, isSaving } = useWizard();
  const { data: teams, isLoading: teamsLoading } = useTeams();

  const teamOptions: OptionType[] = teams?.map(t => ({
    value: t.id,
    label: t.name,
  })) || [];

  const selectedTeamIds = formData.teams.team_ids || [];
  const selectedCount = selectedTeamIds.length;

  const handleTeamsChange = (teamIds: string[]) => {
    setStepData("teams", { team_ids: teamIds });
  };

  const handleNext = async () => {
    await nextStep();
  };

  if (teamsLoading) {
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Selezione Squadre</CardTitle>
            <CardDescription>
              Seleziona le squadre che parteciperanno alla stagione
            </CardDescription>
          </div>
          <Badge variant="secondary" className="gap-1.5">
            <Users className="h-3.5 w-3.5" />
            {selectedCount} squadre selezionate
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <Label>Squadre Partecipanti</Label>
            <MultiSelect
              options={teamOptions}
              selected={selectedTeamIds}
              onChange={handleTeamsChange}
              placeholder="Seleziona le squadre..."
              maxCount={100} // Allow many teams
            />
            {selectedCount === 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                Nessuna squadra selezionata. Puoi continuare e aggiungerne in seguito.
              </p>
            )}
          </div>

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
