import { AdminLayout } from "@/components/admin/AdminLayout";
import { Table } from "@/components/Table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTeams, useDeleteTeam } from "@/hooks/use-teams";
import { Link } from "react-router-dom";
import { Search, Loader2, Plus, Edit } from "lucide-react";
import { useAdminListPage } from "@/hooks/use-admin-list-page";
import { AdminMobileCard } from "@/components/admin/AdminMobileCard";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { useTranslation } from "react-i18next";
import { Team } from "@/types/database";

const TeamsAdmin = () => {
  const { data: teams, isLoading, error } = useTeams();
  const deleteTeamMutation = useDeleteTeam();
  const { t } = useTranslation();

  const { searchTerm, setSearchTerm, filteredData: filteredTeams, isMobile } = useAdminListPage<Team & { venues?: { name: string } }>({
    data: teams,
    searchFields: ['name', 'parish', 'venues.name'],
  });

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
        <DeleteConfirmDialog
          title={t('pages.admin.teams.deleteDialogTitle')}
          description={t('pages.admin.teams.deleteDialogDescription', { teamName: team.name })}
          onConfirm={() => handleDeleteTeam(team.id)}
          isPending={deleteTeamMutation.isPending}
        />
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
      {filteredTeams?.map(team => (
        <AdminMobileCard
          key={team.id}
          title={<Link to={`/admin/teams/${team.id}`} className="hover:underline">{team.name}</Link>}
          subtitle={team.parish || "Nessuna parrocchia"}
          actions={
            <>
              <Link to={`/admin/teams/${team.id}/edit`}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Edit className="h-4 w-4" />
                </Button>
              </Link>
              <DeleteConfirmDialog
                title={t('pages.admin.teams.deleteDialogTitle')}
                description={t('pages.admin.teams.deleteDialogDescription', { teamName: team.name })}
                onConfirm={() => handleDeleteTeam(team.id)}
                isPending={deleteTeamMutation.isPending}
                triggerSize="icon"
              />
            </>
          }
        >
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-sm">
            <div className="font-semibold text-muted-foreground">{t('pages.admin.teams.table.venue')}:</div>
            <div>{team.venues?.name || "-"}</div>
            <div className="font-semibold text-muted-foreground">{t('pages.admin.teams.table.colors')}:</div>
            <div>{team.colors || "-"}</div>
          </div>
        </AdminMobileCard>
      ))}
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
