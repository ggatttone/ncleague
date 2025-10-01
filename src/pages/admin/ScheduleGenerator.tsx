import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useSeasons } from "@/hooks/use-seasons";
import { useVenues } from "@/hooks/use-venues";
import { useTeams } from "@/hooks/use-teams";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Calendar, Wand2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

const scheduleSchema = z.object({
  season_id: z.string().min(1, "Seleziona una stagione"),
  stage: z.string().min(1, "Seleziona una fase"),
  startDate: z.string().min(1, "Seleziona una data di inizio"),
  endDate: z.string().min(1, "Seleziona una data di fine"),
  allowedDays: z.array(z.number()).min(1, "Seleziona almeno un giorno"),
  timeSlots: z.string().min(1, "Inserisci almeno un orario"),
  venueIds: z.array(z.string()).min(1, "Seleziona almeno un campo"),
  includeReturnGames: z.boolean(),
});

type ScheduleFormData = z.infer<typeof scheduleSchema>;

const daysOfWeek = [
  { id: 1, label: "Lunedì" }, { id: 2, label: "Martedì" }, { id: 3, label: "Mercoledì" },
  { id: 4, label: "Giovedì" }, { id: 5, label: "Venerdì" }, { id: 6, label: "Sabato" }, { id: 0, label: "Domenica" }
];

