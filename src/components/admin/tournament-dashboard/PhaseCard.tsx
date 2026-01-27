import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PhaseStatusBadge } from "@/components/admin/schedule-generator/PhaseStatusBadge";
import { useTranslation } from "react-i18next";
import { Calendar, Eye, CheckCircle2 } from "lucide-react";
import type { PhaseConfig } from "@/types/tournament-handlers";
import type { PhaseStatus } from "@/hooks/use-season-phase-status";
import { cn } from "@/lib/utils";

export interface PhaseCardProps {
  phase: PhaseConfig;
  status: PhaseStatus | undefined;
  isCurrentPhase: boolean;
  onAction: (action: 'schedule' | 'view' | 'close') => void;
}

export function PhaseCard({ phase, status, isCurrentPhase, onAction }: PhaseCardProps) {
  const { t } = useTranslation();

  const phaseStatus = status?.status ?? 'pending';
  const total = status?.totalMatches ?? 0;
  const completed = status?.completedMatches ?? 0;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  const phaseName = t(phase.nameKey, { defaultValue: phase.id });

  return (
    <Card className={cn(
      "transition-all",
      isCurrentPhase && "ring-2 ring-primary shadow-md"
    )}>
      <CardContent className="pt-5 pb-4 px-5 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-sm truncate">{phaseName}</h3>
          <PhaseStatusBadge
            status={phaseStatus}
            totalMatches={total}
            completedMatches={completed}
          />
        </div>

        {total > 0 && (
          <div className="space-y-1">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground text-right">
              {completed}/{total} {t('pages.admin.tournamentDashboard.phaseCard.matches')}
            </p>
          </div>
        )}

        <PhaseAction status={phaseStatus} onAction={onAction} />
      </CardContent>
    </Card>
  );
}

function PhaseAction({ status, onAction }: { status: PhaseStatus['status']; onAction: PhaseCardProps['onAction'] }) {
  const { t } = useTranslation();

  switch (status) {
    case 'pending':
      return (
        <Button size="sm" variant="default" className="w-full" onClick={() => onAction('schedule')}>
          <Calendar className="h-3.5 w-3.5 mr-1.5" />
          {t('pages.admin.tournamentDashboard.phaseCard.generateSchedule')}
        </Button>
      );
    case 'scheduled':
    case 'in_progress':
      return (
        <Button size="sm" variant="outline" className="w-full" onClick={() => onAction('view')}>
          <Eye className="h-3.5 w-3.5 mr-1.5" />
          {t('pages.admin.tournamentDashboard.phaseCard.viewMatches')}
        </Button>
      );
    case 'completed':
      return (
        <Button size="sm" variant="secondary" className="w-full" onClick={() => onAction('close')}>
          <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
          {t('pages.admin.tournamentDashboard.phaseCard.closePhase')}
        </Button>
      );
    default:
      return null;
  }
}
