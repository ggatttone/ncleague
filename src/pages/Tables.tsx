import { MainLayout } from "@/components/MainLayout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCompetitions } from "@/hooks/use-competitions";
import { useSeasons } from "@/hooks/use-seasons";
import { useNclStandings } from "@/hooks/use-ncl-standings";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePlayoffBracket } from "@/hooks/use-playoffs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeagueTableRow } from "@/types/database";

const StandingsTable = ({ data, playoffTeamCount }: { data: LeagueTableRow[], playoffTeamCount?: number }) => {
  const { t } = useTranslation();
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px] text-center">{t('pages.tables.pos')}</TableHead>
            <TableHead>{t('pages.tables.team')}</TableHead>
            <TableHead className="text-center">{t('pages.tables.mp')}</TableHead>
            <TableHead className="text-center">{t('pages.tables.w')}</TableHead>
            <TableHead className="text-center">{t('pages.tables.d')}</TableHead>
            <TableHead className="text-center">{t('pages.tables.l')}</TableHead>
            <TableHead className="text-center">{t('pages.tables.gf')}</TableHead>
            <TableHead className="text-center">{t('pages.tables.ga')}</TableHead>
            <TableHead className="text-center">{t('pages.tables.gd')}</TableHead>
            <TableHead className="text-center">{t('pages.tables.pts')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => (
            <TableRow key={row.team_id} className={cn(playoffTeamCount && index < playoffTeamCount && "bg-green-100/50 dark:bg-green-900/20")}>
              <TableCell className="font-bold text-center">{index + 1}</TableCell>
              <TableCell>
                <Link to={`/teams/${row.team_id}`} className="flex items-center gap-3 hover:underline">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={row.team_logo_url || undefined} alt={row.team_name} />
                    <AvatarFallback>{row.team_name.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{row.team_name}</span>
                </Link>
              </TableCell>
              <TableCell className="text-center">{row.matches_played}</TableCell>
              <TableCell className="text-center">{row.wins}</TableCell>
              <TableCell className="text-center">{row.draws}</TableCell>
              <TableCell className="text-center">{row.losses}</TableCell>
              <TableCell className="text-center">{row.goals_for}</TableCell>
              <TableCell className="text-center">{row.goals_against}</TableCell>
              <TableCell className="text-center">{row.goal_difference}</TableCell>
              <TableCell className="font-bold text-center">{row.points}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

const StandingsTabContent = ({ competitionId, seasonId, stage, playoffTeamCount }: { competitionId?: string, seasonId?: string, stage: string, playoffTeamCount?: number }) => {
  const { t } = useTranslation();
  const { data: tableData, isLoading, isError, error } = useNclStandings(competitionId, seasonId, stage);

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (isError) return <div className="text-center py-12 bg-destructive/10 text-destructive rounded-lg"><p className="font-semibold mb-2">{t('errors.loadingTables')}</p><p className="text-sm">{error.message}</p></div>;
  if (!tableData || tableData.length === 0) return <div className="text-center py-12 bg-muted/50 rounded-lg"><p className="text-muted-foreground">{t('components.leagueTableWidget.noData')}</p></div>;

  return <StandingsTable data={tableData} playoffTeamCount={playoffTeamCount} />;
};

const Tables = () => {
  const { t } = useTranslation();
  const [selectedCompetition, setSelectedCompetition] = useState<string | undefined>();
  const [selectedSeason, setSelectedSeason] = useState<string | undefined>();

  const { data: competitions, isLoading: competitionsLoading } = useCompetitions();
  const { data: seasons, isLoading: seasonsLoading } = useSeasons();
  
  useEffect(() => {
    if (!competitionsLoading && competitions?.length === 1 && !selectedCompetition) {
      setSelectedCompetition(competitions[0].id);
    }
    if (!seasonsLoading && seasons?.length > 0 && !selectedSeason) {
      setSelectedSeason(seasons[0].id);
    }
  }, [competitions, seasons, competitionsLoading, seasonsLoading, selectedCompetition, selectedSeason]);

  const { data: playoffData } = usePlayoffBracket(selectedCompetition, selectedSeason);
  const playoffsActive = !!playoffData?.bracket;

  const isLoading = competitionsLoading || seasonsLoading;

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">{t('pages.tables.title')}</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 max-w-lg">
          <Select onValueChange={setSelectedCompetition} value={selectedCompetition} disabled={isLoading}>
            <SelectTrigger><SelectValue placeholder={t('pages.tables.selectCompetition')} /></SelectTrigger>
            <SelectContent>{competitions?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select onValueChange={setSelectedSeason} value={selectedSeason} disabled={isLoading}>
            <SelectTrigger><SelectValue placeholder={t('pages.tables.selectSeason')} /></SelectTrigger>
            <SelectContent>{seasons?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : !selectedCompetition || !selectedSeason ? (
          <div className="text-center py-12 bg-muted/50 rounded-lg"><p className="text-muted-foreground">{t('pages.tables.selectToView')}</p></div>
        ) : (
          <>
            {playoffsActive && (
              <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded-md mb-6" role="alert">
                <p className="font-bold">{t('pages.tables.playoffsStartedTitle')}</p>
                <p>{t('pages.tables.playoffsStartedDescription')}</p>
                <Link to={`/playoffs/${selectedCompetition}/${selectedSeason}`}><Button variant="link" className="p-0 h-auto mt-2 text-blue-700">{t('pages.tables.viewPlayoffBracket')}</Button></Link>
              </div>
            )}
            <Tabs defaultValue="regular_season" className="w-full">
              <TabsList>
                <TabsTrigger value="regular_season">Qualificazione</TabsTrigger>
                <TabsTrigger value="poule_a">Poule A</TabsTrigger>
                <TabsTrigger value="poule_b">Poule B</TabsTrigger>
              </TabsList>
              <TabsContent value="regular_season" className="mt-4">
                <StandingsTabContent competitionId={selectedCompetition} seasonId={selectedSeason} stage="regular_season" playoffTeamCount={playoffsActive ? 4 : undefined} />
              </TabsContent>
              <TabsContent value="poule_a" className="mt-4">
                <StandingsTabContent competitionId={selectedCompetition} seasonId={selectedSeason} stage="poule_a" />
              </TabsContent>
              <TabsContent value="poule_b" className="mt-4">
                <StandingsTabContent competitionId={selectedCompetition} seasonId={selectedSeason} stage="poule_b" />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default Tables;