import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  title?: string;
  subtitle?: string;
  buttonText?: string;
  buttonLink?: string;
}

export const HeroSection = ({
  title = "Benvenuti su NC League",
  subtitle = "La piattaforma per la tua lega di calcetto: risultati, classifiche, statistiche e news!",
  buttonText = "Scopri l'ultima giornata",
  buttonLink = "/matches",
}: HeroSectionProps) => {
  return (
    <div className="w-full bg-primary text-primary-foreground py-20 px-4 rounded-lg shadow-lg">
      <div className="container mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
          {title}
        </h1>
        <p className="text-lg md:text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
          {subtitle}
        </p>
        <Link to={buttonLink}>
          <Button size="lg" variant="secondary">
            {buttonText}
          </Button>
        </Link>
      </div>
    </div>
  );
};