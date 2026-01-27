import { AdminLayout } from "@/components/admin/AdminLayout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Loader2, Pencil, X, AlertTriangle } from "lucide-react";
import { useSeasonMatches } from "@/hooks/use-matches";
import {
  WizardProvider,
  useWizard,
  WizardProgress,
  BasicInfoStep,
  TeamSelectionStep,
  TournamentFormatStep,
  ConfirmStep,
} from "@/components/admin/season-wizard";

function WizardContent() {
  const { currentStep, isLoading, isEditMode, editingSeasonName, editingSeasonId, discardDraft } = useWizard();
  const { data: seasonMatches } = useSeasonMatches(editingSeasonId || undefined);
  const matchCount = seasonMatches?.length || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <BasicInfoStep />;
      case 1:
        return <TeamSelectionStep />;
      case 2:
        return <TournamentFormatStep />;
      case 3:
        return <ConfirmStep />;
      default:
        return <BasicInfoStep />;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Edit Mode Banner */}
      {isEditMode && editingSeasonName && (
        <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
          <Pencil className="h-4 w-4 text-amber-600" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              Stai modificando la stagione <strong>{editingSeasonName}</strong>
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={discardDraft}
              className="text-amber-700 hover:text-amber-900 hover:bg-amber-100"
            >
              <X className="h-4 w-4 mr-1" />
              Annulla modifiche
            </Button>
          </AlertDescription>
          {matchCount > 0 && (
            <AlertDescription className="flex items-center gap-2 mt-1 pt-1 border-t border-amber-200 dark:border-amber-800">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <span className="text-amber-700 dark:text-amber-300 text-sm">
                Questa stagione ha <strong>{matchCount}</strong> partite esistenti. Potrai scegliere se mantenerle o eliminarle nello step finale.
              </span>
            </AlertDescription>
          )}
        </Alert>
      )}

      <div>
        <h1 className="text-2xl font-bold">
          {isEditMode ? "Modifica Stagione" : "Nuova Stagione"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isEditMode
            ? "Modifica i dettagli della stagione esistente"
            : "Crea una nuova stagione seguendo i passaggi guidati"}
        </p>
      </div>

      <WizardProgress />

      {renderStep()}
    </div>
  );
}

const SeasonWizard = () => {
  return (
    <AdminLayout>
      <WizardProvider>
        <WizardContent />
      </WizardProvider>
    </AdminLayout>
  );
};

export default SeasonWizard;
