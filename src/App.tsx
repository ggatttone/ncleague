import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/supabase/auth-context";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ModeProvider } from "@/components/theme/ModeProvider";
import { DynamicFavicon } from "@/components/theme/DynamicFavicon";
import { DynamicTitle } from "@/components/theme/DynamicTitle";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { Navbar } from "@/components/Navbar";
import { PageLoader } from "@/components/PageLoader";

// Lazy load all page components
const Login = lazy(() => import("./pages/auth/Login"));
const ProfilePage = lazy(() => import("./pages/auth/Profile"));
const Index = lazy(() => import("./pages/Index"));
const Matches = lazy(() => import("./pages/Matches"));
const MatchDetails = lazy(() => import("./pages/MatchDetails"));
const Tables = lazy(() => import("./pages/Tables"));
const Playoffs = lazy(() => import("./pages/Playoffs"));
const Statistics = lazy(() => import("./pages/Statistics"));
const News = lazy(() => import("./pages/News"));
const NewsDetails = lazy(() => import("./pages/NewsDetails"));
const Players = lazy(() => import("./pages/Players"));
const PlayerDetails = lazy(() => import("./pages/PlayerDetails"));
const Teams = lazy(() => import("./pages/Teams"));
const TeamDetails = lazy(() => import("./pages/TeamDetails"));
const GalleryPage = lazy(() => import("./pages/Gallery"));
const AlbumDetails = lazy(() => import("./pages/AlbumDetails"));
const SeasonArchive = lazy(() => import("./pages/SeasonArchive"));
const AdminIndex = lazy(() => import("./pages/admin/AdminIndex"));
const TeamsAdmin = lazy(() => import("./pages/admin/TeamsAdmin"));
const TeamFormAdmin = lazy(() => import("./pages/admin/TeamFormAdmin"));
const TeamDetailsAdmin = lazy(() => import("./pages/admin/TeamDetailsAdmin"));
const PlayersAdmin = lazy(() => import("./pages/admin/PlayersAdmin"));
const PlayerFormAdmin = lazy(() => import("./pages/admin/PlayerFormAdmin"));
const PlayerDetailsAdmin = lazy(() => import("./pages/admin/PlayerDetailsAdmin"));
const PlayerImportAdmin = lazy(() => import("./pages/admin/PlayerImportAdmin"));
const FixturesAdmin = lazy(() => import("./pages/admin/FixturesAdmin"));
const FixtureFormAdmin = lazy(() => import("./pages/admin/FixtureFormAdmin"));
const FixtureDetailsAdmin = lazy(() => import("./pages/admin/FixtureDetailsAdmin"));
const FixtureBulkFormAdmin = lazy(() => import("./pages/admin/FixtureBulkFormAdmin"));
const FixtureImportAdmin = lazy(() => import("./pages/admin/FixtureImportAdmin"));
const UsersAdmin = lazy(() => import("./pages/admin/UsersAdmin"));
const VenuesAdmin = lazy(() => import("./pages/admin/VenuesAdmin"));
const VenueFormAdmin = lazy(() => import("./pages/admin/VenueFormAdmin"));
const CompetitionsAdmin = lazy(() => import("./pages/admin/CompetitionsAdmin"));
const CompetitionFormAdmin = lazy(() => import("./pages/admin/CompetitionFormAdmin"));
const SeasonsAdmin = lazy(() => import("./pages/admin/SeasonsAdmin"));
const SeasonFormAdmin = lazy(() => import("./pages/admin/SeasonFormAdmin"));
const ArticlesAdmin = lazy(() => import("./pages/admin/ArticlesAdmin"));
const ArticleFormAdmin = lazy(() => import("./pages/admin/ArticleFormAdmin"));
const AlbumsAdmin = lazy(() => import("./pages/admin/AlbumsAdmin"));
const AlbumFormAdmin = lazy(() => import("./pages/admin/AlbumFormAdmin"));
const ThemeAdmin = lazy(() => import("./pages/admin/ThemeAdmin"));
const EventAdmin = lazy(() => import("./pages/admin/EventAdmin"));
const SponsorsAdmin = lazy(() => import("./pages/admin/SponsorsAdmin"));
const SponsorFormAdmin = lazy(() => import("./pages/admin/SponsorFormAdmin"));
const HonorsAdmin = lazy(() => import("./pages/admin/HonorsAdmin"));
const HonorFormAdmin = lazy(() => import("./pages/admin/HonorFormAdmin"));
const HomepageAdmin = lazy(() => import("./pages/admin/HomepageAdmin"));
const NotFoundAdmin = lazy(() => import("./pages/admin/NotFoundAdmin"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider>
        <ModeProvider>
          <TooltipProvider>
            <DynamicFavicon />
            <DynamicTitle />
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Navbar />
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/matches" element={<Matches />} />
                  <Route path="/matches/:id" element={<MatchDetails />} />
                  <Route path="/tables" element={<Tables />} />
                  <Route path="/playoffs" element={<Playoffs />} />
                  <Route path="/playoffs/:competitionId/:seasonId" element={<Playoffs />} />
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
                        <Route path="players/import" element={<PlayerImportAdmin />} />
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
                        <Route path="homepage" element={<HomepageAdmin />} />
                        <Route path="theme" element={<ThemeAdmin />} />
                        <Route path="*" element={<NotFoundAdmin />} />
                      </Routes>
                    </RequireAuth>
                  } />
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </ModeProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;