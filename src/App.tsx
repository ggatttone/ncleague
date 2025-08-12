import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/supabase/auth-context";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { Navbar } from "@/components/Navbar";
import Login from "./pages/auth/Login";
import ProfilePage from "./pages/auth/Profile";
import Index from "./pages/Index";
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
import TeamsAdmin from "./pages/admin/TeamsAdmin";
import TeamFormAdmin from "./pages/admin/TeamFormAdmin";
import TeamDetailsAdmin from "./pages/admin/TeamDetailsAdmin";
import PlayersAdmin from "./pages/admin/PlayersAdmin";
import PlayerFormAdmin from "./pages/admin/PlayerFormAdmin";
import PlayerDetailsAdmin from "./pages/admin/PlayerDetailsAdmin";
import FixturesAdmin from "./pages/admin/FixturesAdmin";
import FixtureFormAdmin from "./pages/admin/FixtureFormAdmin";
import FixtureDetailsAdmin from "./pages/admin/FixtureDetailsAdmin";
import UsersAdmin from "./pages/admin/UsersAdmin";
import VenuesAdmin from "./pages/admin/VenuesAdmin";
import VenueFormAdmin from "./pages/admin/VenueFormAdmin";
import CompetitionsAdmin from "./pages/admin/CompetitionsAdmin";
import CompetitionFormAdmin from "./pages/admin/CompetitionFormAdmin";
import NotFoundAdmin from "./pages/admin/NotFoundAdmin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Navbar />
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
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
            
            {/* Protected routes */}
            <Route path="/profile" element={
              <RequireAuth>
                <ProfilePage />
              </RequireAuth>
            } />

            {/* Protected admin routes */}
            <Route path="/admin/*" element={
              <RequireAuth>
                <Routes>
                  <Route path="/" element={<AdminIndex />} />
                  <Route path="teams" element={<TeamsAdmin />} />
                  <Route path="teams/new" element={<TeamFormAdmin />} />
                  <Route path="teams/:id" element={<TeamDetailsAdmin />} />
                  <Route path="teams/:id/edit" element={<TeamFormAdmin />} />
                  <Route path="players" element={<PlayersAdmin />} />
                  <Route path="players/new" element={<PlayerFormAdmin />} />
                  <Route path="players/:id" element={<PlayerDetailsAdmin />} />
                  <Route path="players/:id/edit" element={<PlayerFormAdmin />} />
                  <Route path="fixtures" element={<FixturesAdmin />} />
                  <Route path="fixtures/new" element={<FixtureFormAdmin />} />
                  <Route path="fixtures/:id" element={<FixtureDetailsAdmin />} />
                  <Route path="fixtures/:id/edit" element={<FixtureFormAdmin />} />
                  <Route path="users" element={<UsersAdmin />} />
                  <Route path="venues" element={<VenuesAdmin />} />
                  <Route path="venues/new" element={<VenueFormAdmin />} />
                  <Route path="venues/:id/edit" element={<VenueFormAdmin />} />
                  <Route path="competitions" element={<CompetitionsAdmin />} />
                  <Route path="competitions/new" element={<CompetitionFormAdmin />} />
                  <Route path="competitions/:id/edit" element={<CompetitionFormAdmin />} />
                  <Route path="*" element={<NotFoundAdmin />} />
                </Routes>
              </RequireAuth>
            } />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;