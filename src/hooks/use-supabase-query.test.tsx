import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useSupabaseQuery, useSupabaseMutation } from './use-supabase-query';

// Mock the toast utility
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

describe('useSupabaseQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns data on successful query', async () => {
    const mockData = [{ id: '1', name: 'Test' }];
    const mockQuery = vi.fn().mockResolvedValue({ data: mockData, error: null });

    const { result } = renderHook(
      () => useSupabaseQuery(['test'], mockQuery),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
  });

  it('returns null when query function returns null', async () => {
    const mockQuery = vi.fn().mockReturnValue(null);

    const { result } = renderHook(
      () => useSupabaseQuery(['test-null'], mockQuery),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it('throws error and shows toast on query error', async () => {
    const { showError } = await import('@/utils/toast');
    const mockError = { message: 'Database error', code: 'PGRST000' };
    const mockQuery = vi.fn().mockResolvedValue({ data: null, error: mockError });

    const { result } = renderHook(
      () => useSupabaseQuery(['test-error'], mockQuery),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(showError).toHaveBeenCalledWith('Database error');
  });

  it('respects enabled option', async () => {
    const mockQuery = vi.fn().mockResolvedValue({ data: [], error: null });

    const { result } = renderHook(
      () => useSupabaseQuery(['test-disabled'], mockQuery, { enabled: false }),
      { wrapper: createWrapper() }
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockQuery).not.toHaveBeenCalled();
  });
});

describe('useSupabaseMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns data on successful mutation', async () => {
    const mockData = { id: '1', name: 'Created' };
    const mockMutation = vi.fn().mockResolvedValue({ data: mockData, error: null });

    const { result } = renderHook(
      () => useSupabaseMutation(['items'], mockMutation),
      { wrapper: createWrapper() }
    );

    result.current.mutate({ name: 'Test' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
  });

  it('throws error and shows toast on mutation error', async () => {
    const { showError } = await import('@/utils/toast');
    const mockError = { message: 'Insert failed', code: 'PGRST000' };
    const mockMutation = vi.fn().mockResolvedValue({ data: null, error: mockError });

    const { result } = renderHook(
      () => useSupabaseMutation(['items'], mockMutation),
      { wrapper: createWrapper() }
    );

    result.current.mutate({ name: 'Test' });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(showError).toHaveBeenCalledWith('Insert failed');
  });

  it('calls custom onSuccess callback', async () => {
    const mockData = { id: '1', name: 'Created' };
    const mockMutation = vi.fn().mockResolvedValue({ data: mockData, error: null });
    const customOnSuccess = vi.fn();

    const { result } = renderHook(
      () => useSupabaseMutation(['items'], mockMutation, { onSuccess: customOnSuccess }),
      { wrapper: createWrapper() }
    );

    result.current.mutate({ name: 'Test' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(customOnSuccess).toHaveBeenCalledWith(mockData, { name: 'Test' }, undefined);
  });
});
