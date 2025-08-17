import { AdminLayout } from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useNavigate, useParams } from "react-router-dom";
import { useCreateHonor, useUpdateHonor, useHonor } from "@/hooks/use-honors";
import { useTeams } from "@/hooks/use-teams";
import { useCompetitions } from "@/hooks/use-competitions";
import { useSeasons } from "@/hooks/use-seasons";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const honorSchema = z.object({
  team_id: z.string().min(1, "Squadra obbligatoria"),
  competition_id: z.string().min(1, "Competizione obbligatoria"),
  season_id: z.string().min(1, "Stagione obbligatoria"),
  achievement: z.string().min(1, "Risultato obbligatorio"),
});

type HonorFormData = z.infer<typeof honorSchema>;

const HonorFormAdmin = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const { data: honor, isLoading: honorLoading } = useHonor(id);
  const { data: teams, isLoading: teamsLoading } = useTeams();
  const { data: competitions, isLoading: competitionsLoading } = useCompetitions();
  const { data: seasons, isLoading: seasonsLoading } = useSeasons();
  const createMutation = useCreateHonor();
  const updateMutation = useUpdateHonor();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    control,
  } = useForm<HonorFormData>({ resolver: zodResolver(honorSchema) });

  useEffect(() => {
    if (honor && isEdit) reset(honor);
  }, [honor, isEdit, reset]);

  const onSubmit = async (data: HonorFormData) => {
    if (isEdit && id) {
      await updateMutation.mutateAsync({ id, ...data });
    } else {
      await createMutation.mutateAsync(data);
    }
    navigate("/admin/honors");
  };

  const isLoading = (honorLoading || teamsLoading || competitionsLoading || seasonsLoading) && isEdit;

  return (
    <AdminLayout>
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">{isEdit ? "Modifica Trofeo" : "Nuovo Trofeo"}</h1>
        {isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="team_id">Squadra *</Label>
              <Controller name="team_id" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value} disabled={teamsLoading}>
                  <SelectTrigger><SelectValue placeholder="Seleziona squadra" /></SelectTrigger>
                  <SelectContent>{teams?.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              )} />
              {errors.team_id && <p className="text-sm text-destructive mt-1">{errors.team_id.message}</p>}
            </div>
            <div>
              <Label htmlFor="competition_id">Competizione *</Label>
              <Controller name="competition_id" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value} disabled={competitionsLoading}>
                  <SelectTrigger><SelectValue placeholder="Seleziona competizione" /></SelectTrigger>
                  <SelectContent>{competitions?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              )} />
              {errors.competition_id && <p className="text-sm text-destructive mt-1">{errors.competition_id.message}</p>}
            </div>
            <div>
              <Label htmlFor="season_id">Stagione *</Label>
              <Controller name="season_id" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value} disabled={seasonsLoading}>
                  <SelectTrigger><SelectValue placeholder="Seleziona stagione" /></SelectTrigger>
                  <SelectContent>{seasons?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              )} />
              {errors.season_id && <p className="text-sm text-destructive mt-1">{errors.season_id.message}</p>}
            </div>
            <div>
              <Label htmlFor="achievement">Risultato *</Label>
              <Input id="achievement" {...register("achievement")} placeholder="Es: Campione, Vincitore Coppa..." />
              {errors.achievement && <p className="text-sm text-destructive mt-1">{errors.achievement.message}</p>}
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="secondary" onClick={() => navigate("/admin/honors")} disabled={isSubmitting}>Annulla</Button>
              <Button type="submit" disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>
                {(isSubmitting || createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? "Salva" : "Crea"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </AdminLayout>
  );
};

export default HonorFormAdmin;