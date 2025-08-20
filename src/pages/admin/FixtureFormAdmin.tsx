import { AdminLayout } from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useTeams } from "@/hooks/use-teams";
import { useVenues } from "@/hooks/use-venues";
import { useCompetitions } from "@/hooks/use-competitions";
import { useSeasons } from "@/hooks/use-seasons";
import { useMatch, useCreateMatch, useUpdateMatch } from "@/hooks/use-matches";
import { useTranslation } from "react-i18next";

const matchSchema = z.object({
  home_team_id: z.string().min(1, "Squadra casa obbligatoria"),
  away_team_id: z.string().min(1, "Squadra ospite obbligatoria"),
  referee_team_id: z.string().optional().nullable(),
  match_date: z.string().min(1, "Data e ora obbligatorie"),
  status: z.enum(['scheduled', 'ongoing', 'completed', 'postponed', 'cancelled']),
  venue_id: z.string().optional().nullable(),
  competition_id: z.string().optional().nullable(),
  season_id: z.string().optional().nullable(),
  home_score: z.coerce.number().min(0).optional(),
  away_score: z.coerce.number().min(0).optional(),
}).refine(data => data.home_team_id !== data.away_team_id, {
  message: "Le squadre devono essere diverse",
  path: ["away_team_id"],
}).refine(data => !data.referee_team_id || (data.referee_team_id !== data.home_team_id && data.referee_team_id !== data.away_team_id), {
  message: "L'arbitro non può essere una delle due squadre",
  path: ["referee_team_id"],
});

type MatchFormData = z.infer<typeof matchSchema>;

