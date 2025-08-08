import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Matches from "./pages/Matches";
import MatchDetails from "./pages/MatchDetails";
import Tables from "./pages/Tables";
import Statistics from "./pages/Statistics";
import News from "./pages/News";
import NewsDetails from "./pages/NewsDetails";
import Players from "./pages/Players";
import PlayerDetails from "./pages/PlayerDetails";
import Teams from "./pages/Teams";
import TeamDetails from "./pages/TeamDetails";
import SeasonArchive from "./pages/SeasonArchive";
import AdminIndex from "./pages/admin/AdminIndex";
import NotFoundAdmin from "./pages/admin/NotFoundAdmin";
import TeamsAdmin from "./pages/admin/TeamsAdmin";
import PlayersAdmin from "./pages/admin/PlayersAdmin";
import TeamDetailsAdmin from "./pages/admin/TeamDetailsAdmin";
import PlayerDetailsAdmin from "./pages/admin/PlayerDetailsAdmin";
import TeamFormAdmin from "./pages/admin/TeamFormAdmin";
import PlayerFormAdmin from "./pages/admin/PlayerFormAdmin";
import FixturesAdmin from "./pages/admin/FixturesAdmin";
import FixtureFormAdmin from "./pages/admin/FixtureFormAdmin";
import FixtureDetailsAdmin from "./pages/admin/FixtureDetailsAdmin";
import { Navbar } from "@/components/Navbar";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/matches/:id" element={<MatchDetails />} />
          <Route path="/tables" element={<Tables />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/news" element={<News />} />
          <Route path="/news/:slug" element={<NewsDetails />} />
          <Route path="/players" element={<Players />} />
          <Route path="/players/:id" element={<PlayerDetails />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/teams/:id" element={<TeamDetails />} />
          <Route path="/season/:yyyy/:competition/:division" element={<SeasonArchive />} />
          {/* Admin area */}
          <Route path="/admin" element={<AdminIndex />} />
          <Route path="/admin/teams" element={<TeamsAdmin />} />
          <Route path="/admin/teams/new" element={<TeamFormAdmin />} />
          <Route path="/admin/teams/:id" element={<TeamDetailsAdmin />} />
          <Route path="/admin/teams/:id/edit" element={<TeamFormAdmin />} />
          <Route path="/admin/players" element={<PlayersAdmin />} />
          <Route path="/admin/players/new" element={<PlayerFormAdmin />} />
          <Route path="/admin/players/:id" element={<PlayerDetailsAdmin />} />
          <Route path="/admin/players/:id/edit" element={<PlayerFormAdmin />} />
          <Route path="/admin/fixtures" element={<FixturesAdmin />} />
          <Route path="/admin/fixtures/new" element={<FixtureFormAdmin />} />
          <Route path="/admin/fixtures/:id" element={<FixtureDetailsAdmin />} />
          <Route path="/admin/fixtures/:id/edit" element={<FixtureFormAdmin />} />
          <Route path="/admin/*" element={<NotFoundAdmin />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;