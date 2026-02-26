import { MainLayout } from '@/components/MainLayout';
import { useTranslation } from 'react-i18next';
import { SEOHead } from '@/components/SEOHead';

const SECTIONS = [
  'intro',
  'dataCollected',
  'cookies',
  'thirdParty',
  'rights',
  'contact',
] as const;

const Privacy = () => {
  const { t } = useTranslation();

  return (
    <MainLayout>
      <SEOHead
        title={t('pages.privacy.title')}
        description={t('pages.privacy.description')}
        url="/privacy"
      />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold mb-8">{t('pages.privacy.title')}</h1>

        <div className="prose dark:prose-invert max-w-none space-y-6">
          {SECTIONS.map((section) => (
            <section key={section}>
              <h2 className="text-xl font-semibold">
                {t(`pages.privacy.sections.${section}.title`)}
              </h2>
              <p className="text-muted-foreground mt-2">
                {t(`pages.privacy.sections.${section}.content`)}
              </p>
            </section>
          ))}

          <p className="text-sm text-muted-foreground mt-8">
            {t('pages.privacy.lastUpdated', { date: '2026-02-26' })}
          </p>
        </div>
      </div>
    </MainLayout>
  );
};

export default Privacy;
