import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { ShareButton } from '../ShareButton';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'share.button': 'Condividi',
        'share.ariaLabel': 'Share this page',
        'share.copiedToClipboard': 'Link copiato!',
      };
      return translations[key] || key;
    },
  }),
}));

vi.mock('@/lib/site-config', () => ({
  getSiteUrl: () => 'https://example.com',
}));

vi.mock('@/utils/toast', () => ({
  showSuccess: vi.fn(),
}));

const mockWriteText = vi.fn().mockResolvedValue(undefined);

describe('ShareButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWriteText.mockResolvedValue(undefined);

    // Mock clipboard using defineProperty
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      writable: true,
      configurable: true,
    });

    // Remove native share
    Object.defineProperty(navigator, 'share', {
      value: undefined,
      configurable: true,
    });
  });

  it('renders the share button with text', () => {
    render(<ShareButton path="/teams/1" title="Test Team" />);
    expect(screen.getByText('Condividi')).toBeInTheDocument();
  });

  it('has correct aria-label', () => {
    render(<ShareButton path="/teams/1" title="Test Team" />);
    expect(screen.getByRole('button', { name: 'Share this page' })).toBeInTheDocument();
  });

  it('clicking the button does not throw', async () => {
    const user = userEvent.setup();
    render(<ShareButton path="/teams/1" title="Test Team" />);

    // Should not throw when clicking share button
    await expect(user.click(screen.getByRole('button'))).resolves.not.toThrow();
  });

  it('renders icon-only variant without text', () => {
    render(<ShareButton path="/teams/1" title="Test" size="icon" />);
    expect(screen.queryByText('Condividi')).not.toBeInTheDocument();
  });
});
