import { AdminLayout } from "@/components/admin/AdminLayout";
import { Table } from "@/components/Table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTeams, useDeleteTeam } from "@/hooks/use-teams";
import { Link } from "react-router-dom";
import { useState, useMemo } from "react";
import { Search, Loader2, Plus, Edit, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { AdminMobileCard } from "@/components/admin/AdminMobileCard";
import { useTranslation } from "react-i18next";

const TeamsAdmin = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: teams, isLoading, error } = useTeams();
  const deleteTeamMutation = useDeleteTeam();
  const isMobile = useIsMobile();
  const { t } = useTranslation();

  const filteredTeams = useMemo(() => {
    if (!teams || !searchTerm) return teams;
    
    return teams.filter(team => 
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.parish?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.venues?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [teams, searchTerm]);

  const handleDeleteTeam = async (teamId: string) => {
    await deleteTeamMutation.mutateAsync(teamId);
  };

  const columns = [
    { key: "name", label: t('pages.admin.teams.table.name') },
    { key: "parish", label: t('pages.admin.teams.table.parish') },
    { key: "venue", label: t('pages.admin.teams.table.venue') },
    { key: "colors", label: t('pages.admin.teams.table.colors') },
    { key: "actions", label: t('pages.admin.teams.table.actions') },
  ];

  const data = filteredTeams?.map(team => ({
    name: (
      <Link to={`/admin/teams/${team.id}`} className="text-primary underline hover:text-primary/80">
        {team.name}
      </Link>
    ),
    parish: team.parish || "-",
    venue: team.venues?.name || "-",
    colors: team.colors || "-",
    actions: (
      <div className="flex items-center gap-2">
        <Link to={`/admin/teams/${team.id}/edit`}>
          <Button variant="ghost" size="sm">
            <Edit className="h-4 w-4" />
          </Button>
        </Link>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('pages.admin.teams.deleteDialogTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('pages.admin.teams.deleteDialogDescription', { teamName: team.name })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('pages.admin.teams.cancelButton')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDeleteTeam(team.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleteTeamMutation.isPending}
              >
                {deleteTeamMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('pages.admin.teams.deleteButton')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    ),
  })) || [];

  if (error) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{t('pages.admin.teams.errorLoading')}</p>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      </AdminLayout>
    );
  }

  const renderMobileList = () => (
    <div className="space-y-4">
      {filteredTeams?.map(team => {
        const actions = (
          <>
            <Link to={`/admin/teams/${team.id}/edit`}>
              <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
            </Link>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('pages.admin.teams.deleteDialogTitle')}</AlertDialogTitle>
                  <AlertDialogDescription>{t('pages.admin.teams.deleteDialogDescription', { teamName: team.name })}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('pages.admin.teams.cancelButton')}</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDeleteTeam(team.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteTeamMutation.isPending}>
                    {deleteTeamMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {t('pages.admin.teams.deleteButton')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        );
        return (
          <AdminMobileCard
            key={team.id}
            title={<Link to={`/admin/teams/${team.id}`} className="hover:underline">{team.name}</Link>}
            subtitle={team.parish || "Nessuna parrocchia"}
            actions={actions}
          >
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-sm">
              <div className="font-semibold text-muted-foreground">{t('pages.admin.teams.table.venue')}:</div>
              <div>{team.venues?.name || "-"}</div>
              <div className="font-semibold text-muted-foreground">{t('pages.admin.teams.table.colors')}:</div>
              <div>{team.colors || "-"}</div>
            </div>
          </AdminMobileCard>
        );
      })}
    </div>
  );

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">{t('pages.admin.teams.title')}</h1>
        <Link to="/admin/teams/new">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            {t('pages.admin.teams.newTeam')}
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={t('pages.admin.teams.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
          {filteredTeams && filteredTeams.length > 0 && (
            <div className="mb-4 text-sm text-muted-foreground">
              {t('pages.admin.teams.teamsFound', { count: filteredTeams.length })}
              {searchTerm && ` per "${searchTerm}"`}
            </div>
          )}
          {isMobile ? renderMobileList() : <Table columns={columns} data={data} />}
        </>
      )}
    </AdminLayout>
  );
};

export default TeamsAdmin;