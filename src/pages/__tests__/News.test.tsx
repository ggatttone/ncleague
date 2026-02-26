import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import News from '../News';

const usePublishedArticlesMock = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const dict: Record<string, string> = {
        'pages.news.title': 'News',
        'pages.news.searchPlaceholder': 'Search news...',
        'pages.news.noNewsTitle': 'No news yet',
        'pages.news.noNewsSubtitle': 'Check back later for updates',
        'pages.news.noNewsForSearch': 'No news match your search',
        'pages.news.noNewsForSearchSubtitle': 'Try a different search term',
        'pages.news.composer.advancedEditor': 'Advanced Editor',
        'errors.loadingNews': 'Error loading news',
      };
      return dict[key] ?? key;
    },
  }),
}));

vi.mock('@/hooks/use-articles', () => ({
  usePublishedArticles: () => usePublishedArticlesMock(),
}));

vi.mock('@/lib/supabase/auth-context', () => ({
  useAuth: () => ({
    user: null,
    hasPermission: () => false,
  }),
}));

vi.mock('@/lib/supabase/client', () => ({
  supabase: {},
}));

// Mock ArticlePostCard to a simple render
vi.mock('@/components/ArticlePostCard', () => ({
  ArticlePostCard: ({ article }: { article: { id: string; title: string } }) => (
    <div data-testid={`article-${article.id}`}>{article.title}</div>
  ),
}));

// Mock NewsComposer
vi.mock('@/components/news/NewsComposer', () => ({
  NewsComposer: () => <div data-testid="news-composer">Composer</div>,
}));

const mockArticles = [
  {
    id: 'a1',
    title: 'Championship Final Results',
    content: 'The final match was intense',
    published: true,
    slug: 'championship-final',
    created_at: '2026-01-15T10:00:00Z',
  },
  {
    id: 'a2',
    title: 'New Season Announced',
    content: 'A brand new season starts soon',
    published: true,
    slug: 'new-season',
    created_at: '2026-01-10T10:00:00Z',
  },
  {
    id: 'a3',
    title: 'Player Transfer News',
    content: 'Major transfers happening this window',
    published: true,
    slug: 'player-transfer',
    created_at: '2026-01-05T10:00:00Z',
  },
];

describe('News page', () => {
  beforeEach(() => {
    usePublishedArticlesMock.mockReturnValue({
      data: mockArticles,
      isLoading: false,
      error: null,
    });
  });

  it('renders loading skeletons when loading', () => {
    usePublishedArticlesMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });
    render(<News />);
    expect(screen.getByText('News')).toBeInTheDocument();
  });

  it('renders article cards with data', () => {
    render(<News />);
    expect(screen.getByText('Championship Final Results')).toBeInTheDocument();
    expect(screen.getByText('New Season Announced')).toBeInTheDocument();
    expect(screen.getByText('Player Transfer News')).toBeInTheDocument();
  });

  it('filters articles by search term', async () => {
    const user = userEvent.setup();
    render(<News />);

    const input = screen.getByPlaceholderText('Search news...');
    await user.type(input, 'Championship');

    expect(screen.getByText('Championship Final Results')).toBeInTheDocument();
    expect(screen.queryByText('New Season Announced')).not.toBeInTheDocument();
    expect(screen.queryByText('Player Transfer News')).not.toBeInTheDocument();
  });

  it('shows empty state when no articles exist', () => {
    usePublishedArticlesMock.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });
    render(<News />);
    expect(screen.getByText('No news yet')).toBeInTheDocument();
    expect(screen.getByText('Check back later for updates')).toBeInTheDocument();
  });

  it('shows error state', () => {
    usePublishedArticlesMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { message: 'Failed to fetch' },
    });
    render(<News />);
    expect(screen.getByText('Error loading news')).toBeInTheDocument();
  });

  it('shows search-specific empty state when search has no results', async () => {
    const user = userEvent.setup();
    render(<News />);

    const input = screen.getByPlaceholderText('Search news...');
    await user.type(input, 'zzzznonexistent');

    expect(screen.getByText('No news match your search')).toBeInTheDocument();
    expect(screen.getByText('Try a different search term')).toBeInTheDocument();
  });
});
