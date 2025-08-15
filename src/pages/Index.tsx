import { HeroSection } from "@/components/HeroSection";
import { LatestNews } from "@/components/LatestNews";
import { LeagueTableWidget } from "@/components/LeagueTableWidget";
import { UpcomingMatches } from "@/components/UpcomingMatches";
import { MadeWithDyad } from "@/components/made-with-dyad";

const Index = () => {
  return (
    <div className="bg-gray-50 dark:bg-background min-h-screen">
      <main className="container mx-auto py-8 px-4">
        <HeroSection />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-8">
            <UpcomingMatches />
            <LatestNews />
          </div>

          {/* Sidebar column */}
          <div className="lg:col-span-1">
            <LeagueTableWidget />
          </div>
        </div>
      </main>
      <MadeWithDyad />
    </div>
  );
};

export default Index;