import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

const mockChainable = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
};

vi.mock('@/lib/supabase/client', () => ({
  supabase: { from: vi.fn(() => mockChainable) },
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

describe('useSeasonPhaseStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('is disabled when seasonId is undefined', async () => {
    const { useSeasonPhaseStatus } = await import('../use-season-phase-status');
    const { result } = renderHook(() => useSeasonPhaseStatus(undefined), {
      wrapper: createWrapper(),
    });
    expect(result.current.phaseStatusMap.size).toBe(0);
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('returns empty map when no matches', async () => {
    Object.defineProperty(mockChainable, 'then', {
      value: (resolve: (v: unknown) => void) => {
        resolve({ data: [], error: null });
        return Promise.resolve({ data: [], error: null });
      },
      configurable: true,
    });

    const { useSeasonPhaseStatus } = await import('../use-season-phase-status');
    const { result } = renderHook(() => useSeasonPhaseStatus('season-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.phaseStatusMap.size).toBe(0);
  });

  it('computes "completed" when all matches are completed', async () => {
    const matches = [
      { id: '1', stage: 'regular_season', status: 'completed' },
      { id: '2', stage: 'regular_season', status: 'completed' },
      { id: '3', stage: 'regular_season', status: 'completed' },
    ];

    Object.defineProperty(mockChainable, 'then', {
      value: (resolve: (v: unknown) => void) => {
        resolve({ data: matches, error: null });
        return Promise.resolve({ data: matches, error: null });
      },
      configurable: true,
    });

    const { useSeasonPhaseStatus } = await import('../use-season-phase-status');
    const { result } = renderHook(() => useSeasonPhaseStatus('season-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const phase = result.current.phaseStatusMap.get('regular_season');
    expect(phase).toBeDefined();
    expect(phase!.status).toBe('completed');
    expect(phase!.totalMatches).toBe(3);
    expect(phase!.completedMatches).toBe(3);
  });

  it('computes "in_progress" when some matches are completed', async () => {
    const matches = [
      { id: '1', stage: 'regular_season', status: 'completed' },
      { id: '2', stage: 'regular_season', status: 'scheduled' },
    ];

    Object.defineProperty(mockChainable, 'then', {
      value: (resolve: (v: unknown) => void) => {
        resolve({ data: matches, error: null });
        return Promise.resolve({ data: matches, error: null });
      },
      configurable: true,
    });

    const { useSeasonPhaseStatus } = await import('../use-season-phase-status');
    const { result } = renderHook(() => useSeasonPhaseStatus('season-2'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const phase = result.current.phaseStatusMap.get('regular_season');
    expect(phase!.status).toBe('in_progress');
  });

  it('computes "in_progress" when there is an ongoing match', async () => {
    const matches = [
      { id: '1', stage: 'regular_season', status: 'ongoing' },
      { id: '2', stage: 'regular_season', status: 'scheduled' },
    ];

    Object.defineProperty(mockChainable, 'then', {
      value: (resolve: (v: unknown) => void) => {
        resolve({ data: matches, error: null });
        return Promise.resolve({ data: matches, error: null });
      },
      configurable: true,
    });

    const { useSeasonPhaseStatus } = await import('../use-season-phase-status');
    const { result } = renderHook(() => useSeasonPhaseStatus('season-3'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const phase = result.current.phaseStatusMap.get('regular_season');
    expect(phase!.status).toBe('in_progress');
  });

  it('computes "scheduled" when all matches are scheduled', async () => {
    const matches = [
      { id: '1', stage: 'playoff', status: 'scheduled' },
      { id: '2', stage: 'playoff', status: 'scheduled' },
    ];

    Object.defineProperty(mockChainable, 'then', {
      value: (resolve: (v: unknown) => void) => {
        resolve({ data: matches, error: null });
        return Promise.resolve({ data: matches, error: null });
      },
      configurable: true,
    });

    const { useSeasonPhaseStatus } = await import('../use-season-phase-status');
    const { result } = renderHook(() => useSeasonPhaseStatus('season-4'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const phase = result.current.phaseStatusMap.get('playoff');
    expect(phase!.status).toBe('scheduled');
    expect(phase!.scheduledMatches).toBe(2);
  });

  it('groups matches by stage', async () => {
    const matches = [
      { id: '1', stage: 'regular_season', status: 'completed' },
      { id: '2', stage: 'playoff', status: 'scheduled' },
      { id: '3', stage: 'regular_season', status: 'completed' },
    ];

    Object.defineProperty(mockChainable, 'then', {
      value: (resolve: (v: unknown) => void) => {
        resolve({ data: matches, error: null });
        return Promise.resolve({ data: matches, error: null });
      },
      configurable: true,
    });

    const { useSeasonPhaseStatus } = await import('../use-season-phase-status');
    const { result } = renderHook(() => useSeasonPhaseStatus('season-5'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.phaseStatusMap.size).toBe(2);
    expect(result.current.phaseStatusMap.get('regular_season')!.totalMatches).toBe(2);
    expect(result.current.phaseStatusMap.get('playoff')!.totalMatches).toBe(1);
  });
});
