import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const HeroSection = () => {
  return (
    <div className="w-full bg-primary text-primary-foreground py-20 px-4 rounded-lg shadow-lg mb-12">
      <div className="container mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
          Benvenuti su NC League
        </h1>
        <p className="text-lg md:text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
          La piattaforma per la tua lega di calcetto: risultati, classifiche, statistiche e news!
        </p>
        <Link to="/matches">
          <Button size="lg" variant="secondary">
            Scopri l'ultima giornata
          </Button>
        </Link>
      </div>
    </div>
  );
};