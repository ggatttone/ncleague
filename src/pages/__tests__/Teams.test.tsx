import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import Teams from '../Teams';

const useSupabaseQueryMock = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const dict: Record<string, string> = {
        'pages.teams.title': 'Teams',
        'pages.teams.searchPlaceholder': 'Search teams...',
        'pages.teams.noTeamsFound': 'No teams found',
        'pages.teams.noTeamsFoundSubtitle': 'No teams have been registered yet',
        'pages.teams.noTeamsForSearch': 'No teams match your search',
        'pages.teams.noTeamsForSearchSubtitle': 'Try a different search term',
        'pages.teams.newTeam': 'New Team',
        'pages.teams.manage': 'Manage',
        'pages.teams.addFirstTeam': 'Add First Team',
        'errors.loadingTeams': 'Error loading teams',
      };
      return dict[key] ?? key;
    },
  }),
}));

vi.mock('@/hooks/use-supabase-query', () => ({
  useSupabaseQuery: (...args: unknown[]) => useSupabaseQueryMock(...args),
}));

vi.mock('@/lib/supabase/auth-context', () => ({
  useAuth: () => ({ user: null }),
}));

vi.mock('@/lib/supabase/client', () => ({
  supabase: {},
}));

const mockTeams = [
  {
    id: 't1',
    name: 'Red Devils',
    parish: 'Downtown',
    logo_url: null,
    colors: 'Red',
    venues: { name: 'Stadium A' },
  },
  {
    id: 't2',
    name: 'Blue Angels',
    parish: 'Uptown',
    logo_url: 'https://example.com/logo.png',
    colors: 'Blue',
    venues: { name: 'Stadium B' },
  },
  {
    id: 't3',
    name: 'Green Hawks',
    parish: null,
    logo_url: null,
    colors: null,
    venues: null,
  },
];

describe('Teams page', () => {
  beforeEach(() => {
    useSupabaseQueryMock.mockReturnValue({
      data: mockTeams,
      isLoading: false,
      error: null,
    });
  });

  it('renders loading skeletons when loading', () => {
    useSupabaseQueryMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });
    render(<Teams />);
    expect(screen.getByText('Teams')).toBeInTheDocument();
  });

  it('renders team cards with data', () => {
    render(<Teams />);
    expect(screen.getByText('Red Devils')).toBeInTheDocument();
    expect(screen.getByText('Blue Angels')).toBeInTheDocument();
    expect(screen.getByText('Green Hawks')).toBeInTheDocument();
    expect(screen.getByText('Downtown')).toBeInTheDocument();
    expect(screen.getByText('Stadium A')).toBeInTheDocument();
  });

  it('filters teams by search term', async () => {
    const user = userEvent.setup();
    render(<Teams />);

    const input = screen.getByPlaceholderText('Search teams...');
    await user.type(input, 'Red');

    expect(screen.getByText('Red Devils')).toBeInTheDocument();
    expect(screen.queryByText('Blue Angels')).not.toBeInTheDocument();
    expect(screen.queryByText('Green Hawks')).not.toBeInTheDocument();
  });

  it('shows empty state when no teams exist', () => {
    useSupabaseQueryMock.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });
    render(<Teams />);
    expect(screen.getByText('No teams found')).toBeInTheDocument();
    expect(screen.getByText('No teams have been registered yet')).toBeInTheDocument();
  });

  it('shows error state', () => {
    useSupabaseQueryMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { message: 'Network error' },
    });
    render(<Teams />);
    expect(screen.getByText('Error loading teams')).toBeInTheDocument();
    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('shows search-specific empty state when search has no results', async () => {
    const user = userEvent.setup();
    render(<Teams />);

    const input = screen.getByPlaceholderText('Search teams...');
    await user.type(input, 'zzzznonexistent');

    expect(screen.getByText('No teams match your search')).toBeInTheDocument();
    expect(screen.getByText('Try a different search term')).toBeInTheDocument();
  });
});
