import { AdminLayout } from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useNavigate, useParams } from "react-router-dom";
import { useCreateTeam, useUpdateTeam, useTeam, CreateTeamData } from "@/hooks/use-teams";
import { useVenues } from "@/hooks/use-venues";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { MultiSelect, OptionType } from "@/components/ui/multi-select";

const colorOptions: OptionType[] = [
  { value: "Rosso", label: "Rosso" },
  { value: "Blu", label: "Blu" },
  { value: "Verde", label: "Verde" },
  { value: "Giallo", label: "Giallo" },
  { value: "Nero", label: "Nero" },
  { value: "Bianco", label: "Bianco" },
  { value: "Arancione", label: "Arancione" },
  { value: "Viola", label: "Viola" },
  { value: "Azzurro", label: "Azzurro" },
  { value: "Granata", label: "Granata" },
  { value: "Rosa", label: "Rosa" },
  { value: "Celeste", label: "Celeste" },
];

const teamSchema = z.object({
  name: z.string().min(1, "Il nome della squadra è obbligatorio"),
  parish: z.string().optional(),
  venue_id: z.string().optional().nullable(),
  colors: z.array(z.string()).max(2, "Puoi selezionare al massimo due colori").optional(),
  logo_url: z.string().url("URL non valido").optional().nullable(),
});

type TeamFormData = z.infer<typeof teamSchema>;

const TeamFormAdmin = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const { data: team, isLoading: teamLoading } = useTeam(id);
  const { data: venues, isLoading: venuesLoading } = useVenues();
  const createTeamMutation = useCreateTeam();
  const updateTeamMutation = useUpdateTeam();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    control,
    watch,
    setValue,
  } = useForm<TeamFormData>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: "",
      parish: "",
      venue_id: null,
      colors: [],
      logo_url: null,
    }
  });

  const logoUrlValue = watch('logo_url');

  useEffect(() => {
    if (team && isEdit) {
      reset({
        name: team.name,
        parish: team.parish || "",
        venue_id: team.venue_id || null,
        colors: team.colors ? team.colors.split('/') : [],
        logo_url: team.logo_url || null,
      });
    }
  }, [team, isEdit, reset]);

  const onSubmit = async (data: TeamFormData) => {
    const submissionData: CreateTeamData = {
      name: data.name,
      parish: data.parish || undefined,
      venue_id: data.venue_id || undefined,
      colors: data.colors?.join('/') || undefined,
      logo_url: data.logo_url || undefined
    };

    if (isEdit && id) {
      await updateTeamMutation.mutateAsync({ id, ...submissionData });
    } else {
      await createTeamMutation.mutateAsync(submissionData);
    }
    
    navigate("/admin/teams");
  };

  if ((teamLoading || venuesLoading) && isEdit) {
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
          {isEdit ? "Modifica squadra" : "Nuova squadra"}
        </h1>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <ImageUploader
            bucketName="team-logos"
            currentImageUrl={logoUrlValue}
            onUploadSuccess={(url) => setValue('logo_url', url, { shouldValidate: true, shouldDirty: true })}
            label="Logo squadra"
          />
          {errors.logo_url && <p className="text-sm text-destructive mt-1">{errors.logo_url.message}</p>}

          <div>
            <Label htmlFor="name">Nome squadra *</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Nome squadra"
              autoFocus
            />
            {errors.name && (
              <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="parish">Parrocchia</Label>
            <Input
              id="parish"
              {...register("parish")}
              placeholder="Parrocchia"
            />
          </div>

          <div>
            <Label htmlFor="colors">Colori sociali</Label>
            <Controller
              name="colors"
              control={control}
              render={({ field }) => (
                <MultiSelect
                  options={colorOptions}
                  selected={field.value || []}
                  onChange={field.onChange}
                  placeholder="Seleziona fino a due colori"
                  maxCount={2}
                />
              )}
            />
            {errors.colors && <p className="text-sm text-destructive mt-1">{errors.colors.message}</p>}
          </div>

          <div>
            <Label htmlFor="venue_id">Campo</Label>
            <Controller
              name="venue_id"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={(value) => field.onChange(value === "no-venue" ? null : value)}
                  value={field.value || "no-venue"}
                  disabled={venuesLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona un campo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-venue">Nessun campo</SelectItem>
                    {venues?.map((venue) => (
                      <SelectItem key={venue.id} value={venue.id}>
                        {venue.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => navigate("/admin/teams")}
              disabled={isSubmitting}
            >
              Annulla
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || createTeamMutation.isPending || updateTeamMutation.isPending}
            >
              {(isSubmitting || createTeamMutation.isPending || updateTeamMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Salva modifiche" : "Crea squadra"}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default TeamFormAdmin;