const FixtureFormAdmin = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { t } = useTranslation();

  const { data: match, isLoading: matchLoading } = useMatch(id);
  const { data: teams, isLoading: teamsLoading } = useTeams();
  const { data: venues, isLoading: venuesLoading } = useVenues();
  const { data: competitions, isLoading: competitionsLoading } = useCompetitions();
  const { data: seasons, isLoading: seasonsLoading } = useSeasons();

  const createMutation = useCreateMatch();
  const updateMutation = useUpdateMatch();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    control,
    watch
  } = useForm<MatchFormData>({
    resolver: zodResolver(matchSchema),
    defaultValues: {
      status: 'scheduled',
      home_score: 0,
      away_score: 0,
      venue_id: null,
      competition_id: null,
      season_id: null,
      referee_team_id: null,
    }
  });

  const [homeTeamId, awayTeamId] = watch(['home_team_id', 'away_team_id']);

  useEffect(() => {
    if (match && isEdit) {
      reset({
        home_team_id: match.home_team_id,
        away_team_id: match.away_team_id,
        referee_team_id: match.referee_team_id || null,
        match_date: match.match_date ? new Date(match.match_date).toISOString().substring(0, 16) : '',
        status: match.status,
        venue_id: match.venue_id || null,
        competition_id: match.competition_id || null,
        season_id: match.season_id || null,
        home_score: match.home_score,
        away_score: match.away_score,
      });
    }
  }, [match, isEdit, reset]);

  const onSubmit = async (data: MatchFormData) => {
    const submissionData = {
      ...data,
      venue_id: data.venue_id || undefined,
      competition_id: data.competition_id || undefined,
      season_id: data.season_id || undefined,
      referee_team_id: data.referee_team_id || undefined,
      home_score: data.status === 'completed' ? data.home_score : 0,
      away_score: data.status === 'completed' ? data.away_score : 0,
    };

    if (isEdit && id) {
      await updateMutation.mutateAsync({ id, ...submissionData });
    } else {
      await createMutation.mutateAsync(submissionData);
    }
    navigate("/admin/fixtures");
  };

  const isLoading = teamsLoading || venuesLoading || competitionsLoading || seasonsLoading || (isEdit && matchLoading);
  const isMutating = isSubmitting || createMutation.isPending || updateMutation.isPending;

  if (isLoading && isEdit) {
    return <AdminLayout><div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">
          {isEdit ? t('pages.admin.fixtureForm.editTitle') : t('pages.admin.fixtureForm.newTitle')}
        </h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="competition_id">{t('pages.admin.fixtureForm.competitionLabel')}</Label>
              <Controller
                name="competition_id"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || ""} disabled={competitionsLoading}>
                    <SelectTrigger><SelectValue placeholder={t('pages.admin.fixtureForm.competitionPlaceholder')} /></SelectTrigger>
                    <SelectContent>
                      {competitions?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div>
              <Label htmlFor="season_id">{t('pages.admin.fixtureForm.seasonLabel')}</Label>
              <Controller
                name="season_id"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || ""} disabled={seasonsLoading}>
                    <SelectTrigger><SelectValue placeholder={t('pages.admin.fixtureForm.seasonPlaceholder')} /></SelectTrigger>
                    <SelectContent>
                      {seasons?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="home_team_id">{t('pages.admin.fixtureForm.homeTeamLabel')}</Label>
              <Controller
                name="home_team_id"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value} disabled={teamsLoading}>
                    <SelectTrigger><SelectValue placeholder={t('pages.admin.fixtureForm.homeTeamPlaceholder')} /></SelectTrigger>
                    <SelectContent>
                      {teams?.filter(t => t.id !== awayTeamId).map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.home_team_id && <p className="text-sm text-destructive mt-1">{errors.home_team_id.message}</p>}
            </div>
            <div>
              <Label htmlFor="away_team_id">{t('pages.admin.fixtureForm.awayTeamLabel')}</Label>
              <Controller
                name="away_team_id"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value} disabled={teamsLoading}>
                    <SelectTrigger><SelectValue placeholder={t('pages.admin.fixtureForm.awayTeamPlaceholder')} /></SelectTrigger>
                    <SelectContent>
                      {teams?.filter(t => t.id !== homeTeamId).map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.away_team_id && <p className="text-sm text-destructive mt-1">{errors.away_team_id.message}</p>}
            </div>
          </div>
          
          <div>
            <Label htmlFor="referee_team_id">{t('pages.admin.fixtureForm.refereeLabel')}</Label>
            <Controller
              name="referee_team_id"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={(value) => field.onChange(value === "no-referee" ? null : value)}
                  value={field.value || "no-referee"}
                  disabled={teamsLoading}
                >
                  <SelectTrigger><SelectValue placeholder={t('pages.admin.fixtureForm.refereePlaceholder')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-referee">{t('pages.admin.fixtureForm.noReferee')}</SelectItem>
                    {teams?.filter(t => t.id !== homeTeamId && t.id !== awayTeamId).map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.referee_team_id && <p className="text-sm text-destructive mt-1">{errors.referee_team_id.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="match_date">{t('pages.admin.fixtureForm.dateLabel')}</Label>
              <Input id="match-date" type="datetime-local" {...register("match_date")} />
              {errors.match_date && <p className="text-sm text-destructive mt-1">{errors.match_date.message}</p>}
            </div>
            <div>
              <Label htmlFor="venue_id">{t('pages.admin.fixtureForm.venueLabel')}</Label>
              <Controller
                name="venue_id"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || ""} disabled={venuesLoading}>
                    <SelectTrigger><SelectValue placeholder={t('pages.admin.fixtureForm.venuePlaceholder')} /></SelectTrigger>
                    <SelectContent>
                      {venues?.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="status">{t('pages.admin.fixtureForm.statusLabel')}</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger><SelectValue placeholder={t('pages.admin.fixtureForm.statusPlaceholder')} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">{t('matchStatus.scheduled')}</SelectItem>
                      <SelectItem value="ongoing">{t('matchStatus.ongoing')}</SelectItem>
                      <SelectItem value="completed">{t('matchStatus.completed')}</SelectItem>
                      <SelectItem value="postponed">{t('matchStatus.postponed')}</SelectItem>
                      <SelectItem value="cancelled">{t('matchStatus.cancelled')}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div>
              <Label htmlFor="home_score">{t('pages.admin.fixtureForm.homeScoreLabel')}</Label>
              <Input id="home_score" type="number" {...register("home_score")} />
            </div>
            <div>
              <Label htmlFor="away_score">{t('pages.admin.fixtureForm.awayScoreLabel')}</Label>
              <Input id="away_score" type="number" {...register("away_score")} />
            </div>
          </div>
          
          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="secondary" onClick={() => navigate("/admin/fixtures")} disabled={isMutating}>
              Annulla
            </Button>
            <Button type="submit" disabled={isMutating}>
              {isMutating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Salva modifiche" : "Crea partita"}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default FixtureFormAdmin;