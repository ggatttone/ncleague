import { Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { it } from "date-fns/locale";
import { useTranslation } from "react-i18next";

import { cn, formatMatchDateLocal } from "@/lib/utils";

export interface MobileLivescoreTeam {
  name: string;
  logo_url?: string | null;
}

export interface MobileLivescoreRowProps {
  match: {
    id: string;
    status: "scheduled" | "ongoing" | "completed" | "postponed" | "cancelled";
    match_date: string;
    home_score: number;
    away_score: number;
    home_teams: MobileLivescoreTeam;
    away_teams: MobileLivescoreTeam;
    venues?: { name: string } | null;
  };
}

const statusTone: Record<MobileLivescoreRowProps["match"]["status"], string> = {
  scheduled: "text-muted-foreground",
  ongoing: "text-green-600 dark:text-green-400",
  completed: "text-muted-foreground",
  postponed: "text-amber-600 dark:text-amber-400",
  cancelled: "text-destructive",
};

const getScoreLabel = (match: MobileLivescoreRowProps["match"]) => {
  if (match.status === "scheduled") return "vs";
  if (match.status === "postponed" || match.status === "cancelled") return "--";
  return `${match.home_score}-${match.away_score}`;
};

const TeamLine = ({ team }: { team: MobileLivescoreTeam }) => (
  <div className="flex items-center gap-2 min-w-0">
    {team.logo_url ? (
      <img
        src={team.logo_url}
        alt={`${team.name} logo`}
        className="h-5 w-5 rounded-full object-cover"
      />
    ) : (
      <div
        aria-label={`${team.name} fallback`}
        className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center"
      >
        <Trophy className="h-3 w-3" />
      </div>
    )}
    <span className="text-sm font-medium truncate">{team.name}</span>
  </div>
);

export const MobileLivescoreRow = ({ match }: MobileLivescoreRowProps) => {
  const { t } = useTranslation();

  const statusText = t(`matchStatus.${match.status}`, { defaultValue: match.status });
  const leadingLabel =
    match.status === "scheduled"
      ? formatMatchDateLocal(match.match_date, "HH:mm")
      : statusText;
  const dateLabel = formatMatchDateLocal(match.match_date, "dd MMM", it);
  const scoreLabel = getScoreLabel(match);
  const isScheduled = match.status === "scheduled";
  const isLive = match.status === "ongoing";

  return (
    <Link
      to={`/matches/${match.id}`}
      className="group grid grid-cols-[72px_minmax(0,1fr)_56px] items-center gap-3 px-3 py-2.5 hover:bg-muted/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      aria-label={`${match.home_teams.name} vs ${match.away_teams.name}, ${statusText}`}
    >
      <div className="min-w-0 flex flex-col justify-center">
        <div className={cn("text-[11px] font-semibold uppercase tracking-wide flex items-center gap-1", statusTone[match.status])}>
          {isLive && <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" aria-hidden />}
          <span className="truncate">{leadingLabel}</span>
        </div>
        <span className="text-[10px] text-muted-foreground">{dateLabel}</span>
      </div>

      <div className="min-w-0 flex flex-col gap-1">
        <TeamLine team={match.home_teams} />
        <TeamLine team={match.away_teams} />
      </div>

      <div className="text-right">
        <span
          className={cn(
            "tabular-nums font-bold leading-none",
            isScheduled ? "text-xs uppercase text-muted-foreground tracking-wide" : "text-base",
            isLive && "text-green-600 dark:text-green-400"
          )}
        >
          {scoreLabel}
        </span>
      </div>
    </Link>
  );
};

