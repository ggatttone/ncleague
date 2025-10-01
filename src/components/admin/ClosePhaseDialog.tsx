import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Stepper } from "@/components/ui/stepper";
import { useTranslation } from "react-i18next";
import { Loader2, GripVertical } from "lucide-react";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { showError, showSuccess } from "@/utils/toast";
import { useSupabaseQuery } from "@/hooks/use-supabase-query";
import { Match, Team, LeagueTableRow } from "@/types/database";
import { ProactiveValidator } from "./ProactiveValidator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { AlertTriangle } from "lucide-react";

type MatchWithTeams = Match & { home_teams: Team; away_teams: Team };

// --- Sub-components for each step ---

const Step1Summary = ({ standings }: { standings: LeagueTableRow[] | null | undefined }) => {
  const { t } = useTranslation();
  return (
    <div>
      <h3 className="font-semibold mb-2">{t('pages.admin.tournamentDashboard.closePhase.step1.title')}</h3>
      <p className="text-sm text-muted-foreground mb-4">{t('pages.admin.tournamentDashboard.closePhase.step1.description')}</p>
      <ProactiveValidator standings={standings} />
      {!standings && <p className="text-sm text-muted-foreground">{t('pages.admin.tournamentDashboard.closePhase.step1.noStandings')}</p>}
    </div>
  );
};

