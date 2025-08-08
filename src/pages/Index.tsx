import { MadeWithDyad } from "@/components/made-with-dyad";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="text-center mt-16">
        <h1 className="text-5xl font-extrabold mb-4 text-primary">NC League</h1>
        <p className="text-xl text-gray-600 mb-8">
          La piattaforma per la tua lega di calcetto: risultati, classifiche, statistiche e news!
        </p>
        <div className="flex flex-wrap gap-4 justify-center mb-8">
          <Link
            to="/matches"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-md font-semibold hover:bg-primary/90 transition"
          >
            Prossime partite
          </Link>
          <Link
            to="/tables"
            className="px-6 py-3 bg-secondary text-secondary-foreground rounded-md font-semibold hover:bg-secondary/80 transition"
          >
            Classifica
          </Link>
          <Link
            to="/news"
            className="px-6 py-3 bg-muted text-foreground rounded-md font-semibold hover:bg-muted/80 transition"
          >
            News
          </Link>
        </div>
      </div>
      <div className="flex-1" />
      <MadeWithDyad />
    </div>
  );
};

export default Index;