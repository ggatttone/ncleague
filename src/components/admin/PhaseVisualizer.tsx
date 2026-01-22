import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Stepper } from "@/components/ui/stepper";
import { getHandlerPhases } from "@/lib/tournament/handler-registry";
import type { TournamentHandlerKey, PhaseConfig } from "@/types/tournament-handlers";
import type { TournamentMode } from "@/types/database";

// Default fallback phases for backward compatibility
const DEFAULT_PHASES: PhaseConfig[] = [
  { id: "start", nameKey: "tournament.phases.start", order: 0, matchGeneration: { type: "round_robin" }, isTerminal: false },
  { id: "phase1", nameKey: "tournament.phases.phase1", order: 1, matchGeneration: { type: "swiss_pairing" }, isTerminal: false },
  { id: "phase2", nameKey: "tournament.phases.phase2", order: 2, matchGeneration: { type: "round_robin" }, isTerminal: false },
  { id: "final", nameKey: "tournament.phases.final", order: 3, matchGeneration: { type: "knockout" }, isTerminal: true },
];

interface PhaseVisualizerProps {
  /** Legacy: current phase as a number (0-based index) */
  currentPhase?: number;
  /** Current phase key (e.g., 'regular_season', 'quarter-final') */
  currentPhaseKey?: string;
  /** Tournament mode from the database */
  tournamentMode?: TournamentMode | null;
}

export const PhaseVisualizer = ({
  currentPhase,
  currentPhaseKey,
  tournamentMode,
}: PhaseVisualizerProps) => {
  const { t } = useTranslation();

  // Get phases from tournament mode or use defaults
  const phases = useMemo(() => {
    if (tournamentMode?.handler_key) {
      const handlerPhases = getHandlerPhases(tournamentMode.handler_key as TournamentHandlerKey);
      if (handlerPhases.length > 0) {
        return handlerPhases;
      }
    }
    return DEFAULT_PHASES;
  }, [tournamentMode]);

  // Convert phases to stepper steps
  const steps = useMemo(() => {
    return phases
      .sort((a, b) => a.order - b.order)
      .map((phase) => ({
        id: phase.id,
        label: t(phase.nameKey, { defaultValue: phase.id }),
      }));
  }, [phases, t]);

  // Determine current step index
  const currentStepIndex = useMemo(() => {
    // If currentPhaseKey is provided, find its index
    if (currentPhaseKey) {
      const index = phases.findIndex((p) => p.id === currentPhaseKey);
      if (index !== -1) {
        return index;
      }
    }

    // Fallback to legacy currentPhase number
    if (typeof currentPhase === "number") {
      return Math.min(currentPhase, phases.length - 1);
    }

    // Default to first phase
    return 0;
  }, [currentPhaseKey, currentPhase, phases]);

  return (
    <div className="mb-8 p-4 bg-card rounded-lg border">
      <Stepper steps={steps} currentStep={currentStepIndex} />
    </div>
  );
};