const Step2OpenMatches = ({ openMatches, overrides, setOverrides }: { openMatches: MatchWithTeams[], overrides: any, setOverrides: (o: any) => void }) => {
  const { t } = useTranslation();
  const handleResolutionChange = (matchId: string, resolution: string) => {
    setOverrides({
      ...overrides,
      resolved_matches: {
        ...overrides.resolved_matches,
        [matchId]: { resolution },
      },
    });
  };

  const handleScoreChange = (matchId: string, team: 'home' | 'away', score: number) => {
    setOverrides({
      ...overrides,
      resolved_matches: {
        ...overrides.resolved_matches,
        [matchId]: {
          ...overrides.resolved_matches?.[matchId],
          [`${team}_score`]: score,
        },
      },
    });
  };

  return (
    <div>
      <h3 className="font-semibold mb-2">{t('pages.admin.tournamentDashboard.closePhase.step2.title')}</h3>
      <p className="text-sm text-muted-foreground mb-4">{t('pages.admin.tournamentDashboard.closePhase.step2.description')}</p>
      <div className="space-y-4 max-h-96 overflow-y-auto p-1">
        {openMatches.map(match => (
          <div key={match.id} className="p-4 border rounded-lg">
            <p className="font-medium">{match.home_teams.name} vs {match.away_teams.name}</p>
            <RadioGroup
              defaultValue={overrides.resolved_matches?.[match.id]?.resolution}
              onValueChange={(value) => handleResolutionChange(match.id, value)}
              className="mt-2"
            >
              <div className="flex items-center space-x-2"><RadioGroupItem value="cancel" id={`cancel-${match.id}`} /><Label htmlFor={`cancel-${match.id}`}>{t('pages.admin.tournamentDashboard.closePhase.step2.cancel')}</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="freeze" id={`freeze-${match.id}`} /><Label htmlFor={`freeze-${match.id}`}>{t('pages.admin.tournamentDashboard.closePhase.step2.freeze')}</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="result" id={`result-${match.id}`} /><Label htmlFor={`result-${match.id}`}>{t('pages.admin.tournamentDashboard.closePhase.step2.enterResult')}</Label></div>
            </RadioGroup>
            {overrides.resolved_matches?.[match.id]?.resolution === 'result' && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Input type="number" placeholder={match.home_teams.name} onChange={(e) => handleScoreChange(match.id, 'home', parseInt(e.target.value))} />
                <Input type="number" placeholder={match.away_teams.name} onChange={(e) => handleScoreChange(match.id, 'away', parseInt(e.target.value))} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const SortableTeamItem = ({ team }: { team: LeagueTableRow }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: team.team_id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} className="p-2 border rounded bg-background flex items-center gap-2">
      <button {...attributes} {...listeners} className="cursor-grab touch-none"><GripVertical className="h-5 w-5 text-muted-foreground" /></button>
      <span>{team.team_name}</span>
    </div>
  );
};

const Step3Ties = ({ ties, setTies }: { ties: LeagueTableRow[][], setTies: (t: LeagueTableRow[][]) => void }) => {
  const { t } = useTranslation();
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: DragEndEvent, groupIndex: number) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setTies(prevTies => {
        const newTies = [...prevTies];
        const group = newTies[groupIndex];
        const oldIndex = group.findIndex(t => t.team_id === active.id);
        const newIndex = group.findIndex(t => t.team_id === over.id);
        newTies[groupIndex] = arrayMove(group, oldIndex, newIndex);
        return newTies;
      });
    }
  };

  return (
    <div>
      <h3 className="font-semibold mb-2">{t('pages.admin.tournamentDashboard.closePhase.step3.title')}</h3>
      <p className="text-sm text-muted-foreground mb-4">{t('pages.admin.tournamentDashboard.closePhase.step3.description')}</p>
      <div className="space-y-4 max-h-96 overflow-y-auto p-1">
        {ties.map((group, index) => (
          <div key={index} className="p-4 border rounded-lg">
            <p className="font-medium mb-2">{t('pages.admin.tournamentDashboard.closePhase.step3.tieAtPoints', { points: group[0].points })}</p>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, index)}>
              <SortableContext items={group.map(t => t.team_id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {group.map(team => <SortableTeamItem key={team.team_id} team={team} />)}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        ))}
      </div>
    </div>
  );
};

const Step4Confirm = ({ overrides, teamsMap }: { overrides: any, teamsMap: Map<string, string> }) => {
  const { t } = useTranslation();
  return (
    <div>
      <h3 className="font-semibold mb-2">{t('pages.admin.tournamentDashboard.closePhase.step4.title')}</h3>
      <p className="text-sm text-muted-foreground mb-4">{t('pages.admin.tournamentDashboard.closePhase.step4.description')}</p>
      <div className="space-y-4 max-h-96 overflow-y-auto p-1 text-sm">
        {Object.keys(overrides.resolved_matches).length > 0 && (
          <div>
            <h4 className="font-medium">{t('pages.admin.tournamentDashboard.closePhase.step4.resolvedMatches')}</h4>
            <ul className="list-disc pl-5 mt-1">
              {Object.entries(overrides.resolved_matches).map(([matchId, res]: [string, any]) => (
                <li key={matchId}>Partita {matchId.substring(0, 8)}: {res.resolution} {res.resolution === 'result' && `(${res.home_score}-${res.away_score})`}</li>
              ))}
            </ul>
          </div>
        )}
        {Object.keys(overrides.tie_breakers).length > 0 && (
          <div>
            <h4 className="font-medium">{t('pages.admin.tournamentDashboard.closePhase.step4.tieBreakers')}</h4>
            <ul className="list-disc pl-5 mt-1">
              {Object.entries(overrides.tie_breakers).map(([points, teams]: [string, any]) => (
                <li key={points}>{t('pages.admin.tournamentDashboard.closePhase.step3.tieAtPoints', { points })}: {teams.map((id: string) => teamsMap.get(id)).join(' > ')}</li>
              ))}
            </ul>
          </div>
        )}
        {Object.keys(overrides.resolved_matches).length === 0 && Object.keys(overrides.tie_breakers).length === 0 && (
          <p className="text-muted-foreground">{t('pages.admin.tournamentDashboard.closePhase.step4.noOverrides')}</p>
        )}
      </div>
    </div>
  );
};

// --- Main Dialog Component ---

interface ClosePhaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seasonId?: string;
  competitionId?: string;
  currentPhaseName: string;
  standings: LeagueTableRow[] | null | undefined;
}

