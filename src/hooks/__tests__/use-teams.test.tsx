import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

const mockChainable = {
  select: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
};

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => mockChainable),
  },
}));

vi.mock('@/utils/toast', () => ({
  showError: vi.fn(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useTeams', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset thenable behavior
    Object.defineProperty(mockChainable, 'then', {
      value: (resolve: (v: unknown) => void) => {
        resolve({ data: [], error: null });
        return Promise.resolve({ data: [], error: null });
      },
      configurable: true,
    });
  });

  it('useTeams calls supabase from teams', async () => {
    const { supabase } = await import('@/lib/supabase/client');
    const { useTeams } = await import('../use-teams');

    renderHook(() => useTeams(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('teams');
    });
  });

  it('useTeam is disabled when id is undefined', async () => {
    const { useTeam } = await import('../use-teams');

    const { result } = renderHook(() => useTeam(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
  });

  it('useCreateTeam returns a mutation hook', async () => {
    const { useCreateTeam } = await import('../use-teams');

    const { result } = renderHook(() => useCreateTeam(), {
      wrapper: createWrapper(),
    });

    expect(result.current.mutate).toBeDefined();
    expect(result.current.isPending).toBe(false);
  });

  it('useUpdateTeam returns a mutation hook', async () => {
    const { useUpdateTeam } = await import('../use-teams');

    const { result } = renderHook(() => useUpdateTeam(), {
      wrapper: createWrapper(),
    });

    expect(result.current.mutate).toBeDefined();
  });

  it('useDeleteTeam returns a mutation hook', async () => {
    const { useDeleteTeam } = await import('../use-teams');

    const { result } = renderHook(() => useDeleteTeam(), {
      wrapper: createWrapper(),
    });

    expect(result.current.mutate).toBeDefined();
  });
});
