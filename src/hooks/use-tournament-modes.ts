import { createResourceHooks } from './use-resource';
import { TournamentMode } from '@/types/database';

export interface UpsertTournamentModeData {
  name: string;
  description?: string;
  handler_key: string;
  settings?: object;
}

export interface UpdateTournamentModeData extends UpsertTournamentModeData {
  id: string;
}

const tournamentModeHooks = createResourceHooks<TournamentMode, UpsertTournamentModeData, UpdateTournamentModeData>({
  tableName: 'tournament_modes',
  queryKey: 'tournament_modes',
  singularKey: 'tournament_mode',
  orderBy: { column: 'name', ascending: true },
});

export const useTournamentModes = tournamentModeHooks.useListAll;
export const useTournamentMode = tournamentModeHooks.useById;
export const useCreateTournamentMode = tournamentModeHooks.useCreate;
export const useUpdateTournamentMode = tournamentModeHooks.useUpdate;
export const useDeleteTournamentMode = tournamentModeHooks.useDelete;
