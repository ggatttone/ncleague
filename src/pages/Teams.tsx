import { useSupabaseQuery } from "@/hooks/use-supabase-query";
import { supabase } from "@/lib/supabase/client";
import { Team } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Users, Plus, Settings, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/supabase/auth-context";
import { useTranslation } from "react-i18next";
import { useState, useMemo } from "react";
import { TeamCardSkeleton } from "@/components/skeletons";
import { EmptyState } from "@/components/EmptyState";

const Teams = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const { data: teams, isLoading, error } = useSupabaseQuery<Team[]>(
    ['teams'],
    async () => supabase.from('teams').select('*, venues(name)').order('name')
  );

  const filteredTeams = useMemo(() => {
    if (!teams || !searchTerm) return teams;
    const lower = searchTerm.toLowerCase();
    return teams.filter(t =>
      t.name.toLowerCase().includes(lower) ||
      (t.parish ?? '').toLowerCase().includes(lower)
    );
  }, [teams, searchTerm]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <h1 className="text-2xl md:text-3xl font-bold">{t('pages.teams.title')}</h1>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <TeamCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <h1 className="text-2xl md:text-3xl font-bold">{t('pages.teams.title')}</h1>
        </div>
        <div className="text-center py-12 bg-destructive/10 text-destructive rounded-lg">
          <p className="font-semibold mb-2">{t('errors.loadingTeams')}</p>
          <p className="text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">{t('pages.teams.title')}</h1>
        {user && (
          <div className="flex flex-col sm:flex-row gap-2">
            <Link to="/admin/teams/new">
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                {t('pages.teams.newTeam')}
              </Button>
            </Link>
            <Link to="/admin/teams">
              <Button variant="outline" size="sm">
                <Settings className="mr-2 h-4 w-4" />
                {t('pages.teams.manage')}
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={t('pages.teams.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {!filteredTeams || filteredTeams.length === 0 ? (
        searchTerm ? (
          <EmptyState
            icon={Search}
            title={t('pages.teams.noTeamsForSearch')}
            subtitle={t('pages.teams.noTeamsForSearchSubtitle')}
          />
        ) : (
          <EmptyState
            icon={Users}
            title={t('pages.teams.noTeamsFound')}
            subtitle={t('pages.teams.noTeamsFoundSubtitle')}
            action={user ? { label: t('pages.teams.addFirstTeam'), to: '/admin/teams/new', icon: Plus } : undefined}
          />
        )
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {teams.map((team) => (
            <div key={team.id}>
              <Link to={`/teams/${team.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      {team.logo_url ? (
                        <img
                          src={team.logo_url}
                          alt={`${team.name} logo`}
                          loading="lazy"
                          className="w-12 h-12 rounded-full object-cover border"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-6 w-6 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{team.name}</CardTitle>
                        {team.parish && (
                          <p className="text-sm text-muted-foreground truncate">{team.parish}</p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {team.venues?.name && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{team.venues.name}</span>
                        </div>
                      )}
                      {team.colors && (
                        <Badge variant="secondary" className="text-xs">
                          {team.colors}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Teams;
