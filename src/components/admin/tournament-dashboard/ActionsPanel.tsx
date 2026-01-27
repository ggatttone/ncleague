import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lightbulb } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { PhaseConfig } from "@/types/tournament-handlers";
import type { PhaseStatus } from "@/hooks/use-season-phase-status";

interface ActionsPanelProps {
  phases: PhaseConfig[];
  phaseStatusMap: Map<string, PhaseStatus>;
}

export function ActionsPanel({ phases, phaseStatusMap }: ActionsPanelProps) {
  const { t } = useTranslation();

  const suggestion = getSuggestion(phases, phaseStatusMap, t);
  if (!suggestion) return null;

  return (
    <Alert className="mb-6 border-primary/30 bg-primary/5">
      <Lightbulb className="h-4 w-4 text-primary" />
      <AlertDescription className="font-medium">
        {suggestion}
      </AlertDescription>
    </Alert>
  );
}

function getSuggestion(
  phases: PhaseConfig[],
  statusMap: Map<string, PhaseStatus>,
  t: (key: string, opts?: Record<string, string>) => string
): string | null {
  const sorted = [...phases].sort((a, b) => a.order - b.order);

  for (const phase of sorted) {
    const status = statusMap.get(phase.id);
    const phaseName = t(phase.nameKey, { defaultValue: phase.id });

    if (!status || status.status === 'pending') {
      return t('pages.admin.tournamentDashboard.actionsPanel.generateSchedule', { phase: phaseName });
    }

    if (status.status === 'in_progress') {
      const remaining = status.totalMatches - status.completedMatches;
      return t('pages.admin.tournamentDashboard.actionsPanel.completeMatches', { count: String(remaining), phase: phaseName });
    }

    if (status.status === 'scheduled') {
      return t('pages.admin.tournamentDashboard.actionsPanel.startMatches', { phase: phaseName });
    }

    // completed → continue to next phase
  }

  return t('pages.admin.tournamentDashboard.actionsPanel.allComplete');
}
