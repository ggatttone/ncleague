import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import Players from '../Players';

const useSupabaseQueryMock = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const dict: Record<string, string> = {
        'pages.players.title': 'Players',
        'pages.players.searchPlaceholder': 'Search players...',
        'pages.players.noPlayersRegistered': 'No players registered',
        'pages.players.noPlayersRegisteredSubtitle': 'No players have been added yet',
        'pages.players.noPlayersFound': 'No players match your search',
        'pages.players.noPlayersFoundSubtitle': 'Try a different search term',
        'pages.players.newPlayer': 'New Player',
        'pages.players.manage': 'Manage',
        'pages.players.addFirstPlayer': 'Add First Player',
        'pages.players.yearsOld': 'years old',
        'errors.loadingPlayers': 'Error loading players',
      };
      if (key === 'pages.players.playersFound') {
        return `${options?.count ?? 0} players found`;
      }
      if (key === 'pages.players.searchSuffix') {
        return `for "${options?.term ?? ''}"`;
      }
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

const mockPlayers = [
  {
    id: 'p1',
    first_name: 'Marco',
    last_name: 'Rossi',
    jersey_number: 10,
    role: 'Forward',
    photo_url: null,
    date_of_birth: '1995-05-15',
    teams: { id: 't1', name: 'Red Devils', logo_url: null },
  },
  {
    id: 'p2',
    first_name: 'Luca',
    last_name: 'Bianchi',
    jersey_number: 5,
    role: 'Defender',
    photo_url: 'https://example.com/photo.jpg',
    date_of_birth: null,
    teams: { id: 't2', name: 'Blue Angels', logo_url: null },
  },
  {
    id: 'p3',
    first_name: 'Giovanni',
    last_name: 'Verdi',
    jersey_number: null,
    role: null,
    photo_url: null,
    date_of_birth: '2000-01-01',
    teams: null,
  },
];

describe('Players page', () => {
  beforeEach(() => {
    useSupabaseQueryMock.mockReturnValue({
      data: mockPlayers,
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
    render(<Players />);
    expect(screen.getByText('Players')).toBeInTheDocument();
  });

  it('renders player cards with data', () => {
    render(<Players />);
    expect(screen.getByText('Marco Rossi')).toBeInTheDocument();
    expect(screen.getByText('Luca Bianchi')).toBeInTheDocument();
    expect(screen.getByText('Giovanni Verdi')).toBeInTheDocument();
    expect(screen.getByText('Red Devils')).toBeInTheDocument();
    expect(screen.getByText('Forward')).toBeInTheDocument();
  });

  it('filters players by search term', async () => {
    const user = userEvent.setup();
    render(<Players />);

    const input = screen.getByPlaceholderText('Search players...');
    await user.type(input, 'Marco');

    expect(screen.getByText('Marco Rossi')).toBeInTheDocument();
    expect(screen.queryByText('Luca Bianchi')).not.toBeInTheDocument();
    expect(screen.queryByText('Giovanni Verdi')).not.toBeInTheDocument();
  });

  it('shows empty state when no players exist', () => {
    useSupabaseQueryMock.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });
    render(<Players />);
    expect(screen.getByText('No players registered')).toBeInTheDocument();
    expect(screen.getByText('No players have been added yet')).toBeInTheDocument();
  });

  it('shows error state', () => {
    useSupabaseQueryMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { message: 'Network error' },
    });
    render(<Players />);
    expect(screen.getByText('Error loading players')).toBeInTheDocument();
    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('shows search-specific empty state when search has no results', async () => {
    const user = userEvent.setup();
    render(<Players />);

    const input = screen.getByPlaceholderText('Search players...');
    await user.type(input, 'zzzznonexistent');

    expect(screen.getByText('No players match your search')).toBeInTheDocument();
    expect(screen.getByText('Try a different search term')).toBeInTheDocument();
  });
});
