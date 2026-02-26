import { Share2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { useState, useCallback } from 'react';
import { getSiteUrl } from '@/lib/site-config';
import { showSuccess } from '@/utils/toast';

interface ShareButtonProps {
  path: string;
  title: string;
  description?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'icon';
}

export const ShareButton = ({
  path,
  title,
  description,
  variant = 'outline',
  size = 'sm',
}: ShareButtonProps) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const url = `${getSiteUrl()}${path}`;

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: description, url });
        return;
      } catch (err) {
        if ((err as DOMException).name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      showSuccess(t('share.copiedToClipboard'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (e.g. non-HTTPS)
    }
  }, [url, title, description, t]);

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleShare}
      aria-label={t('share.ariaLabel')}
    >
      {copied ? (
        <Check className="h-4 w-4" />
      ) : (
        <Share2 className="h-4 w-4" />
      )}
      {size !== 'icon' && (
        <span className="ml-1">{t('share.button')}</span>
      )}
    </Button>
  );
};
