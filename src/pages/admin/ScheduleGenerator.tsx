import { useState, useMemo, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useSeasons, useSeasonWithTournamentMode } from "@/hooks/use-seasons";
import { useVenues } from "@/hooks/use-venues";
import { useTeams } from "@/hooks/use-teams";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Calendar, Wand2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getSchedulablePhases } from "@/lib/tournament/handler-registry";
import type { TournamentHandlerKey, PhaseConfig } from "@/types/tournament-handlers";
import { useSeasonPhaseStatus } from "@/hooks/use-season-phase-status";
import { PhaseStatusBadge } from "@/components/admin/schedule-generator/PhaseStatusBadge";
import { SchedulePresets } from "@/components/admin/schedule-generator/SchedulePresets";

// Import handler to register phases
import "@/lib/tournament/handlers/league-only";

const scheduleSchema = z.object({
  season_id: z.string().min(1, "Seleziona una stagione"),
  stage: z.string().min(1, "Seleziona una fase"),
  startDate: z.string().min(1, "Seleziona una data di inizio"),
  endDate: z.string().min(1, "Seleziona una data di fine"),
  allowedDays: z.array(z.number()).min(1, "Seleziona almeno un giorno"),
  timeSlots: z.string().min(1, "Inserisci almeno un orario"),
  venueIds: z.array(z.string()).min(1, "Seleziona almeno un campo"),
  includeReturnGames: z.boolean(),
});

type ScheduleFormData = z.infer<typeof scheduleSchema>;

// Default phases for backward compatibility
const DEFAULT_PHASES: PhaseConfig[] = [
  { id: "regular_season", nameKey: "tournament.phases.regularSeason", order: 1, matchGeneration: { type: "round_robin" }, isTerminal: false },
  { id: "poule_a", nameKey: "tournament.phases.pouleA", order: 2, matchGeneration: { type: "round_robin" }, isTerminal: false },
  { id: "poule_b", nameKey: "tournament.phases.pouleB", order: 2, matchGeneration: { type: "round_robin" }, isTerminal: true },
];

