import { AdminLayout } from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useNavigate, useParams } from "react-router-dom";
import { useCreateTeam, useUpdateTeam, useTeam } from "@/hooks/use-teams";
import { useVenues } from "@/hooks/use-venues";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const teamSchema = z.object({
  name: z.string().min(1, "Il nome della squadra è obbligatorio"),
  parish: z.string().optional(),
  venue_id: z.string().optional().nullable(),
  colors: z.string().optional(),
  logo_url: z.string().url("Inserisci un URL valido").optional().or(z.literal(""))
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
    control
  } = useForm<TeamFormData>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: "",
      parish: "",
      venue_id: null,
      colors: "",
      logo_url: ""
    }
  });

  useEffect(() => {
    if (team && isEdit) {
      reset({
        name: team.name,
        parish: team.parish || "",
        venue_id: team.venue_id || null,
        colors: team.colors || "",
        logo_url: team.logo_url || ""
      });
    }
  }, [team, isEdit, reset]);

  const onSubmit = async (data: TeamFormData) => {
    try {
      const cleanData = {
        ...data,
        parish: data.parish || undefined,
        venue_id: data.venue_id || undefined,
        colors: data.colors || undefined,
        logo_url: data.logo_url || undefined
      };

      if (isEdit && id) {
        await updateTeamMutation.mutateAsync({ id, ...cleanData });
      } else {
        await createTeamMutation.mutateAsync(cleanData);
      }
      
      navigate("/admin/teams");
    } catch (error) {
      console.error("Error saving team:", error);
    }
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
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            <Input
              id="colors"
              {...register("colors")}
              placeholder="Es: Blu/Bianco"
            />
          </div>

          <div>
            <Label htmlFor="venue_id">Campo</Label>
            <Controller
              name="venue_id"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ""}
                  disabled={venuesLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona un campo" />
                  </SelectTrigger>
                  <SelectContent>
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

          <div>
            <Label htmlFor="logo_url">Logo (URL)</Label>
            <Input
              id="logo_url"
              {...register("logo_url")}
              placeholder="https://..."
              type="url"
            />
            {errors.logo_url && (
              <p className="text-sm text-destructive mt-1">{errors.logo_url.message}</p>
            )}
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
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Salva modifiche" : "Crea squadra"}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default TeamFormAdmin;