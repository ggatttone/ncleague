import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const CONSENT_KEY = 'ncl-cookie-consent';

export const CookieConsent = () => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(CONSENT_KEY)) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    setVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem(CONSENT_KEY, 'rejected');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label={t('cookieConsent.ariaLabel')}
      className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6"
    >
      <div className="mx-auto max-w-3xl rounded-lg border border-border bg-background/95 backdrop-blur shadow-lg p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1 text-sm text-foreground">
          <p>
            {t('cookieConsent.message')}{' '}
            <Link to="/privacy" className="underline text-primary hover:text-primary/80">
              {t('cookieConsent.privacyLink')}
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={handleReject}>
            {t('cookieConsent.reject')}
          </Button>
          <Button size="sm" onClick={handleAccept}>
            {t('cookieConsent.accept')}
          </Button>
        </div>
      </div>
    </div>
  );
};
