import { AdminLayout } from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useNavigate, useParams } from "react-router-dom";
import { useCreateSeason, useUpdateSeason, useSeason, CreateSeasonData } from "@/hooks/use-seasons";
import { useTournamentModes } from "@/hooks/use-tournament-modes";
import { useTeams } from "@/hooks/use-teams";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect, OptionType } from "@/components/ui/multi-select";

const seasonSchema = z.object({
  name: z.string().min(1, "Il nome è obbligatorio"),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  tournament_mode_id: z.string().min(1, "La modalità torneo è obbligatoria").nullable(),
  team_ids: z.array(z.string()).optional(),
});

type SeasonFormData = z.infer<typeof seasonSchema>;

const SeasonFormAdmin = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { t } = useTranslation();

  const { data: season, isLoading: seasonLoading } = useSeason(id);
  const { data: tournamentModes, isLoading: modesLoading } = useTournamentModes();
  const { data: teams, isLoading: teamsLoading } = useTeams();
  const createMutation = useCreateSeason();
  const updateMutation = useUpdateSeason();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    control
  } = useForm<SeasonFormData>({
    resolver: zodResolver(seasonSchema),
    defaultValues: {
      name: "",
      start_date: "",
      end_date: "",
      tournament_mode_id: null,
      team_ids: [],
    }
  });

  useEffect(() => {
    if (season && isEdit) {
      reset({
        name: season.name,
        start_date: season.start_date ? season.start_date.split('T')[0] : '',
        end_date: season.end_date ? season.end_date.split('T')[0] : '',
        tournament_mode_id: season.tournament_mode_id || null,
        team_ids: season.teams?.map(t => t.id) || [],
      });
    }
  }, [season, isEdit, reset]);

  const onSubmit = async (data: SeasonFormData) => {
    const submissionData: CreateSeasonData = {
      name: data.name,
      start_date: data.start_date,
      end_date: data.end_date,
      tournament_mode_id: data.tournament_mode_id,
      team_ids: data.team_ids,
    };

    if (isEdit && id) {
      await updateMutation.mutateAsync({ id, ...submissionData });
    } else {
      await createMutation.mutateAsync(submissionData);
    }
    navigate("/admin/seasons");
  };

  const teamOptions: OptionType[] = teams?.map(t => ({ value: t.id, label: t.name })) || [];

  if ((seasonLoading || modesLoading || teamsLoading) && isEdit) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">
          {isEdit ? t('pages.admin.seasonForm.editTitle') : t('pages.admin.seasonForm.newTitle')}
        </h1>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">{t('pages.admin.seasonForm.nameLabel')}</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder={t('pages.admin.seasonForm.namePlaceholder')}
              autoFocus
            />
            {errors.name && (
              <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="tournament_mode_id">Modalità Torneo</Label>
            <Controller
              name="tournament_mode_id"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={(value) => field.onChange(value)}
                  value={field.value || ""}
                  disabled={modesLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona una modalità..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tournamentModes?.map((mode) => (
                      <SelectItem key={mode.id} value={mode.id}>
                        {mode.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.tournament_mode_id && (
              <p className="text-sm text-destructive mt-1">{errors.tournament_mode_id.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="team_ids">Squadre Partecipanti</Label>
            <Controller
              name="team_ids"
              control={control}
              render={({ field }) => (
                <MultiSelect
                  options={teamOptions}
                  selected={field.value || []}
                  onChange={field.onChange}
                  placeholder="Seleziona le squadre..."
                />
              )}
            />
            {errors.team_ids && <p className="text-sm text-destructive mt-1">{errors.team_ids.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">{t('pages.admin.seasonForm.startDateLabel')}</Label>
              <Input
                id="start_date"
                type="date"
                {...register("start_date")}
              />
            </div>
            <div>
              <Label htmlFor="end_date">{t('pages.admin.seasonForm.endDateLabel')}</Label>
              <Input
                id="end_date"
                type="date"
                {...register("end_date")}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => navigate("/admin/seasons")}
              disabled={isSubmitting}
            >
              Annulla
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
            >
              {(isSubmitting || createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Salva modifiche" : "Crea stagione"}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default SeasonFormAdmin;