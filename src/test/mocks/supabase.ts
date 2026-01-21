import { vi } from 'vitest';

// Mock Supabase query builder chain
const createQueryBuilder = () => ({
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  upsert: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  neq: vi.fn().mockReturnThis(),
  gt: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  lt: vi.fn().mockReturnThis(),
  lte: vi.fn().mockReturnThis(),
  like: vi.fn().mockReturnThis(),
  ilike: vi.fn().mockReturnThis(),
  is: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  contains: vi.fn().mockReturnThis(),
  containedBy: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: null, error: null }),
  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  then: vi.fn().mockResolvedValue({ data: [], error: null }),
});

export const mockSupabaseClient = {
  from: vi.fn(() => createQueryBuilder()),
  auth: {
    getSession: vi.fn().mockResolvedValue({
      data: { session: null },
      error: null,
    }),
    getUser: vi.fn().mockResolvedValue({
      data: { user: null },
      error: null,
    }),
    onAuthStateChange: vi.fn(() => ({
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    })),
    signInWithPassword: vi.fn().mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    signUp: vi.fn().mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    }),
  },
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn().mockResolvedValue({ data: null, error: null }),
      download: vi.fn().mockResolvedValue({ data: null, error: null }),
      getPublicUrl: vi.fn(() => ({
        data: { publicUrl: 'https://example.com/image.jpg' },
      })),
      remove: vi.fn().mockResolvedValue({ data: null, error: null }),
      list: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
  rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
};

// Helper to reset all mocks
export const resetSupabaseMocks = () => {
  vi.clearAllMocks();
};

// Helper to mock a successful query response
export const mockQueryResponse = <T>(data: T) => {
  const builder = createQueryBuilder();
  builder.then = vi.fn().mockResolvedValue({ data, error: null });
  builder.single = vi.fn().mockResolvedValue({ data, error: null });
  builder.maybeSingle = vi.fn().mockResolvedValue({ data, error: null });
  mockSupabaseClient.from.mockReturnValue(builder);
  return builder;
};

// Helper to mock a query error
export const mockQueryError = (message: string, code?: string) => {
  const builder = createQueryBuilder();
  const error = { message, code: code || 'PGRST000' };
  builder.then = vi.fn().mockResolvedValue({ data: null, error });
  builder.single = vi.fn().mockResolvedValue({ data: null, error });
  builder.maybeSingle = vi.fn().mockResolvedValue({ data: null, error });
  mockSupabaseClient.from.mockReturnValue(builder);
  return builder;
};
