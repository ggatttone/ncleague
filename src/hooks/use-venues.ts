import { createResourceHooks } from './use-resource';
import { Venue } from '@/types/database';

export interface CreateVenueData {
  name: string;
  address?: string;
  city?: string;
  struttura?: string;
  photo_url?: string;
  lat?: number;
  lon?: number;
}

export interface UpdateVenueData extends CreateVenueData {
  id: string;
}

const venueHooks = createResourceHooks<Venue, CreateVenueData, UpdateVenueData>({
  tableName: 'venues',
  queryKey: 'venues',
  orderBy: { column: 'name', ascending: true },
});

export const useVenues = venueHooks.useListAll;
export const useVenue = venueHooks.useById;
export const useCreateVenue = venueHooks.useCreate;
export const useUpdateVenue = venueHooks.useUpdate;
export const useDeleteVenue = venueHooks.useDelete;
