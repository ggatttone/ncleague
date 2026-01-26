import { AdminLayout } from "@/components/admin/AdminLayout";
import { Loader2 } from "lucide-react";
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
  const { currentStep, isLoading } = useWizard();

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
      <div>
        <h1 className="text-2xl font-bold">Nuova Stagione</h1>
        <p className="text-muted-foreground mt-1">
          Crea una nuova stagione seguendo i passaggi guidati
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
