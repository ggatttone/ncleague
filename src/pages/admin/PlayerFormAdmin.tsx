import { AdminLayout } from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { usePlayer, useCreatePlayer, useUpdatePlayer } from "@/hooks/use-players";
import { useTeams } from "@/hooks/use-teams";

// Schema for form validation
const playerSchema = z.object({
  first_name: z.string().min(1, "Il nome è obbligatorio"),
  last_name: z.string().min(1, "Il cognome è obbligatorio"),
  date_of_birth: z.string().optional(),
  role: z.string().optional(),
  jersey_number: z.coerce.number().optional(),
  document_id: z.string().optional(),
  team_id: z.string().optional().nullable(),
});

type PlayerFormData = z.infer<typeof playerSchema>;

const PlayerFormAdmin = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  // Fetch data
  const { data: player, isLoading: playerLoading } = usePlayer(id);
  const { data: teams, isLoading: teamsLoading } = useTeams();
  const createPlayerMutation = useCreatePlayer();
  const updatePlayerMutation = useUpdatePlayer();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    control
  } = useForm<PlayerFormData>({
    resolver: zodResolver(playerSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      date_of_birth: "",
      role: "",
      jersey_number: undefined,
      document_id: "",
      team_id: null,
    }
  });

  // Pre-fill form if editing
  useEffect(() => {
    if (player && isEdit) {
      reset({
        ...player,
        date_of_birth: player.date_of_birth ? player.date_of_birth.split('T')[0] : '',
        team_id: player.team_id || null,
      });
    }
  }, [player, isEdit, reset]);

  const onSubmit = async (data: PlayerFormData) => {
    try {
      const cleanData = {
        ...data,
        team_id: data.team_id || undefined,
        date_of_birth: data.date_of_birth || undefined,
        role: data.role || undefined,
        jersey_number: data.jersey_number || undefined,
        document_id: data.document_id || undefined,
      };

      if (isEdit && id) {
        await updatePlayerMutation.mutateAsync({ id, ...cleanData });
      } else {
        await createPlayerMutation.mutateAsync(cleanData);
      }
      navigate("/admin/players");
    } catch (error) {
      console.error("Error saving player:", error);
    }
  };

  const isLoading = (playerLoading || teamsLoading) && isEdit;
  const isMutating = isSubmitting || createPlayerMutation.isPending || updatePlayerMutation.isPending;

  if (isLoading) {
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
          {isEdit ? "Modifica giocatore" : "Nuovo giocatore"}
        </h1>
        <form
          className="space-y-4"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">Nome *</Label>
              <Input id="first_name" {...register("first_name")} placeholder="Nome" autoFocus />
              {errors.first_name && <p className="text-sm text-destructive mt-1">{errors.first_name.message}</p>}
            </div>
            <div>
              <Label htmlFor="last_name">Cognome *</Label>
              <Input id="last_name" {...register("last_name")} placeholder="Cognome" />
              {errors.last_name && <p className="text-sm text-destructive mt-1">{errors.last_name.message}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="team_id">Squadra</Label>
            <Controller
              name="team_id"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={(value) => field.onChange(value === "no-team" ? null : value)}
                  value={field.value || "no-team"}
                  disabled={teamsLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona una squadra" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-team">Nessuna squadra</SelectItem>
                    {teams?.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div>
            <Label htmlFor="date_of_birth">Data di nascita</Label>
            <Input id="date_of_birth" type="date" {...register("date_of_birth")} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="role">Ruolo</Label>
              <Input id="role" {...register("role")} placeholder="Es: Portiere, Difensore..." />
            </div>
            <div>
              <Label htmlFor="jersey_number">Numero maglia</Label>
              <Input id="jersey_number" type="number" min={1} max={99} {...register("jersey_number")} />
            </div>
          </div>

          <div>
            <Label htmlFor="document_id">Documento (opzionale)</Label>
            <Input id="document_id" {...register("document_id")} placeholder="ID documento" />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="secondary" onClick={() => navigate("/admin/players")} disabled={isMutating}>
              Annulla
            </Button>
            <Button type="submit" disabled={isMutating}>
              {isMutating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Salva modifiche" : "Crea giocatore"}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default PlayerFormAdmin;