import { Stepper } from "@/components/ui/stepper";
import { useTranslation } from "react-i18next";

const steps = [
  { id: "start", label: "Inizio Torneo" },
  { id: "phase1", label: "Fase 1" },
  { id: "phase2", label: "Fase 2" },
  { id: "final", label: "Fase Finale" },
];

export const PhaseVisualizer = ({ currentPhase }: { currentPhase: number }) => {
  const { t } = useTranslation();
  const translatedSteps = steps.map(step => ({ ...step, label: t(`pages.admin.tournamentDashboard.phases.${step.label.replace(' ', '')}`) }));

  return (
    <div className="mb-8 p-4 bg-card rounded-lg border">
      <Stepper steps={translatedSteps} currentStep={currentPhase} />
    </div>
  );
};