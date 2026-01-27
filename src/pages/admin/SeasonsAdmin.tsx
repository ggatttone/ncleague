import { AdminLayout } from "@/components/admin/AdminLayout";
import { Table } from "@/components/Table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useSeasons, useDeleteSeason } from "@/hooks/use-seasons";
import { DraftsList } from "@/components/admin/season-wizard";
import { Link, useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import {
  Search, Loader2, Plus, Edit, Trash2, MoreHorizontal,
  Calendar, LayoutDashboard,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { AdminMobileCard } from "@/components/admin/AdminMobileCard";
import { useTranslation } from "react-i18next";
import type { Season } from "@/types/database";

function getSeasonStatus(season: Season): { label: string; variant: "default" | "secondary" | "destructive" | "outline" } {
  const now = new Date();
  const start = season.start_date ? new Date(season.start_date) : null;
  const end = season.end_date ? new Date(season.end_date) : null;

  if (!start || !end) return { label: "Bozza", variant: "outline" };
  if (now > end) return { label: "Completata", variant: "secondary" };
  if (now >= start && now <= end) return { label: "In corso", variant: "default" };
  return { label: "Da schedulare", variant: "outline" };
}

const SeasonsAdmin = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const { data: seasons, isLoading, error } = useSeasons();
  const deleteSeasonMutation = useDeleteSeason();
  const isMobile = useIsMobile();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const filteredSeasons = useMemo(() => {
    if (!seasons || !searchTerm) return seasons;
    return seasons.filter(season =>
      season.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [seasons, searchTerm]);

  const handleDelete = async (id: string) => {
    await deleteSeasonMutation.mutateAsync(id);
    setDeleteTarget(null);
  };

  const columns = [
    { key: "name", label: t('pages.admin.seasons.table.name') },
    { key: "status", label: "Stato" },
    { key: "start_date", label: t('pages.admin.seasons.table.startDate') },
    { key: "end_date", label: t('pages.admin.seasons.table.endDate') },
    { key: "actions", label: t('pages.admin.seasons.table.actions') },
  ];

  const renderActions = (season: Season) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => navigate(`/admin/schedule-generator?season=${season.id}`)}>
          <Calendar className="mr-2 h-4 w-4" />
          Genera Calendario
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate(`/admin/tournament-dashboard?season=${season.id}`)}>
          <LayoutDashboard className="mr-2 h-4 w-4" />
          Dashboard Torneo
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate(`/admin/seasons/${season.id}/edit`)}>
          <Edit className="mr-2 h-4 w-4" />
          Modifica
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => setDeleteTarget({ id: season.id, name: season.name })}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Elimina
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const renderStatusBadge = (season: Season) => {
    const { label, variant } = getSeasonStatus(season);
    return <Badge variant={variant}>{label}</Badge>;
  };

  const data = filteredSeasons?.map(season => ({
    name: season.name,
    status: renderStatusBadge(season),
    start_date: season.start_date ? new Date(season.start_date).toLocaleDateString('it-IT') : "-",
    end_date: season.end_date ? new Date(season.end_date).toLocaleDateString('it-IT') : "-",
    actions: renderActions(season),
  })) || [];

  if (error) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{t('pages.admin.seasons.errorLoading')}</p>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      </AdminLayout>
    );
  }

  const renderMobileList = () => (
    <div className="space-y-4">
      {filteredSeasons?.map(season => {
        const { label } = getSeasonStatus(season);
        const subtitle = (season.start_date && season.end_date)
          ? `${new Date(season.start_date).toLocaleDateString('it-IT')} - ${new Date(season.end_date).toLocaleDateString('it-IT')}`
          : "Date non specificate";
        return (
          <AdminMobileCard
            key={season.id}
            title={
              <div className="flex items-center gap-2">
                {season.name}
                {renderStatusBadge(season)}
              </div>
            }
            subtitle={subtitle}
            actions={renderActions(season)}
          />
        );
      })}
    </div>
  );

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">{t('pages.admin.seasons.title')}</h1>
        <Link to="/admin/seasons/wizard">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            {t('pages.admin.seasons.newSeason')}
          </Button>
        </Link>
      </div>

      {/* Pending Drafts Section */}
      <DraftsList />

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={t('pages.admin.seasons.searchPlaceholder')}
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
        isMobile ? renderMobileList() : <Table columns={columns} data={data} />
      )}

      {/* Shared Delete Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('pages.admin.seasons.deleteDialogTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('pages.admin.seasons.deleteDialogDescription', { name: deleteTarget?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDelete(deleteTarget.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteSeasonMutation.isPending}
            >
              {deleteSeasonMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default SeasonsAdmin;
