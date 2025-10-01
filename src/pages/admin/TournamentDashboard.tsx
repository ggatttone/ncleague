import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { useState, useMemo, useEffect } from "react";
import { PhaseVisualizer } from "@/components/admin/PhaseVisualizer";
import { LiveStandings } from "@/components/admin/LiveStandings";
import { ProactiveValidator } from "@/components/admin/ProactiveValidator";
import { StandingsSimulatorDialog } from "@/components/admin/StandingsSimulatorDialog";
import { ClosePhaseDialog } from "@/components/admin/ClosePhaseDialog";
import { useCompetitions } from "@/hooks/use-competitions";
import { useSeasons } from "@/hooks/use-seasons";
import { useLeagueTable } from "@/hooks/use-league-table";
import { useMatches } from "@/hooks/use-matches";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

const phaseMapping: { [key: string]: { name: string, step: number } } = {
  'regular_season': { name: "Fase 1", step: 1 },
  'poule_a': { name: "Fase 2", step: 2 },
  'poule_b': { name: "Fase 2", step: 2 },
  'final': { name: "Fase Finale", step: 3 },
};

const TournamentDashboard = () => {
  const { t } = useTranslation();
  const [selectedCompetition, setSelectedCompetition] = useState<string | undefined>();
  const [selectedSeason, setSelectedSeason] = useState<string | undefined>();
  const [isSimulatorOpen, setSimulatorOpen] = useState(false);
  const [isClosePhaseOpen, setClosePhaseOpen] = useState(false);

  const { data: competitions, isLoading: competitionsLoading } = useCompetitions();
  const { data: seasons, isLoading: seasonsLoading } = useSeasons();
  const { data: tableData } = useLeagueTable(selectedCompetition, selectedSeason);
  const { data: allMatches } = useMatches();

  useEffect(() => {
    if (!competitionsLoading && competitions?.length === 1 && !selectedCompetition) {
      setSelectedCompetition(competitions[0].id);
    }
    if (!seasonsLoading && seasons?.length > 0 && !selectedSeason) {
      setSelectedSeason(seasons[0].id);
    }
  }, [competitions, seasons, competitionsLoading, seasonsLoading, selectedCompetition, selectedSeason]);

  const { currentPhaseName, currentPhaseStep } = useMemo(() => {
    const seasonMatches = allMatches?.filter(m => m.season_id === selectedSeason) || [];
    if (seasonMatches.length === 0) {
      return { currentPhaseName: "Inizio Torneo", currentPhaseStep: 0 };
    }
    const latestMatch = seasonMatches.sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime())[0];
    const phaseInfo = phaseMapping[latestMatch.stage || 'regular_season'];
    return {
      currentPhaseName: phaseInfo?.name || "Fase 1",
      currentPhaseStep: phaseInfo?.step || 1,
    };
  }, [allMatches, selectedSeason]);

  const isLoading = competitionsLoading || seasonsLoading;

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">{t('pages.admin.tournamentDashboard.title')}</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={() => setSimulatorOpen(true)} className="w-full">{t('pages.admin.tournamentDashboard.simulator.button')}</Button>
          <Button onClick={() => setClosePhaseOpen(true)} className="w-full">{t('pages.admin.tournamentDashboard.closePhase.button')}</Button>
        </div>
      </div>
      
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

      {isLoading ? <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div> : (
        <>
          <PhaseVisualizer currentPhase={currentPhaseStep} />
          <ProactiveValidator standings={tableData} />
          <Card>
            <CardHeader>
              <CardTitle>{t('pages.admin.tournamentDashboard.liveStandings.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <LiveStandings competitionId={selectedCompetition} seasonId={selectedSeason} />
            </CardContent>
          </Card>
        </>
      )}

      <StandingsSimulatorDialog open={isSimulatorOpen} onOpenChange={setSimulatorOpen} />
      <ClosePhaseDialog open={isClosePhaseOpen} onOpenChange={setClosePhaseOpen} seasonId={selectedSeason} currentPhaseName={currentPhaseName} />
    </AdminLayout>
  );
};

export default TournamentDashboard;