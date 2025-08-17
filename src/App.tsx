import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/supabase/auth-context";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ModeProvider } from "@/components/theme/ModeProvider";
import { DynamicFavicon } from "@/components/theme/DynamicFavicon";
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
import GalleryPage from "./pages/Gallery";
import AlbumDetails from "./pages/AlbumDetails";
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
import FixtureBulkFormAdmin from "./pages/admin/FixtureBulkFormAdmin";
import FixtureImportAdmin from "./pages/admin/FixtureImportAdmin";
import UsersAdmin from "./pages/admin/UsersAdmin";
import VenuesAdmin from "./pages/admin/VenuesAdmin";
import VenueFormAdmin from "./pages/admin/VenueFormAdmin";
import CompetitionsAdmin from "./pages/admin/CompetitionsAdmin";
import CompetitionFormAdmin from "./pages/admin/CompetitionFormAdmin";
import SeasonsAdmin from "./pages/admin/SeasonsAdmin";
import SeasonFormAdmin from "./pages/admin/SeasonFormAdmin";
import ArticlesAdmin from "./pages/admin/ArticlesAdmin";
import ArticleFormAdmin from "./pages/admin/ArticleFormAdmin";
import AlbumsAdmin from "./pages/admin/AlbumsAdmin";
import AlbumFormAdmin from "./pages/admin/AlbumFormAdmin";
import ThemeAdmin from "./pages/admin/ThemeAdmin";
import EventAdmin from "./pages/admin/EventAdmin";
import SponsorsAdmin from "./pages/admin/SponsorsAdmin";
import SponsorFormAdmin from "./pages/admin/SponsorFormAdmin";
import HonorsAdmin from "./pages/admin/HonorsAdmin";
import HonorFormAdmin from "./pages/admin/HonorFormAdmin";
import NotFoundAdmin from "./pages/admin/NotFoundAdmin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider>
        <ModeProvider>
          <TooltipProvider>
            <DynamicFavicon />
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
                <Route path="/gallery" element={<GalleryPage />} />
                <Route path="/gallery/albums/:id" element={<AlbumDetails />} />
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
                      <Route path="fixtures/new/bulk" element={<FixtureBulkFormAdmin />} />
                      <Route path="fixtures/import" element={<FixtureImportAdmin />} />
                      <Route path="fixtures/:id" element={<FixtureDetailsAdmin />} />
                      <Route path="fixtures/:id/edit" element={<FixtureFormAdmin />} />
                      <Route path="users" element={<UsersAdmin />} />
                      <Route path="venues" element={<VenuesAdmin />} />
                      <Route path="venues/new" element={<VenueFormAdmin />} />
                      <Route path="venues/:id/edit" element={<VenueFormAdmin />} />
                      <Route path="competitions" element={<CompetitionsAdmin />} />
                      <Route path="competitions/new" element={<CompetitionFormAdmin />} />
                      <Route path="competitions/:id/edit" element={<CompetitionFormAdmin />} />
                      <Route path="seasons" element={<SeasonsAdmin />} />
                      <Route path="seasons/new" element={<SeasonFormAdmin />} />
                      <Route path="seasons/:id/edit" element={<SeasonFormAdmin />} />
                      <Route path="articles" element={<ArticlesAdmin />} />
                      <Route path="articles/new" element={<ArticleFormAdmin />} />
                      <Route path="articles/:id/edit" element={<ArticleFormAdmin />} />
                      <Route path="albums" element={<AlbumsAdmin />} />
                      <Route path="albums/new" element={<AlbumFormAdmin />} />
                      <Route path="albums/:id/edit" element={<AlbumFormAdmin />} />
                      <Route path="sponsors" element={<SponsorsAdmin />} />
                      <Route path="sponsors/new" element={<SponsorFormAdmin />} />
                      <Route path="sponsors/:id/edit" element={<SponsorFormAdmin />} />
                      <Route path="honors" element={<HonorsAdmin />} />
                      <Route path="honors/new" element={<HonorFormAdmin />} />
                      <Route path="honors/:id/edit" element={<HonorFormAdmin />} />
                      <Route path="event" element={<EventAdmin />} />
                      <Route path="theme" element={<ThemeAdmin />} />
                      <Route path="*" element={<NotFoundAdmin />} />
                    </Routes>
                  </RequireAuth>
                } />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </ModeProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;