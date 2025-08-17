import { AdminLayout } from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useTeams } from "@/hooks/use-teams";
import { useVenues } from "@/hooks/use-venues";
import { useCompetitions } from "@/hooks/use-competitions";
import { useSeasons } from "@/hooks/use-seasons";
import { useCreateMultipleMatches } from "@/hooks/use-matches";
import { Card, CardContent } from "@/components/ui/card";
import { showSuccess } from "@/utils/toast";

const fixtureSchema = z.object({
  home_team_id: z.string().min(1, "Obbligatorio"),
  away_team_id: z.string().min(1, "Obbligatorio"),
  match_date: z.string().min(1, "Obbligatorio"),
  venue_id: z.string().optional().nullable(),
  competition_id: z.string().optional().nullable(),
  season_id: z.string().optional().nullable(),
  referee_team_id: z.string().optional().nullable(),
}).refine(data => data.home_team_id !== data.away_team_id, {
  message: "Le squadre devono essere diverse",
  path: ["away_team_id"],
}).refine(data => !data.referee_team_id || (data.referee_team_id !== data.home_team_id && data.referee_team_id !== data.away_team_id), {
  message: "L'arbitro non può essere una delle due squadre",
  path: ["referee_team_id"],
});

const bulkFixturesSchema = z.object({
  fixtures: z.array(fixtureSchema).min(1, "Aggiungi almeno una partita"),
});

type BulkFixturesFormData = z.infer<typeof bulkFixturesSchema>;

const FixtureBulkFormAdmin = () => {
  const navigate = useNavigate();
  const { data: teams, isLoading: teamsLoading } = useTeams();
  const { data: venues, isLoading: venuesLoading } = useVenues();
  const { data: competitions, isLoading: competitionsLoading } = useCompetitions();
  const { data: seasons, isLoading: seasonsLoading } = useSeasons();
  const createMultipleMatchesMutation = useCreateMultipleMatches();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<BulkFixturesFormData>({
    resolver: zodResolver(bulkFixturesSchema),
    defaultValues: {
      fixtures: [{ home_team_id: '', away_team_id: '', match_date: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "fixtures",
  });

  const onSubmit = async (data: BulkFixturesFormData) => {
    const submissionData = data.fixtures.map(fixture => ({
      ...fixture,
      status: 'scheduled' as const,
      venue_id: fixture.venue_id || undefined,
      competition_id: fixture.competition_id || undefined,
      season_id: fixture.season_id || undefined,
      referee_team_id: fixture.referee_team_id || undefined,
    }));
    
    await createMultipleMatchesMutation.mutateAsync(submissionData);
    showSuccess(`${submissionData.length} partite create con successo!`);
    navigate("/admin/fixtures");
  };

  const isLoading = teamsLoading || venuesLoading || competitionsLoading || seasonsLoading;

  return (
    <AdminLayout>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Inserimento Multiplo Partite</h1>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => navigate("/admin/fixtures")} disabled={isSubmitting}>
              Annulla
            </Button>
            <Button type="submit" disabled={isSubmitting || isLoading}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salva Tutte le Partite
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {fields.map((field, index) => {
            const homeTeamId = watch(`fixtures.${index}.home_team_id`);
            const awayTeamId = watch(`fixtures.${index}.away_team_id`);
            return (
            <Card key={field.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Teams */}
                    <div className="space-y-2">
                      <Label>Squadre *</Label>
                      <Controller
                        name={`fixtures.${index}.home_team_id`}
                        control={control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value} disabled={teamsLoading}>
                            <SelectTrigger><SelectValue placeholder="Squadra Casa" /></SelectTrigger>
                            <SelectContent>{teams?.filter(t => t.id !== awayTeamId).map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                          </Select>
                        )}
                      />
                      <Controller
                        name={`fixtures.${index}.away_team_id`}
                        control={control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value} disabled={teamsLoading}>
                            <SelectTrigger><SelectValue placeholder="Squadra Ospite" /></SelectTrigger>
                            <SelectContent>{teams?.filter(t => t.id !== homeTeamId).map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                          </Select>
                        )}
                      />
                      {errors.fixtures?.[index]?.away_team_id && <p className="text-sm text-destructive">{errors.fixtures[index]?.away_team_id?.message}</p>}
                      <Controller
                        name={`fixtures.${index}.referee_team_id`}
                        control={control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value || ""} disabled={teamsLoading}>
                            <SelectTrigger><SelectValue placeholder="Arbitro (opzionale)" /></SelectTrigger>
                            <SelectContent>{teams?.filter(t => t.id !== homeTeamId && t.id !== awayTeamId).map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    {/* Date and Venue */}
                    <div className="space-y-2">
                      <Label>Data e Campo *</Label>
                      <Controller
                        name={`fixtures.${index}.match_date`}
                        control={control}
                        render={({ field }) => <Input type="datetime-local" {...field} />}
                      />
                      <Controller
                        name={`fixtures.${index}.venue_id`}
                        control={control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value || ""} disabled={venuesLoading}>
                            <SelectTrigger><SelectValue placeholder="Campo (opzionale)" /></SelectTrigger>
                            <SelectContent>{venues?.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    {/* Competition and Season */}
                    <div className="space-y-2">
                      <Label>Competizione e Stagione</Label>
                      <Controller
                        name={`fixtures.${index}.competition_id`}
                        control={control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value || ""} disabled={competitionsLoading}>
                            <SelectTrigger><SelectValue placeholder="Competizione (opzionale)" /></SelectTrigger>
                            <SelectContent>{competitions?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                          </Select>
                        )}
                      />
                      <Controller
                        name={`fixtures.${index}.season_id`}
                        control={control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value || ""} disabled={seasonsLoading}>
                            <SelectTrigger><SelectValue placeholder="Stagione (opzionale)" /></SelectTrigger>
                            <SelectContent>{seasons?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </div>
                  <div className="ml-4">
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )})}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => append({ home_team_id: '', away_team_id: '', match_date: '' })}
          className="mt-4"
        >
          <Plus className="mr-2 h-4 w-4" />
          Aggiungi Partita
        </Button>
      </form>
    </AdminLayout>
  );
};

export default FixtureBulkFormAdmin;