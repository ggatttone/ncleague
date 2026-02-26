import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

// Mock supabase client
const mockSelect = vi.fn();
const mockFrom = vi.fn(() => ({
  select: mockSelect,
}));

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
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

describe('useMatches', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default chain mock
    const chainable = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      then: vi.fn().mockImplementation((resolve) => resolve({ data: [], error: null })),
    };
    // Make the chain thenable
    Object.defineProperty(chainable, 'then', {
      value: (resolve: (value: { data: unknown[]; error: null }) => void) => {
        resolve({ data: [], error: null });
        return Promise.resolve({ data: [], error: null });
      },
    });

    mockFrom.mockReturnValue(chainable);
    mockSelect.mockReturnValue(chainable);
  });

  it('useMatches calls supabase with correct table and relations', async () => {
    const { useMatches } = await import('../use-matches');

    renderHook(() => useMatches(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('matches');
    });
  });

  it('useMatch is disabled when id is undefined', async () => {
    const { useMatch } = await import('../use-matches');

    const { result } = renderHook(() => useMatch(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
  });

  it('useTeamMatches is disabled when teamId is undefined', async () => {
    const { useTeamMatches } = await import('../use-matches');

    const { result } = renderHook(() => useTeamMatches(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
  });

  it('useSeasonMatches is disabled when seasonId is undefined', async () => {
    const { useSeasonMatches } = await import('../use-matches');

    const { result } = renderHook(() => useSeasonMatches(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
  });

  it('useCreateMatch returns a mutation hook', async () => {
    const { useCreateMatch } = await import('../use-matches');

    const { result } = renderHook(() => useCreateMatch(), {
      wrapper: createWrapper(),
    });

    expect(result.current.mutate).toBeDefined();
    expect(result.current.isPending).toBe(false);
  });

  it('useDeleteMatch returns a mutation hook', async () => {
    const { useDeleteMatch } = await import('../use-matches');

    const { result } = renderHook(() => useDeleteMatch(), {
      wrapper: createWrapper(),
    });

    expect(result.current.mutate).toBeDefined();
  });

  it('useUpdateMultipleMatches returns a mutation hook', async () => {
    const { useUpdateMultipleMatches } = await import('../use-matches');

    const { result } = renderHook(() => useUpdateMultipleMatches(), {
      wrapper: createWrapper(),
    });

    expect(result.current.mutate).toBeDefined();
  });

  it('useDeleteMultipleMatches returns a mutation hook', async () => {
    const { useDeleteMultipleMatches } = await import('../use-matches');

    const { result } = renderHook(() => useDeleteMultipleMatches(), {
      wrapper: createWrapper(),
    });

    expect(result.current.mutate).toBeDefined();
  });
});
