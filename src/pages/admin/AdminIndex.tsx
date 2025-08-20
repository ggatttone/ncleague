import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSupabaseQuery } from "@/hooks/use-supabase-query";
import { supabase } from "@/lib/supabase/client";
import { Link } from "react-router-dom";
import { Loader2, Users, Shield, Calendar, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface DashboardStats {
  teamsCount: number | null;
  playersCount: number | null;
  matchesCount: number | null;
  usersCount: number | null;
}

const AdminIndex = () => {
  const { t } = useTranslation();
  const { data, isLoading } = useSupabaseQuery<DashboardStats>(
    ['admin-dashboard-stats'],
    async () => {
      const [
        { count: teamsCount, error: teamsError },
        { count: playersCount, error: playersError },
        { count: matchesCount, error: matchesError },
        { count: usersCount, error: usersError }
      ] = await Promise.all([
        supabase.from('teams').select('*', { count: 'exact', head: true }),
        supabase.from('players').select('*', { count: 'exact', head: true }),
        supabase.from('matches').select('*', { count: 'exact', head: true }).eq('status', 'scheduled'),
        supabase.from('profiles').select('*', { count: 'exact', head: true })
      ]);

      if (teamsError) throw teamsError;
      if (playersError) throw playersError;
      if (matchesError) throw matchesError;
      if (usersError) throw usersError;

      return { data: { teamsCount, playersCount, matchesCount, usersCount }, error: null };
    }
  );

  const stats = [
    {
      title: t('pages.admin.index.teams'),
      count: data?.teamsCount,
      icon: <Shield className="h-6 w-6 text-muted-foreground" />,
      link: "/admin/teams",
      linkText: t('pages.admin.index.manageTeams')
    },
    {
      title: t('pages.admin.index.players'),
      count: data?.playersCount,
      icon: <Users className="h-6 w-6 text-muted-foreground" />,
      link: "/admin/players",
      linkText: t('pages.admin.index.managePlayers')
    },
    {
      title: t('pages.admin.index.scheduledMatches'),
      count: data?.matchesCount,
      icon: <Calendar className="h-6 w-6 text-muted-foreground" />,
      link: "/admin/fixtures",
      linkText: t('pages.admin.index.manageFixtures')
    },
    {
      title: t('pages.admin.index.registeredUsers'),
      count: data?.usersCount,
      icon: <UserCog className="h-6 w-6 text-muted-foreground" />,
      link: "/admin/users",
      linkText: t('pages.admin.index.manageUsers')
    }
  ];

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-6">{t('pages.admin.index.title')}</h1>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  {stat.icon}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.count ?? '...'}</div>
                  <Link to={stat.link} className="text-xs text-muted-foreground hover:underline">
                    {stat.linkText}
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle>{t('pages.admin.index.quickActions')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link to="/admin/teams/new">
                  <Button className="w-full">{t('pages.admin.index.newTeam')}</Button>
                </Link>
                <Link to="/admin/players/new">
                  <Button className="w-full">{t('pages.admin.index.newPlayer')}</Button>
                </Link>
                <Link to="/admin/fixtures/new">
                  <Button className="w-full">{t('pages.admin.index.newMatch')}</Button>
                </Link>
                <Link to="/admin/articles/new">
                  <Button className="w-full">{t('pages.admin.index.newArticle')}</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </AdminLayout>
  );
};

export default AdminIndex;