const ScheduleGenerator = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [preview, setPreview] = useState<any[] | null>(null);
  const { t } = useTranslation();

  const daysOfWeek = [
    { id: 1, label: t('common.days.monday') },
    { id: 2, label: t('common.days.tuesday') },
    { id: 3, label: t('common.days.wednesday') },
    { id: 4, label: t('common.days.thursday') },
    { id: 5, label: t('common.days.friday') },
    { id: 6, label: t('common.days.saturday') },
    { id: 0, label: t('common.days.sunday') }
  ];

  const { data: seasons, isLoading: seasonsLoading } = useSeasons();
  const { data: venues } = useVenues();
  const { data: teams } = useTeams();

  const { control, handleSubmit, formState: { errors }, watch, setValue } = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      season_id: searchParams.get("season") || undefined,
      allowedDays: [],
      venueIds: [],
      includeReturnGames: true,
    },
  });

  const selectedSeasonId = watch("season_id");

  // Load season with tournament mode when season changes
  const { data: seasonWithMode, isLoading: seasonModeLoading } = useSeasonWithTournamentMode(selectedSeasonId);

  // Get available stages based on tournament mode
  const availableStages = useMemo(() => {
    if (seasonWithMode?.tournament_modes?.handler_key) {
      const handlerKey = seasonWithMode.tournament_modes.handler_key as TournamentHandlerKey;
      const phases = getSchedulablePhases(handlerKey);
      if (phases.length > 0) {
        return phases;
      }
    }
    return DEFAULT_PHASES;
  }, [seasonWithMode]);

  // Phase status for badge display and auto-select
  const { phaseStatusMap } = useSeasonPhaseStatus(selectedSeasonId);

  // Reset stage when season changes, auto-select first pending phase
  useEffect(() => {
    if (selectedSeasonId) {
      setValue("stage", "");
      // Auto-select first pending/unscheduled phase after data loads
      const firstPending = availableStages.find(
        phase => !phaseStatusMap.get(phase.id) || phaseStatusMap.get(phase.id)?.status === 'pending'
      );
      if (firstPending) {
        setValue("stage", firstPending.id);
      }
    }
  }, [selectedSeasonId, setValue, availableStages, phaseStatusMap]);

  const generatePreviewMutation = useMutation({
    mutationFn: async (formData: ScheduleFormData) => {
      const { data, error } = await supabase.functions.invoke('match-scheduler', {
        body: {
          dryRun: true,
          schedule: {
            season_id: formData.season_id,
            stage: formData.stage,
            constraints: {
              startDate: formData.startDate,
              endDate: formData.endDate,
              allowedDays: formData.allowedDays,
              timeSlots: formData.timeSlots.split(',').map(t => t.trim()),
              venueIds: formData.venueIds,
              includeReturnGames: formData.includeReturnGames,
            }
          }
        }
      });
      if (error) {
        // Extract actual error message from Edge Function response
        let msg = error.message;
        try {
          if (error.context && typeof error.context.json === 'function') {
            const body = await error.context.json();
            msg = body?.error || msg;
          }
        } catch { /* ignore parse errors */ }
        throw new Error(msg);
      }
      // Edge function returns { success, matches, total_matches, ... }
      const matches = data?.matches ?? data;
      return matches;
    },
    onSuccess: (data) => {
      setPreview(data);
      showSuccess(t('pages.admin.scheduleGenerator.previewSuccess', { count: data?.length ?? 0 }));
    },
    onError: (err: any) => showError(`Errore: ${err.message}`),
  });

  const saveScheduleMutation = useMutation({
    mutationFn: async (schedule: any[]) => {
      const { data, error } = await supabase.functions.invoke('match-scheduler', {
        body: { dryRun: false, schedule }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      showSuccess(t('pages.admin.scheduleGenerator.saveSuccess'));
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      navigate('/admin/fixtures');
    },
    onError: (err: any) => showError(`Errore nel salvataggio: ${err.message}`),
  });

  const teamsMap = useMemo(() => new Map(teams?.map(t => [t.id, t.name])), [teams]);
  const venuesMap = useMemo(() => new Map(venues?.map(v => [v.id, v.name])), [venues]);

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('pages.admin.scheduleGenerator.title')}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>{t('pages.admin.scheduleGenerator.step1Title')}</CardTitle>
            <CardDescription>{t('pages.admin.scheduleGenerator.step1Description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit((data) => generatePreviewMutation.mutate(data))} className="space-y-4">
              {/* Season */}
              <div className="space-y-2">
                <Label>{t('common.season')}</Label>
                <Controller name="season_id" control={control} render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value} disabled={seasonsLoading}>
                    <SelectTrigger><SelectValue placeholder={t('pages.admin.scheduleGenerator.selectSeason')} /></SelectTrigger>
                    <SelectContent>{seasons?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                )} />
                {errors.season_id && <p className="text-sm text-destructive">{errors.season_id.message}</p>}
              </div>

              {/* Stage - Dynamic based on tournament mode */}
              <div className="space-y-2">
                <Label>{t('common.phase')}</Label>
                <Controller name="stage" control={control} render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!selectedSeasonId || seasonModeLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('pages.admin.scheduleGenerator.selectStage')} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableStages.map(phase => {
                        const ps = phaseStatusMap.get(phase.id);
                        const isCompleted = ps?.status === 'completed';
                        return (
                          <SelectItem key={phase.id} value={phase.id} disabled={isCompleted}>
                            <span className="flex items-center gap-2">
                              {t(phase.nameKey, { defaultValue: phase.id })}
                              {ps && <PhaseStatusBadge status={ps.status} totalMatches={ps.totalMatches} completedMatches={ps.completedMatches} />}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                )} />
                {errors.stage && <p className="text-sm text-destructive">{errors.stage.message}</p>}
                {seasonWithMode?.tournament_modes && (
                  <p className="text-xs text-muted-foreground">
                    {t('pages.admin.scheduleGenerator.tournamentMode')}: {seasonWithMode.tournament_modes.name}
                  </p>
                )}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">{t('common.startDate')}</Label>
                  <Input id="startDate" type="date" {...control.register("startDate")} />
                </div>
                <div>
                  <Label htmlFor="endDate">{t('common.endDate')}</Label>
                  <Input id="endDate" type="date" {...control.register("endDate")} />
                </div>
              </div>

              {/* Presets */}
              <SchedulePresets onApply={(days, times) => {
                setValue('allowedDays', days);
                setValue('timeSlots', times);
              }} />

              {/* Days */}
              <div>
                <Label>{t('pages.admin.scheduleGenerator.allowedDays')}</Label>
                <Controller name="allowedDays" control={control} render={({ field }) => (
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {daysOfWeek.map(day => (
                      <div key={day.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`day-${day.id}`}
                          checked={field.value?.includes(day.id)}
                          onCheckedChange={(checked) => {
                            return checked
                              ? field.onChange([...(field.value || []), day.id])
                              : field.onChange(field.value?.filter(value => value !== day.id));
                          }}
                        />
                        <Label htmlFor={`day-${day.id}`} className="text-sm font-normal">{day.label}</Label>
                      </div>
                    ))}
                  </div>
                )} />
                {errors.allowedDays && <p className="text-sm text-destructive">{errors.allowedDays.message}</p>}
              </div>

              {/* Times and Venues */}
              <div>
                <Label htmlFor="timeSlots">{t('pages.admin.scheduleGenerator.timeSlots')}</Label>
                <Input id="timeSlots" {...control.register("timeSlots")} placeholder="20:00, 21:00" />
              </div>
              <div>
                <Label>{t('pages.admin.scheduleGenerator.venues')}</Label>
                <Controller name="venueIds" control={control} render={({ field }) => (
                  <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto">
                    {venues?.map(venue => (
                      <div key={venue.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`venue-${venue.id}`}
                          checked={field.value?.includes(venue.id)}
                          onCheckedChange={(checked) => {
                            return checked
                              ? field.onChange([...(field.value || []), venue.id])
                              : field.onChange(field.value?.filter(value => value !== venue.id));
                          }}
                        />
                        <Label htmlFor={`venue-${venue.id}`} className="text-sm font-normal">{venue.name}</Label>
                      </div>
                    ))}
                  </div>
                )} />
                {errors.venueIds && <p className="text-sm text-destructive">{errors.venueIds.message}</p>}
              </div>
              <div className="flex items-center space-x-2">
                <Controller name="includeReturnGames" control={control} render={({ field }) => (
                  <Checkbox id="includeReturnGames" checked={field.value} onCheckedChange={field.onChange} />
                )} />
                <Label htmlFor="includeReturnGames">{t('pages.admin.scheduleGenerator.includeReturnGames')}</Label>
              </div>
              <Button type="submit" className="w-full" disabled={generatePreviewMutation.isPending}>
                {generatePreviewMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Wand2 className="mr-2 h-4 w-4" /> {t('pages.admin.scheduleGenerator.generatePreview')}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('pages.admin.scheduleGenerator.step2Title')}</CardTitle>
            <CardDescription>{t('pages.admin.scheduleGenerator.step2Description')}</CardDescription>
          </CardHeader>
          <CardContent>
            {generatePreviewMutation.isPending && <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>}
            {!preview && !generatePreviewMutation.isPending && (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="mx-auto h-12 w-12 mb-4" />
                <p>{t('pages.admin.scheduleGenerator.previewPlaceholder')}</p>
              </div>
            )}
            {preview && (
              <>
                <div className="overflow-auto max-h-96">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('common.date')}</TableHead>
                        <TableHead>{t('common.home')}</TableHead>
                        <TableHead>{t('common.away')}</TableHead>
                        <TableHead>{t('common.venue')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preview.map((match, index) => (
                        <TableRow key={index}>
                          <TableCell>{format(new Date(match.match_date), 'dd/MM/yy HH:mm', { locale: it })}</TableCell>
                          <TableCell>{teamsMap.get(match.home_team_id)}</TableCell>
                          <TableCell>{teamsMap.get(match.away_team_id)}</TableCell>
                          <TableCell>{venuesMap.get(match.venue_id)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <Button onClick={() => saveScheduleMutation.mutate(preview)} className="w-full mt-4" disabled={saveScheduleMutation.isPending}>
                  {saveScheduleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('pages.admin.scheduleGenerator.confirmSave')}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default ScheduleGenerator;
