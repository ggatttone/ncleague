import { AdminLayout } from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate, useParams } from "react-router-dom";
import { useCreateTournamentMode, useUpdateTournamentMode, useTournamentMode } from "@/hooks/use-tournament-modes";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { showError } from "@/utils/toast";

const jsonString = z.string().refine((value) => {
  if (!value) return true;
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
}, { message: "JSON non valido" });

const tournamentModeSchema = z.object({
  name: z.string().min(1, "Il nome è obbligatorio"),
  description: z.string().optional(),
  handler_key: z.string().min(1, "L'handler è obbligatorio"),
  settings: jsonString.optional().or(z.literal('')),
});

type TournamentModeFormData = z.infer<typeof tournamentModeSchema>;

const availableHandlers = [
  { value: "generate_playoffs", label: "Genera Playoff" },
];

const TournamentModeFormAdmin = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const { data: mode, isLoading: modeLoading } = useTournamentMode(id);
  const createMutation = useCreateTournamentMode();
  const updateMutation = useUpdateTournamentMode();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    control,
  } = useForm<TournamentModeFormData>({
    resolver: zodResolver(tournamentModeSchema),
  });

  useEffect(() => {
    if (mode && isEdit) {
      reset({
        ...mode,
        settings: mode.settings ? JSON.stringify(mode.settings, null, 2) : '',
      });
    }
  }, [mode, isEdit, reset]);

  const onSubmit = async (data: TournamentModeFormData) => {
    try {
      const submissionData = {
        ...data,
        settings: data.settings ? JSON.parse(data.settings) : undefined,
      };

      if (isEdit && id) {
        await updateMutation.mutateAsync({ id, ...submissionData });
      } else {
        await createMutation.mutateAsync(submissionData);
      }
      navigate("/admin/tournament-modes");
    } catch (error) {
      showError("Errore nel parsing del JSON delle impostazioni.");
    }
  };

  if (modeLoading && isEdit) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">
          {isEdit ? "Modifica Modalità Torneo" : "Nuova Modalità Torneo"}
        </h1>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome</Label>
            <Input id="name" {...register("name")} autoFocus />
            {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <Label htmlFor="description">Descrizione</Label>
            <Textarea id="description" {...register("description")} />
          </div>

          <div>
            <Label htmlFor="handler_key">Logica di gestione</Label>
            <Controller
              name="handler_key"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger><SelectValue placeholder="Seleziona una logica..." /></SelectTrigger>
                  <SelectContent>
                    {availableHandlers.map(handler => (
                      <SelectItem key={handler.value} value={handler.value}>{handler.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.handler_key && <p className="text-sm text-destructive mt-1">{errors.handler_key.message}</p>}
          </div>

          <div>
            <Label htmlFor="settings">Impostazioni (JSON)</Label>
            <Textarea id="settings" {...register("settings")} rows={8} placeholder='{\n  "playoff_teams": 4\n}' />
            {errors.settings && <p className="text-sm text-destructive mt-1">{errors.settings.message}</p>}
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="secondary" onClick={() => navigate("/admin/tournament-modes")} disabled={isSubmitting}>
              Annulla
            </Button>
            <Button type="submit" disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>
              {(isSubmitting || createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Salva modifiche" : "Crea Modalità"}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default TournamentModeFormAdmin;