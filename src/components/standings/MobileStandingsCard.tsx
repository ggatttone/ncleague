import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import type { LeagueTableRow } from "@/types/database";

interface MobileStandingsCardProps {
  row: LeagueTableRow;
  position: number;
  isPlayoffSpot: boolean;
}

export const MobileStandingsCard = ({ row, position, isPlayoffSpot }: MobileStandingsCardProps) => {
  const { t } = useTranslation();

  return (
    <Link to={`/teams/${row.team_id}`}>
      <Card className={cn(
        "p-3 hover:shadow-md transition-shadow",
        isPlayoffSpot && "border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-900/10"
      )}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <span className="font-bold text-lg w-6 text-center text-muted-foreground">{position}</span>
            <Avatar className="h-7 w-7">
              <AvatarImage src={row.team_logo_url || undefined} alt={row.team_name} loading="lazy" />
              <AvatarFallback>{row.team_name.substring(0, 2)}</AvatarFallback>
            </Avatar>
            <span className="font-medium text-sm">{row.team_name}</span>
          </div>
          <span className="font-bold text-lg">
            {row.points} <span className="text-xs text-muted-foreground font-normal">{t('pages.tables.pts')}</span>
          </span>
        </div>
        <div className="grid grid-cols-4 gap-1 text-xs text-muted-foreground text-center ml-9">
          <div>{t('pages.tables.mp')}:{row.matches_played}</div>
          <div>{t('pages.tables.w')}:{row.wins}</div>
          <div>{t('pages.tables.d')}:{row.draws}</div>
          <div>{t('pages.tables.l')}:{row.losses}</div>
        </div>
      </Card>
    </Link>
  );
};
