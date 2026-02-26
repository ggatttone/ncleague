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

describe('use-articles hooks', () => {
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

  it('useArticles calls supabase from articles', async () => {
    const { supabase } = await import('@/lib/supabase/client');
    const { useArticles } = await import('../use-articles');

    renderHook(() => useArticles(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('articles');
    });
  });

  it('usePublishedArticles filters by published status', async () => {
    const { usePublishedArticles } = await import('../use-articles');

    renderHook(() => usePublishedArticles(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(mockChainable.eq).toHaveBeenCalledWith('status', 'published');
    });
  });

  it('usePinnedArticles filters by pinned and published', async () => {
    const { usePinnedArticles } = await import('../use-articles');

    renderHook(() => usePinnedArticles(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(mockChainable.eq).toHaveBeenCalledWith('status', 'published');
      expect(mockChainable.eq).toHaveBeenCalledWith('is_pinned', true);
    });
  });

  it('useArticle is disabled when id is undefined', async () => {
    const { useArticle } = await import('../use-articles');

    const { result } = renderHook(() => useArticle(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
  });

  it('usePublishedArticleBySlug is disabled when slug is undefined', async () => {
    const { usePublishedArticleBySlug } = await import('../use-articles');

    const { result } = renderHook(() => usePublishedArticleBySlug(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
  });

  it('useCreateArticle returns a mutation hook', async () => {
    const { useCreateArticle } = await import('../use-articles');

    const { result } = renderHook(() => useCreateArticle(), {
      wrapper: createWrapper(),
    });

    expect(result.current.mutate).toBeDefined();
  });

  it('useDeleteArticle returns a mutation hook', async () => {
    const { useDeleteArticle } = await import('../use-articles');

    const { result } = renderHook(() => useDeleteArticle(), {
      wrapper: createWrapper(),
    });

    expect(result.current.mutate).toBeDefined();
  });

  it('useTogglePinArticle returns a mutation hook', async () => {
    const { useTogglePinArticle } = await import('../use-articles');

    const { result } = renderHook(() => useTogglePinArticle(), {
      wrapper: createWrapper(),
    });

    expect(result.current.mutate).toBeDefined();
  });
});
