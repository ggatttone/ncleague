import { AdminLayout } from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useNavigate, useParams } from "react-router-dom";
import { useCreateTeam, useUpdateTeam, useTeam } from "@/hooks/use-teams";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

const teamSchema = z.object({
  name: z.string().min(1, "Il nome della squadra è obbligatorio"),
  parish: z.string().optional(),
  venue: z.string().optional(),
  colors: z.string().optional(),
  logo_url: z.string().url("Inserisci un URL valido").optional().or(z.literal(""))
});

type TeamFormData = z.infer<typeof teamSchema>;

const TeamFormAdmin = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const { data: team, isLoading: teamLoading } = useTeam(id);
  const createTeamMutation = useCreateTeam();
  const updateTeamMutation = useUpdateTeam();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<TeamFormData>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: "",
      parish: "",
      venue: "",
      colors: "",
      logo_url: ""
    }
  });

  // Reset form with team data when editing
  useEffect(() => {
    if (team && isEdit) {
      reset({
        name: team.name,
        parish: team.parish || "",
        venue: team.venue || "",
        colors: team.colors || "",
        logo_url: team.logo_url || ""
      });
    }
  }, [team, isEdit, reset]);

  const onSubmit = async (data: TeamFormData) => {
    try {
      // Clean up empty strings to undefined for optional fields
      const cleanData = {
        ...data,
        parish: data.parish || undefined,
        venue: data.venue || undefined,
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

  if (teamLoading && isEdit) {
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
            {errors.parish && (
              <p className="text-sm text-destructive mt-1">{errors.parish.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="colors">Colori sociali</Label>
            <Input
              id="colors"
              {...register("colors")}
              placeholder="Es: Blu/Bianco"
            />
            {errors.colors && (
              <p className="text-sm text-destructive mt-1">{errors.colors.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="venue">Campo</Label>
            <Input
              id="venue"
              {...register("venue")}
              placeholder="Campo di gioco"
            />
            {errors.venue && (
              <p className="text-sm text-destructive mt-1">{errors.venue.message}</p>
            )}
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