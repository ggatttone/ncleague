import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { LeagueTableRow } from '@/types/database';
import { useTranslation } from "react-i18next";

interface ProactiveValidatorProps {
  standings: LeagueTableRow[] | null | undefined;
}

export const ProactiveValidator = ({ standings }: ProactiveValidatorProps) => {
  const { t } = useTranslation();
  if (!standings || standings.length === 0) return null;

  const warnings: string[] = [];

  const firstTeamMatchesPlayed = standings[0].matches_played;
  const allSameMatches = standings.every(team => team.matches_played === firstTeamMatchesPlayed);
  if (!allSameMatches) {
    warnings.push(t('pages.admin.tournamentDashboard.validator.unevenMatches'));
  }

  if (warnings.length === 0) return null;

  return (
    <Alert variant="destructive" className="mb-6">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>{t('pages.admin.tournamentDashboard.validator.title')}</AlertTitle>
      <AlertDescription>
        <ul className="list-disc pl-5">
          {warnings.map((warning, i) => <li key={i}>{warning}</li>)}
        </ul>
      </AlertDescription>
    </Alert>
  );
};