const ScheduleGenerator = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [preview, setPreview] = useState<any[] | null>(null);

  const { data: seasons, isLoading: seasonsLoading } = useSeasons();
  const { data: venues, isLoading: venuesLoading } = useVenues();
  const { data: teams, isLoading: teamsLoading } = useTeams();

  const { control, handleSubmit, formState: { errors } } = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      allowedDays: [],
      venueIds: [],
      includeReturnGames: true,
    },
  });

  const generatePreviewMutation = useMutation({
    mutationFn: async (formData: ScheduleFormData) => {
      const { data, error } = await supabase.functions.invoke('match-scheduler', {
        body: {
          dryRun: true,
          schedule: {
            season_id: formData.season_id,
            stage: formData.stage,
            constraints: {
              startDate: formData.startDate,
              endDate: formData.endDate,
              allowedDays: formData.allowedDays,
              timeSlots: formData.timeSlots.split(',').map(t => t.trim()),
              venueIds: formData.venueIds,
              includeReturnGames: formData.includeReturnGames,
            }
          }
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setPreview(data);
      showSuccess(`Anteprima di ${data.length} partite generata con successo!`);
    },
    onError: (err: any) => showError(`Errore: ${err.message}`),
  });

  const saveScheduleMutation = useMutation({
    mutationFn: async (schedule: any[]) => {
      const { data, error } = await supabase.functions.invoke('match-scheduler', {
        body: { dryRun: false, schedule }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      showSuccess("Calendario salvato con successo!");
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      navigate('/admin/fixtures');
    },
    onError: (err: any) => showError(`Errore nel salvataggio: ${err.message}`),
  });

  const teamsMap = useMemo(() => new Map(teams?.map(t => [t.id, t.name])), [teams]);
  const venuesMap = useMemo(() => new Map(venues?.map(v => [v.id, v.name])), [venues]);

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Generatore Calendario Automatico</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>1. Imposta Vincoli</CardTitle>
            <CardDescription>Definisci i parametri per la generazione del calendario.</CardDescription>
          </CardHeader>
          <CardContent as="form" onSubmit={handleSubmit((data) => generatePreviewMutation.mutate(data))} className="space-y-4">
            {/* Season and Stage */}
            <div className="space-y-2">
              <Controller name="season_id" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value} disabled={seasonsLoading}>
                  <SelectTrigger><SelectValue placeholder="Seleziona una stagione..." /></SelectTrigger>
                  <SelectContent>{seasons?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              )} />
              {errors.season_id && <p className="text-sm text-destructive">{errors.season_id.message}</p>}
              <Controller name="stage" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger><SelectValue placeholder="Seleziona una fase..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular_season">Stagione Regolare</SelectItem>
                    <SelectItem value="poule_a">Poule A</SelectItem>
                    <SelectItem value="poule_b">Poule B</SelectItem>
                  </SelectContent>
                </Select>
              )} />
              {errors.stage && <p className="text-sm text-destructive">{errors.stage.message}</p>}
            </div>
            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div><Label htmlFor="startDate">Data Inizio</Label><Input id="startDate" type="date" {...control.register("startDate")} /></div>
              <div><Label htmlFor="endDate">Data Fine</Label><Input id="endDate" type="date" {...control.register("endDate")} /></div>
            </div>
            {/* Days */}
            <div>
              <Label>Giorni permessi</Label>
              <Controller name="allowedDays" control={control} render={({ field }) => (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {daysOfWeek.map(day => (
                    <div key={day.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`day-${day.id}`}
                        checked={field.value?.includes(day.id)}
                        onCheckedChange={(checked) => {
                          return checked
                            ? field.onChange([...(field.value || []), day.id])
                            : field.onChange(field.value?.filter(value => value !== day.id));
                        }}
                      />
                      <Label htmlFor={`day-${day.id}`} className="text-sm font-normal">{day.label}</Label>
                    </div>
                  ))}
                </div>
              )} />
              {errors.allowedDays && <p className="text-sm text-destructive">{errors.allowedDays.message}</p>}
            </div>
            {/* Times and Venues */}
            <div><Label htmlFor="timeSlots">Orari (separati da virgola)</Label><Input id="timeSlots" {...control.register("timeSlots")} placeholder="20:00, 21:00" /></div>
            <div>
              <Label>Campi da utilizzare</Label>
              <Controller name="venueIds" control={control} render={({ field }) => (
                <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto">
                  {venues?.map(venue => (
                    <div key={venue.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`venue-${venue.id}`}
                        checked={field.value?.includes(venue.id)}
                        onCheckedChange={(checked) => {
                          return checked
                            ? field.onChange([...(field.value || []), venue.id])
                            : field.onChange(field.value?.filter(value => value !== venue.id));
                        }}
                      />
                      <Label htmlFor={`venue-${venue.id}`} className="text-sm font-normal">{venue.name}</Label>
                    </div>
                  ))}
                </div>
              )} />
              {errors.venueIds && <p className="text-sm text-destructive">{errors.venueIds.message}</p>}
            </div>
            <div className="flex items-center space-x-2">
              <Controller name="includeReturnGames" control={control} render={({ field }) => (
                <Checkbox id="includeReturnGames" checked={field.value} onCheckedChange={field.onChange} />
              )} />
              <Label htmlFor="includeReturnGames">Includi partite di ritorno</Label>
            </div>
            <Button type="submit" className="w-full" disabled={generatePreviewMutation.isPending}>
              {generatePreviewMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Wand2 className="mr-2 h-4 w-4" /> Genera Anteprima
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>2. Anteprima Calendario</CardTitle>
            <CardDescription>Controlla il calendario generato prima di salvarlo.</CardDescription>
          </CardHeader>
          <CardContent>
            {generatePreviewMutation.isPending && <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>}
            {!preview && !generatePreviewMutation.isPending && (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="mx-auto h-12 w-12 mb-4" />
                <p>L'anteprima del calendario apparirà qui.</p>
              </div>
            )}
            {preview && (
              <>
                <div className="overflow-auto max-h-96">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Casa</TableHead>
                        <TableHead>Ospite</TableHead>
                        <TableHead>Campo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preview.map((match, index) => (
                        <TableRow key={index}>
                          <TableCell>{format(new Date(match.match_date), 'dd/MM/yy HH:mm', { locale: it })}</TableCell>
                          <TableCell>{teamsMap.get(match.home_team_id)}</TableCell>
                          <TableCell>{teamsMap.get(match.away_team_id)}</TableCell>
                          <TableCell>{venuesMap.get(match.venue_id)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <Button onClick={() => saveScheduleMutation.mutate(preview)} className="w-full mt-4" disabled={saveScheduleMutation.isPending}>
                  {saveScheduleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Conferma e Salva Calendario
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default ScheduleGenerator;