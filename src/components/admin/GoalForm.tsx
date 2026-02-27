import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useSupabaseQuery } from '@/hooks/use-supabase-query';
import { useCreateGoal } from '@/hooks/use-goals';
import { supabase } from '@/lib/supabase/client';
import { Player, Team } from '@/types/database';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

const goalSchema = z.object({
  team_id: z.string().min(1, 'Seleziona un giocatore'),
  player_id: z.string().min(1, 'Seleziona un giocatore'),
  minute: z.coerce.number().min(1, 'Minuto non valido').max(120, 'Minuto non valido'),
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
  const createGoalMutation = useCreateGoal();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const { data: players, isLoading: playersLoading } = useSupabaseQuery<Player[]>(
    ['players-for-match', homeTeam.id, awayTeam.id],
    async () =>
      supabase
        .from('players')
        .select('*')
        .in('team_id', [homeTeam.id, awayTeam.id])
        .order('last_name'),
    { enabled: true },
  );

  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    register,
  } = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
  });

  const homePlayers = players?.filter((p) => p.team_id === homeTeam.id) ?? [];
  const awayPlayers = players?.filter((p) => p.team_id === awayTeam.id) ?? [];

  const handlePlayerSelect = (player: Player) => {
    setSelectedPlayer(player);
    setValue('player_id', player.id, { shouldValidate: true });
    setValue('team_id', player.team_id, { shouldValidate: true });
    setOpen(false);
  };

  const onSubmit = (data: GoalFormData) => {
    createGoalMutation.mutate(
      { ...data, match_id: matchId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['goals', matchId] });
          queryClient.invalidateQueries({ queryKey: ['match-admin', matchId] });
          reset();
          setSelectedPlayer(null);
          onSuccess();
        },
      },
    );
  };

  const playerLabel = selectedPlayer
    ? `${selectedPlayer.first_name} ${selectedPlayer.last_name}${selectedPlayer.jersey_number ? ` #${selectedPlayer.jersey_number}` : ''}`
    : t('pages.admin.fixtureDetails.goalForm.playerSelectTrigger');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label>{t('pages.admin.fixtureDetails.goalForm.playerLabel')}</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between mt-1"
              disabled={playersLoading}
            >
              {playersLoading ? (
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('pages.admin.fixtureDetails.goalForm.playerLoading')}
                </span>
              ) : (
                <span className={cn(!selectedPlayer && 'text-muted-foreground')}>
                  {playerLabel}
                </span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput
                placeholder={t('pages.admin.fixtureDetails.goalForm.playerSearchPlaceholder')}
              />
              <CommandList>
                <CommandEmpty>
                  {t('pages.admin.fixtureDetails.goalForm.noPlayersFound')}
                </CommandEmpty>
                {homePlayers.length > 0 && (
                  <CommandGroup heading={homeTeam.name}>
                    {homePlayers.map((player) => (
                      <CommandItem
                        key={player.id}
                        value={`${player.first_name} ${player.last_name}`}
                        onSelect={() => handlePlayerSelect(player)}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            selectedPlayer?.id === player.id ? 'opacity-100' : 'opacity-0',
                          )}
                        />
                        {player.first_name} {player.last_name}
                        {player.jersey_number != null && (
                          <span className="ml-2 text-muted-foreground text-xs">
                            #{player.jersey_number}
                          </span>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                {awayPlayers.length > 0 && (
                  <CommandGroup heading={awayTeam.name}>
                    {awayPlayers.map((player) => (
                      <CommandItem
                        key={player.id}
                        value={`${player.first_name} ${player.last_name}`}
                        onSelect={() => handlePlayerSelect(player)}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            selectedPlayer?.id === player.id ? 'opacity-100' : 'opacity-0',
                          )}
                        />
                        {player.first_name} {player.last_name}
                        {player.jersey_number != null && (
                          <span className="ml-2 text-muted-foreground text-xs">
                            #{player.jersey_number}
                          </span>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {(errors.player_id || errors.team_id) && (
          <p className="text-sm text-destructive mt-1">
            {errors.player_id?.message || errors.team_id?.message}
          </p>
        )}
        {/* Hidden fields for form submission */}
        <input type="hidden" {...register('player_id')} />
        <input type="hidden" {...register('team_id')} />
      </div>

      <div>
        <Label htmlFor="minute">{t('pages.admin.fixtureDetails.goalForm.minuteLabel')}</Label>
        <Input
          id="minute"
          type="number"
          min="1"
          max="120"
          {...register('minute')}
          className="mt-1"
        />
        {errors.minute && <p className="text-sm text-destructive mt-1">{errors.minute.message}</p>}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={isSubmitting || createGoalMutation.isPending}>
          {(isSubmitting || createGoalMutation.isPending) && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {t('pages.admin.fixtureDetails.goalForm.addButton')}
        </Button>
      </div>
    </form>
  );
};
