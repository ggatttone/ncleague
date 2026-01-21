import { AdminLayout } from "@/components/admin/AdminLayout";
import { Table } from "@/components/Table";
import { Link } from "react-router-dom";
import { usePlayers, useDeletePlayer } from "@/hooks/use-players";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Plus, Edit, Upload } from "lucide-react";
import { useAdminListPage } from "@/hooks/use-admin-list-page";
import { AdminMobileCard } from "@/components/admin/AdminMobileCard";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { useTranslation } from "react-i18next";
import { Player } from "@/types/database";

const PlayersAdmin = () => {
  const { data: players, isLoading, error } = usePlayers();
  const deletePlayerMutation = useDeletePlayer();
  const { t } = useTranslation();

  const { searchTerm, setSearchTerm, filteredData: filteredPlayers, isMobile } = useAdminListPage<Player & { teams?: { id: string; name: string } }>({
    data: players,
    searchFields: ['first_name', 'last_name', 'teams.name'],
  });

  const handleDeletePlayer = async (playerId: string) => {
    await deletePlayerMutation.mutateAsync(playerId);
  };

  const columns = [
    { key: "name", label: t('pages.admin.players.table.name') },
    { key: "team", label: t('pages.admin.players.table.team') },
    { key: "role", label: t('pages.admin.players.table.role') },
    { key: "actions", label: t('pages.admin.players.table.actions') },
  ];

  const data = filteredPlayers?.map(player => ({
    name: (
      <Link to={`/admin/players/${player.id}`} className="text-primary underline hover:text-primary/80">
        {player.first_name} {player.last_name}
      </Link>
    ),
    team: player.teams ? (
      <Link to={`/admin/teams/${player.teams.id}`} className="underline">
        {player.teams.name}
      </Link>
    ) : "-",
    role: player.role || "-",
    actions: (
      <div className="flex items-center gap-2">
        <Link to={`/admin/players/${player.id}/edit`}>
          <Button variant="ghost" size="sm">
            <Edit className="h-4 w-4" />
          </Button>
        </Link>
        <DeleteConfirmDialog
          title={t('pages.admin.players.deleteDialogTitle')}
          description={t('pages.admin.players.deleteDialogDescription', { playerName: `${player.first_name} ${player.last_name}` })}
          onConfirm={() => handleDeletePlayer(player.id)}
          isPending={deletePlayerMutation.isPending}
        />
      </div>
    ),
  })) || [];

  if (error) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{t('pages.admin.players.errorLoading')}</p>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      </AdminLayout>
    );
  }

  const renderMobileList = () => (
    <div className="space-y-4">
      {filteredPlayers?.map(player => (
        <AdminMobileCard
          key={player.id}
          title={<Link to={`/admin/players/${player.id}`} className="hover:underline">{player.first_name} {player.last_name}</Link>}
          subtitle={player.teams?.name || t('pages.admin.players.mobile.noTeam')}
          actions={
            <>
              <Link to={`/admin/players/${player.id}/edit`}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Edit className="h-4 w-4" />
                </Button>
              </Link>
              <DeleteConfirmDialog
                title={t('pages.admin.players.deleteDialogTitle')}
                description={t('pages.admin.players.deleteDialogDescription', { playerName: `${player.first_name} ${player.last_name}` })}
                onConfirm={() => handleDeletePlayer(player.id)}
                isPending={deletePlayerMutation.isPending}
                triggerSize="icon"
              />
            </>
          }
        >
          <div className="mt-2 text-sm">
            <span className="font-semibold text-muted-foreground">{t('pages.admin.players.mobile.roleLabel')}:</span> {player.role || "-"}
          </div>
        </AdminMobileCard>
      ))}
    </div>
  );

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">{t('pages.admin.players.title')}</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Link to="/admin/players/import" className="w-full">
            <Button variant="outline" className="w-full">
              <Upload className="mr-2 h-4 w-4" />
              {t('pages.admin.players.importButton')}
            </Button>
          </Link>
          <Link to="/admin/players/new" className="w-full">
            <Button className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              {t('pages.admin.players.newPlayerButton')}
            </Button>
          </Link>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={t('pages.admin.players.searchPlaceholder')}
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
          {filteredPlayers && filteredPlayers.length > 0 && (
            <div className="mb-4 text-sm text-muted-foreground">
              {t('pages.admin.players.playersFound', { count: filteredPlayers.length })}
              {searchTerm && ` per "${searchTerm}"`}
            </div>
          )}
          {isMobile ? renderMobileList() : <Table columns={columns} data={data} />}
        </>
      )}
    </AdminLayout>
  );
};

export default PlayersAdmin;
