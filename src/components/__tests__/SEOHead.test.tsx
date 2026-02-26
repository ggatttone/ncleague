import { describe, it } from 'vitest';
import { render } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { SEOHead } from '../SEOHead';

const renderWithHelmet = (ui: React.ReactElement) => {
  return render(<HelmetProvider>{ui}</HelmetProvider>);
};

describe('SEOHead', () => {
  it('renders without crashing', () => {
    renderWithHelmet(<SEOHead title="Test Page" />);
    // Helmet updates the document head asynchronously
    // Just verify it doesn't throw
  });

  it('accepts all optional props', () => {
    renderWithHelmet(
      <SEOHead
        title="Team Details"
        description="A great team"
        image="https://example.com/image.jpg"
        url="/teams/1"
        type="article"
        jsonLd={{ '@type': 'SportsTeam', name: 'Test' }}
        noHreflang
      />,
    );
    // Should not throw with all props
  });

  it('works with minimal props', () => {
    renderWithHelmet(<SEOHead title="Home" />);
    // Should render with defaults
  });

  it('works with relative image URL', () => {
    renderWithHelmet(<SEOHead title="Test" image="/images/test.png" url="/test" />);
    // Should not throw when converting relative to absolute
  });
});
