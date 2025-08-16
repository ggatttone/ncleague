import { useSupabaseQuery, useSupabaseMutation } from './use-supabase-query';
import { supabase } from '@/lib/supabase/client';
import { Event } from '@/types/database';

export interface UpdateEventData {
  title?: string | null;
  event_date?: string | null;
  is_active?: boolean;
}

// Hook to get the single event configuration
export function useEvent() {
  return useSupabaseQuery<Event>(
    ['event'],
    async () => supabase.from('events').select('*').eq('id', 1).single(),
    {
      staleTime: 1000 * 60 * 5, // Stale after 5 minutes
    }
  );
}

// Hook to update the event configuration
export function useUpdateEvent() {
  return useSupabaseMutation<Event, UpdateEventData>(
    ['event'],
    async (data) => 
      supabase.from('events').update(data).eq('id', 1).select().single()
  );
}