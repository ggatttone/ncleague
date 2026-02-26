import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { EmptyState } from '../EmptyState';
import { Users, Plus } from 'lucide-react';

describe('EmptyState', () => {
  it('renders with icon and title', () => {
    render(<EmptyState icon={Users} title="No users found" />);
    expect(screen.getByText('No users found')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(<EmptyState icon={Users} title="No users" subtitle="Try adding some users first" />);
    expect(screen.getByText('Try adding some users first')).toBeInTheDocument();
  });

  it('does not render subtitle when not provided', () => {
    render(<EmptyState icon={Users} title="No users" />);
    expect(screen.queryByText('Try adding')).not.toBeInTheDocument();
  });

  it('renders action button with link', () => {
    render(
      <EmptyState
        icon={Users}
        title="No users"
        action={{ label: 'Add User', to: '/admin/users/new', icon: Plus }}
      />,
    );
    const button = screen.getByRole('button', { name: /add user/i });
    expect(button).toBeInTheDocument();
    const link = button.closest('a');
    expect(link).toHaveAttribute('href', '/admin/users/new');
  });

  it('does not render action button when not provided', () => {
    render(<EmptyState icon={Users} title="No users" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
