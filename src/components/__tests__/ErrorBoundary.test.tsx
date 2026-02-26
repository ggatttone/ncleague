import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary, withErrorBoundary } from '../ErrorBoundary';

// Suppress console.error for expected errors
const originalConsoleError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
});

const ThrowingComponent = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>No error</div>;
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <div>Hello World</div>
      </ErrorBoundary>,
      { wrapper },
    );
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('renders error UI when child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>,
      { wrapper },
    );
    expect(screen.getByText('Qualcosa è andato storto')).toBeInTheDocument();
  });

  it('shows error details in collapsible', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>,
      { wrapper },
    );
    expect(screen.getByText('Dettagli errore')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('shows retry and reload buttons', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>,
      { wrapper },
    );
    expect(screen.getByText('Riprova')).toBeInTheDocument();
    expect(screen.getByText('Ricarica pagina')).toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom Fallback</div>}>
        <ThrowingComponent />
      </ErrorBoundary>,
      { wrapper },
    );
    expect(screen.getByText('Custom Fallback')).toBeInTheDocument();
    expect(screen.queryByText('Qualcosa è andato storto')).not.toBeInTheDocument();
  });
});

describe('withErrorBoundary', () => {
  it('wraps a component with an ErrorBoundary', () => {
    const WrappedComponent = withErrorBoundary(ThrowingComponent);
    render(<WrappedComponent shouldThrow />, { wrapper });
    expect(screen.getByText('Qualcosa è andato storto')).toBeInTheDocument();
  });

  it('renders wrapped component normally when no error', () => {
    const SafeComponent = () => <div>Safe content</div>;
    const WrappedComponent = withErrorBoundary(SafeComponent);
    render(<WrappedComponent />, { wrapper });
    expect(screen.getByText('Safe content')).toBeInTheDocument();
  });
});
