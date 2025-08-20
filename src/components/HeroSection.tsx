import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface HeroSectionProps {
  title?: string;
  subtitle?: string;
  buttonText?: string;
  buttonLink?: string;
}

export const HeroSection = ({
  title,
  subtitle,
  buttonText,
  buttonLink = "/matches",
}: HeroSectionProps) => {
  const { t } = useTranslation();

  return (
    <div className="w-full bg-primary text-primary-foreground py-20 px-4 rounded-lg shadow-lg">
      <div className="container mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
          {title || t('components.hero.title')}
        </h1>
        <p className="text-lg md:text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
          {subtitle || t('components.hero.subtitle')}
        </p>
        <Link to={buttonLink}>
          <Button size="lg" variant="secondary">
            {buttonText || t('components.hero.button')}
          </Button>
        </Link>
      </div>
    </div>
  );
};