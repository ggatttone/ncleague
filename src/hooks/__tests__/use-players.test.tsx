import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
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
  supabase: { from: vi.fn(() => mockChainable) },
}));

vi.mock('@/utils/toast', () => ({ showError: vi.fn() }));

const createWrapper = () => {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
};

describe('use-players hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(mockChainable, 'then', {
      value: (resolve: (v: unknown) => void) => {
        resolve({ data: [], error: null });
        return Promise.resolve({ data: [], error: null });
      },
      configurable: true,
    });
  });

  it('usePlayer is disabled when id is undefined', async () => {
    const { usePlayer } = await import('../use-players');
    const { result } = renderHook(() => usePlayer(undefined), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('useCreatePlayer returns a mutation hook', async () => {
    const { useCreatePlayer } = await import('../use-players');
    const { result } = renderHook(() => useCreatePlayer(), { wrapper: createWrapper() });
    expect(result.current.mutate).toBeDefined();
    expect(result.current.isPending).toBe(false);
  });

  it('useUpdatePlayer returns a mutation hook', async () => {
    const { useUpdatePlayer } = await import('../use-players');
    const { result } = renderHook(() => useUpdatePlayer(), { wrapper: createWrapper() });
    expect(result.current.mutate).toBeDefined();
  });

  it('useDeletePlayer returns a mutation hook', async () => {
    const { useDeletePlayer } = await import('../use-players');
    const { result } = renderHook(() => useDeletePlayer(), { wrapper: createWrapper() });
    expect(result.current.mutate).toBeDefined();
  });

  it('useCreateMultiplePlayers returns a mutation hook', async () => {
    const { useCreateMultiplePlayers } = await import('../use-players');
    const { result } = renderHook(() => useCreateMultiplePlayers(), { wrapper: createWrapper() });
    expect(result.current.mutate).toBeDefined();
  });
});
