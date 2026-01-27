import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Trophy, ArrowUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNclStandings } from "@/hooks/use-ncl-standings";
import type { LeagueTableRow } from "@/types/database";
import { cn } from "@/lib/utils";

interface GroupStageViewProps {
  competitionId: string;
  seasonId: string;
  groups: string[]; // e.g., ["group_a", "group_b", "group_c", "group_d"]
  advancingPerGroup?: number;
  compact?: boolean;
}

interface GroupTableProps {
  groupId: string;
  standings: LeagueTableRow[];
  advancingCount: number;
  compact?: boolean;
}

interface ConnectedGroupTableProps {
  competitionId: string;
  seasonId: string;
  groupId: string;
  advancingCount: number;
  compact?: boolean;
}

const GroupTablePresentation = ({ groupId, standings, advancingCount, compact }: GroupTableProps) => {
  const { t } = useTranslation();

  // Format group name: "group_a" -> "Group A"
  const groupName = useMemo(() => {
    const letter = groupId.replace("group_", "").toUpperCase();
    return `${t("tournament.phases.group", { defaultValue: "Group" })} ${letter}`;
  }, [groupId, t]);

  if (standings.length === 0) {
    return (
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            {groupName}
          </CardTitle>
        </CardHeader>
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground text-center">
            {t("components.groupStageView.noTeams", { defaultValue: "No teams in this group" })}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4" />
          {groupName}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8 text-center">#</TableHead>
              <TableHead>{t("pages.tables.team")}</TableHead>
              <TableHead className="text-center w-10">{t("pages.tables.pld")}</TableHead>
              {!compact && (
                <>
                  <TableHead className="text-center w-10">{t("pages.tables.w")}</TableHead>
                  <TableHead className="text-center w-10">{t("pages.tables.d")}</TableHead>
                  <TableHead className="text-center w-10">{t("pages.tables.l")}</TableHead>
                </>
              )}
              <TableHead className="text-center w-12">{t("pages.tables.gd")}</TableHead>
              <TableHead className="text-center w-12 font-bold">{t("pages.tables.pts")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {standings.map((row, index) => {
              const position = index + 1;
              const isAdvancing = position <= advancingCount;

              return (
                <TableRow
                  key={row.team_id}
                  className={cn(
                    isAdvancing && "bg-green-50 dark:bg-green-950/30",
                    position === advancingCount && "border-b-2 border-green-500"
                  )}
                >
                  <TableCell className="text-center font-medium">
                    <div className="flex items-center justify-center gap-1">
                      {position}
                      {isAdvancing && (
                        <ArrowUp className="h-3 w-3 text-green-600" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={row.team_logo_url || undefined} alt={row.team_name} />
                        <AvatarFallback className="text-xs">
                          {row.team_name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className={cn(
                        "text-sm truncate max-w-[120px]",
                        isAdvancing && "font-medium"
                      )}>
                        {row.team_name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-sm">{row.played}</TableCell>
                  {!compact && (
                    <>
                      <TableCell className="text-center text-sm text-green-600">{row.wins}</TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground">{row.draws}</TableCell>
                      <TableCell className="text-center text-sm text-red-600">{row.losses}</TableCell>
                    </>
                  )}
                  <TableCell className={cn(
                    "text-center text-sm font-medium",
                    row.goal_difference > 0 && "text-green-600",
                    row.goal_difference < 0 && "text-red-600"
                  )}>
                    {row.goal_difference > 0 ? `+${row.goal_difference}` : row.goal_difference}
                  </TableCell>
                  <TableCell className="text-center font-bold">{row.points}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

const ConnectedGroupTable = ({ competitionId, seasonId, groupId, advancingCount, compact }: ConnectedGroupTableProps) => {
  const { t } = useTranslation();
  const { data, isLoading, error } = useNclStandings(competitionId, seasonId, groupId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="text-center py-8 text-destructive text-sm">
          {t("components.groupStageView.error", { defaultValue: "Error loading group standings" })}
        </CardContent>
      </Card>
    );
  }

  return (
    <GroupTablePresentation
      groupId={groupId}
      standings={data || []}
      advancingCount={advancingCount}
      compact={compact}
    />
  );
};

const QualificationSummary = ({ competitionId, seasonId, groups, advancingPerGroup }: {
  competitionId: string;
  seasonId: string;
  groups: string[];
  advancingPerGroup: number;
}) => {
  return (
    <>
      {groups.map((groupId) => (
        <QualificationBadges
          key={groupId}
          competitionId={competitionId}
          seasonId={seasonId}
          groupId={groupId}
          advancingPerGroup={advancingPerGroup}
        />
      ))}
    </>
  );
};

const QualificationBadges = ({ competitionId, seasonId, groupId, advancingPerGroup }: {
  competitionId: string;
  seasonId: string;
  groupId: string;
  advancingPerGroup: number;
}) => {
  const { data } = useNclStandings(competitionId, seasonId, groupId);
  const qualifying = (data || []).slice(0, advancingPerGroup);

  return (
    <>
      {qualifying.map((team, idx) => (
        <Badge
          key={team.team_id}
          variant="secondary"
          className="flex items-center gap-1.5"
        >
          <Avatar className="h-4 w-4">
            <AvatarImage src={team.team_logo_url || undefined} />
            <AvatarFallback className="text-[8px]">
              {team.team_name.substring(0, 2)}
            </AvatarFallback>
          </Avatar>
          <span>{team.team_name}</span>
          <span className="text-xs text-muted-foreground">
            ({groupId.replace("group_", "").toUpperCase()}{idx + 1})
          </span>
        </Badge>
      ))}
    </>
  );
};

export const GroupStageView = ({
  competitionId,
  seasonId,
  groups,
  advancingPerGroup = 2,
  compact = false,
}: GroupStageViewProps) => {
  const { t } = useTranslation();

  // Calculate advancing teams count
  const totalAdvancing = groups.length * advancingPerGroup;

  return (
    <div className="space-y-6">
      {/* Header with legend */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">
            {t("components.groupStageView.advancingInfo", {
              count: advancingPerGroup,
              total: totalAdvancing,
              defaultValue: `Top ${advancingPerGroup} from each group advance (${totalAdvancing} total)`
            })}
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-100 dark:bg-green-950 border border-green-500 rounded" />
            <span className="text-muted-foreground">
              {t("components.groupStageView.qualifies", { defaultValue: "Qualifies" })}
            </span>
          </div>
        </div>
      </div>

      {/* Groups grid */}
      <div className={cn(
        "grid gap-4",
        groups.length === 2 && "md:grid-cols-2",
        groups.length === 3 && "md:grid-cols-3",
        groups.length >= 4 && "md:grid-cols-2 lg:grid-cols-4"
      )}>
        {groups.map((groupId) => (
          <ConnectedGroupTable
            key={groupId}
            competitionId={competitionId}
            seasonId={seasonId}
            groupId={groupId}
            advancingCount={advancingPerGroup}
            compact={compact}
          />
        ))}
      </div>

      {/* Qualification summary */}
      <Card className="bg-muted/50">
        <CardContent className="py-4">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <ArrowUp className="h-4 w-4 text-green-600" />
            {t("components.groupStageView.qualifiedTeams", { defaultValue: "Teams Advancing to Knockout" })}
          </h4>
          <div className="flex flex-wrap gap-2">
            <QualificationSummary
              competitionId={competitionId}
              seasonId={seasonId}
              groups={groups}
              advancingPerGroup={advancingPerGroup}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GroupStageView;
