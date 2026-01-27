import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import type { PhaseStatus } from "@/hooks/use-season-phase-status";

const statusConfig = {
  pending: { variant: "secondary" as const, className: "bg-muted text-muted-foreground" },
  scheduled: { variant: "default" as const, className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  in_progress: { variant: "default" as const, className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" },
  completed: { variant: "default" as const, className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
};

interface PhaseStatusBadgeProps {
  status: PhaseStatus['status'];
  totalMatches?: number;
  completedMatches?: number;
}

export function PhaseStatusBadge({ status, totalMatches, completedMatches }: PhaseStatusBadgeProps) {
  const { t } = useTranslation();
  const config = statusConfig[status];

  const label = t(`pages.admin.scheduleGenerator.phaseStatus.${status}`);
  const count = totalMatches != null && completedMatches != null && totalMatches > 0
    ? ` (${completedMatches}/${totalMatches})`
    : '';

  return (
    <Badge variant={config.variant} className={`${config.className} text-[10px] px-1.5 py-0 font-normal`}>
      {label}{count}
    </Badge>
  );
}
