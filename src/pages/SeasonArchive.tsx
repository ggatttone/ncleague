import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

const SeasonArchive = () => {
  const { yyyy, competition, division } = useParams();
  const { t } = useTranslation();
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">{t('pages.seasonArchive.title')}</h1>
      <p>
        {t('pages.seasonArchive.season')}: {yyyy}, {t('pages.seasonArchive.competition')}: {competition}, {t('pages.seasonArchive.division')}: {division}
      </p>
    </div>
  );
};

export default SeasonArchive;