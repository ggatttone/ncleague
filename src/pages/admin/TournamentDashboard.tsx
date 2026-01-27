import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { useState, useMemo, useEffect, useCallback } from "react";
import { LiveStandings } from "@/components/admin/LiveStandings";
import { ProactiveValidator } from "@/components/admin/ProactiveValidator";
import { StandingsSimulatorDialog } from "@/components/admin/StandingsSimulatorDialog";
import { ClosePhaseDialog } from "@/components/admin/ClosePhaseDialog";
import { PhaseCard } from "@/components/admin/tournament-dashboard/PhaseCard";
import { ActionsPanel } from "@/components/admin/tournament-dashboard/ActionsPanel";
import { useCompetitions } from "@/hooks/use-competitions";
import { useSeasons, useSeasonWithTournamentMode } from "@/hooks/use-seasons";
import { useLeagueTable } from "@/hooks/use-league-table";
import { useSeasonPhaseStatus } from "@/hooks/use-season-phase-status";
import { getHandlerPhases } from "@/lib/tournament/handler-registry";
import type { TournamentHandlerKey } from "@/types/tournament-handlers";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSearchParams, useNavigate } from "react-router-dom";

const TournamentDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedCompetition, setSelectedCompetition] = useState<string | undefined>();
  const [selectedSeason, setSelectedSeason] = useState<string | undefined>();
  const [isSimulatorOpen, setSimulatorOpen] = useState(false);
  const [isClosePhaseOpen, setClosePhaseOpen] = useState(false);

  const { data: competitions, isLoading: competitionsLoading } = useCompetitions();
  const { data: seasons, isLoading: seasonsLoading } = useSeasons();
  const { data: seasonWithMode } = useSeasonWithTournamentMode(selectedSeason);
  const { data: tableData } = useLeagueTable(selectedCompetition, selectedSeason);
  const { phaseStatusMap } = useSeasonPhaseStatus(selectedSeason);

  // Auto-select from URL params
  useEffect(() => {
    const seasonFromUrl = searchParams.get('season');
    if (seasonFromUrl) {
      setSelectedSeason(seasonFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!competitionsLoading && competitions?.length === 1 && !selectedCompetition) {
      setSelectedCompetition(competitions[0].id);
    }
    if (!seasonsLoading && seasons?.length > 0 && !selectedSeason && !searchParams.get('season')) {
      setSelectedSeason(seasons[0].id);
    }
  }, [competitions, seasons, competitionsLoading, seasonsLoading, selectedCompetition, selectedSeason, searchParams]);

  // Get phases from tournament mode handler
  const phases = useMemo(() => {
    const handlerKey = seasonWithMode?.tournament_modes?.handler_key as TournamentHandlerKey | undefined;
    if (handlerKey) {
      return getHandlerPhases(handlerKey);
    }
    return [];
  }, [seasonWithMode]);

  // Build effective status map: phases without matches that precede phases WITH matches are "completed"
  const effectiveStatusMap = useMemo(() => {
    const sorted = [...phases].sort((a, b) => a.order - b.order);
    const effective = new Map(phaseStatusMap);

    // Find highest-order phase that has matches
    let highestWithMatches = -1;
    for (const phase of sorted) {
      if (phaseStatusMap.has(phase.id)) {
        highestWithMatches = phase.order;
      }
    }

    // Mark earlier phases without matches as completed (they were skipped/implicit)
    for (const phase of sorted) {
      if (phase.order < highestWithMatches && !phaseStatusMap.has(phase.id)) {
        effective.set(phase.id, {
          phaseId: phase.id,
          phaseName: phase.id,
          totalMatches: 0,
          completedMatches: 0,
          scheduledMatches: 0,
          status: 'completed',
        });
      }
    }

    return effective;
  }, [phases, phaseStatusMap]);

  // Determine current phase key
  const currentPhaseKey = useMemo(() => {
    const sorted = [...phases].sort((a, b) => a.order - b.order);
    for (const phase of sorted) {
      const status = effectiveStatusMap.get(phase.id);
      if (!status || status.status !== 'completed') {
        return phase.id;
      }
    }
    return sorted[sorted.length - 1]?.id ?? '';
  }, [phases, effectiveStatusMap]);

  const currentPhaseName = useMemo(() => {
    const phase = phases.find(p => p.id === currentPhaseKey);
    return phase ? t(phase.nameKey, { defaultValue: currentPhaseKey }) : currentPhaseKey;
  }, [currentPhaseKey, phases, t]);

  const handlePhaseAction = useCallback((phaseId: string, action: 'schedule' | 'view' | 'close') => {
    switch (action) {
      case 'schedule':
        navigate(`/admin/schedule-generator?season=${selectedSeason}&phase=${phaseId}`);
        break;
      case 'view':
        navigate(`/admin/matches?season=${selectedSeason}&stage=${phaseId}`);
        break;
      case 'close':
        setClosePhaseOpen(true);
        break;
    }
  }, [navigate, selectedSeason]);

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
          {phases.length > 0 && (
            <ActionsPanel phases={phases} phaseStatusMap={effectiveStatusMap} />
          )}

          {phases.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
              {[...phases].sort((a, b) => a.order - b.order).map(phase => (
                <PhaseCard
                  key={phase.id}
                  phase={phase}
                  status={effectiveStatusMap.get(phase.id)}
                  isCurrentPhase={phase.id === currentPhaseKey}
                  onAction={(action) => handlePhaseAction(phase.id, action)}
                />
              ))}
            </div>
          )}

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
      <ClosePhaseDialog
        open={isClosePhaseOpen}
        onOpenChange={setClosePhaseOpen}
        seasonId={selectedSeason}
        competitionId={selectedCompetition}
        currentPhaseKey={currentPhaseKey}
        currentPhaseName={currentPhaseName}
        standings={tableData}
      />
    </AdminLayout>
  );
};

export default TournamentDashboard;
