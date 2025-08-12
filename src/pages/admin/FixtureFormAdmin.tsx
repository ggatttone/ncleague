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

const matchSchema = z.object({
  home_team_id: z.string().min(1, "Squadra casa obbligatoria"),
  away_team_id: z.string().min(1, "Squadra ospite obbligatoria"),
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
});

type MatchFormData = z.infer<typeof matchSchema>;

const FixtureFormAdmin = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

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
    control
  } = useForm<MatchFormData>({
    resolver: zodResolver(matchSchema),
    defaultValues: {
      status: 'scheduled',
      home_score: 0,
      away_score: 0,
      venue_id: null,
      competition_id: null,
      season_id: null,
    }
  });

  useEffect(() => {
    if (match && isEdit) {
      reset({
        ...match,
        match_date: match.match_date ? new Date(match.match_date).toISOString().substring(0, 16) : '',
        venue_id: match.venue_id || null,
        competition_id: match.competition_id || null,
        season_id: match.season_id || null,
      });
    }
  }, [match, isEdit, reset]);

  const onSubmit = async (data: MatchFormData) => {
    try {
      const submissionData = {
        ...data,
        venue_id: data.venue_id || undefined,
        competition_id: data.competition_id || undefined,
        season_id: data.season_id || undefined,
        home_score: data.status === 'completed' ? data.home_score : 0,
        away_score: data.status === 'completed' ? data.away_score : 0,
      };

      if (isEdit && id) {
        await updateMutation.mutateAsync({ id, ...submissionData });
      } else {
        await createMutation.mutateAsync(submissionData);
      }
      navigate("/admin/fixtures");
    } catch (error) {
      console.error("Error saving match:", error);
    }
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
          {isEdit ? "Modifica partita" : "Nuova partita"}
        </h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="competition_id">Competizione</Label>
              <Controller
                name="competition_id"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || ""} disabled={competitionsLoading}>
                    <SelectTrigger><SelectValue placeholder="Seleziona competizione" /></SelectTrigger>
                    <SelectContent>
                      {competitions?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div>
              <Label htmlFor="season_id">Stagione</Label>
              <Controller
                name="season_id"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || ""} disabled={seasonsLoading}>
                    <SelectTrigger><SelectValue placeholder="Seleziona stagione" /></SelectTrigger>
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
              <Label htmlFor="home_team_id">Squadra Casa *</Label>
              <Controller
                name="home_team_id"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value} disabled={teamsLoading}>
                    <SelectTrigger><SelectValue placeholder="Seleziona squadra" /></SelectTrigger>
                    <SelectContent>
                      {teams?.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.home_team_id && <p className="text-sm text-destructive mt-1">{errors.home_team_id.message}</p>}
            </div>
            <div>
              <Label htmlFor="away_team_id">Squadra Ospite *</Label>
              <Controller
                name="away_team_id"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value} disabled={teamsLoading}>
                    <SelectTrigger><SelectValue placeholder="Seleziona squadra" /></SelectTrigger>
                    <SelectContent>
                      {teams?.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.away_team_id && <p className="text-sm text-destructive mt-1">{errors.away_team_id.message}</p>}
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="match_date">Data e Ora *</Label>
              <Input id="match-date" type="datetime-local" {...register("match_date")} />
              {errors.match_date && <p className="text-sm text-destructive mt-1">{errors.match_date.message}</p>}
            </div>
            <div>
              <Label htmlFor="venue_id">Campo</Label>
              <Controller
                name="venue_id"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || ""} disabled={venuesLoading}>
                    <SelectTrigger><SelectValue placeholder="Seleziona campo" /></SelectTrigger>
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
              <Label htmlFor="status">Stato *</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger><SelectValue placeholder="Seleziona stato" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Programmata</SelectItem>
                      <SelectItem value="ongoing">In corso</SelectItem>
                      <SelectItem value="completed">Completata</SelectItem>
                      <SelectItem value="postponed">Rinviata</SelectItem>
                      <SelectItem value="cancelled">Cancellata</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div>
              <Label htmlFor="home_score">Punteggio Casa</Label>
              <Input id="home_score" type="number" {...register("home_score")} />
            </div>
            <div>
              <Label htmlFor="away_score">Punteggio Ospite</Label>
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