export const ClosePhaseDialog = ({ open, onOpenChange, seasonId, competitionId, currentPhaseName, standings }: ClosePhaseDialogProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [manualOverrides, setManualOverrides] = useState<{ resolved_matches: any, tie_breakers: any }>({ resolved_matches: {}, tie_breakers: {} });
  const [orderedTies, setOrderedTies] = useState<LeagueTableRow[][]>([]);

  const { data: openMatches, isLoading: isLoadingMatches } = useSupabaseQuery<(Match & { home_teams: Team; away_teams: Team })[]>(
    ['open-matches', seasonId],
    () => supabase.from('matches').select('*, home_teams:teams!matches_home_team_id_fkey(*), away_teams:teams!matches_away_team_id_fkey(*)').eq('season_id', seasonId).neq('status', 'completed'),
    { enabled: !!seasonId && open }
  );

  const { data: teams } = useSupabaseQuery<Team[]>(['teams'], () => supabase.from('teams').select('id, name'));
  const teamsMap = useMemo(() => new Map(teams?.map(t => [t.id, t.name])), [teams]);

  const ties = useMemo(() => {
    if (!standings) return [];
    const pointsMap = new Map<number, LeagueTableRow[]>();
    standings.forEach(team => {
      if (!pointsMap.has(team.points)) pointsMap.set(team.points, []);
      pointsMap.get(team.points)!.push(team);
    });
    return Array.from(pointsMap.values()).filter(group => group.length > 1);
  }, [standings]);

  useEffect(() => {
    if (open) {
      setCurrentStep(0);
      setManualOverrides({ resolved_matches: {}, tie_breakers: {} });
      setOrderedTies(JSON.parse(JSON.stringify(ties))); // Deep copy
    }
  }, [open, ties]);

  const closePhaseMutation = useMutation({
    mutationFn: async (overrides: any) => {
      if (!seasonId) throw new Error("Season ID is required.");
      const { data, error } = await supabase.functions.invoke('tournament-phase-manager', {
        body: { season_id: seasonId, phase_to_close: currentPhaseName, manual_overrides: overrides }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      showSuccess(t('pages.admin.tournamentDashboard.closePhase.success'));
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['league-table', competitionId, seasonId] });
      onOpenChange(false);
    },
    onError: (err: any) => showError(`${t('pages.admin.tournamentDashboard.closePhase.error')}: ${err.message}`),
  });

  const steps = [
    { label: t('pages.admin.tournamentDashboard.closePhase.steps.summary') },
    { label: t('pages.admin.tournamentDashboard.closePhase.steps.openMatches'), disabled: !openMatches || openMatches.length === 0 },
    { label: t('pages.admin.tournamentDashboard.closePhase.steps.tieBreakers'), disabled: ties.length === 0 },
    { label: t('pages.admin.tournamentDashboard.closePhase.steps.confirm') },
  ].filter(s => !s.disabled);

  const handleNext = () => {
    if (currentStep === 2) { // After tie-breaking
      const tieOverrides: any = {};
      orderedTies.forEach(group => {
        tieOverrides[group[0].points] = group.map(t => t.team_id);
      });
      setManualOverrides(prev => ({ ...prev, tie_breakers: tieOverrides }));
    }
    setCurrentStep(s => Math.min(s + 1, steps.length - 1));
  };
  const handleBack = () => setCurrentStep(s => Math.max(s - 1, 0));

  const renderStepContent = () => {
    const currentLabel = steps[currentStep]?.label;
    if (isLoadingMatches) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>;

    if (currentLabel === t('pages.admin.tournamentDashboard.closePhase.steps.summary')) return <Step1Summary standings={standings} />;
    if (currentLabel === t('pages.admin.tournamentDashboard.closePhase.steps.openMatches')) return <Step2OpenMatches openMatches={openMatches || []} overrides={manualOverrides} setOverrides={setManualOverrides} />;
    if (currentLabel === t('pages.admin.tournamentDashboard.closePhase.steps.tieBreakers')) return <Step3Ties ties={orderedTies} setTies={setOrderedTies} />;
    if (currentLabel === t('pages.admin.tournamentDashboard.closePhase.steps.confirm')) return <Step4Confirm overrides={manualOverrides} teamsMap={teamsMap} />;
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('pages.admin.tournamentDashboard.closePhase.title')}</DialogTitle>
          <DialogDescription>{t('pages.admin.tournamentDashboard.closePhase.description', { phaseName: currentPhaseName })}</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Stepper steps={steps} currentStep={currentStep} />
          <div className="mt-6 min-h-[200px]">
            {renderStepContent()}
          </div>
        </div>
        <DialogFooter>
          {currentStep > 0 && <Button variant="outline" onClick={handleBack}>{t('pages.admin.fixtureImport.backButton')}</Button>}
          {currentStep < steps.length - 1 ? (
            <Button onClick={handleNext}>Avanti</Button>
          ) : (
            <Button onClick={() => closePhaseMutation.mutate(manualOverrides)} disabled={closePhaseMutation.isPending}>
              {closePhaseMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('pages.admin.tournamentDashboard.closePhase.confirmButton')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};