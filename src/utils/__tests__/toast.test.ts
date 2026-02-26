import { describe, it, expect, vi, beforeEach } from 'vitest';
import { showSuccess, showError, showLoading, dismissToast } from '../toast';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn().mockReturnValue('toast-id-123'),
    dismiss: vi.fn(),
  },
}));

describe('toast utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('showSuccess calls toast.success', async () => {
    const { toast } = await import('sonner');
    showSuccess('Operation successful');
    expect(toast.success).toHaveBeenCalledWith('Operation successful');
  });

  it('showError calls toast.error', async () => {
    const { toast } = await import('sonner');
    showError('Something went wrong');
    expect(toast.error).toHaveBeenCalledWith('Something went wrong');
  });

  it('showLoading calls toast.loading and returns id', async () => {
    const { toast } = await import('sonner');
    const id = showLoading('Loading...');
    expect(toast.loading).toHaveBeenCalledWith('Loading...');
    expect(id).toBe('toast-id-123');
  });

  it('dismissToast calls toast.dismiss with id', async () => {
    const { toast } = await import('sonner');
    dismissToast('toast-id-123');
    expect(toast.dismiss).toHaveBeenCalledWith('toast-id-123');
  });

  it('dismissToast accepts numeric id', async () => {
    const { toast } = await import('sonner');
    dismissToast(42);
    expect(toast.dismiss).toHaveBeenCalledWith(42);
  });
});
