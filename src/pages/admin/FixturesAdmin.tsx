import { AdminLayout } from "@/components/admin/AdminLayout";
import { Table } from "@/components/Table";
import { Link } from "react-router-dom";
import { useMatches, useDeleteMatch, useUpdateMultipleMatches, useDeleteMultipleMatches } from "@/hooks/use-matches";
import { useCompetitions } from "@/hooks/use-competitions";
import { useSeasons } from "@/hooks/use-seasons";
import { useVenues } from "@/hooks/use-venues";
import { useTeams } from "@/hooks/use-teams";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Plus, Edit, Trash2, Upload, ChevronDown } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { BulkEditDialog } from "@/components/admin/BulkEditDialog";
import { showSuccess } from "@/utils/toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { AdminMobileCard } from "@/components/admin/AdminMobileCard";
import { useTranslation } from "react-i18next";

const FixturesAdmin = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMatches, setSelectedMatches] = useState<string[]>([]);
  const [dialogState, setDialogState] = useState<{ open: boolean; type: 'status' | 'competition' | 'season' | 'venue' | 'referee' | null }>({ open: false, type: null });
  const isMobile = useIsMobile();
  const { t } = useTranslation();

  const { data: matches, isLoading, error } = useMatches();
  const { data: competitions } = useCompetitions();
  const { data: seasons } = useSeasons();
  const { data: venues } = useVenues();
  const { data: teams } = useTeams();

  const deleteMatchMutation = useDeleteMatch();
  const updateMultipleMutation = useUpdateMultipleMatches();
  const deleteMultipleMutation = useDeleteMultipleMatches();

  const filteredMatches = useMemo(() => {
    if (!matches || !searchTerm) return matches;
    
    return matches.filter(match => 
      match.home_teams.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.away_teams.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.venues?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [matches, searchTerm]);

  const isAllSelected = filteredMatches && selectedMatches.length === filteredMatches.length && filteredMatches.length > 0;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMatches(filteredMatches?.map(m => m.id) || []);
    } else {
      setSelectedMatches([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedMatches(prev => [...prev, id]);
    } else {
      setSelectedMatches(prev => prev.filter(matchId => matchId !== id));
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    await deleteMatchMutation.mutateAsync(matchId);
  };

  const handleBulkUpdate = (value: string) => {
    if (!dialogState.type) return;

    const key = dialogState.type === 'status' ? 'status' : `${dialogState.type}_id`;
    const updates = { [key]: value };

    updateMultipleMutation.mutate({ ids: selectedMatches, updates }, {
        onSuccess: () => {
            showSuccess('Partite aggiornate con successo!');
            setSelectedMatches([]);
            setDialogState({ open: false, type: null });
        }
    });
  };

  const handleBulkDelete = () => {
    deleteMultipleMutation.mutate(selectedMatches, {
        onSuccess: () => {
            showSuccess('Partite eliminate con successo!');
            setSelectedMatches([]);
        }
    });
  };

  const getStatusBadge = (status: string) => {
    const statusKey = `matchStatus.${status}`;
    const statusText = t(statusKey, { defaultValue: status });
    switch (status) {
      case 'scheduled': return <Badge variant="outline">{statusText}</Badge>;
      case 'ongoing': return <Badge variant="default" className="bg-green-600">{statusText}</Badge>;
      case 'completed': return <Badge variant="secondary">{statusText}</Badge>;
      case 'postponed': return <Badge variant="destructive">{statusText}</Badge>;
      case 'cancelled': return <Badge variant="destructive">{statusText}</Badge>;
      default: return <Badge variant="outline">{statusText}</Badge>;
    }
  };

  const columns = [
    { 
      key: "select", 
      label: <Checkbox checked={isAllSelected} onCheckedChange={(checked) => handleSelectAll(checked as boolean)} aria-label="Select all" />
    },
    { key: "match", label: t('pages.admin.fixtures.table.match') },
    { key: "date", label: t('pages.admin.fixtures.table.date') },
    { key: "status", label: t('pages.admin.fixtures.table.status') },
    { key: "actions", label: t('pages.admin.fixtures.table.actions') },
  ];

  const data = filteredMatches?.map(match => ({
    select: <Checkbox checked={selectedMatches.includes(match.id)} onCheckedChange={(checked) => handleSelectRow(match.id, checked as boolean)} aria-label={`Select match ${match.id}`} />,
    match: <Link to={`/admin/fixtures/${match.id}`} className="text-primary underline hover:text-primary/80">{match.home_teams.name} vs {match.away_teams.name}</Link>,
    date: format(new Date(match.match_date), "dd/MM/yyyy HH:mm", { locale: it }),
    status: getStatusBadge(match.status),
    actions: (
      <div className="flex items-center gap-2">
        <Link to={`/admin/fixtures/${match.id}/edit`}><Button variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button></Link>
        <AlertDialog>
          <AlertDialogTrigger asChild><Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>{t('pages.admin.fixtures.deleteDialogTitle')}</AlertDialogTitle><AlertDialogDescription>{t('pages.admin.fixtures.deleteDialogDescription', { matchName: `${match.home_teams.name} vs ${match.away_teams.name}` })}</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annulla</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleDeleteMatch(match.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteMatchMutation.isPending}>
                {deleteMatchMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Elimina
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    ),
  })) || [];

  const statusOptions = [
    { value: 'scheduled', label: t('matchStatus.scheduled') }, { value: 'ongoing', label: t('matchStatus.ongoing') }, { value: 'completed', label: t('matchStatus.completed') }, { value: 'postponed', label: t('matchStatus.postponed') }, { value: 'cancelled', label: t('matchStatus.cancelled') },
  ];
  const competitionOptions = competitions?.map(c => ({ value: c.id, label: c.name })) || [];
  const seasonOptions = seasons?.map(s => ({ value: s.id, label: s.name })) || [];
  const venueOptions = venues?.map(v => ({ value: v.id, label: v.name })) || [];
  const refereeOptions = teams?.map(t => ({ value: t.id, label: t.name })) || [];

  const dialogConfig = {
    status: { title: t('pages.admin.fixtures.bulkEdit.statusTitle'), description: t('pages.admin.fixtures.bulkEdit.statusDescription', { count: selectedMatches.length }), label: t('pages.admin.fixtures.bulkEdit.statusLabel'), options: statusOptions },
    competition: { title: t('pages.admin.fixtures.bulkEdit.competitionTitle'), description: t('pages.admin.fixtures.bulkEdit.competitionDescription', { count: selectedMatches.length }), label: t('pages.admin.fixtures.bulkEdit.competitionLabel'), options: competitionOptions },
    season: { title: t('pages.admin.fixtures.bulkEdit.seasonTitle'), description: t('pages.admin.fixtures.bulkEdit.seasonDescription', { count: selectedMatches.length }), label: t('pages.admin.fixtures.bulkEdit.seasonLabel'), options: seasonOptions },
    venue: { title: t('pages.admin.fixtures.bulkEdit.venueTitle'), description: t('pages.admin.fixtures.bulkEdit.venueDescription', { count: selectedMatches.length }), label: t('pages.admin.fixtures.bulkEdit.venueLabel'), options: venueOptions },
    referee: { title: t('pages.admin.fixtures.bulkEdit.refereeTitle'), description: t('pages.admin.fixtures.bulkEdit.refereeDescription', { count: selectedMatches.length }), label: t('pages.admin.fixtures.bulkEdit.refereeLabel'), options: refereeOptions },
  };
  const currentDialog = dialogState.type ? dialogConfig[dialogState.type] : null;

  if (error) return <AdminLayout><div className="text-center py-12"><p className="text-red-600 mb-4">Errore nel caricamento delle partite</p><p className="text-muted-foreground">{error.message}</p></div></AdminLayout>;

  const renderMobileList = () => (
    <div className="space-y-4">
      {filteredMatches?.map(match => {
        const actions = (
          <>
            <Link to={`/admin/fixtures/${match.id}/edit`}><Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button></Link>
            <AlertDialog>
              <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>{t('pages.admin.fixtures.deleteDialogTitle')}</AlertDialogTitle><AlertDialogDescription>{t('pages.admin.fixtures.deleteDialogDescription', { matchName: `${match.home_teams.name} vs ${match.away_teams.name}` })}</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annulla</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDeleteMatch(match.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteMatchMutation.isPending}>
                    {deleteMatchMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Elimina
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        );
        return (
          <AdminMobileCard
            key={match.id}
            title={<Link to={`/admin/fixtures/${match.id}`} className="hover:underline">{match.home_teams.name} vs {match.away_teams.name}</Link>}
            subtitle={format(new Date(match.match_date), "dd/MM/yyyy HH:mm", { locale: it })}
            actions={actions}
          >
            <div className="mt-2">{getStatusBadge(match.status)}</div>
          </AdminMobileCard>
        );
      })}
    </div>
  );

  return (
    <AdminLayout>
      <AlertDialog>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold">{t('pages.admin.fixtures.title')}</h1>
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <Link to="/admin/fixtures/import" className="w-full"><Button variant="outline" className="w-full"><Upload className="mr-2 h-4 w-4" />{t('pages.admin.fixtures.importButton')}</Button></Link>
            <Link to="/admin/fixtures/new/bulk" className="w-full"><Button variant="outline" className="w-full"><Plus className="mr-2 h-4 w-4" />{t('pages.admin.fixtures.newBulkButton')}</Button></Link>
            <Link to="/admin/fixtures/new" className="w-full"><Button className="w-full"><Plus className="mr-2 h-4 w-4" />{t('pages.admin.fixtures.newMatchButton')}</Button></Link>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input placeholder={t('pages.admin.fixtures.searchPlaceholder')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
        </div>

        {selectedMatches.length > 0 && !isMobile && (
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg mb-6">
            <div className="text-sm font-medium">{t('pages.admin.fixtures.matchesFound', { count: selectedMatches.length })}</div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="outline" size="sm">{t('pages.admin.fixtures.bulkActions')} <ChevronDown className="ml-2 h-4 w-4" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setDialogState({ open: true, type: 'status' })}>{t('pages.admin.fixtures.editStatus')}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDialogState({ open: true, type: 'competition' })}>{t('pages.admin.fixtures.assignCompetition')}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDialogState({ open: true, type: 'season' })}>{t('pages.admin.fixtures.assignSeason')}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDialogState({ open: true, type: 'venue' })}>{t('pages.admin.fixtures.assignVenue')}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDialogState({ open: true, type: 'referee' })}>{t('pages.admin.fixtures.assignReferee')}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <AlertDialogTrigger asChild><DropdownMenuItem className="text-destructive focus:text-destructive">{t('pages.admin.fixtures.deleteSelected')}</DropdownMenuItem></AlertDialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {isLoading ? <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div> : (
          isMobile ? renderMobileList() : <Table columns={columns} data={data} />
        )}

        <BulkEditDialog
          open={dialogState.open && !!currentDialog}
          onOpenChange={(open) => setDialogState({ ...dialogState, open })}
          title={currentDialog?.title || ''}
          description={currentDialog?.description || ''}
          label={currentDialog?.label || ''}
          options={currentDialog?.options || []}
          isPending={updateMultipleMutation.isPending}
          onConfirm={handleBulkUpdate}
        />
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{t('pages.admin.fixtures.deleteSelectedDialogTitle')}</AlertDialogTitle><AlertDialogDescription>{t('pages.admin.fixtures.deleteSelectedDialogDescription', { count: selectedMatches.length })}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteMultipleMutation.isPending}>
              {deleteMultipleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default FixturesAdmin;