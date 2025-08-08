import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/supabase/auth-context";
import { RequireAuth } from "@/components/auth/RequireAuth";
import Login from "./pages/auth/Login";
// ... altri import

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