import { AdminLayout } from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useEvent, useUpdateEvent } from "@/hooks/use-event";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { showSuccess } from "@/utils/toast";
import { format, parseISO } from "date-fns";

const eventSchema = z.object({
  title: z.string().min(1, "Il titolo è obbligatorio"),
  event_date: z.string().min(1, "La data è obbligatoria"),
  is_active: z.boolean(),
});

type EventFormData = z.infer<typeof eventSchema>;

const EventAdmin = () => {
  const { data: event, isLoading: eventLoading } = useEvent();
  const updateEventMutation = useUpdateEvent();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    control,
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
  });

  useEffect(() => {
    if (event) {
      reset({
        title: event.title || "",
        event_date: event.event_date ? format(parseISO(event.event_date), "yyyy-MM-dd'T'HH:mm") : "",
        is_active: event.is_active,
      });
    }
  }, [event, reset]);

  const onSubmit = async (data: EventFormData) => {
    await updateEventMutation.mutateAsync({
      ...data,
      event_date: new Date(data.event_date).toISOString(),
    }, {
      onSuccess: () => {
        showSuccess("Evento aggiornato con successo!");
      }
    });
  };

  if (eventLoading) {
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
          <h1 className="text-2xl font-bold">Gestione Evento Countdown</h1>
          <Button type="submit" disabled={isSubmitting || updateEventMutation.isPending} className="w-full sm:w-auto">
            {(isSubmitting || updateEventMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salva Modifiche
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Impostazioni Countdown</CardTitle>
            <CardDescription>
              Configura il countdown che apparirà sulla homepage. Attivalo per renderlo visibile a tutti.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
              <Label htmlFor="is_active" className="flex flex-col space-y-1">
                <span>Attiva Countdown</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  Mostra o nascondi il countdown sulla homepage.
                </span>
              </Label>
              <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="is_active"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>

            <div>
              <Label htmlFor="title">Titolo / Messaggio</Label>
              <Input
                id="title"
                {...register("title")}
                placeholder="Es: Il prossimo torneo inizia tra..."
              />
              {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
            </div>

            <div>
              <Label htmlFor="event_date">Data e Ora dell'Evento</Label>
              <Input
                id="event_date"
                type="datetime-local"
                {...register("event_date")}
              />
              {errors.event_date && <p className="text-sm text-destructive mt-1">{errors.event_date.message}</p>}
            </div>
          </CardContent>
        </Card>
      </form>
    </AdminLayout>
  );
};

export default EventAdmin;