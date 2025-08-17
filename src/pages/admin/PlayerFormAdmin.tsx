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
import { ImageUploader } from "@/components/admin/ImageUploader";

// Schema for form validation
const playerSchema = z.object({
  first_name: z.string().min(1, "Il nome è obbligatorio"),
  last_name: z.string().min(1, "Il cognome è obbligatorio"),
  date_of_birth: z.string().optional(),
  nationality: z.string().optional(),
  role: z.string().optional(),
  jersey_number: z.coerce.number().optional(),
  document_id: z.string().optional(),
  team_id: z.string().optional().nullable(),
  photo_url: z.string().url("URL non valido").optional().nullable(),
});

type PlayerFormData = z.infer<typeof playerSchema>;

const playerRoles = ["Portiere", "Difensore", "Centrocampista", "Attaccante"];
const nationalities = [
  "Italiana", "Albanese", "Argentina", "Belga", "Brasiliana", "Croata", "Danese", "Egiziana", "Francese", "Tedesca", "Inglese", "Ghanese", "Greca", "Ivoriana", "Marocchina", "Olandese", "Nigeriana", "Polacca", "Portoghese", "Rumena", "Senegalese", "Serba", "Spagnola", "Svedese", "Svizzera", "Tunisina", "Turca", "Uruguayana", "Statunitense", "Altra"
].sort();

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
    control,
    setValue,
    watch,
  } = useForm<PlayerFormData>({
    resolver: zodResolver(playerSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      date_of_birth: "",
      nationality: "",
      role: "",
      jersey_number: undefined,
      document_id: "",
      team_id: null,
      photo_url: null,
    }
  });

  const photoUrlValue = watch('photo_url');

  // Pre-fill form if editing
  useEffect(() => {
    if (player && isEdit) {
      reset({
        ...player,
        date_of_birth: player.date_of_birth ? player.date_of_birth.split('T')[0] : '',
        nationality: player.nationality || "",
        team_id: player.team_id || null,
        photo_url: player.photo_url || null,
      });
    }
  }, [player, isEdit, reset]);

  const onSubmit = async (data: PlayerFormData) => {
    const cleanData = {
      first_name: data.first_name,
      last_name: data.last_name,
      team_id: data.team_id || null,
      date_of_birth: data.date_of_birth || null,
      nationality: data.nationality || null,
      role: data.role || null,
      jersey_number: data.jersey_number && !isNaN(data.jersey_number) ? data.jersey_number : null,
      document_id: data.document_id || null,
      photo_url: data.photo_url || null,
    };

    if (isEdit && id) {
      await updatePlayerMutation.mutateAsync({ id, ...cleanData });
    } else {
      await createPlayerMutation.mutateAsync(cleanData);
    }
    navigate("/admin/players");
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
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold">
            {isEdit ? "Modifica giocatore" : "Nuovo giocatore"}
          </h1>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button type="button" variant="secondary" onClick={() => navigate("/admin/players")} disabled={isMutating} className="w-full">
              Annulla
            </Button>
            <Button type="submit" disabled={isMutating} className="w-full">
              {isMutating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Salva modifiche" : "Crea giocatore"}
            </Button>
          </div>
        </div>

        <div className="max-w-xl mx-auto space-y-6">
          <ImageUploader
            bucketName="player-photos"
            currentImageUrl={photoUrlValue}
            onUploadSuccess={(url) => setValue('photo_url', url, { shouldValidate: true, shouldDirty: true })}
            label="Foto del giocatore"
          />
          {errors.photo_url && <p className="text-sm text-destructive mt-1">{errors.photo_url.message}</p>}

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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date_of_birth">Data di nascita</Label>
              <Input id="date_of_birth" type="date" {...register("date_of_birth")} />
            </div>
            <div>
              <Label htmlFor="nationality">Nazionalità</Label>
              <Controller
                name="nationality"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona nazionalità" />
                    </SelectTrigger>
                    <SelectContent>
                      {nationalities.map(nat => (
                        <SelectItem key={nat} value={nat}>{nat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="role">Ruolo</Label>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona un ruolo" />
                    </SelectTrigger>
                    <SelectContent>
                      {playerRoles.map(role => (
                        <SelectItem key={role} value={role}>{role}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
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
        </div>
      </form>
    </AdminLayout>
  );
};

export default PlayerFormAdmin;