import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DynamicFavicon } from './DynamicFavicon';

const useThemeContextMock = vi.fn();

vi.mock('./ThemeProvider', () => ({
  useThemeContext: () => useThemeContextMock(),
}));

describe('DynamicFavicon', () => {
  let currentTheme: { logo_url: string | null } | null;

  beforeEach(() => {
    currentTheme = { logo_url: null };
    useThemeContextMock.mockReset();
    useThemeContextMock.mockImplementation(() => ({
      theme: currentTheme,
      isLoading: false,
    }));
    document.head.innerHTML = '';
  });

  const createFaviconLink = () => {
    const link = document.createElement('link');
    link.id = 'dynamic-favicon';
    link.rel = 'icon';
    link.href = '/favicon.svg';
    link.type = 'image/svg+xml';
    document.head.appendChild(link);
    return link;
  };

  it('applies the themed PNG logo and mime type', () => {
    const favicon = createFaviconLink();
    currentTheme = { logo_url: 'https://cdn.example.com/logo.png' };

    render(<DynamicFavicon />);

    expect(favicon.getAttribute('href')).toBe('https://cdn.example.com/logo.png');
    expect(favicon.getAttribute('type')).toBe('image/png');
  });

  it('restores the league favicon when theme logo becomes null', () => {
    const favicon = createFaviconLink();
    currentTheme = { logo_url: 'https://cdn.example.com/logo.png' };

    const { rerender } = render(<DynamicFavicon />);

    expect(favicon.getAttribute('href')).toBe('https://cdn.example.com/logo.png');
    expect(favicon.getAttribute('type')).toBe('image/png');

    currentTheme = { logo_url: null };
    rerender(<DynamicFavicon />);

    expect(favicon.getAttribute('href')).toBe('/favicon.svg');
    expect(favicon.getAttribute('type')).toBe('image/svg+xml');
  });

  it('removes type when extension is unknown', () => {
    const favicon = createFaviconLink();
    currentTheme = { logo_url: 'https://cdn.example.com/logo.customformat' };

    render(<DynamicFavicon />);

    expect(favicon.getAttribute('href')).toBe('https://cdn.example.com/logo.customformat');
    expect(favicon.hasAttribute('type')).toBe(false);
  });

  it('does not crash when #dynamic-favicon link is missing', () => {
    currentTheme = { logo_url: 'https://cdn.example.com/logo.png' };

    expect(() => render(<DynamicFavicon />)).not.toThrow();
  });
});
