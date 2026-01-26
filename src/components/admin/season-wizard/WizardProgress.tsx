import { Stepper } from "@/components/ui/stepper";
import { Badge } from "@/components/ui/badge";
import { Cloud, Loader2 } from "lucide-react";
import { useWizard, WIZARD_STEPS } from "./WizardContext";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";

export function WizardProgress() {
  const { currentStep, draftId, lastSaved, isSaving } = useWizard();

  const steps = WIZARD_STEPS.map(step => ({ label: step.label }));

  return (
    <div className="space-y-4">
      <Stepper steps={steps} currentStep={currentStep} />

      {draftId && (
        <div className="flex justify-center">
          <Badge variant="secondary" className="gap-1.5">
            {isSaving ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Salvataggio...
              </>
            ) : (
              <>
                <Cloud className="h-3 w-3" />
                Bozza salvata
                {lastSaved && (
                  <span className="text-muted-foreground">
                    {formatDistanceToNow(lastSaved, { addSuffix: true, locale: it })}
                  </span>
                )}
              </>
            )}
          </Badge>
        </div>
      )}
    </div>
  );
}
