import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSupabaseQuery } from "@/hooks/use-supabase-query";
import { useCreateGoal } from "@/hooks/use-goals";
import { supabase } from "@/lib/supabase/client";
import { Player, Team } from "@/types/database";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

const goalSchema = z.object({
  team_id: z.string().min(1, "Seleziona una squadra"),
  player_id: z.string().min(1, "Seleziona un giocatore"),
  minute: z.coerce.number().min(1, "Minuto non valido").max(120, "Minuto non valido"),
});

type GoalFormData = z.infer<typeof goalSchema>;

interface GoalFormProps {
  matchId: string;
  homeTeam: Team;
  awayTeam: Team;
  onSuccess: () => void;
}

export const GoalForm = ({ matchId, homeTeam, awayTeam, onSuccess }: GoalFormProps) => {
  const queryClient = useQueryClient();
  const [selectedTeamId, setSelectedTeamId] = useState<string | undefined>();
  const createGoalMutation = useCreateGoal();

  const { data: players, isLoading: playersLoading } = useSupabaseQuery<Player[]>(
    ['players-for-team', selectedTeamId],
    async () => supabase.from('players').select('*').eq('team_id', selectedTeamId),
    { enabled: !!selectedTeamId }
  );

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    reset,
    setValue,
  } = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
  });

  const watchedTeamId = watch("team_id");

  useEffect(() => {
    setSelectedTeamId(watchedTeamId);
    setValue("player_id", ""); // Reset player when team changes
  }, [watchedTeamId, setValue]);

  const onSubmit = (data: GoalFormData) => {
    createGoalMutation.mutate({ ...data, match_id: matchId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['goals', matchId] });
        queryClient.invalidateQueries({ queryKey: ['match-admin', matchId] });
        reset();
        onSuccess();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="team_id">Squadra</Label>
        <Controller
          name="team_id"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona squadra" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={homeTeam.id}>{homeTeam.name}</SelectItem>
                <SelectItem value={awayTeam.id}>{awayTeam.name}</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {errors.team_id && <p className="text-sm text-destructive mt-1">{errors.team_id.message}</p>}
      </div>

      <div>
        <Label htmlFor="player_id">Giocatore</Label>
        <Controller
          name="player_id"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value} disabled={!selectedTeamId || playersLoading}>
              <SelectTrigger>
                <SelectValue placeholder={playersLoading ? "Caricamento..." : "Seleziona giocatore"} />
              </SelectTrigger>
              <SelectContent>
                {players?.map(player => (
                  <SelectItem key={player.id} value={player.id}>
                    {player.first_name} {player.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.player_id && <p className="text-sm text-destructive mt-1">{errors.player_id.message}</p>}
      </div>

      <div>
        <Label htmlFor="minute">Minuto</Label>
        <Input id="minute" type="number" {...control.register("minute")} />
        {errors.minute && <p className="text-sm text-destructive mt-1">{errors.minute.message}</p>}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={isSubmitting || createGoalMutation.isPending}>
          {(isSubmitting || createGoalMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Aggiungi Goal
        </Button>
      </div>
    </form>
  );
};