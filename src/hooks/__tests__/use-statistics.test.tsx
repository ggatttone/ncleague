import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
  },
}));

const createWrapper = () => {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
};

describe('useTopScorers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('is disabled when competitionId is empty', async () => {
    const { useTopScorers } = await import('../use-statistics');
    const { result } = renderHook(() => useTopScorers('', 'season-1'), {
      wrapper: createWrapper(),
    });
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('is disabled when seasonId is empty', async () => {
    const { useTopScorers } = await import('../use-statistics');
    const { result } = renderHook(() => useTopScorers('comp-1', ''), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('is disabled when both IDs are empty', async () => {
    const { useTopScorers } = await import('../use-statistics');
    const { result } = renderHook(() => useTopScorers('', ''), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('returns a query result when IDs are provided', async () => {
    const { useTopScorers } = await import('../use-statistics');
    const { result } = renderHook(() => useTopScorers('comp-1', 'season-1'), {
      wrapper: createWrapper(),
    });
    expect(result.current).toBeDefined();
    expect(result.current.data).toBeUndefined(); // pending initially
  });
});
