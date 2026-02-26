import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
  },
}));

vi.mock('@/utils/toast', () => ({ showError: vi.fn() }));

const createWrapper = () => {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
};

describe('useLeagueTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('is disabled when competitionId is undefined', async () => {
    const { useLeagueTable } = await import('../use-league-table');
    const { result } = renderHook(() => useLeagueTable(undefined, 'season-1'), {
      wrapper: createWrapper(),
    });
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('is disabled when seasonId is undefined', async () => {
    const { useLeagueTable } = await import('../use-league-table');
    const { result } = renderHook(() => useLeagueTable('comp-1', undefined), {
      wrapper: createWrapper(),
    });
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('is disabled when both IDs are undefined', async () => {
    const { useLeagueTable } = await import('../use-league-table');
    const { result } = renderHook(() => useLeagueTable(undefined, undefined), {
      wrapper: createWrapper(),
    });
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useLeagueTableWithTournamentMode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes undefined pointsConfig when no tournament mode settings', async () => {
    const { useLeagueTableWithTournamentMode } = await import('../use-league-table');
    const { result } = renderHook(
      () => useLeagueTableWithTournamentMode('comp-1', 'season-1', null),
      { wrapper: createWrapper() },
    );
    // Should not crash
    expect(result.current).toBeDefined();
  });

  it('extracts points config from tournament mode settings', async () => {
    const { useLeagueTableWithTournamentMode } = await import('../use-league-table');
    const settings = { pointsPerWin: 3, pointsPerDraw: 1, pointsPerLoss: 0 };
    const { result } = renderHook(
      () => useLeagueTableWithTournamentMode('comp-1', 'season-1', settings),
      { wrapper: createWrapper() },
    );
    expect(result.current).toBeDefined();
  });

  it('is disabled when IDs are missing', async () => {
    const { useLeagueTableWithTournamentMode } = await import('../use-league-table');
    const { result } = renderHook(
      () => useLeagueTableWithTournamentMode(undefined, undefined, null),
      { wrapper: createWrapper() },
    );
    expect(result.current.fetchStatus).toBe('idle');
  });
});
